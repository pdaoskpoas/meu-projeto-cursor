/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { ChatMessage, ChatConversation } from '@/data/chatData';
import { useAuth } from './AuthContext';
import { messageService, MessageSendStatus } from '@/services/messageService';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { runResilientRequest, isStaleRequestError } from '@/services/resilientRequestService';

interface ChatContextType {
  conversations: ChatConversation[];
  currentConversation: ChatConversation | null;
  messages: ChatMessage[];
  unreadCount: number;
  sendStatus: MessageSendStatus | null;
  loading: boolean;
  openConversation: (conversationId: string) => void;
  sendMessage: (content: string) => Promise<void>;
  startConversation: (animalId: string, animalName: string, animalOwnerId: string, animalOwnerName: string, isDirectMessage?: boolean) => Promise<string>;
  startTemporaryConversation: (animalId: string, animalName: string, animalOwnerId: string, animalOwnerName: string) => Promise<string>;
  startHarasConversation: (harasId: string, harasName: string, harasOwnerId: string, harasOwnerName: string) => Promise<string>;
  markAsRead: (conversationId: string) => void;
  closeConversation: () => void;
  hideMessage: (messageId: string) => Promise<void>;
  refreshConversations: () => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [sendStatus, setSendStatus] = useState<MessageSendStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const isLoadingConversationsRef = useRef(false);
  const conversationsRequestIdRef = useRef(0);
  const conversationsRef = useRef<ChatConversation[]>([]);

  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  // Buscar conversas do usuário
  const loadConversations = useCallback(async () => {
    const requestId = ++conversationsRequestIdRef.current;

    if (!user?.id) {
      if (requestId === conversationsRequestIdRef.current) {
        setConversations([]);
        setUnreadCount(0);
      }
      return;
    }

    if (isLoadingConversationsRef.current) return;
    isLoadingConversationsRef.current = true;

    try {
      setLoading(true);
      const convs = await runResilientRequest(
        () => messageService.getConversations(user.id),
        {
          timeoutMs: 20_000,
          errorMessage: 'Falha ao carregar conversas.',
          requestKey: `chat-conversations:${user.id}`
        }
      );
      
      // Converter formato do service para formato do chat
      const formattedConvs: ChatConversation[] = convs.map(c => ({
        id: c.id,
        animalId: c.animal_id,
        animalName: c.animal?.name || '',
        animalOwnerId: c.animal_owner_id,
        animalOwnerName: c.owner?.name || '',
        interestedUserId: c.interested_user_id,
        interestedUserName: c.interested?.name || '',
        lastMessage: c.lastMessage,
        lastMessageTime: c.lastMessageTime,
        unreadCount: c.unreadCount || 0,
        createdAt: c.created_at,
        isActive: c.is_active,
        isTemporary: c.is_temporary
      }));
      
      // Filtrar conversas temporárias para o proprietário
      const filtered = formattedConvs.filter(conv => {
        if (conv.animalOwnerId === user.id) {
          return !conv.isTemporary;
        }
        return true;
      });

      if (requestId !== conversationsRequestIdRef.current) return;
      setConversations(filtered);

      // Calcular total não lido
      const total = filtered.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
      setUnreadCount(total);
    } catch (error) {
      if (isStaleRequestError(error) || requestId !== conversationsRequestIdRef.current) return;
      console.error('Erro ao carregar conversas:', error);
      toast.error('Erro ao carregar conversas');
    } finally {
      if (requestId === conversationsRequestIdRef.current) {
        setLoading(false);
      }
      isLoadingConversationsRef.current = false;
    }
  }, [user?.id]);
  
  // Carregar conversas ao montar e quando usuário mudar
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);
  
  // Buscar mensagens quando conversa atual mudar
  useEffect(() => {
    if (!currentConversation || !user?.id) {
      setMessages([]);
      setSendStatus(null);
      return;
    }
    
    const loadMessages = async () => {
      try {
        const msgs = await messageService.getMessages(currentConversation.id, user.id);
        
        // Converter formato
        const formatted: ChatMessage[] = msgs.map(m => ({
          id: m.id,
          conversationId: m.conversation_id,
          senderId: m.sender_id,
          senderName: m.sender?.name || '',
          content: m.content,
          timestamp: m.created_at,
          read: !!m.read_at,
          type: m.type
        }));
        
        setMessages(formatted);
        
        // Verificar status de envio
        const status = await messageService.canSendMessage(currentConversation.id);
        setSendStatus(status);
        
        // REMOVIDO: Não marcar automaticamente como lidas aqui
        // As mensagens só devem ser marcadas como lidas quando o usuário
        // explicitamente clicar para abrir a conversa na interface (MessagesPage)
      } catch (error) {
        console.error('Erro ao carregar mensagens:', error);
      }
    };
    
    loadMessages();
  }, [currentConversation, user?.id]);

  // Abrir uma conversa
  const openConversation = (conversationId: string) => {
    const conversation = conversations.find(conv => conv.id === conversationId);
    if (conversation) {
      setCurrentConversation(conversation);
    }
  };

  // Enviar mensagem
  const sendMessage = async (content: string) => {
    if (!currentConversation || !user?.id) return;
    
    // Verificar se pode enviar
    if (sendStatus && !sendStatus.canSend) {
      toast.error(sendStatus.reason || 'Não é possível enviar mensagem');
      return;
    }
    
    try {
      const newMsg = await messageService.sendMessage(
        currentConversation.id,
        content,
        user.id
      );
      
      // Adicionar mensagem localmente (já aparece via realtime também)
      const formatted: ChatMessage = {
        id: newMsg.id,
        conversationId: newMsg.conversation_id,
        senderId: newMsg.sender_id,
        senderName: user.name,
        content: newMsg.content,
        timestamp: newMsg.created_at,
        read: false,
        type: newMsg.type
      };
      
      setMessages(prev => [...prev, formatted]);
      
      // Atualizar lista de conversas
      await loadConversations();
      
      // Disparar evento para atualizar contador
      window.dispatchEvent(new Event('forceUpdateUnreadCounts'));
    } catch (error: unknown) {
      console.error('Erro ao enviar mensagem:', error);
      toast.error(error.message || 'Erro ao enviar mensagem');
    }
  };

  // Iniciar conversa (buscar ou criar)
  const startConversation = async (
    animalId: string, 
    animalName: string, 
    animalOwnerId: string, 
    animalOwnerName: string,
    isDirectMessage: boolean = false
  ): Promise<string> => {
    if (!user?.id) return '';

    try {
      const conv = await messageService.getOrCreateConversation(
        animalId,
        animalOwnerId,
        user.id,
        isDirectMessage
      );
      
      await loadConversations();
      return conv.id;
    } catch (error) {
      console.error('Erro ao criar conversa:', error);
      toast.error('Erro ao iniciar conversa');
      return '';
    }
  };

  // Iniciar conversa temporária
  const startTemporaryConversation = async (
    animalId: string, 
    animalName: string, 
    animalOwnerId: string, 
    animalOwnerName: string
  ): Promise<string> => {
    return startConversation(animalId, animalName, animalOwnerId, animalOwnerName);
  };

  // Iniciar conversa de haras
  const startHarasConversation = async (
    harasId: string, 
    harasName: string, 
    harasOwnerId: string, 
    harasOwnerName: string
  ): Promise<string> => {
    return startConversation(harasId, harasName, harasOwnerId, harasOwnerName);
  };

  // Marcar como lido
  const markAsRead = async (conversationId: string) => {
    if (!user?.id) return;
    
    try {
      await messageService.markAsRead(conversationId, user.id);
      await loadConversations();
    } catch (error) {
      console.error('Erro ao marcar como lido:', error);
    }
  };

  // Fechar conversa
  const closeConversation = () => {
    setCurrentConversation(null);
    setMessages([]);
    setSendStatus(null);
  };
  
  // Ocultar mensagem (soft delete)
  const hideMessage = async (messageId: string) => {
    if (!user?.id) return;
    
    try {
      await messageService.hideMessage(messageId, user.id);
      
      // Remover mensagem localmente
      setMessages(prev => prev.filter(m => m.id !== messageId));
      
      toast.success('Mensagem removida');
    } catch (error) {
      console.error('Erro ao remover mensagem:', error);
      toast.error('Erro ao remover mensagem');
    }
  };
  
  // Refresh manual das conversas
  const refreshConversations = async () => {
    await loadConversations();
  };

  // ======================================================
  // REALTIME SUBSCRIPTIONS
  // ======================================================
  
  // Subscription para novas mensagens na conversa atual
  useEffect(() => {
    if (!currentConversation?.id || !user?.id) return;
    
    const subscription = supabase
      .channel(`conversation:${currentConversation.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${currentConversation.id}`
        },
        (payload) => {
          const newMsg = payload.new as Record<string, unknown>;
          
          // Só adiciona se não for nossa própria mensagem (já adicionamos localmente)
          if (newMsg.sender_id !== user.id) {
            const formatted: ChatMessage = {
              id: newMsg.id,
              conversationId: newMsg.conversation_id,
              senderId: newMsg.sender_id,
              senderName: '',
              content: newMsg.content,
              timestamp: newMsg.created_at,
              read: false,
              type: newMsg.type
            };
            
            setMessages(prev => [...prev, formatted]);
          }
        }
      )
      .subscribe((status, err) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.warn('[Chat] Subscription de mensagens falhou, tentando reconectar:', status, err);
          setTimeout(() => subscription.subscribe(), 2000);
        }
      });

    return () => {
      subscription.unsubscribe();
    };
  }, [currentConversation?.id, user?.id]);
  
  // Subscription global para atualizar lista de conversas
  useEffect(() => {
    if (!user?.id) return;
    
    const subscription = supabase
      .channel(`conversations_updates_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations'
        },
        (payload) => {
          const next = payload.new as { animal_owner_id?: string; interested_user_id?: string } | null;
          const previous = payload.old as { animal_owner_id?: string; interested_user_id?: string } | null;
          const isRelevant =
            next?.animal_owner_id === user.id ||
            next?.interested_user_id === user.id ||
            previous?.animal_owner_id === user.id ||
            previous?.interested_user_id === user.id;

          if (isRelevant) {
            loadConversations();
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          const newMessage = payload.new as { sender_id?: string; conversation_id?: string } | null;
          const isRelevantConversation = conversationsRef.current.some(
            conv => conv.id === newMessage?.conversation_id
          );

          if (isRelevantConversation || newMessage?.sender_id === user.id) {
            loadConversations();
          }
        }
      )
      .subscribe((status, err) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.warn('[Chat] Subscription de conversas falhou, tentando reconectar:', status, err);
          setTimeout(() => subscription.subscribe(), 2000);
        }
      });

    return () => {
      subscription.unsubscribe();
    };
  }, [user?.id, loadConversations]);

  return (
    <ChatContext.Provider value={{
      conversations,
      currentConversation,
      messages,
      unreadCount,
      sendStatus,
      loading,
      openConversation,
      sendMessage,
      startConversation,
      startTemporaryConversation,
      startHarasConversation,
      markAsRead,
      closeConversation,
      hideMessage,
      refreshConversations
    }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};