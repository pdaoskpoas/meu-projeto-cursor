import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { slugify, generateUniqueSlug } from '@/utils/slugify';

export interface AdminArticle {
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
  scheduledPublishAt?: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  views?: number;
  clicks?: number;
  likes?: number;
  shares?: number;
}

export const useAdminArticles = () => {
  const [articles, setArticles] = useState<AdminArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchArticles = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('articles')
        .select(`
          *,
          author:profiles(name)
        `)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      // Buscar estatísticas de cliques para cada artigo
      const articlesWithStats = await Promise.all(
        (data || []).map(async (article) => {
          // Buscar cliques do artigo
          const { count: clicksCount } = await supabase
            .from('clicks')
            .select('*', { count: 'exact', head: true })
            .eq('content_type', 'article')
            .eq('content_id', article.id);

          return {
            ...article,
            clicks: clicksCount || 0,
          };
        })
      );

      const mappedArticles: AdminArticle[] = articlesWithStats.map(article => ({
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
        scheduledPublishAt: article.scheduled_publish_at,
        isPublished: article.is_published || false,
        createdAt: article.created_at,
        updatedAt: article.updated_at,
        views: article.views || 0, // Já vem da tabela articles
        clicks: article.clicks || 0, // Calculado da tabela clicks
        likes: 0, // TODO: Add likes functionality
        shares: 0, // TODO: Add shares functionality
      }));

      setArticles(mappedArticles);
    } catch (err) {
      console.error('Error fetching admin articles:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  const createArticle = async (articleData: Partial<AdminArticle>) => {
    try {
      // Gerar slug único
      const baseSlug = slugify(articleData.title || '');
      const existingSlugs = articles.map(a => a.slug).filter(Boolean) as string[];
      const uniqueSlug = generateUniqueSlug(baseSlug, existingSlugs);

      // Determinar data de publicação
      let publishedAt = null;
      if (articleData.isPublished) {
        publishedAt = new Date().toISOString();
      } else if (articleData.scheduledPublishAt) {
        publishedAt = null; // Será publicado pelo scheduler
      }

      const { data, error: insertError } = await supabase
        .from('articles')
        .insert({
          title: articleData.title,
          slug: uniqueSlug,
          content: articleData.content,
          excerpt: articleData.excerpt,
          author_id: articleData.authorId,
          category: articleData.category,
          tags: articleData.tags || [],
          cover_image_url: articleData.coverImageUrl,
          is_published: articleData.isPublished || false,
          published_at: publishedAt,
          scheduled_publish_at: articleData.scheduledPublishAt || null,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      await fetchArticles();
      return data;
    } catch (err) {
      console.error('Error creating article:', err);
      throw err;
    }
  };

  const updateArticle = async (articleId: string, updates: Partial<AdminArticle>) => {
    try {
      // Atualizar slug se título mudou
      let slug = updates.slug;
      if (updates.title && !slug) {
        const baseSlug = slugify(updates.title);
        const existingSlugs = articles
          .filter(a => a.id !== articleId)
          .map(a => a.slug)
          .filter(Boolean) as string[];
        slug = generateUniqueSlug(baseSlug, existingSlugs);
      }

      // Determinar data de publicação
      let publishedAt = updates.publishedAt;
      if (updates.isPublished && !publishedAt) {
        publishedAt = new Date().toISOString();
      }

      const { error: updateError } = await supabase
        .from('articles')
        .update({
          title: updates.title,
          slug: slug,
          content: updates.content,
          excerpt: updates.excerpt,
          category: updates.category,
          tags: updates.tags,
          cover_image_url: updates.coverImageUrl,
          is_published: updates.isPublished,
          published_at: publishedAt,
          scheduled_publish_at: updates.scheduledPublishAt || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', articleId);

      if (updateError) throw updateError;

      await fetchArticles();
      return true;
    } catch (err) {
      console.error('Error updating article:', err);
      throw err;
    }
  };

  const deleteArticle = async (articleId: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('articles')
        .delete()
        .eq('id', articleId);

      if (deleteError) throw deleteError;

      await fetchArticles();
      return true;
    } catch (err) {
      console.error('Error deleting article:', err);
      throw err;
    }
  };

  return {
    articles,
    isLoading,
    error,
    refetch: fetchArticles,
    createArticle,
    updateArticle,
    deleteArticle,
  };
};




