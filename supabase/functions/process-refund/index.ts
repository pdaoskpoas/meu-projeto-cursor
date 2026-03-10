import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type RefundAction = 'approve' | 'reject';

interface RefundRequestBody {
  refundId?: string;
  action?: RefundAction;
  adminNotes?: string;
}

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
  const response = await fetch(`${resolvedBaseUrl}${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      access_token: apiKey,
      'User-Agent': 'cavalaria-digital/refunds',
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

    const { data: profile, error: profileError } = await serviceClient
      .from('profiles')
      .select('role')
      .eq('id', authData.user.id)
      .single();

    if (profileError || profile?.role !== 'admin') {
      return new Response(JSON.stringify({ success: false, message: 'Acesso negado.' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let body: RefundRequestBody = {};
    try {
      body = (await req.json()) as RefundRequestBody;
    } catch {
      return new Response(JSON.stringify({ success: false, message: 'Payload inválido.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const refundId = body.refundId;
    const action = body.action;
    const adminNotes = body.adminNotes?.trim() || null;

    if (!refundId || !action || !['approve', 'reject'].includes(action)) {
      return new Response(JSON.stringify({ success: false, message: 'Parâmetros inválidos.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'reject' && !adminNotes) {
      return new Response(JSON.stringify({ success: false, message: 'Informe o motivo da rejeição.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: refund, error: refundError } = await serviceClient
      .from('refunds')
      .select('id, payment_id, amount, status')
      .eq('id', refundId)
      .single();

    if (refundError || !refund) {
      return new Response(JSON.stringify({ success: false, message: 'Reembolso não encontrado.' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (refund.status !== 'requested') {
      return new Response(JSON.stringify({ success: false, message: 'Reembolso já processado.' }), {
        status: 409,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'approve') {
      const { data: paymentRow, error: paymentError } = await serviceClient
        .from('asaas_payments')
        .select('asaas_payment_id')
        .eq('id', refund.payment_id)
        .single();

      if (paymentError || !paymentRow?.asaas_payment_id) {
        return new Response(
          JSON.stringify({ success: false, message: 'Pagamento Asaas não encontrado para este reembolso.' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      await asaasRequest(`/payments/${paymentRow.asaas_payment_id}/refund`, 'POST', { value: refund.amount });
    }

    const nextStatus = action === 'approve' ? 'approved' : 'rejected';
    const { error: updateError } = await serviceClient
      .from('refunds')
      .update({
        status: nextStatus,
        processed_by: authData.user.id,
        processed_at: new Date().toISOString(),
        admin_notes: adminNotes,
      })
      .eq('id', refund.id);

    if (updateError) {
      throw new Error('Falha ao atualizar reembolso no banco.');
    }

    return new Response(
      JSON.stringify({
        success: true,
        status: nextStatus,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        message: error instanceof Error ? error.message : 'Erro ao processar reembolso.',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
