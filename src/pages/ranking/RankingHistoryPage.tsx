import React, { useState } from 'react';
import { Trophy, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import BackButton from '@/components/ui/BackButton';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMonthlyRankingHistory } from '@/hooks/useMonthlyRankingHistory';
import RankingHistoryCard from './RankingHistoryCard';
import { AnimalCardSkeletonGrid } from '@/components/ui/skeletons/AnimalCardSkeleton';
const RankingHistoryPage = () => {
  const [selectedYear, setSelectedYear] = useState<number | undefined>(undefined);
  const { data, availableYears, isLoading, error } = useMonthlyRankingHistory(selectedYear);

  const handleYearChange = (value: string) => {
    if (value === 'all') {
      setSelectedYear(undefined);
    } else {
      setSelectedYear(parseInt(value, 10));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
        {/* Header */}
        <div className="flex items-center mb-8 sm:mb-12">
          <BackButton fallbackPath="/" variant="ghost" showLabel={false} className="h-10 w-10 rounded-full mr-4" />
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
              Ranking Histórico
            </h1>
            <p className="text-sm sm:text-base text-slate-600">
              Histórico mensal dos animais que mais receberam visualizações
            </p>
          </div>
        </div>

        {/* Filtro por Ano */}
        <Card className="p-4 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-slate-600" />
              <label className="text-sm font-medium text-slate-700">
                Filtrar por ano:
              </label>
            </div>
            <Select
              value={selectedYear?.toString() || 'all'}
              onValueChange={handleYearChange}
            >
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Todos os anos" />
              </SelectTrigger>
              <SelectContent side="bottom" align="start" avoidCollisions={false}>
                <SelectItem value="all">Todos os anos</SelectItem>
                {availableYears.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Conteúdo */}
        {error && (
          <Card className="p-8 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trophy className="h-8 w-8 text-red-500" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Erro ao carregar dados
              </h3>
              <p className="text-slate-600">
                {error.message || 'Ocorreu um erro ao buscar o histórico de rankings.'}
              </p>
            </div>
          </Card>
        )}

        {isLoading && (
          <div className="space-y-8">
            <AnimalCardSkeletonGrid count={6} />
          </div>
        )}

        {!isLoading && !error && data.length === 0 && (
          <Card className="p-8 sm:p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trophy className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Nenhum ranking encontrado
              </h3>
              <p className="text-slate-600">
                {selectedYear
                  ? `Não há registros de ranking para o ano de ${selectedYear}.`
                  : 'Ainda não há registros de ranking histórico.'}
              </p>
            </div>
          </Card>
        )}

        {!isLoading && !error && data.length > 0 && (
          <div className="space-y-12">
            {data.map((yearData) => (
              <div key={yearData.year} className="space-y-6">
                {/* Título do Ano */}
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-300 to-transparent" />
                    <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
                      {yearData.year}
                    </h2>
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-300 to-transparent" />
                  </div>
                  <p className="text-center text-slate-600 text-sm sm:text-base">
                    Animais mais acessados em {yearData.year}
                  </p>
                </div>

                {/* Meses */}
                {yearData.months.map((monthData) => (
                  <div key={`${yearData.year}-${monthData.month}`} className="space-y-4">
                    {/* Título do Mês */}
                    <div className="space-y-1">
                      <h3 className="text-xl sm:text-2xl font-semibold text-slate-800">
                        Destaques de {monthData.monthName}
                      </h3>
                      <p className="text-sm text-slate-600">
                        Mais acessados em {monthData.monthName} de {yearData.year}
                      </p>
                    </div>

                    {/* Cards por Categoria */}
                    {monthData.categories.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                        {monthData.categories.map((categoryData) => (
                          <RankingHistoryCard
                            key={`${yearData.year}-${monthData.month}-${categoryData.category}`}
                            animalId={categoryData.animalId}
                            animalName={categoryData.animalName}
                            animalImages={categoryData.animalImages}
                            category={categoryData.category}
                            monthName={monthData.monthName}
                            year={yearData.year}
                            adStatus={categoryData.adStatus}
                          />
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500 italic">
                        Nenhum registro disponível para este mês.
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RankingHistoryPage;
