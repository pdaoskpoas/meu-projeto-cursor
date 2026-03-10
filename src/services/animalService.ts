import { supabase } from '@/lib/supabase'
import { handleSupabaseError, logSupabaseOperation } from '@/lib/supabase-helpers'
import type { Animal, AnimalInsert, AnimalWithStats, SearchAnimalsResult } from '@/types/supabase'
import { normalizeNameForStorage } from '@/utils/nameFormat'

export interface AnimalFilters {
  search?: string
  breed?: string
  state?: string
  city?: string
  gender?: 'Macho' | 'Fêmea'
  propertyType?: 'haras' | 'fazenda' | 'cte' | 'central-reproducao'
  category?: 'Garanhão' | 'Castrado' | 'Doadora' | 'Matriz' | 'Potro' | 'Potra' | 'Outro'  // Filtro por categoria
  orderBy?: 'ranking' | 'recent' | 'most_viewed'
  limit?: number
  offset?: number
}

class AnimalService {
  // ============================
  // Regras de plano e anúncios individuais
  // ============================

  /**
   * Retorna limite de anúncios ATIVOS SIMULTANEAMENTE por plano
   * IMPORTANTE: Limite NÃO é cumulativo (não soma entre meses)
   * Anúncios individuais pagos NÃO contam neste limite
   */
  /**
   * Busca perfil do usuário com campos de boost
   * Usado apenas por boostAnimal() para verificar créditos
   */
  private async getUserProfileForBoost(userId: string) {
    console.log('[AnimalService] 🔍 Buscando perfil com créditos de boost:', userId);
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, plan, plan_boost_credits, purchased_boost_credits')
        .eq('id', userId)
        .single()
      
      if (error) {
        console.error('[AnimalService] ❌ Erro ao buscar perfil:', error);
        throw handleSupabaseError(error);
      }
      
      console.log('[AnimalService] ✅ Créditos:', {
        plan: data.plan_boost_credits || 0,
        purchased: data.purchased_boost_credits || 0
      });
      return data;
    } catch (error) {
      console.error('[AnimalService] ❌ Erro ao buscar perfil:', error);
      throw error;
    }
  }

  /**
   * Conta anúncios ativos que CONTAM no limite do plano
   * INCLUI: animais próprios ativos + sociedades aceitas (se usuário tem plano ativo)
   * EXCLUI: anúncios individuais pagos (is_individual_paid = true)
   */
  private async countActiveAnimals(userId: string): Promise<number> {
    const startTime = Date.now();
    try {
      console.log('[AnimalService] 🔍 Contando animais ativos para user:', userId);
      console.log('[AnimalService] 📞 Iniciando query do Supabase para animals...');
      
      // Contar animais próprios ativos (excluindo individuais pagos)
      const { count, error } = await supabase
        .from('animals')
        .select('id', { count: 'exact', head: true })
        .eq('owner_id', userId)
        .eq('ad_status', 'active')
        .or('is_individual_paid.is.null,is_individual_paid.eq.false')
      
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`[AnimalService] ⏱️ Query animals completada em ${elapsed}s`);
      
      if (error) {
        console.error('[AnimalService] ❌ Erro ao contar animais:', error);
        throw handleSupabaseError(error);
      }
      
      console.log('[AnimalService] ✅ Animais ativos contados:', count);
      return count ?? 0;
    } catch (error) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
      console.error(`[AnimalService] ❌ Erro na contagem após ${elapsed}s:`, error);
      // Em caso de erro, retornar 0 para não bloquear o fluxo
      return 0;
    }
  }

  private async hasValidIndividualAd(animalId: string, userId: string): Promise<boolean> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const { data, error } = await supabase
      .from('transactions')
      .select('id')
      .eq('user_id', userId)
      .eq('type', 'individual_ad')
      .eq('status', 'completed')
      .gte('created_at', thirtyDaysAgo)
      .filter('metadata->>animal_id', 'eq', animalId)
      .limit(1)
    if (error) throw handleSupabaseError(error)
    return !!(data && data.length > 0)
  }

  /**
   * Cria transação de anúncio individual pago (avulso)
   * Marca o animal como individual_paid e define expiração de 30 dias
   */
  async createIndividualAdTransaction(userId: string, animalId: string, amount: number): Promise<void> {
    // 1. Criar transação
    const { error: txError } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        type: 'individual_ad',
        amount,
        currency: 'BRL',
        status: 'completed', // futura integração com Stripe ajustará
        metadata: { animal_id: animalId, months: 1 }
      })
    if (txError) throw handleSupabaseError(txError)

    // 2. Marcar animal como individual_paid e definir expiração (30 dias)
    const now = new Date()
    const expires = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 dias
    
    const { error: updateError } = await supabase
      .from('animals')
      .update({
        is_individual_paid: true,
        individual_paid_expires_at: expires.toISOString(),
        ad_status: 'active', // Garantir que está ativo
        published_at: now.toISOString(),
        expires_at: expires.toISOString()
      })
      .eq('id', animalId)
      .eq('owner_id', userId)
    
    if (updateError) throw handleSupabaseError(updateError)
  }

  private getActivationDates() {
    const now = new Date()
    const expires = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    return { published_at: now.toISOString(), expires_at: expires.toISOString() }
  }

  async canPublishByPlan(userId: string): Promise<{ 
    allowedByPlan: number; 
    active: number; 
    remaining: number; 
    plan: string | null;
    planIsValid: boolean;
    planExpiresAt: string | null;
  }>{
    console.log('[AnimalService] 🚀 Verificando plano (RPC otimizado):', userId);
    const startTime = Date.now();
    
    try {
      const isAuthError = (error: unknown) => {
        const err = error as { status?: number; message?: string };
        const message = err?.message?.toLowerCase() || '';
        return (
          err?.status === 401 ||
          err?.status === 403 ||
          message.includes('jwt') ||
          message.includes('token') ||
          message.includes('not authorized') ||
          message.includes('permission')
        );
      };

      // ✅ UMA query RPC ao invés de 2 sequenciais
      let { data, error } = await supabase
        .rpc('check_user_publish_quota', { p_user_id: userId });
      
      if (error && isAuthError(error)) {
        console.warn('[AnimalService] 🔄 Sessão expirada, tentando renovar...');
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError || !refreshData?.session) {
          throw new Error('Sua sessão expirou. Faça login novamente para continuar.');
        }

        ({ data, error } = await supabase
          .rpc('check_user_publish_quota', { p_user_id: userId }));
      }
      
      if (error) {
        console.error('[AnimalService] ❌ Erro RPC:', error);
        if (isAuthError(error)) {
          throw new Error('Sua sessão expirou. Faça login novamente para continuar.');
        }
        throw handleSupabaseError(error);
      }
      
      // ✅ CRITICAL FIX: RPC retorna objeto aninhado, não direto
      // data = { plan: 'vip', active: 0, ... } não { check_user_publish_quota: {...} }
      // Supabase-js já desembrulha automaticamente para nós
      const result = data || {};
      
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`[AnimalService] ✅ Verificação completada em ${elapsed}s`);
      console.log('[AnimalService] 📊 Resultado RAW:', data);
      console.log('[AnimalService] 📊 Resultado PROCESSADO:', {
        plan: result.plan,
        planIsValid: result.plan_is_valid,
        allowed: result.allowedByPlan,
        active: result.active,
        remaining: result.remaining
      });
      
      return {
        plan: result.plan || 'free',
        planIsValid: result.plan_is_valid || false,
        planExpiresAt: result.plan_expires_at || null,
        allowedByPlan: result.allowedByPlan || 0,
        active: result.active || 0,
        remaining: result.remaining || 0
      };
      
    } catch (error) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
      console.error(`[AnimalService] ❌ Erro após ${elapsed}s:`, error);
      throw error instanceof Error
        ? error
        : new Error('Não foi possível verificar seu plano agora. Tente novamente.');
    }
  }

  // Buscar animais com filtros
  async searchAnimals(filters: AnimalFilters = {}): Promise<SearchAnimalsResult[]> {
    try {
      logSupabaseOperation('Search animals', filters)

      const { data, error } = await supabase
        .rpc('search_animals', {
          search_term: filters.search || null,
          breed_filter: filters.breed || null,
          state_filter: filters.state || null,
          city_filter: filters.city || null,
          gender_filter: filters.gender || null,
          property_type_filter: filters.propertyType || null,
          category_filter: filters.category || null,  // Novo filtro de categoria
          order_by: filters.orderBy || 'ranking',
          limit_count: filters.limit || 20,
          offset_count: filters.offset || 0
        })

      if (error) {
        throw handleSupabaseError(error)
      }

      logSupabaseOperation('Search animals success', { count: data?.length })
      return data as SearchAnimalsResult[]

    } catch (error) {
      logSupabaseOperation('Search animals error', null, error)
      throw error
    }
  }

  // Obter animal por ID
  async getAnimalById(id: string): Promise<AnimalWithStats | null> {
    try {
      logSupabaseOperation('Get animal by ID', { id })

      const { data: animal, error: animalError } = await supabase
        .from('animals')
        .select('*')
        .eq('id', id)
        .single()

      if (animalError) {
        // Fallback: tentar view com stats caso RLS ou políticas bloqueiem
        const fallbackAnimal = await this.getAnimalFromStatsView(id)
        if (fallbackAnimal) {
          return fallbackAnimal
        }
        if (animalError.code === 'PGRST116') {
          return null // Animal não encontrado
        }
        throw handleSupabaseError(animalError)
      }

      const { data: ownerProfile } = await supabase
        .from('profiles')
        .select('name, public_code, account_type, property_name, property_type')
        .eq('id', animal.owner_id)
        .single()

      const [{ count: impressionCount }, { count: clickCount }] = await Promise.all([
        supabase
          .from('impressions')
          .select('id', { count: 'exact', head: true })
          .eq('content_type', 'animal')
          .eq('content_id', id),
        supabase
          .from('clicks')
          .select('id', { count: 'exact', head: true })
          .eq('content_type', 'animal')
          .eq('content_id', id)
      ])

      const impressions = impressionCount ?? 0
      const clicks = clickCount ?? 0
      const clickRate = impressions > 0 ? Number(((clicks / impressions) * 100).toFixed(2)) : 0

      const result = {
        ...animal,
        impression_count: impressions,
        click_count: clicks,
        click_rate: clickRate,
        owner_name: ownerProfile?.name || '',
        owner_public_code: ownerProfile?.public_code || '',
        owner_account_type: ownerProfile?.account_type || '',
        owner_property_name: ownerProfile?.property_name || null,
        owner_property_type: ownerProfile?.property_type || null
      } as AnimalWithStats

      logSupabaseOperation('Get animal success', { id })
      return result

    } catch (error) {
      logSupabaseOperation('Get animal error', null, error)
      throw error
    }
  }

  private async getAnimalFromStatsView(id: string): Promise<AnimalWithStats | null> {
    try {
      const { data, error } = await supabase
        .from('animals_with_stats')
        .select('*')
        .eq('id', id)
        .maybeSingle()

      if (error) {
        return null
      }

      if (!data) {
        return null
      }

      const impressions = data.impressions ?? 0
      const clicks = data.clicks ?? 0
      const clickRate = data.ctr ?? (impressions > 0 ? Number(((clicks / impressions) * 100).toFixed(2)) : 0)

      return {
        ...data,
        impression_count: impressions,
        click_count: clicks,
        click_rate: clickRate,
        owner_name: data.owner_name || '',
        owner_public_code: data.owner_public_code || '',
        owner_account_type: '',
        owner_property_name: data.property_name || null,
        owner_property_type: null
      } as AnimalWithStats
    } catch (error) {
      console.error('Erro ao buscar animal via view:', error)
      return null
    }
  }

  // Obter animais do usuário
  async getUserAnimals(userId: string): Promise<AnimalWithStats[]> {
    try {
      logSupabaseOperation('Get user animals', { userId })

      const { data, error } = await supabase
        .from('animals_with_stats')
        .select('*')
        .eq('owner_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        throw handleSupabaseError(error)
      }

      logSupabaseOperation('Get user animals success', { count: data?.length })
      return data as AnimalWithStats[]

    } catch (error) {
      logSupabaseOperation('Get user animals error', null, error)
      throw error
    }
  }

  // Criar animal - VERSÃO SIMPLIFICADA usando APENAS cliente Supabase
  async createAnimal(animalData: AnimalInsert): Promise<Animal> {
    const TIMEOUT_MS = 20000; // 20 segundos (aumentado para conexões lentas)
    
    try {
      logSupabaseOperation('Create animal', { name: animalData.name })
      const ownerId = animalData.owner_id as string | undefined
      const { published_at, expires_at } = this.getActivationDates()

      // ✅ Determinar status
      let finalStatus: 'active' | 'paused' = 'paused'
      
      if (animalData.ad_status) {
        finalStatus = animalData.ad_status as 'active' | 'paused'
        console.log('✅ [CreateAnimal] ad_status explícito:', finalStatus)
      } else if (ownerId) {
        console.log('🔄 [CreateAnimal] Verificando plano...')
        const planInfo = await this.canPublishByPlan(ownerId)
        finalStatus = (planInfo.planIsValid && planInfo.remaining > 0) ? 'active' : 'paused'
      }

      console.log('🚀 [CreateAnimal] Usando cliente Supabase-JS (WebSocket)');
      console.log('⏱️ [CreateAnimal] Timeout configurado:', TIMEOUT_MS, 'ms');
      const insertStart = Date.now();
      
      // ✅ Preparar dados
      const insertPayload = {
        ...animalData,
        name: normalizeNameForStorage(animalData.name) ?? animalData.name,
        ad_status: finalStatus,
        published_at,
        expires_at
      };

      console.log('📤 [CreateAnimal] Enviando INSERT:', {
        name: insertPayload.name,
        breed: insertPayload.breed,
        owner_id: insertPayload.owner_id,
        share_code: insertPayload.share_code,
        ad_status: insertPayload.ad_status
      });

      // ✅ USAR APENAS CLIENTE SUPABASE (não REST API fetch)
      const insertPromise = supabase
        .from('animals')
        .insert(insertPayload)
        .select()
        .single();

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error('TIMEOUT_ERROR'));
        }, TIMEOUT_MS);
      });

      try {
        const result = await Promise.race([
          insertPromise,
          timeoutPromise
        ]);
        const { data, error } = result as { data: Animal | null; error: Error | null };
        
        const insertTime = Date.now() - insertStart;
        console.log(`⏱️ [CreateAnimal] INSERT completado em ${insertTime}ms`);

        if (error) {
          console.error('❌ [CreateAnimal] Erro no INSERT:', error);
          throw handleSupabaseError(error);
        }

        if (!data) {
          console.error('❌ [CreateAnimal] INSERT não retornou dados!');
          throw new Error('INSERT não retornou dados');
        }

        console.log('✅ [CreateAnimal] Animal criado:', { id: data.id, share_code: data.share_code });
        logSupabaseOperation('Create animal success', { id: data.id })
        return data as Animal
        
      } catch (insertError: unknown) {
        const insertTime = Date.now() - insertStart;
        console.error(`❌ [CreateAnimal] Erro após ${insertTime}ms:`, insertError);
        
        // Se for timeout
        if (insertError.message === 'TIMEOUT_ERROR') {
          console.error('🔴 [TIMEOUT] Conexão muito lenta ou bloqueada!');
          throw new Error(
            'Sua conexão está muito lenta ou sendo bloqueada. ' +
            'Por favor: 1) Desative temporariamente firewall/antivírus 2) Tente usar cabo ethernet 3) Teste em outro navegador'
          );
        }
        
        throw insertError;
      }

    } catch (error) {
      logSupabaseOperation('Create animal error', null, error)
      throw error
    }
  }

  // Criar animal + titulos em transacao (RPC opcional)
  async createAnimalWithTitlesTx(
    animalData: AnimalInsert,
    titlesData: Array<Record<string, unknown>>
  ): Promise<{ animal: Animal; titlesSaved: boolean }> {
    try {
      const { data, error } = await supabase.rpc('create_animal_tx', {
        animal_payload: animalData,
        titles_payload: titlesData
      });

      if (error) {
        throw handleSupabaseError(error);
      }

      const result = Array.isArray(data) ? data[0] : data;
      if (!result?.id) {
        throw new Error('RPC create_animal_tx não retornou dados válidos');
      }

      return {
        animal: result as Animal,
        titlesSaved: titlesData.length > 0
      };
    } catch (error) {
      logSupabaseOperation('Create animal tx error', null, error);
      throw error;
    }
  }

  // Atualizar animal
  async updateAnimal(id: string, updates: Partial<AnimalInsert>): Promise<Animal> {
    try {
      logSupabaseOperation('Update animal', { id })

      const normalizedUpdates = { ...updates };
      if (typeof updates.name === 'string') {
        normalizedUpdates.name = normalizeNameForStorage(updates.name) ?? updates.name;
      }

      const { data, error } = await supabase
        .from('animals')
        .update(normalizedUpdates)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        throw handleSupabaseError(error)
      }

      logSupabaseOperation('Update animal success', { id })
      return data as Animal

    } catch (error) {
      logSupabaseOperation('Update animal error', null, error)
      throw error
    }
  }

  // (duplicated getUserAnimals removed; using animals_with_stats version above)

  // Atualizar apenas as imagens do animal
  async updateAnimalImages(id: string, imageUrls: string[]): Promise<void> {
    try {
      logSupabaseOperation('Update animal images', { id, imageCount: imageUrls.length })

      const { error } = await supabase
        .from('animals')
        .update({ images: imageUrls })
        .eq('id', id)

      if (error) {
        throw handleSupabaseError(error)
      }

      logSupabaseOperation('Update animal images success', { id })

    } catch (error) {
      logSupabaseOperation('Update animal images error', null, error)
      throw error
    }
  }

  // Deletar animal
  async deleteAnimal(id: string): Promise<void> {
    try {
      logSupabaseOperation('Delete animal', { id })

      const { error } = await supabase
        .from('animals')
        .delete()
        .eq('id', id)

      if (error) {
        throw handleSupabaseError(error)
      }

      logSupabaseOperation('Delete animal success', { id })

    } catch (error) {
      logSupabaseOperation('Delete animal error', null, error)
      throw error
    }
  }

  // Obter animais em destaque com ROTAÇÃO EQUITATIVA
  // ✅ Garante que todos os anúncios impulsionados sejam exibidos igualmente
  // ✅ Sistema de rotação: se há 20 anúncios, mostra 10 de cada vez alternando
  async getFeaturedAnimals(limit: number = 10): Promise<AnimalWithStats[]> {
    try {
      logSupabaseOperation('Get featured animals with rotation', { limit })

      // Usar função SQL com rotação automática
      const { data, error } = await supabase
        .rpc('get_featured_animals_rotated_fast', { p_limit: limit })

      if (error) {
        throw handleSupabaseError(error)
      }

      logSupabaseOperation('Get featured animals success', { count: data?.length })
      return data as AnimalWithStats[]

    } catch (error) {
      logSupabaseOperation('Get featured animals error', null, error)
      
      // FALLBACK: Se a função não existir ainda, usar método antigo
      console.warn('Função de rotação não encontrada, usando fallback')
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('animals_with_stats')
        .select('*')
        .eq('is_boosted', true)
        .eq('ad_status', 'active')
        .gt('boost_expires_at', new Date().toISOString())
        .order('boosted_at', { ascending: false })
        .limit(limit)

      if (fallbackError) throw handleSupabaseError(fallbackError)
      return fallbackData as AnimalWithStats[]
    }
  }

  // Obter animais mais visualizados
  async getMostViewedAnimals(limit: number = 10): Promise<AnimalWithStats[]> {
    try {
      logSupabaseOperation('Get most viewed animals', { limit })

      const { data, error } = await supabase
        .from('animals_with_stats')
        .select('*')
        .eq('ad_status', 'active')
        .order('click_count', { ascending: false })
        .limit(limit)

      if (error) {
        throw handleSupabaseError(error)
      }

      logSupabaseOperation('Get most viewed animals success', { count: data?.length })
      return data as AnimalWithStats[]

    } catch (error) {
      logSupabaseOperation('Get most viewed animals error', null, error)
      throw error
    }
  }

  // Obter animais recém-publicados
  async getRecentAnimals(limit: number = 10): Promise<AnimalWithStats[]> {
    try {
      logSupabaseOperation('Get recent animals', { limit })

      const { data, error } = await supabase
        .from('animals_with_stats')
        .select('*')
        .eq('ad_status', 'active')
        .order('published_at', { ascending: false })
        .limit(limit)

      if (error) {
        throw handleSupabaseError(error)
      }

      logSupabaseOperation('Get recent animals success', { count: data?.length })
      return data as AnimalWithStats[]

    } catch (error) {
      logSupabaseOperation('Get recent animals error', null, error)
      throw error
    }
  }

  // Impulsionar animal
  async boostAnimal(animalId: string, userId: string, duration: number = 24): Promise<void> {
    try {
      logSupabaseOperation('Boost animal', { animalId, userId, duration })
      // Verificar saldos de boost (plano prioritário, depois comprados)
      const profile = await this.getUserProfileForBoost(userId)
      const planCredits = profile.plan_boost_credits ?? 0
      const purchasedCredits = profile.purchased_boost_credits ?? 0
      if (planCredits <= 0 && purchasedCredits <= 0) {
        throw new Error('Sem créditos de impulsionar disponíveis')
      }
      const usePlanBoost = planCredits > 0

      // Atualizar animal
      const { error: updateError } = await supabase
        .from('animals')
        .update({
          is_boosted: true,
          boost_expires_at: new Date(Date.now() + duration * 60 * 60 * 1000).toISOString(),
          boosted_by: userId,
          boosted_at: new Date().toISOString(),
          can_edit: false
        })
        .eq('id', animalId)

      if (updateError) {
        throw handleSupabaseError(updateError)
      }

      // Registrar no histórico
      const { error: historyError } = await supabase
        .from('boost_history')
        .insert({
          content_type: 'animal',
          content_id: animalId,
          user_id: userId,
          boost_type: usePlanBoost ? 'plan_included' : 'purchased',
          duration_hours: duration,
          cost: 0
        })

      if (historyError) {
        throw handleSupabaseError(historyError)
      }

      // Debitar créditos
      if (usePlanBoost) {
        const { error: decPlanErr } = await supabase
          .from('profiles')
          .update({
            plan_boost_credits: (profile.plan_boost_credits ?? 0) - 1,
            available_boosts: ((profile.plan_boost_credits ?? 0) - 1) + (profile.purchased_boost_credits ?? 0)
          })
          .eq('id', userId)
        if (decPlanErr) throw handleSupabaseError(decPlanErr)
      } else {
        const { error: decPurchasedErr } = await supabase
          .from('profiles')
          .update({
            purchased_boost_credits: (profile.purchased_boost_credits ?? 0) - 1,
            available_boosts: (profile.plan_boost_credits ?? 0) + ((profile.purchased_boost_credits ?? 0) - 1)
          })
          .eq('id', userId)
        if (decPurchasedErr) throw handleSupabaseError(decPurchasedErr)
      }

      logSupabaseOperation('Boost animal success', { animalId })

    } catch (error) {
      logSupabaseOperation('Boost animal error', null, error)
      throw error
    }
  }

  // Comprar créditos de impulsionar (simulado: marca transação completed)
  async buyBoosts(userId: string, quantity: number, amountBRL: number): Promise<void> {
    const { error } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        type: 'boost_purchase',
        amount: amountBRL,
        currency: 'BRL',
        status: 'completed',
        boost_quantity: quantity
      })
    if (error) throw handleSupabaseError(error)
    // Trigger no DB somará purchased_boost_credits
  }

  // Conceder boosts mensais acumulativos (executa função no DB)
  async runMonthlyGrants(): Promise<void> {
    const { error } = await supabase.rpc('grant_monthly_boosts')
    if (error) throw handleSupabaseError(error)
  }

  // Ao trocar para free, zera créditos do plano e mantém os comprados
  async onPlanChangeToFree(userId: string): Promise<void> {
    const { error } = await supabase.rpc('zero_plan_boosts_on_free', { user_uuid: userId })
    if (error) throw handleSupabaseError(error)
  }

  // Verificar se usuário pode editar animal
  async canEditAnimal(animalId: string, userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('animals')
        .select('owner_id, can_edit, published_at')
        .eq('id', animalId)
        .single()

      if (error || !data) {
        return false
      }

      // Verificar se é o proprietário
      if (data.owner_id !== userId) {
        return false
      }

      // Verificar se pode editar
      if (!data.can_edit) {
        return false
      }

      // Verificar se passou das 24h
      const publishedAt = new Date(data.published_at)
      const now = new Date()
      const hoursDiff = (now.getTime() - publishedAt.getTime()) / (1000 * 60 * 60)

      if (hoursDiff > 24) {
        // Atualizar can_edit para false
        await supabase
          .from('animals')
          .update({ can_edit: false })
          .eq('id', animalId)
        
        return false
      }

      return true

    } catch (error) {
      logSupabaseOperation('Can edit animal error', null, error)
      return false
    }
  }

  // Publicar/ativar animal respeitando cota do plano OU anúncio individual válido
  async publishAnimal(animalId: string, userId: string, skipPlanCheck: boolean = false): Promise<'active' | 'paused'> {
    console.log('[AnimalService] 📢 Publicando animal:', animalId, 'skipPlanCheck:', skipPlanCheck);
    const { published_at, expires_at } = this.getActivationDates()
    
    let newStatus: 'active' | 'paused' = 'paused'
    
    if (skipPlanCheck) {
      // Quando skipPlanCheck = true, assumir que o usuário TEM cota (já verificado antes)
      console.log('[AnimalService] ⚡ Pulando verificação de plano (já verificado)');
      newStatus = 'active'
    } else {
      // Verificação completa (usado em renovações e outros fluxos)
      console.log('[AnimalService] 🔍 Verificando plano...');
      const planInfo = await this.canPublishByPlan(userId)
      if (planInfo.planIsValid && planInfo.remaining > 0) {
        newStatus = 'active'
      } else {
        const hasIndividual = await this.hasValidIndividualAd(animalId, userId)
        newStatus = hasIndividual ? 'active' : 'paused'
      }
    }
    
    console.log('[AnimalService] 📝 Status final:', newStatus);
    const { error } = await supabase
      .from('animals')
      .update({ ad_status: newStatus, published_at, expires_at })
      .eq('id', animalId)
    if (error) throw handleSupabaseError(error)
    return newStatus
  }

  // Pausar manualmente
  async pauseAnimal(animalId: string): Promise<void> {
    const { error } = await supabase
      .from('animals')
      .update({ ad_status: 'paused' })
      .eq('id', animalId)
    if (error) throw handleSupabaseError(error)
  }

  // Renovar animal individualmente (após pagamento)
  async renewAnimalIndividually(animalId: string, userId: string): Promise<boolean> {
    try {
      logSupabaseOperation('Renew animal individually', { animalId, userId })

      const { data, error } = await supabase
        .rpc('renew_animal_individually', {
          animal_id_param: animalId,
          user_id_param: userId
        })

      if (error) {
        throw handleSupabaseError(error)
      }

      logSupabaseOperation('Renew animal individually success', { animalId, success: data })
      return data as boolean

    } catch (error) {
      logSupabaseOperation('Renew animal individually error', null, error)
      throw error
    }
  }
}

export const animalService = new AnimalService()
