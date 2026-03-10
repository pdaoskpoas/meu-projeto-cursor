import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { FileText, AlertTriangle, BarChart3, List, Loader2, Eye, CheckCircle, XCircle } from 'lucide-react';
import { useAdminReports } from '@/hooks/admin/useAdminReports';
import { useToast } from '@/hooks/use-toast';

const AdminReports: React.FC = () => {
  const [activeTab, setActiveTab] = useState('list');
  const { reports, isLoading, error, approveReport, rejectReport, setUnderReview } = useAdminReports();
  const { toast } = useToast();

  const handleApproveReport = async (reportId: string) => {
    try {
      await approveReport(reportId, 'Denúncia aprovada e ação tomada', 'warning');
      toast({
        title: "Denúncia aprovada",
        description: "A denúncia foi aprovada e as ações necessárias foram tomadas.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível aprovar a denúncia.",
        variant: "destructive"
      });
    }
  };

  const handleRejectReport = async (reportId: string) => {
    try {
      await rejectReport(reportId, 'Denúncia não procede');
      toast({
        title: "Denúncia rejeitada",
        description: "A denúncia foi rejeitada.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível rejeitar a denúncia.",
        variant: "destructive"
      });
    }
  };

  if (error) {
    return (
      <div className="p-6">
        <Card className="p-6 bg-red-50 border-red-200">
          <h3 className="text-lg font-semibold text-red-900 mb-2">Erro ao carregar denúncias</h3>
          <p className="text-red-700">{error.message}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Relatórios e Denúncias</h1>
          <p className="text-gray-600">Gerencie relatórios de usuários e tome ações administrativas</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="list" className="flex items-center gap-2">
            <List className="h-4 w-4" />
            Lista de Relatórios
          </TabsTrigger>
          <TabsTrigger value="priority" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Alta Prioridade
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Estatísticas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-3 text-gray-600">Carregando denúncias...</span>
            </div>
          ) : (
            <Card>
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">
                    Todas as Denúncias ({reports.length})
                  </h3>
                </div>

                {reports.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Nenhuma denúncia registrada ainda.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Denunciante</TableHead>
                          <TableHead>Denunciado</TableHead>
                          <TableHead>Motivo</TableHead>
                          <TableHead>Prioridade</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Data</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reports.map((report) => (
                          <TableRow key={report.id}>
                            <TableCell>
                              <Badge variant="outline">
                                {report.contentType}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-medium">
                              {report.reporterName || report.reporterEmail || 'Anônimo'}
                            </TableCell>
                            <TableCell>
                              {report.reportedUserName || report.animalName || '-'}
                            </TableCell>
                            <TableCell className="max-w-xs truncate">
                              {report.reason}
                            </TableCell>
                            <TableCell>
                              <Badge variant={
                                report.priority === 'urgent' ? 'destructive' :
                                report.priority === 'high' ? 'default' :
                                report.priority === 'medium' ? 'secondary' : 
                                'outline'
                              }>
                                {report.priority}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={
                                report.status === 'pending' ? 'default' :
                                report.status === 'under_review' ? 'secondary' :
                                report.status === 'resolved' ? 'outline' : 
                                'destructive'
                              }>
                                {report.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {new Date(report.createdAt).toLocaleDateString('pt-BR')}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex gap-2 justify-end">
                                {report.status === 'pending' && (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleApproveReport(report.id)}
                                      className="text-green-600 hover:text-green-700"
                                    >
                                      <CheckCircle className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleRejectReport(report.id)}
                                      className="text-red-600 hover:text-red-700"
                                    >
                                      <XCircle className="h-4 w-4" />
                                    </Button>
                                  </>
                                )}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    toast({
                                      title: "Ver detalhes",
                                      description: report.description,
                                    });
                                  }}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="priority" className="space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Denúncias de Alta Prioridade</h3>
              {reports.filter(r => r.priority === 'high' || r.priority === 'urgent').length === 0 ? (
                <div className="text-center py-12">
                  <AlertTriangle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhuma denúncia de alta prioridade no momento.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {reports.filter(r => r.priority === 'high' || r.priority === 'urgent').map((report) => (
                    <Card key={report.id} className="p-4 border-l-4 border-l-red-500">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="destructive">{report.priority}</Badge>
                            <Badge variant="outline">{report.contentType}</Badge>
                          </div>
                          <h4 className="font-semibold">{report.reason}</h4>
                          <p className="text-sm text-gray-600 mt-1">{report.description}</p>
                          <p className="text-xs text-gray-500 mt-2">
                            Denunciado: {report.reportedUserName || '-'} • 
                            Data: {new Date(report.createdAt).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {report.status === 'pending' && (
                            <>
                              <Button size="sm" onClick={() => handleApproveReport(report.id)} variant="outline">
                                Aprovar
                              </Button>
                              <Button size="sm" onClick={() => handleRejectReport(report.id)} variant="outline">
                                Rejeitar
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </Card>
          )}
        </TabsContent>

        <TabsContent value="stats" className="space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-4 bg-red-50 border-red-200">
                  <h4 className="font-medium text-red-900">Pendentes</h4>
                  <p className="text-3xl font-bold text-red-800 mt-2">
                    {reports.filter(r => r.status === 'pending').length}
                  </p>
                </Card>
                <Card className="p-4 bg-yellow-50 border-yellow-200">
                  <h4 className="font-medium text-yellow-900">Em Análise</h4>
                  <p className="text-3xl font-bold text-yellow-800 mt-2">
                    {reports.filter(r => r.status === 'under_review').length}
                  </p>
                </Card>
                <Card className="p-4 bg-green-50 border-green-200">
                  <h4 className="font-medium text-green-900">Resolvidas</h4>
                  <p className="text-3xl font-bold text-green-800 mt-2">
                    {reports.filter(r => r.status === 'resolved').length}
                  </p>
                </Card>
                <Card className="p-4 bg-gray-50 border-gray-200">
                  <h4 className="font-medium text-gray-900">Rejeitadas</h4>
                  <p className="text-3xl font-bold text-gray-800 mt-2">
                    {reports.filter(r => r.status === 'rejected').length}
                  </p>
                </Card>
              </div>

              {/* Estatísticas por tipo */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Denúncias por Tipo</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600">
                      {reports.filter(r => r.contentType === 'animal').length}
                    </p>
                    <p className="text-sm text-gray-600">Animais</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-indigo-600">
                      {reports.filter(r => r.contentType === 'event').length}
                    </p>
                    <p className="text-sm text-gray-600">Eventos</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">
                      {reports.filter(r => r.contentType === 'user').length}
                    </p>
                    <p className="text-sm text-gray-600">Usuários</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">
                      {reports.filter(r => r.contentType === 'message').length}
                    </p>
                    <p className="text-sm text-gray-600">Mensagens</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-orange-600">
                      {reports.filter(r => r.contentType === 'conversation').length}
                    </p>
                    <p className="text-sm text-gray-600">Conversas</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-pink-600">
                      {reports.filter(r => r.contentType === 'profile').length}
                    </p>
                    <p className="text-sm text-gray-600">Perfis</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-600">
                      {reports.filter(r => r.contentType === 'other').length}
                    </p>
                    <p className="text-sm text-gray-600">Outros</p>
                  </div>
                </div>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminReports;

