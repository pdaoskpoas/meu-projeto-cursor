import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { isStaleRequestError, runResilientRequest } from '@/services/resilientRequestService';

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
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const requestIdRef = useRef(0);

  const refreshBoosts = useCallback(async () => {
    const requestId = ++requestIdRef.current;

    if (!user?.id) {
      if (requestId === requestIdRef.current) {
        setBoosts({ available: 0, plan: 0, purchased: 0, total: 0 });
        setLoading(false);
      }
      return;
    }

    try {
      const cached = boostsCache.get(user.id);
      if (cached && Date.now() - cached.timestamp < BOOSTS_CACHE_TTL_MS) {
        if (requestId === requestIdRef.current) {
          setBoosts(cached.data);
          setLoading(false);
          setError(null);
          setHasLoadedOnce(true);
        }
        return;
      }

      if (requestId === requestIdRef.current) {
        setLoading(true);
        setError(null);
      }

      const { data, error } = await runResilientRequest(async () =>
        supabase
          .from('profiles')
          .select('available_boosts, plan_boost_credits, purchased_boost_credits')
          .eq('id', user.id)
          .single(),
        {
          timeoutMs: 45000,
          errorMessage: 'O carregamento dos boosts demorou demais.',
          requestKey: `user-boosts:${user.id}`
        }
      );

      if (error) throw error;
      if (requestId !== requestIdRef.current) return;

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
      setHasLoadedOnce(true);
    } catch (error) {
      if (isStaleRequestError(error) || requestId !== requestIdRef.current) return;
      console.error('Erro ao buscar boosts:', error);
      const message = error instanceof Error ? error.message : 'Erro ao carregar boosts';
      const isTimeout = message.toLowerCase().includes('demorou demais') || message.toLowerCase().includes('timeout');

      if (!hasLoadedOnce) {
        setBoosts({ available: 0, plan: 0, purchased: 0, total: 0 });
      }
      setError(isTimeout ? null : message);
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [user?.id, hasLoadedOnce]);

  useEffect(() => {
    refreshBoosts();
  }, [refreshBoosts]);

  return { boosts, refreshBoosts, loading, error };
};
