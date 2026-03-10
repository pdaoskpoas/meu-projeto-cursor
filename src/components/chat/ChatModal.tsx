import React, { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import ChatList from './ChatList';
import ChatWindow from './ChatWindow';
import { useChat } from '@/contexts/ChatContext';

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialConversationId?: string;
}

const ChatModal: React.FC<ChatModalProps> = ({ isOpen, onClose, initialConversationId }) => {
  const { openConversation, currentConversation } = useChat();
  const [showList, setShowList] = useState(!initialConversationId);

  React.useEffect(() => {
    if (initialConversationId && isOpen) {
      openConversation(initialConversationId);
      setShowList(false);
    }
  }, [initialConversationId, isOpen, openConversation]);

  const handleConversationSelect = (conversationId: string) => {
    openConversation(conversationId);
    setShowList(false);
  };

  const handleBackToList = () => {
    setShowList(true);
  };

  const handleClose = () => {
    setShowList(!initialConversationId);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl h-[600px] p-0">
        <div className="h-full">
          {showList || !currentConversation ? (
            <ChatList 
              onConversationSelect={handleConversationSelect} 
              onClose={handleClose}
            />
          ) : (
            <ChatWindow 
              onClose={handleClose} 
              onBackToList={handleBackToList}
              showBackButton={!initialConversationId}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ChatModal;