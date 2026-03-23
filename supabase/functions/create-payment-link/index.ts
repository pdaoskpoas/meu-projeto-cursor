/**
 * =================================================================
 * CREATE-PAYMENT-LINK Edge Function
 * =================================================================
 *
 * Cria um Payment Link no Asaas para que o usuario seja redirecionado
 * ao checkout 100% hospedado do Asaas.
 *
 * Nenhum dado pessoal (CPF, nome, endereco, telefone) trafega por aqui.
 * O Asaas coleta tudo diretamente no checkout hospedado.
 *
 * O vinculo entre pagamento e usuario e feito via externalReference.
 */
// @ts-expect-error - runtime import resolved by Deno in Edge Functions
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
// @ts-expect-error - runtime import resolved by Deno in Edge Functions
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ── Rate limit (inline para deploy independente) ──
// deno-lint-ignore no-explicit-any
const checkRateLimit = async (
  serviceClient: any,
  userId: string,
  operation: string,
  maxAttempts = 5,
  windowMinutes = 10
): Promise<{ allowed: boolean; message?: string }> => {
  const { data, error } = await serviceClient.rpc('check_rate_limit', {
    identifier: userId,
    operation,
    max_attempts: maxAttempts,
    window_minutes: windowMinutes,
  });
  if (error) {
    console.error('[rate-limit] Erro ao verificar rate limit:', error.message);
    return { allowed: true };
  }
  return { allowed: data?.allowed ?? true, message: data?.message ?? undefined };
};

declare const Deno: {
  env: { get: (key: string) => string | undefined };
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ── Precos (fonte unica de verdade para o backend) ──

const PLAN_PRICES = {
  essencial: { monthly: 39.90, annual: 399.00 },
  criador: { monthly: 97.90, annual: 997.00 },
  haras: { monthly: 197.90, annual: 1997.00 },
  elite: { monthly: 397.90, annual: 3997.00 },
} as const;

const PLAN_NAMES: Record<string, string> = {
  essencial: 'Essencial',
  criador: 'Criador',
  haras: 'Haras Destaque',
  elite: 'Elite',
};

const BOOST_PRICES: Record<string, number> = {
  '24h': 19.90,
  '3d': 49.90,
  '7d': 89.90,
};

const BOOST_LABELS: Record<string, string> = {
  '24h': '24 horas',
  '3d': '3 dias',
  '7d': '7 dias',
};

type PlanId = keyof typeof PLAN_PRICES;
type BillingCycle = 'monthly' | 'annual';

const isPlanId = (v: string): v is PlanId => v in PLAN_PRICES;
const isBillingCycle = (v: string): v is BillingCycle => ['monthly', 'annual'].includes(v);

// ── Asaas API helper ──

const normalizeBaseUrl = (baseUrl: string) => {
  const trimmed = baseUrl.replace(/\/+$/, '');
  if (trimmed.endsWith('/api/v3') || trimmed.endsWith('/v3')) return trimmed;
  return `${trimmed}/api/v3`;
};

const asaasRequest = async (endpoint: string, method: string, data?: unknown) => {
  const baseUrl = Deno.env.get('ASAAS_BASE_URL');
  const apiKey = Deno.env.get('ASAAS_API_KEY');
  if (!baseUrl || !apiKey) throw new Error('Configuracao do Asaas ausente.');

  const resolvedBaseUrl = normalizeBaseUrl(baseUrl);
  const response = await fetch(`${resolvedBaseUrl}${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      access_token: apiKey,
      'User-Agent': 'cavalaria-digital/payment-link',
    },
    body: data ? JSON.stringify(data) : undefined,
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message =
      payload?.errors?.[0]?.description || payload?.message || 'Erro ao comunicar com Asaas.';
    throw new Error(message);
  }
  return payload;
};

// ── Error helper ──
const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Erro desconhecido.';

// ── Handler ──

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ success: false, message: 'Method not allowed.' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    // ── Autenticar usuario ──
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const siteUrl = Deno.env.get('SITE_URL') || Deno.env.get('FRONTEND_URL') || '';

    const authHeader = req.headers.get('Authorization') ?? '';
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const serviceClient = createClient(supabaseUrl, serviceKey);

    const { data: { user }, error: authError } = await authClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, message: 'Nao autenticado.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ── Parse body ──
    const body = await req.json().catch(() => ({}));
    const { purchaseType, planId, billingCycle, boostDuration, animalId } = body as {
      purchaseType?: string;
      planId?: string;
      billingCycle?: string;
      boostDuration?: string;
      animalId?: string;
    };

    const userId = user.id;

    // ── Rate limit ──
    const rl = await checkRateLimit(serviceClient, userId, 'create_payment_link', 10, 10);
    if (!rl.allowed) {
      return new Response(
        JSON.stringify({ success: false, message: rl.message || 'Limite de tentativas atingido.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ── Montar payload do Payment Link conforme tipo de compra ──

    let linkPayload: Record<string, unknown>;
    let externalReference: string;

    if (purchaseType === 'boost') {
      // ── BOOST (turbinar) ──
      if (!boostDuration || !(boostDuration in BOOST_PRICES)) {
        return new Response(
          JSON.stringify({ success: false, message: 'Duracao de boost invalida.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const price = BOOST_PRICES[boostDuration];
      // Formato compacto: B|userId|duration|animalId (max 100 chars)
      externalReference = `B|${userId}|${boostDuration}|${animalId || ''}`;

      linkPayload = {
        name: `Turbinar ${BOOST_LABELS[boostDuration]} - Cavalaria Digital`,
        description: `Turbinar anuncio por ${BOOST_LABELS[boostDuration]}`,
        value: price,
        billingType: 'UNDEFINED',
        chargeType: 'DETACHED',
        dueDateLimitDays: 3,
        maxInstallmentCount: 1,
        notificationEnabled: true,
        externalReference,
        ...(siteUrl && {
          callback: {
            successUrl: `${siteUrl}/dashboard?payment=boost_success`,
            autoRedirect: true,
          },
        }),
      };
    } else {
      // ── PLANO (subscription) ──
      if (!planId || !isPlanId(planId)) {
        return new Response(
          JSON.stringify({ success: false, message: 'Plano invalido.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!billingCycle || !isBillingCycle(billingCycle)) {
        return new Response(
          JSON.stringify({ success: false, message: 'Ciclo de cobranca invalido.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const price = PLAN_PRICES[planId][billingCycle];
      const planName = PLAN_NAMES[planId] || planId;

      // Formato compacto: P|userId|planId|billingCycle (max 100 chars)
      externalReference = `P|${userId}|${planId}|${billingCycle}`;

      if (billingCycle === 'monthly') {
        // Assinatura mensal recorrente
        linkPayload = {
          name: `Plano ${planName} Mensal - Cavalaria Digital`,
          description: `Assinatura mensal do plano ${planName}`,
          value: price,
          billingType: 'UNDEFINED',
          chargeType: 'RECURRENT',
          subscriptionCycle: 'MONTHLY',
          dueDateLimitDays: 3,
          maxInstallmentCount: 1,
          notificationEnabled: true,
          externalReference,
          ...(siteUrl && {
            callback: {
              successUrl: `${siteUrl}/dashboard?payment=plan_success`,
              autoRedirect: true,
            },
          }),
        };
      } else {
        // Pagamento unico anual
        linkPayload = {
          name: `Plano ${planName} Anual - Cavalaria Digital`,
          description: `Pagamento anual do plano ${planName}`,
          value: price,
          billingType: 'UNDEFINED',
          chargeType: 'DETACHED',
          dueDateLimitDays: 3,
          maxInstallmentCount: 12,
          notificationEnabled: true,
          externalReference,
          ...(siteUrl && {
            callback: {
              successUrl: `${siteUrl}/dashboard?payment=plan_success`,
              autoRedirect: true,
            },
          }),
        };
      }
    }

    // ── Criar Payment Link no Asaas ──
    const paymentLink = await asaasRequest('/paymentLinks', 'POST', linkPayload);

    if (!paymentLink?.url) {
      throw new Error('Asaas nao retornou URL do Payment Link.');
    }

    return new Response(
      JSON.stringify({
        success: true,
        paymentLinkUrl: paymentLink.url,
        paymentLinkId: paymentLink.id,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[create-payment-link] Erro:', getErrorMessage(error));
    return new Response(
      JSON.stringify({
        success: false,
        message: getErrorMessage(error),
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
