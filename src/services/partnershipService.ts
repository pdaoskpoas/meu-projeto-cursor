import { supabase } from '@/lib/supabase'
import { handleSupabaseError, logSupabaseOperation } from '@/lib/supabase-helpers'

/**
 * Partnership (Sociedade) - Sistema de Convites
 * 
 * Sistema de sociedades com fluxo de aprovação:
 * - Proprietário envia convite (status: 'pending')
 * - Sócio aceita ou rejeita o convite
 * - Apenas sociedades 'accepted' são ativas
 */
export interface Partnership {
  id: string
  animal_id: string
  animal_name?: string
  partner_id: string
  partner_name?: string
  partner_property_name?: string
  partner_public_code?: string
  percentage: number
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
  updated_at: string
  joined_at?: string
  added_by?: string
}

export interface AnimalPartner {
  partner_id: string
  partner_name: string
  partner_property_name: string
  partner_public_code: string
  partner_account_type: string
  percentage: number
  has_active_plan: boolean
  avatar_url?: string
}

interface UserAnimalsCacheEntry {
  data: Record<string, unknown>[]
  timestamp: number
}

const USER_ANIMALS_CACHE_TTL_MS = 2 * 60 * 1000 // 2 minutos - reduz chamadas duplicadas entre páginas
const userAnimalsCache = new Map<string, UserAnimalsCacheEntry>()
const userAnimalsInFlight = new Map<string, Promise<Record<string, unknown>[]>>()

class PartnershipService {
  /**
   * Enviar convite de sociedade para um sócio
   * 
   * Cria uma sociedade com status 'pending' aguardando aprovação do sócio convidado.
   * 
   * @param animalId ID do animal
   * @param partnerPublicCode Código público do parceiro
   * @param percentage Percentual de participação (0-100)
   * @returns Partnership criada com status 'pending'
   */
  async sendPartnershipInvite(
    animalId: string,
    partnerPublicCode: string,
    percentage: number
  ): Promise<Partnership> {
    try {
      logSupabaseOperation('Send partnership invite', { animalId, partnerPublicCode, percentage })

      // Validações
      if (!animalId || !partnerPublicCode) {
        throw new Error('ID do animal e código do parceiro são obrigatórios')
      }

      if (percentage < 0 || percentage > 100) {
        throw new Error('Percentual deve estar entre 0 e 100')
      }

      // Buscar o parceiro pelo código público (view pública - sem PII)
      const { data: partner, error: partnerError } = await supabase
        .from('public_profiles')
        .select('id, name, property_name, public_code')
        .eq('public_code', partnerPublicCode)
        .single()

      if (partnerError || !partner) {
        throw new Error('Parceiro não encontrado com este código público')
      }

      // Verificar se o proprietário não está tentando convidar a si mesmo
      const { data: animal } = await supabase
        .from('animals')
        .select('owner_id, name')
        .eq('id', animalId)
        .single()

      if (animal?.owner_id === partner.id) {
        throw new Error('Você não pode convidar a si mesmo para uma sociedade')
      }

      // Verificar se já existe uma sociedade com este parceiro
      const { data: existing } = await supabase
        .from('animal_partnerships')
        .select('id')
        .eq('animal_id', animalId)
        .eq('partner_id', partner.id)
        .single()

      if (existing) {
        throw new Error(`Já existe uma sociedade com este parceiro`)
      }

      // Verificar limite de sócios (máximo 10)
      const { count: partnersCount } = await supabase
        .from('animal_partnerships')
        .select('*', { count: 'exact', head: true })
        .eq('animal_id', animalId)

      if (partnersCount && partnersCount >= 10) {
        throw new Error('Este animal já atingiu o limite máximo de 10 sócios')
      }

      // Criar a sociedade com status 'pending'
      const { data, error } = await supabase
        .from('animal_partnerships')
        .insert({
          animal_id: animalId,
          partner_id: partner.id,
          partner_haras_name: partner.property_name || partner.name,
          percentage,
          status: 'pending', // Aguardando aprovação do sócio
          animal_owner_id: animal?.owner_id,
          added_by: animal?.owner_id
        })
        .select()
        .single()

      if (error) {
        throw handleSupabaseError(error)
      }

      logSupabaseOperation('Send partnership invite success', { id: data.id })
      
      // Criar notificação para o parceiro convidado
      try {
        await supabase.from('notifications').insert({
          user_id: partner.id,
          type: 'partnership_invite',
          title: 'Convite de Sociedade',
          message: `Você recebeu um convite para ser sócio do animal "${animal?.name}".`,
          action_url: '/dashboard/society',
          metadata: {
            animal_id: animalId,
            animal_name: animal?.name,
            partnership_id: data.id,
            percentage
          },
          related_content_type: 'partnership',
          related_content_id: data.id
        })
      } catch (notifError) {
        // Não bloquear a sociedade se notificações falharem
        console.error('Erro ao criar notificação:', notifError)
      }
      
      // Retornar com todas as informações
      return {
        ...data,
        animal_name: animal?.name,
        partner_name: partner.name
      } as Partnership

    } catch (error) {
      logSupabaseOperation('Send partnership invite error', null, error)
      throw error
    }
  }

  /**
   * Aceitar convite de sociedade
   * 
   * Muda o status da sociedade de 'pending' para 'accepted'.
   * Cria notificação para o proprietário informando a aceitação.
   * 
   * @param partnershipId ID da sociedade
   * @param userId ID do usuário que está aceitando (deve ser o partner_id)
   */
  async acceptPartnership(partnershipId: string, userId: string): Promise<void> {
    try {
      logSupabaseOperation('Accept partnership', { partnershipId, userId })

      // Buscar a sociedade com informações do animal
      const { data: partnership, error: checkError } = await supabase
        .from('animal_partnerships')
        .select(`
          *,
          animals (
            id,
            name,
            owner_id
          )
        `)
        .eq('id', partnershipId)
        .single()

      if (checkError || !partnership) {
        throw new Error('Sociedade não encontrada')
      }

      if (partnership.partner_id !== userId) {
        throw new Error('Você não tem permissão para aceitar esta sociedade')
      }

      if (partnership.status === 'accepted') {
        throw new Error('Esta sociedade já foi aceita')
      }

      if (partnership.status === 'rejected') {
        throw new Error('Esta sociedade foi rejeitada')
      }

      // Atualizar status para 'accepted' e definir joined_at
      const { error } = await supabase
        .from('animal_partnerships')
        .update({
          status: 'accepted',
          joined_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', partnershipId)

      if (error) {
        throw handleSupabaseError(error)
      }

      // Criar notificação para o proprietário
      try {
        await supabase.from('notifications').insert({
          user_id: partnership.animals.owner_id,
          type: 'partnership_accepted',
          title: 'Convite Aceito',
          message: `O convite de sociedade para o animal "${partnership.animals.name}" foi aceito!`,
          action_url: `/animal/${partnership.animals.id}`,
          metadata: {
            animal_id: partnership.animals.id,
            partnership_id: partnershipId,
            partner_id: userId
          },
          related_content_type: 'partnership',
          related_content_id: partnershipId
        })
      } catch (notifError) {
        console.error('Erro ao criar notificação:', notifError)
      }

      logSupabaseOperation('Accept partnership success', { partnershipId })

    } catch (error) {
      logSupabaseOperation('Accept partnership error', null, error)
      throw error
    }
  }

  /**
   * Rejeitar/Remover sociedade
   * 
   * Remove uma sociedade existente. Pode ser usada tanto pelo sócio (para recusar)
   * quanto pelo proprietário (para remover um sócio).
   * 
   * @param partnershipId ID da sociedade
   * @param userId ID do usuário que está rejeitando/removendo
   */
  async rejectPartnership(partnershipId: string, userId: string): Promise<void> {
    try {
      logSupabaseOperation('Reject/Remove partnership', { partnershipId, userId })

      // Verificar se o usuário é o parceiro ou o dono do animal
      const { data: partnership, error: checkError } = await supabase
        .from('animal_partnerships')
        .select(`
          partner_id,
          animals (
            owner_id
          )
        `)
        .eq('id', partnershipId)
        .single()

      if (checkError || !partnership) {
        throw new Error('Sociedade não encontrada')
      }

      const isPartner = partnership.partner_id === userId
      const isOwner = partnership.animals?.owner_id === userId

      if (!isPartner && !isOwner) {
        throw new Error('Você não tem permissão para remover esta sociedade')
      }

      // Remover a sociedade
      const { error } = await supabase
        .from('animal_partnerships')
        .delete()
        .eq('id', partnershipId)

      if (error) {
        throw handleSupabaseError(error)
      }

      logSupabaseOperation('Reject/Remove partnership success', { partnershipId, action: isPartner ? 'rejected' : 'removed' })

    } catch (error) {
      logSupabaseOperation('Reject/Remove partnership error', null, error)
      throw error
    }
  }

  /**
   * Buscar sociedades do usuário (convites recebidos e enviados)
   * 
   * Retorna convites pendentes e sociedades aceitas separadamente.
   * 
   * @param userId ID do usuário
   * @returns Objeto com arrays 'received' (onde o usuário é sócio) e 'sent' (onde o usuário é proprietário)
   */
  async getUserPartnerships(userId: string): Promise<{
    received: Partnership[]
    sent: Partnership[]
  }> {
    try {
      logSupabaseOperation('Get user partnerships', { userId })

      // Sociedades onde o usuário é sócio (partner_id)
      // Inclui pending e accepted
      const { data: received, error: receivedError } = await supabase
        .from('animal_partnerships')
        .select(`
          *,
          animals (
            id,
            name,
            owner_id,
            profiles:owner_id (
              name,
              property_name,
              public_code
            )
          )
        `)
        .eq('partner_id', userId)
        .in('status', ['pending', 'accepted'])
        .order('created_at', { ascending: false })

      if (receivedError) {
        throw handleSupabaseError(receivedError)
      }

      // Sociedades onde o usuário é proprietário do animal
      const { data: sent, error: sentError } = await supabase
        .from('animal_partnerships')
        .select(`
          *,
          animals!inner (
            id,
            name,
            owner_id
          ),
          profiles:partner_id (
            name,
            property_name,
            public_code
          )
        `)
        .eq('animals.owner_id', userId)
        .in('status', ['pending', 'accepted'])
        .order('created_at', { ascending: false })

      if (sentError) {
        throw handleSupabaseError(sentError)
      }

      // Formatar os dados
      interface PartnershipData {
        [key: string]: unknown;
      }
      const formattedReceived = (received || []).map((p: PartnershipData) => ({
        ...p,
        animal_name: p.animals?.name,
        owner_name: p.animals?.profiles?.property_name || p.animals?.profiles?.name,
        owner_public_code: p.animals?.profiles?.public_code
      }))

      const formattedSent = (sent || []).map((p: PartnershipData) => ({
        ...p,
        animal_name: p.animals?.name,
        partner_name: p.profiles?.property_name || p.profiles?.name
      }))

      logSupabaseOperation('Get user partnerships success', {
        receivedCount: formattedReceived.length,
        sentCount: formattedSent.length
      })

      return {
        received: formattedReceived,
        sent: formattedSent
      }

    } catch (error) {
      logSupabaseOperation('Get user partnerships error', null, error)
      throw error
    }
  }

  /**
   * Buscar sócios de um animal
   * 
   * Retorna apenas sócios com status 'accepted' e que tenham plano ativo.
   * 
   * @param animalId ID do animal
   * @returns Array de sócios com informações completas
   */
  async getAnimalPartners(animalId: string): Promise<AnimalPartner[]> {
    try {
      logSupabaseOperation('Get animal partners', { animalId })

      const { data, error } = await supabase
        .rpc('get_animal_partners_public', { animal_id_param: animalId });

      if (error) {
        throw handleSupabaseError(error)
      }

      const partners = (data || []).map((p: Record<string, unknown>) => ({
        partner_id: p.partner_id as string,
        partner_name: p.partner_name as string,
        partner_property_name: (p.partner_property_name as string) || (p.partner_name as string),
        partner_public_code: p.partner_public_code as string,
        partner_account_type: p.partner_account_type as string,
        percentage: p.percentage as number,
        has_active_plan: true,
        avatar_url: p.avatar_url as string
      }))

      logSupabaseOperation('Get animal partners success', { count: partners.length })

      return partners

    } catch (error) {
      logSupabaseOperation('Get animal partners error', null, error)
      throw error
    }
  }

  /**
   * Remover sociedade (apenas o proprietário do animal)
   * 
   * Remove um sócio de um animal. Apenas o proprietário do animal tem permissão.
   * 
   * @param partnershipId ID da sociedade
   * @param userId ID do usuário (deve ser o proprietário do animal)
   * @throws Error se o usuário não for o proprietário
   */
  async removePartnership(partnershipId: string, userId: string): Promise<void> {
    try {
      logSupabaseOperation('Remove partnership', { partnershipId, userId })

      // Verificar se o usuário é o dono do animal
      const { data: partnership, error: checkError } = await supabase
        .from('animal_partnerships')
        .select(`
          id,
          animals (
            owner_id
          )
        `)
        .eq('id', partnershipId)
        .single()

      if (checkError || !partnership) {
        throw new Error('Sociedade não encontrada')
      }

      if (partnership.animals.owner_id !== userId) {
        throw new Error('Apenas o proprietário do animal pode remover sócios')
      }

      // Deletar a sociedade
      const { error } = await supabase
        .from('animal_partnerships')
        .delete()
        .eq('id', partnershipId)

      if (error) {
        throw handleSupabaseError(error)
      }

      logSupabaseOperation('Remove partnership success', { partnershipId })

    } catch (error) {
      logSupabaseOperation('Remove partnership error', null, error)
      throw error
    }
  }

  /**
   * Sair de uma sociedade (o sócio remove a si mesmo)
   * 
   * Permite que um sócio saia voluntariamente de uma sociedade.
   * 
   * @param partnershipId ID da sociedade
   * @param userId ID do usuário (deve ser o sócio/partner_id)
   * @throws Error se o usuário não for o sócio
   */
  async leavePartnership(partnershipId: string, userId: string): Promise<void> {
    try {
      logSupabaseOperation('Leave partnership', { partnershipId, userId })

      // Verificar se o usuário é o sócio
      const { data: partnership, error: checkError } = await supabase
        .from('animal_partnerships')
        .select('id, partner_id')
        .eq('id', partnershipId)
        .single()

      if (checkError || !partnership) {
        throw new Error('Sociedade não encontrada')
      }

      if (partnership.partner_id !== userId) {
        throw new Error('Você não é sócio deste animal')
      }

      // Deletar a sociedade
      const { error } = await supabase
        .from('animal_partnerships')
        .delete()
        .eq('id', partnershipId)

      if (error) {
        throw handleSupabaseError(error)
      }

      logSupabaseOperation('Leave partnership success', { partnershipId })

    } catch (error) {
      logSupabaseOperation('Leave partnership error', null, error)
      throw error
    }
  }

  /**
   * Buscar animais do usuário considerando sociedades
   * 
   * Retorna:
   * - Animais próprios do usuário (sempre)
   * - Animais em que o usuário é sócio (apenas se tiver plano ativo)
   * 
   * @param userId ID do usuário
   * @returns Array de animais com flags 'is_partnership' e 'has_active_partnerships'
   */
  async getUserAnimalsWithPartnerships(userId: string): Promise<Record<string, unknown>[]> {
    const cached = userAnimalsCache.get(userId)
    if (cached && Date.now() - cached.timestamp < USER_ANIMALS_CACHE_TTL_MS) {
      return cached.data
    }

    const inFlight = userAnimalsInFlight.get(userId)
    if (inFlight) {
      return inFlight
    }

    const request = (async () => {
    try {
      logSupabaseOperation('Get user animals with partnerships', { userId })

      // Buscar animais próprios
      const { data: ownAnimals, error: ownError } = await supabase
        .from('animals_with_stats')
        .select('*')
        .eq('owner_id', userId)
        .order('created_at', { ascending: false })

      if (ownError) {
        throw handleSupabaseError(ownError)
      }

      // Buscar perfil do usuário
      const { data: profile } = await supabase
        .from('profiles')
        .select('plan, plan_expires_at')
        .eq('id', userId)
        .single()

      // Verificar se tem plano ativo
      const hasActivePlan = profile?.plan && 
                           profile.plan !== 'free' && 
                           (!profile.plan_expires_at || new Date(profile.plan_expires_at) > new Date())

      let partnerAnimals = []

      // Se tem plano ativo, buscar animais em sociedade ACEITAS
      if (hasActivePlan) {
        const { data: partnerships, error: partError } = await supabase
          .from('animal_partnerships')
          .select(`
            id,
            animal_id,
            percentage,
            animals_with_stats (*)
          `)
          .eq('partner_id', userId)
          .eq('status', 'accepted') // Apenas sociedades aceitas

        if (!partError && partnerships) {
          partnerAnimals = partnerships
            .filter(p => p.animals_with_stats) // Filtrar animais que existem
            .map(p => ({
              ...p.animals_with_stats,
              is_partnership: true,
              my_percentage: p.percentage,
              partnership_id: p.id
            }))
        }
      }

      const ownAnimalIds = (ownAnimals || []).map(animal => animal.id)
      const { data: ownAnimalPartnerships } = ownAnimalIds.length > 0
        ? await supabase
            .from('animal_partnerships')
            .select('animal_id')
            .in('animal_id', ownAnimalIds)
        : { data: [] }

      const partnershipAnimalIds = new Set(
        (ownAnimalPartnerships || []).map(partnership => partnership.animal_id)
      )

      const ownAnimalsWithPartnershipFlag = (ownAnimals || []).map(animal => ({
        ...animal,
        is_partnership: false,
        has_active_partnerships: partnershipAnimalIds.has(animal.id)
      }))

      const allAnimals = [
        ...ownAnimalsWithPartnershipFlag,
        ...partnerAnimals.map(a => ({ ...a, has_active_partnerships: true }))
      ]

      logSupabaseOperation('Get user animals with partnerships success', {
        ownCount: ownAnimals?.length || 0,
        partnerCount: partnerAnimals.length,
        total: allAnimals.length
      })

      userAnimalsCache.set(userId, {
        data: allAnimals,
        timestamp: Date.now()
      })

      return allAnimals

    } catch (error) {
      logSupabaseOperation('Get user animals with partnerships error', null, error)
      throw error
    } finally {
      userAnimalsInFlight.delete(userId)
    }
    })()

    userAnimalsInFlight.set(userId, request)
    return request
  }

  /**
   * Buscar sócios de um animal (para proprietário/admin)
   * Retorna todos os sócios com status accepted.
   */
  async getAnimalPartnersForOwner(animalId: string) {
    try {
      const { data, error } = await supabase
        .from('animal_partnerships')
        .select(`
          id,
          partner_id,
          percentage,
          profiles:partner_id (
            id,
            name,
            property_name,
            public_code,
            account_type
          )
        `)
        .eq('animal_id', animalId)
        .eq('status', 'accepted');

      if (error) throw handleSupabaseError(error);

      return (data || []).map((p) => ({
        id: p.id,
        partner_id: p.partner_id,
        percentage: p.percentage,
        partner_name: p.profiles?.property_name || p.profiles?.name,
        partner_public_code: p.profiles?.public_code,
        partner_account_type: p.profiles?.account_type
      }));
    } catch (error) {
      logSupabaseOperation('Get animal partners (owner) error', null, error);
      throw error;
    }
  }

  /**
   * Transferir animal para outro sócio (mantém sociedades existentes)
   * Remove a sociedade do novo dono (vira owner).
   */
  async transferAnimalOwnership(animalId: string, newOwnerId: string) {
    try {
      const { data: profile, error: profileError } = await supabase
        .from('public_profiles')
        .select('property_name, account_type')
        .eq('id', newOwnerId)
        .single();
      if (profileError) throw handleSupabaseError(profileError);

      const harasId = profile?.account_type === 'institutional' ? newOwnerId : null;
      const harasName = profile?.property_name || null;

      const { error: updateAnimalError } = await supabase
        .from('animals')
        .update({
          owner_id: newOwnerId,
          haras_id: harasId,
          haras_name: harasName,
          updated_at: new Date().toISOString()
        })
        .eq('id', animalId);
      if (updateAnimalError) throw handleSupabaseError(updateAnimalError);

      await supabase
        .from('animal_partnerships')
        .update({ animal_owner_id: newOwnerId })
        .eq('animal_id', animalId);

      await supabase
        .from('animal_partnerships')
        .delete()
        .eq('animal_id', animalId)
        .eq('partner_id', newOwnerId);

      logSupabaseOperation('Transfer animal ownership success', { animalId, newOwnerId });
    } catch (error) {
      logSupabaseOperation('Transfer animal ownership error', null, error);
      throw error;
    }
  }

  /**
   * Atualizar porcentagem de um sócio
   * 
   * Permite que o proprietário do animal altere a porcentagem de participação de um sócio.
   * 
   * @param partnershipId ID da sociedade
   * @param newPercentage Nova porcentagem (0-100)
   * @param userId ID do usuário (deve ser o proprietário do animal)
   */
  async updatePartnershipPercentage(
    partnershipId: string,
    newPercentage: number,
    userId: string
  ): Promise<void> {
    try {
      logSupabaseOperation('Update partnership percentage', { partnershipId, newPercentage, userId })

      // Validar porcentagem
      if (newPercentage < 0 || newPercentage > 100) {
        throw new Error('Percentual deve estar entre 0 e 100')
      }

      // Verificar se o usuário é o proprietário do animal
      const { data: partnership, error: checkError } = await supabase
        .from('animal_partnerships')
        .select(`
          id,
          animals (
            owner_id
          )
        `)
        .eq('id', partnershipId)
        .single()

      if (checkError || !partnership) {
        throw new Error('Sociedade não encontrada')
      }

      if (partnership.animals.owner_id !== userId) {
        throw new Error('Apenas o proprietário do animal pode alterar porcentagens')
      }

      // Atualizar porcentagem
      const { error } = await supabase
        .from('animal_partnerships')
        .update({
          percentage: newPercentage,
          updated_at: new Date().toISOString()
        })
        .eq('id', partnershipId)

      if (error) {
        throw handleSupabaseError(error)
      }

      logSupabaseOperation('Update partnership percentage success', { partnershipId })

    } catch (error) {
      logSupabaseOperation('Update partnership percentage error', null, error)
      throw error
    }
  }

  /**
   * Verificar se um animal tem sociedades ativas (aceitas)
   * 
   * Útil para verificar rapidamente se um animal tem sócios sem carregar
   * todos os dados.
   * 
   * @param animalId ID do animal
   * @returns true se o animal tem pelo menos um sócio com sociedade aceita
   */
  async hasActivePartnerships(animalId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('animal_partnerships')
        .select('id')
        .eq('animal_id', animalId)
        .eq('status', 'accepted')
        .limit(1)

      if (error) {
        console.error('Erro ao verificar sociedades:', error)
        return false
      }

      return data && data.length > 0
    } catch (error) {
      console.error('Erro ao verificar sociedades:', error)
      return false
    }
  }
}

export const partnershipService = new PartnershipService()

