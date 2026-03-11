import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

/**
 * 🔒 Hook seguro para buscar estatísticas de conteúdo do Supabase
 * Substitui localStorage por queries diretas ao banco de dados
 * 
 * @param contentType - Tipo do conteúdo: 'animal', 'event', 'article'
 * @param contentId - ID do conteúdo
 * @returns Estatísticas de impressões e cliques
 */

export interface ContentStats {
  impressions: number;
  clicks: number;
  clickRate: number;
  isLoading: boolean;
  error: string | null;
}

export const useSupabaseContentStats = (
  contentType: 'animal' | 'event' | 'article',
  contentId: string
): ContentStats => {
  const [stats, setStats] = useState<ContentStats>({
    impressions: 0,
    clicks: 0,
    clickRate: 0,
    isLoading: true,
    error: null
  });

  useEffect(() => {
    if (!contentId) {
      setStats(prev => ({ ...prev, isLoading: false }));
      return;
    }

    let mounted = true;

    const fetchStats = async () => {
      try {
        setStats(prev => ({ ...prev, isLoading: true, error: null }));

        // Buscar impressões
        const { count: impressionsCount, error: impressionsError } = await supabase
          .from('impressions')
          .select('*', { count: 'exact', head: true })
          .eq('content_type', contentType)
          .eq('content_id', contentId);

        if (impressionsError) throw impressionsError;

        // Buscar cliques
        const { count: clicksCount, error: clicksError } = await supabase
          .from('clicks')
          .select('*', { count: 'exact', head: true })
          .eq('content_type', contentType)
          .eq('content_id', contentId);

        if (clicksError) throw clicksError;

        if (!mounted) return;

        const impressions = impressionsCount || 0;
        const clicks = clicksCount || 0;
        const clickRate = impressions > 0 ? (clicks / impressions) * 100 : 0;

        setStats({
          impressions,
          clicks,
          clickRate: Math.round(clickRate * 100) / 100,
          isLoading: false,
          error: null
        });

      } catch (error: unknown) {
        if (!mounted) return;
        
        console.error('Error fetching content stats:', error);
        const message = error instanceof Error ? error.message : 'Erro ao carregar estatísticas';
        setStats({
          impressions: 0,
          clicks: 0,
          clickRate: 0,
          isLoading: false,
          error: message
        });
      }
    };

    fetchStats();

    return () => {
      mounted = false;
    };
  }, [contentType, contentId]);

  return stats;
};

/**
 * 🔒 Hook seguro para buscar estatísticas agregadas de todos os animais
 * Usado em dashboards e rankings
 */
export interface AnimalStatsMap {
  [animalId: string]: {
    impressions: number;
    clicks: number;
    clickRate: number;
  };
}

export const useSupabaseAllAnimalsStats = () => {
  const [allStats, setAllStats] = useState<AnimalStatsMap>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAllStats = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Buscar todas as impressões de animais
      const { data: impressionsData, error: impressionsError } = await supabase
        .from('impressions')
        .select('content_id')
        .eq('content_type', 'animal');

      if (impressionsError) throw impressionsError;

      // Buscar todos os cliques de animais
      const { data: clicksData, error: clicksError } = await supabase
        .from('clicks')
        .select('content_id')
        .eq('content_type', 'animal');

      if (clicksError) throw clicksError;

      // Agregar dados por animal
      const statsMap: AnimalStatsMap = {};

      // Contar impressões
      impressionsData?.forEach(item => {
        if (!statsMap[item.content_id]) {
          statsMap[item.content_id] = { impressions: 0, clicks: 0, clickRate: 0 };
        }
        statsMap[item.content_id].impressions++;
      });

      // Contar cliques
      clicksData?.forEach(item => {
        if (!statsMap[item.content_id]) {
          statsMap[item.content_id] = { impressions: 0, clicks: 0, clickRate: 0 };
        }
        statsMap[item.content_id].clicks++;
      });

      // Calcular taxa de clique
      Object.keys(statsMap).forEach(animalId => {
        const stats = statsMap[animalId];
        stats.clickRate = stats.impressions > 0 
          ? Math.round((stats.clicks / stats.impressions) * 100 * 100) / 100
          : 0;
      });

      setAllStats(statsMap);
      setIsLoading(false);

    } catch (error: unknown) {
      console.error('Error fetching all animals stats:', error);
      const message = error instanceof Error ? error.message : 'Erro ao carregar estatísticas';
      setError(message);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllStats();
  }, []);

  const getTotalStats = () => {
    const totals = { impressions: 0, clicks: 0, clickRate: 0 };
    
    Object.values(allStats).forEach(stats => {
      totals.impressions += stats.impressions;
      totals.clicks += stats.clicks;
    });
    
    totals.clickRate = totals.impressions > 0 
      ? Math.round((totals.clicks / totals.impressions) * 100 * 100) / 100
      : 0;
    
    return totals;
  };

  return {
    allStats,
    isLoading,
    error,
    getTotalStats,
    refreshStats: fetchAllStats
  };
};

/**
 * 🔒 Hook seguro para buscar top conteúdos (ranking)
 * Substitui useMonthlyStats com dados reais do Supabase
 */
export interface TopContentItem {
  contentId: string;
  impressions: number;
  clicks: number;
  clickRate: number;
}

export const useSupabaseTopContent = (
  contentType: 'animal' | 'event' | 'article',
  limit: number = 10,
  timeframe: 'day' | 'week' | 'month' | 'all' = 'month'
) => {
  const [topContent, setTopContent] = useState<TopContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTopContent = async () => {
      try {
        setIsLoading(true);

        // Calcular data de corte baseado no timeframe
        const now = new Date();
        let cutoffDate = new Date(0); // Início dos tempos (para 'all')

        switch (timeframe) {
          case 'day':
            cutoffDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            break;
          case 'week':
            cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case 'month':
            cutoffDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
        }

        // Buscar impressões no período
        const { data: impressionsData, error: impressionsError } = await supabase
          .from('impressions')
          .select('content_id')
          .eq('content_type', contentType)
          .gte('created_at', cutoffDate.toISOString());

        if (impressionsError) throw impressionsError;

        // Buscar cliques no período
        const { data: clicksData, error: clicksError } = await supabase
          .from('clicks')
          .select('content_id')
          .eq('content_type', contentType)
          .gte('created_at', cutoffDate.toISOString());

        if (clicksError) throw clicksError;

        // Agregar por content_id
        const contentMap = new Map<string, TopContentItem>();

        impressionsData?.forEach(item => {
          if (!contentMap.has(item.content_id)) {
            contentMap.set(item.content_id, {
              contentId: item.content_id,
              impressions: 0,
              clicks: 0,
              clickRate: 0
            });
          }
          contentMap.get(item.content_id)!.impressions++;
        });

        clicksData?.forEach(item => {
          if (!contentMap.has(item.content_id)) {
            contentMap.set(item.content_id, {
              contentId: item.content_id,
              impressions: 0,
              clicks: 0,
              clickRate: 0
            });
          }
          contentMap.get(item.content_id)!.clicks++;
        });

        // Calcular clickRate e ordenar
        const sortedContent = Array.from(contentMap.values())
          .map(item => ({
            ...item,
            clickRate: item.impressions > 0 
              ? Math.round((item.clicks / item.impressions) * 100 * 100) / 100
              : 0
          }))
          .sort((a, b) => {
            // Ordenar por cliques (mais relevante)
            if (b.clicks !== a.clicks) return b.clicks - a.clicks;
            // Desempate por impressões
            return b.impressions - a.impressions;
          })
          .slice(0, limit);

        setTopContent(sortedContent);
        setIsLoading(false);

      } catch (error) {
        console.error('Error fetching top content:', error);
        setTopContent([]);
        setIsLoading(false);
      }
    };

    fetchTopContent();
  }, [contentType, limit, timeframe]);

  return {
    topContent,
    isLoading
  };
};





