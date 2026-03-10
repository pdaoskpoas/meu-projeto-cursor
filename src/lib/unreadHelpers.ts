import { supabase } from './supabase';

/**
 * Marca todas as mensagens de uma conversa como lidas pelo usuário atual
 */
export const markConversationAsRead = async (conversationId: string, userId: string) => {
  try {
    const { error } = await supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .neq('sender_id', userId) // Apenas mensagens que o usuário não enviou
      .is('read_at', null); // Apenas as que ainda não foram lidas

    if (error) {
      console.error('Erro ao marcar mensagens como lidas:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erro ao marcar mensagens como lidas:', error);
    return false;
  }
};

/**
 * Marca uma mensagem específica como lida
 */
export const markMessageAsRead = async (messageId: string) => {
  try {
    const { error } = await supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('id', messageId)
      .is('read_at', null);

    if (error) {
      console.error('Erro ao marcar mensagem como lida:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erro ao marcar mensagem como lida:', error);
    return false;
  }
};

/**
 * Marca todas as mensagens recebidas pelo usuário como lidas
 * Útil quando o usuário acessa a página de mensagens
 */
export const markAllMessagesAsRead = async (userId: string) => {
  try {
    // Buscar todas as conversas do usuário
    const { data: conversations } = await supabase
      .from('conversations')
      .select('id')
      .or(`animal_owner_id.eq.${userId},interested_user_id.eq.${userId}`);

    if (!conversations || conversations.length === 0) {
      return true;
    }

    const conversationIds = conversations.map(c => c.id);

    // Marcar todas as mensagens como lidas
    const { error } = await supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .in('conversation_id', conversationIds)
      .neq('sender_id', userId)
      .is('read_at', null);

    if (error) {
      console.error('Erro ao marcar todas as mensagens como lidas:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erro ao marcar todas as mensagens como lidas:', error);
    return false;
  }
};

/**
 * Busca a contagem de mensagens não lidas de uma conversa específica
 */
export const getUnreadMessagesCount = async (conversationId: string, userId: string) => {
  try {
    const { count } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('conversation_id', conversationId)
      .neq('sender_id', userId)
      .is('read_at', null);

    return count || 0;
  } catch (error) {
    console.error('Erro ao buscar contagem de mensagens não lidas:', error);
    return 0;
  }
};



