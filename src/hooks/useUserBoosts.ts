import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { runResilientRequest } from '@/services/resilientRequestService';

interface BoostBalance {
  available: number;
  plan: number;
  purchased: number;
  total: number;
}

interface BoostsCacheEntry {
  data: BoostBalance;
  timestamp: number;
}

const boostsCache = new Map<string, BoostsCacheEntry>();
const BOOSTS_CACHE_TTL_MS = 30 * 1000;

export const useUserBoosts = () => {
  const { user } = useAuth();
  const [boosts, setBoosts] = useState<BoostBalance>({
    available: 0,
    plan: 0,
    purchased: 0,
    total: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshBoosts = useCallback(async () => {
    if (!user?.id) {
      setBoosts({ available: 0, plan: 0, purchased: 0, total: 0 });
      setLoading(false);
      return;
    }

    try {
      const cached = boostsCache.get(user.id);
      if (cached && Date.now() - cached.timestamp < BOOSTS_CACHE_TTL_MS) {
        setBoosts(cached.data);
        setLoading(false);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);

      const { data, error } = await runResilientRequest(async () =>
        supabase
          .from('profiles')
          .select('available_boosts, plan_boost_credits, purchased_boost_credits')
          .eq('id', user.id)
          .single(),
        {
          timeoutMs: 10000,
          errorMessage: 'O carregamento dos boosts demorou demais.'
        }
      );

      if (error) throw error;

      const planCredits = data?.plan_boost_credits ?? 0;
      const purchasedCredits = data?.purchased_boost_credits ?? 0;
      const totalCredits = planCredits + purchasedCredits;

      const nextBoosts = {
        available: data?.available_boosts ?? 0,
        plan: planCredits,
        purchased: purchasedCredits,
        total: totalCredits
      };

      boostsCache.set(user.id, {
        data: nextBoosts,
        timestamp: Date.now()
      });

      setBoosts(nextBoosts);
    } catch (error) {
      console.error('Erro ao buscar boosts:', error);
      setBoosts({ available: 0, plan: 0, purchased: 0, total: 0 });
      setError(error instanceof Error ? error.message : 'Erro ao carregar boosts');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    refreshBoosts();
  }, [refreshBoosts]);

  return { boosts, refreshBoosts, loading, error };
};
