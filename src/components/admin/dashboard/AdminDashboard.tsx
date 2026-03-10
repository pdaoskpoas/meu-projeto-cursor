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
        <Card className="p-6 bg-red-50 border-red-200">
          <h3 className="text-lg font-semibold text-red-900 mb-2">Erro ao carregar dados</h3>
          <p className="text-red-700">{error.message}</p>
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
                <Card className="p-4 bg-green-50 border-green-200">
                  <h4 className="font-medium text-green-900 flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Usuários Pagos
                  </h4>
                  <p className="text-3xl font-bold text-green-800 mt-2">{stats?.paidUsers || 0}</p>
                  <p className="text-sm text-green-600 mt-1">
                    {stats?.recentSubscriptions || 0} novos em 30 dias
                  </p>
                </Card>
                <Card className="p-4 bg-purple-50 border-purple-200">
                  <h4 className="font-medium text-purple-900 flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Animais Cadastrados
                  </h4>
                  <p className="text-3xl font-bold text-purple-800 mt-2">{stats?.totalAnimals || 0}</p>
                  <p className="text-sm text-purple-600 mt-1">
                    {stats?.activeAnimals || 0} ativos
                  </p>
                </Card>
                <Card className="p-4 bg-orange-50 border-orange-200">
                  <h4 className="font-medium text-orange-900 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Eventos
                  </h4>
                  <p className="text-3xl font-bold text-orange-800 mt-2">{stats?.totalEvents || 0}</p>
                  <p className="text-sm text-orange-600 mt-1">
                    Total cadastrados
                  </p>
                </Card>
              </div>

              {/* Estatísticas de engagement */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <Card className="p-4 bg-sky-50 border-sky-200">
                  <h4 className="font-medium text-sky-900 flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Acessos ao Site
                  </h4>
                  <p className="text-3xl font-bold text-sky-800 mt-2">{stats?.siteVisitsThisMonth || 0}</p>
                  <p className="text-sm text-sky-600 mt-1">Este mes</p>
                </Card>
                <Card className="p-4 bg-teal-50 border-teal-200">
                  <h4 className="font-medium text-teal-900 flex items-center gap-2">
                    <House className="h-4 w-4" />
                    Acessos a Home
                  </h4>
                  <p className="text-3xl font-bold text-teal-800 mt-2">{stats?.homeVisitsThisMonth || 0}</p>
                  <p className="text-sm text-teal-600 mt-1">Este mes</p>
                </Card>
                <Card className="p-4 bg-indigo-50 border-indigo-200">
                  <h4 className="font-medium text-indigo-900 flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Total de Visualizações
                  </h4>
                  <p className="text-3xl font-bold text-indigo-800 mt-2">{stats?.totalViews || 0}</p>
                </Card>
                <Card className="p-4 bg-pink-50 border-pink-200">
                  <h4 className="font-medium text-pink-900 flex items-center gap-2">
                    <MousePointerClick className="h-4 w-4" />
                    Total de Cliques
                  </h4>
                  <p className="text-3xl font-bold text-pink-800 mt-2">{stats?.totalClicks || 0}</p>
                </Card>
                <Card className="p-4 bg-amber-50 border-amber-200">
                  <h4 className="font-medium text-amber-900 flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Planos Expirando
                  </h4>
                  <p className="text-3xl font-bold text-amber-800 mt-2">{stats?.expiringSoon || 0}</p>
                  <p className="text-sm text-amber-600 mt-1">Próximos 7 dias</p>
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

