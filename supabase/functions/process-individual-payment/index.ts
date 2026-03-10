import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PRICES = {
  animal: 47.0,
  event: 49.99,
} as const;

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
  console.log('[individual] asaas request', { endpoint, method, baseUrl: resolvedBaseUrl });
  const response = await fetch(`${resolvedBaseUrl}${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'access_token': apiKey,
      'User-Agent': 'cavalaria-digital/individual',
    },
    body: data ? JSON.stringify(data) : undefined,
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = payload?.errors?.[0]?.description || payload?.message || 'Erro ao comunicar com Asaas.';
    console.error('[individual] asaas error', { endpoint, status: response.status, message });
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
    let body: Record<string, unknown> | null = null;
    try {
      body = (await req.json()) as Record<string, unknown>;
    } catch {
      return new Response(JSON.stringify({ success: false, message: 'Payload inválido.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const { userId: bodyUserId, contentId, contentType, billingType, customer, address, card } = body ?? {};
    userId = typeof bodyUserId === 'string' ? bodyUserId : authData.user.id;

    if (!userId || userId !== authData.user.id) {
      return new Response(JSON.stringify({ success: false, message: 'Usuário inválido.' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    stage = 'validate_payload';
    if (!contentId || !['animal', 'event'].includes(contentType)) {
      return new Response(JSON.stringify({ success: false, message: 'Conteúdo inválido.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!['PIX', 'CREDIT_CARD'].includes(billingType)) {
      return new Response(JSON.stringify({ success: false, message: 'Forma de pagamento inválida.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const resolvedCustomer = {
      name: customer?.name ?? null,
      email: customer?.email ?? null,
      cpfCnpj: customer?.cpfCnpj ?? null,
      mobilePhone: customer?.mobilePhone ?? null,
    };

    const resolvedAddress = {
      postalCode: address?.postalCode ?? null,
      address: address?.address ?? '',
      addressNumber: address?.addressNumber ?? '',
      complement: address?.complement,
      province: address?.province ?? '',
      city: address?.city ?? null,
      state: address?.state ?? null,
    };

    if (!resolvedCustomer.name || !resolvedCustomer.email || !resolvedCustomer.cpfCnpj) {
      return new Response(
        JSON.stringify({ success: false, message: 'Dados do cliente incompletos. Verifique no checkout.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!resolvedCustomer.mobilePhone) {
      return new Response(
        JSON.stringify({ success: false, message: 'WhatsApp obrigatório. Verifique no checkout.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!resolvedAddress.postalCode || !resolvedAddress.city || !resolvedAddress.state) {
      return new Response(
        JSON.stringify({ success: false, message: 'Endereço incompleto. Verifique no checkout.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!resolvedCustomer.cpfCnpj || !isValidCpf(resolvedCustomer.cpfCnpj)) {
      return new Response(
        JSON.stringify({ success: false, message: 'CPF inválido. Verifique no checkout.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const normalizedPhone = resolvedCustomer.mobilePhone && isValidPhone(resolvedCustomer.mobilePhone)
      ? sanitizeDigits(resolvedCustomer.mobilePhone)
      : undefined;
    const phoneFormatted = normalizedPhone ? formatPhone(normalizedPhone) : undefined;
    const normalizedPostal = resolvedAddress.postalCode ? sanitizeDigits(resolvedAddress.postalCode) : '';

    if (!normalizedPhone) {
      return new Response(
        JSON.stringify({ success: false, message: 'WhatsApp inválido. Verifique no checkout.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!normalizedPostal || normalizedPostal.length !== 8) {
      return new Response(
        JSON.stringify({ success: false, message: 'CEP inválido. Verifique no checkout.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!resolvedAddress.city || !resolvedAddress.state) {
      return new Response(
        JSON.stringify({ success: false, message: 'Cidade e estado são obrigatórios.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!resolvedAddress.address || !resolvedAddress.addressNumber || !resolvedAddress.province) {
      return new Response(
        JSON.stringify({ success: false, message: 'Endereco, numero e bairro sao obrigatorios.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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
        name: resolvedCustomer.name,
        cpfCnpj: sanitizeDigits(resolvedCustomer.cpfCnpj),
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
          cpf_cnpj: sanitizeDigits(resolvedCustomer.cpfCnpj),
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
        cpfCnpj: sanitizeDigits(resolvedCustomer.cpfCnpj),
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
      throw new Error('Cliente não encontrado para cobrança.');
    }

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 3);

    stage = 'create_payment';
    const basePrice = PRICES[contentType as 'animal' | 'event'];
    const discountRate = billingType === 'PIX' ? 0.03 : 0;
    const discountAmount = Number((basePrice * discountRate).toFixed(2));
    const finalPrice = Number((basePrice - discountAmount).toFixed(2));

    const paymentPayload: Record<string, unknown> = {
      customer: asaasCustomerId,
      billingType,
      value: finalPrice,
      description: contentType === 'animal' ? 'Anúncio Individual' : 'Evento Individual',
      dueDate: dueDate.toISOString().split('T')[0],
      externalReference: `${contentType}-${contentId}-${userId}-${Date.now()}`,
    };

    if (billingType === 'CREDIT_CARD') {
      if (!card?.number || !card?.cvv || !card?.holderName) {
        return new Response(
          JSON.stringify({ success: false, message: 'Dados do cartão são obrigatórios.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const normalizedCard = sanitizeDigits(card.number);
      paymentPayload.creditCard = {
        holderName: card.holderName,
        number: normalizedCard,
        expiryMonth: card.expiryMonth,
        expiryYear: card.expiryYear,
        ccv: card.cvv,
      };
      paymentPayload.creditCardHolderInfo = {
        name: resolvedCustomer.name,
        email: resolvedCustomer.email,
        cpfCnpj: sanitizeDigits(resolvedCustomer.cpfCnpj),
        phone: normalizedPhone,
        postalCode: normalizedPostal,
        addressNumber: resolvedAddress.addressNumber,
        address: resolvedAddress.address,
        complement: resolvedAddress.complement,
        province: resolvedAddress.province,
        city: resolvedAddress.city,
        state: resolvedAddress.state,
      };
    }

    const payment = await asaasRequest('/payments', 'POST', paymentPayload);
    let pixQrCode: string | null = null;
    let pixCopyPaste: string | null = null;

    if (billingType === 'PIX') {
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
      payment_type: contentType === 'animal' ? 'individual_ad' : 'individual_event',
      related_content_type: contentType,
      related_content_id: contentId,
      value: finalPrice,
      billing_type: billingType,
      status: payment.status?.toLowerCase() ?? 'pending',
      due_date: payment.dueDate ?? paymentPayload.dueDate,
      invoice_url: payment.invoiceUrl ?? null,
      pix_qr_code: pixQrCode ?? payment.encodedImage ?? null,
      pix_copy_paste: pixCopyPaste ?? payment.payload ?? null,
      description: paymentPayload.description,
      external_reference: paymentPayload.externalReference,
      metadata: {
        content_type: contentType,
        content_id: contentId,
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
        pixQrCode: pixQrCode ?? payment.encodedImage ?? null,
        pixCopyPaste: pixCopyPaste ?? payment.payload ?? null,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    if (serviceClient && userId) {
      try {
        await serviceClient.from('payment_audit_log').insert({
          entity_type: 'individual_payment',
          entity_id: null,
          action: 'process_individual_error',
          performed_by: userId,
          performed_by_type: 'user',
          reason: error?.message || 'Erro desconhecido',
          changes: { stage },
        });
      } catch {
        // silêncio para não mascarar erro principal
      }
    }
    return new Response(
      JSON.stringify({
        success: false,
        message: `Erro ao processar pagamento (etapa: ${stage}). ${error?.message || ''}`.trim(),
        stage,
        debug: envFlags(),
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
