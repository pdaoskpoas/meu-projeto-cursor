// Hook para buscar top animais por gênero (dados REAIS do Supabase)
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { normalizeSupabaseImages } from '@/utils/animalCard';

export interface AnimalWithStats {
  id: string;
  name: string;
  breed: string;
  gender: 'Macho' | 'Fêmea';
  birth_date: string;
  coat: string | null;
  current_city: string | null;
  current_state: string | null;
  haras_name: string | null;
  property_name?: string | null;
  images: string[];
  titles?: string[];
  impressions?: number;
  clicks?: number;
  published_at: string;
  ad_status: string;
}

const getStartOfMonth = () => {
  const date = new Date();
  date.setUTCDate(1);
  date.setUTCHours(0, 0, 0, 0);
  return date.toISOString();
};

const normalizeAnimals = (records: Record<string, unknown>[]): AnimalWithStats[] =>
  (records || []).map((record) => ({
    ...record,
    images: normalizeSupabaseImages(record),
  }));

export const useTopAnimalsByGender = (
  gender: 'Macho' | 'Fêmea',
  limit: number = 10,
  period: 'all' | 'month' = 'month'
) => {
  const [animals, setAnimals] = useState<AnimalWithStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const buildBaseQuery = useCallback(
    () =>
      supabase
        .from('animals_with_stats')
        .select('*')
        .eq('ad_status', 'active')
        .eq('gender', gender),
    [gender]
  );

  const fetchTopAnimals = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (period === 'all') {
        const baseQuery = buildBaseQuery();
        const { data, error: fetchError } = await baseQuery
          .order('click_count', { ascending: false })
          .limit(limit);

        if (fetchError) throw fetchError;
        setAnimals(normalizeAnimals(data || []));
        return;
      }

      const startOfMonth = getStartOfMonth();
      const { data: monthlyClicks, error: clicksError } = await supabase
        .from('clicks')
        .select('content_id')
        .eq('content_type', 'animal')
        .gte('created_at', startOfMonth);

      if (clicksError) throw clicksError;

      const counts = new Map<string, number>();
      monthlyClicks?.forEach(({ content_id }) => {
        counts.set(content_id, (counts.get(content_id) || 0) + 1);
      });

      const sortedIds = Array.from(counts.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([id]) => id);

      let orderedAnimals: AnimalWithStats[] = [];

      if (sortedIds.length > 0) {
        const rankedQuery = buildBaseQuery().in('id', sortedIds);
        const { data: ranked, error: rankedError } = await rankedQuery;
        if (rankedError) throw rankedError;

        const rankedMap = new Map(ranked?.map((animal) => [animal.id, animal]));
        orderedAnimals = sortedIds
          .map((id) => rankedMap.get(id))
          .filter(Boolean) as AnimalWithStats[];
      }

      if (orderedAnimals.length < limit) {
        const alreadyIncludedIds = orderedAnimals.map((animal) => animal.id);
        let fallbackQuery = buildBaseQuery();

        if (alreadyIncludedIds.length > 0) {
          fallbackQuery = fallbackQuery.not('id', 'in', `(${alreadyIncludedIds.join(',')})`);
        }

        const { data: fallbackAnimals, error: fallbackError} = await fallbackQuery
          .order('click_count', { ascending: false })
          .limit(limit - orderedAnimals.length);

        if (fallbackError) throw fallbackError;
        orderedAnimals = [...orderedAnimals, ...(fallbackAnimals || [])];
      }

      setAnimals(normalizeAnimals(orderedAnimals).slice(0, limit));
    } catch (err) {
      console.error(`Error fetching top ${gender} animals:`, err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [buildBaseQuery, gender, limit, period]);

  useEffect(() => {
    fetchTopAnimals();
  }, [fetchTopAnimals]);

  useEffect(() => {
    const clicksChannel = supabase
      .channel(`top-${gender}-${period}-clicks`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'clicks', filter: 'content_type=eq.animal' },
        () => fetchTopAnimals()
      )
      .subscribe();

    const animalsChannel = supabase
      .channel(`top-${gender}-${period}-animals`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'animals' }, () => fetchTopAnimals())
      .subscribe();

    return () => {
      supabase.removeChannel(clicksChannel);
      supabase.removeChannel(animalsChannel);
    };
  }, [fetchTopAnimals, gender, period]);

  return { animals, isLoading, error, refresh: fetchTopAnimals };
};
