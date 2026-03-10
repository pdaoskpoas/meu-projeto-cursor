/**
 * React Query Hooks para Artigos
 * Implementa cache e otimizações de performance
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { newsService, type Article } from '@/services/newsService';

// Tipo para filtros de artigos
interface ArticleFilters {
  category?: string;
  limit?: number;
  offset?: number;
  [key: string]: unknown;
}

// Keys para cache
export const articleKeys = {
  all: ['articles'] as const,
  lists: () => [...articleKeys.all, 'list'] as const,
  list: (filters?: ArticleFilters) => [...articleKeys.lists(), filters] as const,
  details: () => [...articleKeys.all, 'detail'] as const,
  detail: (slug: string) => [...articleKeys.details(), slug] as const,
  popular: (limit: number) => [...articleKeys.all, 'popular', limit] as const,
};

/**
 * Hook para buscar artigos publicados
 */
export const usePublishedArticles = (filters?: ArticleFilters) => {
  return useQuery({
    queryKey: articleKeys.list(filters),
    queryFn: () => newsService.getPublishedArticles(filters),
    staleTime: 1000 * 60 * 5, // Cache por 5 minutos
    gcTime: 1000 * 60 * 30, // Limpar após 30 minutos
  });
};

/**
 * Hook para buscar artigo por slug
 */
export const useArticleBySlug = (slug: string) => {
  return useQuery({
    queryKey: articleKeys.detail(slug),
    queryFn: () => newsService.getArticleBySlug(slug),
    enabled: !!slug,
    staleTime: 1000 * 60 * 10, // Cache por 10 minutos
    retry: 1, // Tentar apenas 1 vez se falhar
  });
};

/**
 * Hook para buscar artigos populares
 */
export const useMostPopularArticles = (limit: number = 5) => {
  return useQuery({
    queryKey: articleKeys.popular(limit),
    queryFn: () => newsService.getMostPopularArticles(limit),
    staleTime: 1000 * 60 * 15, // Cache por 15 minutos (muda menos)
  });
};

/**
 * Hook para incrementar views (mutation)
 */
export const useIncrementViews = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (articleId: string) => newsService.incrementArticleViews(articleId),
    onSuccess: (_, articleId) => {
      // Invalidar cache do artigo para recarregar com views atualizados
      queryClient.invalidateQueries({ queryKey: articleKeys.details() });
    },
  });
};

/**
 * Hook para buscar categorias
 */
export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => newsService.getCategories(),
    staleTime: 1000 * 60 * 60, // Cache por 1 hora (raramente muda)
  });
};

