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
const USER_STATS_CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutos - dados de stats mudam pouco

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
          _resUserAnimals,
          _resProfile,
          _resActiveBoosts
        ] = await Promise.allSettled([
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

        const userAnimals = _resUserAnimals.status === 'fulfilled' ? _resUserAnimals.value : [];
        const { data: profileData } = _resProfile.status === 'fulfilled' ? _resProfile.value : { data: null };
        const { count: activeBoosts } = _resActiveBoosts.status === 'fulfilled' ? _resActiveBoosts.value : { count: 0 };
        if (_resUserAnimals.status === 'rejected') console.warn('[useUserStats] getUserAnimalsWithPartnerships failed:', _resUserAnimals.reason);
        if (_resProfile.status === 'rejected') console.warn('[useUserStats] profile query failed:', _resProfile.reason);
        if (_resActiveBoosts.status === 'rejected') console.warn('[useUserStats] activeBoosts query failed:', _resActiveBoosts.reason);

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
            _resTotalViews,
            _resTotalClicks,
            _resMonthViews,
            _resMonthClicks,
            _resYearViews,
            _resYearClicks
          ] = await Promise.allSettled([
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

          const { count: totalViewsCount } = _resTotalViews.status === 'fulfilled' ? _resTotalViews.value : { count: 0 };
          const { count: totalClicksCount } = _resTotalClicks.status === 'fulfilled' ? _resTotalClicks.value : { count: 0 };
          const { count: monthViewsCount } = _resMonthViews.status === 'fulfilled' ? _resMonthViews.value : { count: 0 };
          const { count: monthClicksCount } = _resMonthClicks.status === 'fulfilled' ? _resMonthClicks.value : { count: 0 };
          const { count: yearViewsCount } = _resYearViews.status === 'fulfilled' ? _resYearViews.value : { count: 0 };
          const { count: yearClicksCount } = _resYearClicks.status === 'fulfilled' ? _resYearClicks.value : { count: 0 };
          if (_resTotalViews.status === 'rejected') console.warn('[useUserStats] total views query failed:', _resTotalViews.reason);
          if (_resTotalClicks.status === 'rejected') console.warn('[useUserStats] total clicks query failed:', _resTotalClicks.reason);
          if (_resMonthViews.status === 'rejected') console.warn('[useUserStats] monthly views query failed:', _resMonthViews.reason);
          if (_resMonthClicks.status === 'rejected') console.warn('[useUserStats] monthly clicks query failed:', _resMonthClicks.reason);
          if (_resYearViews.status === 'rejected') console.warn('[useUserStats] yearly views query failed:', _resYearViews.reason);
          if (_resYearClicks.status === 'rejected') console.warn('[useUserStats] yearly clicks query failed:', _resYearClicks.reason);

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
