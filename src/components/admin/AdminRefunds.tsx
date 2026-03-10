/**
 * =================================================================
 * ADMIN REFUNDS - Gerenciamento de Reembolsos
 * =================================================================
 * 
 * Painel administrativo para gerenciar solicitações de reembolso
 * Conformidade CDC Art. 49 (7 dias)
 * 
 * @author Cavalaria Digital
 * @date 2025-11-27
 */

import React, { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, DollarSign, Check, X, Eye, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

// =================================================================
// INTERFACES
// =================================================================

interface Refund {
  id: string;
  user_id: string;
  payment_id: string;
  amount: number;
  reason: string;
  user_notes?: string;
  refund_type: string;
  status: string;
  requested_at: string;
  processed_by?: string;
  processed_at?: string;
  admin_notes?: string;
  user: {
    name: string;
    email: string;
  };
  payment: {
    asaas_payment_id: string;
    description: string;
    value: number;
  };
}

// =================================================================
// COMPONENTE PRINCIPAL
// =================================================================

export function AdminRefunds() {
  const { toast } = useToast();

  // Estados
  const [loading, setLoading] = useState(true);
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [selectedRefund, setSelectedRefund] = useState<Refund | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');

  // Filtros
  const [statusFilter, setStatusFilter] = useState<string>('requested');

  /**
   * Carrega reembolsos
   */
  const loadRefunds = useCallback(async () => {
    setLoading(true);

    try {
      let query = supabase
        .from('refunds')
        .select(`
          *,
          user:profiles!refunds_user_id_fkey(name, email),
          payment:asaas_payments!refunds_payment_id_fkey(asaas_payment_id, description, value)
        `)
        .order('requested_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      setRefunds((data ?? []) as Refund[]);
    } catch (error) {
      console.error('Erro ao carregar reembolsos:', error);
      toast({
        title: '❌ Erro',
        description: 'Não foi possível carregar os reembolsos',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [statusFilter, toast]);

  useEffect(() => {
    loadRefunds();
  }, [loadRefunds]);

  /**
   * Abre detalhes do reembolso
   */
  const openDetails = (refund: Refund) => {
    setSelectedRefund(refund);
    setAdminNotes(refund.admin_notes || '');
    setDetailsOpen(true);
  };

  /**
   * Aprova um reembolso
   */
  const approveRefund = async () => {
    if (!selectedRefund) return;

    setProcessing(true);

    try {
      const { data, error } = await supabase.functions.invoke<{
        success: boolean;
        message?: string;
      }>('process-refund', {
        body: {
          refundId: selectedRefund.id,
          action: 'approve',
          adminNotes,
        },
      });

      if (error || !data?.success) {
        throw new Error(data?.message || error?.message || 'Não foi possível aprovar o reembolso.');
      }

      toast({
        title: '✅ Reembolso Aprovado',
        description: 'O reembolso foi processado com sucesso',
        duration: 3000
      });

      setDetailsOpen(false);
      loadRefunds();
    } catch (error) {
      console.error('Erro ao aprovar reembolso:', error);
      toast({
        title: '❌ Erro',
        description: 'Não foi possível aprovar o reembolso',
        variant: 'destructive'
      });
    } finally {
      setProcessing(false);
    }
  };

  /**
   * Rejeita um reembolso
   */
  const rejectRefund = async () => {
    if (!selectedRefund) return;
    if (!adminNotes.trim()) {
      toast({
        title: '⚠️ Atenção',
        description: 'Por favor, informe o motivo da rejeição',
        variant: 'destructive'
      });
      return;
    }

    setProcessing(true);

    try {
      const { data, error } = await supabase.functions.invoke<{
        success: boolean;
        message?: string;
      }>('process-refund', {
        body: {
          refundId: selectedRefund.id,
          action: 'reject',
          adminNotes,
        },
      });

      if (error || !data?.success) {
        throw new Error(data?.message || error?.message || 'Não foi possível rejeitar o reembolso.');
      }

      toast({
        title: '✅ Reembolso Rejeitado',
        description: 'O usuário será notificado',
        duration: 3000
      });

      setDetailsOpen(false);
      loadRefunds();
    } catch (error) {
      console.error('Erro ao rejeitar reembolso:', error);
      toast({
        title: '❌ Erro',
        description: 'Não foi possível rejeitar o reembolso',
        variant: 'destructive'
      });
    } finally {
      setProcessing(false);
    }
  };

  /**
   * Badge de status
   */
  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      { variant: BadgeProps['variant']; label: string; icon: React.ComponentType<{ className?: string }> }
    > = {
      requested: { variant: 'secondary', label: 'Pendente', icon: AlertCircle },
      approved: { variant: 'default', label: 'Aprovado', icon: Check },
      processing: { variant: 'secondary', label: 'Processando', icon: Loader2 },
      completed: { variant: 'default', label: 'Concluído', icon: Check },
      rejected: { variant: 'destructive', label: 'Rejeitado', icon: X },
      failed: { variant: 'destructive', label: 'Falhou', icon: X }
    };

    const config = variants[status] || variants.requested;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  // =================================================================
  // RENDERIZAÇÃO
  // =================================================================

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-6 w-6" />
            Gerenciamento de Reembolsos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filtros */}
          <div className="flex gap-2 mb-6">
            {[
              { value: 'requested', label: 'Pendentes' },
              { value: 'approved', label: 'Aprovados' },
              { value: 'rejected', label: 'Rejeitados' },
              { value: 'all', label: 'Todos' }
            ].map((filter) => (
              <Button
                key={filter.value}
                variant={statusFilter === filter.value ? 'default' : 'outline'}
                onClick={() => setStatusFilter(filter.value)}
                size="sm"
              >
                {filter.label}
              </Button>
            ))}
          </div>

          {/* Tabela */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : refunds.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <DollarSign className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Nenhum reembolso encontrado</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Motivo</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {refunds.map((refund) => (
                    <TableRow key={refund.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{refund.user.name}</div>
                          <div className="text-sm text-gray-500">{refund.user.email}</div>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">
                        R$ {refund.amount.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate" title={refund.reason}>
                          {refund.reason}
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(refund.requested_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(refund.status)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDetails(refund)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Detalhes
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Detalhes */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Reembolso</DialogTitle>
          </DialogHeader>

          {selectedRefund && (
            <div className="space-y-6">
              {/* Informações do Usuário */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-500">Usuário</p>
                  <p className="font-semibold">{selectedRefund.user.name}</p>
                  <p className="text-sm text-gray-600">{selectedRefund.user.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Valor do Reembolso</p>
                  <p className="text-2xl font-bold text-primary">
                    R$ {selectedRefund.amount.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Data da Solicitação</p>
                  <p className="font-semibold">
                    {new Date(selectedRefund.requested_at).toLocaleString('pt-BR')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <div className="mt-1">
                    {getStatusBadge(selectedRefund.status)}
                  </div>
                </div>
              </div>

              {/* Detalhes do Pagamento */}
              <div>
                <h3 className="font-semibold mb-2">Pagamento Original</h3>
                <div className="p-3 border rounded-lg text-sm space-y-1">
                  <p><strong>Descrição:</strong> {selectedRefund.payment.description}</p>
                  <p><strong>Valor:</strong> R$ {selectedRefund.payment.value.toFixed(2)}</p>
                  <p className="text-xs text-gray-500">
                    <strong>ID Asaas:</strong> {selectedRefund.payment.asaas_payment_id}
                  </p>
                </div>
              </div>

              {/* Motivo do Usuário */}
              <div>
                <h3 className="font-semibold mb-2">Motivo do Reembolso</h3>
                <div className="p-3 border rounded-lg text-sm bg-blue-50">
                  <p className="whitespace-pre-wrap">{selectedRefund.reason}</p>
                  {selectedRefund.user_notes && (
                    <div className="mt-3 pt-3 border-t border-blue-200">
                      <p className="text-xs font-semibold text-blue-900 mb-1">Observações:</p>
                      <p className="whitespace-pre-wrap text-blue-900">{selectedRefund.user_notes}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Notas do Admin */}
              {selectedRefund.status === 'requested' ? (
                <div>
                  <h3 className="font-semibold mb-2">Notas Administrativas</h3>
                  <Textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Adicione observações sobre o processamento do reembolso..."
                    rows={4}
                  />
                </div>
              ) : selectedRefund.admin_notes && (
                <div>
                  <h3 className="font-semibold mb-2">Notas do Administrador</h3>
                  <div className="p-3 border rounded-lg text-sm bg-yellow-50">
                    <p className="whitespace-pre-wrap">{selectedRefund.admin_notes}</p>
                  </div>
                  {selectedRefund.processed_at && (
                    <p className="text-xs text-gray-500 mt-2">
                      Processado em {new Date(selectedRefund.processed_at).toLocaleString('pt-BR')}
                    </p>
                  )}
                </div>
              )}

              {/* Botões de Ação */}
              {selectedRefund.status === 'requested' && (
                <div className="flex gap-3 pt-4 border-t">
                  <Button
                    variant="destructive"
                    onClick={rejectRefund}
                    disabled={processing}
                    className="flex-1"
                  >
                    {processing ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <X className="mr-2 h-4 w-4" />
                    )}
                    Rejeitar
                  </Button>
                  <Button
                    onClick={approveRefund}
                    disabled={processing}
                    className="flex-1"
                  >
                    {processing ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="mr-2 h-4 w-4" />
                    )}
                    Aprovar Reembolso
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AdminRefunds;


