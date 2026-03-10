/**
 * =================================================================
 * ASAAS SERVICE - Integração com API Asaas.com
 * =================================================================
 * 
 * Serviço profissional para integração completa com a API do Asaas
 * Conformidade: LGPD + CDC (Código de Defesa do Consumidor)
 * 
 * Funcionalidades:
 * - Gerenciamento de clientes
 * - Criação e gerenciamento de cobranças
 * - Assinaturas mensais e anuais
 * - Processamento de webhooks
 * - Reembolsos
 * 
 * @author Cavalaria Digital
 * @date 2025-11-27
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from '@/lib/supabase';

// =================================================================
// TIPOS E INTERFACES
// =================================================================

export interface AsaasConfig {
  apiKey: string;
  environment: 'sandbox' | 'production';
  baseURL: string;
}

export interface AsaasCustomer {
  id: string;
  name: string;
  email: string;
  cpfCnpj?: string;
  phone?: string;
  mobilePhone?: string;
  address?: string;
  addressNumber?: string;
  complement?: string;
  province?: string;
  postalCode?: string;
  externalReference?: string;
  notificationDisabled?: boolean;
}

export interface AsaasPayment {
  id: string;
  customer: string;
  billingType: 'BOLETO' | 'CREDIT_CARD' | 'PIX' | 'UNDEFINED';
  value: number;
  dueDate: string;
  description?: string;
  externalReference?: string;
  installmentCount?: number;
  installmentValue?: number;
  discount?: {
    value: number;
    dueDateLimitDays: number;
  };
  fine?: {
    value: number;
  };
  interest?: {
    value: number;
  };
  postalService?: boolean;
}

export interface AsaasSubscription {
  id: string;
  customer: string;
  billingType: 'BOLETO' | 'CREDIT_CARD' | 'PIX' | 'UNDEFINED';
  value: number;
  nextDueDate: string;
  cycle: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'SEMIANNUALLY' | 'YEARLY';
  description?: string;
  externalReference?: string;
}

export interface AsaasWebhookEvent {
  event: string;
  payment?: {
    id: string;
    customer: string;
    value: number;
    netValue: number;
    billingType: string;
    status: string;
    dueDate: string;
    paymentDate?: string;
    description?: string;
    externalReference?: string;
  };
  subscription?: {
    id: string;
    customer: string;
    value: number;
    cycle: string;
    status: string;
  };
}

// =================================================================
// CLASSE PRINCIPAL DO SERVIÇO ASAAS
// =================================================================

class AsaasService {
  private config: AsaasConfig;

  constructor() {
    // Configuração inicial - deve ser definida via variáveis de ambiente
    this.config = {
      apiKey: import.meta.env.VITE_ASAAS_API_KEY || '',
      environment: (import.meta.env.VITE_ASAAS_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox',
      baseURL: import.meta.env.VITE_ASAAS_ENVIRONMENT === 'production' 
        ? 'https://api.asaas.com/v3' 
        : 'https://sandbox.asaas.com/api/v3'
    };
  }

  /**
   * Valida se o serviço está configurado corretamente
   */
  private validateConfig(): void {
    if (!this.config.apiKey) {
      throw new Error('ASAAS_API_KEY não configurada. Configure a variável de ambiente VITE_ASAAS_API_KEY');
    }
  }

  /**
   * Faz uma requisição para a API do Asaas
   */
  private async request<T>(
    endpoint: string, 
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    data?: any
  ): Promise<T> {
    this.validateConfig();

    const url = `${this.config.baseURL}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'access_token': this.config.apiKey,
          'User-Agent': 'Cavalaria-Digital/1.0'
        },
        body: data ? JSON.stringify(data) : undefined
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Asaas API Error (${response.status}): ${errorData.errors?.[0]?.description || response.statusText}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Erro na requisição Asaas:', error);
      throw error;
    }
  }

  // =================================================================
  // GERENCIAMENTO DE CLIENTES
  // =================================================================

  /**
   * Cria ou recupera um cliente no Asaas
   */
  async createOrGetCustomer(userId: string): Promise<{ asaasCustomerId: string; isNew: boolean }> {
    try {
      // 1. Verificar se já existe no banco
      const { data: existingCustomer } = await supabase
        .from('asaas_customers')
        .select('asaas_customer_id')
        .eq('user_id', userId)
        .single();

      if (existingCustomer) {
        return { 
          asaasCustomerId: existingCustomer.asaas_customer_id, 
          isNew: false 
        };
      }

      // 2. Buscar dados do usuário
      const { data: profile } = await supabase
        .from('profiles')
        .select('name, email, cpf, phone, cep, city, state')
        .eq('id', userId)
        .single();

      if (!profile) {
        throw new Error('Perfil do usuário não encontrado');
      }

      // 3. Criar cliente no Asaas
      const customerData: Partial<AsaasCustomer> = {
        name: profile.name,
        email: profile.email,
        cpfCnpj: profile.cpf || undefined,
        mobilePhone: profile.phone || undefined,
        postalCode: profile.cep || undefined,
        externalReference: userId,
        notificationDisabled: false
      };

      const response = await this.request<AsaasCustomer>(
        '/customers',
        'POST',
        customerData
      );

      // 4. Salvar no banco de dados
      const { error: insertError } = await supabase
        .from('asaas_customers')
        .insert({
          user_id: userId,
          asaas_customer_id: response.id,
          name: profile.name,
          email: profile.email,
          cpf_cnpj: profile.cpf,
          phone: profile.phone,
          is_active: true
        });

      if (insertError) {
        console.error('Erro ao salvar cliente no banco:', insertError);
        throw insertError;
      }

      console.log('✅ Cliente criado no Asaas:', response.id);

      return { 
        asaasCustomerId: response.id, 
        isNew: true 
      };
    } catch (error) {
      console.error('❌ Erro ao criar/buscar cliente:', error);
      throw error;
    }
  }

  /**
   * Atualiza dados de um cliente no Asaas
   */
  async updateCustomer(asaasCustomerId: string, data: Partial<AsaasCustomer>): Promise<AsaasCustomer> {
    return this.request<AsaasCustomer>(
      `/customers/${asaasCustomerId}`,
      'PUT',
      data
    );
  }

  // =================================================================
  // GERENCIAMENTO DE PAGAMENTOS
  // =================================================================

  /**
   * Cria uma cobrança única no Asaas
   */
  async createPayment(params: {
    userId: string;
    value: number;
    dueDate: string;
    description: string;
    billingType: 'BOLETO' | 'CREDIT_CARD' | 'PIX' | 'UNDEFINED';
    externalReference?: string;
    installmentCount?: number;
  }): Promise<any> {
    try {
      // 1. Garantir que o cliente existe
      const { asaasCustomerId } = await this.createOrGetCustomer(params.userId);

      // 2. Criar cobrança no Asaas
      const paymentData: Partial<AsaasPayment> = {
        customer: asaasCustomerId,
        billingType: params.billingType,
        value: params.value,
        dueDate: params.dueDate,
        description: params.description,
        externalReference: params.externalReference || params.userId,
        installmentCount: params.installmentCount || 1,
        postalService: false
      };

      const response = await this.request<any>(
        '/payments',
        'POST',
        paymentData
      );

      // 3. Buscar asaas_customer_id do banco
      const { data: customerData } = await supabase
        .from('asaas_customers')
        .select('id')
        .eq('asaas_customer_id', asaasCustomerId)
        .single();

      if (!customerData) {
        throw new Error('Cliente não encontrado no banco de dados');
      }

      // 4. Salvar no banco de dados
      const { error: insertError } = await supabase
        .from('asaas_payments')
        .insert({
          user_id: params.userId,
          asaas_customer_id: customerData.id,
          asaas_payment_id: response.id,
          payment_type: this.inferPaymentType(params.description),
          value: params.value,
          billing_type: params.billingType,
          status: response.status,
          due_date: params.dueDate,
          invoice_url: response.invoiceUrl,
          bank_slip_url: response.bankSlipUrl,
          pix_qr_code: response.encodedImage,
          pix_copy_paste: response.payload,
          description: params.description,
          external_reference: params.externalReference,
          installment_count: params.installmentCount || 1,
          metadata: { asaas_response: response }
        });

      if (insertError) {
        console.error('Erro ao salvar pagamento no banco:', insertError);
        throw insertError;
      }

      console.log('✅ Cobrança criada no Asaas:', response.id);

      return response;
    } catch (error) {
      console.error('❌ Erro ao criar cobrança:', error);
      throw error;
    }
  }

  /**
   * Infere o tipo de pagamento baseado na descrição
   */
  private inferPaymentType(description: string): string {
    const desc = description.toLowerCase();
    if (desc.includes('assinatura') || desc.includes('plano')) return 'subscription';
    if (desc.includes('boost') || desc.includes('destaque')) return 'boost_purchase';
    if (desc.includes('evento')) return 'individual_event';
    if (desc.includes('anúncio') || desc.includes('animal')) return 'individual_ad';
    return 'subscription';
  }

  /**
   * Busca informações de um pagamento
   */
  async getPayment(paymentId: string): Promise<any> {
    return this.request<any>(`/payments/${paymentId}`);
  }

  /**
   * Cancela um pagamento
   */
  async deletePayment(paymentId: string): Promise<void> {
    await this.request(`/payments/${paymentId}`, 'DELETE');
  }

  // =================================================================
  // GERENCIAMENTO DE ASSINATURAS
  // =================================================================

  /**
   * Cria uma assinatura recorrente
   */
  async createSubscription(params: {
    userId: string;
    planType: 'basic' | 'pro' | 'ultra' | 'vip';
    value: number;
    billingType: 'BOLETO' | 'CREDIT_CARD' | 'PIX' | 'UNDEFINED';
    cycle: 'MONTHLY' | 'YEARLY';
    description: string;
  }): Promise<any> {
    try {
      // 1. Garantir que o cliente existe
      const { asaasCustomerId } = await this.createOrGetCustomer(params.userId);

      // 2. Calcular data de vencimento (próximo mês para mensal, hoje para anual)
      const nextDueDate = new Date();
      if (params.cycle === 'MONTHLY') {
        nextDueDate.setMonth(nextDueDate.getMonth() + 1);
      } else {
        // Para anual, vencimento é hoje (pagamento único)
        nextDueDate.setDate(nextDueDate.getDate() + 1);
      }

      // 3. Criar assinatura no Asaas
      const subscriptionData: Partial<AsaasSubscription> = {
        customer: asaasCustomerId,
        billingType: params.billingType,
        value: params.value,
        nextDueDate: nextDueDate.toISOString().split('T')[0],
        cycle: params.cycle,
        description: params.description,
        externalReference: params.userId
      };

      const response = await this.request<any>(
        '/subscriptions',
        'POST',
        subscriptionData
      );

      // 4. Buscar asaas_customer_id do banco
      const { data: customerData } = await supabase
        .from('asaas_customers')
        .select('id')
        .eq('asaas_customer_id', asaasCustomerId)
        .single();

      if (!customerData) {
        throw new Error('Cliente não encontrado no banco de dados');
      }

      // 5. Salvar assinatura no banco
      const expiresAt = new Date();
      if (params.cycle === 'YEARLY') {
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);
      } else {
        expiresAt.setMonth(expiresAt.getMonth() + 1);
      }

      const { error: insertError } = await supabase
        .from('asaas_subscriptions')
        .insert({
          user_id: params.userId,
          asaas_customer_id: customerData.id,
          asaas_subscription_id: response.id,
          plan_type: params.planType,
          billing_type: params.cycle === 'MONTHLY' ? 'monthly' : 'annual',
          value: params.value,
          status: 'pending', // Será atualizado pelo webhook
          next_due_date: nextDueDate.toISOString(),
          expires_at: expiresAt.toISOString(),
          auto_renew: params.cycle === 'MONTHLY', // Apenas mensal renova automaticamente
          metadata: { asaas_response: response }
        });

      if (insertError) {
        console.error('Erro ao salvar assinatura no banco:', insertError);
        throw insertError;
      }

      console.log('✅ Assinatura criada no Asaas:', response.id);

      return response;
    } catch (error) {
      console.error('❌ Erro ao criar assinatura:', error);
      throw error;
    }
  }

  /**
   * Cancela uma assinatura
   */
  async cancelSubscription(subscriptionId: string): Promise<void> {
    await this.request(`/subscriptions/${subscriptionId}`, 'DELETE');
  }

  /**
   * Busca informações de uma assinatura
   */
  async getSubscription(subscriptionId: string): Promise<any> {
    return this.request<any>(`/subscriptions/${subscriptionId}`);
  }

  // =================================================================
  // REEMBOLSOS
  // =================================================================

  /**
   * Processa um reembolso no Asaas
   */
  async processRefund(paymentId: string, value?: number): Promise<any> {
    const refundData: any = {};
    if (value) {
      refundData.value = value;
    }

    return this.request<any>(
      `/payments/${paymentId}/refund`,
      'POST',
      refundData
    );
  }

  // =================================================================
  // UTILITÁRIOS
  // =================================================================

  /**
   * Verifica se está em modo sandbox
   */
  isSandbox(): boolean {
    return this.config.environment === 'sandbox';
  }

  /**
   * Obtém informações da conta
   */
  async getAccountInfo(): Promise<any> {
    return this.request<any>('/myAccount');
  }
}

// Exportar instância singleton
export const asaasService = new AsaasService();
export default asaasService;


