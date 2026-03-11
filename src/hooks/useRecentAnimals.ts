// Hook para buscar animais recém-publicados (dados REAIS do Supabase)
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface Animal {
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
  published_at: string;
  is_boosted: boolean;
}

export const useRecentAnimals = (limit: number = 10) => {
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchRecentAnimals = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('animals')
          .select('*')
          .eq('ad_status', 'active')
          .order('published_at', { ascending: false })
          .limit(limit);

        if (fetchError) throw fetchError;

        setAnimals(data || []);
      } catch (err) {
        console.error('Error fetching recent animals:', err);
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecentAnimals();
  }, [limit]);

  return { animals, isLoading, error };
};


