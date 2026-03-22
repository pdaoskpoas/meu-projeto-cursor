import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { diagnostics } from '@/lib/diagnostics';
import { runResilientRequest } from '@/services/resilientRequestService';

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
    diagnostics.debug('hook-unread-counts', 'Fetching unread counts', { userId: user.id });

    try {
      // ✅ OTIMIZAÇÃO: Executar notifications em paralelo com a cadeia conversations→messages
      // (notifications é independente e não precisa esperar as conversas)
      const [_resMessagesChain, _resNotifications] = await Promise.allSettled([
        // Branch A: conversations → messages (cascata necessária)
        (async () => {
          const { data: conversations, error: conversationsError } = await runResilientRequest(
            async () =>
              supabase
                .from('conversations')
                .select('id')
                .or(`animal_owner_id.eq.${user.id},interested_user_id.eq.${user.id}`),
            {
              timeoutMs: 12000,
              errorMessage: 'Falha ao carregar conversas nao lidas.',
              requestKey: `unread-counts:conversations:${user.id}`
            }
          );
          if (conversationsError) throw conversationsError;
          const conversationIds = conversations?.map(c => c.id) || [];
          if (conversationIds.length === 0) return 0;

          const { data: unreadMessages, error: unreadMessagesError } = await runResilientRequest(
            async () =>
              supabase
                .from('messages')
                .select('conversation_id')
                .in('conversation_id', conversationIds)
                .neq('sender_id', user.id)
                .is('read_at', null),
            {
              timeoutMs: 12000,
              errorMessage: 'Falha ao carregar mensagens nao lidas.',
              requestKey: `unread-counts:messages:${user.id}`
            }
          );
          if (unreadMessagesError) throw unreadMessagesError;
          return new Set((unreadMessages || []).map(msg => msg.conversation_id)).size;
        })(),

        // Branch B: notifications (independente)
        (async () => {
          const { count, error } = await runResilientRequest(
            async () =>
              supabase
                .from('notifications')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .eq('is_read', false)
                .neq('type', 'message_received'),
            {
              timeoutMs: 12000,
              errorMessage: 'Falha ao carregar notificacoes nao lidas.',
              requestKey: `unread-counts:notifications:${user.id}`
            }
          );
          if (error) throw error;
          return count || 0;
        })()
      ]);

      const unreadConversations = _resMessagesChain.status === 'fulfilled' ? _resMessagesChain.value : 0;
      const unreadNotifications = _resNotifications.status === 'fulfilled' ? _resNotifications.value : 0;
      if (_resMessagesChain.status === 'rejected') console.warn('[useUnreadCounts] messages chain failed:', _resMessagesChain.reason);
      if (_resNotifications.status === 'rejected') console.warn('[useUnreadCounts] notifications failed:', _resNotifications.reason);

      setCounts({
        messages: unreadConversations,
        notifications: unreadNotifications,
        partnerships: 0
      });
    } catch (error) {
      diagnostics.warn('hook-unread-counts', 'Fetch failed', error);
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
      .subscribe((status, err) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.warn('[UnreadCounts] Subscription falhou, tentando reconectar:', status, err);
          setTimeout(() => notificationsSubscription.subscribe(), 2000);
        }
      });

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
