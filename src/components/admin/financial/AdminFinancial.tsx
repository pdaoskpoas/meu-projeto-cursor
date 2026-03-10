import React, { useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DollarSign, TrendingUp, CreditCard, BarChart3, Loader2, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useAdminFinancial } from '@/hooks/admin/useAdminFinancial';

const AdminFinancial: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
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

  const { transactions, stats, isLoading, error } = useAdminFinancial({
    startDate: periodRange.start,
    endDate: periodRange.end
  });

  if (error) {
    return (
      <div className="p-6">
        <Card className="p-6 bg-red-50 border-red-200">
          <h3 className="text-lg font-semibold text-red-900 mb-2">Erro ao carregar dados financeiros</h3>
          <p className="text-red-700">{error.message}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Financeiro</h1>
          <p className="text-gray-600">Acompanhe receitas, transações e métricas financeiras</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <div className="flex gap-2">
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
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="transactions" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Transações
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Relatórios
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-3 text-gray-600">Carregando dados financeiros...</span>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-4 bg-green-50 border-green-200">
                  <h4 className="font-medium text-green-900 flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Receita do Período
                  </h4>
                  <p className="text-3xl font-bold text-green-800 mt-2">
                    R$ {stats?.monthlyRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
                  </p>
                  <div className="flex items-center gap-1 mt-2">
                    {stats && stats.growthPercentage >= 0 ? (
                      <>
                        <ArrowUpRight className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-green-600 font-medium">
                          +{stats.growthPercentage.toFixed(1)}%
                        </span>
                      </>
                    ) : (
                      <>
                        <ArrowDownRight className="h-4 w-4 text-red-600" />
                        <span className="text-sm text-red-600 font-medium">
                          {stats?.growthPercentage.toFixed(1)}%
                        </span>
                      </>
                    )}
                  </div>
                </Card>
                <Card className="p-4 bg-blue-50 border-blue-200">
                  <h4 className="font-medium text-blue-900 flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Transações
                  </h4>
                  <p className="text-3xl font-bold text-blue-800 mt-2">
                    {stats?.totalTransactions || 0}
                  </p>
                  <p className="text-sm text-blue-600 mt-2">
                    {stats?.completedTransactions || 0} concluídas
                  </p>
                </Card>
                <Card className="p-4 bg-purple-50 border-purple-200">
                  <h4 className="font-medium text-purple-900 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Planos Ativos
                  </h4>
                  <p className="text-3xl font-bold text-purple-800 mt-2">
                    {stats?.activePlans || 0}
                  </p>
                </Card>
                <Card className="p-4 bg-orange-50 border-orange-200">
                  <h4 className="font-medium text-orange-900 flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Ticket Médio
                  </h4>
                  <p className="text-3xl font-bold text-orange-800 mt-2">
                    R$ {stats?.averageTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
                  </p>
                </Card>
              </div>
              
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Resumo Financeiro</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">
                      R$ {stats?.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
                    </p>
                    <p className="text-sm text-gray-600">Receita Total</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-yellow-600">
                      {stats?.pendingTransactions || 0}
                    </p>
                    <p className="text-sm text-gray-600">Pendentes</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-600">
                      {stats?.failedTransactions || 0}
                    </p>
                    <p className="text-sm text-gray-600">Falhas</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-600">
                      {stats?.refundedTransactions || 0}
                    </p>
                    <p className="text-sm text-gray-600">Reembolsos</p>
                  </div>
                </div>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="transactions" className="space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">
                  Histórico de Transações ({transactions.length}) • {periodRange.label}
                </h3>
                {transactions.length === 0 ? (
                  <div className="text-center py-12">
                    <CreditCard className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Nenhuma transação registrada ainda.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data</TableHead>
                          <TableHead>Usuário</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Plano/Item</TableHead>
                          <TableHead>Valor</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>ID Asaas</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transactions.map((transaction) => (
                          <TableRow key={transaction.id}>
                            <TableCell className="text-muted-foreground">
                              {new Date(transaction.createdAt).toLocaleDateString('pt-BR')}
                            </TableCell>
                            <TableCell className="font-medium">
                              {transaction.userName || 'Usuário removido'}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {transaction.type === 'plan_subscription' ? 'Assinatura' :
                                 transaction.type === 'boost_purchase' ? 'Boost' : 
                                 'Anúncio Individual'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {transaction.planType || transaction.boostQuantity ? 
                                `${transaction.planType || ''} ${transaction.boostQuantity ? `(${transaction.boostQuantity}x)` : ''}` : 
                                '-'}
                            </TableCell>
                            <TableCell className="font-semibold">
                              R$ {transaction.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </TableCell>
                            <TableCell>
                              <Badge variant={
                                transaction.status === 'completed' ? 'default' :
                                transaction.status === 'pending' ? 'secondary' :
                                transaction.status === 'failed' ? 'destructive' :
                                'outline'
                              }>
                                {transaction.status === 'completed' ? 'Concluído' :
                                 transaction.status === 'pending' ? 'Pendente' :
                                 transaction.status === 'failed' ? 'Falhou' :
                                 'Reembolsado'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground font-mono">
                              {transaction.asaasPaymentId?.substring(0, 20) || '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Relatórios Financeiros</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-4 bg-blue-50">
                  <h4 className="font-semibold text-blue-900 mb-2">Por Tipo de Transação</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Assinaturas:</span>
                      <span className="font-medium">
                        {transactions.filter(t => t.type === 'plan_subscription' && t.status === 'completed').length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Boosts:</span>
                      <span className="font-medium">
                        {transactions.filter(t => t.type === 'boost_purchase' && t.status === 'completed').length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Anúncios Individuais:</span>
                      <span className="font-medium">
                        {transactions.filter(t => t.type === 'individual_ad' && t.status === 'completed').length}
                      </span>
                    </div>
                  </div>
                </Card>
                <Card className="p-4 bg-green-50">
                  <h4 className="font-semibold text-green-900 mb-2">Receita por Tipo</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Assinaturas:</span>
                      <span className="font-medium">
                        R$ {transactions
                          .filter(t => t.type === 'plan_subscription' && t.status === 'completed')
                          .reduce((sum, t) => sum + t.amount, 0)
                          .toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Boosts:</span>
                      <span className="font-medium">
                        R$ {transactions
                          .filter(t => t.type === 'boost_purchase' && t.status === 'completed')
                          .reduce((sum, t) => sum + t.amount, 0)
                          .toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Anúncios:</span>
                      <span className="font-medium">
                        R$ {transactions
                          .filter(t => t.type === 'individual_ad' && t.status === 'completed')
                          .reduce((sum, t) => sum + t.amount, 0)
                          .toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </Card>
              </div>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminFinancial;

