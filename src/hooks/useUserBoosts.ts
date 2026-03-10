import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface BoostBalance {
  available: number;
  plan: number;
  purchased: number;
  total: number;
}

export const useUserBoosts = () => {
  const { user } = useAuth();
  const [boosts, setBoosts] = useState<BoostBalance>({
    available: 0,
    plan: 0,
    purchased: 0,
    total: 0
  });
  const [loading, setLoading] = useState(true);

  const refreshBoosts = useCallback(async () => {
    if (!user?.id) {
      setBoosts({ available: 0, plan: 0, purchased: 0, total: 0 });
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('available_boosts, plan_boost_credits, purchased_boost_credits')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      const planCredits = data?.plan_boost_credits ?? 0;
      const purchasedCredits = data?.purchased_boost_credits ?? 0;
      const totalCredits = planCredits + purchasedCredits;

      setBoosts({
        available: data?.available_boosts ?? 0,
        plan: planCredits,
        purchased: purchasedCredits,
        total: totalCredits
      });
    } catch (error) {
      console.error('Erro ao buscar boosts:', error);
      setBoosts({ available: 0, plan: 0, purchased: 0, total: 0 });
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    refreshBoosts();
  }, [refreshBoosts]);

  return { boosts, refreshBoosts, loading };
};
