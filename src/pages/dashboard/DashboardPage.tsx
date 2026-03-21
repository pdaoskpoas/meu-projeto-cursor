import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Users, Eye, TrendingUp, Bell, ExternalLink, BarChart3, Crown, Calendar, Award, Activity, Zap, Heart, MessageSquare, Clock, UserCog, MapPin, RefreshCw, HelpCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import ModernDashboardWrapper from '@/components/layout/ModernDashboardWrapper';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { SuspensionNotice } from '@/components/SuspensionNotice';
import BoostPlansModal from '@/components/BoostPlansModal';
import PurchaseBoostsModal from '@/components/payment/PurchaseBoostsModal';
import { animalService } from '@/services/animalService';
import { useToast } from '@/hooks/use-toast';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { cn } from '@/lib/utils';

const DashboardPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const {
    monthlyImpressions,
    monthlyClicks,
    monthlyFavorites,
    monthlyMessages,
    totalAnimals,
    featuredAnimals,
    availableBoosts,
    recentActivities,
    loading: statsLoading,
    error: statsError,
    refreshStats
  } = useDashboardStats();

  const [isBoosting, setIsBoosting] = useState(false);
  const [showBoostPlansModal, setShowBoostPlansModal] = useState(false);
  const [showBoostCheckout, setShowBoostCheckout] = useState(false);
  const [selectedBoostQty, setSelectedBoostQty] = useState<number>(1);
  
  if (!user) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-gray-600">Carregando dashboard...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (user.isSuspended) {
    return (
      <ProtectedRoute>
        <ModernDashboardWrapper
          title="Dashboard"
          subtitle={`Painel de controle ${user?.accountType === 'institutional' ? `do ${user.propertyName || 'Haras'}` : `de ${user?.name || 'Usuário'}`}`}
        >
          <SuspensionNotice 
            suspensionDate={user.suspensionDate}
            suspensionReason={user.suspensionReason}
          />
        </ModernDashboardWrapper>
      </ProtectedRoute>
    );
  }

  const handleBoostFirstAnimal = async () => {
    if (!user?.id) return;
    setIsBoosting(true);
    try {
      const animals = await animalService.getUserAnimals(user.id);
      const candidate = animals.find(a => !a.is_boosted && a.ad_status === 'active') || animals[0];
      if (!candidate) {
        toast({ title: 'Nenhum animal encontrado', description: 'Cadastre um animal primeiro.', variant: 'destructive' });
      } else {
        await animalService.boostAnimal(candidate.id as string, user.id, 24);
        toast({ title: 'Turbinado com sucesso', description: `Animal ${candidate.name} turbinado por 24h.` });
        // Recarregar stats após boost
        setTimeout(() => refreshStats(), 1000);
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Verifique seu saldo de créditos.';
      toast({ title: 'Falha ao turbinar', description: message, variant: 'destructive' });
    } finally {
      setIsBoosting(false);
    }
  };

  // Função para formatar tempo relativo
  const getRelativeTime = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInHours = Math.floor((now.getTime() - time.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
      return diffInMinutes <= 1 ? 'Agora mesmo' : `${diffInMinutes} minutos atrás`;
    } else if (diffInHours < 24) {
      return `${diffInHours} hora${diffInHours > 1 ? 's' : ''} atrás`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} dia${diffInDays > 1 ? 's' : ''} atrás`;
    }
  };

  // Função para obter ícone da atividade
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'impression': return Eye;
      case 'click': return ExternalLink;
      case 'favorite': return Heart;
      case 'message': return MessageSquare;
      case 'boost': return Zap;
      case 'animal_created': return Plus;
      case 'ticket_response': return HelpCircle;
      default: return Activity;
    }
  };

  // Função para obter cor da atividade
  const getActivityColor = (type: string) => {
    switch (type) {
      case 'impression': return 'from-blue-400 to-blue-600';
      case 'click': return 'from-green-400 to-green-600';
      case 'favorite': return 'from-red-400 to-red-600';
      case 'message': return 'from-purple-400 to-purple-600';
      case 'boost': return 'from-yellow-400 to-yellow-600';
      case 'animal_created': return 'from-indigo-400 to-indigo-600';
      case 'ticket_response': return 'from-orange-400 to-orange-600';
      default: return 'from-gray-400 to-gray-600';
    }
  };

  // Calcular taxa de cliques
  const clickRate = monthlyImpressions > 0 ? ((monthlyClicks / monthlyImpressions) * 100) : 0;

  return (
    <ProtectedRoute>
      <ModernDashboardWrapper showStats={false}>
        <div className="space-y-6 lg:space-y-8">
          {/* Welcome Hero Card */}
          <Card className="relative overflow-hidden border-0 shadow-lg">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-transparent to-transparent opacity-60" />
            
            <div className="relative p-6 lg:p-8">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                {/* User Info */}
                <div className="flex items-start gap-4 flex-1">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h1 className="text-2xl lg:text-3xl font-extrabold text-gray-900">
                        Bem-vindo, {user?.name}!
                      </h1>
                      {user?.plan && user.plan !== 'free' && (
                        <Badge className={`border-0 shadow-md ${
                          user.plan === 'vip' ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' :
                          user.plan === 'elite' ? 'bg-gradient-to-r from-purple-400 to-indigo-500 text-white' :
                          user.plan === 'haras' ? 'bg-gradient-to-r from-emerald-400 to-teal-500 text-white' :
                          user.plan === 'criador' ? 'bg-gradient-to-r from-orange-400 to-red-500 text-white' :
                          user.plan === 'essencial' ? 'bg-gradient-to-r from-blue-400 to-blue-600 text-white' :
                          'bg-gradient-to-r from-green-400 to-emerald-500 text-white'
                        }`}>
                          <Crown className="h-3 w-3 mr-1" />
                          {user.plan.toUpperCase()}
                        </Badge>
                      )}
                    </div>
                    <p className="text-gray-600 text-base lg:text-lg leading-relaxed">
                      {user?.accountType === 'institutional' 
                        ? `Gerencie ${user.propertyName ? `o ${user.propertyName}` : 'seu haras'} e acompanhe o desempenho dos seus animais.`
                        : 'Gerencie seus animais e acompanhe o desempenho do seu plantel.'
                      }
                    </p>
                  </div>
                </div>
                
                {/* CTA Buttons */}
                <div className="flex gap-3 w-full lg:w-auto">
                  <Button
                    onClick={() => window.location.reload()}
                    variant="outline"
                    size="lg"
                    className="flex-1 lg:flex-none"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Atualizar
                  </Button>
                  <Link to={`/${user?.accountType === 'institutional' ? 'haras' : 'perfil'}/${user?.propertyId || user?.id}`} className="flex-1 lg:flex-none">
                    <Button size="lg" className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all">
                      <ExternalLink className="h-5 w-5 mr-2" />
                      Ver Perfil Público
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </Card>

          {/* Error Alert */}
          {statsError && (
            <Card className="p-4 border-red-200 bg-red-50">
              <div className="flex items-center gap-2 text-red-700">
                <Bell className="h-4 w-4" />
                <p className="text-sm">Erro ao carregar estatísticas: {statsError}</p>
                <Button onClick={refreshStats} variant="ghost" size="sm" className="ml-auto">
                  Tentar novamente
                </Button>
              </div>
            </Card>
          )}

          {/* Quick Actions Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {/* Atualizar Perfil Card - NOVO */}
            <Link to="/dashboard/settings/profile" className="block group">
              <Card className="h-full hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border-2 border-transparent hover:border-orange-300/50 relative overflow-hidden">
                {/* Badge "Novo" */}
                <div className="absolute top-2 right-2">
                  <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs border-0 shadow-md">
                    Novo!
                  </Badge>
                </div>
                <div className="p-6 flex flex-col items-center text-center space-y-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <UserCog className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-orange-600 transition-colors mb-2">
                      Atualizar Perfil
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      Complete seu perfil e apareça no mapa da comunidade
                    </p>
                    <div className="mt-3 flex items-center justify-center gap-2 text-orange-600">
                      <MapPin className="h-4 w-4" />
                      <span className="text-xs font-semibold">Mapa + Localização</span>
                    </div>
                  </div>
                </div>
              </Card>
            </Link>

            {/* Meus Animais Card */}
            <Link to="/dashboard/animals" className="block group">
              <Card className="h-full hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border-2 border-transparent hover:border-blue-300/50">
                <div className="p-6 flex flex-col items-center text-center space-y-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <Users className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors mb-2">
                      Meus Animais
                    </h3>
                    <p className="text-4xl font-extrabold text-blue-600 mb-1">
                      {statsLoading ? '...' : totalAnimals}
                    </p>
                    <p className="text-sm text-gray-600">
                      {totalAnimals === 1 ? 'animal cadastrado' : 'animais cadastrados'}
                    </p>
                  </div>
                </div>
              </Card>
            </Link>

            {/* Estatísticas Card */}
            <Link to="/dashboard/stats" className="block group">
              <Card className="h-full hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border-2 border-transparent hover:border-green-300/50">
                <div className="p-6 flex flex-col items-center text-center space-y-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <Eye className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-green-600 transition-colors mb-2">
                      Estatísticas
                    </h3>
                    <p className="text-sm text-gray-500 mb-2">(Mês Atual)</p>
                    <p className="text-4xl font-extrabold text-green-600 mb-1">
                      {statsLoading ? '...' : monthlyImpressions.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-600">
                      impressões este mês
                    </p>
                  </div>
                </div>
              </Card>
            </Link>

            {/* Boosts Card */}
            <Link to="/dashboard/animals" className="block group">
              <Card className="h-full hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border-2 border-transparent hover:border-purple-300/50">
                <div className="p-6 flex flex-col items-center text-center space-y-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <Zap className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-purple-600 transition-colors mb-2">
                      Turbinar Disponíveis
                    </h3>
                    <p className="text-4xl font-extrabold text-purple-600 mb-1">
                      {statsLoading ? '...' : availableBoosts}
                    </p>
                    <p className="text-sm text-gray-600">
                      {availableBoosts === 1 ? 'crédito disponível' : 'créditos disponíveis'}
                    </p>
                  </div>
                </div>
              </Card>
            </Link>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
            {/* Visualizações */}
            <Card className="p-4 hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-white to-blue-50/30">
              <div className="flex items-center justify-between mb-3">
                <Eye className="h-5 w-5 text-blue-600" />
                <Badge className="bg-green-100 text-green-700 text-xs border-0">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  {clickRate > 0 ? `+${clickRate.toFixed(1)}%` : '0%'}
                </Badge>
              </div>
              <p className="text-xs text-gray-600 font-medium mb-1">Visualizações (Mês)</p>
              <p className="text-2xl lg:text-3xl font-bold text-gray-900">
                {statsLoading ? '...' : monthlyImpressions.toLocaleString()}
              </p>
            </Card>

            {/* Favoritos */}
            <Card className="p-4 hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-white to-red-50/30">
              <div className="flex items-center justify-between mb-3">
                <Heart className="h-5 w-5 text-red-600" />
                <Badge className="bg-green-100 text-green-700 text-xs border-0">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  {monthlyFavorites > 0 ? '+' : ''}
                  {monthlyFavorites}
                </Badge>
              </div>
              <p className="text-xs text-gray-600 font-medium mb-1">Favoritos (Mês)</p>
              <p className="text-2xl lg:text-3xl font-bold text-gray-900">
                {statsLoading ? '...' : monthlyFavorites}
              </p>
            </Card>

            {/* Mensagens */}
            <Card className="p-4 hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-white to-green-50/30">
              <div className="flex items-center justify-between mb-3">
                <MessageSquare className="h-5 w-5 text-green-600" />
                <Badge className="bg-green-100 text-green-700 text-xs border-0">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  {monthlyMessages > 0 ? '+' : ''}
                  {monthlyMessages}
                </Badge>
              </div>
              <p className="text-xs text-gray-600 font-medium mb-1">Mensagens (Mês)</p>
              <p className="text-2xl lg:text-3xl font-bold text-gray-900">
                {statsLoading ? '...' : monthlyMessages}
              </p>
            </Card>

            {/* Destaque */}
            <Card className="p-4 hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-white to-yellow-50/30">
              <div className="flex items-center justify-between mb-3">
                <Award className="h-5 w-5 text-yellow-600" />
                <Badge className="bg-blue-100 text-blue-700 text-xs border-0">
                  {featuredAnimals > 0 ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
              <p className="text-xs text-gray-600 font-medium mb-1">Em Destaque</p>
              <p className="text-2xl lg:text-3xl font-bold text-gray-900">
                {statsLoading ? '...' : featuredAnimals}
              </p>
            </Card>
          </div>

          {/* Boosts & Créditos */}
          <Card className="relative overflow-hidden border-0 shadow-lg">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-transparent to-transparent opacity-60" />
            
            <div className="relative p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Zap className="h-6 w-6 text-white animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Turbinar e Créditos</h3>
                    <p className="text-sm text-gray-600">Turbine seus anúncios e ganhe mais visibilidade</p>
                  </div>
                </div>
                
                <Button 
                  onClick={() => setShowBoostPlansModal(true)} 
                  className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 h-auto whitespace-nowrap w-full sm:w-auto"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Comprar Turbinar
                </Button>
              </div>
              
              <p className="text-xs text-gray-500 mt-4 text-center sm:text-left">
                Após realizar ações, clique em "Atualizar" para ver o saldo atualizado.
              </p>
            </div>
          </Card>

          {/* Recent Activity - Timeline Visual */}
          <Card className="p-6 border-0 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Activity className="h-6 w-6 text-orange-600" />
                Atividade Recente
              </h3>
              {statsLoading && (
                <div className="w-4 h-4 border-2 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
              )}
            </div>
            
            <div className="space-y-4 relative">
              {recentActivities.length > 0 ? (
                <>
                  {/* Linha vertical conectora */}
                  <div className="absolute left-5 top-6 bottom-6 w-0.5 bg-gradient-to-b from-blue-200 via-yellow-200 to-green-200" />
                  
                  {recentActivities.map((activity, index) => {
                    const IconComponent = getActivityIcon(activity.type);
                    const colorClass = getActivityColor(activity.type);
                    
                    return (
                      <div key={activity.id} className="flex items-start gap-4 relative">
                        <div className={cn(
                          "w-10 h-10 bg-gradient-to-br rounded-full flex items-center justify-center shadow-md z-10 flex-shrink-0",
                          colorClass
                        )}>
                          <IconComponent className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1 bg-gradient-to-r from-gray-50 to-transparent rounded-lg p-4 hover:from-gray-100 transition-all duration-300 border border-gray-100">
                          <p className="text-sm font-semibold text-gray-900 mb-1">
                            {activity.title}
                          </p>
                          {activity.description && (
                            <p className="text-xs text-gray-600 mb-2">
                              {activity.description}
                            </p>
                          )}
                          <p className="text-xs text-gray-500 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {getRelativeTime(activity.timestamp)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </>
              ) : (
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-sm">
                    {statsLoading ? 'Carregando atividades...' : 'Nenhuma atividade recente encontrada'}
                  </p>
                  {!statsLoading && totalAnimals === 0 && (
                    <p className="text-gray-400 text-xs mt-2">
                      Cadastre seu primeiro animal para começar a ver atividades aqui
                    </p>
                  )}
                </div>
              )}
            </div>
          </Card>
        </div>
      </ModernDashboardWrapper>
      
      {/* Modal de Compra de Turbinares */}
      <BoostPlansModal
        isOpen={showBoostPlansModal}
        onClose={() => setShowBoostPlansModal(false)}
        onSelectPlan={(plan) => {
          const quantities = { single: 1, popular: 5, prime: 10 };
          setSelectedBoostQty(quantities[plan]);
          setShowBoostPlansModal(false);
          setShowBoostCheckout(true);
        }}
        type="animal"
      />

      <PurchaseBoostsModal
        isOpen={showBoostCheckout}
        onClose={() => setShowBoostCheckout(false)}
        userId={user?.id || ''}
        initialQuantity={selectedBoostQty}
        lockQuantity
        onSuccess={() => {
          refreshStats();
          setShowBoostCheckout(false);
        }}
      />
    </ProtectedRoute>
  );
};

export default DashboardPage;