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
    categories: {
      category: 'Garanhão' | 'Doadora' | 'Potro' | 'Potra';
      animalId: string;
      animalName: string;
      animalImages: string[];
      viewsCount: number;
      adStatus: string;
    }[];
  }[];
}

export const useMonthlyRankingHistory = (year?: number) => {
  const [data, setData] = useState<MonthlyRankingData[]>([]);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

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

      if (rankingError) throw rankingError;

      // Normalizar imagens
      const normalizedEntries: MonthlyRankingEntry[] = (rankingData || []).map((entry: any) => ({
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
        .map(([year, monthsMap]) => ({
          year,
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

      setData(result);
    } catch (err) {
      console.error('Error fetching monthly ranking history:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [year]);

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
