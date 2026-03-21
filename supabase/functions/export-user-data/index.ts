/**
 * =================================================================
 * EXPORT-USER-DATA Edge Function (LGPD Art. 18, V)
 * =================================================================
 *
 * Exporta todos os dados pessoais do usuário em formato JSON.
 * Direito de portabilidade - o usuário deve poder obter seus dados
 * em formato estruturado.
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Validar JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Não autenticado.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Sessão inválida.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Usar service_role para coletar todos os dados (bypassa RLS)
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);
    const userId = user.id;

    // Buscar perfil com dados descriptografados
    const { data: profile } = await serviceClient
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    // Descriptografar PII se existir
    let decryptedProfile = profile;
    if (profile) {
      // Chamar decrypt_pii via RPC para CPF e phone
      if (profile.cpf && profile.cpf.length > 50) {
        const { data: cpfData } = await serviceClient.rpc('decrypt_pii', { ciphertext: profile.cpf });
        if (cpfData) decryptedProfile = { ...decryptedProfile, cpf: cpfData };
      }
      if (profile.phone && profile.phone.length > 50) {
        const { data: phoneData } = await serviceClient.rpc('decrypt_pii', { ciphertext: profile.phone });
        if (phoneData) decryptedProfile = { ...decryptedProfile, phone: phoneData };
      }
      // Remover campos internos
      delete decryptedProfile.cpf_hash;
    }

    // Animais
    const { data: animals } = await serviceClient
      .from('animals')
      .select('*, animal_images(*), animal_videos(*), animal_documents(*), genealogy(*)')
      .eq('user_id', userId);

    // Eventos
    const { data: events } = await serviceClient
      .from('events')
      .select('*')
      .eq('user_id', userId);

    // Mensagens enviadas
    const { data: messagesSent } = await serviceClient
      .from('messages')
      .select('*')
      .eq('sender_id', userId);

    // Mensagens recebidas
    const { data: messagesReceived } = await serviceClient
      .from('messages')
      .select('*')
      .eq('receiver_id', userId);

    // Pagamentos
    const { data: payments } = await serviceClient
      .from('payments')
      .select('*')
      .eq('user_id', userId);

    // Transações
    const { data: transactions } = await serviceClient
      .from('transactions')
      .select('*')
      .eq('user_id', userId);

    // Notificações
    const { data: notifications } = await serviceClient
      .from('notifications')
      .select('*')
      .eq('user_id', userId);

    // Boost history
    const { data: boostHistory } = await serviceClient
      .from('boost_history')
      .select('*')
      .eq('user_id', userId);

    // Tickets de suporte
    const { data: tickets } = await serviceClient
      .from('tickets')
      .select('*, ticket_messages(*)')
      .eq('user_id', userId);

    // Reports feitos
    const { data: reports } = await serviceClient
      .from('reports')
      .select('*')
      .eq('reporter_id', userId);

    // Registros de consentimento
    const { data: consentLogs } = await serviceClient
      .from('consent_logs')
      .select('*')
      .eq('user_id', userId)
      .order('accepted_at', { ascending: false });

    // 3. Montar export
    const exportData = {
      _metadata: {
        exported_at: new Date().toISOString(),
        user_id: userId,
        format: 'JSON',
        lgpd_article: 'Art. 18, V - Portabilidade de dados',
      },
      profile: decryptedProfile,
      animals: animals || [],
      events: events || [],
      messages: {
        sent: messagesSent || [],
        received: messagesReceived || [],
      },
      payments: payments || [],
      transactions: transactions || [],
      notifications: notifications || [],
      boost_history: boostHistory || [],
      support_tickets: tickets || [],
      reports: reports || [],
      consent_logs: consentLogs || [],
    };

    return new Response(
      JSON.stringify(exportData, null, 2),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="meus-dados-${new Date().toISOString().split('T')[0]}.json"`,
        },
      }
    );

  } catch (err) {
    console.error('Erro ao exportar dados:', err);
    return new Response(
      JSON.stringify({ error: 'Erro interno ao exportar dados.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
