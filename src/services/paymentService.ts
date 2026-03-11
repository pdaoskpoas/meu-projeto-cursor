/**
 * =================================================================
 * PAYMENT SERVICE - Serviço Principal de Pagamentos
 * =================================================================
 * 
 * Serviço de alto nível que orquestra todas as operações de pagamento
 * Integra Asaas + Supabase + Lógica de Negócio
 * 
 * Funcionalidades:
 * - Compra de planos (mensal/anual)
 * - Compra de boosts avulsos
 * - Anúncios individuais
 * - Eventos individuais
 * - Cancelamento e reembolso
 * 
 * @author Cavalaria Digital
 * @date 2025-11-27
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { supabase } from '@/lib/supabase';
import asaasService from './asaasService';
import { asaasWebhookService } from './asaasWebhookService';

// =================================================================
// TIPOS E INTERFACES
// =================================================================

export interface PlanPurchaseParams {
  userId: string;
  planType: 'basic' | 'pro' | 'ultra' | 'vip';
  billingCycle: 'monthly' | 'annual';
  billingType: 'PIX' | 'CREDIT_CARD' | 'BOLETO';
  installments?: number; // Para planos anuais com cartão
}

export interface BoostPurchaseParams {
  userId: string;
  quantity: number;
  billingType: 'PIX' | 'CREDIT_CARD';
}

export interface IndividualAdParams {
  userId: string;
  animalId: string;
  billingType: 'PIX' | 'CREDIT_CARD';
}

export interface IndividualEventParams {
  userId: string;
  eventId: string;
  billingType: 'PIX' | 'CREDIT_CARD';
}

export interface PaymentResponse {
  success: boolean;
  paymentId?: string;
  invoiceUrl?: string;
  pixQrCode?: string;
  pixCopyPaste?: string;
  bankSlipUrl?: string;
  message: string;
  error?: any;
}

// =================================================================
// CONSTANTES DE PREÇOS
// =================================================================

const PLAN_PRICES = {
  basic: {
    monthly: 97.00,
    annual: 776.00
  },
  pro: {
    monthly: 147.00,
    annual: 882.00
  },
  ultra: {
    monthly: 247.00,
    annual: 1482.00
  },
  vip: {
    monthly: 147.00, // VIP tem mesmo preço do Pro
    annual: 882.00
  }
};

const BOOST_PRICE = 47.00; // Preço por boost individual
const INDIVIDUAL_AD_PRICE = 47.00; // Anúncio individual por 30 dias
const INDIVIDUAL_EVENT_PRICE = 49.99; // Evento individual por 30 dias

// =================================================================
// CLASSE DO SERVIÇO DE PAGAMENTO
// =================================================================

class PaymentService {

  // =================================================================
  // COMPRA DE PLANOS
  // =================================================================

  /**
   * Processa a compra de um plano
   */
  async purchasePlan(params: PlanPurchaseParams): Promise<PaymentResponse> {
    try {
      console.log('💳 Iniciando compra de plano:', params);

      // 1. Validar plano
      if (!PLAN_PRICES[params.planType]) {
        return {
          success: false,
          message: 'Plano inválido'
        };
      }

      // 2. Calcular valor
      const value = PLAN_PRICES[params.planType][params.billingCycle];

      // 3. Verificar se usuário já tem assinatura ativa
      const { data: existingSubscription } = await supabase
        .from('asaas_subscriptions')
        .select('*')
        .eq('user_id', params.userId)
        .eq('status', 'active')
        .single();

      if (existingSubscription) {
        return {
          success: false,
          message: 'Você já possui uma assinatura ativa. Cancele a atual antes de assinar um novo plano.'
        };
      }

      // 4. Criar assinatura ou pagamento único
      if (params.billingCycle === 'monthly') {
        // Assinatura recorrente mensal
        const response = await asaasService.createSubscription({
          userId: params.userId,
          planType: params.planType,
          value: value,
          billingType: params.billingType,
          cycle: 'MONTHLY',
          description: `Assinatura Mensal - Plano ${params.planType.toUpperCase()}`
        });

        return {
          success: true,
          paymentId: response.id,
          invoiceUrl: response.invoiceUrl,
          pixQrCode: response.encodedImage,
          pixCopyPaste: response.payload,
          bankSlipUrl: response.bankSlipUrl,
          message: 'Assinatura mensal criada com sucesso!'
        };
      } else {
        // Pagamento único anual (pode ser parcelado)
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 3); // Vencimento em 3 dias

        const response = await asaasService.createPayment({
          userId: params.userId,
          value: value,
          dueDate: dueDate.toISOString().split('T')[0],
          description: `Plano Anual - ${params.planType.toUpperCase()} (12 meses)`,
          billingType: params.billingType,
          externalReference: `plan-annual-${params.planType}-${params.userId}`,
          installmentCount: params.installments || 1
        });

        // Criar assinatura no banco (sem ID do Asaas, pois é pagamento único)
        const expiresAt = new Date();
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);

        const { data: customerData } = await supabase
          .from('asaas_customers')
          .select('id')
          .eq('user_id', params.userId)
          .single();

        if (customerData) {
          await supabase
            .from('asaas_subscriptions')
            .insert({
              user_id: params.userId,
              asaas_customer_id: customerData.id,
              plan_type: params.planType,
              billing_type: 'annual',
              value: value,
              status: 'pending',
              expires_at: expiresAt.toISOString(),
              auto_renew: false
            });
        }

        return {
          success: true,
          paymentId: response.id,
          invoiceUrl: response.invoiceUrl,
          pixQrCode: response.encodedImage,
          pixCopyPaste: response.payload,
          bankSlipUrl: response.bankSlipUrl,
          message: 'Pagamento anual criado com sucesso!'
        };
      }
    } catch (error) {
      console.error('❌ Erro ao processar compra de plano:', error);
      return {
        success: false,
        message: 'Erro ao processar pagamento. Tente novamente.',
        error
      };
    }
  }

  // =================================================================
  // COMPRA DE BOOSTS
  // =================================================================

  /**
   * Processa a compra de boosts avulsos
   */
  async purchaseBoosts(params: BoostPurchaseParams): Promise<PaymentResponse> {
    try {
      console.log('💎 Iniciando compra de boosts:', params);

      // 1. Validar quantidade
      if (params.quantity < 1 || params.quantity > 100) {
        return {
          success: false,
          message: 'Quantidade inválida. Escolha entre 1 e 100 boosts.'
        };
      }

      // 2. Calcular valor
      const value = BOOST_PRICE * params.quantity;

      // 3. Criar pagamento
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 3); // Vencimento em 3 dias

      const response = await asaasService.createPayment({
        userId: params.userId,
        value: value,
        dueDate: dueDate.toISOString().split('T')[0],
        description: `Compra de ${params.quantity} crédito(s)`,
        billingType: params.billingType,
        externalReference: `boost-${params.quantity}-${params.userId}`
      });

      // 4. Atualizar metadata do pagamento para incluir quantidade de boosts
      await supabase
        .from('asaas_payments')
        .update({
          metadata: { boost_quantity: params.quantity }
        })
        .eq('asaas_payment_id', response.id);

      return {
        success: true,
        paymentId: response.id,
        invoiceUrl: response.invoiceUrl,
        pixQrCode: response.encodedImage,
        pixCopyPaste: response.payload,
        bankSlipUrl: response.bankSlipUrl,
        message: `Pagamento criado para ${params.quantity} crédito(s)!`
      };
    } catch (error) {
      console.error('❌ Erro ao processar compra de boosts:', error);
      return {
        success: false,
        message: 'Erro ao processar pagamento. Tente novamente.',
        error
      };
    }
  }

  // =================================================================
  // ANÚNCIO INDIVIDUAL
  // =================================================================

  /**
   * Processa a compra de um anúncio individual
   */
  async purchaseIndividualAd(params: IndividualAdParams): Promise<PaymentResponse> {
    try {
      console.log('📢 Iniciando compra de anúncio individual:', params);

      // 1. Verificar se o animal existe e pertence ao usuário
      const { data: animal, error: animalError } = await supabase
        .from('animals')
        .select('id, name, owner_id')
        .eq('id', params.animalId)
        .eq('owner_id', params.userId)
        .single();

      if (animalError || !animal) {
        return {
          success: false,
          message: 'Animal não encontrado ou você não tem permissão.'
        };
      }

      // 2. Criar pagamento
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 3);

      const response = await asaasService.createPayment({
        userId: params.userId,
        value: INDIVIDUAL_AD_PRICE,
        dueDate: dueDate.toISOString().split('T')[0],
        description: `Anúncio Individual - ${animal.name}`,
        billingType: params.billingType,
        externalReference: `ad-${params.animalId}-${params.userId}`
      });

      // 3. Vincular pagamento ao animal
      await supabase
        .from('asaas_payments')
        .update({
          related_content_type: 'animal',
          related_content_id: params.animalId
        })
        .eq('asaas_payment_id', response.id);

      return {
        success: true,
        paymentId: response.id,
        invoiceUrl: response.invoiceUrl,
        pixQrCode: response.encodedImage,
        pixCopyPaste: response.payload,
        bankSlipUrl: response.bankSlipUrl,
        message: 'Pagamento criado para anúncio individual!'
      };
    } catch (error) {
      console.error('❌ Erro ao processar anúncio individual:', error);
      return {
        success: false,
        message: 'Erro ao processar pagamento. Tente novamente.',
        error
      };
    }
  }

  // =================================================================
  // EVENTO INDIVIDUAL
  // =================================================================

  /**
   * Processa a compra de um evento individual
   */
  async purchaseIndividualEvent(params: IndividualEventParams): Promise<PaymentResponse> {
    try {
      console.log('🎪 Iniciando compra de evento individual:', params);

      // 1. Verificar se o evento existe e pertence ao usuário
      const { data: event, error: eventError } = await supabase
        .from('events')
        .select('id, title, organizer_id')
        .eq('id', params.eventId)
        .eq('organizer_id', params.userId)
        .single();

      if (eventError || !event) {
        return {
          success: false,
          message: 'Evento não encontrado ou você não tem permissão.'
        };
      }

      // 2. Criar pagamento
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 3);

      const response = await asaasService.createPayment({
        userId: params.userId,
        value: INDIVIDUAL_EVENT_PRICE,
        dueDate: dueDate.toISOString().split('T')[0],
        description: `Evento Individual - ${event.title}`,
        billingType: params.billingType,
        externalReference: `event-${params.eventId}-${params.userId}`
      });

      // 3. Vincular pagamento ao evento
      await supabase
        .from('asaas_payments')
        .update({
          related_content_type: 'event',
          related_content_id: params.eventId
        })
        .eq('asaas_payment_id', response.id);

      return {
        success: true,
        paymentId: response.id,
        invoiceUrl: response.invoiceUrl,
        pixQrCode: response.encodedImage,
        pixCopyPaste: response.payload,
        bankSlipUrl: response.bankSlipUrl,
        message: 'Pagamento criado para evento individual!'
      };
    } catch (error) {
      console.error('❌ Erro ao processar evento individual:', error);
      return {
        success: false,
        message: 'Erro ao processar pagamento. Tente novamente.',
        error
      };
    }
  }

  // =================================================================
  // CANCELAMENTO E REEMBOLSO
  // =================================================================

  /**
   * Cancela uma assinatura
   */
  async cancelSubscription(subscriptionId: string, reason: string): Promise<{ success: boolean; message: string }> {
    try {
      console.log('🚫 Cancelando assinatura:', subscriptionId);

      // 1. Buscar assinatura
      const { data: subscription, error: fetchError } = await supabase
        .from('asaas_subscriptions')
        .select('*')
        .eq('id', subscriptionId)
        .single();

      if (fetchError || !subscription) {
        return {
          success: false,
          message: 'Assinatura não encontrada'
        };
      }

      // 2. Cancelar no Asaas (se tiver ID)
      if (subscription.asaas_subscription_id) {
        await asaasService.cancelSubscription(subscription.asaas_subscription_id);
      }

      // 3. Atualizar no banco
      await supabase
        .from('asaas_subscriptions')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancellation_reason: reason,
          auto_renew: false
        })
        .eq('id', subscriptionId);

      console.log('✅ Assinatura cancelada com sucesso');

      return {
        success: true,
        message: 'Assinatura cancelada com sucesso. Você poderá usar os benefícios até o fim do período pago.'
      };
    } catch (error) {
      console.error('❌ Erro ao cancelar assinatura:', error);
      return {
        success: false,
        message: 'Erro ao cancelar assinatura. Tente novamente.'
      };
    }
  }

  /**
   * Solicita um reembolso (CDC - 7 dias)
   */
  async requestRefund(params: {
    userId: string;
    paymentId: string;
    reason: string;
    userNotes?: string;
  }): Promise<{ success: boolean; message: string; canRefund?: boolean }> {
    try {
      console.log('💰 Solicitando reembolso:', params);

      // 1. Buscar pagamento
      const { data: payment, error: paymentError } = await supabase
        .from('asaas_payments')
        .select('*')
        .eq('id', params.paymentId)
        .eq('user_id', params.userId)
        .single();

      if (paymentError || !payment) {
        return {
          success: false,
          message: 'Pagamento não encontrado'
        };
      }

      // 2. Verificar se o pagamento está dentro do prazo de 7 dias
      const paymentDate = new Date(payment.confirmed_at || payment.created_at);
      const now = new Date();
      const daysSincePayment = Math.floor((now.getTime() - paymentDate.getTime()) / (1000 * 60 * 60 * 24));

      if (daysSincePayment > 7) {
        return {
          success: false,
          message: 'O prazo para reembolso (7 dias) já expirou.',
          canRefund: false
        };
      }

      // 3. Verificar se já foi solicitado reembolso
      const { data: existingRefund } = await supabase
        .from('refunds')
        .select('*')
        .eq('payment_id', params.paymentId)
        .single();

      if (existingRefund) {
        return {
          success: false,
          message: 'Já existe uma solicitação de reembolso para este pagamento.'
        };
      }

      // 4. Criar solicitação de reembolso
      const { error: refundError } = await supabase
        .from('refunds')
        .insert({
          payment_id: params.paymentId,
          user_id: params.userId,
          amount: payment.value,
          reason: params.reason,
          user_notes: params.userNotes,
          refund_type: 'full',
          status: 'requested'
        });

      if (refundError) {
        throw refundError;
      }

      console.log('✅ Reembolso solicitado com sucesso');

      return {
        success: true,
        message: 'Sua solicitação de reembolso foi enviada e será analisada em até 48 horas.',
        canRefund: true
      };
    } catch (error) {
      console.error('❌ Erro ao solicitar reembolso:', error);
      return {
        success: false,
        message: 'Erro ao solicitar reembolso. Tente novamente.'
      };
    }
  }

  // =================================================================
  // CONSULTAS
  // =================================================================

  /**
   * Busca informações de pagamento
   */
  async getPaymentInfo(paymentId: string): Promise<any> {
    const { data, error } = await supabase
      .from('asaas_payments')
      .select('*')
      .eq('id', paymentId)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Lista pagamentos do usuário
   */
  async getUserPayments(userId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('asaas_payments')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Busca assinatura ativa do usuário
   */
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

// Exportar instância singleton
export const paymentService = new PaymentService();
export default paymentService;

