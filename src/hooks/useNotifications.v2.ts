import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';

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

interface UseNotificationsOptions {
  limit?: number;
  enabled?: boolean;
}

/**
 * Hook otimizado para gerenciar notificações com React Query
 * 
 * Melhorias de Performance:
 * - Cache inteligente (staleTime: 30s, cacheTime: 5min)
 * - Atualização otimista no estado
 * - Invalidação seletiva de queries
 * - Subscriptions em tempo real
 * - Paginação preparada
 */
export const useNotificationsV2 = (options: UseNotificationsOptions = {}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { limit = 50, enabled = true } = options;

  // Query para buscar notificações com cache inteligente
  const {
    data: notifications = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['notifications', user?.id, limit],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as Notification[];
    },
    enabled: enabled && !!user?.id,
    staleTime: 30 * 1000, // Considera dados frescos por 30 segundos
    gcTime: 5 * 60 * 1000, // Mantém em cache por 5 minutos (era cacheTime)
    refetchOnWindowFocus: false, // Não refetch ao focar janela (subscriptions fazem isso)
    refetchOnReconnect: true // Refetch ao reconectar internet
  });

  // Query para contagem de não lidas (separada para otimizar)
  const {
    data: unreadCount = 0
  } = useQuery({
    queryKey: ['notifications-unread-count', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;

      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) throw error;
      return count || 0;
    },
    enabled: enabled && !!user?.id,
    staleTime: 10 * 1000, // Atualiza a cada 10 segundos
    gcTime: 2 * 60 * 1000 // Cache de 2 minutos
  });

  // Mutation para marcar como lida (com atualização otimista)
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { error } = await supabase
        .from('notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('id', notificationId)
        .eq('user_id', user.id);

      if (error) throw error;
      return notificationId;
    },
    // Atualização otimista - UI atualiza antes da confirmação do servidor
    onMutate: async (notificationId) => {
      // Cancelar queries em andamento
      await queryClient.cancelQueries({ queryKey: ['notifications', user?.id] });

      // Snapshot do estado anterior (para rollback)
      const previousNotifications = queryClient.getQueryData<Notification[]>(['notifications', user?.id, limit]);

      // Atualizar otimisticamente
      queryClient.setQueryData<Notification[]>(
        ['notifications', user?.id, limit],
        (old = []) => old.map(n =>
          n.id === notificationId
            ? { ...n, is_read: true, read_at: new Date().toISOString() }
            : n
        )
      );

      // Atualizar contador
      queryClient.setQueryData<number>(
        ['notifications-unread-count', user?.id],
        (old = 0) => Math.max(0, old - 1)
      );

      return { previousNotifications };
    },
    // Se erro, reverter
    onError: (_err, _notificationId, context) => {
      if (context?.previousNotifications) {
        queryClient.setQueryData(
          ['notifications', user?.id, limit],
          context.previousNotifications
        );
      }
    },
    // Sempre revalidar após completar
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count', user?.id] });
    }
  });

  // Mutation para marcar todas como lidas
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { error } = await supabase
        .from('notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) throw error;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['notifications', user?.id] });

      const previousNotifications = queryClient.getQueryData<Notification[]>(['notifications', user?.id, limit]);

      queryClient.setQueryData<Notification[]>(
        ['notifications', user?.id, limit],
        (old = []) => old.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
      );

      queryClient.setQueryData<number>(
        ['notifications-unread-count', user?.id],
        0
      );

      return { previousNotifications };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousNotifications) {
        queryClient.setQueryData(
          ['notifications', user?.id, limit],
          context.previousNotifications
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count', user?.id] });
    }
  });

  // Mutation para deletar notificação
  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', user.id);

      if (error) throw error;
      return notificationId;
    },
    onMutate: async (notificationId) => {
      await queryClient.cancelQueries({ queryKey: ['notifications', user?.id] });

      const previousNotifications = queryClient.getQueryData<Notification[]>(['notifications', user?.id, limit]);

      // Verificar se a notificação deletada era não lida
      const deletedNotification = previousNotifications?.find(n => n.id === notificationId);
      const wasUnread = deletedNotification && !deletedNotification.is_read;

      queryClient.setQueryData<Notification[]>(
        ['notifications', user?.id, limit],
        (old = []) => old.filter(n => n.id !== notificationId)
      );

      if (wasUnread) {
        queryClient.setQueryData<number>(
          ['notifications-unread-count', user?.id],
          (old = 0) => Math.max(0, old - 1)
        );
      }

      return { previousNotifications };
    },
    onError: (_err, _notificationId, context) => {
      if (context?.previousNotifications) {
        queryClient.setQueryData(
          ['notifications', user?.id, limit],
          context.previousNotifications
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count', user?.id] });
    }
  });

  // Subscription em tempo real com debounce
  useEffect(() => {
    if (!user?.id || !enabled) return;

    let debounceTimer: NodeJS.Timeout;

    const channel = supabase
      .channel('notifications_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          // Debounce de 500ms para evitar múltiplas atualizações rápidas
          clearTimeout(debounceTimer);
          debounceTimer = setTimeout(() => {
            queryClient.invalidateQueries({ queryKey: ['notifications', user.id] });
            queryClient.invalidateQueries({ queryKey: ['notifications-unread-count', user.id] });
          }, 500);
        }
      )
      .subscribe((status, err) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.warn('[NotificationsV2] Subscription falhou, tentando reconectar:', status, err);
          setTimeout(() => channel.subscribe(), 2000);
        }
      });

    return () => {
      clearTimeout(debounceTimer);
      supabase.removeChannel(channel);
    };
  }, [user?.id, enabled, queryClient]);

  // Derivar dados
  const unreadNotifications = notifications.filter(n => !n.is_read);

  return {
    notifications,
    unreadNotifications,
    unreadCount,
    loading: isLoading,
    error: error?.message || null,
    markAsRead: (id: string) => markAsReadMutation.mutate(id),
    markAllAsRead: () => markAllAsReadMutation.mutate(),
    deleteNotification: (id: string) => deleteNotificationMutation.mutate(id),
    refreshNotifications: refetch,
    // Estados das mutations para feedback na UI
    isMarkingAsRead: markAsReadMutation.isPending,
    isMarkingAllAsRead: markAllAsReadMutation.isPending,
    isDeleting: deleteNotificationMutation.isPending
  };
};

/**
 * Hook para buscar notificações com paginação infinita
 */
export const useInfiniteNotifications = () => {
  const { user } = useAuth();
  const pageSize = 20;

  return useQuery({
    queryKey: ['notifications-infinite', user?.id],
    queryFn: async ({ pageParam = 0 }) => {
      if (!user?.id) return { data: [], nextPage: null };

      const from = pageParam * pageSize;
      const to = from + pageSize - 1;

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      return {
        data: data as Notification[],
        nextPage: data.length === pageSize ? pageParam + 1 : null
      };
    },
    enabled: !!user?.id,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000
  });
};

