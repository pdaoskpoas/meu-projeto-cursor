/* eslint-disable @typescript-eslint/no-explicit-any */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  applyApprovedPaymentEffects,
  mapPaymentStatus,
} from '../_shared/asaasPaymentUtils.ts';

/**
 * RECONCILE-PAYMENTS — Reconciliação periódica de pagamentos
 *
 * Busca pagamentos localmente PENDING há mais de MIN_AGE_MINUTES,
 * consulta o Asaas para obter o status real, e aplica os efeitos
 * caso o pagamento tenha sido confirmado.
 *
 * Chamado automaticamente via pg_cron a cada 15 minutos.
 * Pode também ser invocado manualmente via POST com service role key.
 */

const BATCH_SIZE = 10;
const MIN_AGE_MINUTES = 15;
const ASAAS_TIMEOUT_MS = 8000;

const normalizeBaseUrl = (baseUrl: string) => {
  const trimmed = baseUrl.replace(/\/+$/, '');
  if (trimmed.endsWith('/api/v3') || trimmed.endsWith('/v3')) return trimmed;
  return `${trimmed}/api/v3`;
};

const asaasGet = async (endpoint: string) => {
  const baseUrl = Deno.env.get('ASAAS_BASE_URL');
  const apiKey = Deno.env.get('ASAAS_API_KEY');
  if (!baseUrl || !apiKey) throw new Error('Configuracao do Asaas ausente.');

  const resolvedBaseUrl = normalizeBaseUrl(baseUrl);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), ASAAS_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${resolvedBaseUrl}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        'access_token': apiKey,
        'User-Agent': 'cavalaria-digital/reconcile',
      },
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('Timeout ao consultar Asaas.');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message =
      payload?.errors?.[0]?.description ||
      payload?.message ||
      `Asaas HTTP ${response.status}`;
    throw new Error(message);
  }
  return payload;
};

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  // Auth: aceitar APENAS service role key (chamado por pg_cron ou admin)
  const authHeader = req.headers.get('Authorization') ?? '';
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

  if (!serviceKey || authHeader !== `Bearer ${serviceKey}`) {
    return new Response(
      JSON.stringify({ success: false, message: 'Nao autorizado.' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceClient = createClient(supabaseUrl, serviceKey);

  const results = {
    checked: 0,
    reconciled: 0,
    errors: 0,
    details: [] as Array<{ paymentId: string; action: string; error?: string }>,
  };

  try {
    // Buscar pagamentos pending criados ha mais de MIN_AGE_MINUTES
    const cutoff = new Date();
    cutoff.setMinutes(cutoff.getMinutes() - MIN_AGE_MINUTES);

    const { data: pendingPayments, error: queryError } = await serviceClient
      .from('asaas_payments')
      .select(
        'asaas_payment_id, user_id, status, payment_type, related_content_type, related_content_id, subscription_id, metadata, value, billing_type, description, asaas_customer_id'
      )
      .eq('status', 'pending')
      .lt('created_at', cutoff.toISOString())
      .order('created_at', { ascending: true })
      .limit(BATCH_SIZE);

    if (queryError) {
      throw new Error(`Erro ao buscar pagamentos: ${queryError.message}`);
    }

    if (!pendingPayments?.length) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Nenhum pagamento pendente para reconciliar.',
          ...results,
        }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[reconcile] Processando ${pendingPayments.length} pagamentos pendentes`);

    for (const paymentRow of pendingPayments) {
      results.checked++;
      const paymentId = paymentRow.asaas_payment_id;

      try {
        const asaasPayment = await asaasGet(`/payments/${paymentId}`);
        const mappedStatus = mapPaymentStatus(asaasPayment?.status);

        if (mappedStatus === 'APPROVED') {
          // Aplicar efeitos primeiro (idempotente), status depois
          await applyApprovedPaymentEffects(serviceClient, paymentRow, paymentId);

          await serviceClient
            .from('asaas_payments')
            .update({
              status: asaasPayment?.status?.toLowerCase() ?? 'confirmed',
              payment_date: asaasPayment?.paymentDate ?? null,
              confirmed_at: asaasPayment?.confirmedDate ?? null,
            })
            .eq('asaas_payment_id', paymentId);

          results.reconciled++;
          results.details.push({ paymentId, action: 'approved_and_applied' });
          console.log(`[reconcile] ${paymentId}: APPROVED — efeitos aplicados`);

        } else if (mappedStatus === 'REJECTED') {
          await serviceClient
            .from('asaas_payments')
            .update({
              status: asaasPayment?.status?.toLowerCase() ?? 'cancelled',
            })
            .eq('asaas_payment_id', paymentId);

          results.reconciled++;
          results.details.push({ paymentId, action: 'rejected_updated' });
          console.log(`[reconcile] ${paymentId}: REJECTED — status atualizado`);

        } else {
          // Ainda pending no Asaas — verificar se venceu
          const dueDate = asaasPayment?.dueDate ? new Date(asaasPayment.dueDate) : null;
          const isOverdue =
            asaasPayment?.status?.toUpperCase() === 'OVERDUE' ||
            (dueDate && dueDate < new Date());

          if (isOverdue) {
            await serviceClient
              .from('asaas_payments')
              .update({ status: 'overdue' })
              .eq('asaas_payment_id', paymentId);

            results.reconciled++;
            results.details.push({ paymentId, action: 'marked_overdue' });
          } else {
            results.details.push({ paymentId, action: 'still_pending' });
          }
        }
      } catch (error) {
        results.errors++;
        const errMsg = (error as Error)?.message ?? 'Erro desconhecido';
        results.details.push({ paymentId, action: 'error', error: errMsg });
        console.error(`[reconcile] ${paymentId}: ERRO — ${errMsg}`);
      }
    }

    console.log('[reconcile] Resultado:', {
      checked: results.checked,
      reconciled: results.reconciled,
      errors: results.errors,
    });

    return new Response(JSON.stringify({ success: true, ...results }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[reconcile] Erro geral:', (error as Error)?.message);
    return new Response(
      JSON.stringify({ success: false, message: (error as Error)?.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
