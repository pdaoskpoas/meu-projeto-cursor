import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { applyApprovedPaymentEffects, mapPaymentStatus } from '../_shared/asaasPaymentUtils.ts';

// Webhook endpoints should NOT have permissive CORS.
// Asaas sends server-to-server POST requests, not browser requests.
const webhookHeaders = {
  'Content-Type': 'application/json',
};

// For OPTIONS preflight (shouldn't normally happen for webhooks)
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, asaas-access-token',
};

// =================================================================
// WHITELIST DE EVENTOS ACEITOS
// Qualquer evento fora desta lista é rejeitado imediatamente
// =================================================================
const ALLOWED_EVENT_TYPES = new Set([
  'PAYMENT_CREATED',
  'PAYMENT_UPDATED',
  'PAYMENT_CONFIRMED',
  'PAYMENT_RECEIVED',
  'PAYMENT_OVERDUE',
  'PAYMENT_DELETED',
  'PAYMENT_REFUNDED',
  'PAYMENT_REFUND_IN_PROGRESS',
  'PAYMENT_CHARGEBACK_REQUESTED',
  'PAYMENT_CHARGEBACK_DISPUTE',
  'PAYMENT_AWAITING_CHARGEBACK_REVERSAL',
  'PAYMENT_DUNNING_RECEIVED',
  'PAYMENT_DUNNING_REQUESTED',
  'PAYMENT_BANK_SLIP_VIEWED',
  'PAYMENT_CHECKOUT_VIEWED',
  'SUBSCRIPTION_CREATED',
  'SUBSCRIPTION_UPDATED',
  'SUBSCRIPTION_DELETED',
  'SUBSCRIPTION_INACTIVATED',
  'SUBSCRIPTION_ACTIVATED',
  'SUBSCRIPTION_RENEWED',
]);

const buildServiceClient = () => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  return createClient(supabaseUrl, serviceKey);
};

const isApprovedEvent = (eventType?: string) => {
  const normalized = eventType?.toUpperCase() ?? '';
  return ['PAYMENT_CONFIRMED', 'PAYMENT_RECEIVED'].includes(normalized);
};

const isApprovedPaymentPayload = (eventType?: string, paymentStatus?: string) => {
  if (isApprovedEvent(eventType)) return true;
  return mapPaymentStatus(paymentStatus) === 'APPROVED';
};

// =================================================================
// VALIDAÇÃO DE TOKEN
// =================================================================
const validateWebhookToken = (req: Request): boolean => {
  const webhookToken = Deno.env.get('ASAAS_WEBHOOK_TOKEN');
  if (!webhookToken) {
    console.warn('[asaas-webhook] ASAAS_WEBHOOK_TOKEN not configured - rejecting request');
    return false;
  }

  const expectedToken = webhookToken.trim();
  const providedToken =
    req.headers.get('asaas-access-token') ||
    req.headers.get('Asaas-Access-Token');

  if (!providedToken || providedToken.trim() !== expectedToken) {
    console.warn('[asaas-webhook] Invalid or missing token');
    return false;
  }

  return true;
};

// =================================================================
// VALIDAÇÃO DE ESTRUTURA DO PAYLOAD
// Rejeita payloads malformados antes de qualquer processamento
// =================================================================
const validatePayloadStructure = (
  payload: unknown
): { valid: boolean; error?: string } => {
  if (!payload || typeof payload !== 'object') {
    return { valid: false, error: 'Payload não é um objeto válido.' };
  }

  const p = payload as Record<string, unknown>;

  // event deve ser string não-vazia
  if (typeof p.event !== 'string' || !p.event.trim()) {
    return { valid: false, error: 'Campo event ausente ou inválido.' };
  }

  // event deve estar na whitelist
  if (!ALLOWED_EVENT_TYPES.has(p.event)) {
    return { valid: false, error: `Tipo de evento não reconhecido: ${p.event}` };
  }

  // Se tem payment, validar estrutura mínima
  if (p.payment !== undefined && p.payment !== null) {
    if (typeof p.payment !== 'object') {
      return { valid: false, error: 'Campo payment deve ser um objeto.' };
    }
    const payment = p.payment as Record<string, unknown>;
    if (typeof payment.id !== 'string' || !payment.id.trim()) {
      return { valid: false, error: 'payment.id ausente ou inválido.' };
    }
  }

  // Se tem subscription, validar estrutura mínima
  if (p.subscription !== undefined && p.subscription !== null) {
    if (typeof p.subscription !== 'object') {
      return { valid: false, error: 'Campo subscription deve ser um objeto.' };
    }
    const sub = p.subscription as Record<string, unknown>;
    if (typeof sub.id !== 'string' || !sub.id.trim()) {
      return { valid: false, error: 'subscription.id ausente ou inválido.' };
    }
  }

  // Deve ter pelo menos payment ou subscription
  if (!p.payment && !p.subscription) {
    return { valid: false, error: 'Payload sem payment nem subscription.' };
  }

  return { valid: true };
};

// =================================================================
// EXTRAIR IP DO REQUEST (para audit trail)
// =================================================================
const extractRequestIp = (req: Request): string => {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    req.headers.get('cf-connecting-ip') ||
    'unknown'
  );
};

// =================================================================
// IDEMPOTENCY CHECK
// =================================================================
const checkIdempotency = async (
  serviceClient: ReturnType<typeof buildServiceClient>,
  eventType: string,
  paymentId?: string,
  subscriptionId?: string,
  requestIp?: string,
  requestUserAgent?: string
): Promise<{ isDuplicate: boolean; logId?: string }> => {
  const idempotencyKey = `${eventType}:${paymentId || ''}:${subscriptionId || ''}`;

  // Check if this exact event was already processed
  const { data: existing } = await serviceClient
    .from('asaas_webhooks_log')
    .select('id')
    .eq('idempotency_key', idempotencyKey)
    .eq('processed', true)
    .maybeSingle();

  if (existing) {
    return { isDuplicate: true };
  }

  // Insert log entry for this webhook (with IP and user-agent for audit)
  const { data: logEntry, error: logError } = await serviceClient
    .from('asaas_webhooks_log')
    .insert({
      event_type: eventType,
      asaas_payment_id: paymentId || null,
      asaas_subscription_id: subscriptionId || null,
      idempotency_key: idempotencyKey,
      processed: false,
      request_ip: requestIp || null,
      request_user_agent: requestUserAgent || null,
    })
    .select('id')
    .maybeSingle();

  if (logError) {
    // If insert fails due to unique constraint, it's a duplicate
    if (logError.code === '23505') {
      return { isDuplicate: true };
    }
    console.warn('[asaas-webhook] Failed to create log entry:', logError.message);
  }

  return { isDuplicate: false, logId: logEntry?.id };
};

// =================================================================
// MARK WEBHOOK AS PROCESSED
// =================================================================
const markProcessed = async (
  serviceClient: ReturnType<typeof buildServiceClient>,
  logId: string,
  success: boolean,
  errorMessage?: string
) => {
  await serviceClient
    .from('asaas_webhooks_log')
    .update({
      processed: success,
      processed_at: new Date().toISOString(),
      processing_error: errorMessage || null,
    })
    .eq('id', logId)
    .catch(() => null);
};

// =================================================================
// SANITIZE PAYLOAD PARA ARMAZENAMENTO (LGPD)
// Remove dados sensíveis antes de gravar no log
// =================================================================
const sanitizePayloadForStorage = (payload: Record<string, unknown>): Record<string, unknown> => {
  const sanitized = { ...payload };

  // Manter apenas campos essenciais do payment
  if (sanitized.payment && typeof sanitized.payment === 'object') {
    const p = sanitized.payment as Record<string, unknown>;
    sanitized.payment = {
      id: p.id,
      status: p.status,
      value: p.value,
      billingType: p.billingType,
      paymentDate: p.paymentDate,
      confirmedDate: p.confirmedDate,
      dueDate: p.dueDate,
      externalReference: p.externalReference,
    };
  }

  // Manter apenas campos essenciais da subscription
  if (sanitized.subscription && typeof sanitized.subscription === 'object') {
    const s = sanitized.subscription as Record<string, unknown>;
    sanitized.subscription = {
      id: s.id,
      status: s.status,
      nextDueDate: s.nextDueDate,
      cycle: s.cycle,
    };
  }

  // Nunca armazenar dados de cartão vindos do webhook
  delete sanitized.creditCard;
  delete sanitized.creditCardHolderInfo;
  delete sanitized.creditCardToken;

  return sanitized;
};

// =================================================================
// HANDLER PRINCIPAL
// =================================================================
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Only accept POST
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ success: false, message: 'Method not allowed.' }), {
      status: 405,
      headers: webhookHeaders,
    });
  }

  // Validate webhook token (required)
  if (!validateWebhookToken(req)) {
    return new Response(JSON.stringify({ success: false, message: 'Token inválido.' }), {
      status: 401,
      headers: webhookHeaders,
    });
  }

  // Extract request metadata for audit trail
  const requestIp = extractRequestIp(req);
  const requestUserAgent = req.headers.get('user-agent') || 'unknown';

  const serviceClient = buildServiceClient();

  try {
    let payload: unknown;
    try {
      payload = await req.json();
    } catch {
      return new Response(JSON.stringify({ success: false, message: 'JSON inválido.' }), {
        status: 400,
        headers: webhookHeaders,
      });
    }

    // Validate payload structure before any processing
    const validation = validatePayloadStructure(payload);
    if (!validation.valid) {
      console.warn('[asaas-webhook] Payload rejeitado:', validation.error);
      return new Response(JSON.stringify({ success: false, message: validation.error }), {
        status: 400,
        headers: webhookHeaders,
      });
    }

    const p = payload as Record<string, unknown>;
    const eventType = p.event as string;
    const payment = p.payment as Record<string, unknown> | undefined;
    const subscription = p.subscription as Record<string, unknown> | undefined;

    // Idempotency check (with IP and user-agent for audit)
    const { isDuplicate, logId } = await checkIdempotency(
      serviceClient,
      eventType,
      payment?.id as string | undefined,
      subscription?.id as string | undefined,
      requestIp,
      requestUserAgent
    );

    if (isDuplicate) {
      console.log('[webhook] Evento duplicado ignorado:', eventType, payment?.id || subscription?.id);
      return new Response(JSON.stringify({ success: true, message: 'Evento já processado.' }), {
        headers: webhookHeaders,
      });
    }

    if (payment) {
      const paymentId = payment.id as string;
      console.log('[webhook] Evento recebido:', { eventType, paymentId, paymentStatus: payment.status, ip: requestIp });

      const { data: paymentRow, error: paymentRowError } = await serviceClient
        .from('asaas_payments')
        .select(
          'user_id, status, payment_type, related_content_type, related_content_id, subscription_id, metadata, value, billing_type, description, asaas_customer_id'
        )
        .eq('asaas_payment_id', paymentId)
        .maybeSingle();

      if (paymentRowError) {
        console.error('[webhook] Erro ao buscar pagamento:', paymentRowError.message);
        if (logId) await markProcessed(serviceClient, logId, false, paymentRowError.message);
        return new Response(JSON.stringify({ success: false, message: 'Erro ao localizar pagamento.' }), {
          status: 500,
          headers: webhookHeaders,
        });
      }

      if (!paymentRow) {
        console.warn('[webhook] Pagamento NÃO encontrado no DB:', paymentId);
        if (logId) await markProcessed(serviceClient, logId, true, 'Pagamento não encontrado no banco');
        return new Response(JSON.stringify({ success: true, message: 'Pagamento não encontrado no banco.' }), {
          headers: webhookHeaders,
        });
      }

      console.log('[webhook] Pagamento encontrado:', {
        type: paymentRow.payment_type,
        localStatus: paymentRow.status,
        isApproved: isApprovedPaymentPayload(eventType, payment.status as string),
      });

      await serviceClient
        .from('asaas_payments')
        .update({
          status: (payment.status as string)?.toLowerCase() ?? paymentRow.status ?? 'pending',
          payment_date: (payment.paymentDate as string) ?? null,
          confirmed_at: (payment.confirmedDate as string) ?? null,
        })
        .eq('asaas_payment_id', paymentId);

      if (isApprovedPaymentPayload(eventType, payment.status as string)) {
        try {
          console.log('[webhook] Aplicando efeitos para evento aprovado...');
          await applyApprovedPaymentEffects(serviceClient, paymentRow, paymentId);
          console.log('[webhook] Efeitos aplicados com sucesso');
        } catch (effectError) {
          console.error('[webhook] Erro ao aplicar efeitos:', (effectError as Error)?.message);
          if (logId) await markProcessed(serviceClient, logId, false, (effectError as Error)?.message);
          return new Response(
            JSON.stringify({ success: false, message: (effectError as Error)?.message || 'Erro ao aplicar efeitos.' }),
            { status: 500, headers: webhookHeaders }
          );
        }
      }

      if (logId) await markProcessed(serviceClient, logId, true);
      return new Response(JSON.stringify({ success: true }), { headers: webhookHeaders });
    }

    if (subscription) {
      const subscriptionId = subscription.id as string;

      await serviceClient
        .from('asaas_subscriptions')
        .update({
          status: (subscription.status as string)?.toLowerCase() ?? 'pending',
          next_due_date: (subscription.nextDueDate as string) ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq('asaas_subscription_id', subscriptionId);

      const isActive = ['ACTIVE'].includes((subscription.status as string)?.toUpperCase() ?? '');
      if (isActive) {
        const { data: subRow } = await serviceClient
          .from('asaas_subscriptions')
          .select('id, user_id, plan_type, billing_type, expires_at, started_at')
          .eq('asaas_subscription_id', subscriptionId)
          .maybeSingle();

        if (subRow?.plan_type && subRow?.user_id) {
          await serviceClient
            .from('asaas_subscriptions')
            .update({
              status: 'active',
              started_at: subRow.started_at || new Date().toISOString(),
              first_payment_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', subRow.id);

          const { data: profileRow } = await serviceClient
            .from('profiles')
            .select('plan, plan_expires_at')
            .eq('id', subRow.user_id)
            .maybeSingle();

          const needsUpdate =
            profileRow?.plan !== subRow.plan_type ||
            (subRow.expires_at && profileRow?.plan_expires_at !== subRow.expires_at);

          if (needsUpdate) {
            await serviceClient
              .from('profiles')
              .update({
                plan: subRow.plan_type,
                plan_expires_at: subRow.expires_at ?? null,
                plan_purchased_at: subRow.started_at ?? new Date().toISOString(),
                is_annual_plan: subRow.billing_type === 'annual',
                updated_at: new Date().toISOString(),
              })
              .eq('id', subRow.user_id);
          }
        }
      }

      if (logId) await markProcessed(serviceClient, logId, true);
      return new Response(JSON.stringify({ success: true }), { headers: webhookHeaders });
    }

    if (logId) await markProcessed(serviceClient, logId, true);
    return new Response(JSON.stringify({ success: true }), { headers: webhookHeaders });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, message: (error as Error)?.message || 'Erro no webhook.' }), {
      status: 500,
      headers: webhookHeaders,
    });
  }
});
