import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Users, 
  UserCheck, 
  CreditCard, 
  Activity, 
  Eye, 
  MousePointer, 
  TrendingUp, 
  BarChart3, 
  Loader2
} from 'lucide-react';
import { useAdminStats } from '@/hooks/admin/useAdminStats';

const AdminStatsOverview: React.FC = () => {
  const { stats, isLoading, error } = useAdminStats();

  if (error) {
    return (
      <Card className="p-6 bg-red-50 border-red-200">
        <h3 className="text-lg font-semibold text-red-900 mb-2">Erro ao carregar estatísticas</h3>
        <p className="text-red-700">{error.message}</p>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-3 text-gray-600">Carregando estatísticas...</span>
      </div>
    );
  }

  const conversionRate = stats && stats.totalUsers > 0 
    ? ((stats.paidUsers / stats.totalUsers) * 100).toFixed(1) 
    : '0.0';

  const activePercentage = stats && stats.totalUsers > 0
    ? ((stats.activeUsers / stats.totalUsers) * 100).toFixed(1)
    : '0.0';

  return (
    <div className="space-y-8">
      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-blue-800">Total de Usuários</CardTitle>
            <div className="p-2 bg-blue-500 rounded-lg">
              <Users className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-900">{stats?.totalUsers || 0}</div>
            <p className="text-sm text-blue-700 mt-1">
              <span className="font-medium">{stats?.freeUsers || 0}</span> usuários free
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-green-800">Usuários Ativos</CardTitle>
            <div className="p-2 bg-green-500 rounded-lg">
              <UserCheck className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-900">{stats?.activeUsers || 0}</div>
            <p className="text-sm text-green-700 mt-1">
              <span className="font-medium">{activePercentage}%</span> do total
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-purple-800">Planos Pagos</CardTitle>
            <div className="p-2 bg-purple-500 rounded-lg">
              <CreditCard className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-900">{stats?.paidUsers || 0}</div>
            <p className="text-sm text-purple-700 mt-1">
              Taxa de conversão: <span className="font-medium">{conversionRate}%</span>
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-orange-800">Animais Ativos</CardTitle>
            <div className="p-2 bg-orange-500 rounded-lg">
              <Activity className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-900">{stats?.activeAnimals || 0}</div>
            <p className="text-sm text-orange-700 mt-1">
              de <span className="font-medium">{stats?.totalAnimals || 0}</span> totais
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-cyan-50 to-cyan-100 border-cyan-200 hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-cyan-800">Total de Visualizações</CardTitle>
            <div className="p-2 bg-cyan-500 rounded-lg">
              <Eye className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-cyan-900">{stats?.totalViews.toLocaleString() || 0}</div>
            <p className="text-sm text-cyan-700 mt-1">
              {stats?.totalClicks.toLocaleString() || 0} cliques
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Segunda linha de métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200 hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-emerald-800">Total de Cliques</CardTitle>
            <div className="p-2 bg-emerald-500 rounded-lg">
              <MousePointer className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-900">{stats?.totalClicks.toLocaleString() || 0}</div>
            <p className="text-sm text-emerald-700 mt-1">
              Cliques em conteúdo
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-rose-50 to-rose-100 border-rose-200 hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-rose-800">Taxa de Clique</CardTitle>
            <div className="p-2 bg-rose-500 rounded-lg">
              <TrendingUp className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-rose-900">
              {stats && stats.totalViews > 0 
                ? ((stats.totalClicks / stats.totalViews) * 100).toFixed(1) 
                : '0.0'}%
            </div>
            <p className="text-sm text-rose-700 mt-1">
              Taxa de conversão
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200 hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-indigo-800">Eventos</CardTitle>
            <div className="p-2 bg-indigo-500 rounded-lg">
              <BarChart3 className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-indigo-900">{stats?.totalEvents || 0}</div>
            <p className="text-sm text-indigo-700 mt-1">
              Eventos cadastrados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Métricas de Crescimento */}
      <Card className="shadow-sm border-0 bg-white">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center text-lg font-semibold text-gray-900">
            <div className="p-2 bg-indigo-100 rounded-lg mr-3">
              <BarChart3 className="h-5 w-5 text-indigo-600" />
            </div>
            Resumo do Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-xl">
              <p className="text-sm text-gray-600 mb-2">Novas Assinaturas</p>
              <p className="text-3xl font-bold text-blue-900">{stats?.recentSubscriptions || 0}</p>
              <p className="text-xs text-gray-500 mt-1">Últimos 30 dias</p>
            </div>
            <div className="text-center p-4 bg-amber-50 rounded-xl">
              <p className="text-sm text-gray-600 mb-2">Planos Expirando</p>
              <p className="text-3xl font-bold text-amber-900">{stats?.expiringSoon || 0}</p>
              <p className="text-xs text-gray-500 mt-1">Próximos 7 dias</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-xl">
              <p className="text-sm text-gray-600 mb-2">Denúncias Pendentes</p>
              <p className="text-3xl font-bold text-red-900">{stats?.pendingReports || 0}</p>
              <p className="text-xs text-gray-500 mt-1">Requer atenção</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-xl">
              <p className="text-sm text-gray-600 mb-2">Taxa de Engajamento</p>
              <p className="text-3xl font-bold text-green-900">
                {stats && stats.totalViews > 0 
                  ? ((stats.totalClicks / stats.totalViews) * 100).toFixed(1) 
                  : '0.0'}%
              </p>
              <p className="text-xs text-gray-500 mt-1">Cliques / Visualizações</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminStatsOverview;

