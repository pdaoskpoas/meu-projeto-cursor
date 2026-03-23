import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      retry: 1,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10_000),
      refetchOnWindowFocus: false,
      refetchOnReconnect: 'always',
    },
    mutations: {
      retry: 0,
    },
  },
});

/**
 * Invalida todos os caches relacionados a animais.
 * Chamar após criar, deletar ou atualizar um animal.
 */
export const invalidateAnimalCaches = () => {
  queryClient.invalidateQueries({ queryKey: ['featured-animals'] });
  queryClient.invalidateQueries({ queryKey: ['recent-animals'] });
  queryClient.invalidateQueries({ queryKey: ['most-viewed-animals'] });
};
