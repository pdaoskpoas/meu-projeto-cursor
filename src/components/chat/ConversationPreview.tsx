import React from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';

interface ConversationPreviewProps {
  conversation: {
    id: string;
    animalId: string;
    animalName: string;
    animalImage: string;
    otherUser: {
      id: string;
      name: string;
      avatar: string;
    };
    lastMessage: {
      content: string;
      timestamp: string;
      isRead: boolean;
      senderId: string;
    };
    unreadCount: number;
  };
  isSelected: boolean;
  onClick: () => void;
}

const ConversationPreview: React.FC<ConversationPreviewProps> = ({
  conversation,
  isSelected,
  onClick
}) => {
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Ontem';
    } else {
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    }
  };

  return (
    <Card
      className={`p-3 cursor-pointer transition-colors hover:bg-muted/50 ${
        isSelected ? 'bg-muted' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-center space-x-3">
        <div className="relative">
          <Avatar className="h-12 w-12">
            <AvatarImage src={conversation.otherUser.avatar} />
            <AvatarFallback>
              {conversation.otherUser.name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          {conversation.unreadCount > 0 && (
            <div className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full h-5 w-5 flex items-center justify-center text-xs font-medium">
              {conversation.unreadCount}
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-medium text-foreground truncate">
              {conversation.otherUser.name}
            </h3>
            <span className="text-xs text-muted-foreground">
              {formatTime(conversation.lastMessage.timestamp)}
            </span>
          </div>
          
          <div className="flex items-center space-x-2 mb-1">
            <img
              src={conversation.animalImage}
              alt={conversation.animalName}
              className="h-6 w-6 rounded object-cover"
            />
            <span className="text-xs font-medium text-primary">
              {conversation.animalName}
            </span>
          </div>
          
          <p className={`text-sm truncate ${
            conversation.unreadCount > 0 ? 'font-medium text-foreground' : 'text-muted-foreground'
          }`}>
            {conversation.lastMessage.content}
          </p>
        </div>
      </div>
    </Card>
  );
};

export default ConversationPreview;