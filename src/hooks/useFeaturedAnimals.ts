// Hook para buscar animais em destaque (dados REAIS do Supabase)
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface Animal {
  id: string;
  name: string;
  breed: string;
  gender: 'Macho' | 'Fêmea';
  birth_date: string;
  coat: string | null;
  height: number | null;
  weight: number | null;
  current_city: string | null;
  current_state: string | null;
  owner_id: string;
  haras_name: string | null;
  images: string[];
  titles: string[];
  featured: boolean;
  views: number;
  published_at: string;
}

export const useFeaturedAnimals = (limit: number = 10) => {
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchFeaturedAnimals = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('animals')
          .select('*')
          .eq('ad_status', 'active')
          .eq('featured', true)
          .order('published_at', { ascending: false })
          .limit(limit);

        if (fetchError) throw fetchError;

        setAnimals(data || []);
      } catch (err) {
        console.error('Error fetching featured animals:', err);
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeaturedAnimals();
  }, [limit]);

  return { animals, isLoading, error };
};


