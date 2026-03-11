import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ProtectedRoute from '@/components/ProtectedRoute';
import ModernDashboardWrapper from '@/components/layout/ModernDashboardWrapper';
import { BarChart3, TrendingUp, Eye, MousePointerClick, Heart, Zap, Award, Activity, Calendar, Loader2 } from 'lucide-react';
import { useUserStats } from '@/hooks/useUserStats';
import { useStatsCharts } from '@/hooks/useStatsCharts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';

const StatsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [activePeriod, setActivePeriod] = useState<'all' | 'month' | 'year'>('month');
  const stats = useUserStats();
  const {
    weeklyData,
    monthlyData,
    topAnimals,
    loading: chartsLoading,
    error: chartsError,
    refresh: refreshCharts
  } = useStatsCharts(activePeriod);

  // Função helper para obter valores baseados no período
  const getStatsByPeriod = () => {
    switch (activePeriod) {
      case 'month':
        return {
          views: stats.monthlyViews,
          clicks: stats.monthlyClicks,
          clickRate: stats.monthlyClickRate,
          label: 'Este Mês'
        };
      case 'year':
        return {
          views: stats.yearlyViews,
          clicks: stats.yearlyClicks,
          clickRate: stats.yearlyClickRate,
          label: 'Este Ano'
        };
      case 'all':
      default:
        return {
          views: stats.totalViews,
          clicks: stats.totalClicks,
          clickRate: stats.clickRate,
          label: 'Geral'
        };
    }
  };

  const periodStats = getStatsByPeriod();

  // Calcular tendências baseadas nos dados reais
  const calculateTrend = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  // Calcular tendência de crescimento
  const viewsTrend = monthlyData.length >= 2 
    ? calculateTrend(
        monthlyData[monthlyData.length - 1]?.impressions || 0,
        monthlyData[monthlyData.length - 2]?.impressions || 0
      )
    : 0;

  const clicksTrend = monthlyData.length >= 2
    ? calculateTrend(
        monthlyData[monthlyData.length - 1]?.clicks || 0,
        monthlyData[monthlyData.length - 2]?.clicks || 0
      )
    : 0;

  const chartConfig = {
    views: {
      label: 'Visualizações',
      color: 'hsl(var(--primary))',
    },
    clicks: {
      label: 'Cliques',
      color: 'hsl(var(--accent))',
    },
    impressions: {
      label: 'Impressões',
      color: 'hsl(220 68% 36%)',
    },
  };

  // Mostrar loading enquanto os dados estão carregando
  if (stats.loading || chartsLoading) {
    return (
      <ProtectedRoute>
        <ModernDashboardWrapper
          title="Estatísticas"
          subtitle="Acompanhe o desempenho dos seus animais e anúncios em tempo real"
        >
          <div className="flex items-center justify-center h-64">
            <div className="text-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
              <p className="text-gray-600">Carregando estatísticas...</p>
            </div>
          </div>
        </ModernDashboardWrapper>
      </ProtectedRoute>
    );
  }

  if (stats.error || chartsError) {
    const errorMessage = stats.error || chartsError || 'Erro ao carregar estatísticas.';

    return (
      <ProtectedRoute>
        <ModernDashboardWrapper
          title="Estatísticas"
          subtitle="Acompanhe o desempenho dos seus animais e anúncios em tempo real"
        >
          <Card className="p-6 space-y-4">
            <div className="text-center text-red-600">{errorMessage}</div>
            <div className="flex justify-center gap-3">
              <Button onClick={() => stats.refresh()} variant="outline">
                Recarregar métricas
              </Button>
              <Button onClick={() => refreshCharts()} variant="outline">
                Recarregar gráficos
              </Button>
            </div>
          </Card>
        </ModernDashboardWrapper>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <ModernDashboardWrapper
        title="Estatísticas"
        subtitle="Acompanhe o desempenho dos seus animais e anúncios em tempo real"
      >
        <div className="space-y-6">
          {/* Seletor de Período */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Resumo de Desempenho</h2>
              <p className="text-sm text-gray-600">Selecione o período para visualizar as métricas</p>
            </div>
            
            <div className="flex gap-2 bg-white border border-gray-200 rounded-lg p-1 shadow-sm">
              <Button
                size="sm"
                variant={activePeriod === 'month' ? 'default' : 'ghost'}
                onClick={() => setActivePeriod('month')}
                className={activePeriod === 'month' ? 'bg-blue-600 hover:bg-blue-700' : ''}
              >
                <Calendar className="h-4 w-4 mr-1" />
                Mês
              </Button>
              <Button
                size="sm"
                variant={activePeriod === 'year' ? 'default' : 'ghost'}
                onClick={() => setActivePeriod('year')}
                className={activePeriod === 'year' ? 'bg-blue-600 hover:bg-blue-700' : ''}
              >
                <Calendar className="h-4 w-4 mr-1" />
                Ano
              </Button>
              <Button
                size="sm"
                variant={activePeriod === 'all' ? 'default' : 'ghost'}
                onClick={() => setActivePeriod('all')}
                className={activePeriod === 'all' ? 'bg-blue-600 hover:bg-blue-700' : ''}
              >
                <BarChart3 className="h-4 w-4 mr-1" />
                Geral
              </Button>
            </div>
          </div>

          {/* Cards de Resumo */}
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <Card className="p-6 border-0 shadow-card hover:shadow-elevated transition-all bg-gradient-to-br from-white to-blue-50/30">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
                  <Eye className="h-6 w-6 text-white" />
                </div>
                {viewsTrend !== 0 && (
                  <Badge className={viewsTrend > 0 ? "bg-green-100 text-green-700 border-0" : "bg-red-100 text-red-700 border-0"}>
                    <TrendingUp className="h-3 w-3 mr-1" />
                    {viewsTrend > 0 ? '+' : ''}{viewsTrend}%
                  </Badge>
                )}
              </div>
              <p className="text-sm text-gray-600 font-medium mb-1">Visualizações ({periodStats.label})</p>
              <p className="text-3xl font-bold text-gray-900">{periodStats.views.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-2">
                {activePeriod === 'all' && `Últimos 30 dias: ${stats.monthlyViews.toLocaleString()}`}
                {activePeriod === 'month' && `Média diária: ${Math.floor(stats.monthlyViews / 30).toLocaleString()}`}
                {activePeriod === 'year' && `Média mensal: ${Math.floor(stats.yearlyViews / 12).toLocaleString()}`}
              </p>
            </Card>

            <Card className="p-6 border-0 shadow-card hover:shadow-elevated transition-all bg-gradient-to-br from-white to-yellow-50/30">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center shadow-md">
                  <MousePointerClick className="h-6 w-6 text-white" />
                </div>
                {clicksTrend !== 0 && (
                  <Badge className={clicksTrend > 0 ? "bg-green-100 text-green-700 border-0" : "bg-red-100 text-red-700 border-0"}>
                    <TrendingUp className="h-3 w-3 mr-1" />
                    {clicksTrend > 0 ? '+' : ''}{clicksTrend}%
                  </Badge>
                )}
              </div>
              <p className="text-sm text-gray-600 font-medium mb-1">Cliques ({periodStats.label})</p>
              <p className="text-3xl font-bold text-gray-900">{periodStats.clicks.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-2">Taxa de clique: {periodStats.clickRate.toFixed(1)}%</p>
            </Card>

            <Card className="p-6 border-0 shadow-card hover:shadow-elevated transition-all bg-gradient-to-br from-white to-purple-50/30">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <Badge className="bg-purple-100 text-purple-700 border-0">
                  Ativos
                </Badge>
              </div>
              <p className="text-sm text-gray-600 font-medium mb-1">Boosts Ativos</p>
              <p className="text-3xl font-bold text-gray-900">{stats.activeBoosts}</p>
              <p className="text-xs text-gray-500 mt-2">Disponíveis: {stats.availableBoosts}</p>
            </Card>

            <Card className="p-6 border-0 shadow-card hover:shadow-elevated transition-all bg-gradient-to-br from-white to-green-50/30">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-md">
                  <Activity className="h-6 w-6 text-white" />
                </div>
                <Badge className="bg-blue-100 text-blue-700 border-0">
                  {stats.activeAnimals} de {stats.totalAnimals}
                </Badge>
              </div>
              <p className="text-sm text-gray-600 font-medium mb-1">Animais Ativos</p>
              <p className="text-3xl font-bold text-gray-900">{stats.activeAnimals}</p>
              <p className="text-xs text-gray-500 mt-2">Total cadastrados: {stats.totalAnimals}</p>
            </Card>
          </div>

          {/* Tabs com Gráficos */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 bg-muted/50">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Visão Geral
              </TabsTrigger>
              <TabsTrigger value="animals" className="flex items-center gap-2">
                <Award className="h-4 w-4" />
                Por Animal
              </TabsTrigger>
              <TabsTrigger value="performance" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Performance
              </TabsTrigger>
            </TabsList>

            {/* Visão Geral */}
            <TabsContent value="overview" className="space-y-6">
              {/* Gráfico de Visualizações e Cliques (7 dias) - Somente no período "Mês" */}
              {activePeriod === 'month' && (
                <Card className="p-6 border-0 shadow-card">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Visualizações e Cliques</h3>
                      <p className="text-sm text-gray-600">Últimos 7 dias (Mês Atual)</p>
                    </div>
                    <Badge className="bg-blue-50 text-blue-700 border border-blue-200">
                      <Calendar className="h-3 w-3 mr-1" />
                      Semanal
                    </Badge>
                  </div>
                
                <ChartContainer config={chartConfig} className="h-[300px] w-full">
                  <AreaChart data={weeklyData}>
                    <defs>
                      <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="name" 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area 
                      type="monotone" 
                      dataKey="views" 
                      stroke="hsl(var(--primary))" 
                      fillOpacity={1} 
                      fill="url(#colorViews)"
                      strokeWidth={2}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="clicks" 
                      stroke="hsl(var(--accent))" 
                      fillOpacity={1} 
                      fill="url(#colorClicks)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ChartContainer>
                </Card>
              )}

              {/* Gráfico de Crescimento Mensal - Exibir em "Mês" ou "Ano" */}
              {(activePeriod === 'month' || activePeriod === 'year') && (
                <Card className="p-6 border-0 shadow-card">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">
                        {activePeriod === 'month' ? 'Crescimento Mensal' : 'Crescimento Anual'}
                      </h3>
                      <p className="text-sm text-gray-600">Comparativo de impressões e cliques</p>
                    </div>
                  {viewsTrend > 0 && (
                    <Badge className="bg-green-50 text-green-700 border border-green-200">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      +{viewsTrend}%
                    </Badge>
                  )}
                </div>
                
                <ChartContainer config={chartConfig} className="h-[300px] w-full">
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="month" 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="impressions" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="clicks" fill="hsl(var(--accent))" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ChartContainer>
                </Card>
              )}

              {/* Gráfico de Evolução Histórica - Somente em "Geral" */}
              {activePeriod === 'all' && (
                <Card className="p-6 border-0 shadow-card">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Evolução Histórica</h3>
                      <p className="text-sm text-gray-600">Todos os dados desde o início</p>
                    </div>
                    <Badge className="bg-purple-50 text-purple-700 border border-purple-200">
                      <Activity className="h-3 w-3 mr-1" />
                      Histórico Completo
                    </Badge>
                  </div>
                  
                  <ChartContainer config={chartConfig} className="h-[300px] w-full">
                    <LineChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="month" 
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                      />
                      <YAxis 
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line 
                        type="monotone" 
                        dataKey="impressions" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={3}
                        dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="clicks" 
                        stroke="hsl(var(--accent))" 
                        strokeWidth={3}
                        dot={{ fill: 'hsl(var(--accent))', r: 4 }}
                      />
                    </LineChart>
                  </ChartContainer>
                </Card>
              )}
            </TabsContent>

            {/* Por Animal */}
            <TabsContent value="animals" className="space-y-6">
              <Card className="p-6 border-0 shadow-card">
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-gray-900">Top 5 Animais - Performance</h3>
                  <p className="text-sm text-gray-600">Animais com melhor desempenho</p>
                </div>
                
                <ChartContainer config={chartConfig} className="h-[300px] w-full">
                  <BarChart data={topAnimals} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      width={80}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="views" fill="hsl(var(--primary))" radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ChartContainer>
              </Card>

              {/* Lista detalhada */}
              <Card className="p-6 border-0 shadow-card">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Detalhamento por Animal</h3>
                {topAnimals.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>Nenhum dado disponível ainda.</p>
                    <p className="text-sm mt-2">Comece cadastrando animais e gerando visualizações.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {topAnimals.map((animal, index) => (
                    <div 
                      key={animal.name}
                      className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-transparent rounded-lg hover:from-blue-50 transition-all border border-gray-100"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold shadow-md">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{animal.name}</p>
                          <p className="text-sm text-gray-600">CTR: {animal.ctr}%</p>
                        </div>
                      </div>
                      <div className="flex gap-6 text-right">
                        <div>
                          <p className="text-xs text-gray-600">Visualizações</p>
                          <p className="text-lg font-bold text-blue-600">{animal.views}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Cliques</p>
                          <p className="text-lg font-bold text-yellow-600">{animal.clicks}</p>
                        </div>
                      </div>
                    </div>
                    ))}
                  </div>
                )}
              </Card>
            </TabsContent>

            {/* Performance */}
            <TabsContent value="performance" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Taxa de Conversão */}
                <Card className="p-6 border-0 shadow-card">
                  <div className="mb-6">
                    <h3 className="text-lg font-bold text-gray-900">Taxa de Conversão</h3>
                    <p className="text-sm text-gray-600">Cliques vs Visualizações</p>
                  </div>
                  
                  <div className="flex items-center justify-center h-40">
                    <div className="text-center">
                      <div className="relative inline-flex">
                        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                          <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center">
                            <div>
                              <p className="text-4xl font-bold text-blue-600">{stats.clickRate.toFixed(1)}%</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mt-4">Taxa de Clique (CTR)</p>
                    </div>
                  </div>
                </Card>

                {/* Engajamento */}
                <Card className="p-6 border-0 shadow-card">
                  <div className="mb-6">
                    <h3 className="text-lg font-bold text-gray-900">Métricas de Engajamento</h3>
                    <p className="text-sm text-gray-600">Resumo geral</p>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Eye className="h-5 w-5 text-blue-600" />
                        <span className="font-medium text-gray-700">Impressões Totais</span>
                      </div>
                      <span className="text-xl font-bold text-blue-600">{stats.totalViews}</span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <MousePointerClick className="h-5 w-5 text-yellow-600" />
                        <span className="font-medium text-gray-700">Cliques Totais</span>
                      </div>
                      <span className="text-xl font-bold text-yellow-600">{stats.totalClicks}</span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <TrendingUp className="h-5 w-5 text-green-600" />
                        <span className="font-medium text-gray-700">Taxa Média</span>
                      </div>
                      <span className="text-xl font-bold text-green-600">{stats.clickRate.toFixed(1)}%</span>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Tendência de Crescimento */}
              <Card className="p-6 border-0 shadow-card">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Tendência de Crescimento</h3>
                    <p className="text-sm text-gray-600">Evolução ao longo do tempo</p>
                  </div>
                  <Badge className="bg-green-50 text-green-700 border border-green-200">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    Crescendo
                  </Badge>
                </div>
                
                  <ChartContainer config={chartConfig} className="h-[250px] w-full">
                    <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="month" 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line 
                      type="monotone" 
                      dataKey="impressions" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={3}
                      dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="clicks" 
                      stroke="hsl(var(--accent))" 
                      strokeWidth={3}
                      dot={{ fill: 'hsl(var(--accent))', r: 4 }}
                    />
                  </LineChart>
                </ChartContainer>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </ModernDashboardWrapper>
    </ProtectedRoute>
  );
};

export default StatsPage;

