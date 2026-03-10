import React from 'react';
import { Link } from 'react-router-dom';
import { Bell, Heart, Eye, MessageCircle, Zap, Clock, UserPlus, CheckCircle2, MousePointerClick } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from '@/components/ui/badge';
import { useNotifications } from '@/hooks/useNotifications';
import { Notification } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const getNotificationIcon = (type: Notification['type']) => {
  const iconClass = "h-4 w-4";
  
  switch (type) {
    case 'favorite_added':
      return <Heart className={`${iconClass} text-red-500`} />;
    case 'message_received':
      return <MessageCircle className={`${iconClass} text-blue-500`} />;
    case 'animal_view':
      return <Eye className={`${iconClass} text-green-500`} />;
    case 'animal_click':
      return <MousePointerClick className={`${iconClass} text-purple-500`} />;
    case 'boost_expiring':
      return <Zap className={`${iconClass} text-orange-500`} />;
    case 'ad_expiring':
      return <Clock className={`${iconClass} text-yellow-500`} />;
    case 'partnership_invite':
      return <UserPlus className={`${iconClass} text-indigo-500`} />;
    case 'partnership_accepted':
      return <CheckCircle2 className={`${iconClass} text-green-600`} />;
    default:
      return <Bell className={`${iconClass} text-gray-500`} />;
  }
};

export const NotificationsDropdown: React.FC = () => {
  const { unreadNotifications, unreadCount, markAsRead } = useNotifications();
  
  // Pegar apenas as 5 últimas notificações não lidas
  const recentNotifications = unreadNotifications.slice(0, 5);

  const handleNotificationClick = (notification: Notification) => {
    // Marcar como lida ao clicar
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative hover:bg-gray-100"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center px-1 font-semibold">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[calc(100vw-1rem)] max-w-sm sm:w-96 p-0" 
        align="end"
        sideOffset={8}
      >
        <div className="flex flex-col max-h-[500px]">
          {/* Header */}
          <div className="px-4 py-3 border-b bg-slate-50">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm text-gray-900">Notificações</h3>
              {unreadCount > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {unreadCount} {unreadCount === 1 ? 'nova' : 'novas'}
                </Badge>
              )}
            </div>
          </div>

          {/* Lista de Notificações */}
          <div className="overflow-y-auto max-h-[380px]">
            {recentNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <Bell className="h-12 w-12 text-gray-300 mb-3" />
                <p className="text-gray-500 text-sm text-center">
                  Nenhuma notificação nova
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {recentNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className="px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <div className="flex gap-3">
                      {/* Ícone */}
                      <div className="flex-shrink-0 mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>

                      {/* Conteúdo */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className="font-medium text-sm text-gray-900 leading-tight">
                            {notification.title}
                          </p>
                          {!notification.is_read && (
                            <div className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-1" />
                          )}
                        </div>
                        
                        <p className="text-xs text-gray-600 line-clamp-2 mb-1">
                          {notification.message}
                        </p>
                        
                        <p className="text-xs text-gray-400">
                          {formatDistanceToNow(new Date(notification.created_at), {
                            addSuffix: true,
                            locale: ptBR
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {recentNotifications.length > 0 && (
            <div className="px-4 py-3 border-t bg-slate-50">
              <Link to="/dashboard/notifications">
                <Button 
                  variant="ghost" 
                  className="w-full text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                >
                  Ver todas as notificações
                </Button>
              </Link>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};


