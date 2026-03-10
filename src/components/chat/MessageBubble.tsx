import React from 'react';

interface MessageBubbleProps {
  message: {
    id: string;
    content: string;
    timestamp: string;
    status: 'sent' | 'delivered' | 'read';
    senderId: string;
  };
  isOwnMessage: boolean;
  currentUserId: string;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwnMessage,
  currentUserId
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
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
          isOwnMessage
            ? 'bg-primary text-primary-foreground rounded-br-sm'
            : 'bg-muted text-foreground rounded-bl-sm'
        }`}
      >
        <p className="text-sm">{message.content}</p>
        <div className={`flex items-center justify-end space-x-1 mt-1 ${
          isOwnMessage ? 'text-primary-foreground/70' : 'text-muted-foreground'
        }`}>
          <span className="text-xs">{formatTime(message.timestamp)}</span>
          {isOwnMessage && (
            <div className="flex space-x-1">
              <div className={`h-3 w-3 rounded-full ${
                message.status === 'read' ? 'bg-green-500' : 'bg-gray-400'
              }`} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;