/**
 * =================================================================
 * RECORD-COOKIE-CONSENT Edge Function (LGPD Art. 8, §2º)
 * =================================================================
 *
 * Registra, de forma imutável, toda decisão do usuário sobre cookies
 * (aceitar todos, rejeitar não essenciais, personalizar, atualizar).
 *
 * - Captura IP e User-Agent no servidor (não confia no cliente).
 * - Resolve user_id se houver JWT válido no Authorization header;
 *   caso contrário grava apenas com anonymous_id.
 * - Usa service_role para inserir via RPC record_cookie_consent.
 * - Responde com o ID do registro (comprovante de aceite).
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const ALLOWED_ACTIONS = new Set([
  'accept_all',
  'reject_non_essential',
  'custom',
  'update',
  'withdraw',
]);

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface RequestBody {
  anonymous_id?: string;
  consent_version?: number;
  action?: string;
  analytics?: boolean;
  marketing?: boolean;
  page_url?: string;
  metadata?: Record<string, unknown>;
}

function getClientIp(req: Request): string | null {
  const candidates = [
    req.headers.get('cf-connecting-ip'),
    req.headers.get('x-real-ip'),
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim(),
  ];
  for (const c of candidates) {
    if (c && c.length > 0 && c.length < 64) return c;
  }
  return null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Método não permitido.' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = (await req.json()) as RequestBody;

    const anonymousId = (body.anonymous_id ?? '').trim();
    const consentVersion = Number(body.consent_version);
    const action = (body.action ?? '').trim();
    const analytics = Boolean(body.analytics);
    const marketing = Boolean(body.marketing);
    const pageUrl = typeof body.page_url === 'string' ? body.page_url.slice(0, 2048) : null;
    const metadata =
      body.metadata && typeof body.metadata === 'object' && !Array.isArray(body.metadata)
        ? body.metadata
        : {};

    if (!UUID_RE.test(anonymousId)) {
      return new Response(JSON.stringify({ error: 'anonymous_id inválido.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (!Number.isFinite(consentVersion) || consentVersion < 1) {
      return new Response(JSON.stringify({ error: 'consent_version inválido.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (!ALLOWED_ACTIONS.has(action)) {
      return new Response(JSON.stringify({ error: 'action inválido.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Tenta resolver user_id a partir do JWT (se presente)
    let userId: string | null = null;
    const authHeader = req.headers.get('Authorization');
    if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
      try {
        const userClient = createClient(supabaseUrl, anonKey, {
          global: { headers: { Authorization: authHeader } },
        });
        const { data } = await userClient.auth.getUser();
        if (data?.user?.id) userId = data.user.id;
      } catch {
        // Ignora falha de autenticação — registra como anônimo
      }
    }

    const ip = getClientIp(req);
    const userAgent = req.headers.get('user-agent')?.slice(0, 1024) ?? null;
    const referer = req.headers.get('referer')?.slice(0, 2048) ?? null;

    const service = createClient(supabaseUrl, serviceKey);

    const { data, error } = await service.rpc('record_cookie_consent', {
      p_anonymous_id: anonymousId,
      p_consent_version: consentVersion,
      p_action: action,
      p_analytics: analytics,
      p_marketing: marketing,
      p_user_id: userId,
      p_ip_address: ip,
      p_user_agent: userAgent,
      p_page_url: pageUrl,
      p_referer: referer,
      p_metadata: metadata,
    });

    if (error) {
      console.error('[record-cookie-consent] RPC error:', error.message);
      return new Response(
        JSON.stringify({ error: 'Falha ao registrar consentimento.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        receipt_id: data,
        recorded_at: new Date().toISOString(),
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('[record-cookie-consent] Erro:', err);
    return new Response(JSON.stringify({ error: 'Requisição inválida.' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
