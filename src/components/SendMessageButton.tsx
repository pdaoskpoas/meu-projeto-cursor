import React from 'react';
import { MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useChat } from '@/contexts/ChatContext';
import type { Animal } from '@/types/animal';

interface SendMessageButtonProps {
  animal: Animal;
}

const SendMessageButton: React.FC<SendMessageButtonProps> = ({ animal }) => {
  const { user } = useAuth();
  const { startTemporaryConversation, openConversation } = useChat();
  const navigate = useNavigate();

  const handleSendMessage = async () => {
    // Se não estiver logado, redireciona para login
    if (!user) {
      navigate('/login');
      return;
    }

    // Se for o próprio dono do animal, não mostra o botão
    if (user.propertyId === animal.harasId) {
      return;
    }

    // Se o animal não permite mensagens, não mostra o botão
    if (!animal.allowMessages) {
      return;
    }

    try {
      // Se estiver logado, inicia conversa temporária e redireciona para mensagens
      const conversationId = await startTemporaryConversation(
        animal.id, 
        animal.name, 
        animal.harasId, 
        animal.harasName
      );
      
      if (conversationId) {
        // Redireciona para a página de mensagens com a conversa já aberta
        navigate(`/dashboard/messages?conversation=${conversationId}`);
      }
    } catch (error) {
      console.error('Erro ao iniciar conversa:', error);
    }
  };

  // Não mostra o botão se for o próprio dono ou se o animal não permite mensagens
  if (user && (user.propertyId === animal.harasId || !animal.allowMessages)) {
    return null;
  }

  return (
    <Button 
      onClick={handleSendMessage}
      className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
      size="lg"
    >
      <MessageCircle className="h-5 w-5 mr-2" />
      Enviar Mensagem
    </Button>
  );
};

export default SendMessageButton;
