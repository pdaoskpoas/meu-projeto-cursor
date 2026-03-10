// Mock data for chat system

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  read: boolean;
  type: 'text';
}

export interface ChatConversation {
  id: string;
  animalId: string;
  animalName: string;
  animalOwnerId: string;
  animalOwnerName: string;
  interestedUserId: string;
  interestedUserName: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
  createdAt: string;
  isActive: boolean;
  isTemporary?: boolean;
}

export const mockChatMessages: ChatMessage[] = [
  {
    id: '1',
    conversationId: 'conv1',
    senderId: '2',
    senderName: 'João Interessado',
    content: 'Olá! Tenho muito interesse na égua Estrela do Campo. Ela está disponível para cobertura?',
    timestamp: '2024-01-20T10:30:00Z',
    read: true,
    type: 'text'
  },
  {
    id: '2',
    conversationId: 'conv1',
    senderId: '1',
    senderName: 'Roberto Silva',
    content: 'Olá João! Sim, ela está disponível. Qual seria o garanhão? Podemos conversar sobre os detalhes.',
    timestamp: '2024-01-20T11:15:00Z',
    read: true,
    type: 'text'
  },
  {
    id: '3',
    conversationId: 'conv1',
    senderId: '2',
    senderName: 'João Interessado',
    content: 'Perfeito! Tenho um garanhão Mangalarga registrado. Gostaria de saber sobre valores e procedimentos.',
    timestamp: '2024-01-20T11:45:00Z',
    read: false,
    type: 'text'
  },
  {
    id: '4',
    conversationId: 'conv2',
    senderId: '3',
    senderName: 'Maria Criadora',
    content: 'Boa tarde! Thunder Storm ainda está disponível para reprodução? Qual o valor?',
    timestamp: '2024-01-21T14:20:00Z',
    read: true,
    type: 'text'
  },
  {
    id: '5',
    conversationId: 'conv2',
    senderId: '2',
    senderName: 'Maria Santos',
    content: 'Boa tarde Maria! Sim, ele está disponível. Vou te passar os valores por aqui mesmo.',
    timestamp: '2024-01-21T15:30:00Z',
    read: true,
    type: 'text'
  }
];

export const mockChatConversations: ChatConversation[] = [
  {
    id: 'conv1',
    animalId: '1',
    animalName: 'Estrela do Campo',
    animalOwnerId: '1',
    animalOwnerName: 'Roberto Silva',
    interestedUserId: '2',
    interestedUserName: 'João Interessado',
    lastMessage: 'Perfeito! Tenho um garanhão Mangalarga registrado. Gostaria de saber sobre valores e procedimentos.',
    lastMessageTime: '2024-01-20T11:45:00Z',
    unreadCount: 1,
    createdAt: '2024-01-20T10:30:00Z',
    isActive: true
  },
  {
    id: 'conv2',
    animalId: '2',
    animalName: 'Thunder Storm',
    animalOwnerId: '2',
    animalOwnerName: 'Maria Santos',
    interestedUserId: '3',
    interestedUserName: 'Maria Criadora',
    lastMessage: 'Boa tarde Maria! Sim, ele está disponível. Vou te passar os valores por aqui mesmo.',
    lastMessageTime: '2024-01-21T15:30:00Z',
    unreadCount: 0,
    createdAt: '2024-01-21T14:20:00Z',
    isActive: true
  }
];

// Helper functions
export const getConversationsForUser = (userId: string): ChatConversation[] => {
  return mockChatConversations.filter(conv => {
    // Se o usuário é o proprietário do animal, só mostra conversas que não são temporárias
    if (conv.animalOwnerId === userId) {
      return !conv.isTemporary;
    }
    // Se o usuário é o interessado, mostra todas as conversas (incluindo temporárias)
    return conv.interestedUserId === userId;
  });
};

export const getMessagesForConversation = (conversationId: string): ChatMessage[] => {
  return mockChatMessages.filter(msg => msg.conversationId === conversationId);
};

export const formatMessageTime = (timestamp: string): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  if (diff < 60000) return 'Agora';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
  
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit'
  });
};