import { useCallback, useEffect, useRef, useState } from 'react';
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
  const fetchInFlightRef = useRef(false);
  const visibilityDebounceRef = useRef<number | null>(null);

  const fetchUnreadCounts = useCallback(async () => {
    if (!user?.id) {
      setCounts({ messages: 0, notifications: 0, partnerships: 0 });
      setLoading(false);
      return;
    }

    if (fetchInFlightRef.current) return;
    fetchInFlightRef.current = true;

    try {
      // 1) Buscar conversas do usuário
      const { data: conversations, error: conversationsError } = await supabase
        .from('conversations')
        .select('id')
        .or(`animal_owner_id.eq.${user.id},interested_user_id.eq.${user.id}`);

      if (conversationsError) throw conversationsError;

      const conversationIds = conversations?.map(c => c.id) || [];

      let unreadConversations = 0;
      if (conversationIds.length > 0) {
        // 2) Buscar mensagens não lidas em lote e contar conversas únicas
        const { data: unreadMessages, error: unreadMessagesError } = await supabase
          .from('messages')
          .select('conversation_id')
          .in('conversation_id', conversationIds)
          .neq('sender_id', user.id)
          .is('read_at', null);

        if (unreadMessagesError) throw unreadMessagesError;
        unreadConversations = new Set((unreadMessages || []).map(msg => msg.conversation_id)).size;
      }

      // 3) Convites de sociedade pendentes atualmente não existem nesse fluxo
      const pendingPartnerships = 0;

      // 4) Notificações não lidas (sem mensagens, contador próprio)
      const { count: unreadNotifications, error: unreadNotificationsError } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false)
        .neq('type', 'message_received');

      if (unreadNotificationsError) throw unreadNotificationsError;

      setCounts({
        messages: unreadConversations,
        notifications: unreadNotifications || 0,
        partnerships: pendingPartnerships || 0
      });
    } catch (error) {
      console.error('Erro ao buscar contagens:', error);
    } finally {
      fetchInFlightRef.current = false;
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;

    fetchUnreadCounts();

    // Atualizar com frequência moderada para evitar saturação
    const interval = setInterval(fetchUnreadCounts, 30000);

    // Listener para atualização forçada
    const handleForceUpdate = () => {
      fetchUnreadCounts();
    };
    window.addEventListener('forceUpdateUnreadCounts', handleForceUpdate);

    const scheduleFetch = () => {
      if (visibilityDebounceRef.current) {
        window.clearTimeout(visibilityDebounceRef.current);
      }

      visibilityDebounceRef.current = window.setTimeout(() => {
        visibilityDebounceRef.current = null;
        fetchUnreadCounts();
      }, 300);
    };

    // Atualizar ao voltar para a aba
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        scheduleFetch();
      }
    };
    window.addEventListener('focus', scheduleFetch);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Subscription com filtro por usuário (evita avalanche global)
    const notificationsSubscription = supabase
      .channel(`notifications_changes_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchUnreadCounts();
        }
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      if (visibilityDebounceRef.current) {
        window.clearTimeout(visibilityDebounceRef.current);
        visibilityDebounceRef.current = null;
      }
      window.removeEventListener('forceUpdateUnreadCounts', handleForceUpdate);
      window.removeEventListener('focus', scheduleFetch);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      notificationsSubscription.unsubscribe();
    };
  }, [fetchUnreadCounts, user?.id]);

  return { counts, loading, refetch: fetchUnreadCounts };
};



