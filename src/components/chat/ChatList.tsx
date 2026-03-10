import React from 'react';
import { MessageCircle, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useChat } from '@/contexts/ChatContext';
import { useAuth } from '@/contexts/AuthContext';
import { formatMessageTime } from '@/data/chatData';

interface ChatListProps {
  onConversationSelect: (conversationId: string) => void;
  onClose: () => void;
}

const ChatList: React.FC<ChatListProps> = ({ onConversationSelect, onClose }) => {
  const { user } = useAuth();
  const { conversations } = useChat();

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full text-gray-medium">
        <p>Faça login para acessar suas conversas</p>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-medium space-y-4">
        <MessageCircle className="h-12 w-12 text-gray-light" />
        <div className="text-center">
          <p className="font-medium">Nenhuma conversa ainda</p>
          <p className="text-sm">Envie mensagens nos anúncios que permitirem para começar uma conversa</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-card border-b border-border p-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Users className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-blue-dark">Conversas</h3>
          <Badge variant="secondary" className="ml-2">
            {conversations.length}
          </Badge>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} className="text-gray-medium">
          Fechar
        </Button>
      </div>

      {/* Conversations List */}
      <ScrollArea className="flex-1">
        <div className="divide-y divide-border">
          {conversations.map((conversation) => {
            const otherParticipant = conversation.animalOwnerId === user.id 
              ? conversation.interestedUserName 
              : conversation.animalOwnerName;

            const hasUnread = conversation.unreadCount > 0;

            return (
              <div
                key={conversation.id}
                className="p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => onConversationSelect(conversation.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <p className={`font-medium truncate ${hasUnread ? 'text-blue-dark' : 'text-gray-dark'}`}>
                        {otherParticipant}
                      </p>
                      {hasUnread && (
                        <Badge variant="default" className="text-xs px-1.5 py-0.5">
                          {conversation.unreadCount}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-medium mb-1">
                      Sobre: {conversation.animalName}
                    </p>
                    {conversation.lastMessage && (
                      <p className={`text-sm truncate ${hasUnread ? 'text-blue-dark font-medium' : 'text-gray-medium'}`}>
                        {conversation.lastMessage}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end space-y-1 ml-2">
                    {conversation.lastMessageTime && (
                      <span className="text-xs text-gray-light">
                        {formatMessageTime(conversation.lastMessageTime)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ChatList;