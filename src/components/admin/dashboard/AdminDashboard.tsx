import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, Users, Activity, Loader2, Eye, MousePointerClick, Calendar, Globe, House } from 'lucide-react';
import { useAdminStats } from '@/hooks/admin/useAdminStats';
import { AdminUsers } from '@/components/AdminUsers';
import AdminSystemActivity from './AdminSystemActivity';

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const { stats, isLoading, error } = useAdminStats();

  if (error) {
    return (
      <div className="p-6">
        <Card className="p-6 bg-gray-50 border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Erro ao carregar dados</h3>
          <p className="text-gray-700">{error.message}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Administrativo</h1>
          <p className="text-gray-600">Visão geral do sistema e métricas principais</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Usuários
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Atividade
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-3 text-gray-600">Carregando estatísticas...</span>
            </div>
          ) : (
            <>
              {/* Estatísticas principais */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-4 bg-blue-50 border-blue-200">
                  <h4 className="font-medium text-blue-900 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Total de Usuários
                  </h4>
                  <p className="text-3xl font-bold text-blue-800 mt-2">{stats?.totalUsers || 0}</p>
                  <p className="text-sm text-blue-600 mt-1">
                    {stats?.activeUsers || 0} ativos • {stats?.freeUsers || 0} free
                  </p>
                </Card>
                <Card className="p-4 bg-blue-100 border-blue-300">
                  <h4 className="font-medium text-blue-900 flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Usuários Pagos
                  </h4>
                  <p className="text-3xl font-bold text-blue-900 mt-2">{stats?.paidUsers || 0}</p>
                  <p className="text-sm text-blue-700 mt-1">
                    {stats?.recentSubscriptions || 0} novos em 30 dias
                  </p>
                </Card>
                <Card className="p-4 bg-gray-50 border-gray-200">
                  <h4 className="font-medium text-gray-900 flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Animais Cadastrados
                  </h4>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.totalAnimals || 0}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    {stats?.activeAnimals || 0} ativos
                  </p>
                </Card>
                <Card className="p-4 bg-gray-100 border-gray-200">
                  <h4 className="font-medium text-gray-900 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Eventos
                  </h4>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.totalEvents || 0}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Total cadastrados
                  </p>
                </Card>
              </div>

              {/* Estatísticas de engagement */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <Card className="p-4 bg-blue-50 border-blue-200">
                  <h4 className="font-medium text-blue-900 flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Acessos ao Site
                  </h4>
                  <p className="text-3xl font-bold text-blue-800 mt-2">{stats?.siteVisitsThisMonth || 0}</p>
                  <p className="text-sm text-blue-600 mt-1">Este mes</p>
                </Card>
                <Card className="p-4 bg-white border-gray-200">
                  <h4 className="font-medium text-gray-900 flex items-center gap-2">
                    <House className="h-4 w-4" />
                    Acessos a Home
                  </h4>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.homeVisitsThisMonth || 0}</p>
                  <p className="text-sm text-gray-500 mt-1">Este mes</p>
                </Card>
                <Card className="p-4 bg-white border-gray-200">
                  <h4 className="font-medium text-gray-900 flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Total de Visualizações
                  </h4>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.totalViews || 0}</p>
                </Card>
                <Card className="p-4 bg-white border-gray-200">
                  <h4 className="font-medium text-gray-900 flex items-center gap-2">
                    <MousePointerClick className="h-4 w-4" />
                    Total de Cliques
                  </h4>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.totalClicks || 0}</p>
                </Card>
                <Card className="p-4 bg-gray-900 border-gray-700">
                  <h4 className="font-medium text-white flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Planos Expirando
                  </h4>
                  <p className="text-3xl font-bold text-white mt-2">{stats?.expiringSoon || 0}</p>
                  <p className="text-sm text-gray-400 mt-1">Próximos 7 dias</p>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <AdminUsers />
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <AdminSystemActivity />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;

