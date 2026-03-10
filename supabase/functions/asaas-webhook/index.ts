import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { applyApprovedPaymentEffects } from '../_shared/asaasPaymentUtils.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const buildServiceClient = () => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  return createClient(supabaseUrl, serviceKey);
};

const isApprovedEvent = (eventType?: string) => {
  const normalized = eventType?.toUpperCase() ?? '';
  return ['PAYMENT_CONFIRMED', 'PAYMENT_RECEIVED'].includes(normalized);
};


serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const webhookToken = Deno.env.get('ASAAS_WEBHOOK_TOKEN');
  if (webhookToken) {
    const expectedToken = webhookToken.trim();
    const providedToken =
      req.headers.get('asaas-access-token') ||
      req.headers.get('Asaas-Access-Token') ||
      req.headers.get('access_token');

    if (!providedToken || providedToken.trim() !== expectedToken) {
      console.warn('[asaas-webhook] Unauthorized request', {
        hasProvidedToken: Boolean(providedToken),
        providedLength: providedToken?.length ?? 0,
        expectedLength: expectedToken.length,
      });
      return new Response(JSON.stringify({ success: false, message: 'Token inválido.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }

  const serviceClient = buildServiceClient();

  try {
    const payload = await req.json();
    const eventType = payload?.event;
    const payment = payload?.payment;
    const subscription = payload?.subscription;

    if (!payment && !subscription) {
      return new Response(JSON.stringify({ success: false, message: 'Payload inválido.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (payment) {
      const paymentId = payment.id;
      console.log('[webhook] Evento recebido:', { eventType, paymentId, paymentStatus: payment.status });

      if (!paymentId) {
        return new Response(JSON.stringify({ success: false, message: 'Pagamento inválido.' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: paymentRow, error: paymentRowError } = await serviceClient
        .from('asaas_payments')
        .select(
          'user_id, status, payment_type, related_content_type, related_content_id, subscription_id, metadata, value, billing_type, description, asaas_customer_id'
        )
        .eq('asaas_payment_id', paymentId)
        .maybeSingle();

      if (paymentRowError) {
        console.error('[webhook] Erro ao buscar pagamento:', paymentRowError.message);
        return new Response(JSON.stringify({ success: false, message: 'Erro ao localizar pagamento.' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (!paymentRow) {
        console.warn('[webhook] Pagamento NÃO encontrado no DB:', paymentId);
        return new Response(JSON.stringify({ success: true, message: 'Pagamento não encontrado no banco.' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log('[webhook] Pagamento encontrado:', {
        type: paymentRow.payment_type,
        localStatus: paymentRow.status,
        isApproved: isApprovedEvent(eventType),
      });

      await serviceClient
        .from('asaas_payments')
        .update({
          status: payment.status?.toLowerCase() ?? paymentRow.status ?? 'pending',
          payment_date: payment.paymentDate ?? null,
          confirmed_at: payment.confirmedDate ?? null,
        })
        .eq('asaas_payment_id', paymentId);

      if (isApprovedEvent(eventType)) {
        try {
          console.log('[webhook] Aplicando efeitos para evento aprovado...');
          await applyApprovedPaymentEffects(serviceClient, paymentRow, paymentId);
          console.log('[webhook] ✅ Efeitos aplicados com sucesso');
        } catch (effectError) {
          console.error('[webhook] ❌ Erro ao aplicar efeitos:', effectError?.message);
          return new Response(
            JSON.stringify({ success: false, message: effectError?.message || 'Erro ao aplicar efeitos.' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      } else {
        console.log('[webhook] Evento não é aprovação, nenhum efeito aplicado');
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (subscription) {
      const subscriptionId = subscription.id;
      if (!subscriptionId) {
        return new Response(JSON.stringify({ success: false, message: 'Assinatura inválida.' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      await serviceClient
        .from('asaas_subscriptions')
        .update({
          status: subscription.status?.toLowerCase() ?? 'pending',
          next_due_date: subscription.nextDueDate ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq('asaas_subscription_id', subscriptionId);

      // ── Ativar plano no perfil quando assinatura fica ativa ──
      const isActive = ['ACTIVE'].includes(subscription.status?.toUpperCase() ?? '');
      if (isActive) {
        const { data: subRow } = await serviceClient
          .from('asaas_subscriptions')
          .select('id, user_id, plan_type, billing_type, expires_at, started_at')
          .eq('asaas_subscription_id', subscriptionId)
          .maybeSingle();

        if (subRow?.plan_type && subRow?.user_id) {
          // Garantir que a assinatura está marcada como ativa com datas
          await serviceClient
            .from('asaas_subscriptions')
            .update({
              status: 'active',
              started_at: subRow.started_at || new Date().toISOString(),
              first_payment_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', subRow.id);

          // Atualizar perfil do usuário com o plano
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

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, message: error?.message || 'Erro no webhook.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
