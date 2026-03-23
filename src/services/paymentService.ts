/**
 * =================================================================
 * PAYMENT SERVICE - Serviço Principal de Pagamentos
 * =================================================================
 *
 * Modelo 100% baseado em Payment Links hospedados no Asaas.
 * Nenhum dado pessoal trafega pelo frontend ou backend.
 *
 * - Compra de planos/boosts → Payment Link (Asaas hospedado)
 * - Cancelamento → Edge Function cancel-subscription
 * - Reembolso → apenas DB (solicitação registrada para análise)
 * - Consultas → Supabase (DB-only)
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { supabase } from '@/lib/supabase';
import {
  createPaymentLink,
  cancelSubscription as invokeCancelSubscription,
  type CreatePaymentLinkPayload,
  type CreatePaymentLinkResponse,
  type CancelSubscriptionResponse,
} from './checkoutService';

// =================================================================
// CLASSE DO SERVIÇO DE PAGAMENTO
// =================================================================

class PaymentService {

  // =================================================================
  // GERAR PAYMENT LINK (checkout 100% Asaas)
  // =================================================================

  async generatePaymentLink(payload: CreatePaymentLinkPayload): Promise<CreatePaymentLinkResponse> {
    return createPaymentLink(payload);
  }

  // =================================================================
  // CANCELAMENTO (via Edge Function)
  // =================================================================

  async cancelSubscription(subscriptionId: string, reason: string): Promise<CancelSubscriptionResponse> {
    return invokeCancelSubscription(subscriptionId, reason);
  }

  // =================================================================
  // REEMBOLSO (DB-only - solicitação para análise)
  // =================================================================

  async requestRefund(params: {
    userId: string;
    paymentId: string;
    reason: string;
    userNotes?: string;
  }): Promise<{ success: boolean; message: string; canRefund?: boolean }> {
    try {
      const { data: payment, error: paymentError } = await supabase
        .from('asaas_payments')
        .select('*')
        .eq('id', params.paymentId)
        .eq('user_id', params.userId)
        .single();

      if (paymentError || !payment) {
        return { success: false, message: 'Pagamento não encontrado' };
      }

      const paymentDate = new Date(payment.confirmed_at || payment.created_at);
      const now = new Date();
      const daysSincePayment = Math.floor((now.getTime() - paymentDate.getTime()) / (1000 * 60 * 60 * 24));

      if (daysSincePayment > 7) {
        return {
          success: false,
          message: 'O prazo para reembolso (7 dias) já expirou.',
          canRefund: false,
        };
      }

      const { data: existingRefund } = await supabase
        .from('refunds')
        .select('*')
        .eq('payment_id', params.paymentId)
        .single();

      if (existingRefund) {
        return {
          success: false,
          message: 'Já existe uma solicitação de reembolso para este pagamento.',
        };
      }

      const { error: refundError } = await supabase
        .from('refunds')
        .insert({
          payment_id: params.paymentId,
          user_id: params.userId,
          amount: payment.value,
          reason: params.reason,
          user_notes: params.userNotes,
          refund_type: 'full',
          status: 'requested',
        });

      if (refundError) {
        throw refundError;
      }

      return {
        success: true,
        message: 'Sua solicitação de reembolso foi enviada e será analisada em até 48 horas.',
        canRefund: true,
      };
    } catch (error) {
      console.error('Erro ao solicitar reembolso:', error);
      return {
        success: false,
        message: 'Erro ao solicitar reembolso. Tente novamente.',
      };
    }
  }

  // =================================================================
  // CONSULTAS (DB-only)
  // =================================================================

  async getPaymentInfo(paymentId: string): Promise<any> {
    const { data, error } = await supabase
      .from('asaas_payments')
      .select('*')
      .eq('id', paymentId)
      .single();

    if (error) throw error;
    return data;
  }

  async getUserPayments(userId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('asaas_payments')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getUserActiveSubscription(userId: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('asaas_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (error) return null;
    return data;
  }
}

export const paymentService = new PaymentService();
export default paymentService;
