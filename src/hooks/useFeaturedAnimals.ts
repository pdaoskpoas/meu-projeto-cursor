// Hook para buscar animais em destaque (com React Query + sessão resiliente)
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
  const { data, isLoading, error } = useQuery({
    queryKey: ['featured-animals', limit],
    queryFn: () => queryWithSession(() => animalService.getFeaturedAnimals(limit)),
    staleTime: 60_000,       // 1 min — dados de destaque não mudam a cada segundo
    gcTime: 5 * 60_000,      // 5 min em cache
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
