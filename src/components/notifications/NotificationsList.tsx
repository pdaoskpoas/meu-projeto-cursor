import React, { useRef, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Bell } from 'lucide-react';
import { NotificationItem } from './NotificationItem';
import { Notification } from '@/hooks/useNotifications';

interface NotificationsListProps {
  notifications: Notification[];
  loading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  emptyMessage?: string;
}

/**
 * Lista de notificações com scroll infinito otimizado
 * 
 * Features:
 * - Intersection Observer para lazy loading
 * - Virtualização preparada
 * - Performance otimizada
 */
export const NotificationsList: React.FC<NotificationsListProps> = ({
  notifications,
  loading,
  hasMore,
  onLoadMore,
  onMarkAsRead,
  onDelete,
  emptyMessage = 'Nenhuma notificação por aqui'
}) => {
  const observerTarget = useRef<HTMLDivElement>(null);

  // Intersection Observer para scroll infinito
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [target] = entries;
      if (target.isIntersecting && hasMore && !loading && onLoadMore) {
        onLoadMore();
      }
    },
    [hasMore, loading, onLoadMore]
  );

  React.useEffect(() => {
    const element = observerTarget.current;
    if (!element) return;

    const observer = new IntersectionObserver(handleObserver, {
      threshold: 0.1,
      rootMargin: '100px' // Carregar antes de chegar ao fim
    });

    observer.observe(element);

    return () => observer.disconnect();
  }, [handleObserver]);

  if (loading && notifications.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-gray-600">Carregando notificações...</span>
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="text-center py-12">
        <Bell className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 text-lg font-medium mb-2">{emptyMessage}</p>
        <p className="text-gray-400 text-sm">
          Você receberá notificações sobre favoritos, mensagens e visualizações dos seus anúncios
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onMarkAsRead={onMarkAsRead}
          onDelete={onDelete}
        />
      ))}

      {/* Elemento observado para scroll infinito */}
      {hasMore && (
        <div ref={observerTarget} className="py-4">
          {loading ? (
            <div className="flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="ml-2 text-sm text-gray-600">Carregando mais...</span>
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full"
              onClick={onLoadMore}
            >
              Carregar mais notificações
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

