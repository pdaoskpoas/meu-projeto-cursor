import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Eye, MousePointerClick, Calendar, TrendingUp, TrendingDown, FileText } from 'lucide-react';
import { useArticleMonthlyViews, ArticleMonthlyViewsData } from '@/hooks/admin/useArticleMonthlyViews';
import { useAdminArticles } from '@/hooks/admin/useAdminArticles';

interface NewsDetailedReportProps {
  className?: string;
}

const NewsDetailedReport: React.FC<NewsDetailedReportProps> = ({ className }) => {
  const [selectedArticleId, setSelectedArticleId] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<number | undefined>(undefined);
  const [selectedMonth, setSelectedMonth] = useState<number | undefined>(undefined);
  const { articles } = useAdminArticles();
  const { data, isLoading, error } = useArticleMonthlyViews(
    selectedArticleId === 'all' ? undefined : selectedArticleId,
    selectedYear,
    selectedMonth
  );

  // Extrair anos disponíveis dos dados
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    data.forEach((article) => {
      article.monthlyData.forEach((month) => {
        years.add(month.year);
      });
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [data]);

  // Extrair meses disponíveis dos dados (filtrados por ano se selecionado)
  const availableMonths = useMemo(() => {
    const months = new Map<number, string>();
    data.forEach((article) => {
      article.monthlyData.forEach((month) => {
        // Se um ano estiver selecionado, mostrar apenas meses daquele ano
        if (selectedYear && month.year !== selectedYear) {
          return;
        }
        months.set(month.month, month.monthName);
      });
    });
    return Array.from(months.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([month, monthName]) => ({ month, monthName }));
  }, [data, selectedYear]);

  // Lista de meses para o seletor
  const monthOptions = [
    { value: 1, label: 'Janeiro' },
    { value: 2, label: 'Fevereiro' },
    { value: 3, label: 'Março' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Maio' },
    { value: 6, label: 'Junho' },
    { value: 7, label: 'Julho' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Setembro' },
    { value: 10, label: 'Outubro' },
    { value: 11, label: 'Novembro' },
    { value: 12, label: 'Dezembro' },
  ];

  // Filtrar dados baseado no artigo selecionado
  const filteredData = useMemo(() => {
    if (selectedArticleId === 'all') {
      return data;
    }
    return data.filter((item) => item.articleId === selectedArticleId);
  }, [data, selectedArticleId]);

  // Calcular totais
  const totals = useMemo(() => {
    return filteredData.reduce(
      (acc, article) => {
        acc.totalViews += article.totalViews;
        acc.totalClicks += article.totalClicks;
        acc.articlesCount += 1;
        return acc;
      },
      { totalViews: 0, totalClicks: 0, articlesCount: 0 }
    );
  }, [filteredData]);

  // Calcular média de CTR
  const averageCTR = useMemo(() => {
    if (totals.totalViews === 0) return 0;
    return (totals.totalClicks / totals.totalViews) * 100;
  }, [totals]);

  // Agrupar dados por mês/ano para visualização
  const monthlySummary = useMemo(() => {
    const summary = new Map<string, { views: number; clicks: number; articles: Set<string> }>();

    filteredData.forEach((article) => {
      article.monthlyData.forEach((month) => {
        const key = `${month.year}-${month.month}`;
        if (!summary.has(key)) {
          summary.set(key, { views: 0, clicks: 0, articles: new Set() });
        }
        const entry = summary.get(key)!;
        entry.views += month.views;
        entry.clicks += month.clicks;
        entry.articles.add(article.articleId);
      });
    });

    return Array.from(summary.entries())
      .map(([key, value]) => {
        const [year, month] = key.split('-').map(Number);
        const monthName = filteredData
          .flatMap((a) => a.monthlyData)
          .find((m) => m.year === year && m.month === month)?.monthName || '';
        
        return {
          year,
          month,
          monthName,
          views: value.views,
          clicks: value.clicks,
          articlesCount: value.articles.size,
        };
      })
      .sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return b.month - a.month;
      });
  }, [filteredData]);

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('pt-BR').format(num);
  };

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <p className="text-red-600 mb-2">Erro ao carregar relatório</p>
            <p className="text-sm text-gray-500">{error.message}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Relatório Detalhado de Visualizações
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Filtrar por Notícia
              </label>
              <Select value={selectedArticleId} onValueChange={setSelectedArticleId}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as notícias" />
                </SelectTrigger>
                <SelectContent side="bottom" align="start">
                  <SelectItem value="all">Todas as notícias</SelectItem>
                  {articles.map((article) => (
                    <SelectItem key={article.id} value={article.id}>
                      {article.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Filtrar por Ano
              </label>
              <Select
                value={selectedYear?.toString() || 'all'}
                onValueChange={(value) => {
                  const newYear = value === 'all' ? undefined : parseInt(value);
                  setSelectedYear(newYear);
                  // Limpar mês selecionado se o ano mudar
                  if (newYear !== selectedYear) {
                    setSelectedMonth(undefined);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os anos" />
                </SelectTrigger>
                <SelectContent side="bottom" align="start">
                  <SelectItem value="all">Todos os anos</SelectItem>
                  {availableYears.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Filtrar por Mês
              </label>
              <Select
                value={selectedMonth?.toString() || 'all'}
                onValueChange={(value) =>
                  setSelectedMonth(value === 'all' ? undefined : parseInt(value))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os meses" />
                </SelectTrigger>
                <SelectContent side="bottom" align="start">
                  <SelectItem value="all">Todos os meses</SelectItem>
                  {monthOptions.map((month) => (
                    <SelectItem key={month.value} value={month.value.toString()}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumo Geral */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total de Visualizações</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    formatNumber(totals.totalViews)
                  )}
                </p>
              </div>
              <Eye className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total de Cliques</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    formatNumber(totals.totalClicks)
                  )}
                </p>
              </div>
              <MousePointerClick className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Taxa de Cliques (CTR)</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    `${averageCTR.toFixed(2)}%`
                  )}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Notícias Analisadas</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    formatNumber(totals.articlesCount)
                  )}
                </p>
              </div>
              <FileText className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resumo Mensal */}
      {monthlySummary.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Resumo por Mês/Ano
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Ano</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Mês</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">
                      Visualizações
                    </th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Cliques</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">CTR</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">
                      Notícias
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {monthlySummary.map((month, index) => {
                    const ctr = month.views > 0 ? (month.clicks / month.views) * 100 : 0;
                    const previousMonth = monthlySummary[index + 1];
                    const viewsChange =
                      previousMonth && previousMonth.views > 0
                        ? ((month.views - previousMonth.views) / previousMonth.views) * 100
                        : 0;

                    return (
                      <tr key={`${month.year}-${month.month}`} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">{month.year}</td>
                        <td className="py-3 px-4">{month.monthName}</td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {formatNumber(month.views)}
                            {viewsChange !== 0 && (
                              <span
                                className={`text-xs flex items-center ${
                                  viewsChange > 0 ? 'text-green-600' : 'text-red-600'
                                }`}
                              >
                                {viewsChange > 0 ? (
                                  <TrendingUp className="h-3 w-3" />
                                ) : (
                                  <TrendingDown className="h-3 w-3" />
                                )}
                                {Math.abs(viewsChange).toFixed(1)}%
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">{formatNumber(month.clicks)}</td>
                        <td className="py-3 px-4 text-right">{ctr.toFixed(2)}%</td>
                        <td className="py-3 px-4 text-right">{month.articlesCount}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detalhamento por Notícia */}
      {filteredData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Detalhamento por Notícia</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {filteredData.map((article) => (
                <div key={article.articleId} className="border rounded-lg p-4">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">{article.articleTitle}</h3>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        Total: {formatNumber(article.totalViews)} visualizações
                      </span>
                      <span className="flex items-center gap-1">
                        <MousePointerClick className="h-4 w-4" />
                        Total: {formatNumber(article.totalClicks)} cliques
                      </span>
                      <span>
                        CTR: {article.totalViews > 0 ? ((article.totalClicks / article.totalViews) * 100).toFixed(2) : 0}%
                      </span>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-gray-50">
                          <th className="text-left py-2 px-3 font-medium text-gray-700">Ano</th>
                          <th className="text-left py-2 px-3 font-medium text-gray-700">Mês</th>
                          <th className="text-right py-2 px-3 font-medium text-gray-700">
                            Visualizações
                          </th>
                          <th className="text-right py-2 px-3 font-medium text-gray-700">Cliques</th>
                          <th className="text-right py-2 px-3 font-medium text-gray-700">CTR</th>
                        </tr>
                      </thead>
                      <tbody>
                        {article.monthlyData.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="text-center py-4 text-gray-500">
                              Nenhum dado disponível para este período
                            </td>
                          </tr>
                        ) : (
                          article.monthlyData.map((month) => {
                            const ctr = month.views > 0 ? (month.clicks / month.views) * 100 : 0;
                            return (
                              <tr key={`${month.year}-${month.month}`} className="border-b">
                                <td className="py-2 px-3">{month.year}</td>
                                <td className="py-2 px-3">{month.monthName}</td>
                                <td className="py-2 px-3 text-right">
                                  {formatNumber(month.views)}
                                </td>
                                <td className="py-2 px-3 text-right">
                                  {formatNumber(month.clicks)}
                                </td>
                                <td className="py-2 px-3 text-right">{ctr.toFixed(2)}%</td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {!isLoading && filteredData.length === 0 && (
        <Card>
          <CardContent className="p-12">
            <div className="text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 font-medium">Nenhum dado disponível</p>
              <p className="text-sm text-gray-500 mt-2">
                Não há visualizações registradas para os filtros selecionados.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default NewsDetailedReport;
