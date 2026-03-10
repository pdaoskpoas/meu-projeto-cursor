import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

type VisitPeriod = 'day' | 'month' | 'year';

interface PeriodRange {
  start: string;
  end: string;
  label: string;
}

interface PageVisitRow {
  page_key: string;
  session_id: string;
  created_at: string | null;
}

interface TopAnimalMetric {
  id: string;
  name: string;
  impressionCount: number;
  clickCount: number;
  clickRate: number;
}

interface TrafficBucket {
  label: string;
  siteVisits: number;
  homeVisits: number;
}

export interface AdminVisitMetrics {
  siteVisits: number;
  uniqueSiteVisitors: number;
  homeVisits: number;
  uniqueHomeVisitors: number;
  totalImpressions: number;
  totalClicks: number;
  impressionsByType: Record<string, number>;
  clicksByType: Record<string, number>;
  topAnimals: TopAnimalMetric[];
  trafficSeries: TrafficBucket[];
}

const CONTENT_TYPES = ['animal', 'event', 'article'] as const;

const isMissingPageVisitsTable = (error: unknown): boolean => {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const code = 'code' in error ? String(error.code) : '';
  const message = 'message' in error ? String(error.message).toLowerCase() : '';

  return code === '42P01' || message.includes('page_visits');
};

const createTrafficBuckets = (period: VisitPeriod, range: PeriodRange): TrafficBucket[] => {
  const start = new Date(range.start);
  const end = new Date(range.end);
  const buckets: TrafficBucket[] = [];

  if (period === 'year') {
    for (let month = 0; month < 12; month += 1) {
      buckets.push({
        label: new Date(start.getFullYear(), month, 1).toLocaleDateString('pt-BR', { month: 'short' }),
        siteVisits: 0,
        homeVisits: 0,
      });
    }
    return buckets;
  }

  if (period === 'month') {
    const cursor = new Date(start);
    while (cursor < end) {
      buckets.push({
        label: cursor.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        siteVisits: 0,
        homeVisits: 0,
      });
      cursor.setDate(cursor.getDate() + 1);
    }
    return buckets;
  }

  for (let hour = 0; hour < 24; hour += 1) {
    buckets.push({
      label: `${String(hour).padStart(2, '0')}:00`,
      siteVisits: 0,
      homeVisits: 0,
    });
  }

  return buckets;
};

const getBucketIndex = (dateString: string, period: VisitPeriod): number => {
  const date = new Date(dateString);

  if (period === 'year') {
    return date.getMonth();
  }

  if (period === 'month') {
    return date.getDate() - 1;
  }

  return date.getHours();
};

export const useAdminVisitMetrics = (period: VisitPeriod, periodRange: PeriodRange) => {
  const [data, setData] = useState<AdminVisitMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchVisitMetrics = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const trafficSeries = createTrafficBuckets(period, periodRange);

        const { data: pageVisitsData, error: pageVisitsError } = await supabase
          .from('page_visits')
          .select('page_key, session_id, created_at')
          .gte('created_at', periodRange.start)
          .lt('created_at', periodRange.end);

        const pageVisits: PageVisitRow[] =
          pageVisitsError && isMissingPageVisitsTable(pageVisitsError) ? [] : (pageVisitsData as PageVisitRow[] | null) || [];

        if (pageVisitsError && !isMissingPageVisitsTable(pageVisitsError)) {
          throw pageVisitsError;
        }

        pageVisits.forEach((visit) => {
          if (!visit.created_at) return;
          const bucket = trafficSeries[getBucketIndex(visit.created_at, period)];
          if (!bucket) return;

          if (visit.page_key === 'site_access') {
            bucket.siteVisits += 1;
          }

          if (visit.page_key === 'home') {
            bucket.homeVisits += 1;
          }
        });

        const { data: animalsData, error: animalsError } = await supabase
          .from('animals')
          .select('id, name, ad_status, published_at, expires_at')
          .neq('ad_status', 'draft');

        if (animalsError) {
          throw animalsError;
        }

        const eligibleAnimals = (animalsData || []).filter((animal) => {
          const publishedAt = animal.published_at ? new Date(animal.published_at).getTime() : 0;
          const expiresAt = animal.expires_at ? new Date(animal.expires_at).getTime() : Number.POSITIVE_INFINITY;
          const rangeStart = new Date(periodRange.start).getTime();
          const rangeEnd = new Date(periodRange.end).getTime();

          return publishedAt < rangeEnd && expiresAt >= rangeStart;
        });

        const eligibleAnimalIds = eligibleAnimals.map((animal) => animal.id);
        const animalNameMap = new Map(eligibleAnimals.map((animal) => [animal.id, animal.name]));

        const [
          animalImpressionsResult,
          animalClicksResult,
          eventImpressionsResult,
          eventClicksResult,
          articleImpressionsResult,
          articleClicksResult,
        ] = await Promise.all([
          eligibleAnimalIds.length > 0
            ? supabase
                .from('impressions')
                .select('content_id')
                .eq('content_type', 'animal')
                .in('content_id', eligibleAnimalIds)
                .gte('created_at', periodRange.start)
                .lt('created_at', periodRange.end)
            : Promise.resolve({ data: [], error: null }),
          eligibleAnimalIds.length > 0
            ? supabase
                .from('clicks')
                .select('content_id')
                .eq('content_type', 'animal')
                .in('content_id', eligibleAnimalIds)
                .gte('created_at', periodRange.start)
                .lt('created_at', periodRange.end)
            : Promise.resolve({ data: [], error: null }),
          supabase
            .from('impressions')
            .select('*', { count: 'exact', head: true })
            .eq('content_type', 'event')
            .gte('created_at', periodRange.start)
            .lt('created_at', periodRange.end),
          supabase
            .from('clicks')
            .select('*', { count: 'exact', head: true })
            .eq('content_type', 'event')
            .gte('created_at', periodRange.start)
            .lt('created_at', periodRange.end),
          supabase
            .from('impressions')
            .select('*', { count: 'exact', head: true })
            .eq('content_type', 'article')
            .gte('created_at', periodRange.start)
            .lt('created_at', periodRange.end),
          supabase
            .from('clicks')
            .select('*', { count: 'exact', head: true })
            .eq('content_type', 'article')
            .gte('created_at', periodRange.start)
            .lt('created_at', periodRange.end),
        ]);

        if (animalImpressionsResult.error) throw animalImpressionsResult.error;
        if (animalClicksResult.error) throw animalClicksResult.error;
        if (eventImpressionsResult.error) throw eventImpressionsResult.error;
        if (eventClicksResult.error) throw eventClicksResult.error;
        if (articleImpressionsResult.error) throw articleImpressionsResult.error;
        if (articleClicksResult.error) throw articleClicksResult.error;

        const animalImpressions = animalImpressionsResult.data || [];
        const animalClicks = animalClicksResult.data || [];
        const impressionMap = new Map<string, number>();
        const clickMap = new Map<string, number>();

        animalImpressions.forEach((row) => {
          impressionMap.set(row.content_id, (impressionMap.get(row.content_id) || 0) + 1);
        });

        animalClicks.forEach((row) => {
          clickMap.set(row.content_id, (clickMap.get(row.content_id) || 0) + 1);
        });

        const topAnimals = Array.from(impressionMap.entries())
          .sort(([, left], [, right]) => right - left)
          .slice(0, 10)
          .map(([animalId, impressionCount]) => {
            const clickCount = clickMap.get(animalId) || 0;
            return {
              id: animalId,
              name: animalNameMap.get(animalId) || 'Animal',
              impressionCount,
              clickCount,
              clickRate: impressionCount > 0 ? (clickCount / impressionCount) * 100 : 0,
            };
          });

        const impressionsByType: Record<string, number> = {
          animal: animalImpressions.length,
          event: eventImpressionsResult.count || 0,
          article: articleImpressionsResult.count || 0,
        };

        const clicksByType: Record<string, number> = {
          animal: animalClicks.length,
          event: eventClicksResult.count || 0,
          article: articleClicksResult.count || 0,
        };

        setData({
          siteVisits: pageVisits.filter((visit) => visit.page_key === 'site_access').length,
          uniqueSiteVisitors: new Set(
            pageVisits.filter((visit) => visit.page_key === 'site_access').map((visit) => visit.session_id)
          ).size,
          homeVisits: pageVisits.filter((visit) => visit.page_key === 'home').length,
          uniqueHomeVisitors: new Set(
            pageVisits.filter((visit) => visit.page_key === 'home').map((visit) => visit.session_id)
          ).size,
          totalImpressions: CONTENT_TYPES.reduce((sum, type) => sum + (impressionsByType[type] || 0), 0),
          totalClicks: CONTENT_TYPES.reduce((sum, type) => sum + (clicksByType[type] || 0), 0),
          impressionsByType,
          clicksByType,
          topAnimals,
          trafficSeries,
        });
      } catch (err) {
        console.error('Erro ao carregar metricas de visitas:', err);
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchVisitMetrics();
  }, [period, periodRange]);

  const clickRate = useMemo(() => {
    if (!data || data.totalImpressions === 0) {
      return '0.0';
    }

    return ((data.totalClicks / data.totalImpressions) * 100).toFixed(1);
  }, [data]);

  return {
    data,
    clickRate,
    isLoading,
    error,
  };
};
