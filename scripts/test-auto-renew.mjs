import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';

function loadEnvLocal() {
  const path = '.env.local';
  if (!fs.existsSync(path)) {
    throw new Error('.env.local não encontrado');
  }
  const content = fs.readFileSync(path, 'utf8');
  const env = {};
  for (const line of content.split(/\r?\n/)) {
    const m = line.match(/^([^=#]+)=(.*)$/);
    if (m) env[m[1].trim()] = m[2].trim();
  }
  return env;
}

async function getClient() {
  const env = loadEnvLocal();
  const url = env['VITE_SUPABASE_URL'];
  const anonKey = env['VITE_SUPABASE_ANON_KEY'];
  if (!url || !anonKey) {
    throw new Error('VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY ausentes');
  }
  return createClient(url, anonKey);
}

async function main() {
  const supabase = await getClient();
  const email = process.argv[2] || 'usuario_teste@exemplo.com';
  const password: sua_senha_segura_aqui';

  console.log('=== TESTE DO SISTEMA DE RENOVAÇÃO AUTOMÁTICA ===');

  // 1. Autenticar
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
  if (authError) throw authError;
  const userId = authData.user?.id;
  if (!userId) throw new Error('Usuário não autenticado.');
  console.log(`[OK] Usuário autenticado: ${userId}`);

  // 2. Criar animal de teste com auto_renew = true
  console.log('[2] Criando animal com renovação automática...');
  const { data: animal, error: animalError } = await supabase
    .from('animals')
    .insert({
      name: 'Cavalo Renovação Automática',
      breed: 'Mangalarga Marchador',
      gender: 'Macho',
      birth_date: '2020-01-01',
      coat: 'Castanho',
      current_city: 'São Paulo',
      current_state: 'SP',
      owner_id: userId,
      haras_id: userId,
      haras_name: 'Haras Teste',
      ad_status: 'active',
      auto_renew: true, // RENOVAÇÃO AUTOMÁTICA HABILITADA
      published_at: new Date().toISOString(),
      expires_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Expirado há 1 dia (para teste)
      allow_messages: true,
      can_edit: true
    })
    .select()
    .single();

  if (animalError) throw animalError;
  console.log(`[OK] Animal criado: ${animal.id} (auto_renew: ${animal.auto_renew})`);

  // 3. Verificar plano do usuário
  console.log('[3] Verificando plano do usuário...');
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('plan, plan_expires_at')
    .eq('id', userId)
    .single();

  if (profileError) throw profileError;
  console.log(`[OK] Plano: ${profile.plan}, Expira em: ${profile.plan_expires_at}`);

  // 4. Executar função de processamento de expirações
  console.log('[4] Executando processo de expiração/renovação...');
  const { data: processResult, error: processError } = await supabase
    .rpc('process_animal_expirations');

  if (processError) throw processError;
  console.log(`[OK] Processo executado. Animais processados: ${processResult}`);

  // 5. Verificar status do animal após processamento
  console.log('[5] Verificando status do animal após processamento...');
  const { data: updatedAnimal, error: fetchError } = await supabase
    .from('animals')
    .select('id, name, ad_status, auto_renew, published_at, expires_at')
    .eq('id', animal.id)
    .single();

  if (fetchError) throw fetchError;

  console.log('\n=== RESULTADO ===');
  console.log(`Animal: ${updatedAnimal.name}`);
  console.log(`Status: ${updatedAnimal.ad_status}`);
  console.log(`Auto Renew: ${updatedAnimal.auto_renew}`);
  console.log(`Publicado em: ${updatedAnimal.published_at}`);
  console.log(`Expira em: ${updatedAnimal.expires_at}`);

  if (updatedAnimal.ad_status === 'active') {
    console.log('✅ SUCESSO: Animal foi renovado automaticamente!');
  } else if (updatedAnimal.ad_status === 'expired' && updatedAnimal.auto_renew) {
    console.log('⏳ AGUARDANDO: Animal expirado, aguardando pagamento individual');
  } else {
    console.log('❌ Animal não foi renovado (sem plano válido ou auto_renew desabilitado)');
  }

  // 6. Verificar logs do sistema
  console.log('\n[6] Verificando logs do sistema...');
  const { data: logs, error: logsError } = await supabase
    .from('system_logs')
    .select('operation, details, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  if (logsError) {
    console.warn('Não foi possível buscar logs:', logsError.message);
  } else {
    console.log('Últimos logs:');
    logs.forEach(log => {
      console.log(`  - ${log.operation}: ${JSON.stringify(log.details)}`);
    });
  }

  // 7. Teste de renovação individual (se aplicável)
  if (updatedAnimal.ad_status === 'expired' && updatedAnimal.auto_renew) {
    console.log('\n[7] Testando renovação individual...');
    const { data: renewResult, error: renewError } = await supabase
      .rpc('renew_animal_individually', {
        animal_id_param: animal.id,
        user_id_param: userId
      });

    if (renewError) {
      console.error('Erro na renovação individual:', renewError.message);
    } else {
      console.log(`[OK] Renovação individual: ${renewResult ? 'Sucesso' : 'Falhou'}`);
      
      if (renewResult) {
        // Verificar status após renovação
        const { data: finalAnimal } = await supabase
          .from('animals')
          .select('ad_status, published_at, expires_at')
          .eq('id', animal.id)
          .single();
        
        console.log(`Status final: ${finalAnimal?.ad_status}`);
        console.log(`Nova expiração: ${finalAnimal?.expires_at}`);
      }
    }
  }

  console.log('\n=== TESTE CONCLUÍDO ===');
}

main().catch((e) => {
  console.error('[ERROR]', e);
  process.exit(1);
});





