import React from 'react';
import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useChat } from '@/contexts/ChatContext';
import type { Animal } from '@/types/animal';

interface ChatButtonProps {
  animal: Animal;
  onChatOpen: () => void;
}

const ChatButton: React.FC<ChatButtonProps> = ({ animal, onChatOpen }) => {
  const { user } = useAuth();
  const { startConversation, openConversation } = useChat();

  if (!animal.allowMessages || !user || user.propertyId === animal.harasId) {
    return null;
  }

  const handleChatClick = () => {
    const conversationId = startConversation(
      animal.id, 
      animal.name, 
      animal.harasId, 
      animal.harasName
    );
    
    if (conversationId) {
      openConversation(conversationId);
      onChatOpen();
    }
  };

  return (
    <Button 
      onClick={handleChatClick}
      className="btn-primary flex-1 sm:flex-initial"
      size="lg"
    >
      <MessageCircle className="h-5 w-5 mr-2" />
      Enviar Mensagem
    </Button>
  );
};

export default ChatButton;