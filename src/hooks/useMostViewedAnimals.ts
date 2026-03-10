// Hook para buscar animais mais visualizados (dados REAIS do Supabase)
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

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
  images: string[];
  titles: string[];
  impression_count: number;
}

export const useMostViewedAnimals = (limit: number = 10, period: 'all' | 'month' = 'all') => {
  const [animals, setAnimals] = useState<AnimalWithStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchMostViewedAnimals = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Buscar da view que já calcula impressões
        let query = supabase
          .from('animals_with_stats')
          .select('*')
          .eq('ad_status', 'active')
          .order('impression_count', { ascending: false })
          .limit(limit);

        // Se período é 'month', filtrar últimos 30 dias
        if (period === 'month') {
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          query = query.gte('published_at', thirtyDaysAgo.toISOString());
        }

        const { data, error: fetchError } = await query;

        if (fetchError) throw fetchError;

        setAnimals(data || []);
      } catch (err) {
        console.error('Error fetching most viewed animals:', err);
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMostViewedAnimals();
  }, [limit, period]);

  return { animals, isLoading, error };
};


