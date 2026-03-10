import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface UnreadCounts {
  messages: number;
  notifications: number;
  partnerships: number;
}

export const useUnreadCounts = () => {
  const { user } = useAuth();
  const [counts, setCounts] = useState<UnreadCounts>({
    messages: 0,
    notifications: 0,
    partnerships: 0
  });
  const [loading, setLoading] = useState(true);

  const fetchUnreadCounts = useCallback(async () => {
    if (!user?.id) {
      setCounts({ messages: 0, notifications: 0, partnerships: 0 });
      setLoading(false);
      return;
    }

    try {
      // 1. Buscar conversas com mensagens não lidas
      // O contador deve mostrar o NÚMERO DE CONVERSAS com mensagens não lidas, não o total de mensagens
      const { data: conversations } = await supabase
        .from('conversations')
        .select('id')
        .or(`animal_owner_id.eq.${user.id},interested_user_id.eq.${user.id}`);

      const conversationIds = conversations?.map(c => c.id) || [];

      let unreadConversations = 0;
      if (conversationIds.length > 0) {
        // Contar quantas conversas têm mensagens não lidas
        const conversationsWithUnread = await Promise.all(
          conversationIds.map(async (convId) => {
            const { count } = await supabase
              .from('messages')
              .select('*', { count: 'exact', head: true })
              .eq('conversation_id', convId)
              .neq('sender_id', user.id) // Mensagens que ele não enviou
              .is('read_at', null); // Que ainda não foram lidas
            
            return count && count > 0 ? 1 : 0;
          })
        );
        
        unreadConversations = conversationsWithUnread.reduce((sum, has) => sum + has, 0);
      }

      // 2. Buscar convites de sociedade pendentes
      // NOTA: Migration 065 removeu o campo 'status'. Todas as parcerias são aceitas automaticamente.
      // Para manter compatibilidade, retornamos 0 convites pendentes.
      const pendingPartnerships = 0;

      // 3. Buscar notificações não lidas (exceto notificações de mensagens)
      const { count: unreadNotifications } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false)
        .neq('type', 'message_received'); // Excluir notificações de mensagens (já tem contador próprio)

      setCounts({
        messages: unreadConversations,
        notifications: unreadNotifications || 0,
        partnerships: pendingPartnerships || 0
      });
    } catch (error) {
      console.error('Erro ao buscar contagens:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchUnreadCounts();

    // Atualizar a cada 10 segundos (reduzido de 30 para melhor UX)
    const interval = setInterval(fetchUnreadCounts, 10000);

    // Listener para evento customizado de atualização forçada
    const handleForceUpdate = () => {
      fetchUnreadCounts();
    };
    window.addEventListener('forceUpdateUnreadCounts', handleForceUpdate);

    // Subscription para mensagens em tempo real
    const messagesSubscription = supabase
      .channel('messages_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages'
        },
        () => {
          fetchUnreadCounts();
        }
      )
      .subscribe();

    // Subscription para parcerias em tempo real
    const partnershipsSubscription = supabase
      .channel('partnerships_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'animal_partnerships'
        },
        () => {
          fetchUnreadCounts();
        }
      )
      .subscribe();

    // Subscription para notificações em tempo real
    const notificationsSubscription = supabase
      .channel('notifications_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications'
        },
        () => {
          fetchUnreadCounts();
        }
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      window.removeEventListener('forceUpdateUnreadCounts', handleForceUpdate);
      messagesSubscription.unsubscribe();
      partnershipsSubscription.unsubscribe();
      notificationsSubscription.unsubscribe();
    };
  }, [fetchUnreadCounts]);

  return { counts, loading, refetch: fetchUnreadCounts };
};



