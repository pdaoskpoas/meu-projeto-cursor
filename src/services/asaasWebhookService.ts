/**
 * =================================================================
 * ASAAS WEBHOOK SERVICE - Processamento de Webhooks
 * =================================================================
 * 
 * Serviço responsável por processar notificações do Asaas via webhooks
 * Garante sincronização automática de status de pagamentos e assinaturas
 * 
 * Eventos suportados:
 * - PAYMENT_CREATED
 * - PAYMENT_UPDATED
 * - PAYMENT_CONFIRMED
 * - PAYMENT_RECEIVED
 * - PAYMENT_OVERDUE
 * - PAYMENT_REFUNDED
 * - PAYMENT_DELETED
 * 
 * @author Cavalaria Digital
 * @date 2025-11-27
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { supabase } from '@/lib/supabase';
import { AsaasWebhookEvent } from './asaasService';

// =================================================================
// TIPOS E INTERFACES
// =================================================================

interface WebhookProcessResult {
  success: boolean;
  message: string;
  error?: any;
}

// =================================================================
// CLASSE DO SERVIÇO DE WEBHOOKS
// =================================================================

class AsaasWebhookService {
  
  /**
   * Processa um webhook recebido do Asaas
   */
  async processWebhook(
    event: AsaasWebhookEvent,
    signature?: string,
    ipAddress?: string
  ): Promise<WebhookProcessResult> {
    try {
      // 1. Registrar webhook no log
      const webhookLogId = await this.logWebhook(event, signature, ipAddress);

      // 2. Processar baseado no tipo de evento
      let result: WebhookProcessResult;

      if (event.payment) {
        result = await this.processPaymentWebhook(event);
      } else if (event.subscription) {
        result = await this.processSubscriptionWebhook(event);
      } else {
        result = {
          success: false,
          message: 'Tipo de webhook não suportado'
        };
      }

      // 3. Atualizar log de processamento
      await this.updateWebhookLog(webhookLogId, result.success, result.error);

      return result;
    } catch (error) {
      console.error('❌ Erro ao processar webhook:', error);
      return {
        success: false,
        message: 'Erro ao processar webhook',
        error
      };
    }
  }

  /**
   * Processa webhooks relacionados a pagamentos
   */
  private async processPaymentWebhook(event: AsaasWebhookEvent): Promise<WebhookProcessResult> {
    const payment = event.payment!;
    const eventType = event.event;

    try {
      console.log(`📥 Processando webhook de pagamento: ${eventType} - ${payment.id}`);

      // 1. Buscar pagamento no banco
      const { data: existingPayment, error: fetchError } = await supabase
        .from('asaas_payments')
        .select('*')
        .eq('asaas_payment_id', payment.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      // 2. Processar baseado no tipo de evento
      switch (eventType) {
        case 'PAYMENT_CREATED':
          return await this.handlePaymentCreated(payment);
        
        case 'PAYMENT_UPDATED':
          return await this.handlePaymentUpdated(payment, existingPayment);
        
        case 'PAYMENT_CONFIRMED':
        case 'PAYMENT_RECEIVED':
          return await this.handlePaymentConfirmed(payment, existingPayment);
        
        case 'PAYMENT_OVERDUE':
          return await this.handlePaymentOverdue(payment, existingPayment);
        
        case 'PAYMENT_REFUNDED':
          return await this.handlePaymentRefunded(payment, existingPayment);
        
        case 'PAYMENT_DELETED':
          return await this.handlePaymentDeleted(payment, existingPayment);
        
        default:
          console.log(`⚠️ Evento de pagamento não tratado: ${eventType}`);
          return {
            success: true,
            message: `Evento ${eventType} registrado mas não processado`
          };
      }
    } catch (error) {
      console.error('❌ Erro ao processar webhook de pagamento:', error);
      return {
        success: false,
        message: 'Erro ao processar webhook de pagamento',
        error
      };
    }
  }

  /**
   * Processa webhooks relacionados a assinaturas
   */
  private async processSubscriptionWebhook(event: AsaasWebhookEvent): Promise<WebhookProcessResult> {
    const subscription = event.subscription!;
    const eventType = event.event;

    try {
      console.log(`📥 Processando webhook de assinatura: ${eventType} - ${subscription.id}`);

      // Buscar assinatura no banco
      const { data: existingSubscription } = await supabase
        .from('asaas_subscriptions')
        .select('*')
        .eq('asaas_subscription_id', subscription.id)
        .single();

      if (!existingSubscription) {
        console.log('⚠️ Assinatura não encontrada no banco');
        return {
          success: false,
          message: 'Assinatura não encontrada'
        };
      }

      // Atualizar status da assinatura
      const { error: updateError } = await supabase
        .from('asaas_subscriptions')
        .update({
          status: subscription.status.toLowerCase(),
          updated_at: new Date().toISOString()
        })
        .eq('asaas_subscription_id', subscription.id);

      if (updateError) {
        throw updateError;
      }

      return {
        success: true,
        message: 'Webhook de assinatura processado com sucesso'
      };
    } catch (error) {
      console.error('❌ Erro ao processar webhook de assinatura:', error);
      return {
        success: false,
        message: 'Erro ao processar webhook de assinatura',
        error
      };
    }
  }

  // =================================================================
  // HANDLERS ESPECÍFICOS DE EVENTOS DE PAGAMENTO
  // =================================================================

  private async handlePaymentCreated(payment: any): Promise<WebhookProcessResult> {
    // Pagamento criado - geralmente já está no banco, apenas atualiza
    const { error } = await supabase
      .from('asaas_payments')
      .update({
        status: payment.status.toLowerCase(),
        updated_at: new Date().toISOString()
      })
      .eq('asaas_payment_id', payment.id);

    if (error) throw error;

    return {
      success: true,
      message: 'Pagamento criado processado'
    };
  }

  private async handlePaymentUpdated(payment: any, existingPayment: any): Promise<WebhookProcessResult> {
    if (!existingPayment) {
      return {
        success: false,
        message: 'Pagamento não encontrado no banco'
      };
    }

    const { error } = await supabase
      .from('asaas_payments')
      .update({
        status: payment.status.toLowerCase(),
        billing_type: payment.billingType,
        net_value: payment.netValue,
        updated_at: new Date().toISOString()
      })
      .eq('asaas_payment_id', payment.id);

    if (error) throw error;

    return {
      success: true,
      message: 'Pagamento atualizado'
    };
  }

  private async handlePaymentConfirmed(payment: any, existingPayment: any): Promise<WebhookProcessResult> {
    if (!existingPayment) {
      return {
        success: false,
        message: 'Pagamento não encontrado no banco'
      };
    }

    try {
      // 1. Atualizar status do pagamento
      const { error: paymentError } = await supabase
        .from('asaas_payments')
        .update({
          status: 'confirmed',
          confirmed_at: new Date().toISOString(),
          payment_date: payment.paymentDate || new Date().toISOString(),
          net_value: payment.netValue,
          updated_at: new Date().toISOString()
        })
        .eq('asaas_payment_id', payment.id);

      if (paymentError) throw paymentError;

      // 2. Se for pagamento de assinatura, ativar assinatura
      if (existingPayment.subscription_id) {
        await this.activateSubscription(existingPayment.subscription_id);
      }

      // 3. Se for pagamento de anúncio individual, ativar anúncio
      if (existingPayment.payment_type === 'individual_ad' && existingPayment.related_content_id) {
        await this.activateIndividualAd(
          existingPayment.related_content_id, 
          existingPayment.related_content_type
        );
      }

      // 4. Se for pagamento de evento, ativar evento
      if (existingPayment.payment_type === 'individual_event' && existingPayment.related_content_id) {
        await this.activateIndividualEvent(existingPayment.related_content_id);
      }

      // 5. Se for compra de boost, adicionar créditos
      if (existingPayment.payment_type === 'boost_purchase') {
        await this.addBoostCredits(existingPayment.user_id, existingPayment.metadata);
      }

      // 6. Criar transação no histórico
      await this.createTransaction(existingPayment, payment);

      console.log('✅ Pagamento confirmado e processado:', payment.id);

      return {
        success: true,
        message: 'Pagamento confirmado e benefícios aplicados'
      };
    } catch (error) {
      console.error('❌ Erro ao confirmar pagamento:', error);
      throw error;
    }
  }

  private async handlePaymentOverdue(payment: any, existingPayment: any): Promise<WebhookProcessResult> {
    if (!existingPayment) {
      return {
        success: false,
        message: 'Pagamento não encontrado no banco'
      };
    }

    // Atualizar status para vencido
    const { error } = await supabase
      .from('asaas_payments')
      .update({
        status: 'overdue',
        updated_at: new Date().toISOString()
      })
      .eq('asaas_payment_id', payment.id);

    if (error) throw error;

    // Se for assinatura, suspender
    if (existingPayment.subscription_id) {
      await this.suspendSubscription(existingPayment.subscription_id);
    }

    return {
      success: true,
      message: 'Pagamento marcado como vencido'
    };
  }

  private async handlePaymentRefunded(payment: any, existingPayment: any): Promise<WebhookProcessResult> {
    if (!existingPayment) {
      return {
        success: false,
        message: 'Pagamento não encontrado no banco'
      };
    }

    // Atualizar status para reembolsado
    const { error } = await supabase
      .from('asaas_payments')
      .update({
        status: 'refunded',
        updated_at: new Date().toISOString()
      })
      .eq('asaas_payment_id', payment.id);

    if (error) throw error;

    // Reverter benefícios
    if (existingPayment.subscription_id) {
      await this.cancelSubscription(existingPayment.subscription_id, 'refunded');
    }

    return {
      success: true,
      message: 'Reembolso processado'
    };
  }

  private async handlePaymentDeleted(payment: any, existingPayment: any): Promise<WebhookProcessResult> {
    if (!existingPayment) {
      return {
        success: false,
        message: 'Pagamento não encontrado no banco'
      };
    }

    // Apenas atualizar status, não deletar do banco (auditoria)
    const { error } = await supabase
      .from('asaas_payments')
      .update({
        status: 'deleted',
        updated_at: new Date().toISOString()
      })
      .eq('asaas_payment_id', payment.id);

    if (error) throw error;

    return {
      success: true,
      message: 'Pagamento deletado'
    };
  }

  // =================================================================
  // FUNÇÕES AUXILIARES
  // =================================================================

  /**
   * Ativa uma assinatura
   */
  private async activateSubscription(subscriptionId: string): Promise<void> {
    const { data: subscription } = await supabase
      .from('asaas_subscriptions')
      .select('*')
      .eq('id', subscriptionId)
      .single();

    if (!subscription) return;

    // Calcular deadline de reembolso (7 dias)
    const refundDeadline = new Date();
    refundDeadline.setDate(refundDeadline.getDate() + 7);

    // Atualizar assinatura
    await supabase
      .from('asaas_subscriptions')
      .update({
        status: 'active',
        started_at: new Date().toISOString(),
        first_payment_at: new Date().toISOString(),
        refund_deadline: refundDeadline.toISOString(),
        can_refund: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', subscriptionId);

    console.log('✅ Assinatura ativada:', subscriptionId);
  }

  /**
   * Suspende uma assinatura
   */
  private async suspendSubscription(subscriptionId: string): Promise<void> {
    await supabase
      .from('asaas_subscriptions')
      .update({
        status: 'suspended',
        updated_at: new Date().toISOString()
      })
      .eq('id', subscriptionId);
  }

  /**
   * Cancela uma assinatura
   */
  private async cancelSubscription(subscriptionId: string, reason: string): Promise<void> {
    await supabase
      .from('asaas_subscriptions')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancellation_reason: reason,
        updated_at: new Date().toISOString()
      })
      .eq('id', subscriptionId);
  }

  /**
   * Ativa um anúncio individual pago
   */
  private async activateIndividualAd(contentId: string, contentType: string): Promise<void> {
    if (contentType !== 'animal') return;

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 dias

    await supabase
      .from('animals')
      .update({
        is_individual_paid: true,
        individual_paid_expires_at: expiresAt.toISOString(),
        ad_status: 'active',
        published_at: new Date().toISOString()
      })
      .eq('id', contentId);

    console.log('✅ Anúncio individual ativado:', contentId);
  }

  /**
   * Ativa um evento individual pago
   */
  private async activateIndividualEvent(eventId: string): Promise<void> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 dias

    await supabase
      .from('events')
      .update({
        is_individual_paid: true,
        individual_paid_expires_at: expiresAt.toISOString(),
        ad_status: 'active',
        published_at: new Date().toISOString()
      })
      .eq('id', eventId);

    console.log('✅ Evento individual ativado:', eventId);
  }

  /**
   * Adiciona créditos de boost
   */
  private async addBoostCredits(userId: string, metadata: any): Promise<void> {
    const boostQuantity = metadata?.boost_quantity || 1;

    await supabase.rpc('increment_boost_credits', {
      p_user_id: userId,
      p_amount: boostQuantity
    });

    console.log(`✅ ${boostQuantity} boost(s) adicionado(s) para o usuário:`, userId);
  }

  /**
   * Cria registro na tabela transactions
   */
  private async createTransaction(payment: any, asaasPayment: any): Promise<void> {
    await supabase
      .from('transactions')
      .insert({
        user_id: payment.user_id,
        asaas_payment_id: payment.asaas_payment_id,
        asaas_customer_id: payment.asaas_customer_id,
        type: payment.payment_type,
        amount: payment.value,
        currency: 'BRL',
        billing_type: payment.billing_type,
        status: 'completed',
        metadata: {
          asaas_payment: asaasPayment,
          payment_date: asaasPayment.paymentDate,
          net_value: asaasPayment.netValue
        }
      });
  }

  /**
   * Registra webhook no log
   */
  private async logWebhook(
    event: AsaasWebhookEvent,
    signature?: string,
    ipAddress?: string
  ): Promise<string> {
    const { data, error } = await supabase
      .from('asaas_webhooks_log')
      .insert({
        event_type: event.event,
        asaas_payment_id: event.payment?.id,
        asaas_subscription_id: event.subscription?.id,
        payload: event as any,
        signature: signature,
        ip_address: ipAddress,
        is_valid_signature: false, // Implementar validação de assinatura
        processed: false
      })
      .select('id')
      .single();

    if (error) {
      console.error('Erro ao registrar webhook no log:', error);
      throw error;
    }

    return data.id;
  }

  /**
   * Atualiza log do webhook após processamento
   */
  private async updateWebhookLog(
    webhookId: string,
    success: boolean,
    error?: any
  ): Promise<void> {
    await supabase
      .from('asaas_webhooks_log')
      .update({
        processed: success,
        processed_at: new Date().toISOString(),
        processing_error: error ? JSON.stringify(error) : null
      })
      .eq('id', webhookId);
  }
}

// Exportar instância singleton
export const asaasWebhookService = new AsaasWebhookService();
export default asaasWebhookService;


