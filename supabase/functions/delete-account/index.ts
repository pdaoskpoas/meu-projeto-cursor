/**
 * =================================================================
 * DELETE-ACCOUNT Edge Function (LGPD Art. 18, VI)
 * =================================================================
 *
 * Exclui completamente a conta do usuário e todos os dados associados.
 * Requer confirmação de senha para prevenir exclusões acidentais.
 *
 * Fluxo:
 * 1. Valida JWT do usuário
 * 2. Confirma senha via Supabase Auth
 * 3. Anonimiza/remove dados em todas as tabelas relacionadas
 * 4. Remove perfil e auth.users
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
    const { password } = await req.json();

    if (!password || typeof password !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Senha é obrigatória para confirmar a exclusão.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 1. Validar JWT e obter usuário
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

    // Cliente com JWT do usuário (para obter identidade)
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Sessão inválida. Faça login novamente.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Confirmar senha via sign-in (verifica se a senha está correta)
    const { error: signInError } = await userClient.auth.signInWithPassword({
      email: user.email!,
      password: password,
    });

    if (signInError) {
      return new Response(
        JSON.stringify({ error: 'Senha incorreta. A exclusão foi cancelada.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Usar service_role para apagar todos os dados (bypassa RLS)
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);
    const userId = user.id;

    // Ordem de exclusão respeitando FKs
    // Tabelas que referenciam profiles.id
    const deletionSteps = [
      { table: 'boost_history', column: 'user_id' },
      { table: 'notification_preferences', column: 'user_id' },
      { table: 'notification_analytics', column: 'user_id' },
      { table: 'notifications', column: 'user_id' },
      { table: 'two_factor_attempts', column: 'user_id' },
      { table: 'page_visits', column: 'visitor_id' },
      { table: 'admin_audit_log', column: 'admin_id' },
      { table: 'admin_subscription_followups', column: 'admin_id' },
      { table: 'payment_audit_log', column: 'performed_by' },
      { table: 'tickets', column: 'user_id' },
      { table: 'ticket_messages', column: 'sender_id' },
      { table: 'sponsors', column: 'user_id' },
    ];

    const errors: string[] = [];

    for (const step of deletionSteps) {
      const { error } = await serviceClient
        .from(step.table)
        .delete()
        .eq(step.column, userId);
      if (error) {
        errors.push(`${step.table}: ${error.message}`);
      }
    }

    // Anonimizar mensagens (manter histórico mas sem identificação)
    await serviceClient
      .from('messages')
      .update({ sender_id: null })
      .eq('sender_id', userId);

    await serviceClient
      .from('messages')
      .update({ receiver_id: null })
      .eq('receiver_id', userId);

    // Remover animais do usuário
    const { data: animals } = await serviceClient
      .from('animals')
      .select('id')
      .eq('user_id', userId);

    if (animals && animals.length > 0) {
      const animalIds = animals.map((a: { id: string }) => a.id);

      // Remover dados relacionados a animais
      for (const animalId of animalIds) {
        await serviceClient.from('animal_images').delete().eq('animal_id', animalId);
        await serviceClient.from('animal_videos').delete().eq('animal_id', animalId);
        await serviceClient.from('animal_documents').delete().eq('animal_id', animalId);
        await serviceClient.from('genealogy').delete().eq('animal_id', animalId);
      }

      await serviceClient
        .from('animals')
        .delete()
        .eq('user_id', userId);
    }

    // Remover eventos do usuário
    await serviceClient.from('events').delete().eq('user_id', userId);

    // Remover transações e pagamentos
    await serviceClient.from('transactions').delete().eq('user_id', userId);
    await serviceClient.from('payments').delete().eq('user_id', userId);

    // Remover reports
    await serviceClient.from('reports').delete().eq('reporter_id', userId);

    // Remover consent_logs (ON DELETE CASCADE cuida, mas garantir)
    await serviceClient.from('consent_logs').delete().eq('user_id', userId);

    // 4. Remover perfil
    const { error: profileError } = await serviceClient
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (profileError) {
      errors.push(`profiles: ${profileError.message}`);
    }

    // 5. Remover auth.users (via Admin API)
    const { error: authDeleteError } = await serviceClient.auth.admin.deleteUser(userId);

    if (authDeleteError) {
      errors.push(`auth.users: ${authDeleteError.message}`);
    }

    if (errors.length > 0) {
      console.error('Erros durante exclusão de conta:', errors);
      return new Response(
        JSON.stringify({
          success: true,
          warning: 'Conta excluída com alguns avisos. Dados principais foram removidos.',
          details: errors,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Conta excluída com sucesso. Todos os dados foram removidos.' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    console.error('Erro ao excluir conta:', err);
    return new Response(
      JSON.stringify({ error: 'Erro interno ao processar exclusão.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
