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
   * Verifica se o usuário pode criar um novo evento usando regra local:
   * - Plano Iniciante: 2 eventos/mês
   * - Plano Pro: 5 eventos/mês
   * - Plano Elite: 10 eventos/mês
   * - Plano Free: bloqueado
   */
  async checkEventLimit(userId: string): Promise<EventLimitCheck> {
    return this.checkEventLimitFallback(userId);
  }

  /**
   * Verifica limite mensal diretamente no banco (sem depender de RPC).
   */
  private async checkEventLimitFallback(userId: string): Promise<EventLimitCheck> {
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
        event_limit: 0,
      };
    }

    const now = new Date();
    const planIsActive = !!profile.plan && profile.plan !== 'free' && (!profile.plan_expires_at || new Date(profile.plan_expires_at) > now);
    const publications_quota = this.getMonthlyQuota(profile.plan);
    const publications_used = profile.event_publications_used_this_month || 0;
    const publications_available = Math.max(0, publications_quota - publications_used);

    // Plano free (ou plano expirado) precisa assinar.
    if (!planIsActive) {
      return {
        can_create: false,
        reason: 'no_active_plan',
        message: 'Seu plano Free não inclui publicação de eventos. Assine um plano Iniciante, Pro ou Elite para divulgar eventos.',
        current_count: publications_used,
        event_limit: publications_quota,
        publications_used,
        publications_quota: 0,
        publications_available: 0,
        requires_individual_payment: false,
        can_pay_individual: false,
        can_upgrade: true,
      };
    }

    // Qualquer plano fora das faixas de evento fica bloqueado para publicação.
    if (publications_quota <= 0) {
      return {
        can_create: false,
        reason: 'no_monthly_quota',
        message: 'Seu plano atual não inclui publicação de eventos. Faça upgrade para Iniciante, Pro ou Elite.',
        current_count: publications_used,
        event_limit: publications_quota,
        publications_used,
        publications_quota,
        publications_available,
        can_upgrade: true,
        can_pay_individual: false,
      };
    }

    // Cota mensal esgotada.
    if (publications_used >= publications_quota) {
      const resetDate = profile.event_publications_reset_at 
        ? new Date(profile.event_publications_reset_at).toLocaleDateString('pt-BR')
        : 'Em breve';
      
      return {
        can_create: false,
        reason: 'monthly_quota_exhausted',
        message: `Você já usou ${publications_used} de ${publications_quota} eventos do mês. Próximo reset: ${resetDate}.`,
        current_count: publications_used,
        event_limit: publications_quota,
        publications_used,
        publications_quota,
        publications_available: 0,
        reset_at: profile.event_publications_reset_at,
        can_upgrade: true,
        can_pay_individual: false,
      };
    }

    // Pode publicar.
    return {
      can_create: true,
      reason: 'within_quota',
      message: `Você pode publicar este evento. Restam ${publications_available} publicação(ões) neste mês.`,
      current_count: publications_used,
      event_limit: publications_quota,
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
      case 'basic':
        return 2; // Iniciante: 2 eventos/mês
      case 'pro':
        return 5; // Pro: 5 eventos/mês
      case 'ultra':
      case 'vip':
        return 10; // Elite e VIP: 10 eventos/mês
      default:
        return 0; // Outros planos: sem cota
    }
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


