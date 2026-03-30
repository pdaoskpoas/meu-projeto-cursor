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

const normalizeAnimals = (records: Record<string, unknown>[]): AnimalWithStats[] =>
  (records || []).map((record) => ({
    ...(record as unknown as AnimalWithStats),
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

      const { data, error: fetchError } = await buildBaseQuery()
        .order('impression_count', { ascending: false })
        .limit(limit);

      if (fetchError) throw fetchError;
      setAnimals(normalizeAnimals(data || []));
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
    let debounceTimer: ReturnType<typeof setTimeout>;
    const debouncedFetch = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(fetchTopAnimals, 500);
    };

    const makeErrorHandler = (label: string, channelRef: { current: ReturnType<typeof supabase.channel> | null }) =>
      (status: string, err?: Error) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.warn(`[TopAnimals-${gender}] ${label} subscription falhou:`, status, err);
          setTimeout(() => channelRef.current?.subscribe(), 2000);
        }
      };

    const clicksRef: { current: ReturnType<typeof supabase.channel> | null } = { current: null };
    const animalsRef: { current: ReturnType<typeof supabase.channel> | null } = { current: null };

    clicksRef.current = supabase
      .channel(`top-${gender}-${period}-impressions`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'impressions', filter: 'content_type=eq.animal' },
        debouncedFetch
      )
      .subscribe(makeErrorHandler('impressions', clicksRef));

    animalsRef.current = supabase
      .channel(`top-${gender}-${period}-animals`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'animals' }, debouncedFetch)
      .subscribe(makeErrorHandler('animals', animalsRef));

    return () => {
      clearTimeout(debounceTimer);
      if (clicksRef.current) supabase.removeChannel(clicksRef.current);
      if (animalsRef.current) supabase.removeChannel(animalsRef.current);
    };
  }, [fetchTopAnimals, gender, period]);

  return { animals, isLoading, error, refresh: fetchTopAnimals };
};
