// Hook para buscar animais recém-publicados (com React Query + sessão resiliente)
import { useQuery } from '@tanstack/react-query';
import { animalService } from '@/services/animalService';
import { queryWithSession } from '@/lib/queryWithSession';

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
  const { data, isLoading, error } = useQuery({
    queryKey: ['recent-animals', limit],
    queryFn: () => queryWithSession(() => animalService.getRecentAnimals(limit)),
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 5000),
  });

  return {
    animals: (data ?? []) as Animal[],
    isLoading,
    error: error as Error | null,
  };
};
