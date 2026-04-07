import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { diagnostics } from '@/lib/diagnostics';
import { runResilientRequest } from '@/services/resilientRequestService';

export interface Notification {
  id: string;
  user_id: string;
  type: 'favorite_added' | 'message_received' | 'animal_view' | 'animal_click' | 'boost_expiring' | 'ad_expiring' | 'partnership_invite' | 'partnership_accepted';
  title: string;
  message: string;
  action_url: string | null;
  metadata: Record<string, unknown>;
  related_content_type: 'animal' | 'event' | 'message' | 'conversation' | 'partnership' | null;
  related_content_id: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  expires_at: string | null;
}

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadNotifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  deleteAllNotifications: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

export const useNotifications = (): UseNotificationsReturn => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isFetchingRef = useRef(false);
  const requestIdRef = useRef(0);

  const fetchNotifications = useCallback(async () => {
    if (!user?.id) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    const requestId = ++requestIdRef.current;
    diagnostics.debug('hook-notifications', 'Fetch started', { userId: user.id, requestId });

    try {
      setLoading(true);
      setError(null);

      // 🔔 Sistema de limite automático: máximo de 20 notificações por usuário
      // O banco de dados deleta automaticamente as mais antigas quando uma nova é criada
      const { data, error: fetchError } = await runResilientRequest(
        async () =>
          supabase
            .from('notifications')
            .select('*')
            .eq('user_id', user.id)
            .neq('type', 'message_received') // Excluir notificações de mensagens (já tem contador próprio)
            .order('created_at', { ascending: false })
            .limit(20), // Limite máximo de notificações por usuário
        {
          timeoutMs: 12000,
          errorMessage: 'Falha ao carregar notificacoes.',
          requestKey: `notifications:list:${user.id}`
        }
      );

      if (fetchError) throw fetchError;

      if (requestId !== requestIdRef.current) return;
      setNotifications(data || []);
      diagnostics.debug('hook-notifications', 'Fetch succeeded', {
        userId: user.id,
        requestId,
        count: data?.length ?? 0
      });
    } catch (err: unknown) {
      if (requestId !== requestIdRef.current) return;
      diagnostics.warn('hook-notifications', 'Fetch failed', err);
      setError(err instanceof Error ? err.message : 'Erro ao buscar notificações');
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
      isFetchingRef.current = false;
    }
  }, [user?.id]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Sincronização otimista entre instâncias do hook (dropdown + página)
  useEffect(() => {
    const handleRead = (e: CustomEvent<{ id: string }>) => {
      setNotifications(prev =>
        prev.map(n =>
          n.id === e.detail.id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n
        )
      );
    };

    const handleAllRead = () => {
      setNotifications(prev =>
        prev.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
      );
    };

    const handleDeleted = (e: CustomEvent<{ id: string }>) => {
      setNotifications(prev => prev.filter(n => n.id !== e.detail.id));
    };

    window.addEventListener('notification_marked_read', handleRead as EventListener);
    window.addEventListener('notifications_all_marked_read', handleAllRead);
    window.addEventListener('notification_deleted', handleDeleted as EventListener);

    return () => {
      window.removeEventListener('notification_marked_read', handleRead as EventListener);
      window.removeEventListener('notifications_all_marked_read', handleAllRead);
      window.removeEventListener('notification_deleted', handleDeleted as EventListener);
    };
  }, []);

  // Subscrever a mudanças em tempo real (novas notificações vindas do servidor)
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('notifications_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe((status, err) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.warn('[Notifications] Subscription falhou, tentando reconectar:', status, err);
          setTimeout(() => channel.subscribe(), 2000);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, fetchNotifications]);

  const markAsRead = async (notificationId: string) => {
    if (!user?.id) return;

    // Atualizar localmente de imediato (otimista)
    setNotifications(prev =>
      prev.map(n =>
        n.id === notificationId
          ? { ...n, is_read: true, read_at: new Date().toISOString() }
          : n
      )
    );
    // Sincronizar outras instâncias do hook imediatamente
    window.dispatchEvent(new CustomEvent('notification_marked_read', { detail: { id: notificationId } }));

    try {
      const { error: updateError } = await supabase
        .from('notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('id', notificationId)
        .eq('user_id', user.id);

      if (updateError) throw updateError;
    } catch (err: unknown) {
      console.error('Erro ao marcar notificação como lida:', err);
      // Reverter em caso de erro
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, is_read: false, read_at: null } : n
        )
      );
    }
  };

  const markAllAsRead = async () => {
    if (!user?.id) return;

    // Atualizar localmente de imediato (otimista)
    setNotifications(prev =>
      prev.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
    );
    // Sincronizar outras instâncias do hook imediatamente
    window.dispatchEvent(new Event('notifications_all_marked_read'));

    try {
      const { error: updateError } = await supabase
        .from('notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (updateError) throw updateError;
    } catch (err: unknown) {
      console.error('Erro ao marcar todas como lidas:', err);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    if (!user?.id) return;

    // Remover localmente de imediato (otimista)
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    // Sincronizar outras instâncias do hook imediatamente
    window.dispatchEvent(new CustomEvent('notification_deleted', { detail: { id: notificationId } }));

    try {
      const { error: deleteError } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;
    } catch (err: unknown) {
      console.error('Erro ao deletar notificação:', err);
    }
  };

  const deleteAllNotifications = async () => {
    if (!user?.id) return;

    // Limpar localmente de imediato (otimista)
    setNotifications([]);
    window.dispatchEvent(new Event('notifications_all_deleted'));

    try {
      const { error: deleteError } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user.id)
        .neq('type', 'message_received');

      if (deleteError) throw deleteError;
    } catch (err: unknown) {
      console.error('Erro ao apagar todas as notificações:', err);
      // Reverter em caso de erro
      fetchNotifications();
    }
  };

  const unreadNotifications = notifications.filter(n => !n.is_read);
  const unreadCount = unreadNotifications.length;

  return {
    notifications,
    unreadNotifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
    refreshNotifications: fetchNotifications
  };
};
