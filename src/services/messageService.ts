import { supabase } from '@/lib/supabase';
import { handleSupabaseError } from '@/lib/supabase-helpers';

// =====================================================
// TIPOS E INTERFACES
// =====================================================

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  type: 'text';
  read_at: string | null;
  created_at: string;
  hidden_for_sender: boolean;
  hidden_for_receiver: boolean;
  deleted_at: string | null;
  sender?: {
    id: string;
    name: string;
  };
}

export interface Conversation {
  id: string;
  animal_id: string;
  animal_owner_id: string;
  interested_user_id: string;
  is_temporary: boolean;
  is_active: boolean;
  conversation_type?: string;
  created_at: string;
  updated_at: string;
  animal?: {
    id: string;
    name: string;
    ad_status: 'draft' | 'active' | 'paused' | 'expired' | 'deleted';
  };
  owner?: {
    id: string;
    name: string;
  };
  interested?: {
    id: string;
    name: string;
  };
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
}

export interface MessageSendStatus {
  canSend: boolean;
  reason?: string;
  statusType?: 'paused' | 'expired' | 'suspended';
}

// =====================================================
// CLASSE DE SERVIÇO DE MENSAGENS
// =====================================================

class MessageService {
  
  // =================================================
  // CONVERSAS
  // =================================================
  
  /**
   * Buscar todas as conversas do usuário
   * Exclui conversas deletadas pelo usuário (soft delete)
   */
  async getConversations(userId: string): Promise<Conversation[]> {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          animal:animals(id, name, ad_status, images),
          owner:profiles!animal_owner_id(id, name),
          interested:profiles!interested_user_id(id, name)
        `)
        .or(`animal_owner_id.eq.${userId},interested_user_id.eq.${userId}`)
        .order('updated_at', { ascending: false });
      
      if (error) throw handleSupabaseError(error);
      
      // Filtrar conversas deletadas pelo usuário
      const filtered = (data || []).filter((conv) => {
        const deletedFor = (conv.deleted_for_users as string[]) || [];
        return !deletedFor.includes(userId);
      });
      
      // Buscar última mensagem e contagem de não lidas para cada conversa
      const conversationsWithMetadata = await Promise.all(
        filtered.map(async (conv) => {
          // Última mensagem
          const { data: lastMsg } = await supabase
            .from('messages')
            .select('content, created_at')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
          
          // Contagem de mensagens não lidas
          const { count } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .neq('sender_id', userId)
            .is('read_at', null);
          
          return {
            ...conv,
            lastMessage: lastMsg?.content,
            lastMessageTime: lastMsg?.created_at,
            unreadCount: count || 0
          };
        })
      );
      
      return conversationsWithMetadata;
    } catch (error) {
      console.error('Erro ao buscar conversas:', error);
      throw error;
    }
  }
  
  /**
   * Buscar ou criar uma conversa
   */
  async getOrCreateConversation(
    animalId: string,
    animalOwnerId: string,
    interestedUserId: string,
    isDirectMessage: boolean = false
  ): Promise<Conversation> {
    try {
      // Verificar se conversa já existe
      const { data: existing, error: searchError } = await supabase
        .from('conversations')
        .select(`
          *,
          animal:animals(id, name, ad_status, images),
          owner:profiles!animal_owner_id(id, name),
          interested:profiles!interested_user_id(id, name)
        `)
        .eq('animal_id', animalId)
        .eq('animal_owner_id', animalOwnerId)
        .eq('interested_user_id', interestedUserId)
        .single();
      
      if (existing) {
        return existing;
      }
      
      // Criar nova conversa
      const { data: newConv, error: createError } = await supabase
        .from('conversations')
        .insert({
          animal_id: animalId,
          animal_owner_id: animalOwnerId,
          interested_user_id: interestedUserId,
          is_temporary: true,
          is_active: true,
          conversation_type: isDirectMessage ? 'direct_message' : 'animal_inquiry'
        })
        .select(`
          *,
          animal:animals(id, name, ad_status, images),
          owner:profiles!animal_owner_id(id, name),
          interested:profiles!interested_user_id(id, name)
        `)
        .single();
      
      if (createError) throw handleSupabaseError(createError);
      
      return newConv;
    } catch (error) {
      console.error('Erro ao buscar/criar conversa:', error);
      throw error;
    }
  }
  
  // =================================================
  // MENSAGENS
  // =================================================
  
  /**
   * Buscar mensagens de uma conversa
   * Aplica filtro de soft delete
   */
  async getMessages(conversationId: string, userId: string): Promise<Message[]> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!sender_id(id, name)
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });
      
      if (error) throw handleSupabaseError(error);
      
      // Filtrar mensagens ocultas para este usuário
      const visibleMessages = (data || []).filter((msg) => {
        // Se é o remetente, verificar hidden_for_sender
        if (msg.sender_id === userId) {
          return !msg.hidden_for_sender;
        }
        // Se é o destinatário, verificar hidden_for_receiver
        return !msg.hidden_for_receiver;
      });
      
      return visibleMessages;
    } catch (error) {
      console.error('Erro ao buscar mensagens:', error);
      throw error;
    }
  }
  
  /**
   * Verificar se usuário pode enviar mensagem
   * Verifica: anúncio pausado, plano expirado, suspensão
   */
  async canSendMessage(conversationId: string): Promise<MessageSendStatus> {
    try {
      // Buscar conversa com informações do animal e proprietário
      const { data: conversation, error } = await supabase
        .from('conversations')
        .select(`
          *,
          animal:animals(ad_status)
        `)
        .eq('id', conversationId)
        .single();
      
      if (error || !conversation) {
        return { 
          canSend: false, 
          reason: 'Conversa não encontrada'
        };
      }
      
      // Verificar se conversa foi suspensa pelo admin
      if (!conversation.is_active) {
        return {
          canSend: false,
          reason: 'Esta conversa foi suspensa por violação das regras da plataforma',
          statusType: 'suspended'
        };
      }
      
      interface ConversationAnimal {
        ad_status?: string;
        expires_at?: string;
        [key: string]: unknown;
      }
      const animal = conversation.animal as ConversationAnimal;
      
      // Verificar anúncio pausado
      if (animal?.ad_status === 'paused') {
        return { 
          canSend: false, 
          reason: 'Anúncio pausado. Aguarde o proprietário reativar o anúncio.',
          statusType: 'paused'
        };
      }
      
      // Verificar anúncio expirado
      if (animal?.ad_status === 'expired') {
        return { 
          canSend: false, 
          reason: 'Anúncio expirado. O proprietário precisa reativar o anúncio.',
          statusType: 'expired'
        };
      }
      
      // Verificar anúncio deletado
      if (animal?.ad_status === 'deleted') {
        return { 
          canSend: false, 
          reason: 'Este anúncio foi removido.',
          statusType: 'expired'
        };
      }
      
      // Verificar anúncio em rascunho
      if (animal?.ad_status === 'draft') {
        return { 
          canSend: false, 
          reason: 'Este anúncio ainda não foi publicado.',
          statusType: 'paused'
        };
      }
      
      return { canSend: true };
    } catch (error) {
      console.error('Erro ao verificar permissão de envio:', error);
      return { 
        canSend: false, 
        reason: 'Erro ao verificar status da conversa'
      };
    }
  }
  
  /**
   * Enviar uma nova mensagem
   */
  async sendMessage(
    conversationId: string,
    content: string,
    senderId: string
  ): Promise<Message> {
    try {
      // Verificar se pode enviar
      const sendStatus = await this.canSendMessage(conversationId);
      if (!sendStatus.canSend) {
        throw new Error(sendStatus.reason || 'Não é possível enviar mensagem');
      }
      
      // Validar tamanho
      if (content.length > 1000) {
        throw new Error('Mensagem muito longa (máximo 1000 caracteres)');
      }
      
      if (content.trim().length === 0) {
        throw new Error('Mensagem não pode estar vazia');
      }
      
      // Inserir mensagem
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: senderId,
          content: content.trim(),
          type: 'text'
        })
        .select(`
          *,
          sender:profiles!sender_id(id, name)
        `)
        .single();
      
      if (error) throw handleSupabaseError(error);
      
      // Atualizar timestamp da conversa e marcar como permanente
      const { error: updateError } = await supabase
        .from('conversations')
        .update({ 
          updated_at: new Date().toISOString(),
          is_temporary: false // Primeira mensagem torna conversa permanente
        })
        .eq('id', conversationId);
      
      if (updateError) {
        console.error('Erro ao atualizar conversa:', updateError);
        // Não bloquear o envio da mensagem, apenas logar o erro
      }
      
      return data;
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      throw error;
    }
  }
  
  /**
   * Ocultar mensagem para o usuário (soft delete)
   */
  async hideMessage(messageId: string, userId: string): Promise<void> {
    try {
      // Usar função do banco para soft delete
      const { error } = await supabase
        .rpc('hide_message_for_user', {
          p_message_id: messageId,
          p_user_id: userId
        });
      
      if (error) throw handleSupabaseError(error);
    } catch (error) {
      console.error('Erro ao ocultar mensagem:', error);
      throw error;
    }
  }
  
  /**
   * Marcar mensagens como lidas
   */
  async markAsRead(conversationId: string, userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .neq('sender_id', userId)
        .is('read_at', null);
      
      if (error) throw handleSupabaseError(error);
    } catch (error) {
      console.error('Erro ao marcar mensagens como lidas:', error);
      throw error;
    }
  }
  
  /**
   * Contar mensagens não lidas
   */
  async getUnreadCount(userId: string): Promise<number> {
    try {
      // Buscar todas as conversas do usuário
      const { data: conversations } = await supabase
        .from('conversations')
        .select('id')
        .or(`animal_owner_id.eq.${userId},interested_user_id.eq.${userId}`);
      
      if (!conversations || conversations.length === 0) {
        return 0;
      }
      
      const conversationIds = conversations.map(c => c.id);
      
      // Contar mensagens não lidas
      const { count, error } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .in('conversation_id', conversationIds)
        .neq('sender_id', userId)
        .is('read_at', null);
      
      if (error) throw handleSupabaseError(error);
      
      return count || 0;
    } catch (error) {
      console.error('Erro ao contar mensagens não lidas:', error);
      return 0;
    }
  }
  
  // =================================================
  // ADMIN FUNCTIONS
  // =================================================
  
  /**
   * Admin: Buscar conversas com filtros
   */
  async adminSearchConversations(filters: {
    searchTerm?: string;
    userId?: string;
    animalId?: string;
    isActive?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<Record<string, unknown>[]> {
    try {
      const { data, error } = await supabase
        .rpc('admin_search_conversations', {
          p_search_term: filters.searchTerm || null,
          p_user_id: filters.userId || null,
          p_animal_id: filters.animalId || null,
          p_is_active: filters.isActive !== undefined ? filters.isActive : null,
          p_limit: filters.limit || 50,
          p_offset: filters.offset || 0
        });
      
      if (error) throw handleSupabaseError(error);
      
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar conversas (admin):', error);
      throw error;
    }
  }
  
  /**
   * Admin: Visualizar mensagens completas (incluindo ocultas)
   */
  async adminGetConversationMessages(conversationId: string): Promise<Record<string, unknown>[]> {
    try {
      const { data, error } = await supabase
        .rpc('admin_get_conversation_messages', {
          p_conversation_id: conversationId
        });
      
      if (error) throw handleSupabaseError(error);
      
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar mensagens (admin):', error);
      throw error;
    }
  }
  
  /**
   * Admin: Suspender conversa
   */
  async adminSuspendConversation(conversationId: string, reason: string): Promise<void> {
    try {
      const { error } = await supabase
        .rpc('admin_suspend_conversation', {
          p_conversation_id: conversationId,
          p_reason: reason
        });
      
      if (error) throw handleSupabaseError(error);
    } catch (error) {
      console.error('Erro ao suspender conversa (admin):', error);
      throw error;
    }
  }
  
  /**
   * Admin: Obter estatísticas do chat
   */
  async adminGetChatStats(): Promise<Record<string, unknown>> {
    try {
      const { data, error } = await supabase
        .from('admin_chat_stats')
        .select('*')
        .single();
      
      if (error) throw handleSupabaseError(error);
      
      return data;
    } catch (error) {
      console.error('Erro ao buscar estatísticas (admin):', error);
      throw error;
    }
  }
}

// Exportar instância única (singleton)
export const messageService = new MessageService();

