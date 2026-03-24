/**
 * =================================================================
 * PROCESS-PAYMENT Edge Function (Secure)
 * =================================================================
 *
 * Cria cobranças e assinaturas no Asaas SEM manipular dados de cartão.
 * O pagamento é feito exclusivamente via checkout hospedado (invoiceUrl).
 *
 * O frontend NUNCA recebe nem envia dados de cartão.
 * Toda comunicação com o Asaas ocorre exclusivamente aqui no backend.
 */
// @ts-expect-error - runtime import resolved by Deno in Edge Functions
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
// @ts-expect-error - runtime import resolved by Deno in Edge Functions
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { checkRateLimit } from '../_shared/asaasPaymentUtils.ts';

declare const Deno: {
  env: {
    get: (key: string) => string | undefined;
  };
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PLAN_PRICES = {
  essencial: { monthly: 39.90, annual: 399.00 },
  criador: { monthly: 97.90, annual: 997.00 },
  haras: { monthly: 197.90, annual: 1997.00 },
  elite: { monthly: 397.90, annual: 3997.00 },
} as const;

type PlanId = keyof typeof PLAN_PRICES;
type BillingCycle = 'monthly' | 'annual';
type PaymentMethod = 'CREDIT_CARD' | 'PIX' | 'BOLETO';

interface CustomerPayload {
  name: string;
  email: string;
  cpfCnpj: string;
  mobilePhone: string;
}

interface AddressPayload {
  postalCode: string;
  address: string;
  addressNumber: string;
  complement: string;
  province: string;
  city: string;
  state: string;
}

// Sem CardPayload - dados de cartão NUNCA passam por este servidor

interface ProcessPaymentBody {
  userId?: string;
  planId?: string;
  billingCycle?: string;
  paymentMethod?: string;
  customer: CustomerPayload;
  address: AddressPayload;
  // card removido - pagamento via invoiceUrl
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const getString = (value: unknown) => (typeof value === 'string' ? value : '');

const isPlanId = (value: string): value is PlanId => value in PLAN_PRICES;
const isBillingCycle = (value: string): value is BillingCycle =>
  ['monthly', 'annual'].includes(value);
const isPaymentMethod = (value: string): value is PaymentMethod =>
  ['CREDIT_CARD', 'PIX', 'BOLETO'].includes(value);

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : String(error ?? 'Erro desconhecido');

const parseProcessPaymentBody = (raw: unknown): ProcessPaymentBody | null => {
  if (!isRecord(raw)) return null;

  const customerRaw = isRecord(raw.customer) ? raw.customer : {};
  const addressRaw = isRecord(raw.address) ? raw.address : {};

  return {
    userId: typeof raw.userId === 'string' ? raw.userId : undefined,
    planId: typeof raw.planId === 'string' ? raw.planId : undefined,
    billingCycle: typeof raw.billingCycle === 'string' ? raw.billingCycle : undefined,
    paymentMethod: typeof raw.paymentMethod === 'string' ? raw.paymentMethod : undefined,
    customer: {
      name: getString(customerRaw.name),
      email: getString(customerRaw.email),
      cpfCnpj: getString(customerRaw.cpfCnpj),
      mobilePhone: getString(customerRaw.mobilePhone),
    },
    address: {
      postalCode: getString(addressRaw.postalCode),
      address: getString(addressRaw.address),
      addressNumber: getString(addressRaw.addressNumber),
      complement: getString(addressRaw.complement),
      province: getString(addressRaw.province),
      city: getString(addressRaw.city),
      state: getString(addressRaw.state),
    },
  };
};

const sanitizeDigits = (value: string) => value.replace(/\D/g, '');

const isValidCpf = (value: string) => {
  const cpf = sanitizeDigits(value);
  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;
  const calcDigit = (base: string, factor: number) => {
    let total = 0;
    for (let i = 0; i < base.length; i += 1) {
      total += Number(base[i]) * (factor - i);
    }
    const remainder = (total * 10) % 11;
    return remainder === 10 ? 0 : remainder;
  };
  const digit1 = calcDigit(cpf.slice(0, 9), 10);
  const digit2 = calcDigit(cpf.slice(0, 10), 11);
  return digit1 === Number(cpf[9]) && digit2 === Number(cpf[10]);
};

const isValidPhone = (value: string) => {
  const digits = sanitizeDigits(value);
  if (digits.length < 10 || digits.length > 11) return false;
  if (/^(\d)\1+$/.test(digits)) return false;
  const ddd = Number(digits.slice(0, 2));
  if (!Number.isFinite(ddd) || ddd < 11 || ddd > 99) return false;
  return true;
};

const formatPhone = (value: string) => {
  const digits = sanitizeDigits(value).slice(0, 11);
  if (digits.length <= 10) {
    return digits.replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2');
  }
  return digits.replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2');
};

const normalizeBaseUrl = (baseUrl: string) => {
  const trimmed = baseUrl.replace(/\/+$/, '');
  if (trimmed.endsWith('/api/v3') || trimmed.endsWith('/v3')) {
    return trimmed;
  }
  return `${trimmed}/api/v3`;
};

const asaasRequest = async (endpoint: string, method: string, data?: unknown) => {
  const baseUrl = Deno.env.get('ASAAS_BASE_URL');
  const apiKey = Deno.env.get('ASAAS_API_KEY');

  if (!baseUrl || !apiKey) {
    throw new Error('Configuracao do Asaas ausente.');
  }

  const resolvedBaseUrl = normalizeBaseUrl(baseUrl);
  const response = await fetch(`${resolvedBaseUrl}${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'access_token': apiKey,
      'User-Agent': 'cavalaria-digital/checkout',
    },
    body: data ? JSON.stringify(data) : undefined,
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = payload?.errors?.[0]?.description || payload?.message || 'Erro ao comunicar com Asaas.';
    throw new Error(message);
  }
  return payload;
};

const envFlags = () => ({
  hasAsaasKey: Boolean(Deno.env.get('ASAAS_API_KEY')),
  hasAsaasBaseUrl: Boolean(Deno.env.get('ASAAS_BASE_URL')),
  hasSupabaseUrl: Boolean(Deno.env.get('SUPABASE_URL')),
  hasAnonKey: Boolean(Deno.env.get('SUPABASE_ANON_KEY')),
  hasServiceKey: Boolean(Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')),
});

const buildSupabaseClients = (authHeader: string | null) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

  const authClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader ?? '' } },
  });

  const serviceClient = createClient(supabaseUrl, serviceKey);
  return { authClient, serviceClient };
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  let stage = 'init';
  let userId: string | undefined;
  let serviceClient: ReturnType<typeof buildSupabaseClients>['serviceClient'] | undefined;

  try {
    const authHeader = req.headers.get('Authorization');
    const clients = buildSupabaseClients(authHeader);
    const { authClient } = clients;
    serviceClient = clients.serviceClient;
    const { data: authData, error: authError } = await authClient.auth.getUser();

    if (authError || !authData?.user) {
      return new Response(JSON.stringify({ success: false, message: 'JWT invalido ou ausente.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    stage = 'parse_body';
    let body: ProcessPaymentBody | null = null;
    try {
      body = parseProcessPaymentBody(await req.json());
    } catch {
      return new Response(JSON.stringify({ success: false, message: 'Payload invalido.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (!body) {
      return new Response(JSON.stringify({ success: false, message: 'Payload invalido.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const {
      userId: bodyUserId,
      planId,
      billingCycle,
      paymentMethod,
      customer,
      address,
    } = body ?? {};

    userId = typeof bodyUserId === 'string' ? bodyUserId : authData.user.id;
    if (!userId || userId !== authData.user.id) {
      return new Response(JSON.stringify({ success: false, message: 'Usuario invalido.' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Rate limiting: max 5 tentativas de pagamento por 10 minutos por usuário
    stage = 'rate_limit';
    const rateLimitResult = await checkRateLimit(serviceClient, userId, 'process_payment', 5, 10);
    if (!rateLimitResult.allowed) {
      return new Response(
        JSON.stringify({ success: false, message: rateLimitResult.message || 'Muitas tentativas. Aguarde alguns minutos.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    stage = 'validate_payload';
    if (!planId || !isPlanId(planId)) {
      return new Response(JSON.stringify({ success: false, message: 'Plano invalido.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!billingCycle || !isBillingCycle(billingCycle)) {
      return new Response(JSON.stringify({ success: false, message: 'Ciclo de cobranca invalido.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!paymentMethod || !isPaymentMethod(paymentMethod)) {
      return new Response(JSON.stringify({ success: false, message: 'Forma de pagamento invalida.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!customer.cpfCnpj || !address.postalCode) {
      return new Response(JSON.stringify({ success: false, message: 'Dados obrigatorios ausentes.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const normalizedCpf = sanitizeDigits(customer.cpfCnpj);
    if (!isValidCpf(normalizedCpf)) {
      return new Response(JSON.stringify({ success: false, message: 'CPF invalido.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const normalizedPhone = customer.mobilePhone && isValidPhone(customer.mobilePhone)
      ? sanitizeDigits(customer.mobilePhone)
      : undefined;
    const normalizedPostal = sanitizeDigits(address.postalCode);
    const phoneFormatted = normalizedPhone ? formatPhone(normalizedPhone) : undefined;

    if (!normalizedPhone) {
      return new Response(
        JSON.stringify({ success: false, message: 'WhatsApp invalido. Atualize seus dados.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!normalizedPostal || normalizedPostal.length !== 8) {
      return new Response(
        JSON.stringify({ success: false, message: 'CEP invalido. Atualize seu endereco.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!address.address || !address.addressNumber || !address.province || !address.city || !address.state) {
      return new Response(
        JSON.stringify({ success: false, message: 'Endereco incompleto. Informe rua, numero, bairro, cidade e UF.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (phoneFormatted) {
      const { data: existingPhone } = await serviceClient
        .from('profiles')
        .select('id, phone')
        .in('phone', [phoneFormatted, normalizedPhone].filter(Boolean))
        .neq('id', userId)
        .limit(1);

      if (existingPhone && existingPhone.length > 0) {
        return new Response(
          JSON.stringify({ success: false, message: 'WhatsApp ja esta em uso por outro usuario.' }),
          { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // ── Criar/obter cliente no Asaas ──

    stage = 'load_customer';
    const { data: existingCustomer } = await serviceClient
      .from('asaas_customers')
      .select('id, asaas_customer_id')
      .eq('user_id', userId)
      .single();

    let asaasCustomerId = existingCustomer?.asaas_customer_id;
    let customerRowId = existingCustomer?.id;

    if (!asaasCustomerId) {
      stage = 'create_customer';
      const customerPayload = {
        name: customer.name,
        cpfCnpj: normalizedCpf,
        email: customer.email,
        mobilePhone: normalizedPhone,
        postalCode: normalizedPostal,
        address: address.address,
        addressNumber: address.addressNumber,
        complement: address.complement,
        province: address.province,
        city: address.city,
        state: address.state,
        externalReference: userId,
        notificationDisabled: false,
      };

      const createdCustomer = await asaasRequest('/customers', 'POST', customerPayload);
      asaasCustomerId = createdCustomer.id;

      stage = 'insert_customer';
      const { data: insertedCustomer, error: insertCustomerError } = await serviceClient
        .from('asaas_customers')
        .insert({
          user_id: userId,
          asaas_customer_id: asaasCustomerId,
          name: customer.name,
          email: customer.email,
          cpf_cnpj: normalizedCpf,
          phone: phoneFormatted ?? normalizedPhone ?? null,
          is_active: true,
        })
        .select('id')
        .single();

      if (insertCustomerError || !insertedCustomer) {
        await asaasRequest(`/customers/${asaasCustomerId}`, 'DELETE').catch(() => null);
        throw new Error('Falha ao salvar cliente no banco.');
      }

      customerRowId = insertedCustomer.id;
    } else {
      await asaasRequest(`/customers/${asaasCustomerId}`, 'PUT', {
        name: customer.name,
        cpfCnpj: normalizedCpf,
        email: customer.email,
        mobilePhone: normalizedPhone,
        postalCode: normalizedPostal,
        address: address.address,
        addressNumber: address.addressNumber,
        complement: address.complement,
        province: address.province,
        city: address.city,
        state: address.state,
        externalReference: userId,
        notificationDisabled: false,
      });
    }

    if (!customerRowId) {
      throw new Error('Cliente nao encontrado para cobranca.');
    }

    // ── Verificar assinatura ativa/pendente duplicada (idempotência) ──

    stage = 'check_existing_subscription';
    const { data: existingSubscription } = await serviceClient
      .from('asaas_subscriptions')
      .select('id, status, plan_type')
      .eq('user_id', userId)
      .eq('plan_type', planId)
      .in('status', ['active', 'pending'])
      .maybeSingle();

    if (existingSubscription) {
      if (existingSubscription.status === 'active') {
        return errorResponse(409, 'Voce ja possui uma assinatura ativa para este plano.');
      }

      // Pending — recuperar dados do pagamento existente para o usuario poder pagar
      const { data: existingPayment } = await serviceClient
        .from('asaas_payments')
        .select('asaas_payment_id, invoice_url, pix_qr_code, pix_copy_paste')
        .eq('subscription_id', existingSubscription.id)
        .eq('status', 'pending')
        .limit(1)
        .maybeSingle();

      if (existingPayment?.asaas_payment_id && existingPayment?.invoice_url) {
        console.log('[process-payment] Retornando pagamento pendente existente:', existingPayment.asaas_payment_id);
        return new Response(
          JSON.stringify({
            success: true,
            status: 'PENDING',
            subscriptionId: existingSubscription.id,
            paymentId: existingPayment.asaas_payment_id,
            invoiceUrl: existingPayment.invoice_url,
            pixQrCode: existingPayment.pix_qr_code ?? undefined,
            pixCopyPaste: existingPayment.pix_copy_paste ?? undefined,
            recovered: true,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Assinatura pendente sem pagamento valido — limpar orfao e prosseguir
      console.warn('[process-payment] Assinatura pendente sem pagamento — limpando orfao:', existingSubscription.id);
      await serviceClient.from('asaas_subscriptions').delete().eq('id', existingSubscription.id);
    }

    // ── Calcular precos ──

    const prices = PLAN_PRICES[planId];
    const baseTotal = prices[billingCycle];
    const discountRate = paymentMethod === 'PIX' ? 0.03 : 0;
    const discountAmount = Number((baseTotal * discountRate).toFixed(2));
    const totalValue = Number((baseTotal - discountAmount).toFixed(2));
    const externalReference = `PP|${userId}|${planId}|${billingCycle}`;

    // ══════════════════════════════════════════════════════════════
    // ASSINATURA MENSAL — via checkout hospedado (sem dados de cartao)
    // ══════════════════════════════════════════════════════════════

    if (billingCycle === 'monthly') {
      stage = 'create_subscription';

      // Criar assinatura SEM dados de cartao.
      // O Asaas gera um payment com invoiceUrl para checkout hospedado.
      const subscriptionPayload = {
        customer: asaasCustomerId,
        billingType: paymentMethod,
        value: totalValue,
        cycle: 'MONTHLY',
        description: `Assinatura Mensal - Plano ${planId.toUpperCase()}`,
        externalReference,
        // SEM creditCard / creditCardHolderInfo
      };

      const subscription = await asaasRequest('/subscriptions', 'POST', subscriptionPayload);

      const nextDueDate = subscription?.nextDueDate ?? new Date().toISOString().split('T')[0];
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 1);

      stage = 'insert_subscription';
      const { data: subscriptionRow, error: subscriptionError } = await serviceClient
        .from('asaas_subscriptions')
        .insert({
          user_id: userId,
          asaas_customer_id: customerRowId,
          asaas_subscription_id: subscription.id,
          plan_type: planId,
          billing_type: 'monthly',
          value: totalValue,
          status: 'pending',
          next_due_date: nextDueDate,
          expires_at: expiresAt.toISOString(),
          auto_renew: true,
          metadata: {
            asaas_subscription_id: subscription.id,
            asaas_status: subscription.status,
            cycle: subscription.cycle,
            next_due_date: subscription.nextDueDate,
          },
        })
        .select('id')
        .single();

      if (subscriptionError || !subscriptionRow) {
        await asaasRequest(`/subscriptions/${subscription.id}`, 'DELETE').catch(() => null);
        throw new Error('Falha ao salvar assinatura no banco.');
      }

      // ── Buscar o primeiro pagamento gerado pela assinatura ──
      let firstPaymentId: string | null = subscription?.payment?.id ?? null;
      let invoiceUrl: string | null = subscription?.payment?.invoiceUrl ?? null;

      if (!firstPaymentId) {
        try {
          const paymentsData = await asaasRequest(
            `/subscriptions/${subscription.id}/payments?limit=1`,
            'GET'
          );
          const firstPayment = paymentsData?.data?.[0];
          firstPaymentId = firstPayment?.id ?? null;
          invoiceUrl = firstPayment?.invoiceUrl ?? null;
        } catch {
          // Se nao conseguir buscar, prossegue sem
        }
      }

      // Se temos paymentId mas nao invoiceUrl, buscar o payment direto
      if (firstPaymentId && !invoiceUrl) {
        try {
          const paymentDetail = await asaasRequest(`/payments/${firstPaymentId}`, 'GET');
          invoiceUrl = paymentDetail?.invoiceUrl ?? null;
        } catch {
          // silent
        }
      }

      // ── Buscar QR code PIX se metodo for PIX ──
      let pixQrCode: string | null = null;
      let pixCopyPaste: string | null = null;
      if (paymentMethod === 'PIX' && firstPaymentId) {
        try {
          const pixData = await asaasRequest(`/payments/${firstPaymentId}/pixQrCode`, 'GET');
          pixQrCode = pixData?.encodedImage ?? null;
          pixCopyPaste = pixData?.payload ?? null;
        } catch {
          // PIX QR nao disponivel, usuario usara invoiceUrl
        }
      }

      // ── Criar registro em asaas_payments para o primeiro pagamento ──
      if (firstPaymentId) {
        stage = 'insert_monthly_payment';
        const { error: monthlyPaymentError } = await serviceClient.from('asaas_payments').insert({
          user_id: userId,
          asaas_customer_id: customerRowId,
          asaas_payment_id: firstPaymentId,
          payment_type: 'subscription',
          subscription_id: subscriptionRow.id,
          value: totalValue,
          billing_type: paymentMethod,
          status: 'pending',
          description: `Assinatura Mensal - Plano ${planId.toUpperCase()}`,
          external_reference: externalReference,
          invoice_url: invoiceUrl,
          pix_qr_code: pixQrCode,
          pix_copy_paste: pixCopyPaste,
          metadata: {
            asaas_subscription_id: subscription.id,
            is_monthly: true,
          },
        });

        if (monthlyPaymentError) {
          await asaasRequest(`/subscriptions/${subscription.id}`, 'DELETE').catch(() => null);
          await serviceClient.from('asaas_subscriptions').delete().eq('id', subscriptionRow.id);
          throw new Error('Falha ao salvar pagamento mensal no banco.');
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          status: 'PENDING',
          subscriptionId: subscriptionRow.id,
          paymentId: firstPaymentId ?? undefined,
          invoiceUrl: invoiceUrl ?? undefined,
          pixQrCode: pixQrCode ?? undefined,
          pixCopyPaste: pixCopyPaste ?? undefined,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ══════════════════════════════════════════════════════════════
    // PAGAMENTO UNICO (anual) — via checkout hospedado
    // ══════════════════════════════════════════════════════════════

    const subscriptionExpiresAt = new Date();
    subscriptionExpiresAt.setMonth(subscriptionExpiresAt.getMonth() + 12);

    stage = 'insert_subscription';
    const { data: subscriptionRow, error: subscriptionRowError } = await serviceClient
      .from('asaas_subscriptions')
      .insert({
        user_id: userId,
        asaas_customer_id: customerRowId,
        plan_type: planId,
        billing_type: billingCycle,
        value: totalValue,
        status: 'pending',
        expires_at: subscriptionExpiresAt.toISOString(),
        auto_renew: false,
      })
      .select('id')
      .single();

    if (subscriptionRowError || !subscriptionRow) {
      throw new Error('Falha ao preparar assinatura no banco.');
    }

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 1);

    const paymentDescription = 'Plano Anual';

    // Criar pagamento SEM dados de cartao.
    // O Asaas retorna invoiceUrl para checkout hospedado.
    const paymentPayload: Record<string, unknown> = {
      customer: asaasCustomerId,
      billingType: paymentMethod,
      value: totalValue,
      description: paymentDescription,
      dueDate: dueDate.toISOString().split('T')[0],
      externalReference,
      // SEM creditCard / creditCardHolderInfo / installmentCount
      // O parcelamento e feito na pagina do Asaas pelo cliente
    };

    stage = 'create_payment';
    const payment = await asaasRequest('/payments', 'POST', paymentPayload);
    let pixQrCode: string | null = null;
    let pixCopyPaste: string | null = null;

    if (paymentMethod === 'PIX') {
      stage = 'fetch_pix_qr';
      try {
        const pixData = await asaasRequest(`/payments/${payment.id}/pixQrCode`, 'GET');
        pixQrCode = pixData?.encodedImage ?? null;
        pixCopyPaste = pixData?.payload ?? null;
      } catch {
        // PIX QR nao disponivel, usuario usara invoiceUrl
      }
    }

    stage = 'insert_payment';
    const { error: paymentError } = await serviceClient.from('asaas_payments').insert({
      user_id: userId,
      asaas_customer_id: customerRowId,
      asaas_payment_id: payment.id,
      payment_type: 'subscription',
      subscription_id: subscriptionRow.id,
      value: totalValue,
      billing_type: paymentMethod,
      status: payment.status?.toLowerCase() ?? 'pending',
      due_date: payment.dueDate ?? paymentPayload.dueDate,
      invoice_url: payment.invoiceUrl ?? null,
      pix_qr_code: pixQrCode ?? null,
      pix_copy_paste: pixCopyPaste ?? null,
      description: paymentPayload.description as string,
      external_reference: externalReference,
      metadata: {
        asaas_payment_id: payment.id,
        base_price: baseTotal,
        discount_rate: discountRate,
        discount_amount: discountAmount,
        final_price: totalValue,
      },
    });

    if (paymentError) {
      await asaasRequest(`/payments/${payment.id}`, 'DELETE').catch(() => null);
      await serviceClient.from('asaas_subscriptions').delete().eq('id', subscriptionRow.id);
      throw new Error('Falha ao salvar pagamento no banco.');
    }

    return new Response(
      JSON.stringify({
        success: true,
        status: 'PENDING',
        paymentId: payment.id,
        subscriptionId: subscriptionRow.id,
        invoiceUrl: payment.invoiceUrl ?? null,
        pixQrCode: pixQrCode ?? null,
        pixCopyPaste: pixCopyPaste ?? null,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    if (serviceClient && userId) {
      try {
        await serviceClient.from('payment_audit_log').insert({
          entity_type: 'plan_payment',
          entity_id: null,
          action: 'process_plan_error',
          performed_by: userId,
          performed_by_type: 'user',
          reason: getErrorMessage(error),
          changes: { stage },
        });
      } catch {
        // silencio para nao mascarar erro principal
      }
    }
    return new Response(
      JSON.stringify({
        success: false,
        message: `Erro ao processar pagamento (etapa: ${stage}). ${getErrorMessage(error)}`.trim(),
        stage,
        debug: envFlags(),
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
