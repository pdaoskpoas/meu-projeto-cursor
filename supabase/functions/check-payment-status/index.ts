/* eslint-disable @typescript-eslint/no-explicit-any */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  applyApprovedPaymentEffects,
  mapPaymentStatus,
  mapSubscriptionStatus,
} from '../_shared/asaasPaymentUtils.ts';

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

const asaasRequest = async (endpoint: string, timeoutMs = 8000) => {
  const baseUrl = Deno.env.get('ASAAS_BASE_URL');
  const apiKey = Deno.env.get('ASAAS_API_KEY');

  if (!baseUrl || !apiKey) {
    throw new Error('Configuração do Asaas ausente.');
  }

  const resolvedBaseUrl = normalizeBaseUrl(baseUrl);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(`${resolvedBaseUrl}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        'access_token': apiKey,
        'User-Agent': 'cavalaria-digital/checkout',
      },
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('Tempo esgotado ao consultar o Asaas.');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = payload?.errors?.[0]?.description || payload?.message || 'Erro ao comunicar com Asaas.';
    throw new Error(message);
  }
  return payload;
};

const activateSubscriptionOnProfile = async (
  serviceClient: any,
  subscriptionRow: Record<string, any>,
  subscriptionId: string
) => {
  // Ativar a assinatura se ainda não estiver ativa
  await serviceClient
    .from('asaas_subscriptions')
    .update({
      status: 'active',
      started_at: subscriptionRow.started_at || new Date().toISOString(),
      first_payment_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', subscriptionId);

  // Atualizar o plano no perfil do usuário
  if (subscriptionRow.plan_type && subscriptionRow.user_id) {
    const { data: profileRow } = await serviceClient
      .from('profiles')
      .select('plan, plan_expires_at')
      .eq('id', subscriptionRow.user_id)
      .maybeSingle();

    const needsUpdate =
      profileRow?.plan !== subscriptionRow.plan_type ||
      (subscriptionRow.expires_at && profileRow?.plan_expires_at !== subscriptionRow.expires_at);

    if (needsUpdate) {
      await serviceClient
        .from('profiles')
        .update({
          plan: subscriptionRow.plan_type,
          plan_expires_at: subscriptionRow.expires_at ?? null,
          plan_purchased_at: subscriptionRow.started_at ?? new Date().toISOString(),
          is_annual_plan: subscriptionRow.billing_type === 'annual',
          updated_at: new Date().toISOString(),
        })
        .eq('id', subscriptionRow.user_id);
    }
  }
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    const { authClient, serviceClient } = buildSupabaseClients(authHeader);
    const { data: authData, error: authError } = await authClient.auth.getUser();

    if (authError || !authData?.user) {
      return new Response(JSON.stringify({ success: false, message: 'JWT inválido ou ausente.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const { paymentId, subscriptionId } = body ?? {};

    if (!paymentId && !subscriptionId) {
      return new Response(JSON.stringify({ success: false, message: 'Informe o pagamento ou assinatura.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (paymentId) {
      console.log('[check-status] Buscando pagamento:', paymentId);

      const { data: paymentRow, error: paymentRowError } = await serviceClient
        .from('asaas_payments')
        .select(
          'user_id, status, payment_type, related_content_type, related_content_id, subscription_id, metadata, value, billing_type, description, asaas_customer_id'
        )
        .eq('asaas_payment_id', paymentId)
        .maybeSingle();

      if (paymentRowError) {
        console.error('[check-status] Erro ao buscar pagamento no DB:', paymentRowError.message);
        return new Response(JSON.stringify({ success: false, message: 'Erro ao buscar pagamento.' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (!paymentRow) {
        console.warn('[check-status] Pagamento NÃO encontrado no DB:', paymentId);
        return new Response(JSON.stringify({ success: false, message: 'Pagamento não encontrado.' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log('[check-status] Pagamento encontrado:', {
        type: paymentRow.payment_type,
        localStatus: paymentRow.status,
        userId: paymentRow.user_id,
      });

      if (paymentRow.user_id && paymentRow.user_id !== authData.user.id) {
        console.warn('[check-status] userId mismatch:', { row: paymentRow.user_id, auth: authData.user.id });
        return new Response(JSON.stringify({ success: false, message: 'Pagamento inválido.' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      let payment: { status?: string; paymentDate?: string; confirmedDate?: string } | null = null;
      let mappedStatus: 'APPROVED' | 'REJECTED' | 'PENDING' = 'PENDING';
      try {
        console.log('[check-status] Consultando Asaas API...');
        payment = await asaasRequest(`/payments/${paymentId}`);
        mappedStatus = mapPaymentStatus(payment?.status);
        console.log('[check-status] Asaas API retornou:', { asaasStatus: payment?.status, mapped: mappedStatus });
      } catch (error) {
        console.error('[check-status] Falha na API Asaas:', error?.message);
        const localStatus = mapPaymentStatus(paymentRow?.status);
        console.log('[check-status] Usando status local:', { rawStatus: paymentRow?.status, mapped: localStatus });
        if (localStatus !== 'PENDING') {
          if (localStatus === 'APPROVED') {
            try {
              await applyApprovedPaymentEffects(serviceClient, paymentRow, paymentId);
              console.log('[check-status] Efeitos aplicados via status local');
            } catch (applyError) {
              console.error('[check-status] Erro ao aplicar efeitos:', applyError?.message);
              return new Response(
                JSON.stringify({
                  success: false,
                  message: applyError?.message || 'Pagamento confirmado, mas não foi possível aplicar os benefícios.',
                }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
              );
            }
          }
          return new Response(JSON.stringify({ success: true, status: localStatus }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        return new Response(
          JSON.stringify({
            success: true,
            status: localStatus,
            message: error?.message || 'Não foi possível consultar o status do Asaas.',
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      await serviceClient
        .from('asaas_payments')
        .update({
          status: payment?.status?.toLowerCase() ?? 'pending',
          payment_date: payment?.paymentDate ?? null,
          confirmed_at: payment?.confirmedDate ?? null,
        })
        .eq('asaas_payment_id', paymentId);

      if (mappedStatus === 'APPROVED' && paymentRow) {
        try {
          console.log('[check-status] Aplicando efeitos para pagamento APPROVED...');
          await applyApprovedPaymentEffects(serviceClient, paymentRow, paymentId);
          console.log('[check-status] ✅ Efeitos aplicados com sucesso');
        } catch (error) {
          console.error('[check-status] ❌ Erro ao aplicar efeitos:', error?.message);
          return new Response(
            JSON.stringify({
              success: false,
              message: error?.message || 'Pagamento confirmado, mas não foi possível aplicar os benefícios.',
            }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      console.log('[check-status] Retornando:', { success: true, status: mappedStatus });
      return new Response(JSON.stringify({ success: true, status: mappedStatus }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: subscriptionRow } = await serviceClient
      .from('asaas_subscriptions')
      .select('user_id, asaas_subscription_id, status, plan_type, billing_type, expires_at, started_at')
      .eq('id', subscriptionId)
      .single();

    if (subscriptionRow?.user_id && subscriptionRow.user_id !== authData.user.id) {
      return new Response(JSON.stringify({ success: false, message: 'Assinatura inválida.' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!subscriptionRow?.asaas_subscription_id) {
      return new Response(
        JSON.stringify({ success: true, status: 'PENDING', message: 'Assinatura aguardando confirmação.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let subscription: { status?: string; nextDueDate?: string } | null = null;
    let mappedStatus: 'APPROVED' | 'REJECTED' | 'PENDING' = 'PENDING';
    try {
      subscription = await asaasRequest(`/subscriptions/${subscriptionRow.asaas_subscription_id}`);
      mappedStatus = mapSubscriptionStatus(subscription?.status);
    } catch (error) {
      const localStatus = mapSubscriptionStatus(subscriptionRow?.status);
      if (localStatus !== 'PENDING') {
        if (localStatus === 'APPROVED') {
          await activateSubscriptionOnProfile(serviceClient, subscriptionRow, subscriptionId);
        }
        return new Response(JSON.stringify({ success: true, status: localStatus }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      return new Response(
        JSON.stringify({
          success: true,
          status: localStatus,
          message: error?.message || 'Não foi possível consultar o status do Asaas.',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    await serviceClient
      .from('asaas_subscriptions')
      .update({
        status: subscription?.status?.toLowerCase() ?? 'pending',
        next_due_date: subscription?.nextDueDate ?? null,
      })
      .eq('id', subscriptionId);

    // ── Ativar assinatura e plano no perfil quando APPROVED ──
    if (mappedStatus === 'APPROVED') {
      await activateSubscriptionOnProfile(serviceClient, subscriptionRow, subscriptionId);
    }

    return new Response(JSON.stringify({ success: true, status: mappedStatus }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        message: error?.message || 'Erro ao consultar status.',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
