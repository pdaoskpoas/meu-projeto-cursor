import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { partnershipService } from '@/services/partnershipService';

interface DailyData {
  name: string;
  views: number;
  clicks: number;
}

interface MonthlyData {
  month: string;
  impressions: number;
  clicks: number;
}

interface AnimalPerformance {
  name: string;
  views: number;
  clicks: number;
  ctr: number;
}

export const useStatsCharts = (activePeriod: 'all' | 'month' | 'year') => {
  const { user } = useAuth();
  const [weeklyData, setWeeklyData] = useState<DailyData[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [topAnimals, setTopAnimals] = useState<AnimalPerformance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    const fetchChartData = async () => {
      try {
        setLoading(true);

        // Buscar animais do usuário + sociedades
        const userAnimals = await partnershipService.getUserAnimalsWithPartnerships(user.id);

        const animalIds = userAnimals?.map(a => a.id) || [];
        const animalMap = new Map(userAnimals?.map(a => [a.id, a.name]) || []);

        if (animalIds.length === 0) {
          setWeeklyData([]);
          setMonthlyData([]);
          setTopAnimals([]);
          setLoading(false);
          return;
        }

        // DADOS SEMANAIS (últimos 7 dias)
        await fetchWeeklyData(animalIds);

        // DADOS MENSAIS/ANUAIS
        await fetchPeriodicData(animalIds, activePeriod);

        // TOP 5 ANIMAIS POR PERFORMANCE
        await fetchTopAnimals(animalIds, animalMap);

        setLoading(false);
      } catch (error) {
        console.error('Erro ao buscar dados dos gráficos:', error);
        setLoading(false);
      }
    };

    fetchChartData();
  }, [user?.id, activePeriod]);

  const fetchWeeklyData = async (animalIds: string[]) => {
    const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const today = new Date();

    // ✅ OTIMIZAÇÃO: Criar todas as promises e executar em paralelo
    const dailyPromises = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      // Adicionar ambas as queries (views e clicks) ao array de promises
      dailyPromises.push(
        Promise.all([
          // Buscar impressões do dia
          supabase
            .from('impressions')
            .select('*', { count: 'exact', head: true })
            .eq('content_type', 'animal')
            .in('content_id', animalIds)
            .gte('created_at', date.toISOString())
            .lt('created_at', nextDate.toISOString()),
          
          // Buscar cliques do dia
          supabase
            .from('clicks')
            .select('*', { count: 'exact', head: true })
            .eq('content_type', 'animal')
            .in('content_id', animalIds)
            .gte('created_at', date.toISOString())
            .lt('created_at', nextDate.toISOString()),
          
          // Passar o nome do dia junto
          Promise.resolve(dayNames[date.getDay()])
        ])
      );
    }

    // Executar todas as queries em paralelo
    const results = await Promise.all(dailyPromises);
    
    // Construir o array de dados a partir dos resultados
    const weekData: DailyData[] = results.map(([viewsResult, clicksResult, dayName]) => ({
      name: dayName,
      views: viewsResult.count || 0,
      clicks: clicksResult.count || 0
    }));

    setWeeklyData(weekData);
  };

  const fetchPeriodicData = async (animalIds: string[], period: 'all' | 'month' | 'year') => {
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    // Determinar quantos meses mostrar baseado no período
    const monthsToShow = period === 'year' ? 12 : 6;

    // ✅ OTIMIZAÇÃO: Criar todas as promises e executar em paralelo
    const monthlyPromises = [];

    for (let i = monthsToShow - 1; i >= 0; i--) {
      const monthDate = new Date(currentYear, currentMonth - i, 1);
      const nextMonthDate = new Date(currentYear, currentMonth - i + 1, 1);

      // Adicionar ambas as queries (impressions e clicks) ao array de promises
      monthlyPromises.push(
        Promise.all([
          // Buscar impressões do mês
          supabase
            .from('impressions')
            .select('*', { count: 'exact', head: true })
            .eq('content_type', 'animal')
            .in('content_id', animalIds)
            .gte('created_at', monthDate.toISOString())
            .lt('created_at', nextMonthDate.toISOString()),
          
          // Buscar cliques do mês
          supabase
            .from('clicks')
            .select('*', { count: 'exact', head: true })
            .eq('content_type', 'animal')
            .in('content_id', animalIds)
            .gte('created_at', monthDate.toISOString())
            .lt('created_at', nextMonthDate.toISOString()),
          
          // Passar o nome do mês junto
          Promise.resolve(monthNames[monthDate.getMonth()])
        ])
      );
    }

    // Executar todas as queries em paralelo
    const results = await Promise.all(monthlyPromises);
    
    // Construir o array de dados a partir dos resultados
    const periodicData: MonthlyData[] = results.map(([impressionsResult, clicksResult, monthName]) => ({
      month: monthName,
      impressions: impressionsResult.count || 0,
      clicks: clicksResult.count || 0
    }));

    setMonthlyData(periodicData);
  };

  const fetchTopAnimals = async (animalIds: string[], animalMap: Map<string, string>) => {
    // ✅ OTIMIZAÇÃO: Buscar dados de todos os animais em paralelo
    const animalPromises = animalIds.map(animalId =>
      Promise.all([
        // Buscar impressões
        supabase
          .from('impressions')
          .select('*', { count: 'exact', head: true })
          .eq('content_type', 'animal')
          .eq('content_id', animalId),
        
        // Buscar cliques
        supabase
          .from('clicks')
          .select('*', { count: 'exact', head: true })
          .eq('content_type', 'animal')
          .eq('content_id', animalId),
        
        // Passar o ID junto
        Promise.resolve(animalId)
      ])
    );

    // Executar todas as queries em paralelo
    const results = await Promise.all(animalPromises);

    // Converter para array e calcular CTR
    const performanceData: AnimalPerformance[] = results
      .filter(([viewsResult, clicksResult]) => 
        (viewsResult.count || 0) > 0 || (clicksResult.count || 0) > 0
      )
      .map(([viewsResult, clicksResult, animalId]) => {
        const name = animalMap.get(animalId) || 'Animal';
        const views = viewsResult.count || 0;
        const clicks = clicksResult.count || 0;
        const ctr = views > 0 ? Math.round((clicks / views) * 100) : 0;
        
        return {
          name,
          views,
          clicks,
          ctr
        };
      });

    // Ordenar por visualizações e pegar top 5
    performanceData.sort((a, b) => b.views - a.views);
    setTopAnimals(performanceData.slice(0, 5));
  };

  return {
    weeklyData,
    monthlyData,
    topAnimals,
    loading
  };
};

