/**
 * =================================================================
 * MODAL DE CANCELAMENTO DE ASSINATURA
 * =================================================================
 * 
 * Modal para cancelar assinatura com opção de reembolso (7 dias)
 * Conformidade CDC Art. 49
 * 
 * @author Cavalaria Digital
 * @date 2025-11-27
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertTriangle, DollarSign, Calendar, Info } from 'lucide-react';
import { cancelSubscription } from '@/services/checkoutService';
import paymentService from '@/services/paymentService';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

// =================================================================
// INTERFACES
// =================================================================

interface CancelSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  subscriptionId: string;
  onSuccess?: () => void;
}

interface SubscriptionData {
  id: string;
  can_refund: boolean | null;
  refund_deadline: string | null;
  expires_at: string | null;
}

// =================================================================
// COMPONENTE PRINCIPAL
// =================================================================

export function CancelSubscriptionModal({
  isOpen,
  onClose,
  userId,
  subscriptionId,
  onSuccess
}: CancelSubscriptionModalProps) {
  const { toast } = useToast();

  // Estados
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [canRefund, setCanRefund] = useState(false);
  const [wantsRefund, setWantsRefund] = useState(false);
  const [reason, setReason] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [userNotes, setUserNotes] = useState('');

  /**
   * Carrega dados da assinatura
   */
  const loadSubscriptionData = useCallback(async () => {
    setLoadingData(true);

    try {
      const { data, error } = await supabase
        .from('asaas_subscriptions')
        .select('*')
        .eq('id', subscriptionId)
        .single();

      if (error) throw error;

      setSubscription(data);

      // Verificar se pode pedir reembolso (7 dias)
      if (data.can_refund && data.refund_deadline) {
        const deadline = new Date(data.refund_deadline);
        const now = new Date();
        setCanRefund(now < deadline);
      } else {
        setCanRefund(false);
      }
    } catch (error) {
      console.error('Erro ao carregar assinatura:', error);
      toast({
        title: '❌ Erro',
        description: 'Não foi possível carregar dados da assinatura',
        variant: 'destructive'
      });
    } finally {
      setLoadingData(false);
    }
  }, [subscriptionId, toast]);

  useEffect(() => {
    if (isOpen && subscriptionId) {
      loadSubscriptionData();
    }
  }, [isOpen, subscriptionId, loadSubscriptionData]);

  /**
   * Calcula dias restantes para reembolso
   */
  const getDaysUntilRefundDeadline = () => {
    if (!subscription?.refund_deadline) return 0;
    
    const deadline = new Date(subscription.refund_deadline);
    const now = new Date();
    const diff = deadline.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  /**
   * Processa o cancelamento
   */
  const handleCancel = async () => {
    if (!reason.trim()) {
      toast({
        title: '⚠️ Atenção',
        description: 'Por favor, informe o motivo do cancelamento',
        variant: 'destructive'
      });
      return;
    }

    if (wantsRefund && !refundReason.trim()) {
      toast({
        title: '⚠️ Atenção',
        description: 'Por favor, informe o motivo do reembolso',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);

    try {
      // 1. Cancelar assinatura via Edge Function
      const cancelResponse = await cancelSubscription(
        subscriptionId,
        reason
      );

      if (!cancelResponse.success) {
        throw new Error(cancelResponse.message);
      }

      // 2. Se solicitou reembolso, criar solicitação
      if (wantsRefund && canRefund) {
        // Buscar último pagamento confirmado da assinatura
        const { data: payment } = await supabase
          .from('asaas_payments')
          .select('id')
          .eq('subscription_id', subscriptionId)
          .eq('status', 'confirmed')
          .order('confirmed_at', { ascending: false })
          .limit(1)
          .single();

        if (payment) {
          const refundResponse = await paymentService.requestRefund({
            userId,
            paymentId: payment.id,
            reason: refundReason,
            userNotes: userNotes
          });

          if (!refundResponse.success) {
            console.error('Erro ao solicitar reembolso:', refundResponse.message);
          }
        }
      }

      toast({
        title: '✅ Assinatura Cancelada',
        description: wantsRefund 
          ? 'Sua solicitação de reembolso foi enviada e será analisada em até 48 horas.'
          : 'Você poderá usar os benefícios até o fim do período pago.',
        duration: 5000
      });

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Erro ao cancelar assinatura:', error);
      toast({
        title: '❌ Erro',
        description: 'Não foi possível cancelar a assinatura. Tente novamente.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // =================================================================
  // RENDERIZAÇÃO
  // =================================================================

  if (loadingData) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const daysLeft = getDaysUntilRefundDeadline();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl text-red-600 flex items-center gap-2">
            <AlertTriangle className="h-6 w-6" />
            Cancelar Assinatura
          </DialogTitle>
          <DialogDescription>
            Você está prestes a cancelar sua assinatura. Leia atentamente antes de confirmar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações da Assinatura */}
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="font-semibold mb-3">Detalhes da Assinatura</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-500">Plano:</span>
                <div className="font-semibold capitalize">{subscription?.plan_type}</div>
              </div>
              <div>
                <span className="text-gray-500">Tipo:</span>
                <div className="font-semibold capitalize">{subscription?.billing_type === 'monthly' ? 'Mensal' : 'Anual'}</div>
              </div>
              <div>
                <span className="text-gray-500">Valor:</span>
                <div className="font-semibold">R$ {subscription?.value.toFixed(2)}</div>
              </div>
              <div>
                <span className="text-gray-500">Status:</span>
                <div className="font-semibold capitalize">{subscription?.status}</div>
              </div>
            </div>
          </div>

          {/* Alerta de Reembolso */}
          {canRefund ? (
            <Alert className="border-green-200 bg-green-50">
              <DollarSign className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-900">
                <strong>Você tem direito a reembolso!</strong>
                <br />
                Você está dentro do prazo de 7 dias (CDC Art. 49). 
                Restam <strong>{daysLeft} dia(s)</strong> para solicitar reembolso integral.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="border-yellow-200 bg-yellow-50">
              <Calendar className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-900">
                O prazo de 7 dias para reembolso já expirou.
                <br />
                Você continuará com acesso aos benefícios até o fim do período pago.
              </AlertDescription>
            </Alert>
          )}

          {/* Motivo do Cancelamento */}
          <div>
            <Label className="text-base font-semibold mb-2 block">
              1. Por que você está cancelando? <span className="text-red-500">*</span>
            </Label>
            <RadioGroup value={reason} onValueChange={setReason}>
              <div className="space-y-2">
                {[
                  'Muito caro',
                  'Não uso mais o serviço',
                  'Encontrei uma alternativa melhor',
                  'Não atende minhas necessidades',
                  'Problemas técnicos',
                  'Outro motivo'
                ].map((option) => (
                  <Label
                    key={option}
                    htmlFor={option}
                    className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                  >
                    <RadioGroupItem value={option} id={option} />
                    {option}
                  </Label>
                ))}
              </div>
            </RadioGroup>
          </div>

          {/* Solicitar Reembolso */}
          {canRefund && (
            <div>
              <Label className="flex items-center gap-2 text-base font-semibold mb-3">
                <input
                  type="checkbox"
                  checked={wantsRefund}
                  onChange={(e) => setWantsRefund(e.target.checked)}
                  className="w-5 h-5"
                />
                2. Solicitar Reembolso Integral
              </Label>

              {wantsRefund && (
                <div className="space-y-4 ml-7">
                  <div>
                    <Label htmlFor="refundReason">
                      Motivo do Reembolso <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="refundReason"
                      value={refundReason}
                      onChange={(e) => setRefundReason(e.target.value)}
                      placeholder="Explique brevemente o motivo do reembolso..."
                      rows={3}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="userNotes">Observações Adicionais (opcional)</Label>
                    <Textarea
                      id="userNotes"
                      value={userNotes}
                      onChange={(e) => setUserNotes(e.target.value)}
                      placeholder="Alguma informação adicional que queira compartilhar..."
                      rows={2}
                      className="mt-2"
                    />
                  </div>

                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      Seu reembolso será analisado em até <strong>48 horas</strong>. 
                      Se aprovado, o valor será estornado em 5-7 dias úteis.
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </div>
          )}

          {/* O que acontece após o cancelamento */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>O que acontece após o cancelamento?</strong>
              <ul className="mt-2 space-y-1 text-sm list-disc list-inside">
                {wantsRefund && canRefund ? (
                  <>
                    <li>Seu acesso será encerrado imediatamente se o reembolso for aprovado</li>
                    <li>Todos os anúncios serão pausados</li>
                    <li>Você voltará para o plano Free</li>
                  </>
                ) : (
                  <>
                    <li>Você continuará com acesso aos benefícios até {subscription?.expires_at ? new Date(subscription.expires_at).toLocaleDateString('pt-BR') : 'o fim do período'}</li>
                    <li>Após essa data, você voltará automaticamente para o plano Free</li>
                    <li>Seus anúncios serão pausados automaticamente</li>
                    <li>Você não será cobrado novamente</li>
                  </>
                )}
              </ul>
            </AlertDescription>
          </Alert>

          {/* Botões */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="flex-1"
            >
              Voltar
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={loading || !reason}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                <>Confirmar Cancelamento</>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default CancelSubscriptionModal;


