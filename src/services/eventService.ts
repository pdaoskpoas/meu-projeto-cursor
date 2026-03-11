import { supabase } from '@/lib/supabase';
import { handleSupabaseError, logSupabaseOperation } from '@/lib/supabase-helpers';

export const eventService = {
  // Impulsionar evento (boost)
  async boostEvent(eventId: string, userId: string, duration: number = 24): Promise<void> {
    try {
      // Buscar perfil do usuário
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('plan_boost_credits, purchased_boost_credits')
        .eq('id', userId)
        .single();

      if (profileError) throw handleSupabaseError(profileError);

      const planCredits = profile?.plan_boost_credits ?? 0;
      const purchasedCredits = profile?.purchased_boost_credits ?? 0;

      // Verificar se tem créditos disponíveis
      if (planCredits <= 0 && purchasedCredits <= 0) {
        throw new Error('Sem créditos de turbinar disponíveis');
      }

      const usePlanBoost = planCredits > 0;

      // Atualizar evento
      const { error: updateError } = await supabase
        .from('events')
        .update({
          is_boosted: true,
          boost_expires_at: new Date(Date.now() + duration * 60 * 60 * 1000).toISOString(),
          boosted_by: userId,
          boosted_at: new Date().toISOString(),
          can_edit: false
        })
        .eq('id', eventId);

      if (updateError) throw handleSupabaseError(updateError);

      // Registrar no histórico
      const { error: historyError } = await supabase
        .from('boost_history')
        .insert({
          content_type: 'event',
          content_id: eventId,
          user_id: userId,
          boost_type: usePlanBoost ? 'plan_included' : 'purchased',
          duration_hours: duration,
          cost: 0
        });

      if (historyError) throw handleSupabaseError(historyError);

      // Debitar créditos
      if (usePlanBoost) {
        const { error: decPlanErr } = await supabase
          .from('profiles')
          .update({
            plan_boost_credits: planCredits - 1,
            available_boosts: (planCredits - 1) + purchasedCredits
          })
          .eq('id', userId);
        if (decPlanErr) throw handleSupabaseError(decPlanErr);
      } else {
        const { error: decPurchasedErr } = await supabase
          .from('profiles')
          .update({
            purchased_boost_credits: purchasedCredits - 1,
            available_boosts: planCredits + (purchasedCredits - 1)
          })
          .eq('id', userId);
        if (decPurchasedErr) throw handleSupabaseError(decPurchasedErr);
      }

      logSupabaseOperation('Boost event success', { eventId });
    } catch (error) {
      logSupabaseOperation('Boost event error', null, error);
      throw error;
    }
  }
};
