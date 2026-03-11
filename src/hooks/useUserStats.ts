import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { partnershipService } from '@/services/partnershipService';
import { isStaleRequestError, runResilientRequest } from '@/services/resilientRequestService';

interface UserStatsState {
  totalAnimals: number;
  activeAnimals: number;
  totalViews: number;
  totalClicks: number;
  monthlyViews: number;
  monthlyClicks: number;
  monthlyClickRate: number;
  yearlyViews: number;
  yearlyClicks: number;
  yearlyClickRate: number;
  availableBoosts: number;
  activeBoosts: number;
  clickRate: number;
  loading: boolean;
  error: string | null;
}

interface UserStatsCacheEntry {
  data: UserStatsState;
  timestamp: number;
}

const userStatsCache = new Map<string, UserStatsCacheEntry>();
const USER_STATS_CACHE_TTL_MS = 30 * 1000;

export const useUserStats = () => {
  const { user } = useAuth();
  const requestIdRef = useRef(0);
  
  const [stats, setStats] = useState<UserStatsState>({
    totalAnimals: 0,
    activeAnimals: 0,
    totalViews: 0,
    totalClicks: 0,
    monthlyViews: 0,
    monthlyClicks: 0,
    monthlyClickRate: 0,
    yearlyViews: 0,
    yearlyClicks: 0,
    yearlyClickRate: 0,
    availableBoosts: 0,
    activeBoosts: 0,
    clickRate: 0,
    loading: true,
    error: null as string | null
  });

  const fetchStats = useCallback(async () => {
    const requestId = ++requestIdRef.current;

    if (!user?.id) {
      if (requestId === requestIdRef.current) {
        setStats(prev => ({ ...prev, loading: false, error: null }));
      }
      return;
    }

    try {
      const cached = userStatsCache.get(user.id);
      if (cached && Date.now() - cached.timestamp < USER_STATS_CACHE_TTL_MS) {
        if (requestId === requestIdRef.current) {
          setStats({ ...cached.data, loading: false });
        }
        return;
      }

      if (requestId === requestIdRef.current) {
        setStats(prev => ({ ...prev, loading: true, error: null }));
      }

      const nextStats = await runResilientRequest(async () => {
        // Calcular datas de referência
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfYear = new Date(now.getFullYear(), 0, 1);

        // ✅ OTIMIZAÇÃO 1: Executar queries de animais em paralelo
        const [
          userAnimals,
          { data: profileData },
          { count: activeBoosts }
        ] = await Promise.all([
          // 1. Buscar animais do usuário + sociedades
          partnershipService.getUserAnimalsWithPartnerships(user.id),
          
          // 2. Buscar boosts disponíveis
          supabase
            .from('profiles')
            .select('available_boosts, plan_boost_credits, purchased_boost_credits')
            .eq('id', user.id)
            .single(),
          
          // 3. Buscar boosts ativos (não expirados) apenas do dono
          supabase
            .from('animals')
            .select('*', { count: 'exact', head: true })
            .eq('owner_id', user.id)
            .eq('is_boosted', true)
            .gt('boost_expires_at', new Date().toISOString())
        ]);

        const animalIds = userAnimals?.map(a => a.id) || [];
        const totalAnimals = userAnimals?.length || 0;
        const activeAnimals = userAnimals?.filter(a => a.ad_status === 'active').length || 0;
        const availableBoosts = profileData?.available_boosts ?? 0;

        let totalViews = 0;
        let totalClicks = 0;
        let monthlyViews = 0;
        let monthlyClicks = 0;
        let yearlyViews = 0;
        let yearlyClicks = 0;

        if (animalIds.length > 0) {
          // ✅ OTIMIZAÇÃO 2: Executar todas as queries de impressões/cliques em paralelo
          const [
            { count: totalViewsCount },
            { count: totalClicksCount },
            { count: monthViewsCount },
            { count: monthClicksCount },
            { count: yearViewsCount },
            { count: yearClicksCount }
          ] = await Promise.all([
            // Buscar impressões totais
            supabase
              .from('impressions')
              .select('*', { count: 'exact', head: true })
              .eq('content_type', 'animal')
              .in('content_id', animalIds),
            
            // Buscar cliques totais
            supabase
              .from('clicks')
              .select('*', { count: 'exact', head: true })
              .eq('content_type', 'animal')
              .in('content_id', animalIds),
            
            // Buscar impressões do mês atual
            supabase
              .from('impressions')
              .select('*', { count: 'exact', head: true })
              .eq('content_type', 'animal')
              .in('content_id', animalIds)
              .gte('created_at', startOfMonth.toISOString()),
            
            // Buscar cliques do mês atual
            supabase
              .from('clicks')
              .select('*', { count: 'exact', head: true })
              .eq('content_type', 'animal')
              .in('content_id', animalIds)
              .gte('created_at', startOfMonth.toISOString()),
            
            // Buscar impressões do ano atual
            supabase
              .from('impressions')
              .select('*', { count: 'exact', head: true })
              .eq('content_type', 'animal')
              .in('content_id', animalIds)
              .gte('created_at', startOfYear.toISOString()),
            
            // Buscar cliques do ano atual
            supabase
              .from('clicks')
              .select('*', { count: 'exact', head: true })
              .eq('content_type', 'animal')
              .in('content_id', animalIds)
              .gte('created_at', startOfYear.toISOString())
          ]);

          totalViews = totalViewsCount || 0;
          totalClicks = totalClicksCount || 0;
          monthlyViews = monthViewsCount || 0;
          monthlyClicks = monthClicksCount || 0;
          yearlyViews = yearViewsCount || 0;
          yearlyClicks = yearClicksCount || 0;
        }

        // Calcular taxas de clique
        const clickRate = totalViews > 0 ? (totalClicks / totalViews) * 100 : 0;
        const monthlyClickRate = monthlyViews > 0 ? (monthlyClicks / monthlyViews) * 100 : 0;
        const yearlyClickRate = yearlyViews > 0 ? (yearlyClicks / yearlyViews) * 100 : 0;

        const nextStats: UserStatsState = {
          totalAnimals: totalAnimals || 0,
          activeAnimals: activeAnimals || 0,
          totalViews,
          totalClicks,
          monthlyViews,
          monthlyClicks,
          monthlyClickRate,
          yearlyViews,
          yearlyClicks,
          yearlyClickRate,
          availableBoosts,
          activeBoosts: activeBoosts || 0,
          clickRate,
          loading: false,
          error: null
        };

        return nextStats;
      }, {
        timeoutMs: 45000,
        errorMessage: 'O carregamento das estatísticas demorou demais.',
        requestKey: `user-stats:${user.id}`
      });

      if (requestId !== requestIdRef.current) return;

      userStatsCache.set(user.id, {
        data: nextStats,
        timestamp: Date.now()
      });

      setStats(nextStats);
    } catch (error) {
      if (isStaleRequestError(error) || requestId !== requestIdRef.current) return;
      console.error('Erro ao buscar estatísticas:', error);
      setStats(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Erro ao carregar estatísticas'
      }));
    } finally {
      if (requestId === requestIdRef.current) {
        setStats(prev => ({ ...prev, loading: false }));
      }
    }
  }, [user?.id]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    ...stats,
    refresh: fetchStats
  };
};
