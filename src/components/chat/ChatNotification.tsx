import React, { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useChat } from '@/contexts/ChatContext';
import ChatModal from './ChatModal';

const ChatNotification: React.FC = () => {
  const { unreadCount } = useChat();
  const [showChatModal, setShowChatModal] = useState(false);

  if (unreadCount === 0) return null;

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowChatModal(true)}
        className="fixed bottom-4 right-4 z-50 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg"
      >
        <MessageCircle className="h-4 w-4 mr-2" />
        Mensagens
        <Badge variant="secondary" className="ml-2 bg-red-500 text-white">
          {unreadCount}
        </Badge>
      </Button>
      
      <ChatModal
        isOpen={showChatModal}
        onClose={() => setShowChatModal(false)}
      />
    </>
  );
};

export default ChatNotification;