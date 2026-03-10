import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { downloadCsvSections } from '@/utils/csv';
import { useAdminVisitMetrics } from '@/hooks/admin/useAdminVisitMetrics';
import { Download, Globe, Home, Loader2, MousePointerClick, Users, Eye } from 'lucide-react';

const contentTypes = ['animal', 'event', 'article'] as const;

const AdminStatsVisits: React.FC = () => {
  const [period, setPeriod] = useState<'day' | 'month' | 'year'>('month');
  const [selectedDay, setSelectedDay] = useState(() => new Date().toISOString().slice(0, 10));
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [selectedYear, setSelectedYear] = useState(() => String(new Date().getFullYear()));

  const periodRange = useMemo(() => {
    if (period === 'day') {
      const start = new Date(`${selectedDay}T00:00:00`);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      return { start: start.toISOString(), end: end.toISOString(), label: 'Dia selecionado' };
    }
    if (period === 'year') {
      const start = new Date(`${selectedYear}-01-01T00:00:00`);
      const end = new Date(Number(selectedYear) + 1, 0, 1);
      return { start: start.toISOString(), end: end.toISOString(), label: 'Ano selecionado' };
    }
    const start = new Date(`${selectedMonth}-01T00:00:00`);
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 1);
    return { start: start.toISOString(), end: end.toISOString(), label: 'Mês selecionado' };
  }, [period, selectedDay, selectedMonth, selectedYear]);

  const { data, clickRate, isLoading, error } = useAdminVisitMetrics(period, periodRange);

  const maxTrafficValue = useMemo(
    () => Math.max(1, ...(data?.trafficSeries || []).map((item) => Math.max(item.siteVisits, item.homeVisits))),
    [data?.trafficSeries]
  );

  const handleExport = () => {
    if (!data) {
      return;
    }

    const filename = `relatorio-visitas-${period}-${Date.now()}.csv`;
    downloadCsvSections(filename, [
      {
        title: 'Resumo',
        rows: [
          {
            periodo: periodRange.label,
            inicio: new Date(periodRange.start).toLocaleString('pt-BR'),
            fim: new Date(periodRange.end).toLocaleString('pt-BR'),
            acessos_site: data.siteVisits,
            visitantes_unicos_site: data.uniqueSiteVisitors,
            acessos_home: data.homeVisits,
            visitantes_unicos_home: data.uniqueHomeVisitors,
            impressoes_conteudo: data.totalImpressions,
            cliques_conteudo: data.totalClicks,
            ctr_percentual: clickRate,
          },
        ],
      },
      {
        title: 'Serie de Trafego',
        rows: data.trafficSeries.map((item) => ({
          periodo: item.label,
          acessos_site: item.siteVisits,
          acessos_home: item.homeVisits,
        })),
      },
      {
        title: 'Conteudo por Tipo',
        rows: contentTypes.map((type) => ({
          tipo: type,
          impressoes: data.impressionsByType[type] || 0,
          cliques: data.clicksByType[type] || 0,
        })),
      },
      {
        title: 'Top Anuncios',
        rows: data.topAnimals.map((animal) => ({
          animal: animal.name,
          visualizacoes: animal.impressionCount,
          cliques: animal.clickCount,
          ctr_percentual: animal.clickRate.toFixed(1),
        })),
      },
    ]);
  };

  if (error) {
    return (
      <Card className="p-6 bg-red-50 border-red-200">
        <h3 className="text-lg font-semibold text-red-900 mb-2">Erro ao carregar visitas</h3>
        <p className="text-red-700">{error.message}</p>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-3 text-gray-600">Carregando visitas...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {(['day', 'month', 'year'] as const).map(option => (
            <Button
              key={option}
              variant={period === option ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPeriod(option)}
            >
              {option === 'day' ? 'Dia' : option === 'month' ? 'Mês' : 'Ano'}
            </Button>
          ))}
        </div>
        <div className="flex gap-2">
          {period === 'day' && (
            <Input
              type="date"
              value={selectedDay}
              onChange={(event) => setSelectedDay(event.target.value)}
              className="w-[160px]"
            />
          )}
          {period === 'month' && (
            <Input
              type="month"
              value={selectedMonth}
              onChange={(event) => setSelectedMonth(event.target.value)}
              className="w-[160px]"
            />
          )}
          {period === 'year' && (
            <Input
              type="number"
              min="2020"
              max="2100"
              value={selectedYear}
              onChange={(event) => setSelectedYear(event.target.value)}
              className="w-[110px]"
            />
          )}
        </div>
        <Button onClick={handleExport} variant="outline" className="flex items-center gap-2 self-start">
          <Download className="h-4 w-4" />
          Exportar CSV
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card className="border-sky-200 bg-sky-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-sky-900 flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Acessos ao Site
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{data?.siteVisits.toLocaleString() || 0}</div>
          </CardContent>
        </Card>
        <Card className="border-teal-200 bg-teal-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-teal-900 flex items-center gap-2">
              <Home className="h-4 w-4" />
              Acessos a Home
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{data?.homeVisits.toLocaleString() || 0}</div>
          </CardContent>
        </Card>
        <Card className="border-violet-200 bg-violet-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-violet-900 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Visitantes Unicos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{data?.uniqueSiteVisitors.toLocaleString() || 0}</div>
            <p className="text-xs text-violet-700 mt-2">Site no período</p>
          </CardContent>
        </Card>
        <Card className="border-emerald-200 bg-emerald-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-emerald-900 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Unicos na Home
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{data?.uniqueHomeVisitors.toLocaleString() || 0}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Impressoes de Conteudo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{data?.totalImpressions.toLocaleString() || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <MousePointerClick className="h-4 w-4" />
              Cliques de Conteudo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{data?.totalClicks.toLocaleString() || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">CTR do Conteudo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{clickRate}%</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Serie do periodo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {(data?.trafficSeries || []).map((item) => (
            <div key={item.label} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{item.label}</span>
                <span className="text-muted-foreground">
                  Site {item.siteVisits} • Home {item.homeVisits}
                </span>
              </div>
              <div className="grid gap-2">
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-sky-500" style={{ width: `${(item.siteVisits / maxTrafficValue) * 100}%` }} />
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-teal-500" style={{ width: `${(item.homeVisits / maxTrafficValue) * 100}%` }} />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Conteudo por tipo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
            {contentTypes.map((type) => (
              <div key={type} className="flex items-center justify-between border-b pb-2">
                <span className="capitalize">{type}</span>
                <span>
                  {data?.impressionsByType[type] || 0} visualizações • {data?.clicksByType[type] || 0} cliques
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Top 10 anuncios elegiveis no periodo</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground mb-4">
            Considera anuncios publicados com vigencia dentro do periodo selecionado.
          </p>
          {(data?.topAnimals.length || 0) === 0 ? (
            <p className="text-sm text-muted-foreground">Sem dados de anúncios.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Animal</TableHead>
                    <TableHead>Visualizações</TableHead>
                    <TableHead>Cliques</TableHead>
                    <TableHead>CTR</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.topAnimals.map((animal) => (
                    <TableRow key={animal.id}>
                      <TableCell className="font-medium">{animal.name}</TableCell>
                      <TableCell>{animal.impressionCount.toLocaleString()}</TableCell>
                      <TableCell>{animal.clickCount.toLocaleString()}</TableCell>
                      <TableCell>{animal.clickRate.toFixed(1)}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminStatsVisits;
