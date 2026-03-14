import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface ArticleMonthlyView {
  article_id: string;
  article_title: string;
  year: number;
  month: number;
  month_name: string;
  views_count: number;
  clicks_count: number;
}

export interface ArticleMonthlyViewsData {
  articleId: string;
  articleTitle: string;
  monthlyData: {
    year: number;
    month: number;
    monthName: string;
    views: number;
    clicks: number;
  }[];
  totalViews: number;
  totalClicks: number;
}

export const useArticleMonthlyViews = (
  articleId?: string,
  year?: number,
  month?: number
) => {
  const [data, setData] = useState<ArticleMonthlyViewsData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const { data: viewsData, error: viewsError } = await supabase.rpc(
          'get_article_monthly_views',
          {
            p_article_id: articleId || null,
            p_year: year || null,
            p_month: month || null,
          }
        );

        if (viewsError) throw viewsError;

        // Agrupar dados por artigo
        const groupedByArticle = new Map<string, ArticleMonthlyViewsData>();

        (viewsData || []).forEach((row: any) => {
          // Normalizar nomes de campos (snake_case do banco)
          const articleId = row.article_id || row.articleId;
          const articleTitle = row.article_title || row.articleTitle;
          const year = row.year;
          const month = row.month;
          const monthName = row.month_name || row.monthName || '';
          const viewsCount = Number(row.views_count || row.viewsCount || 0);
          const clicksCount = Number(row.clicks_count || row.clicksCount || 0);

          if (!groupedByArticle.has(articleId)) {
            groupedByArticle.set(articleId, {
              articleId,
              articleTitle,
              monthlyData: [],
              totalViews: 0,
              totalClicks: 0,
            });
          }

          const articleData = groupedByArticle.get(articleId)!;
          articleData.monthlyData.push({
            year,
            month,
            monthName,
            views: viewsCount,
            clicks: clicksCount,
          });
          articleData.totalViews += viewsCount;
          articleData.totalClicks += clicksCount;
        });

        // Converter para array e ordenar por total de visualizações
        const result = Array.from(groupedByArticle.values()).sort(
          (a, b) => b.totalViews - a.totalViews
        );

        setData(result);
      } catch (err) {
        console.error('Error fetching article monthly views:', err);
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [articleId, year, month]);

  return { data, isLoading, error };
};
