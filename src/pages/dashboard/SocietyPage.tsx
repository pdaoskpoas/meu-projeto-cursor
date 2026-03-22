import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  UserPlus,
  Search,
  Award,
  CheckCircle,
  Clock,
  X,
  Copy,
  AlertTriangle,
  Loader2,
  Check,
  XCircle,
  Edit,
  Trash2,
  Lock
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import DashboardPageWrapper from '@/components/layout/DashboardPageWrapper';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { partnershipService } from '@/services/partnershipService';

const SocietyPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const planBlocked = !user?.hasActivePlan;
  const isVip = user?.plan === 'vip';

  // Estados
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [partnershipToEdit, setPartnershipToEdit] = useState(null);
  const [selectedAnimal, setSelectedAnimal] = useState('');
  const [partnerCode, setPartnerCode] = useState('');
  const [percentage, setPercentage] = useState('50');
  
  // Dados
  const [userAnimals, setUserAnimals] = useState([]);
  const [receivedInvites, setReceivedInvites] = useState([]);
  const [sentInvites, setSentInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [processingId, setProcessingId] = useState(null);

  // Carregar dados
  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      // Buscar convites recebidos e enviados
      const partnerships = await partnershipService.getUserPartnerships(user.id);
      setReceivedInvites(partnerships.received);
      setSentInvites(partnerships.sent);

      // Buscar animais do usuário com sociedades
      const animals = await partnershipService.getUserAnimalsWithPartnerships(user.id);
      setUserAnimals(animals);

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: 'Erro ao carregar dados',
        description: error.message || 'Não foi possível carregar suas sociedades',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [toast, user?.id]);

  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [user?.id, loadData]);

  const handleCopyCode = () => {
    const code = user?.publicCode;
    if (!code) {
      toast({
        title: 'Código não disponível',
        description: 'Você ainda não possui um código público',
        variant: 'destructive'
      });
      return;
    }

    navigator.clipboard.writeText(code);
    toast({
      title: 'Código copiado!',
      description: 'Seu código público foi copiado para a área de transferência.',
    });
  };

  const handleSendInvite = async () => {
    if (!selectedAnimal) {
      toast({
        title: 'Selecione um animal',
        description: 'Escolha qual animal você deseja compartilhar',
        variant: 'destructive'
      });
      return;
    }

    if (!partnerCode.trim()) {
      toast({
        title: 'Digite o código',
        description: 'Informe o código público do parceiro',
        variant: 'destructive'
      });
      return;
    }

    const percentNum = parseFloat(percentage);
    if (isNaN(percentNum) || percentNum <= 0 || percentNum > 100) {
      toast({
        title: 'Percentual inválido',
        description: 'O percentual deve estar entre 1 e 100',
        variant: 'destructive'
      });
      return;
    }

    try {
      setSending(true);
      
      await partnershipService.sendPartnershipInvite(
        selectedAnimal,
        partnerCode.trim().toUpperCase(),
        percentNum
      );

      toast({
        title: '✅ Sociedade criada com sucesso!',
        description: `${partnerCode.trim().toUpperCase()} foi adicionado como sócio com ${percentNum}% de participação.`,
      });

      // Limpar form e fechar modal
      setSelectedAnimal('');
      setPartnerCode('');
      setPercentage('50');
      setIsAddModalOpen(false);

      // Recarregar dados
      loadData();

    } catch (error) {
      console.error('Erro ao criar sociedade:', error);
      const errorMessage = error.message || 'Não foi possível criar a sociedade';
      toast({
        title: '❌ Erro ao criar sociedade',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setSending(false);
    }
  };

  const handleAcceptInvite = async (partnershipId: string) => {
    try {
      setProcessingId(partnershipId);
      
      await partnershipService.acceptPartnership(partnershipId, user.id);

      toast({
        title: '✅ Convite aceito!',
        description: 'O animal agora faz parte do seu portfólio.',
      });

      // Recarregar dados
      loadData();

    } catch (error) {
      console.error('Erro ao aceitar convite:', error);
      toast({
        title: '❌ Erro ao aceitar convite',
        description: error.message || 'Não foi possível aceitar o convite',
        variant: 'destructive'
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectInvite = async (partnershipId: string) => {
    try {
      setProcessingId(partnershipId);
      
      await partnershipService.rejectPartnership(partnershipId, user.id);

      toast({
        title: '✅ Sociedade removida',
        description: 'A sociedade foi encerrada com sucesso.',
      });

      // Recarregar dados
      loadData();

    } catch (error) {
      console.error('Erro ao remover sociedade:', error);
      toast({
        title: '❌ Erro ao remover sociedade',
        description: error.message || 'Não foi possível remover a sociedade',
        variant: 'destructive'
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleLeavePartnership = async (partnershipId: string, animalName: string) => {
    // Confirmar ação
    if (!confirm(`Tem certeza que deseja sair da sociedade do animal "${animalName}"? O animal deixará de aparecer no seu perfil.`)) {
      return;
    }

    try {
      setProcessingId(partnershipId);
      
      await partnershipService.leavePartnership(partnershipId, user.id);

      toast({
        title: '✅ Você saiu da sociedade',
        description: 'O animal não aparecerá mais no seu perfil.',
      });

      // Recarregar dados
      loadData();

    } catch (error) {
      console.error('Erro ao sair da sociedade:', error);
      const errorMessage = error.message || 'Não foi possível sair da sociedade';
      toast({
        title: '❌ Erro ao sair da sociedade',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleRemovePartner = async (partnershipId: string, partnerName: string, animalName: string) => {
    // Confirmar ação
    if (!confirm(`Tem certeza que deseja remover "${partnerName}" da sociedade do animal "${animalName}"?`)) {
      return;
    }

    try {
      setProcessingId(partnershipId);
      
      await partnershipService.removePartnership(partnershipId, user.id);

      toast({
        title: '✅ Sócio removido',
        description: `${partnerName} foi removido da sociedade com sucesso.`,
      });

      // Recarregar dados
      loadData();

    } catch (error) {
      console.error('Erro ao remover sócio:', error);
      toast({
        title: '❌ Erro ao remover sócio',
        description: error.message || 'Não foi possível remover o sócio',
        variant: 'destructive'
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleOpenEditModal = (partnership) => {
    setPartnershipToEdit(partnership);
    setPercentage(partnership.percentage.toString());
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!partnershipToEdit) return;

    const percentNum = parseFloat(percentage);
    if (isNaN(percentNum) || percentNum <= 0 || percentNum > 100) {
      toast({
        title: 'Percentual inválido',
        description: 'O percentual deve estar entre 1 e 100',
        variant: 'destructive'
      });
      return;
    }

    try {
      setSending(true);
      
      await partnershipService.updatePartnershipPercentage(
        partnershipToEdit.id,
        percentNum,
        user.id
      );

      toast({
        title: '✅ Porcentagem atualizada',
        description: `A participação foi atualizada para ${percentNum}%.`,
      });

      // Fechar modal e recarregar
      setIsEditModalOpen(false);
      setPartnershipToEdit(null);
      setPercentage('50');
      loadData();

    } catch (error) {
      console.error('Erro ao atualizar porcentagem:', error);
      toast({
        title: '❌ Erro ao atualizar',
        description: error.message || 'Não foi possível atualizar a porcentagem',
        variant: 'destructive'
      });
    } finally {
      setSending(false);
    }
  };

  // Filtros
  const filteredReceived = receivedInvites.filter(inv => {
    if (filterStatus === 'pending' && inv.status !== 'pending') return false;
    if (filterStatus === 'accepted' && inv.status !== 'accepted') return false;
    if (searchTerm && !inv.animal_name?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const filteredSent = sentInvites.filter(inv => {
    if (filterStatus === 'pending' && inv.status !== 'pending') return false;
    if (filterStatus === 'accepted' && inv.status !== 'accepted') return false;
    if (searchTerm && !inv.animal_name?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  // Estatísticas
  const stats = {
    animalsCount: userAnimals.length,
    pendingCount: receivedInvites.filter(inv => inv.status === 'pending').length,
    activeCount: receivedInvites.filter(inv => inv.status === 'accepted').length + sentInvites.filter(inv => inv.status === 'accepted').length
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <DashboardPageWrapper title="Sociedades" subtitle="Carregando...">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        </DashboardPageWrapper>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <DashboardPageWrapper 
        title="Sociedades"
        subtitle="Gerencie suas sociedades e parcerias"
        actions={
          <Button 
            onClick={() => setIsAddModalOpen(true)}
            className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <UserPlus className="h-5 w-5 mr-2" />
            Nova Sociedade
          </Button>
        }
      >
        <div className={`grid grid-cols-1 ${isVip ? 'lg:grid-cols-3' : ''} gap-8`}>
          {/* Código Público - Apenas para VIP */}
          {isVip && (
            <div className="lg:col-span-1">
              <Card className="bg-white shadow-lg">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Award className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">Seu Código Público</h2>
                      <p className="text-sm text-gray-600">Compartilhe com parceiros</p>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 text-center border border-blue-200">
                    <div className="text-3xl font-bold text-blue-900 font-mono tracking-wider mb-2">
                      {user?.publicCode || 'N/A'}
                    </div>
                    <p className="text-sm text-blue-700 mb-4">Para sociedades e parcerias</p>
                    <Button
                      onClick={handleCopyCode}
                      variant="outline"
                      className="border-blue-300 text-blue-700 hover:bg-blue-50"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copiar Código
                    </Button>
                  </div>

                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-gray-700">Como funciona:</p>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li className="flex items-start space-x-2">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span>Compartilhe seu código com parceiros</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span>Animais aparecem nos perfis dos sócios ativos</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span>Máximo de 10 sócios por animal</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span>Apenas sócios com plano ativo são exibidos</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Conteúdo Principal */}
          <div className={`${isVip ? 'lg:col-span-2' : ''} space-y-6`}>
            {/* Busca e Filtros */}
            <Card className="bg-white shadow-lg">
              <div className="p-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Buscar por nome do animal..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-full md:w-48">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent side="bottom" align="start" avoidCollisions={false}>
                      <SelectItem value="all">Todas as Sociedades</SelectItem>
                      <SelectItem value="pending">Pendentes</SelectItem>
                      <SelectItem value="accepted">Ativas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Card>

            {/* Estatísticas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-white p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Meus Animais</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.animalsCount}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
              </Card>
              <Card className="bg-white p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Convites Pendentes</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.pendingCount}</p>
                  </div>
                  <Clock className="h-8 w-8 text-yellow-600" />
                </div>
              </Card>
              <Card className="bg-white p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Sociedades Ativas</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.activeCount}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </Card>
            </div>

            {/* Sociedades Como Sócio */}
            {filteredReceived.length > 0 && (
              <Card className="bg-white shadow-lg">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900">Sociedades Como Sócio</h2>
                  <p className="text-sm text-gray-600">Animais em que você participa como sócio</p>
                </div>
                
                <div className="p-6 space-y-4">
                  {filteredReceived.map((invite) => (
                    <div key={invite.id} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{invite.animal_name}</h3>
                          <p className="text-sm text-gray-600 mt-1">
                            Proprietário: <span className="font-medium">{invite.owner_name}</span>
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            {invite.status === 'pending' ? (
                              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                                <Clock className="h-3 w-3 mr-1" />
                                Pendente
                              </Badge>
                            ) : (
                              <Badge variant="default" className="bg-green-100 text-green-800">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Ativo
                              </Badge>
                            )}
                            <span className="text-sm text-blue-600 font-medium">
                              {invite.percentage}% de participação
                            </span>
                          </div>
                        </div>
                        
                        {/* Botões diferentes para pending e accepted */}
                        <div className="ml-4 flex gap-2">
                          {invite.status === 'pending' ? (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleAcceptInvite(invite.id)}
                                disabled={processingId === invite.id}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                {processingId === invite.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                                ) : (
                                  <Check className="h-4 w-4 mr-1" />
                                )}
                                Aceitar
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleRejectInvite(invite.id)}
                                disabled={processingId === invite.id}
                              >
                                {processingId === invite.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                                ) : (
                                  <X className="h-4 w-4 mr-1" />
                                )}
                                Rejeitar
                              </Button>
                            </>
                          ) : (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleLeavePartnership(invite.id, invite.animal_name)}
                              disabled={processingId === invite.id}
                            >
                              {processingId === invite.id ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-1" />
                              ) : (
                                <XCircle className="h-4 w-4 mr-1" />
                              )}
                              Deixar Sociedade
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Sociedades Como Proprietário */}
            {filteredSent.length > 0 && (
              <Card className="bg-white shadow-lg">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900">Sociedades Como Proprietário</h2>
                  <p className="text-sm text-gray-600">Sócios nos seus animais</p>
                </div>
                
                <div className="p-6 space-y-4">
                  {filteredSent.map((invite) => (
                    <div key={invite.id} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{invite.animal_name}</h3>
                          <p className="text-sm text-gray-600 mt-1">
                            Sócio: <span className="font-medium">{invite.partner_name}</span>
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            {invite.status === 'pending' ? (
                              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                                <Clock className="h-3 w-3 mr-1" />
                                Aguardando Aceitação
                              </Badge>
                            ) : (
                              <Badge variant="default" className="bg-green-100 text-green-800">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Ativo
                              </Badge>
                            )}
                            <span className="text-sm text-blue-600 font-medium">
                              {invite.percentage}% de participação
                            </span>
                          </div>
                        </div>
                        
                        {/* Botões para gerenciar sociedade */}
                        <div className="ml-4 flex gap-2">
                          {invite.status === 'accepted' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenEditModal(invite)}
                              disabled={processingId === invite.id}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Editar
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleRemovePartner(invite.id, invite.partner_name, invite.animal_name)}
                            disabled={processingId === invite.id}
                          >
                            {processingId === invite.id ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-1" />
                            ) : (
                              <Trash2 className="h-4 w-4 mr-1" />
                            )}
                            Remover
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Mensagem vazia */}
            {filteredReceived.length === 0 && filteredSent.length === 0 && (
              <Card className="bg-white shadow-lg p-12 text-center">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Nenhuma sociedade encontrada
                </h3>
                <p className="text-gray-600 mb-4">
                  Comece adicionando sócios aos seus animais
                </p>
                <Button onClick={() => setIsAddModalOpen(true)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Criar Sociedade
                </Button>
              </Card>
            )}
          </div>
        </div>

        {/* Modal Nova Sociedade */}
        {isAddModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl relative">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Nova Sociedade</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsAddModalOpen(false)}
                  disabled={sending}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div className="relative">
                <div className={planBlocked ? 'blur-[2px] pointer-events-none select-none opacity-60' : ''}>
                  <div className="space-y-6">
                    {/* Selecionar Animal */}
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Selecionar Animal
                      </label>
                      <Select value={selectedAnimal} onValueChange={setSelectedAnimal}>
                        <SelectTrigger>
                          <SelectValue placeholder="Escolha um animal" />
                        </SelectTrigger>
                        <SelectContent side="bottom" align="start" avoidCollisions={false}>
                          {userAnimals.filter(a => !a.is_partnership).map(animal => (
                            <SelectItem key={animal.id} value={animal.id}>
                              {animal.name} - {animal.breed}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-500 mt-1">
                        Apenas animais próprios podem ter sociedades
                      </p>
                    </div>

                    {/* Código do Parceiro */}
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Código do Parceiro
                      </label>
                      <Input
                        placeholder="Ex: HER2024"
                        value={partnerCode}
                        onChange={(e) => setPartnerCode(e.target.value.toUpperCase())}
                        className="font-mono"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Digite o código público do parceiro
                      </p>
                    </div>

                    {/* Percentual */}
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Percentual de Participação (%)
                      </label>
                      <Input
                        type="number"
                        min="1"
                        max="100"
                        placeholder="50"
                        value={percentage}
                        onChange={(e) => setPercentage(e.target.value)}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Defina a participação do sócio (1-100%)
                      </p>
                    </div>

                    {/* Alerta */}
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription className="text-sm">
                        O parceiro precisa ter plano ativo para o animal aparecer no perfil dele.
                      </AlertDescription>
                    </Alert>

                    {/* Botões */}
                    <div className="flex justify-end space-x-3">
                      <Button
                        variant="outline"
                        onClick={() => setIsAddModalOpen(false)}
                        disabled={sending}
                      >
                        Cancelar
                      </Button>
                      <Button
                        onClick={handleSendInvite}
                        disabled={sending}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        {sending ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Enviando...
                          </>
                        ) : (
                          <>
                            <UserPlus className="h-4 w-4 mr-2" />
                            Enviar Convite
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Overlay de bloqueio - sem plano ativo */}
                {planBlocked && (
                  <div className="absolute inset-0 flex items-center justify-center z-10">
                    <div className="bg-white/95 backdrop-blur-sm border-2 border-blue-200 rounded-2xl shadow-2xl p-6 sm:p-8 max-w-md mx-4 text-center">
                      <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                        <Lock className="h-8 w-8 text-blue-600" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        Plano necessário para criar sociedades
                      </h3>
                      <p className="text-gray-600 mb-6 text-sm leading-relaxed">
                        Para criar sociedades e parcerias, é necessário ter um plano ativo. Escolha o plano ideal para você e comece agora!
                      </p>
                      <div className="space-y-3">
                        <Button
                          onClick={() => {
                            setIsAddModalOpen(false);
                            navigate('/planos');
                          }}
                          className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base gap-2"
                        >
                          Ver Planos
                        </Button>
                        <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                          <Badge variant="secondary" className="text-xs font-normal">
                            A partir de R$ 33,25/mês
                          </Badge>
                        </div>
                        <Button
                          variant="ghost"
                          onClick={() => setIsAddModalOpen(false)}
                          className="w-full text-gray-500 hover:text-gray-700 text-sm"
                        >
                          Voltar
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal Editar Porcentagem */}
        {isEditModalOpen && partnershipToEdit && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Editar Participação</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setPartnershipToEdit(null);
                    setPercentage('50');
                  }}
                  disabled={sending}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              
              <div className="space-y-6">
                <div>
                  <p className="text-sm text-gray-600 mb-2">
                    <span className="font-semibold">Animal:</span> {partnershipToEdit.animal_name}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold">Sócio:</span> {partnershipToEdit.partner_name}
                  </p>
                </div>

                {/* Percentual */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Nova Porcentagem de Participação (%)
                  </label>
                  <Input
                    type="number"
                    min="1"
                    max="100"
                    value={percentage}
                    onChange={(e) => setPercentage(e.target.value)}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Defina a nova participação do sócio (1-100%)
                  </p>
                </div>
                
                {/* Botões */}
                <div className="flex justify-end space-x-3">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setIsEditModalOpen(false);
                      setPartnershipToEdit(null);
                      setPercentage('50');
                    }}
                    disabled={sending}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleSaveEdit}
                    disabled={sending}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {sending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Salvar
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </DashboardPageWrapper>
    </ProtectedRoute>
  );
};

export default SocietyPage;
