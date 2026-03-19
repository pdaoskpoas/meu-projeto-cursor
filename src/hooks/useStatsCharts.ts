import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { partnershipService } from '@/services/partnershipService';
import { isStaleRequestError, runResilientRequest } from '@/services/resilientRequestService';

interface DailyData {
  name: string;
  views: number;
  clicks: number;
}

interface MonthlyData {
  month: string;
  impressions: number;
  clicks: number;
}

interface AnimalPerformance {
  name: string;
  views: number;
  clicks: number;
  ctr: number;
}

interface StatsChartsCacheEntry {
  weeklyData: DailyData[];
  monthlyData: MonthlyData[];
  topAnimals: AnimalPerformance[];
  timestamp: number;
}

const chartsCache = new Map<string, StatsChartsCacheEntry>();
const CHARTS_CACHE_TTL_MS = 3 * 60 * 1000; // 3 minutos - gráficos mudam pouco

const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export const useStatsCharts = (activePeriod: 'all' | 'month' | 'year') => {
  const { user } = useAuth();
  const requestIdRef = useRef(0);
  const [weeklyData, setWeeklyData] = useState<DailyData[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [topAnimals, setTopAnimals] = useState<AnimalPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchChartData = useCallback(async () => {
    const requestId = ++requestIdRef.current;

    if (!user?.id) {
      if (requestId === requestIdRef.current) {
        setLoading(false);
        setError(null);
      }
      return;
    }

    try {
      if (requestId === requestIdRef.current) {
        setLoading(true);
        setError(null);
      }

      const cacheKey = `${user.id}:${activePeriod}`;
      const cached = chartsCache.get(cacheKey);

      if (cached && Date.now() - cached.timestamp < CHARTS_CACHE_TTL_MS) {
        if (requestId === requestIdRef.current) {
          setWeeklyData(cached.weeklyData);
          setMonthlyData(cached.monthlyData);
          setTopAnimals(cached.topAnimals);
          setLoading(false);
        }
        return;
      }

      const nextData = await runResilientRequest(async () => {
        const userAnimals = await partnershipService.getUserAnimalsWithPartnerships(user.id);

        const animalIds = userAnimals?.map(a => a.id) || [];
        const animalMap = new Map(userAnimals?.map(a => [a.id, a.name]) || []);

        if (animalIds.length === 0) {
          return {
            weeklyData: [],
            monthlyData: [],
            topAnimals: []
          };
        }

        const monthsToShow = activePeriod === 'year' ? 12 : 6;
        const today = new Date();
        const weeklyStart = new Date(today);
        weeklyStart.setDate(today.getDate() - 6);
        weeklyStart.setHours(0, 0, 0, 0);

        const periodicStart = new Date(today.getFullYear(), today.getMonth() - (monthsToShow - 1), 1);
        const fetchStart = weeklyStart < periodicStart ? weeklyStart : periodicStart;

        const [
          _resImpressions,
          _resClicks
        ] = await Promise.allSettled([
          supabase
            .from('impressions')
            .select('content_id, created_at')
            .eq('content_type', 'animal')
            .in('content_id', animalIds)
            .gte('created_at', fetchStart.toISOString()),
          supabase
            .from('clicks')
            .select('content_id, created_at')
            .eq('content_type', 'animal')
            .in('content_id', animalIds)
            .gte('created_at', fetchStart.toISOString())
        ]);

        const { data: impressionsData, error: impressionsError } = _resImpressions.status === 'fulfilled' ? _resImpressions.value : { data: null, error: null };
        const { data: clicksData, error: clicksError } = _resClicks.status === 'fulfilled' ? _resClicks.value : { data: null, error: null };
        if (_resImpressions.status === 'rejected') console.warn('[useStatsCharts] impressions query failed:', _resImpressions.reason);
        if (_resClicks.status === 'rejected') console.warn('[useStatsCharts] clicks query failed:', _resClicks.reason);

        if (impressionsError) throw impressionsError;
        if (clicksError) throw clicksError;

        const nextDay = (date: Date) => {
          const value = new Date(date);
          value.setDate(value.getDate() + 1);
          return value;
        };

        const weekData: DailyData[] = [];
        for (let i = 6; i >= 0; i--) {
          const date = new Date(today);
          date.setDate(date.getDate() - i);
          date.setHours(0, 0, 0, 0);
          const nextDate = nextDay(date);

          weekData.push({
            name: dayNames[date.getDay()],
            views: (impressionsData || []).filter(item =>
              item.created_at &&
              item.created_at >= date.toISOString() &&
              item.created_at < nextDate.toISOString()
            ).length,
            clicks: (clicksData || []).filter(item =>
              item.created_at &&
              item.created_at >= date.toISOString() &&
              item.created_at < nextDate.toISOString()
            ).length
          });
        }

        const periodicData: MonthlyData[] = [];
        for (let i = monthsToShow - 1; i >= 0; i--) {
          const monthDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
          const nextMonthDate = new Date(today.getFullYear(), today.getMonth() - i + 1, 1);

          periodicData.push({
            month: monthNames[monthDate.getMonth()],
            impressions: (impressionsData || []).filter(item =>
              item.created_at &&
              item.created_at >= monthDate.toISOString() &&
              item.created_at < nextMonthDate.toISOString()
            ).length,
            clicks: (clicksData || []).filter(item =>
              item.created_at &&
              item.created_at >= monthDate.toISOString() &&
              item.created_at < nextMonthDate.toISOString()
            ).length
          });
        }

        const performanceData: AnimalPerformance[] = userAnimals
          .map(animal => {
            const views = Number(animal.impression_count || 0);
            const clicks = Number(animal.click_count || 0);
            const ctr = views > 0 ? Math.round((clicks / views) * 100) : 0;

            return {
              name: animalMap.get(animal.id) || 'Animal',
              views,
              clicks,
              ctr
            };
          })
          .filter(item => item.views > 0 || item.clicks > 0)
          .sort((a, b) => b.views - a.views)
          .slice(0, 5);

        return {
          weeklyData: weekData,
          monthlyData: periodicData,
          topAnimals: performanceData
        };
      }, {
        timeoutMs: 45000,
        errorMessage: 'O carregamento dos gráficos demorou demais.',
        requestKey: `stats-charts:${user.id}:${activePeriod}`
      });

      if (requestId !== requestIdRef.current) return;

      chartsCache.set(cacheKey, {
        weeklyData: nextData.weeklyData,
        monthlyData: nextData.monthlyData,
        topAnimals: nextData.topAnimals,
        timestamp: Date.now()
      });

      setWeeklyData(nextData.weeklyData);
      setMonthlyData(nextData.monthlyData);
      setTopAnimals(nextData.topAnimals);
    } catch (error) {
      if (isStaleRequestError(error) || requestId !== requestIdRef.current) return;
      console.error('Erro ao buscar dados dos gráficos:', error);
      setError(error instanceof Error ? error.message : 'Erro ao carregar gráficos');
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [user?.id, activePeriod]);

  useEffect(() => {
    fetchChartData();
  }, [fetchChartData]);

  return {
    weeklyData,
    monthlyData,
    topAnimals,
    loading,
    error,
    refresh: fetchChartData
  };
};

