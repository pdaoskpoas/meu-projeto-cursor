/**
 * News Service
 * 
 * Serviço para gerenciar artigos e notícias do sistema.
 * Usado por páginas públicas (NewsPage, ArticlePage).
 * 
 * Para operações administrativas, use useAdminArticles hook.
 * 
 * @author Sistema de Notícias
 * @date 17/11/2025
 */

import { supabase } from '@/lib/supabase';
import { logSupabaseOperation, handleSupabaseError } from '@/lib/supabase-helpers';

export interface Article {
  id: string;
  title: string;
  slug?: string;
  content: string;
  excerpt?: string;
  authorId?: string;
  authorName?: string;
  category?: string;
  tags: string[];
  coverImageUrl?: string;
  publishedAt?: string;
  isPublished: boolean;
  views: number;
  createdAt: string;
  updatedAt: string;
}

export interface ArticleFilters {
  category?: string;
  tags?: string[];
  search?: string;
  limit?: number;
  offset?: number;
}

class NewsService {
  /**
   * Buscar todos os artigos publicados
   */
  async getPublishedArticles(filters?: ArticleFilters): Promise<Article[]> {
    try {
      logSupabaseOperation('Get published articles', { filters });

      let query = supabase
        .from('articles')
        .select(`
          *,
          author:profiles(name)
        `)
        .eq('is_published', true)
        .order('published_at', { ascending: false });

      // Aplicar filtros
      if (filters?.category && filters.category !== 'Todas') {
        query = query.eq('category', filters.category);
      }

      if (filters?.search) {
        query = query.or(`title.ilike.%${filters.search}%,content.ilike.%${filters.search}%,excerpt.ilike.%${filters.search}%`);
      }

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      if (filters?.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
      }

      const { data, error } = await query;

      if (error) throw handleSupabaseError(error);

      const articles: Article[] = (data || []).map(article => ({
        id: article.id,
        title: article.title,
        content: article.content,
        excerpt: article.excerpt,
        authorId: article.author_id,
        authorName: article.author?.name || 'Admin',
        category: article.category,
        tags: article.tags || [],
        coverImageUrl: article.cover_image_url,
        publishedAt: article.published_at,
        isPublished: article.is_published,
        views: article.views || 0,
        createdAt: article.created_at,
        updatedAt: article.updated_at,
      }));

      logSupabaseOperation('Get published articles success', { count: articles.length });
      return articles;

    } catch (error) {
      logSupabaseOperation('Get published articles error', null, error);
      throw error;
    }
  }

  /**
   * Buscar artigo por ID
   */
  async getArticleById(id: string): Promise<Article | null> {
    try {
      logSupabaseOperation('Get article by ID', { id });

      const { data, error } = await supabase
        .from('articles')
        .select(`
          *,
          author:profiles(name)
        `)
        .eq('id', id)
        .eq('is_published', true)
        .single();

      if (error) {
        // Se não encontrado, retornar null ao invés de throw
        if (error.code === 'PGRST116') {
          logSupabaseOperation('Article not found', { id });
          return null;
        }
        throw handleSupabaseError(error);
      }

      const article: Article = {
        id: data.id,
        title: data.title,
        slug: data.slug,
        content: data.content,
        excerpt: data.excerpt,
        authorId: data.author_id,
        authorName: data.author?.name || 'Admin',
        category: data.category,
        tags: data.tags || [],
        coverImageUrl: data.cover_image_url,
        publishedAt: data.published_at,
        isPublished: data.is_published,
        views: data.views || 0,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      logSupabaseOperation('Get article by ID success', { id });
      return article;

    } catch (error) {
      logSupabaseOperation('Get article by ID error', { id }, error);
      throw error;
    }
  }

  /**
   * Buscar artigo por slug (SEO-friendly)
   */
  async getArticleBySlug(slug: string): Promise<Article | null> {
    try {
      logSupabaseOperation('Get article by slug', { slug });

      const { data, error } = await supabase
        .from('articles')
        .select(`
          *,
          author:profiles(name)
        `)
        .eq('slug', slug)
        .eq('is_published', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          logSupabaseOperation('Article not found by slug', { slug });
          return null;
        }
        throw handleSupabaseError(error);
      }

      const article: Article = {
        id: data.id,
        title: data.title,
        slug: data.slug,
        content: data.content,
        excerpt: data.excerpt,
        authorId: data.author_id,
        authorName: data.author?.name || 'Admin',
        category: data.category,
        tags: data.tags || [],
        coverImageUrl: data.cover_image_url,
        publishedAt: data.published_at,
        isPublished: data.is_published,
        views: data.views || 0,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      logSupabaseOperation('Get article by slug success', { slug });
      return article;

    } catch (error) {
      logSupabaseOperation('Get article by slug error', { slug }, error);
      throw error;
    }
  }

  /**
   * Incrementar contador de views de um artigo
   */
  async incrementArticleViews(id: string): Promise<void> {
    try {
      logSupabaseOperation('Increment article views', { id });

      const { error } = await supabase.rpc('increment_article_views', {
        article_id: id
      });

      // Se a função RPC não existir, fazer update manual
      if (error && error.code === '42883') {
        console.warn('RPC function not found, using manual update');
        
        const { error: updateError } = await supabase
          .from('articles')
          .update({ 
            views: supabase.raw('views + 1') 
          })
          .eq('id', id);

        if (updateError) throw handleSupabaseError(updateError);
      } else if (error) {
        throw handleSupabaseError(error);
      }

      logSupabaseOperation('Increment article views success', { id });

    } catch (error) {
      logSupabaseOperation('Increment article views error', { id }, error);
      // Não falhar se erro ao incrementar views
      console.error('Error incrementing article views:', error);
    }
  }

  /**
   * Buscar artigos mais populares (por views)
   */
  async getMostPopularArticles(limit: number = 5): Promise<Article[]> {
    try {
      logSupabaseOperation('Get most popular articles', { limit });

      const { data, error } = await supabase
        .from('articles')
        .select(`
          *,
          author:profiles(name)
        `)
        .eq('is_published', true)
        .order('views', { ascending: false })
        .limit(limit);

      if (error) throw handleSupabaseError(error);

      const articles: Article[] = (data || []).map(article => ({
        id: article.id,
        title: article.title,
        slug: article.slug,
        content: article.content,
        excerpt: article.excerpt,
        authorId: article.author_id,
        authorName: article.author?.name || 'Admin',
        category: article.category,
        tags: article.tags || [],
        coverImageUrl: article.cover_image_url,
        publishedAt: article.published_at,
        isPublished: article.is_published,
        views: article.views || 0,
        createdAt: article.created_at,
        updatedAt: article.updated_at,
      }));

      logSupabaseOperation('Get most popular articles success', { count: articles.length });
      return articles;

    } catch (error) {
      logSupabaseOperation('Get most popular articles error', null, error);
      throw error;
    }
  }

  /**
   * Buscar artigos por categoria
   */
  async getArticlesByCategory(category: string, limit?: number): Promise<Article[]> {
    return this.getPublishedArticles({ category, limit });
  }

  /**
   * Buscar artigos recentes
   */
  async getRecentArticles(limit: number = 10): Promise<Article[]> {
    return this.getPublishedArticles({ limit });
  }

  /**
   * Buscar categorias disponíveis
   */
  async getCategories(): Promise<string[]> {
    try {
      logSupabaseOperation('Get article categories');

      const { data, error } = await supabase
        .from('articles')
        .select('category')
        .eq('is_published', true)
        .not('category', 'is', null);

      if (error) throw handleSupabaseError(error);

      // Obter categorias únicas
      const categories = [...new Set(data.map(item => item.category))] as string[];

      logSupabaseOperation('Get article categories success', { count: categories.length });
      return categories;

    } catch (error) {
      logSupabaseOperation('Get article categories error', null, error);
      // Retornar categorias padrão em caso de erro
      return ['Nutrição', 'Raças', 'Reprodução', 'Cuidados', 'Eventos', 'Manejo', 'Saúde', 'Competição'];
    }
  }
}

// Exportar instância singleton
export const newsService = new NewsService();

