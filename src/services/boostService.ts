/**
 * Serviço de Turbinar (Boost)
 *
 * Novo modelo baseado em duração:
 * - 24 horas → R$ 19,90
 * - 3 dias   → R$ 49,90
 * - 7 dias   → R$ 89,90
 *
 * Regras:
 * - Turbinares do plano são consumidos primeiro
 * - Após esgotar, o usuário compra avulso
 * - Animal já turbinado não pode ser turbinado novamente (até expirar)
 * - Destaque expira automaticamente ao final do período
 */

import { supabase } from '@/lib/supabase';
import { type BoostDuration, getBoostTier } from '@/constants/checkoutPlans';

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
  boost_expires_at?: string;
}

class BoostService {
  /**
   * Obtém informações sobre turbinares disponíveis do usuário
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
          ? `Você tem ${total_boosts} turbinar(es) disponível(is)`
          : 'Você não tem turbinares disponíveis. Compre avulso ou aguarde a renovação mensal do seu plano.',
      };
    } catch (error: unknown) {
      console.error('Erro ao obter informações de turbinar:', error);
      return {
        available_boosts: 0,
        plan_boost_credits: 0,
        purchased_boost_credits: 0,
        can_boost: false,
        message: 'Erro ao verificar turbinares disponíveis.',
      };
    }
  }

  /**
   * Verifica se um animal já está turbinado
   */
  async isAnimalBoosted(animalId: string): Promise<{ boosted: boolean; expiresAt: string | null }> {
    try {
      const { data, error } = await supabase
        .from('animals')
        .select('is_boosted, boost_expires_at')
        .eq('id', animalId)
        .single();

      if (error) throw error;

      const now = new Date();
      const expiresAt = data?.boost_expires_at ? new Date(data.boost_expires_at) : null;
      const isBoosted = data?.is_boosted && expiresAt && expiresAt > now;

      return {
        boosted: !!isBoosted,
        expiresAt: isBoosted ? data.boost_expires_at : null
      };
    } catch {
      return { boosted: false, expiresAt: null };
    }
  }

  /**
   * Aplica turbinar em um animal usando créditos do plano
   * Usa função atômica do banco para prevenir race conditions
   *
   * @param duration - Duração do turbinar (24h, 3d, 7d)
   */
  async boostAnimal(userId: string, animalId: string, duration: BoostDuration = '24h'): Promise<BoostResult> {
    try {
      // 1. Verificar se animal já está turbinado
      const { boosted, expiresAt } = await this.isAnimalBoosted(animalId);
      if (boosted) {
        const expiresDate = expiresAt ? new Date(expiresAt).toLocaleString('pt-BR') : '';
        return {
          success: false,
          message: `Este animal já está turbinado até ${expiresDate}. Aguarde o período expirar.`,
        };
      }

      const tier = getBoostTier(duration);

      // 2. Chamar função atômica do banco de dados
      const { data, error } = await supabase.rpc('boost_animal_atomic', {
        p_user_id: userId,
        p_animal_id: animalId,
        p_duration_hours: tier.hours
      });

      if (error) {
        console.error('Erro ao executar boost_animal_atomic:', error);
        return {
          success: false,
          message: `Erro ao turbinar: ${error.message}`,
        };
      }

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
   * Aplica turbinar em um evento
   */
  async boostEvent(userId: string, eventId: string, duration: BoostDuration = '24h'): Promise<BoostResult> {
    try {
      const tier = getBoostTier(duration);

      const { data, error } = await supabase.rpc('boost_event_atomic', {
        p_user_id: userId,
        p_event_id: eventId,
        p_duration_hours: tier.hours
      });

      if (error) {
        console.error('Erro ao executar boost_event_atomic:', error);
        return {
          success: false,
          message: `Erro ao turbinar: ${error.message}`,
        };
      }

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
}

export const boostService = new BoostService();
