/**
 * =================================================================
 * PROCESS-BOOST-PAYMENT Edge Function (Secure)
 * =================================================================
 *
 * Cria cobranças de Turbinar no Asaas SEM manipular dados de cartão.
 * O pagamento é feito exclusivamente via checkout hospedado (invoiceUrl).
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { checkRateLimit } from '../_shared/asaasPaymentUtils.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BOOST_TIERS: Record<string, { hours: number; price: number; label: string }> = {
  '24h': { hours: 24, price: 19.90, label: '24 horas' },
  '3d':  { hours: 72, price: 49.90, label: '3 dias' },
  '7d':  { hours: 168, price: 89.90, label: '7 dias' },
};

const VALID_DURATIONS = Object.keys(BOOST_TIERS);

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
      'User-Agent': 'cavalaria-digital/boosts',
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
  let authUserId: string | undefined;
  let serviceClient: ReturnType<typeof buildSupabaseClients>['serviceClient'] | undefined;

  const errorResponse = (status: number, message: string) =>
    new Response(
      JSON.stringify({
        success: false,
        message,
        stage,
        debug: envFlags(),
      }),
      { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  try {
    const authHeader = req.headers.get('Authorization');
    const clients = buildSupabaseClients(authHeader);
    const { authClient } = clients;
    serviceClient = clients.serviceClient;
    const { data: authData, error: authError } = await authClient.auth.getUser();

    if (authError || !authData?.user) {
      return errorResponse(401, 'JWT invalido ou ausente.');
    }

    stage = 'parse_body';
    authUserId = authData.user.id;
    userId = authUserId;

    let body: Record<string, unknown> | null = null;
    try {
      body = (await req.json()) as Record<string, unknown>;
    } catch {
      return errorResponse(400, 'Payload invalido.');
    }

    // card removido do destructuring - dados de cartao NUNCA aceitos
    const { userId: bodyUserId, duration, billingType, customer, address, animalId } = body ?? {};
    userId = typeof bodyUserId === 'string' ? bodyUserId : authUserId;

    if (!userId || userId !== authUserId) {
      return errorResponse(403, 'Usuario invalido.');
    }

    // Rate limiting: max 10 boosts por 10 minutos por usuário
    stage = 'rate_limit';
    const rateLimitResult = await checkRateLimit(serviceClient, userId, 'process_boost_payment', 10, 10);
    if (!rateLimitResult.allowed) {
      return errorResponse(429, rateLimitResult.message || 'Muitas tentativas. Aguarde alguns minutos.');
    }

    stage = 'validate_payload';

    const durationStr = String(duration || '');
    if (!VALID_DURATIONS.includes(durationStr)) {
      return errorResponse(400, `Duracao invalida. Opcoes: ${VALID_DURATIONS.join(', ')}`);
    }

    const tier = BOOST_TIERS[durationStr];

    if (!['PIX', 'CREDIT_CARD', 'BOLETO'].includes(billingType as string)) {
      return errorResponse(400, 'Forma de pagamento invalida.');
    }

    const resolvedCustomer = {
      name: (customer as Record<string, unknown>)?.name ?? null,
      email: (customer as Record<string, unknown>)?.email ?? null,
      cpfCnpj: (customer as Record<string, unknown>)?.cpfCnpj ?? null,
      mobilePhone: (customer as Record<string, unknown>)?.mobilePhone ?? null,
    };

    const resolvedAddress = {
      postalCode: (address as Record<string, unknown>)?.postalCode ?? null,
      address: (address as Record<string, unknown>)?.address ?? '',
      addressNumber: (address as Record<string, unknown>)?.addressNumber ?? '',
      complement: (address as Record<string, unknown>)?.complement,
      province: (address as Record<string, unknown>)?.province ?? '',
      city: (address as Record<string, unknown>)?.city ?? null,
      state: (address as Record<string, unknown>)?.state ?? null,
    };

    if (!resolvedCustomer.name || !resolvedCustomer.email || !resolvedCustomer.cpfCnpj) {
      return errorResponse(400, 'Dados do cliente incompletos. Verifique no checkout.');
    }

    if (!resolvedCustomer.mobilePhone) {
      return errorResponse(400, 'WhatsApp obrigatorio. Verifique no checkout.');
    }

    if (!resolvedAddress.postalCode || !resolvedAddress.city || !resolvedAddress.state) {
      return errorResponse(400, 'Endereco incompleto. Verifique no checkout.');
    }

    if (!resolvedCustomer.cpfCnpj || !isValidCpf(String(resolvedCustomer.cpfCnpj))) {
      return errorResponse(400, 'CPF invalido. Verifique no checkout.');
    }

    const normalizedPhone = resolvedCustomer.mobilePhone && isValidPhone(String(resolvedCustomer.mobilePhone))
      ? sanitizeDigits(String(resolvedCustomer.mobilePhone))
      : undefined;
    const phoneFormatted = normalizedPhone ? formatPhone(normalizedPhone) : undefined;
    const normalizedPostal = resolvedAddress.postalCode ? sanitizeDigits(String(resolvedAddress.postalCode)) : '';

    if (!normalizedPhone) {
      return errorResponse(400, 'WhatsApp invalido. Verifique no checkout.');
    }

    if (!normalizedPostal || normalizedPostal.length !== 8) {
      return errorResponse(400, 'CEP invalido. Verifique no checkout.');
    }

    if (!resolvedAddress.city || !resolvedAddress.state) {
      return errorResponse(400, 'Cidade e estado sao obrigatorios.');
    }

    if (!resolvedAddress.address || !resolvedAddress.addressNumber || !resolvedAddress.province) {
      return errorResponse(400, 'Endereco, numero e bairro sao obrigatorios.');
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
        name: resolvedCustomer.name,
        cpfCnpj: sanitizeDigits(String(resolvedCustomer.cpfCnpj)),
        email: resolvedCustomer.email,
        mobilePhone: normalizedPhone,
        postalCode: normalizedPostal,
        address: resolvedAddress.address,
        addressNumber: resolvedAddress.addressNumber,
        complement: resolvedAddress.complement,
        province: resolvedAddress.province,
        city: resolvedAddress.city,
        state: resolvedAddress.state,
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
          name: resolvedCustomer.name,
          email: resolvedCustomer.email,
          cpf_cnpj: sanitizeDigits(String(resolvedCustomer.cpfCnpj)),
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
        name: resolvedCustomer.name,
        cpfCnpj: sanitizeDigits(String(resolvedCustomer.cpfCnpj)),
        email: resolvedCustomer.email,
        mobilePhone: normalizedPhone,
        postalCode: normalizedPostal,
        address: resolvedAddress.address,
        addressNumber: resolvedAddress.addressNumber,
        complement: resolvedAddress.complement,
        province: resolvedAddress.province,
        city: resolvedAddress.city,
        state: resolvedAddress.state,
        externalReference: userId,
        notificationDisabled: true,
      });
    }

    if (!customerRowId || !asaasCustomerId) {
      throw new Error('Cliente nao encontrado para cobranca.');
    }

    // ── Verificar pagamento pendente duplicado (idempotência) ──

    stage = 'check_existing_payment';
    const boostRef = `PB|${userId}|${durationStr}|${animalId || ''}`;

    const { data: existingBoost } = await serviceClient
      .from('asaas_payments')
      .select('asaas_payment_id, invoice_url, pix_qr_code, pix_copy_paste')
      .eq('external_reference', boostRef)
      .eq('status', 'pending')
      .limit(1)
      .maybeSingle();

    if (existingBoost?.asaas_payment_id && existingBoost?.invoice_url) {
      console.log('[boost] Retornando pagamento pendente existente:', existingBoost.asaas_payment_id);
      return new Response(
        JSON.stringify({
          success: true,
          paymentId: existingBoost.asaas_payment_id,
          invoiceUrl: existingBoost.invoice_url,
          pixQrCode: existingBoost.pix_qr_code ?? null,
          pixCopyPaste: existingBoost.pix_copy_paste ?? null,
          recovered: true,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ── Criar pagamento SEM dados de cartao ──

    stage = 'create_payment';
    const basePrice = tier.price;
    const discountRate = billingType === 'PIX' ? 0.03 : 0;
    const discountAmount = Number((basePrice * discountRate).toFixed(2));
    const finalPrice = Number((basePrice - discountAmount).toFixed(2));
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 3);

    // Payload SEM creditCard / creditCardHolderInfo
    const paymentPayload: Record<string, unknown> = {
      customer: asaasCustomerId,
      billingType,
      value: finalPrice,
      description: `Turbinar ${tier.label}`,
      dueDate: dueDate.toISOString().split('T')[0],
      externalReference: boostRef,
    };

    const payment = await asaasRequest('/payments', 'POST', paymentPayload);
    let pixQrCode: string | null = null;
    let pixCopyPaste: string | null = null;

    if (billingType === 'PIX') {
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
      payment_type: 'boost_purchase',
      value: finalPrice,
      billing_type: billingType as string,
      status: payment.status?.toLowerCase() ?? 'pending',
      due_date: payment.dueDate ?? paymentPayload.dueDate,
      invoice_url: payment.invoiceUrl ?? null,
      bank_slip_url: payment.bankSlipUrl ?? null,
      pix_qr_code: pixQrCode ?? null,
      pix_copy_paste: pixCopyPaste ?? null,
      description: paymentPayload.description as string,
      external_reference: paymentPayload.externalReference as string,
      metadata: {
        boost_duration: durationStr,
        boost_hours: tier.hours,
        boost_price: tier.price,
        animal_id: animalId || null,
        base_price: basePrice,
        discount_rate: discountRate,
        discount_amount: discountAmount,
        final_price: finalPrice,
      },
    });

    if (paymentError) {
      await asaasRequest(`/payments/${payment.id}`, 'DELETE').catch(() => null);
      throw new Error('Falha ao salvar pagamento no banco.');
    }

    return new Response(
      JSON.stringify({
        success: true,
        paymentId: payment.id,
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
          entity_type: 'boost_payment',
          entity_id: null,
          action: 'process_boost_error',
          performed_by: userId,
          performed_by_type: 'user',
          reason: (error as Error)?.message || 'Erro desconhecido',
          changes: { stage },
        });
      } catch {
        // silencio para nao mascarar erro principal
      }
    }
    return errorResponse(500, `Erro ao processar pagamento (etapa: ${stage}). ${(error as Error)?.message || ''}`.trim());
  }
});
