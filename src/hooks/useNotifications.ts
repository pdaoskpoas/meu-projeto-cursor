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

  // Subscrever a mudanças em tempo real
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('notifications_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Notificação atualizada:', payload);
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, fetchNotifications]);

  const markAsRead = async (notificationId: string) => {
    if (!user?.id) return;

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

      // Atualizar localmente
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId
            ? { ...n, is_read: true, read_at: new Date().toISOString() }
            : n
        )
      );
    } catch (err: unknown) {
      console.error('Erro ao marcar notificação como lida:', err);
    }
  };

  const markAllAsRead = async () => {
    if (!user?.id) return;

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

      // Atualizar localmente
      setNotifications(prev =>
        prev.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
      );
    } catch (err: unknown) {
      console.error('Erro ao marcar todas como lidas:', err);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    if (!user?.id) return;

    try {
      const { error: deleteError } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;

      // Remover localmente
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (err: unknown) {
      console.error('Erro ao deletar notificação:', err);
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
    refreshNotifications: fetchNotifications
  };
};
