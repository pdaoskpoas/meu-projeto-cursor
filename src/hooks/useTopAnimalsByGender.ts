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

      // Mês atual: usar RPC SECURITY DEFINER para bypassar RLS de impressions
      // A RPC retorna apenas animal_id + contagem, sem expor dados individuais
      const { data: rankingData, error: rankError } = await supabase
        .rpc('get_top_animals_by_impressions', {
          p_gender: gender,
          p_limit: limit,
        });

      if (rankError) throw rankError;

      if (!rankingData || rankingData.length === 0) {
        // Sem dados no mês ainda: fallback para all-time mas sem exibir contagem
        const { data: fallback, error: fbError } = await buildBaseQuery()
          .order('impression_count', { ascending: false })
          .limit(limit);
        if (fbError) throw fbError;
        const withoutCount = (fallback || []).map(a => ({
          ...(a as Record<string, unknown>),
          impressions: 0,
        }));
        setAnimals(normalizeAnimals(withoutCount));
        return;
      }

      // Montar mapa de impressões do mês a partir da RPC
      const countMap: Record<string, number> = {};
      const topIds: string[] = [];
      for (const row of rankingData as { animal_id: string; impressions: number }[]) {
        countMap[row.animal_id] = row.impressions;
        topIds.push(row.animal_id);
      }

      // Buscar dados completos dos animais rankeados
      const { data, error: fetchError } = await buildBaseQuery().in('id', topIds);

      if (fetchError) throw fetchError;

      // Ordenar pela contagem de impressões do mês (mesmo ordem da RPC)
      const sorted = (data || [])
        .sort((a, b) => {
          const aId = (a as Record<string, unknown>).id as string;
          const bId = (b as Record<string, unknown>).id as string;
          return (countMap[bId] || 0) - (countMap[aId] || 0);
        });

      // Substituir impressions pelo count do mês para exibição correta no badge
      const enriched = sorted.map(a => ({
        ...(a as Record<string, unknown>),
        impressions: countMap[(a as Record<string, unknown>).id as string] || 0,
      }));

      setAnimals(normalizeAnimals(enriched));
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
