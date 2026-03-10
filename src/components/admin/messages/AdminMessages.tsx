import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, Send, Archive, BarChart3, Loader2 } from 'lucide-react';
import { useAdminMessages } from '@/hooks/admin/useAdminMessages';

const AdminMessages: React.FC = () => {
  const [activeTab, setActiveTab] = useState('inbox');
  const { stats, isLoading, error } = useAdminMessages();

  if (error) {
    return (
      <div className="p-6">
        <Card className="p-6 bg-red-50 border-red-200">
          <h3 className="text-lg font-semibold text-red-900 mb-2">Erro ao carregar mensagens</h3>
          <p className="text-red-700">{error.message}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Central de Mensagens</h1>
          <p className="text-gray-600">Gerencie comunicações e mensagens do sistema</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="inbox" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Caixa de Entrada
          </TabsTrigger>
          <TabsTrigger value="sent" className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            Enviadas
          </TabsTrigger>
          <TabsTrigger value="archived" className="flex items-center gap-2">
            <Archive className="h-4 w-4" />
            Arquivadas
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Estatísticas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inbox" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Mensagens Recebidas</h3>
            <div className="text-center py-12">
              <p className="text-gray-500">Interface de mensagens será implementada em breve.</p>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="sent" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Mensagens Enviadas</h3>
            <div className="text-center py-12">
              <p className="text-gray-500">Histórico de mensagens enviadas será implementado em breve.</p>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="archived" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Mensagens Arquivadas</h3>
            <div className="text-center py-12">
              <p className="text-gray-500">Arquivo de mensagens será implementado em breve.</p>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="stats" className="space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-3 text-gray-600">Carregando estatísticas...</span>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-4 bg-blue-50 border-blue-200">
                  <h4 className="font-medium text-blue-900 flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Total de Mensagens
                  </h4>
                  <p className="text-3xl font-bold text-blue-800 mt-2">{stats?.totalMessages || 0}</p>
                </Card>
                <Card className="p-4 bg-green-50 border-green-200">
                  <h4 className="font-medium text-green-900 flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Conversas Ativas
                  </h4>
                  <p className="text-3xl font-bold text-green-800 mt-2">{stats?.activeConversations || 0}</p>
                </Card>
                <Card className="p-4 bg-yellow-50 border-yellow-200">
                  <h4 className="font-medium text-yellow-900 flex items-center gap-2">
                    <Send className="h-4 w-4" />
                    Mensagens Este Mês
                  </h4>
                  <p className="text-3xl font-bold text-yellow-800 mt-2">{stats?.messagesThisMonth || 0}</p>
                </Card>
                <Card className="p-4 bg-purple-50 border-purple-200">
                  <h4 className="font-medium text-purple-900 flex items-center gap-2">
                    <Archive className="h-4 w-4" />
                    Total Conversas
                  </h4>
                  <p className="text-3xl font-bold text-purple-800 mt-2">{stats?.totalConversations || 0}</p>
                </Card>
              </div>

              {stats && (stats.totalMessages === 0 && stats.totalConversations === 0) && (
                <Card className="p-6 bg-gray-50">
                  <div className="text-center py-6">
                    <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Nenhuma mensagem no sistema ainda.</p>
                    <p className="text-sm text-gray-400 mt-2">
                      As conversas entre usuários aparecerão aqui.
                    </p>
                  </div>
                </Card>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminMessages;

