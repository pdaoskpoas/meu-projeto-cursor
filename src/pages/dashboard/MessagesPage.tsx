import React, { useState, useEffect } from 'react';
import { Search, MessageCircle, Send, ArrowLeft, MoreVertical, Trash2, User, AlertTriangle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import DashboardPageWrapper from '@/components/layout/DashboardPageWrapper';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useChat } from '@/contexts/ChatContext';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import ReportMessageDialog from '@/components/ReportMessageDialog';
import { markConversationAsRead } from '@/lib/unreadHelpers';

const MessagesPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { 
    conversations, 
    currentConversation, 
    messages, 
    sendStatus, 
    loading,
    openConversation, 
    sendMessage,
    refreshConversations,
    closeConversation 
  } = useChat();
  const [searchTerm, setSearchTerm] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const [sending, setSending] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Limpar conversa ao montar o componente (exceto se houver parâmetro na URL)
  useEffect(() => {
    const conversationId = searchParams.get('conversation');
    // Só limpar se NÃO houver parâmetro conversation na URL
    if (!conversationId) {
      closeConversation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Executar apenas uma vez ao montar

  // Abrir conversa automaticamente se houver parâmetro na URL
  useEffect(() => {
    const conversationId = searchParams.get('conversation');
    if (conversationId && conversations.length > 0) {
      // Verificar se a conversa existe na lista
      const conversation = conversations.find(conv => conv.id === conversationId);
      if (conversation) {
        handleOpenConversation(conversationId);
        // Limpar o parâmetro da URL após abrir a conversa
        setSearchParams({});
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversations, searchParams, setSearchParams]);

  // Função para abrir conversa e marcar como lida
  const handleOpenConversation = async (conversationId: string) => {
    if (!user?.id) return;
    
    openConversation(conversationId);
    
    // Marcar mensagens como lidas
    await markConversationAsRead(conversationId, user.id);
    
    // Atualizar lista de conversas para refletir mudança
    await refreshConversations();
    
    // Disparar evento para forçar atualização do contador no menu
    window.dispatchEvent(new Event('forceUpdateUnreadCounts'));
  };

  const filteredConversations = conversations.filter(conv => {
    const otherUserName = conv.animalOwnerId === user?.id ? conv.interestedUserName : conv.animalOwnerName;
    return otherUserName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           conv.animalName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Ontem';
    } else {
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !currentConversation || sending) return;
    
    // Verificar se pode enviar
    if (sendStatus && !sendStatus.canSend) {
      return; // Toast já foi mostrado no ChatContext
    }
    
    setSending(true);
    try {
      await sendMessage(newMessage.trim());
      setNewMessage('');
    } catch (error) {
      console.error('Erro ao enviar:', error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Obter informações do outro usuário na conversa
  const getOtherUser = () => {
    if (!currentConversation || !user) return null;
    
    const isOwner = currentConversation.animalOwnerId === user.id;
    return {
      id: isOwner ? currentConversation.interestedUserId : currentConversation.animalOwnerId,
      name: isOwner ? currentConversation.interestedUserName : currentConversation.animalOwnerName
    };
  };

  // Ver perfil do usuário
  const handleViewProfile = () => {
    const otherUser = getOtherUser();
    if (!otherUser) return;
    
    navigate(`/perfil/${otherUser.id}`);
  };

  // Ver animal
  const handleViewAnimal = () => {
    if (!currentConversation) return;
    
    navigate(`/animal/${currentConversation.animalId}`);
  };

  // Denunciar conversa/mensagem
  const handleReport = () => {
    setShowReportDialog(true);
  };

  // Excluir conversa (soft delete)
  const handleDeleteConversation = async () => {
    if (!currentConversation || !user?.id) return;
    
    setIsDeleting(true);
    
    try {
      // Criar campo de soft delete se não existir
      // Vamos usar um campo deleted_for_users do tipo array
      const { data: conv } = await supabase
        .from('conversations')
        .select('deleted_for_users')
        .eq('id', currentConversation.id)
        .single();
      
      const deletedFor = (conv?.deleted_for_users as string[]) || [];
      
      // Adicionar usuário atual à lista
      if (!deletedFor.includes(user.id)) {
        deletedFor.push(user.id);
      }
      
      // Atualizar conversa
      const { error } = await supabase
        .from('conversations')
        .update({ deleted_for_users: deletedFor })
        .eq('id', currentConversation.id);
      
      if (error) throw error;
      
      toast.success('Conversa excluída com sucesso');
      
      // Fechar diálogo e atualizar lista
      setShowDeleteDialog(false);
      await refreshConversations();
      
      // Limpar conversa atual
      openConversation('');
    } catch (error) {
      console.error('Erro ao excluir conversa:', error);
      toast.error('Erro ao excluir conversa. Tente novamente.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <ProtectedRoute>
      <DashboardPageWrapper 
        title="Mensagens"
        subtitle="Suas conversas e mensagens"
      >
        {/* Messages Container */}
        <Card className="h-[calc(100dvh-280px)] bg-white shadow-lg">
          <div className="flex h-full">
            {/* Conversations List */}
            <div className="w-96 border-r border-gray-200 flex flex-col">
              {/* Search Header */}
              <div className="p-4 border-b border-gray-200">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar conversas..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Conversations */}
              <ScrollArea className="flex-1">
                {filteredConversations.length === 0 ? (
                  <div className="p-8 text-center">
                    <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">Nenhuma conversa ainda</p>
                    <p className="text-sm text-gray-400 mt-1">
                      As conversas sobre seus animais aparecerão aqui
                    </p>
                  </div>
                ) : (
                  filteredConversations.map((conv) => {
                    const otherUserName = conv.animalOwnerId === user?.id 
                      ? conv.interestedUserName 
                      : conv.animalOwnerName;
                    const isActive = currentConversation?.id === conv.id;
                    
                    return (
                      <div
                        key={conv.id}
                        onClick={() => handleOpenConversation(conv.id)}
                        className={`p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100 transition-colors ${
                          isActive ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={`https://ui-avatars.com/api/?name=${otherUserName}&background=random`} />
                            <AvatarFallback>{otherUserName[0]}</AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h4 className="font-semibold text-gray-900 truncate">
                                {otherUserName}
                              </h4>
                              <span className="text-xs text-gray-500">
                                {conv.lastMessageTime && formatTime(conv.lastMessageTime)}
                              </span>
                            </div>
                            
                            <p className="text-sm text-gray-600 truncate">
                              {conv.animalName === 'Mensagem Direta' ? (
                                <span className="italic">Mensagem Direta</span>
                              ) : (
                                conv.animalName
                              )}
                            </p>
                            
                            {conv.lastMessage && (
                              <p className="text-sm text-gray-500 truncate mt-1">
                                {conv.lastMessage}
                              </p>
                            )}
                          </div>
                          
                          {conv.unreadCount > 0 && (
                            <Badge className="bg-blue-600 text-white">
                              {conv.unreadCount}
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </ScrollArea>
            </div>

            {/* Chat Window */}
            <div className="flex-1 flex flex-col">
              {currentConversation ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage 
                          src={`https://ui-avatars.com/api/?name=${
                            currentConversation.animalOwnerId === user?.id 
                              ? currentConversation.interestedUserName 
                              : currentConversation.animalOwnerName
                          }&background=random`} 
                        />
                        <AvatarFallback>
                          {(currentConversation.animalOwnerId === user?.id 
                            ? currentConversation.interestedUserName 
                            : currentConversation.animalOwnerName)[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {currentConversation.animalOwnerId === user?.id 
                            ? currentConversation.interestedUserName 
                            : currentConversation.animalOwnerName}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {currentConversation.animalName === 'Mensagem Direta' ? (
                            <span className="italic">Mensagem Direta</span>
                          ) : (
                            currentConversation.animalName
                          )}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={handleViewProfile}>
                            <User className="h-4 w-4 mr-2" />
                            Ver perfil
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={handleViewAnimal}>
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Ver animal
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={handleReport} className="text-red-600">
                            <AlertTriangle className="h-4 w-4 mr-2" />
                            Denunciar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setShowDeleteDialog(true)} className="text-red-600">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Excluir conversa
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Messages */}
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                      {messages.map((message) => {
                        const isMyMessage = message.senderId === user?.id;
                        return (
                          <div
                            key={message.id}
                            className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                isMyMessage
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-gray-100 text-gray-900'
                              }`}
                            >
                              <p className="text-sm">{message.content}</p>
                              <p className={`text-xs mt-1 ${
                                isMyMessage ? 'text-blue-100' : 'text-gray-500'
                              }`}>
                                {formatTime(message.timestamp)}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>

                  {/* Message Input */}
                  <div className="p-4 border-t border-gray-200">
                    {/* Verificar se anúncio está bloqueado */}
                    {sendStatus && !sendStatus.canSend ? (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start space-x-3">
                        <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="font-semibold text-yellow-900 mb-1">
                            {sendStatus.statusType === 'paused' && 'Anúncio Pausado'}
                            {sendStatus.statusType === 'expired' && 'Anúncio Expirado'}
                            {sendStatus.statusType === 'suspended' && 'Conversa Suspensa'}
                            {!sendStatus.statusType && 'Conversa Bloqueada'}
                          </p>
                          <p className="text-sm text-yellow-800">
                            {sendStatus.reason}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex space-x-2">
                        <Input
                          placeholder="Digite sua mensagem..."
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={handleKeyPress}
                          className="flex-1"
                          disabled={sending}
                        />
                        <Button 
                          onClick={handleSendMessage}
                          disabled={!newMessage.trim() || sending}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          {sending ? (
                            <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <MessageCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Selecione uma conversa
                    </h3>
                    <p className="text-gray-500">
                      Escolha uma conversa ao lado para começar
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Dialog de denúncia */}
        {currentConversation && (
          <ReportMessageDialog
            open={showReportDialog}
            onOpenChange={setShowReportDialog}
            conversationId={currentConversation.id}
            reportedUserId={getOtherUser()?.id || ''}
            reportedUserName={getOtherUser()?.name || ''}
          />
        )}

        {/* Dialog de confirmação de exclusão */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir conversa?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação irá remover a conversa apenas da sua conta. O outro usuário ainda terá acesso às mensagens.
                Para remover completamente, ambos os usuários precisam excluir a conversa.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConversation}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700"
              >
                {isDeleting ? 'Excluindo...' : 'Excluir'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DashboardPageWrapper>
    </ProtectedRoute>
  );
};

export default MessagesPage;