import React, { useState } from 'react';
import { Search, Users, MessageCircle, Eye, Ban, Archive } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { mockChatConversations, mockChatMessages, formatMessageTime } from '@/data/chatData';

const AdminChat: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [showConversationModal, setShowConversationModal] = useState(false);

  const filteredConversations = mockChatConversations.filter(conv =>
    conv.animalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.animalOwnerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.interestedUserName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleViewConversation = (conversationId: string) => {
    setSelectedConversation(conversationId);
    setShowConversationModal(true);
  };

  const selectedConv = mockChatConversations.find(c => c.id === selectedConversation);
  const conversationMessages = selectedConversation 
    ? mockChatMessages.filter(msg => msg.conversationId === selectedConversation)
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-blue-dark">Gerenciar Chat</h1>
          <p className="text-gray-medium">Monitore conversas entre usuários para segurança</p>
        </div>
      </div>

      {/* Search */}
      <Card className="p-4">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-medium" />
            <Input
              placeholder="Buscar por animal, proprietário ou interessado..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <MessageCircle className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-medium">Total de Conversas</p>
              <p className="text-2xl font-bold text-blue-dark">{mockChatConversations.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-medium">Conversas Ativas</p>
              <p className="text-2xl font-bold text-blue-dark">
                {mockChatConversations.filter(c => c.isActive).length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Archive className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-medium">Total de Mensagens</p>
              <p className="text-2xl font-bold text-blue-dark">{mockChatMessages.length}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Conversations List */}
      <Card>
        <div className="p-6">
          <h2 className="text-lg font-semibold text-blue-dark mb-4">Conversas Recentes</h2>
          
          <div className="space-y-4">
            {filteredConversations.map((conversation) => (
              <div 
                key={conversation.id}
                className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="font-medium text-blue-dark">
                        Sobre: {conversation.animalName}
                      </h3>
                      {conversation.isActive ? (
                        <Badge variant="default">Ativa</Badge>
                      ) : (
                        <Badge variant="secondary">Inativa</Badge>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                      <div>
                        <p className="text-sm text-gray-medium">Proprietário:</p>
                        <p className="font-medium">{conversation.animalOwnerName}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-medium">Interessado:</p>
                        <p className="font-medium">{conversation.interestedUserName}</p>
                      </div>
                    </div>

                    {conversation.lastMessage && (
                      <div className="mb-3">
                        <p className="text-sm text-gray-medium">Última mensagem:</p>
                        <p className="text-sm bg-muted p-2 rounded italic">
                          "{conversation.lastMessage}"
                        </p>
                        <p className="text-xs text-gray-light mt-1">
                          {formatMessageTime(conversation.lastMessageTime!)}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col space-y-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewConversation(conversation.id)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Ver Conversa
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                    >
                      <Ban className="h-4 w-4 mr-2" />
                      Suspender
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {filteredConversations.length === 0 && (
            <div className="text-center py-8 text-gray-medium">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-light" />
              <p>Nenhuma conversa encontrada</p>
            </div>
          )}
        </div>
      </Card>

      {/* Conversation Modal */}
      <Dialog open={showConversationModal} onOpenChange={setShowConversationModal}>
        <DialogContent className="max-w-4xl h-[600px]">
          <DialogHeader>
            <DialogTitle>
              Conversa sobre: {selectedConv?.animalName}
            </DialogTitle>
            <div className="text-sm text-gray-medium">
              Entre {selectedConv?.animalOwnerName} e {selectedConv?.interestedUserName}
            </div>
          </DialogHeader>
          
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-4">
              {conversationMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.senderId === selectedConv?.animalOwnerId ? 'justify-start' : 'justify-end'
                  }`}
                >
                  <div
                    className={`max-w-md p-3 rounded-lg ${
                      message.senderId === selectedConv?.animalOwnerId
                        ? 'bg-muted text-muted-foreground'
                        : 'bg-primary text-primary-foreground'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{message.senderName}</span>
                      <span className="text-xs opacity-70">
                        {formatMessageTime(message.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm">{message.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
          
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <p className="text-sm text-gray-medium text-center">
              <strong>Aviso:</strong> Esta conversa está sendo monitorada apenas para fins de segurança.
              As mensagens são criptografadas entre os usuários.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminChat;