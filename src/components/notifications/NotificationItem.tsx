import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import {
  Heart,
  MessageCircle,
  Eye,
  MousePointerClick,
  Zap,
  Clock,
  UserPlus,
  CheckCircle2,
  X
} from 'lucide-react';
import { Notification } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}

const getNotificationIcon = (type: Notification['type']) => {
  switch (type) {
    case 'favorite_added':
      return <Heart className="h-5 w-5 text-blue-500" />;
    case 'message_received':
      return <MessageCircle className="h-5 w-5 text-blue-500" />;
    case 'animal_view':
      return <Eye className="h-5 w-5 text-blue-500" />;
    case 'animal_click':
      return <MousePointerClick className="h-5 w-5 text-blue-700" />;
    case 'boost_expiring':
      return <Zap className="h-5 w-5 text-gray-500" />;
    case 'ad_expiring':
      return <Clock className="h-5 w-5 text-gray-500" />;
    case 'partnership_invite':
      return <UserPlus className="h-5 w-5 text-blue-700" />;
    case 'partnership_accepted':
      return <CheckCircle2 className="h-5 w-5 text-blue-600" />;
    default:
      return <MessageCircle className="h-5 w-5 text-gray-500" />;
  }
};

const getNotificationColor = (type: Notification['type']) => {
  switch (type) {
    case 'favorite_added':
      return 'bg-blue-50 border-blue-200';
    case 'message_received':
      return 'bg-blue-50 border-blue-200';
    case 'animal_view':
      return 'bg-blue-50 border-blue-200';
    case 'animal_click':
      return 'bg-blue-50 border-blue-200';
    case 'boost_expiring':
      return 'bg-gray-100 border-gray-200';
    case 'ad_expiring':
      return 'bg-gray-100 border-gray-200';
    case 'partnership_invite':
      return 'bg-blue-50 border-blue-200';
    case 'partnership_accepted':
      return 'bg-blue-50 border-blue-200';
    default:
      return 'bg-gray-50 border-gray-200';
  }
};

export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onMarkAsRead,
  onDelete
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    // Sempre marcar como lida ao clicar
    if (!notification.is_read) {
      onMarkAsRead(notification.id);
    }
    
    // Notificações informativas/alertas NÃO redirecionam
    // Apenas marcam como lidas
    const nonRedirectTypes = [
      'favorite_added',
      'animal_view', 
      'animal_click',
      'boost_expiring',
      'ad_expiring'
    ];
    
    if (nonRedirectTypes.includes(notification.type)) {
      // Não redirecionar - apenas marcar como lida
      return;
    }
    
    // Apenas mensagens, convites e parcerias redirecionam
    if (notification.action_url) {
      navigate(notification.action_url);
    }
  };

  const timeAgo = formatDistanceToNow(new Date(notification.created_at), {
    addSuffix: true,
    locale: ptBR
  });

  // Determinar se a notificação é apenas informativa (não redireciona)
  const isInformationalOnly = [
    'favorite_added', 
    'animal_view', 
    'animal_click',
    'boost_expiring',
    'ad_expiring'
  ].includes(notification.type);
  
  return (
    <Card
      className={`p-4 transition-all hover:shadow-md ${
        isInformationalOnly ? 'cursor-default' : 'cursor-pointer'
      } ${
        !notification.is_read ? getNotificationColor(notification.type) : 'bg-white'
      } ${!notification.is_read ? 'border-l-4' : ''}`}
      onClick={handleClick}
      title={isInformationalOnly ? 'Clique para marcar como lida' : 'Clique para ver detalhes'}
    >
      <div className="flex items-start gap-3">
        {/* Ícone */}
        <div className="flex-shrink-0 mt-1">
          {getNotificationIcon(notification.type)}
        </div>

        {/* Conteúdo */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4 className="font-semibold text-gray-900 text-sm">
              {notification.title}
            </h4>
            {!notification.is_read && (
              <Badge variant="default" className="bg-primary text-xs">
                Nova
              </Badge>
            )}
          </div>

          <p className="text-sm text-gray-600 mb-2">
            {notification.message}
          </p>

          {/* Metadados adicionais */}
          {notification.metadata && (
            <div className="flex flex-wrap gap-2 mb-2">
              {notification.metadata.animal_name && (
                <Badge variant="outline" className="text-xs">
                  {notification.metadata.animal_name}
                </Badge>
              )}
              {notification.metadata.impressions_count && (
                <Badge variant="outline" className="text-xs">
                  {notification.metadata.impressions_count} visualizações
                </Badge>
              )}
              {notification.metadata.clicks_count && (
                <Badge variant="outline" className="text-xs">
                  {notification.metadata.clicks_count} cliques
                </Badge>
              )}
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">{timeAgo}</span>
            
            <div className="flex gap-2">
              {!notification.is_read && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMarkAsRead(notification.id);
                  }}
                  className="text-xs h-7"
                >
                  Marcar como lida
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(notification.id);
                }}
                className="text-xs h-7 text-gray-600 hover:text-gray-700 hover:bg-gray-100"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

