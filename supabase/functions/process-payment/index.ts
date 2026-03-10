// @ts-expect-error - runtime import resolved by Deno in Edge Functions
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
// @ts-expect-error - runtime import resolved by Deno in Edge Functions
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
  basic: { monthly: 97, semiannual: 97 * 6, annual: 776 },
  pro: { monthly: 147, semiannual: 147 * 6, annual: 882 },
  ultra: { monthly: 247, semiannual: 247 * 6, annual: 1482 },
} as const;

type PlanId = keyof typeof PLAN_PRICES;
type BillingCycle = 'monthly' | 'semiannual' | 'annual';
type PaymentMethod = 'CREDIT_CARD' | 'PIX';

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

interface CardPayload {
  holderName: string;
  number: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
}

interface ProcessPaymentBody {
  userId?: string;
  planId?: string;
  billingCycle?: string;
  paymentMethod?: string;
  customer: CustomerPayload;
  address: AddressPayload;
  card?: CardPayload;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const getString = (value: unknown) => (typeof value === 'string' ? value : '');

const isPlanId = (value: string): value is PlanId => value in PLAN_PRICES;
const isBillingCycle = (value: string): value is BillingCycle =>
  ['monthly', 'semiannual', 'annual'].includes(value);
const isPaymentMethod = (value: string): value is PaymentMethod =>
  ['CREDIT_CARD', 'PIX'].includes(value);

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : String(error ?? 'Erro desconhecido');

const parseProcessPaymentBody = (raw: unknown): ProcessPaymentBody | null => {
  if (!isRecord(raw)) return null;

  const customerRaw = isRecord(raw.customer) ? raw.customer : {};
  const addressRaw = isRecord(raw.address) ? raw.address : {};
  const cardRaw = isRecord(raw.card) ? raw.card : null;

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
    card: cardRaw
      ? {
          holderName: getString(cardRaw.holderName),
          number: getString(cardRaw.number),
          expiryMonth: getString(cardRaw.expiryMonth),
          expiryYear: getString(cardRaw.expiryYear),
          cvv: getString(cardRaw.cvv),
        }
      : undefined,
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
    throw new Error('Configuração do Asaas ausente.');
  }

  const resolvedBaseUrl = normalizeBaseUrl(baseUrl);
  console.log('[plan] asaas request', { endpoint, method, baseUrl: resolvedBaseUrl });
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
    console.error('[plan] asaas error', { endpoint, status: response.status, message });
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

serve(async (req) => {
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
      return new Response(JSON.stringify({ success: false, message: 'JWT inválido ou ausente.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    stage = 'parse_body';
    let body: ProcessPaymentBody | null = null;
    try {
      body = parseProcessPaymentBody(await req.json());
    } catch {
      return new Response(JSON.stringify({ success: false, message: 'Payload inválido.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (!body) {
      return new Response(JSON.stringify({ success: false, message: 'Payload inválido.' }), {
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
      card,
    } = body ?? {};

    userId = typeof bodyUserId === 'string' ? bodyUserId : authData.user.id;
    if (!userId || userId !== authData.user.id) {
      return new Response(JSON.stringify({ success: false, message: 'Usuário inválido.' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    stage = 'validate_payload';
    if (!planId || !isPlanId(planId)) {
      return new Response(JSON.stringify({ success: false, message: 'Plano inválido.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!billingCycle || !isBillingCycle(billingCycle)) {
      return new Response(JSON.stringify({ success: false, message: 'Ciclo de cobrança inválido.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!paymentMethod || !isPaymentMethod(paymentMethod)) {
      return new Response(JSON.stringify({ success: false, message: 'Forma de pagamento inválida.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (paymentMethod === 'PIX' && billingCycle === 'monthly') {
      return new Response(
        JSON.stringify({ success: false, message: 'Para planos mensais, o pagamento disponível é apenas cartão.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!customer.cpfCnpj || !address.postalCode) {
      return new Response(JSON.stringify({ success: false, message: 'Dados obrigatórios ausentes.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const creditCardData = paymentMethod === 'CREDIT_CARD' ? card : undefined;
    if (paymentMethod === 'CREDIT_CARD' && (!creditCardData?.number || !creditCardData?.cvv)) {
      return new Response(JSON.stringify({ success: false, message: 'Dados do cartão inválidos.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const normalizedCpf = sanitizeDigits(customer.cpfCnpj);
    if (!isValidCpf(normalizedCpf)) {
      return new Response(JSON.stringify({ success: false, message: 'CPF inválido.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const normalizedCard =
      paymentMethod === 'CREDIT_CARD' && creditCardData ? sanitizeDigits(creditCardData.number) : '';
    const normalizedPhone = customer.mobilePhone && isValidPhone(customer.mobilePhone)
      ? sanitizeDigits(customer.mobilePhone)
      : undefined;
    const normalizedPostal = sanitizeDigits(address.postalCode);
    const phoneFormatted = normalizedPhone ? formatPhone(normalizedPhone) : undefined;

    console.log('[plan] payload snapshot', {
      paymentMethod,
      billingCycle,
      hasPhone: Boolean(normalizedPhone),
      postalLen: normalizedPostal.length,
    });

    if (!normalizedPhone) {
      return new Response(
        JSON.stringify({ success: false, message: 'WhatsApp inválido. Atualize seus dados.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!normalizedPostal || normalizedPostal.length !== 8) {
      return new Response(
        JSON.stringify({ success: false, message: 'CEP inválido. Atualize seu endereço.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!address.address || !address.addressNumber || !address.province || !address.city || !address.state) {
      return new Response(
        JSON.stringify({ success: false, message: 'Endereço incompleto. Informe rua, número, bairro, cidade e UF.' }),
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
          JSON.stringify({ success: false, message: 'WhatsApp já está em uso por outro usuário.' }),
          { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

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
        notificationDisabled: true,
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
        notificationDisabled: true,
      });
    }

    if (!customerRowId) {
      throw new Error('Cliente não encontrado para cobrança.');
    }

    const prices = PLAN_PRICES[planId];
    const baseTotal = prices[billingCycle];
    const discountRate = paymentMethod === 'PIX' ? 0.03 : 0;
    const discountAmount = Number((baseTotal * discountRate).toFixed(2));
    const totalValue = Number((baseTotal - discountAmount).toFixed(2));
    const subscriptionDurationMonths =
      billingCycle === 'monthly' ? 1 : billingCycle === 'semiannual' ? 6 : 12;
    const installmentCount = subscriptionDurationMonths;
    const installmentValue = Number((baseTotal / installmentCount).toFixed(2));
    const externalReference = `${userId}-${planId}-${Date.now()}`;

    const creditCard = paymentMethod === 'CREDIT_CARD'
      ? {
          holderName: creditCardData!.holderName,
          number: normalizedCard,
          expiryMonth: creditCardData!.expiryMonth,
          expiryYear: creditCardData!.expiryYear,
          ccv: creditCardData!.cvv,
        }
      : null;

    const creditCardHolderInfo = {
      name: customer.name,
      email: customer.email,
      cpfCnpj: normalizedCpf,
      phone: normalizedPhone,
      postalCode: normalizedPostal,
      addressNumber: address.addressNumber,
      address: address.address,
      province: address.province,
      city: address.city,
      complement: address.complement,
      state: address.state,
    };

    if (billingCycle === 'monthly' && paymentMethod === 'CREDIT_CARD') {
      stage = 'create_subscription';
      const subscriptionPayload = {
        customer: asaasCustomerId,
        billingType: 'CREDIT_CARD',
        value: totalValue,
        cycle: 'MONTHLY',
        description: `Assinatura Mensal - Plano ${planId.toUpperCase()}`,
        externalReference,
        creditCard,
        creditCardHolderInfo,
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
          metadata: { asaas_response: subscription },
        })
        .select('id')
        .single();

      if (subscriptionError || !subscriptionRow) {
        await asaasRequest(`/subscriptions/${subscription.id}`, 'DELETE').catch(() => null);
        throw new Error('Falha ao salvar assinatura no banco.');
      }

      // ── Buscar o primeiro pagamento gerado pela assinatura ──
      let firstPaymentId: string | null = subscription?.payment?.id ?? null;
      if (!firstPaymentId) {
        try {
          const paymentsData = await asaasRequest(
            `/subscriptions/${subscription.id}/payments?limit=1`,
            'GET'
          );
          firstPaymentId = paymentsData?.data?.[0]?.id ?? null;
        } catch {
          // Se não conseguir buscar, prossegue sem — o check-payment-status cobre
        }
      }

      // ── Criar registro em asaas_payments para o primeiro pagamento ──
      if (firstPaymentId) {
        stage = 'insert_monthly_payment';
        await serviceClient.from('asaas_payments').insert({
          user_id: userId,
          asaas_customer_id: customerRowId,
          asaas_payment_id: firstPaymentId,
          payment_type: 'subscription',
          subscription_id: subscriptionRow.id,
          value: totalValue,
          billing_type: 'CREDIT_CARD',
          status: 'pending',
          description: `Assinatura Mensal - Plano ${planId.toUpperCase()}`,
          external_reference: externalReference,
          metadata: {
            asaas_response: subscription,
            is_monthly: true,
          },
        });
      }

      return new Response(
        JSON.stringify({
          success: true,
          status: 'PENDING',
          subscriptionId: subscriptionRow.id,
          paymentId: firstPaymentId ?? undefined,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const subscriptionExpiresAt = new Date();
    subscriptionExpiresAt.setMonth(subscriptionExpiresAt.getMonth() + subscriptionDurationMonths);

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

    const paymentDescription =
      billingCycle === 'monthly'
        ? 'Plano Mensal'
        : billingCycle === 'semiannual'
          ? 'Plano Semestral'
          : 'Plano Anual';

    const paymentPayload = {
      customer: asaasCustomerId,
      billingType: paymentMethod,
      value: totalValue,
      description: paymentDescription,
      dueDate: dueDate.toISOString().split('T')[0],
      externalReference,
      installmentCount: paymentMethod === 'CREDIT_CARD' ? installmentCount : undefined,
      installmentValue: paymentMethod === 'CREDIT_CARD' ? installmentValue : undefined,
      creditCard: paymentMethod === 'CREDIT_CARD' ? creditCard : undefined,
      creditCardHolderInfo: paymentMethod === 'CREDIT_CARD' ? creditCardHolderInfo : undefined,
    };

    stage = 'create_payment';
    const payment = await asaasRequest('/payments', 'POST', paymentPayload);
    let pixQrCode: string | null = null;
    let pixCopyPaste: string | null = null;

    if (paymentMethod === 'PIX') {
      stage = 'fetch_pix_qr';
      const pixData = await asaasRequest(`/payments/${payment.id}/pixQrCode`, 'GET');
      pixQrCode = pixData?.encodedImage ?? null;
      pixCopyPaste = pixData?.payload ?? null;
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
      pix_qr_code: pixQrCode ?? payment.encodedImage ?? null,
      pix_copy_paste: pixCopyPaste ?? payment.payload ?? null,
      installment_count: installmentCount,
      description: paymentPayload.description,
      external_reference: externalReference,
      metadata: {
        asaas_response: payment,
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
        pixQrCode: pixQrCode ?? payment.encodedImage ?? null,
        pixCopyPaste: pixCopyPaste ?? payment.payload ?? null,
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
        // silêncio para não mascarar erro principal
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
