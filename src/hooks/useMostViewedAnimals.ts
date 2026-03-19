// Hook para buscar animais mais visualizados (com React Query + sessão resiliente)
import { useQuery } from '@tanstack/react-query';
import { animalService } from '@/services/animalService';
import { queryWithSession } from '@/lib/queryWithSession';

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

export const useMostViewedAnimals = (limit: number = 10, _period: 'all' | 'month' = 'all') => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['most-viewed-animals', limit],
    queryFn: () => queryWithSession(() => animalService.getMostViewedAnimals(limit)),
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 5000),
  });

  return {
    animals: (data ?? []) as AnimalWithStats[],
    isLoading,
    error: error as Error | null,
  };
};
