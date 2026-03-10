/**
 * Serviço para gerenciar limites de eventos por plano
 */

import { supabase } from '@/lib/supabase';
import { normalizePlanId } from '@/constants/plans';

export interface EventLimitCheck {
  can_create: boolean;
  reason: string;
  message: string;
  current_count: number;
  event_limit: number;
  publications_used?: number;
  publications_quota?: number;
  publications_available?: number;
  reset_at?: string;
  requires_individual_payment?: boolean;
  can_upgrade?: boolean;
  can_pay_individual?: boolean;
  individual_price?: number;
}


class EventLimitsService {
  /**
   * Verifica se o usuário pode criar um novo evento
   */
  async checkEventLimit(userId: string): Promise<EventLimitCheck> {
    try {
      const { data, error } = await supabase
        .rpc('can_create_event', { user_id: userId });

      if (error) {
        console.error('Erro ao verificar limite de eventos:', error);
        // Fallback se a função não existir ainda
        return this.checkEventLimitFallback(userId);
      }

      return data as EventLimitCheck;
    } catch (error) {
      console.error('Erro inesperado ao verificar limite:', error);
      return this.checkEventLimitFallback(userId);
    }
  }

  /**
   * Fallback: verifica limite manualmente se a função RPC não existir
   * IMPORTANTE: Considera limite de 1 evento ativo + cotas mensais
   */
  private async checkEventLimitFallback(userId: string): Promise<EventLimitCheck> {
    // Buscar perfil do usuário
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan, plan_expires_at, event_publications_used_this_month, event_publications_reset_at')
      .eq('id', userId)
      .single();

    if (!profile) {
      return {
        can_create: false,
        reason: 'user_not_found',
        message: 'Usuário não encontrado',
        current_count: 0,
        event_limit: 1,
      };
    }

    // Verificar se o plano está ativo
    const plan_active = !profile.plan_expires_at || new Date(profile.plan_expires_at) > new Date();

    // Contar eventos ativos
    const { count } = await supabase
      .from('events')
      .select('*', { count: 'exact', head: true })
      .eq('organizer_id', userId)
      .eq('ad_status', 'active')
      .gt('expires_at', new Date().toISOString());

    const current_count = count || 0;

    // REGRA 1: Limite de 1 evento ativo (sempre)
    if (current_count >= 1) {
      return {
        can_create: false,
        reason: 'active_limit_reached',
        message: 'Você já tem 1 evento ativo. Para publicar outro, delete o atual ou pague R$ 49,99 pela publicação individual.',
        current_count,
        event_limit: 1,
        can_upgrade: ['free', 'basic', 'pro', 'pro_annual'].includes(profile.plan || 'free'),
        can_pay_individual: true,
        individual_price: 49.99,
      };
    }

    // Obter cota mensal do plano
    const publications_quota = this.getMonthlyQuota(profile.plan);
    const publications_used = profile.event_publications_used_this_month || 0;
    const publications_available = Math.max(0, publications_quota - publications_used);

    // REGRA 2: Usuário free ou sem plano ativo
    if (!plan_active || profile.plan === 'free') {
      return {
        can_create: false,
        reason: 'no_active_plan',
        message: 'Você precisa de um plano ativo ou pagar R$ 49,99 para publicar este evento.',
        current_count,
        event_limit: 1,
        publications_used: 0,
        publications_quota: 0,
        requires_individual_payment: true,
        can_pay_individual: true,
        individual_price: 49.99,
        can_upgrade: true,
      };
    }

    // REGRA 3: Planos sem cota mensal (Basic, VIP)
    if (['basic', 'basic_annual', 'vip'].includes(profile.plan || '')) {
      return {
        can_create: false,
        reason: 'no_monthly_quota',
        message: 'Seu plano não inclui publicações de eventos. Faça upgrade para Pro/Elite ou pague R$ 49,99 pela publicação individual.',
        current_count,
        event_limit: 1,
        publications_used: 0,
        publications_quota: 0,
        can_upgrade: true,
        can_pay_individual: true,
        individual_price: 49.99,
      };
    }

    // REGRA 4: Cota mensal esgotada
    if (publications_used >= publications_quota) {
      const resetDate = profile.event_publications_reset_at 
        ? new Date(profile.event_publications_reset_at).toLocaleDateString('pt-BR')
        : 'Em breve';
      
      return {
        can_create: false,
        reason: 'monthly_quota_exhausted',
        message: `Você já usou ${publications_used} de ${publications_quota} publicação(ões) do mês. Próximo reset: ${resetDate}. Para publicar agora, faça upgrade ou pague R$ 49,99.`,
        current_count,
        event_limit: 1,
        publications_used,
        publications_quota,
        reset_at: profile.event_publications_reset_at,
        can_upgrade: ['pro', 'pro_annual'].includes(profile.plan || ''),
        can_pay_individual: true,
        individual_price: 49.99,
      };
    }

    // PODE PUBLICAR
    return {
      can_create: true,
      reason: 'within_quota',
      message: `Você pode publicar este evento. Restam ${publications_available} publicação(ões) este mês.`,
      current_count,
      event_limit: 1,
      publications_used,
      publications_quota,
      publications_available,
      reset_at: profile.event_publications_reset_at,
    };
  }

  /**
   * Retorna a cota mensal de publicações por plano
   */
  private getMonthlyQuota(plan: string | null | undefined): number {
    if (!plan) return 0;
    
    const normalized = normalizePlanId(plan);
    switch (normalized) {
      case 'pro':
        return 1; // Pro: 1 publicação/mês
      case 'ultra':
        return 2; // Elite: 2 publicações/mês
      default:
        return 0; // Outros planos: sem cota
    }
  }

  /**
   * Retorna o limite de eventos por tipo de plano
   * NOTA: Todos os planos permitem apenas 1 evento ativo por vez
   */
  private getEventLimitByPlan(plan: string | null | undefined): number {
    // Todos os planos têm limite de 1 evento ativo
    return 1;
  }
  
  /**
   * Verifica se um evento pode ser editado (24h após publicação)
   */
  async canEditEvent(eventId: string, userId: string): Promise<{
    can_edit: boolean;
    reason: string;
    message: string;
    can_edit_until?: string;
  }> {
    try {
      const { data: event, error } = await supabase
        .from('events')
        .select('id, organizer_id, can_edit_until, published_at')
        .eq('id', eventId)
        .eq('organizer_id', userId)
        .single();

      if (error || !event) {
        return {
          can_edit: false,
          reason: 'event_not_found',
          message: 'Evento não encontrado ou você não tem permissão para editá-lo.',
        };
      }

      // Verificar se ainda está dentro do prazo de 24h
      if (!event.can_edit_until) {
        return {
          can_edit: false,
          reason: 'no_edit_period',
          message: 'Este evento não possui prazo de edição definido.',
        };
      }

      const now = new Date();
      const canEditUntil = new Date(event.can_edit_until);

      if (now > canEditUntil) {
        return {
          can_edit: false,
          reason: 'edit_period_expired',
          message: 'O prazo de 24h para edição deste evento expirou.',
          can_edit_until: event.can_edit_until,
        };
      }

      // Pode editar
      const hoursRemaining = Math.floor((canEditUntil.getTime() - now.getTime()) / (1000 * 60 * 60));
      const minutesRemaining = Math.floor(((canEditUntil.getTime() - now.getTime()) % (1000 * 60 * 60)) / (1000 * 60));
      
      return {
        can_edit: true,
        reason: 'within_edit_period',
        message: `Você pode editar este evento por mais ${hoursRemaining}h ${minutesRemaining}min.`,
        can_edit_until: event.can_edit_until,
      };
    } catch (error) {
      console.error('Erro ao verificar permissão de edição:', error);
      return {
        can_edit: false,
        reason: 'error',
        message: 'Erro ao verificar permissão de edição.',
      };
    }
  }


  /**
   * Obtém os eventos do usuário com informações de analytics
   */
  async getUserEvents(userId: string) {
    console.log('📋 [EventLimitsService] Buscando eventos do usuário:', userId);
    
    // Buscar diretamente da tabela events (sem VIEW) para evitar cache
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('organizer_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ [EventLimitsService] Erro ao buscar eventos:', error);
      return [];
    }

    console.log('✅ [EventLimitsService] Eventos encontrados:', data?.length || 0);
    return data;
  }

  /**
   * Fallback: busca eventos sem view
   */
  private async getUserEventsFallback(userId: string) {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('organizer_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar eventos (fallback):', error);
      return [];
    }

    return data;
  }

  /**
   * Excluir evento
   */
  async deleteEvent(eventId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🗑️ [EventLimitsService] Excluindo evento:', { eventId, userId });
      
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId)
        .eq('organizer_id', userId);

      if (error) {
        console.error('❌ [EventLimitsService] Erro ao excluir:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ [EventLimitsService] Evento excluído com sucesso!');
      return { success: true };
    } catch (error: unknown) {
      console.error('❌ [EventLimitsService] Erro inesperado:', error);
      return { success: false, error: error.message };
    }
  }
}

export const eventLimitsService = new EventLimitsService();


