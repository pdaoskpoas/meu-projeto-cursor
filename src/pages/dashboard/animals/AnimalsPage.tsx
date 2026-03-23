import React, { Suspense, useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Eye, Edit3, Trash2, MapPin, Trophy, Zap, RefreshCw, Clock, AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ModernDashboardWrapper from '@/components/layout/ModernDashboardWrapper';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { animalService } from '@/services/animalService';
import { partnershipService } from '@/services/partnershipService';
import { boostService } from '@/services/boostService';
import { useToast } from '@/hooks/use-toast';
import BoostCounter from '@/components/dashboard/BoostCounter';
import BoostCountdown from '@/components/BoostCountdown';
import { useUserBoosts } from '@/hooks/useUserBoosts';

// Lazy load de modais pesados - carregam sob demanda
const EditAnimalModal = React.lazy(() => import('@/components/forms/animal/EditAnimalModal'));
const PurchaseBoostsModal = React.lazy(() => import('@/components/payment/PurchaseBoostsModal'));
const NewAnimalWizard = React.lazy(() =>
  import('@/components/animal/NewAnimalWizard').then(m => ({ default: m.NewAnimalWizard }))
);
import { runResilientRequest } from '@/services/resilientRequestService';
import { invalidateAnimalCaches } from '@/lib/queryClient';
import { clearDashboardCache } from '@/hooks/useDashboardStats';
import { getDetailedAge } from '@/utils/animalAge';
import mangalargaImg from '@/assets/mangalarga.jpg';
import thoroughbredImg from '@/assets/thoroughbred.jpg';
import quarterHorseImg from '@/assets/quarter-horse.jpg';

interface UserAnimal {
  id: string;
  name: string;
  breed: string;
  gender: 'Macho' | 'Fêmea';
  birth_date: string;
  coat: string;
  current_city: string;
  current_state: string;
  ad_status: 'active' | 'expired' | 'paused';
  published_at: string;
  expires_at: string;
  is_boosted: boolean;
  boost_expires_at?: string;
  impression_count: number;
  click_count: number;
  images: string[];
  auto_renew: boolean;
  is_partnership?: boolean;
  has_active_partnerships?: boolean;
  my_percentage?: number;
  partnership_id?: string;
}

const AnimalsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [animals, setAnimals] = useState<UserAnimal[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [animalToEdit, setAnimalToEdit] = useState<UserAnimal | null>(null);
  const [isBoostCheckoutOpen, setIsBoostCheckoutOpen] = useState(false);
  const [boostTargetAnimalId, setBoostTargetAnimalId] = useState<string | undefined>(undefined);
  const [boostTargetAnimalName, setBoostTargetAnimalName] = useState<string | undefined>(undefined);
  const [isAddAnimalModalOpen, setIsAddAnimalModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'expired' | 'paused'>('all');
  const { boosts, refreshBoosts } = useUserBoosts();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [animalToDelete, setAnimalToDelete] = useState<UserAnimal | null>(null);
  const [transferPartners, setTransferPartners] = useState<Array<{ id: string; partner_id: string; partner_name: string }>>([]);
  const [selectedTransferPartner, setSelectedTransferPartner] = useState('');
  const [loadingTransferPartners, setLoadingTransferPartners] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  // Carregar animais do usuário (incluindo sociedades)
  useEffect(() => {
    if (!user?.id) return;
    
    const loadAnimals = async () => {
      try {
        setLoading(true);
        setLoadError(null);
        // Usar getUserAnimalsWithPartnerships para incluir animais em sociedade
        const userAnimals = await runResilientRequest(
          () => partnershipService.getUserAnimalsWithPartnerships(user.id),
          {
            timeoutMs: 15000,
            errorMessage: 'O carregamento dos animais demorou demais.'
          }
        );
        setAnimals(userAnimals);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Erro ao carregar animais';
        setLoadError(message);
        toast({ title: 'Erro ao carregar animais', description: message, variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };

    loadAnimals();
  }, [user?.id, toast, reloadKey]);

  // Filtrar animais
  const filteredAnimals = animals.filter(animal => {
    if (filterStatus !== 'all' && animal.ad_status !== filterStatus) return false;
    return true;
  });

  // Contar por status
  const statusCounts = {
    active: animals.filter(a => a.ad_status === 'active').length,
    expired: animals.filter(a => a.ad_status === 'expired').length,
    paused: animals.filter(a => a.ad_status === 'paused').length,
    total: animals.length
  };

  const getImageSrc = (imageName: string) => {
    switch (imageName) {
      case 'mangalarga': return mangalargaImg;
      case 'thoroughbred': return thoroughbredImg;
      case 'quarter-horse': return quarterHorseImg;
      default: return mangalargaImg;
    }
  };

  const handleReactivateAnimal = async (animalId: string) => {
    if (!user?.id) return;
    
    try {
      // Verificar se usuário pode reativar (tem plano ou vai pagar individual)
      const canPublish = await animalService.canPublishByPlan(user.id);
      
      if (!canPublish.plan || canPublish.plan === 'free' || !canPublish.planIsValid || canPublish.remaining <= 0) {
        // Redirecionar para página de pagamento
        navigate(`/reativar-animal/${animalId}`);
      } else {
        // Reativar usando cota do plano
        await animalService.publishAnimal(animalId, user.id);
        toast({ title: 'Animal reativado com sucesso!' });
        
        // Recarregar lista
        const userAnimals = await animalService.getUserAnimals(user.id);
        setAnimals(userAnimals);
      }
    } catch (error: unknown) {
      toast({ 
        title: 'Erro ao reativar animal', 
        description: error?.message || 'Tente novamente',
        variant: 'destructive' 
      });
    }
  };

  const handleEditAnimal = (animal: UserAnimal) => {
    setAnimalToEdit(animal);
    setIsEditModalOpen(true);
  };

  const handleDeleteAnimal = async (animalId: string) => {
    if (!user?.id) return;
    const animal = animals.find(a => a.id === animalId) || null;
    if (!animal) return;

    if (animal.is_partnership && animal.partnership_id) {
      try {
        await partnershipService.leavePartnership(animal.partnership_id, user.id);
        toast({ title: 'Você saiu da sociedade', description: 'O animal foi removido do seu perfil.' });
        clearDashboardCache();
        invalidateAnimalCaches();
        const userAnimals = await partnershipService.getUserAnimalsWithPartnerships(user.id);
        setAnimals(userAnimals);
      } catch (error: unknown) {
        toast({
          title: 'Erro ao sair da sociedade',
          description: error?.message || 'Tente novamente',
          variant: 'destructive'
        });
      }
      return;
    }

    if (animal.has_active_partnerships) {
      setAnimalToDelete(animal);
      setShowDeleteModal(true);
      setSelectedTransferPartner('');
      setLoadingTransferPartners(true);
      try {
        const partners = await partnershipService.getAnimalPartnersForOwner(animal.id);
        setTransferPartners(partners || []);
      } catch (error: unknown) {
        toast({
          title: 'Erro ao carregar sócios',
          description: error?.message || 'Tente novamente',
          variant: 'destructive'
        });
      } finally {
        setLoadingTransferPartners(false);
      }
      return;
    }

    if (!confirm('Tem certeza que deseja excluir este animal?')) return;

    try {
      await animalService.deleteAnimal(animalId);
      toast({ title: 'Animal excluído com sucesso!' });
      clearDashboardCache();
      invalidateAnimalCaches();
      const userAnimals = await animalService.getUserAnimals(user.id);
      setAnimals(userAnimals);
    } catch (error: unknown) {
      toast({ 
        title: 'Erro ao excluir animal', 
        description: error?.message || 'Tente novamente',
        variant: 'destructive' 
      });
    }
  };

  const handleConfirmDeleteWithPartners = async (shouldTransfer: boolean) => {
    if (!user?.id || !animalToDelete) return;
    try {
      if (shouldTransfer) {
        if (!selectedTransferPartner) {
          toast({
            title: 'Selecione um sócio',
            description: 'Escolha o sócio que receberá o animal.',
            variant: 'destructive'
          });
          return;
        }
        await partnershipService.transferAnimalOwnership(animalToDelete.id, selectedTransferPartner);
        toast({
          title: 'Animal transferido',
          description: 'O animal foi transferido para o sócio selecionado.'
        });
      } else {
        await animalService.deleteAnimal(animalToDelete.id);
        toast({
          title: 'Animal excluído',
          description: 'O animal foi removido do seu perfil e dos sócios.'
        });
      }
      setShowDeleteModal(false);
      setAnimalToDelete(null);
      setSelectedTransferPartner('');
      clearDashboardCache();
      invalidateAnimalCaches();
      const userAnimals = await partnershipService.getUserAnimalsWithPartnerships(user.id);
      setAnimals(userAnimals);
    } catch (error: unknown) {
      toast({
        title: 'Erro ao concluir ação',
        description: error?.message || 'Tente novamente',
        variant: 'destructive'
      });
    }
  };

  const handleBoostAnimal = async (animal: UserAnimal) => {
    if (!user?.id) return;

    // Bloquear re-turbinar animal já turbinado
    if (animal.is_boosted && animal.boost_expires_at && new Date(animal.boost_expires_at) > new Date()) {
      const expiresDate = new Date(animal.boost_expires_at).toLocaleString('pt-BR');
      toast({
        title: 'Animal já turbinado',
        description: `"${animal.name}" já está turbinado até ${expiresDate}. Aguarde o término.`,
        variant: 'destructive'
      });
      return;
    }

    if (boosts.total === 0) {
      // Sem créditos: abre modal de compra com animal pré-selecionado
      setBoostTargetAnimalId(animal.id);
      setBoostTargetAnimalName(animal.name);
      setIsBoostCheckoutOpen(true);
      return;
    }

    try {
      const result = await boostService.boostAnimal(user.id, animal.id);

      if (result.success) {
        toast({
          title: 'Animal Turbinado!',
          description: result.message
        });
        refreshBoosts();

        const userAnimals = await animalService.getUserAnimals(user.id);
        setAnimals(userAnimals);
      } else {
        toast({
          title: 'Não foi possível turbinar',
          description: result.message,
          variant: 'destructive'
        });
      }
    } catch (error: unknown) {
      toast({
        title: 'Erro ao turbinar',
        description: (error as Error)?.message || 'Tente novamente',
        variant: 'destructive'
      });
    }
  };


  const isInGracePeriod = (expiresAt: string) => {
    const expiry = new Date(expiresAt);
    const gracePeriodEnd = new Date(expiry.getTime() + 7 * 24 * 60 * 60 * 1000); // +7 dias após expiração
    return new Date() <= gracePeriodEnd;
  };

  const getDaysUntilDeletion = (expiresAt: string) => {
    const expiry = new Date(expiresAt);
    const gracePeriodEnd = new Date(expiry.getTime() + 7 * 24 * 60 * 60 * 1000); // +7 dias após expiração
    const now = new Date();
    const diffTime = gracePeriodEnd.getTime() - now.getTime();
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(days, 0); // Não retornar valores negativos
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <ModernDashboardWrapper title="Meus Animais" subtitle="Gerencie seus anúncios">
          <Card className="p-6">
            <div className="text-center">Carregando...</div>
          </Card>
        </ModernDashboardWrapper>
      </ProtectedRoute>
    );
  }

  if (loadError) {
    return (
      <ProtectedRoute>
        <ModernDashboardWrapper title="Meus Animais" subtitle="Gerencie seus anúncios">
          <Card className="p-6 space-y-4">
            <div className="text-center text-red-600">{loadError}</div>
            <div className="flex justify-center">
              <Button onClick={() => setReloadKey(prev => prev + 1)} variant="outline">
                Tentar novamente
              </Button>
            </div>
          </Card>
        </ModernDashboardWrapper>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <ModernDashboardWrapper title="Meus Animais" subtitle="Gerencie seus anúncios de animais">
        {/* Contador de Boosts */}
        <div className="mb-6">
          <BoostCounter
            availableBoosts={boosts.total}
            showBuyButton={true}
            onBuyClick={() => {
              setBoostTargetAnimalId(undefined);
              setBoostTargetAnimalName(undefined);
              setIsBoostCheckoutOpen(true);
            }}
          />
        </div>

        {/* Header com estatísticas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <Card className="p-4">
            <div className="text-2xl font-bold text-green-600">{statusCounts.active}</div>
            <div className="text-sm text-slate-600">Ativos</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold text-amber-600">{statusCounts.expired}</div>
            <div className="text-sm text-slate-600">Expirados</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold text-slate-600">{statusCounts.paused}</div>
            <div className="text-sm text-slate-600">Pausados</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold text-blue-600">{statusCounts.total}</div>
            <div className="text-sm text-slate-600">Total</div>
          </Card>
        </div>

        {/* Filtros e botão adicionar */}
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex flex-wrap gap-2">
            <Button 
              variant={filterStatus === 'all' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setFilterStatus('all')}
            >
              Todos
            </Button>
            <Button 
              variant={filterStatus === 'active' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setFilterStatus('active')}
            >
              Ativos
            </Button>
            <Button 
              variant={filterStatus === 'expired' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setFilterStatus('expired')}
            >
              Expirados
            </Button>
            <Button 
              variant={filterStatus === 'paused' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setFilterStatus('paused')}
            >
              Pausados
            </Button>
          </div>
          
          <Button 
            onClick={() => setIsAddAnimalModalOpen(true)}
            className="w-full sm:w-auto sm:self-end bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white min-h-11"
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Animal
          </Button>
        </div>

        {/* Lista de animais */}
        {filteredAnimals.length === 0 ? (
          <Card className="p-8 text-center">
            <div className="text-slate-500 mb-4">
              {filterStatus === 'all' 
                ? 'Você ainda não possui animais cadastrados.'
                : `Nenhum animal ${filterStatus === 'active' ? 'ativo' : filterStatus === 'expired' ? 'expirado' : 'pausado'} encontrado.`
              }
            </div>
            {filterStatus === 'all' && (
              <Button 
                onClick={() => setIsAddAnimalModalOpen(true)}
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Cadastrar Primeiro Animal
              </Button>
            )}
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAnimals.map((animal) => (
              <Card key={animal.id} className="overflow-hidden">
                <div className="relative aspect-[4/3]">
                  <img 
                    src={animal.images?.[0] || getImageSrc('mangalarga')} 
                    alt={animal.name}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Status badge */}
                  <div className="absolute top-2 left-2">
                    {animal.ad_status === 'active' && (
                      <Badge className="bg-green-500">Ativo</Badge>
                    )}
                    {animal.ad_status === 'expired' && (
                      <Badge variant="destructive">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Expirado
                      </Badge>
                    )}
                    {animal.ad_status === 'paused' && (
                      <Badge variant="secondary">Pausado</Badge>
                    )}
                  </div>

                  {/* Boost indicator */}
                  {animal.is_boosted && (
                    <div className="absolute top-2 right-2">
                      <Badge className="bg-yellow-500">
                        <Zap className="h-3 w-3 mr-1" />
                        Turbinado
                      </Badge>
                    </div>
                  )}
                  
                  {/* Partnership indicator */}
                  {(animal.is_partnership || animal.has_active_partnerships) && (
                    <div className={`absolute ${animal.is_boosted ? 'top-12' : 'top-2'} right-2`}>
                      <Badge className="bg-blue-600">
                        <Trophy className="h-3 w-3 mr-1" />
                        {animal.is_partnership ? 'Sócio' : 'Sociedade'}
                      </Badge>
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-lg">{animal.name}</h3>
                      <p className="text-sm text-slate-600">
                        {animal.breed} • {animal.gender} • {getDetailedAge(animal.birth_date)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-slate-600 mb-3">
                    <MapPin className="h-4 w-4" />
                    <span>{animal.current_city}, {animal.current_state}</span>
                  </div>

                  {/* Indicador de sociedade */}
                  {animal.is_partnership && animal.my_percentage && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 mb-3">
                      <div className="flex items-center gap-2 text-blue-800 text-xs">
                        <Trophy className="h-3 w-3" />
                        <span>Você é sócio com {animal.my_percentage}% de participação</span>
                      </div>
                    </div>
                  )}
                  {!animal.is_partnership && animal.has_active_partnerships && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 mb-3">
                      <div className="flex items-center gap-2 text-blue-800 text-xs">
                        <Trophy className="h-3 w-3" />
                        <span>Este animal possui sócios ativos</span>
                      </div>
                    </div>
                  )}

                  {/* Aviso de período de graça */}
                  {animal.ad_status === 'expired' && isInGracePeriod(animal.expires_at) && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3">
                      <div className="flex items-center gap-2 text-amber-800 text-sm">
                        <Clock className="h-4 w-4" />
                        <span>
                          Será excluído em {getDaysUntilDeletion(animal.expires_at)} dias
                        </span>
                      </div>
                      {animal.auto_renew && (
                        <div className="text-xs text-amber-700 mt-1">
                          🔄 Renovação automática habilitada - aguardando pagamento individual
                        </div>
                      )}
                    </div>
                  )}

                  {/* Indicador de renovação automática para anúncios ativos */}
                  {animal.ad_status === 'active' && animal.auto_renew && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 mb-3">
                      <div className="flex items-center gap-2 text-blue-800 text-xs">
                        <RefreshCw className="h-3 w-3" />
                        <span>Renovação automática ativada</span>
                      </div>
                    </div>
                  )}

                  {/* Contador regressivo de boost (se turbinado) */}
                  {animal.is_boosted && animal.boost_expires_at && (
                    <div className="mb-3">
                      <BoostCountdown
                        endTime={animal.boost_expires_at}
                        onExpire={() => {
                          if (user?.id) {
                            animalService.getUserAnimals(user.id).then(setAnimals);
                          }
                        }}
                      />
                    </div>
                  )}

                  {/* Ações */}
                  <div className="flex flex-wrap gap-2">
                    <Link to={`/animal/${animal.id}`}>
                      <Button size="sm" variant="outline" className="flex items-center">
                        <Eye className="h-4 w-4 mr-1" />
                        <span className="text-xs">Ver</span>
                      </Button>
                    </Link>
                    
                    {animal.ad_status === 'active' && (
                      <>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="flex items-center"
                          onClick={() => handleEditAnimal(animal)}
                        >
                          <Edit3 className="h-4 w-4 mr-1" />
                          <span className="text-xs">Editar</span>
                        </Button>
                        
                        {/* Botão de boost - sempre visível quando ativo */}
                        <Button
                          size="sm"
                          disabled={animal.is_boosted && !!animal.boost_expires_at && new Date(animal.boost_expires_at) > new Date()}
                          className={`${
                            animal.is_boosted
                              ? 'bg-gradient-to-r from-purple-600 to-pink-600 opacity-70 cursor-not-allowed'
                              : 'bg-purple-600 hover:bg-purple-700'
                          } text-white flex items-center`}
                          onClick={() => handleBoostAnimal(animal)}
                          title={
                            animal.is_boosted && animal.boost_expires_at && new Date(animal.boost_expires_at) > new Date()
                              ? `Turbinado até ${new Date(animal.boost_expires_at).toLocaleString('pt-BR')}`
                              : boosts.total === 0
                                ? 'Comprar turbinar'
                                : 'Turbinar anúncio'
                          }
                        >
                          <Zap className="h-4 w-4 mr-1" />
                          <span className="text-xs font-medium">
                            {animal.is_boosted ? 'Turbinado' : 'Turbinar'}
                          </span>
                        </Button>
                      </>
                    )}

                    {(animal.ad_status === 'paused' || 
                      (animal.ad_status === 'expired' && isInGracePeriod(animal.expires_at))) && (
                      <Button 
                        size="sm" 
                        className="bg-green-600 hover:bg-green-700 text-white flex items-center"
                        onClick={() => handleReactivateAnimal(animal.id)}
                      >
                        <RefreshCw className="h-4 w-4 mr-1" />
                        <span className="text-xs font-medium">Reativar</span>
                      </Button>
                    )}

                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-red-600 hover:text-red-700 flex items-center"
                      onClick={() => handleDeleteAnimal(animal.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      <span className="text-xs">{animal.is_partnership ? 'Sair' : 'Excluir'}</span>
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Modal de editar animal */}
        {animalToEdit && (
          <Suspense fallback={null}>
          <EditAnimalModal
            isOpen={isEditModalOpen}
            onClose={() => {
              setIsEditModalOpen(false);
              setAnimalToEdit(null);
            }}
            animal={animalToEdit}
            onSuccess={() => {
              clearDashboardCache();
              invalidateAnimalCaches();
              if (user?.id) {
                animalService.getUserAnimals(user.id).then(setAnimals);
              }
            }}
          />
          </Suspense>
        )}

        {/* Modal de compra de turbinar (duração) */}
        <Suspense fallback={null}>
        <PurchaseBoostsModal
          isOpen={isBoostCheckoutOpen}
          onClose={() => setIsBoostCheckoutOpen(false)}
          userId={user?.id || ''}
          animalId={boostTargetAnimalId}
          animalName={boostTargetAnimalName}
          onSuccess={() => {
            refreshBoosts();
            setIsBoostCheckoutOpen(false);
          }}
        />
        </Suspense>

        <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Animal com sócios ativos</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Este animal possui sócios cadastrados. Se você excluir, ele será removido do perfil de todos os sócios.
                Você pode transferir o animal para um sócio antes de excluir.
              </p>

              <div className="space-y-2">
                <span className="text-sm font-medium">Transferir para sócio</span>
                <Select
                  value={selectedTransferPartner}
                  onValueChange={setSelectedTransferPartner}
                  disabled={loadingTransferPartners}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingTransferPartners ? 'Carregando sócios...' : 'Selecione um sócio'} />
                  </SelectTrigger>
                  <SelectContent side="bottom" align="start" avoidCollisions={false}>
                    {transferPartners.map((partner) => (
                      <SelectItem key={partner.partner_id} value={partner.partner_id}>
                        {partner.partner_name || 'Sócio'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setAnimalToDelete(null);
                    setSelectedTransferPartner('');
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleConfirmDeleteWithPartners(false)}
                >
                  Excluir mesmo assim
                </Button>
                <Button
                  onClick={() => handleConfirmDeleteWithPartners(true)}
                  disabled={!selectedTransferPartner || loadingTransferPartners}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Transferir animal
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Wizard de Adicionar Animal */}
        <Suspense fallback={null}>
        <NewAnimalWizard
          isOpen={isAddAnimalModalOpen}
          onClose={() => setIsAddAnimalModalOpen(false)}
          onSuccess={(animalId, shareCode) => {
            // Recarregar lista após sucesso
            if (user?.id) {
              partnershipService.getUserAnimalsWithPartnerships(user.id).then(setAnimals);
            }
            toast({
              title: 'Animal cadastrado!',
              description: `Código secreto: ${shareCode}`,
            });
          }}
        />
        </Suspense>
      </ModernDashboardWrapper>
    </ProtectedRoute>
  );
};

export default AnimalsPage;