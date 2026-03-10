import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ProtectedRoute from '@/components/ProtectedRoute';
import ModernDashboardWrapper from '@/components/layout/ModernDashboardWrapper';
import { Bell, BellRing, CheckCheck, Loader2, Trash2 } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationItem } from '@/components/notifications/NotificationItem';

const NotificationsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('all');
  const {
    notifications,
    unreadNotifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification
  } = useNotifications();

  const renderNotificationsList = (notificationsList: typeof notifications) => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-gray-600">Carregando notificações...</span>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-12">
          <p className="text-red-500">Erro ao carregar notificações: {error}</p>
        </div>
      );
    }

    if (notificationsList.length === 0) {
      return (
        <div className="text-center py-12">
          <Bell className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg font-medium mb-2">
            Nenhuma notificação por aqui
          </p>
          <p className="text-gray-400 text-sm">
            Você receberá notificações sobre favoritos, mensagens e visualizações dos seus anúncios
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {notificationsList.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onMarkAsRead={markAsRead}
            onDelete={deleteNotification}
          />
        ))}
      </div>
    );
  };

  return (
    <ProtectedRoute>
      <ModernDashboardWrapper
        title="Notificações"
        subtitle="Acompanhe interações nos seus anúncios"
      >
        <div className="space-y-6">
          {/* Cabeçalho com ações */}
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <BellRing className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium">
                    {unreadCount > 0 ? (
                      <>
                        <span className="text-primary font-bold">{unreadCount}</span> não{' '}
                        {unreadCount === 1 ? 'lida' : 'lidas'}
                      </>
                    ) : (
                      'Todas lidas'
                    )}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                {unreadCount > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={markAllAsRead}
                    className="flex items-center gap-2"
                  >
                    <CheckCheck className="h-4 w-4" />
                    Marcar todas como lidas
                  </Button>
                )}
              </div>
            </div>
          </Card>

          {/* Tabs de filtros */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all" className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Todas
                {notifications.length > 0 && (
                  <span className="ml-1 text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full">
                    {notifications.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="unread" className="flex items-center gap-2">
                <BellRing className="h-4 w-4" />
                Não Lidas
                {unreadCount > 0 && (
                  <span className="ml-1 text-xs bg-primary text-white px-2 py-0.5 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-6 mt-6">
              {renderNotificationsList(notifications)}
            </TabsContent>

            <TabsContent value="unread" className="space-y-6 mt-6">
              {renderNotificationsList(unreadNotifications)}
            </TabsContent>
          </Tabs>

          {/* Informações sobre notificações */}
          <Card className="p-4 bg-blue-50 border-blue-200">
            <div className="flex items-start gap-3">
              <Bell className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-blue-900 mb-1">Sobre as Notificações</p>
                <ul className="text-blue-700 space-y-1 text-xs">
                  <li>• Você é notificado quando alguém favorita seus anúncios</li>
                  <li>• A cada 10 visualizações você é notificado sobre o desempenho</li>
                  <li>• Recebe alertas sobre convites de sociedade</li>
                  <li>• Notificações antigas são removidas automaticamente após 30 dias</li>
                </ul>
              </div>
            </div>
          </Card>
        </div>
      </ModernDashboardWrapper>
    </ProtectedRoute>
  );
};

export default NotificationsPage;

