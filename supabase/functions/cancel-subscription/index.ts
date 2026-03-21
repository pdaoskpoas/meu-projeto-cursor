/**
 * =================================================================
 * CANCEL-SUBSCRIPTION Edge Function (Secure)
 * =================================================================
 *
 * Cancela assinaturas no Asaas SEM expor a API key ao frontend.
 * Toda comunicação com o Asaas ocorre exclusivamente no backend.
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { checkRateLimit } from '../_shared/asaasPaymentUtils.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
      'User-Agent': 'cavalaria-digital/cancel-subscription',
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

  const errorResponse = (status: number, message: string) =>
    new Response(
      JSON.stringify({ success: false, message }),
      { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  try {
    const authHeader = req.headers.get('Authorization');
    const { authClient, serviceClient } = buildSupabaseClients(authHeader);
    const { data: authData, error: authError } = await authClient.auth.getUser();

    if (authError || !authData?.user) {
      return errorResponse(401, 'JWT invalido ou ausente.');
    }

    const userId = authData.user.id;

    let body: Record<string, unknown> | null = null;
    try {
      body = (await req.json()) as Record<string, unknown>;
    } catch {
      return errorResponse(400, 'Payload invalido.');
    }

    const { subscriptionId, reason } = body ?? {};

    if (!subscriptionId || typeof subscriptionId !== 'string') {
      return errorResponse(400, 'ID da assinatura obrigatorio.');
    }

    // Rate limiting: max 3 cancelamentos por 30 minutos por usuário
    const rateLimitResult = await checkRateLimit(serviceClient, userId, 'cancel_subscription', 3, 30);
    if (!rateLimitResult.allowed) {
      return errorResponse(429, rateLimitResult.message || 'Muitas tentativas. Aguarde alguns minutos.');
    }

    if (!reason || typeof reason !== 'string') {
      return errorResponse(400, 'Motivo do cancelamento obrigatorio.');
    }

    // Buscar assinatura no banco
    const { data: subscription, error: fetchError } = await serviceClient
      .from('asaas_subscriptions')
      .select('id, user_id, asaas_subscription_id, status')
      .eq('id', subscriptionId)
      .single();

    if (fetchError || !subscription) {
      return errorResponse(404, 'Assinatura nao encontrada.');
    }

    // Validar que o usuário é dono da assinatura
    if (subscription.user_id !== userId) {
      return errorResponse(403, 'Voce nao tem permissao para cancelar esta assinatura.');
    }

    if (subscription.status === 'cancelled') {
      return errorResponse(400, 'Assinatura ja esta cancelada.');
    }

    // Cancelar no Asaas se tiver ID externo
    if (subscription.asaas_subscription_id) {
      try {
        await asaasRequest(`/subscriptions/${subscription.asaas_subscription_id}`, 'DELETE');
      } catch (asaasError) {
        // Log mas não falha - pode já estar cancelada no Asaas
        console.error('Erro ao cancelar no Asaas (continuando):', (asaasError as Error)?.message);
      }
    }

    // Atualizar no banco
    const { error: updateError } = await serviceClient
      .from('asaas_subscriptions')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancellation_reason: reason,
        auto_renew: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscriptionId);

    if (updateError) {
      throw new Error('Falha ao atualizar assinatura no banco.');
    }

    // Registrar no audit log
    await serviceClient.from('payment_audit_log').insert({
      entity_type: 'subscription',
      entity_id: subscriptionId,
      action: 'cancel_subscription',
      performed_by: userId,
      performed_by_type: 'user',
      reason,
      changes: {
        previous_status: subscription.status,
        new_status: 'cancelled',
        asaas_subscription_id: subscription.asaas_subscription_id,
      },
    }).catch(() => null);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Assinatura cancelada com sucesso. Voce podera usar os beneficios ate o fim do periodo pago.',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return errorResponse(500, `Erro ao cancelar assinatura. ${(error as Error)?.message || ''}`.trim());
  }
});
