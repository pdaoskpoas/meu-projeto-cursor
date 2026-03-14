/**
 * Script temporário para remover todos os eventos de teste publicados
 * 
 * Execução:
 * node scripts/remove-test-events.mjs
 */

import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';

function loadEnv() {
  // Tentar .env.local primeiro, depois .env
  const paths = ['.env.local', '.env'];
  let content = null;
  let usedPath = null;
  
  for (const path of paths) {
    if (fs.existsSync(path)) {
      content = fs.readFileSync(path, 'utf8');
      usedPath = path;
      break;
    }
  }
  
  if (!content) {
    throw new Error('Arquivo .env.local ou .env não encontrado');
  }
  
  console.log(`📄 Carregando variáveis de ambiente de: ${usedPath}`);
  
  const env = {};
  for (const line of content.split(/\r?\n/)) {
    const m = line.match(/^([^=#]+)=(.*)$/);
    if (m) env[m[1].trim()] = m[2].trim();
  }
  return env;
}

const env = loadEnv();
const supabaseUrl = env['VITE_SUPABASE_URL'];
const supabaseKey = env['SUPABASE_SERVICE_ROLE_KEY'] || env['VITE_SUPABASE_ANON_KEY'];

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Erro: Variáveis de ambiente não encontradas!');
  console.error('Certifique-se de que .env.local ou .env contém:');
  console.error('  - VITE_SUPABASE_URL');
  console.error('  - SUPABASE_SERVICE_ROLE_KEY (ou VITE_SUPABASE_ANON_KEY)');
  process.exit(1);
}

// Criar cliente Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

async function removeTestEvents() {
  try {
    console.log('🔍 Buscando eventos publicados...');
    
    // Buscar todos os eventos para identificar quais remover
    const { data: allEvents, error: fetchError } = await supabase
      .from('events')
      .select('id, title, ad_status, published_at');
    
    if (fetchError) {
      throw fetchError;
    }
    
    if (!allEvents || allEvents.length === 0) {
      console.log('✅ Nenhum evento encontrado. Nada a fazer.');
      return;
    }
    
    // Filtrar eventos publicados (ad_status = 'active' ou published_at não nulo)
    const eventsToDelete = allEvents.filter(event => 
      event.ad_status === 'active' || event.published_at !== null
    );
    
    console.log(`📊 Encontrados ${eventsToDelete.length} eventos para remover (de ${allEvents.length} total)`);
    
    if (eventsToDelete.length === 0) {
      console.log('✅ Nenhum evento publicado encontrado. Nada a fazer.');
      return;
    }
    
    // Listar primeiros eventos que serão removidos
    console.log('\n📋 Primeiros eventos que serão removidos:');
    eventsToDelete.slice(0, 10).forEach((event, index) => {
      console.log(`  ${index + 1}. ${event.title} (${event.ad_status || 'sem status'})`);
    });
    if (eventsToDelete.length > 10) {
      console.log(`  ... e mais ${eventsToDelete.length - 10} eventos`);
    }
    
    // Deletar eventos em lotes (para evitar problemas com muitos registros)
    console.log('\n🗑️  Removendo eventos...');
    const eventIds = eventsToDelete.map(e => e.id);
    
    // Deletar em lotes de 100
    const batchSize = 100;
    let deletedCount = 0;
    
    for (let i = 0; i < eventIds.length; i += batchSize) {
      const batch = eventIds.slice(i, i + batchSize);
      const { error: deleteError } = await supabase
        .from('events')
        .delete()
        .in('id', batch);
      
      if (deleteError) {
        throw deleteError;
      }
      
      deletedCount += batch.length;
      console.log(`  ✅ Removidos ${deletedCount}/${eventIds.length} eventos...`);
    }
    
    console.log(`\n✅ ${deletedCount} eventos removidos com sucesso!`);
    
    // Verificar resultado
    const { data: remainingEvents, error: verifyError } = await supabase
      .from('events')
      .select('id')
      .or('ad_status.eq.active,published_at.not.is.null');
    
    if (verifyError) {
      console.warn('⚠️  Aviso: Não foi possível verificar o resultado:', verifyError.message);
    } else {
      const remainingCount = remainingEvents?.length || 0;
      console.log(`✅ Verificação: ${remainingCount} eventos publicados restantes`);
      if (remainingCount > 0) {
        console.warn('⚠️  Ainda existem eventos publicados. Pode ser necessário executar novamente.');
      }
    }
    
  } catch (error) {
    console.error('❌ Erro ao remover eventos:', error.message);
    console.error('Detalhes:', error);
    process.exit(1);
  }
}

// Executar
removeTestEvents()
  .then(() => {
    console.log('\n✨ Processo concluído!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erro fatal:', error);
    process.exit(1);
  });
