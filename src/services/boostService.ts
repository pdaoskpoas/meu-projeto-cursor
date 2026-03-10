/**
 * Serviço de Boost (Impulsionar)
 * Sistema UNIFICADO - boosts são compartilhados entre animais e eventos
 */

import { supabase } from '@/lib/supabase';

export interface BoostInfo {
  available_boosts: number;
  plan_boost_credits: number;
  purchased_boost_credits: number;
  can_boost: boolean;
  message: string;
}

export interface BoostResult {
  success: boolean;
  message: string;
  boosts_remaining?: number;
}

class BoostService {
  /**
   * Obtém informações sobre boosts disponíveis do usuário
   */
  async getBoostInfo(userId: string): Promise<BoostInfo> {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('plan_boost_credits, purchased_boost_credits')
        .eq('id', userId)
        .single();

      if (error) throw error;

      const total_boosts = (profile.plan_boost_credits || 0) + (profile.purchased_boost_credits || 0);
      const can_boost = total_boosts > 0;

      return {
        available_boosts: total_boosts,
        plan_boost_credits: profile.plan_boost_credits || 0,
        purchased_boost_credits: profile.purchased_boost_credits || 0,
        can_boost,
        message: can_boost 
          ? `Você tem ${total_boosts} boost(s) disponível(is)`
          : 'Você não tem boosts disponíveis. Compre mais ou aguarde a renovação mensal do seu plano.',
      };
    } catch (error: unknown) {
      console.error('Erro ao obter informações de boost:', error);
      return {
        available_boosts: 0,
        plan_boost_credits: 0,
        purchased_boost_credits: 0,
        can_boost: false,
        message: 'Erro ao verificar boosts disponíveis.',
      };
    }
  }

  /**
   * Aplica boost em um animal
   * Usa função atômica do banco para prevenir race conditions
   * ✅ CORRIGIDO: Função atômica com row-level lock
   */
  async boostAnimal(userId: string, animalId: string): Promise<BoostResult> {
    try {
      // Chamar função atômica do banco de dados
      // Esta função usa FOR UPDATE para prevenir race conditions
      const { data, error } = await supabase.rpc('boost_animal_atomic', {
        p_user_id: userId,
        p_animal_id: animalId,
        p_duration_hours: 24
      });

      if (error) {
        console.error('Erro ao executar boost_animal_atomic:', error);
        return {
          success: false,
          message: `Erro ao turbinar: ${error.message}`,
        };
      }

      // A função SQL retorna JSONB com { success, message, boosts_remaining }
      return data as BoostResult;
      
    } catch (error: unknown) {
      console.error('Erro ao turbinar animal:', error);
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      return {
        success: false,
        message: `Erro ao turbinar: ${message}`,
      };
    }
  }

  /**
   * Aplica boost em um evento
   * Reduz do pool compartilhado de boosts (mesmos créditos dos animais!)
   */
  async boostEvent(userId: string, eventId: string): Promise<BoostResult> {
    try {
      // Chamar função atômica do banco de dados
      // Esta função usa FOR UPDATE para prevenir race conditions
      const { data, error } = await supabase.rpc('boost_event_atomic', {
        p_user_id: userId,
        p_event_id: eventId,
        p_duration_hours: 24
      });

      if (error) {
        console.error('Erro ao executar boost_event_atomic:', error);
        return {
          success: false,
          message: `Erro ao turbinar: ${error.message}`,
        };
      }

      // A função SQL retorna JSONB com { success, message, boosts_remaining }
      return data as BoostResult;

    } catch (error: unknown) {
      console.error('Erro ao turbinar evento:', error);
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      return {
        success: false,
        message: `Erro ao turbinar: ${message}`,
      };
    }
  }

  /**
   * Compra de boosts adicionais
   * Fluxo real é feito via edge function (process-boost-payment).
   */
}

export const boostService = new BoostService();

