import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, PhoneCall, Timer } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAdminSubscriptionControl } from '@/hooks/admin/useAdminSubscriptionControl';

const outreachStatusOptions = [
  { value: 'pending', label: 'Pendente' },
  { value: 'contacted', label: 'Contatado' },
  { value: 'responded', label: 'Respondeu' },
  { value: 'no_response', label: 'Sem resposta' },
  { value: 'wants_return', label: 'Quer retornar' },
  { value: 'not_interested', label: 'Não interessado' }
];

const channelOptions = [
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Telefone' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'other', label: 'Outro' }
];

const toIsoIfPresent = (value: string) => (value ? new Date(value).toISOString() : null);

const statusBadgeClass = (status?: string | null) => {
  switch (status) {
    case 'pending':
      return 'bg-gray-100 text-gray-700 border-gray-200';
    case 'contacted':
      return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'responded':
      return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'no_response':
      return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'wants_return':
      return 'bg-indigo-100 text-indigo-700 border-indigo-200';
    case 'not_interested':
      return 'bg-red-100 text-red-700 border-red-200';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
};

const AdminSubscriptionControl: React.FC = () => {
  const [activeTab, setActiveTab] = useState('expiring');
  const [expiringDays, setExpiringDays] = useState<'7' | '15' | '30'>('30');
  const { toast } = useToast();
  const {
    expiringUsers,
    expiredUsers,
    followupsByUser,
    isLoading,
    error,
    createFollowup,
    updateFollowup
  } = useAdminSubscriptionControl(Number(expiringDays));

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [formState, setFormState] = useState({
    outreachStatus: 'contacted',
    contactChannel: 'whatsapp',
    contactNotes: '',
    cancellationReason: '',
    feedback: '',
    contactedAt: new Date().toISOString().slice(0, 16),
    respondedAt: '',
    nextFollowUpAt: ''
  });

  const currentUsers = activeTab === 'expiring' ? expiringUsers : expiredUsers;

  const selectedUser = useMemo(
    () => currentUsers.find((user) => user.id === selectedUserId) || null,
    [currentUsers, selectedUserId]
  );

  const selectedFollowups = selectedUserId ? followupsByUser[selectedUserId] || [] : [];
  const lastFollowup = selectedFollowups[0];
  const [lastStatus, setLastStatus] = useState<string>('pending');

  useEffect(() => {
    if (!selectedUserId && currentUsers.length > 0) {
      setSelectedUserId(currentUsers[0].id);
    }
    if (selectedUserId && !currentUsers.some((user) => user.id === selectedUserId)) {
      setSelectedUserId(currentUsers[0]?.id ?? null);
    }
  }, [currentUsers, selectedUserId]);

  useEffect(() => {
    if (lastFollowup?.outreach_status) {
      setLastStatus(lastFollowup.outreach_status);
    } else {
      setLastStatus('pending');
    }
  }, [lastFollowup?.outreach_status]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedUserId) return;

    try {
      await createFollowup({
        userId: selectedUserId,
        outreachStatus: formState.outreachStatus,
        contactChannel: formState.contactChannel,
        contactNotes: formState.contactNotes || null,
        cancellationReason: formState.cancellationReason || null,
        feedback: formState.feedback || null,
        contactedAt: toIsoIfPresent(formState.contactedAt),
        respondedAt: toIsoIfPresent(formState.respondedAt),
        nextFollowUpAt: toIsoIfPresent(formState.nextFollowUpAt)
      });

      toast({
        title: 'Contato registrado',
        description: 'O acompanhamento foi salvo com sucesso.'
      });

      setFormState((prev) => ({
        ...prev,
        contactNotes: '',
        cancellationReason: '',
        feedback: '',
        respondedAt: '',
        nextFollowUpAt: ''
      }));
    } catch (err: unknown) {
      toast({
        title: 'Erro ao registrar contato',
        description: err instanceof Error ? err.message : 'Não foi possível salvar o contato.',
        variant: 'destructive'
      });
    }
  };

  if (error) {
    return (
      <Card className="p-6 bg-red-50 border-red-200">
        <h3 className="text-lg font-semibold text-red-900 mb-2">Erro ao carregar assinaturas</h3>
        <p className="text-red-700">{error.message}</p>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-3 text-gray-600">Carregando controle de assinaturas...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Controle de Assinaturas</h1>
          <p className="text-gray-600">Acompanhe planos expirando, expirados e registre contatos de reativação.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Expirando em</span>
          <Select value={expiringDays} onValueChange={setExpiringDays}>
            <SelectTrigger className="w-[110px]">
              <SelectValue placeholder="Dias" />
            </SelectTrigger>
            <SelectContent side="bottom" align="start">
              <SelectItem value="7">7 dias</SelectItem>
              <SelectItem value="15">15 dias</SelectItem>
              <SelectItem value="30">30 dias</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="expiring" className="flex items-center gap-2">
            <Timer className="h-4 w-4" />
            Expirando ({expiringUsers.length})
          </TabsTrigger>
          <TabsTrigger value="expired" className="flex items-center gap-2">
            <PhoneCall className="h-4 w-4" />
            Expirados ({expiredUsers.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="expiring" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Assinaturas expirando em breve</CardTitle>
              </CardHeader>
              <CardContent>
                {expiringUsers.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum plano expirando no período selecionado.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Usuário</TableHead>
                          <TableHead>Plano</TableHead>
                          <TableHead>Expira em</TableHead>
                          <TableHead>Status contato</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {expiringUsers.map((user) => {
                          const last = followupsByUser[user.id]?.[0];
                          return (
                            <TableRow
                              key={user.id}
                              onClick={() => setSelectedUserId(user.id)}
                              className={user.id === selectedUserId ? 'bg-muted/60' : 'cursor-pointer'}
                            >
                              <TableCell className="font-medium">
                                {user.name || 'Usuário sem nome'}
                                <div className="text-xs text-muted-foreground">{user.email}</div>
                                {user.phone && <div className="text-xs text-muted-foreground">{user.phone}</div>}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">{user.plan || 'free'}</Badge>
                              </TableCell>
                              <TableCell>
                                {user.plan_expires_at
                                  ? new Date(user.plan_expires_at).toLocaleDateString('pt-BR')
                                  : '-'}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className={statusBadgeClass(last?.outreach_status)}>
                                  {last?.outreach_status
                                    ? outreachStatusOptions.find((option) => option.value === last.outreach_status)?.label || last.outreach_status
                                    : 'Sem contato'}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Registrar contato</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedUser ? (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-foreground">{selectedUser.name || 'Usuário sem nome'}</p>
                      <p className="text-xs text-muted-foreground">{selectedUser.email}</p>
                      {selectedUser.phone && (
                        <p className="text-xs text-muted-foreground">Telefone: {selectedUser.phone}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Status do contato</label>
                      <Select
                        value={formState.outreachStatus}
                        onValueChange={(value) => setFormState((prev) => ({ ...prev, outreachStatus: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent side="bottom" align="start">
                          {outreachStatusOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Canal</label>
                      <Select
                        value={formState.contactChannel}
                        onValueChange={(value) => setFormState((prev) => ({ ...prev, contactChannel: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent side="bottom" align="start">
                          {channelOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Contato em</label>
                      <Input
                        type="datetime-local"
                        value={formState.contactedAt}
                        onChange={(event) => setFormState((prev) => ({ ...prev, contactedAt: event.target.value }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Resposta em</label>
                      <Input
                        type="datetime-local"
                        value={formState.respondedAt}
                        onChange={(event) => setFormState((prev) => ({ ...prev, respondedAt: event.target.value }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Próximo contato</label>
                      <Input
                        type="datetime-local"
                        value={formState.nextFollowUpAt}
                        onChange={(event) => setFormState((prev) => ({ ...prev, nextFollowUpAt: event.target.value }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Motivo cancelamento</label>
                      <Input
                        value={formState.cancellationReason}
                        onChange={(event) => setFormState((prev) => ({ ...prev, cancellationReason: event.target.value }))}
                        placeholder="Ex: preço, pouco uso, suporte"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Feedback</label>
                      <Textarea
                        value={formState.feedback}
                        onChange={(event) => setFormState((prev) => ({ ...prev, feedback: event.target.value }))}
                        placeholder="Resumo do feedback recebido"
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Observações do contato</label>
                      <Textarea
                        value={formState.contactNotes}
                        onChange={(event) => setFormState((prev) => ({ ...prev, contactNotes: event.target.value }))}
                        placeholder="Notas internas do atendimento"
                        rows={3}
                      />
                    </div>

                    <Button type="submit" className="w-full">
                      Registrar contato
                    </Button>
                    {lastFollowup && (
                      <div className="pt-4 border-t space-y-2">
                        <p className="text-xs text-muted-foreground">Atualizar status do último contato</p>
                        <Select value={lastStatus} onValueChange={setLastStatus}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent side="bottom" align="start">
                            {outreachStatusOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full"
                          onClick={async () => {
                            try {
                              await updateFollowup(lastFollowup.id, { outreachStatus: lastStatus });
                              toast({
                                title: 'Status atualizado',
                                description: 'O status do contato foi atualizado.'
                              });
                            } catch (err: unknown) {
                              toast({
                                title: 'Erro ao atualizar status',
                                description: err instanceof Error ? err.message : 'Não foi possível atualizar o status.',
                                variant: 'destructive'
                              });
                            }
                          }}
                        >
                          Atualizar tag
                        </Button>
                      </div>
                    )}
                  </form>
                ) : (
                  <p className="text-sm text-muted-foreground">Selecione um usuário para registrar o contato.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="expired" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Assinaturas expiradas</CardTitle>
              </CardHeader>
              <CardContent>
                {expiredUsers.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum plano expirado encontrado.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Usuário</TableHead>
                          <TableHead>Plano</TableHead>
                          <TableHead>Status do plano</TableHead>
                          <TableHead>Expirou em</TableHead>
                          <TableHead>Status contato</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {expiredUsers.map((user) => {
                          const last = followupsByUser[user.id]?.[0];
                          return (
                            <TableRow
                              key={user.id}
                              onClick={() => setSelectedUserId(user.id)}
                              className={user.id === selectedUserId ? 'bg-muted/60' : 'cursor-pointer'}
                            >
                              <TableCell className="font-medium">
                                {user.name || 'Usuário sem nome'}
                                <div className="text-xs text-muted-foreground">{user.email}</div>
                                {user.phone && <div className="text-xs text-muted-foreground">{user.phone}</div>}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">{user.plan || 'free'}</Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="bg-red-100 text-red-700 border-red-200">
                                  Expirado
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {user.plan_expires_at
                                  ? new Date(user.plan_expires_at).toLocaleDateString('pt-BR')
                                  : '-'}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className={statusBadgeClass(last?.outreach_status)}>
                                  {last?.outreach_status
                                    ? outreachStatusOptions.find((option) => option.value === last.outreach_status)?.label || last.outreach_status
                                    : 'Sem contato'}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Histórico de contatos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedUser ? (
                  <>
                    <div>
                      <p className="text-sm font-medium text-foreground">{selectedUser.name || 'Usuário sem nome'}</p>
                      <p className="text-xs text-muted-foreground">{selectedUser.email}</p>
                      {selectedUser.phone && (
                        <p className="text-xs text-muted-foreground">Telefone: {selectedUser.phone}</p>
                      )}
                    </div>
                    {selectedFollowups.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Nenhum contato registrado ainda.</p>
                    ) : (
                      <div className="space-y-3">
                        {selectedFollowups.map((followup) => (
                          <div key={followup.id} className="rounded-lg border p-3 text-sm space-y-1">
                            <div className="flex items-center justify-between">
                              <Badge variant="outline" className={statusBadgeClass(followup.outreach_status)}>
                                {outreachStatusOptions.find((option) => option.value === followup.outreach_status)?.label || followup.outreach_status}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {followup.contacted_at
                                  ? new Date(followup.contacted_at).toLocaleString('pt-BR')
                                  : new Date(followup.created_at).toLocaleString('pt-BR')}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Canal: {followup.contact_channel || 'não informado'} • Admin: {followup.admin_name || 'sistema'}
                            </p>
                            {followup.cancellation_reason && (
                              <p><strong>Motivo:</strong> {followup.cancellation_reason}</p>
                            )}
                            {followup.feedback && (
                              <p><strong>Feedback:</strong> {followup.feedback}</p>
                            )}
                            {followup.contact_notes && (
                              <p><strong>Notas:</strong> {followup.contact_notes}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">Selecione um usuário para ver o histórico.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminSubscriptionControl;
