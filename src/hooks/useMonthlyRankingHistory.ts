import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { normalizeSupabaseImages } from '@/utils/animalCard';

export interface MonthlyRankingEntry {
  year: number;
  month: number;
  monthName: string;
  category: 'Garanhão' | 'Doadora' | 'Potro' | 'Potra';
  animalId: string;
  animalName: string;
  animalImages: string[];
  adStatus: string;
}

export interface MonthlyRankingData {
  year: number;
  months: {
    month: number;
    monthName: string;
    isCurrentMonth?: boolean;
    categories: {
      category: 'Garanhão' | 'Doadora' | 'Potro' | 'Potra';
      animalId: string;
      animalName: string;
      animalImages: string[];
      viewsCount?: number;
      adStatus: string;
    }[];
  }[];
}

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export const useMonthlyRankingHistory = (year?: number) => {
  const [data, setData] = useState<MonthlyRankingData[]>([]);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchCurrentMonthLiveRanking = useCallback(async () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    // Deriva categoria pelo campo category, com fallback em gender + idade
    const deriveCategory = (
      cat: string | null,
      gender: string | null,
      birthDate: string | null
    ): 'Garanhão' | 'Doadora' | 'Potro' | 'Potra' => {
      if (cat === 'Garanhão' || cat === 'Doadora' || cat === 'Potro' || cat === 'Potra') {
        return cat;
      }
      const ageYears = birthDate
        ? Math.floor((Date.now() - new Date(birthDate).getTime()) / (365.25 * 24 * 3600 * 1000))
        : 99;
      if (gender === 'Macho') return ageYears < 4 ? 'Potro' : 'Garanhão';
      return ageYears < 4 ? 'Potra' : 'Doadora';
    };

    const buildEntries = (rows: Record<string, unknown>[]) => {
      const usedCategories = new Set<string>();
      const entries: {
        category: 'Garanhão' | 'Doadora' | 'Potro' | 'Potra';
        animalId: string;
        animalName: string;
        animalImages: string[];
        viewsCount: number;
        adStatus: string;
      }[] = [];

      for (const a of rows) {
        if (entries.length >= 4) break;
        const cat = deriveCategory(
          a.category as string | null,
          a.gender as string | null,
          (a.birth_date ?? a.birthDate) as string | null
        );
        if (!usedCategories.has(cat)) {
          usedCategories.add(cat);
          entries.push({
            category: cat,
            animalId: a.id as string,
            animalName: (a.name as string) ?? '',
            animalImages: normalizeSupabaseImages(a),
            viewsCount: (a.impression_count ?? a.impressions ?? 0) as number,
            adStatus: (a.ad_status ?? 'active') as string,
          });
        }
      }
      return entries;
    };

    // Tenta primeiro via tabela impressions (filtrada por mês)
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const { data: monthImpressions } = await supabase
      .from('impressions')
      .select('content_id')
      .eq('content_type', 'animal')
      .gte('created_at', startOfMonth)
      .limit(10000);

    if (monthImpressions && monthImpressions.length > 0) {
      const countMap: Record<string, number> = {};
      for (const row of monthImpressions) {
        countMap[row.content_id] = (countMap[row.content_id] || 0) + 1;
      }
      const topIds = Object.entries(countMap)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 200)
        .map(([id]) => id);

      const { data: animalRows } = await supabase
        .from('animals')
        .select('id, name, images, category, gender, birth_date, ad_status')
        .in('id', topIds)
        .eq('ad_status', 'active');

      if (animalRows && animalRows.length > 0) {
        const sorted = [...animalRows].sort(
          (a, b) => (countMap[b.id] || 0) - (countMap[a.id] || 0)
        );
        const entries = buildEntries(sorted as Record<string, unknown>[]);
        if (entries.length > 0) {
          return {
            year: currentYear,
            month: currentMonth,
            monthName: MONTH_NAMES[currentMonth - 1],
            categories: entries,
            isCurrentMonth: true as const,
          };
        }
      }
    }

    // Fallback: usa animals_with_stats (sempre acessível) ordenado por impressions
    const { data: statsRows, error: statsError } = await supabase
      .from('animals_with_stats')
      .select('id, name, images, category, gender, birth_date, ad_status, impression_count')
      .eq('ad_status', 'active')
      .order('impression_count', { ascending: false })
      .limit(100);

    if (statsError || !statsRows || statsRows.length === 0) return null;

    const entries = buildEntries(statsRows as unknown as Record<string, unknown>[]);
    if (entries.length === 0) return null;

    return {
      year: currentYear,
      month: currentMonth,
      monthName: MONTH_NAMES[currentMonth - 1],
      categories: entries,
      isCurrentMonth: true as const,
    };
  }, []);

  const fetchAvailableYears = useCallback(async () => {
    try {
      const { data: yearsData, error: yearsError } = await supabase
        .rpc('get_available_ranking_years');

      if (yearsError) {
        console.error('Error fetching available years:', yearsError);
        throw yearsError;
      }

      // A função retorna TABLE, então o Supabase retorna array de objetos { year: number }
      let years: number[] = [];
      
      if (Array.isArray(yearsData)) {
        years = yearsData
          .map((item: any) => {
            // Pode vir como { year: number } ou diretamente como number
            if (typeof item === 'object' && item !== null) {
              return item.year || item.Year || null;
            }
            return typeof item === 'number' ? item : null;
          })
          .filter((year: any): year is number => 
            typeof year === 'number' && !isNaN(year) && year > 0
          )
          .sort((a, b) => b - a); // Ordenar do mais recente para o mais antigo
      }

      setAvailableYears(years);
    } catch (err) {
      console.error('Error fetching available years:', err);
      setAvailableYears([]);
    }
  }, []);

  const fetchRankingHistory = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data: rankingData, error: rankingError } = await supabase
        .rpc('get_monthly_ranking_history', { p_year: year || null });

      if (rankingError) {
        console.warn('[MonthlyRanking] RPC falhou, tentando apenas mês atual:', rankingError);
      }

      // Normalizar imagens
      const normalizedEntries: MonthlyRankingEntry[] = ((rankingError ? [] : rankingData) || []).map((entry: any) => ({
        year: entry.year,
        month: entry.month,
        monthName: entry.month_name || entry.monthName || '',
        category: entry.category,
        animalId: entry.animal_id || entry.animalId,
        animalName: entry.animal_name || entry.animalName,
        animalImages: normalizeSupabaseImages({ images: entry.animal_images || entry.animalImages }),
        adStatus: entry.ad_status || entry.adStatus || 'inactive'
      }));

      // Agrupar por ano e mês
      const groupedByYear = new Map<number, Map<number, MonthlyRankingEntry[]>>();

      normalizedEntries.forEach((entry) => {
        if (!groupedByYear.has(entry.year)) {
          groupedByYear.set(entry.year, new Map());
        }
        const yearMap = groupedByYear.get(entry.year)!;
        
        if (!yearMap.has(entry.month)) {
          yearMap.set(entry.month, []);
        }
        yearMap.get(entry.month)!.push(entry);
      });

      // Converter para estrutura final
      const result: MonthlyRankingData[] = Array.from(groupedByYear.entries())
        .map(([yr, monthsMap]) => ({
          year: yr,
          months: Array.from(monthsMap.entries())
            .map(([month, entries]) => ({
              month,
              monthName: entries[0]?.monthName || '',
              categories: entries.map((entry) => ({
                category: entry.category,
                animalId: entry.animalId,
                animalName: entry.animalName,
                animalImages: entry.animalImages,
                adStatus: entry.adStatus
              }))
            }))
            .sort((a, b) => b.month - a.month) // Meses mais recentes primeiro
        }))
        .sort((a, b) => b.year - a.year); // Anos mais recentes primeiro

      // Adicionar mês atual como "em andamento" se não estiver nos dados fechados
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;

      if (!year || year === currentYear) {
        const currentYearEntry = result.find((y) => y.year === currentYear);
        const hasCurrentMonth = currentYearEntry?.months.some((m) => m.month === currentMonth);

        if (!hasCurrentMonth) {
          const liveData = await fetchCurrentMonthLiveRanking();
          if (liveData) {
            if (currentYearEntry) {
              currentYearEntry.months.unshift(liveData);
            } else {
              result.unshift({ year: currentYear, months: [liveData] });
            }
          }
        }
      }

      setData(result);
    } catch (err) {
      console.error('Error fetching monthly ranking history:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [year, fetchCurrentMonthLiveRanking]);

  useEffect(() => {
    fetchAvailableYears();
  }, [fetchAvailableYears]);

  useEffect(() => {
    fetchRankingHistory();
  }, [fetchRankingHistory]);

  return {
    data,
    availableYears,
    isLoading,
    error,
    refresh: fetchRankingHistory
  };
};
