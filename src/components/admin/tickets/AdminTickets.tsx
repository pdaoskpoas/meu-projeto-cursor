import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  MessageSquare, 
  Clock, 
  CheckCircle, 
  BarChart3, 
  User, 
  Calendar,
  AlertCircle,
  Mail,
  Loader2,
  Send,
  MessageCircle
} from 'lucide-react';
import { useAdminTickets, TicketWithUser } from '@/hooks/admin/useAdminTickets';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { ticketService, TicketResponse } from '@/services/ticketService';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const AdminTickets: React.FC = () => {
  const [activeTab, setActiveTab] = useState('open');
  const { tickets, stats, isLoading, updateTicketStatus, updateTicketPriority, getTicketsByStatus, refetch } = useAdminTickets();
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Estado do modal de resposta
  const [isResponseModalOpen, setIsResponseModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<TicketWithUser | null>(null);
  const [responseText, setResponseText] = useState('');
  const [responseStatus, setResponseStatus] = useState<'in_progress' | 'closed'>('in_progress');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ticketResponses, setTicketResponses] = useState<TicketResponse[]>([]);

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      technical: 'Problema Técnico',
      billing: 'Planos e Pagamentos',
      account: 'Conta e Perfil',
      animals: 'Gestão de Animais',
      partnership: 'Sociedades',
      other: 'Outros'
    };
    return labels[category] || category;
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      low: 'bg-gray-100 text-gray-600',
      normal: 'bg-blue-100 text-blue-700',
      high: 'bg-blue-700 text-white',
      urgent: 'bg-gray-900 text-white'
    };
    return colors[priority] || colors.normal;
  };

  const getPriorityLabel = (priority: string) => {
    const labels: Record<string, string> = {
      low: 'Baixa',
      normal: 'Normal',
      high: 'Alta',
      urgent: 'Urgente'
    };
    return labels[priority] || priority;
  };

  const handleStatusChange = async (ticketId: string, newStatus: 'open' | 'in_progress' | 'closed') => {
    try {
      await updateTicketStatus(ticketId, newStatus);
      toast({
        title: 'Status atualizado',
        description: 'O status do ticket foi atualizado com sucesso.'
      });
    } catch (error) {
      toast({
        title: 'Erro ao atualizar status',
        description: error instanceof Error ? error.message : 'Tente novamente.',
        variant: 'destructive'
      });
    }
  };

  const handlePriorityChange = async (ticketId: string, newPriority: 'low' | 'normal' | 'high' | 'urgent') => {
    try {
      await updateTicketPriority(ticketId, newPriority);
      toast({
        title: 'Prioridade atualizada',
        description: 'A prioridade do ticket foi atualizada com sucesso.'
      });
    } catch (error) {
      toast({
        title: 'Erro ao atualizar prioridade',
        description: error instanceof Error ? error.message : 'Tente novamente.',
        variant: 'destructive'
      });
    }
  };

  const handleOpenResponseModal = async (ticket: TicketWithUser) => {
    setSelectedTicket(ticket);
    setResponseText('');
    setResponseStatus(ticket.status === 'open' ? 'in_progress' : ticket.status);
    
    // Carregar respostas existentes
    try {
      const responses = await ticketService.getTicketResponses(ticket.id);
      setTicketResponses(responses);
    } catch (error) {
      console.error('Erro ao carregar respostas:', error);
      setTicketResponses([]);
    }
    
    setIsResponseModalOpen(true);
  };

  const handleSubmitResponse = async () => {
    if (!responseText.trim() || !selectedTicket || !user) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Por favor, escreva uma resposta antes de enviar.',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      await ticketService.respondTicket(
        selectedTicket.id,
        user.id,
        responseText,
        responseStatus
      );

      toast({
        title: 'Resposta enviada!',
        description: 'O usuário foi notificado sobre sua resposta.'
      });

      setIsResponseModalOpen(false);
      setResponseText('');
      setSelectedTicket(null);
      
      // Recarregar lista de tickets
      await refetch();
    } catch (error) {
      console.error('Erro ao enviar resposta:', error);
      toast({
        title: 'Erro ao enviar resposta',
        description: error instanceof Error ? error.message : 'Tente novamente.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderTicketCard = (ticket: TicketWithUser) => (
    <Card key={ticket.id} className="p-6 hover:shadow-md transition-shadow">
      <div className="space-y-4">
        {/* Header do Ticket */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-semibold text-gray-900">{ticket.subject}</h3>
              <Badge className={getPriorityColor(ticket.priority)}>
                {getPriorityLabel(ticket.priority)}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <User className="h-4 w-4" />
                {ticket.user_name}
              </span>
              <span className="flex items-center gap-1">
                <Mail className="h-4 w-4" />
                {ticket.user_email}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {formatDistanceToNow(new Date(ticket.created_at), { 
                  addSuffix: true,
                  locale: ptBR 
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Categoria */}
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            {getCategoryLabel(ticket.category)}
          </Badge>
          <span className="text-xs text-gray-500">
            ID: {ticket.id.slice(0, 8)}
          </span>
        </div>

        {/* Descrição */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-sm text-gray-700 whitespace-pre-wrap">
            {ticket.description}
          </p>
        </div>

        {/* Ações */}
        <div className="flex items-center gap-3 pt-2 border-t">
          <Button
            size="sm"
            variant="default"
            onClick={() => handleOpenResponseModal(ticket)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
          >
            <MessageCircle className="h-4 w-4" />
            Responder
          </Button>
          
          {ticket.status === 'open' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleStatusChange(ticket.id, 'in_progress')}
              className="flex items-center gap-2"
            >
              <Clock className="h-4 w-4" />
              Iniciar Atendimento
            </Button>
          )}
          
          {ticket.status === 'in_progress' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleStatusChange(ticket.id, 'closed')}
              className="flex items-center gap-2 text-green-600 border-green-600 hover:bg-green-50"
            >
              <CheckCircle className="h-4 w-4" />
              Resolver
            </Button>
          )}

          {/* Dropdown de Prioridade */}
          <select
            value={ticket.priority}
            onChange={(e) => handlePriorityChange(ticket.id, e.target.value as 'low' | 'normal' | 'high' | 'urgent')}
            className="text-sm border border-gray-300 rounded px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="low">Prioridade: Baixa</option>
            <option value="normal">Prioridade: Normal</option>
            <option value="high">Prioridade: Alta</option>
            <option value="urgent">Prioridade: Urgente</option>
          </select>
        </div>
      </div>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Sistema de Tickets</h1>
            <p className="text-gray-600">Gerencie solicitações de suporte dos usuários</p>
          </div>
        </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <MessageSquare className="h-8 w-8 text-blue-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Abertos</p>
              <p className="text-3xl font-bold text-orange-600">{stats.open}</p>
            </div>
            <AlertCircle className="h-8 w-8 text-orange-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Em Andamento</p>
              <p className="text-3xl font-bold text-blue-600">{stats.in_progress}</p>
            </div>
            <Clock className="h-8 w-8 text-blue-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Fechados</p>
              <p className="text-3xl font-bold text-green-600">{stats.closed}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </Card>
      </div>

      {/* Tabs de Tickets */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="open" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Abertos ({stats.open})
          </TabsTrigger>
          <TabsTrigger value="progress" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Em Andamento ({stats.in_progress})
          </TabsTrigger>
          <TabsTrigger value="closed" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Fechados ({stats.closed})
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Estatísticas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="open" className="space-y-4">
          {getTicketsByStatus('open').length === 0 ? (
            <Card className="p-12">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Nenhum ticket aberto no momento.</p>
              </div>
            </Card>
          ) : (
            getTicketsByStatus('open').map(renderTicketCard)
          )}
        </TabsContent>

        <TabsContent value="progress" className="space-y-4">
          {getTicketsByStatus('in_progress').length === 0 ? (
            <Card className="p-12">
              <div className="text-center">
                <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Nenhum ticket em andamento.</p>
              </div>
            </Card>
          ) : (
            getTicketsByStatus('in_progress').map(renderTicketCard)
          )}
        </TabsContent>

        <TabsContent value="closed" className="space-y-4">
          {getTicketsByStatus('closed').length === 0 ? (
            <Card className="p-12">
              <div className="text-center">
                <CheckCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Nenhum ticket fechado ainda.</p>
              </div>
            </Card>
          ) : (
            getTicketsByStatus('closed').map(renderTicketCard)
          )}
        </TabsContent>

        <TabsContent value="stats" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-6">Estatísticas de Tickets</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Tempo Médio de Resposta */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-600">Tempo Médio de Resolução</p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.avg_response_time > 0 ? `${stats.avg_response_time}h` : '-'}
                </p>
                <p className="text-xs text-gray-500">
                  Baseado em {stats.closed} tickets fechados
                </p>
              </div>

              {/* Taxa de Resolução */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-600">Taxa de Resolução</p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.total > 0 
                    ? `${Math.round((stats.closed / stats.total) * 100)}%` 
                    : '-'}
                </p>
                <p className="text-xs text-gray-500">
                  {stats.closed} de {stats.total} tickets resolvidos
                </p>
              </div>
            </div>

            {/* Distribuição por Status */}
            <div className="mt-8">
              <p className="text-sm font-medium text-gray-600 mb-4">Distribuição por Status</p>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Abertos</span>
                    <span className="font-medium">{stats.open}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-orange-600 h-2 rounded-full transition-all"
                      style={{ width: stats.total > 0 ? `${(stats.open / stats.total) * 100}%` : '0%' }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Em Andamento</span>
                    <span className="font-medium">{stats.in_progress}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: stats.total > 0 ? `${(stats.in_progress / stats.total) * 100}%` : '0%' }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Fechados</span>
                    <span className="font-medium">{stats.closed}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all"
                      style={{ width: stats.total > 0 ? `${(stats.closed / stats.total) * 100}%` : '0%' }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
      </div>

      {/* Modal de Resposta */}
      <Dialog open={isResponseModalOpen} onOpenChange={setIsResponseModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Responder Ticket</DialogTitle>
            <DialogDescription>
              {selectedTicket && (
                <>
                  <span className="font-semibold">{selectedTicket.subject}</span>
                  <br />
                  De: {selectedTicket.user_name} ({selectedTicket.user_email})
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Descrição original do ticket */}
            {selectedTicket && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm font-semibold text-gray-700 mb-2">Descrição do problema:</p>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">
                  {selectedTicket.description}
                </p>
              </div>
            )}

            {/* Respostas anteriores */}
            {ticketResponses.length > 0 && (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-gray-700">Respostas anteriores:</p>
                {ticketResponses.map((response) => (
                  <div key={response.id} className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-blue-700">
                        {response.admin_name || 'Administrador'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(response.created_at), {
                          addSuffix: true,
                          locale: ptBR
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {response.response}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Nova resposta */}
            <div className="space-y-3">
              <Label htmlFor="response">Nova Resposta *</Label>
              <Textarea
                id="response"
                placeholder="Digite sua resposta ao ticket..."
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                className="min-h-[150px] resize-none"
              />
            </div>

            {/* Status após resposta */}
            <div className="space-y-3">
              <Label htmlFor="status">Status após responder</Label>
              <select
                id="status"
                value={responseStatus}
                onChange={(e) => setResponseStatus(e.target.value as 'in_progress' | 'closed')}
                className="w-full h-10 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="in_progress">Em Andamento</option>
                <option value="closed">Concluído</option>
              </select>
              <p className="text-xs text-gray-500">
                Escolha "Em Andamento" se ainda precisa acompanhar ou "Concluído" se o problema foi resolvido.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsResponseModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmitResponse}
              disabled={isSubmitting || !responseText.trim()}
              className="flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Enviar Resposta
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminTickets;
