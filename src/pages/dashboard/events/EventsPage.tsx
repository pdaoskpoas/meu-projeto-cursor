import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Plus, Search, Filter, Eye, MousePointerClick, Edit, Trash2, Zap, RefreshCw, Clock, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ProtectedRoute from '@/components/ProtectedRoute';
import ModernDashboardWrapper from '@/components/layout/ModernDashboardWrapper';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import CreateEventModal from '@/components/events/CreateEventModal';
import BoostCountdown from '@/components/BoostCountdown';
import PurchaseBoostsModal from '@/components/payment/PurchaseBoostsModal';
import { eventLimitsService } from '@/services/eventLimitsService';
import { boostService } from '@/services/boostService';
import { supabase } from '@/lib/supabase';
import { useUserBoosts } from '@/hooks/useUserBoosts';

interface UserEvent {
  id: string;
  title: string;
  event_type: string | null;
  start_date: string;
  end_date: string | null;
  city: string | null;
  state: string | null;
  ad_status: string;
  published_at: string | null;
  expires_at: string | null;
  is_boosted: boolean;
  boost_expires_at: string | null;
  is_individual_paid: boolean;
  individual_paid_expires_at: string | null;
  paused_at: string | null;
  cover_image_url: string | null;
  created_at: string;
  impressions?: number;
  clicks?: number;
  computed_status?: string;
  days_remaining?: number;
}

const EventsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBoostCheckout, setShowBoostCheckout] = useState(false);
  const [events, setEvents] = useState<UserEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { boosts, refreshBoosts } = useUserBoosts();

  // Breadcrumbs
  const breadcrumbItems = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Eventos' }
  ];

  const loadEvents = useCallback(async () => {
    if (!user) return;
    
    console.log('🔄 Recarregando lista de eventos...');
    setIsLoading(true);
    try {
      const data = await eventLimitsService.getUserEvents(user.id);
      console.log('📊 Eventos carregados:', data);
      console.log('📊 Total de eventos:', data?.length || 0);
      setEvents(data || []);
    } catch (error) {
      console.error('❌ Erro ao carregar eventos:', error);
      toast({
        title: 'Erro ao carregar eventos',
        description: 'Não foi possível carregar seus eventos.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
      console.log('✅ Lista de eventos atualizada');
    }
  }, [toast, user]);

  useEffect(() => {
    if (user) {
      loadEvents();
    }
  }, [user, loadEvents]);

  const handleCreateClick = async () => {
    if (!user) return;

    // Sem plano ativo: abrir modal direto (o overlay de bloqueio cuida do aviso)
    if (!user.hasActivePlan) {
      setShowCreateModal(true);
      return;
    }

    try {
      const limitCheck = await eventLimitsService.checkEventLimit(user.id);

      if (limitCheck.can_create) {
        setShowCreateModal(true);
      } else {
        toast({
          title: 'Publicação indisponível',
          description: limitCheck.message,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Erro ao verificar limites:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível verificar permissões. Tente novamente.',
        variant: 'destructive'
      });
    }
  };

  const handleCreateSuccess = () => {
    setShowCreateModal(false);
    loadEvents();
  };

  const handleDelete = async (eventId: string) => {
    if (!confirm('Tem certeza que deseja excluir este evento?')) return;
    
    if (!user?.id) {
      toast({
        title: 'Erro',
        description: 'Usuário não autenticado',
        variant: 'destructive'
      });
      return;
    }

    try {
      console.log('🗑️ Iniciando exclusão do evento:', eventId);
      console.log('👤 User ID:', user.id);
      
      const result = await eventLimitsService.deleteEvent(eventId, user.id);

      if (!result.success) {
        throw new Error(result.error || 'Erro ao excluir evento');
      }

      console.log('✅ Evento excluído com sucesso!');

      toast({
        title: '✅ Evento excluído',
        description: 'O evento foi removido com sucesso.',
      });

      // Recarregar lista de eventos
      await loadEvents();
    } catch (error: unknown) {
      console.error('❌ Erro no handleDelete:', error);
      toast({ 
        title: 'Erro ao excluir evento',
        description: error.message || 'Erro desconhecido',
        variant: 'destructive' 
      });
    }
  };

  const handleRenew = async (eventId: string) => {
    // TODO: Implementar renovação
    toast({
      title: 'Em breve',
      description: 'Funcionalidade de renovação em desenvolvimento.',
    });
  };

  const handleBoost = async (eventId: string) => {
    if (!user) return;

    // Se não tem boosts, abre modal de compra
    if (boosts.total === 0) {
      setShowBoostCheckout(true);
      return;
    }

    try {
      const result = await boostService.boostEvent(user.id, eventId);

      if (result.success) {
        toast({
          title: 'Evento Turbinado!',
          description: result.message,
        });
        
        // Atualizar lista de eventos e boosts
        loadEvents();
        refreshBoosts();
      } else {
        toast({
          title: 'Não foi possível turbinar',
          description: result.message,
          variant: 'destructive',
        });
      }
    } catch (error: unknown) {
      toast({
        title: 'Erro ao turbinar',
        description: error.message,
        variant: 'destructive',
      });
    }
  };


  // Filtrar eventos
  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || event.event_type === categoryFilter;
    const matchesStatus = statusFilter === 'all' || event.ad_status === statusFilter;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Helper para obter badge de status
  const getStatusBadge = (event: UserEvent) => {
    if (event.ad_status === 'draft') {
      return <Badge variant="secondary">Rascunho</Badge>;
    }
    if (event.ad_status === 'paused') {
      return <Badge variant="outline" className="border-orange-500 text-orange-700">⏸️ Pausado</Badge>;
    }
    if (event.ad_status === 'expired') {
      return <Badge variant="destructive">🔴 Expirado</Badge>;
    }
    if (event.days_remaining !== undefined && event.days_remaining <= 7) {
      return <Badge className="bg-yellow-500">Expira em {event.days_remaining}d</Badge>;
    }
    if (event.is_boosted) {
      return <Badge className="bg-purple-600">Turbinado</Badge>;
    }
    return <Badge className="bg-green-600">🟢 Ativo</Badge>;
  };

  // Helper para formatar data
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <ProtectedRoute>
      <ModernDashboardWrapper
        title="Meus Eventos"
        subtitle="Gerencie seus eventos cadastrados"
        breadcrumbItems={breadcrumbItems}
      >
        {/* Header com botão criar */}
        <div className="mb-6 flex justify-end">
          <Button 
            onClick={handleCreateClick}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 min-h-11"
            size="lg"
          >
            <Plus className="h-5 w-5 mr-2" />
            Criar Evento
          </Button>
        </div>

        {/* Info Card - Boosts */}
        <Card className="p-6 mb-6 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
          <div className="flex flex-col items-stretch sm:flex-row sm:items-center gap-4">
            <div className="bg-purple-100 p-4 rounded-full">
              <Zap className="h-8 w-8 text-purple-600" />
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="text-3xl font-bold text-gray-900">{boosts.total}</span>
                <span className="text-gray-600">Turbinar Disponíveis</span>
              </div>
              <p className="text-gray-600 text-sm">
                Tenha seu evento ou animal em destaque! Os créditos são compartilhados entre eventos e animais.
              </p>
            </div>
            <Button
              onClick={() => setShowBoostCheckout(true)}
              className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 min-h-11"
            >
              Comprar Turbinar
            </Button>
          </div>
        </Card>

        {/* Filtros */}
        <Card className="p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Digite para buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Categoria</label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as categorias" />
                </SelectTrigger>
                <SelectContent side="bottom" align="start" avoidCollisions={false}>
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  <SelectItem value="Competição">Competição</SelectItem>
                  <SelectItem value="Leilão">Leilão</SelectItem>
                  <SelectItem value="Exposição">Exposição</SelectItem>
                  <SelectItem value="Curso">Curso</SelectItem>
                  <SelectItem value="Copa">Copa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent side="bottom" align="start" avoidCollisions={false}>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="paused">Pausado</SelectItem>
                  <SelectItem value="expired">Expirado</SelectItem>
                  <SelectItem value="draft">Rascunho</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Lista de Eventos */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <Card key={i} className="p-6 animate-pulse">
                <div className="h-40 bg-gray-200 rounded-lg mb-4" />
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
              </Card>
            ))}
          </div>
        ) : filteredEvents.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="max-w-md mx-auto">
              <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Nenhum evento encontrado
              </h3>
              <p className="text-gray-600 mb-6">
                {events.length === 0 
                  ? 'Você ainda não criou nenhum evento.'
                  : 'Nenhum evento corresponde aos filtros selecionados.'
                }
              </p>
              <Button
                onClick={handleCreateClick}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Evento
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map(event => (
              <Card key={event.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                {/* Imagem de capa */}
                <div className="relative h-48 bg-gradient-to-r from-blue-500 to-purple-500">
                  {event.cover_image_url ? (
                    <img
                      src={event.cover_image_url}
                      alt={event.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Calendar className="h-16 w-16 text-white opacity-50" />
                    </div>
                  )}
                  <div className="absolute top-3 right-3">
                    {getStatusBadge(event)}
                  </div>
                  {event.is_individual_paid && (
                    <div className="absolute top-3 left-3">
                      <Badge className="bg-yellow-600">Pago Individual</Badge>
                    </div>
                  )}
                </div>

                {/* Conteúdo */}
                <div className="p-6">
                  {/* Título e tipo */}
                  <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2">
                    {event.title}
                  </h3>
                  {event.event_type && (
                    <p className="text-sm text-gray-600 mb-3">
                      {event.event_type}
                    </p>
                  )}

                  {/* Data e local */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="h-4 w-4" />
                      <span>{formatDate(event.start_date)}</span>
                    </div>
                    {event.city && event.state && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="h-4 w-4" />
                        <span>{event.city}, {event.state}</span>
                      </div>
                    )}
                  </div>

                  {/* Métricas - Apenas para Admin */}
                  {user?.role === 'admin' && (
                    <div className="flex items-center gap-4 mb-4 text-sm bg-slate-50 p-2 rounded-md">
                      <div className="flex items-center gap-1">
                        <Eye className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">{event.impressions || 0}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MousePointerClick className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">{event.clicks || 0}</span>
                      </div>
                    </div>
                  )}

                  {/* Dias restantes - Visível para todos */}
                  {event.days_remaining !== undefined && event.days_remaining > 0 && (
                    <div className="flex items-center gap-1 text-orange-600 mb-4 text-sm">
                      <Clock className="h-4 w-4" />
                      <span className="text-xs font-medium">{event.days_remaining}d restantes</span>
                    </div>
                  )}

                  {/* Boost Countdown */}
                  {event.is_boosted && event.boost_expires_at && new Date(event.boost_expires_at) > new Date() && (
                    <div className="mb-4">
                      <BoostCountdown
                        endTime={event.boost_expires_at}
                        onExpire={() => loadEvents()}
                      />
                    </div>
                  )}

                  {/* Ações */}
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/eventos/${event.id}`)}
                      className="flex-1"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Ver
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/dashboard/events/edit/${event.id}`)}
                      disabled={event.ad_status === 'expired'}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    {/* Botão de boost - sempre visível quando ativo */}
                    {event.ad_status === 'active' && (
                      <Button
                        size="sm"
                        onClick={() => handleBoost(event.id)}
                        className={`${
                          event.is_boosted 
                            ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 animate-pulse' 
                            : 'bg-purple-600 hover:bg-purple-700'
                        } text-white`}
                        title={
                          boosts.total === 0 
                            ? 'Comprar créditos' 
                            : event.is_boosted 
                              ? 'Adicionar mais 24h de destaque' 
                              : 'Turbinar evento por 24h'
                        }
                      >
                        <Zap className="h-3 w-3 mr-1" />
                        {event.is_boosted ? '+24h' : 'Turbinar'}
                      </Button>
                    )}
                    {(event.ad_status === 'paused' || event.ad_status === 'expired') && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRenew(event.id)}
                        className="border-green-600 text-green-600"
                      >
                        <RefreshCw className="h-3 w-3" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(event.id)}
                      className="border-red-600 text-red-600"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Modal de Criação */}
        <CreateEventModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreateSuccess}
        />

        {/* Modal de compra de turbinar (duração) */}
        <PurchaseBoostsModal
          isOpen={showBoostCheckout}
          onClose={() => setShowBoostCheckout(false)}
          userId={user?.id || ''}
          onSuccess={() => {
            refreshBoosts();
            setShowBoostCheckout(false);
          }}
        />
      </ModernDashboardWrapper>
    </ProtectedRoute>
  );
};

export default EventsPage;
