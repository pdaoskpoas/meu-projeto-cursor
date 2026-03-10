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

async function main() {
  const env = loadEnvLocal();
  const url = env['VITE_SUPABASE_URL'];
  const anonKey = env['VITE_SUPABASE_ANON_KEY'];
  const supabase = createClient(url, anonKey);

  console.log('=== TESTE DE UPLOAD REAL ===');
  
  // Autenticar
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'haras.mcp2@teste.com.br',
    password: '12345678'
  });
  if (authError) throw authError;
  console.log('[OK] Usuário autenticado');

  // Criar um arquivo de teste
  const testContent = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/wA==';
  
  // Converter data URL para Blob
  const response = await fetch(testContent);
  const blob = await response.blob();
  const file = new File([blob], 'test-image.jpg', { type: 'image/jpeg' });
  
  console.log('[INFO] Arquivo de teste criado:', file.name, file.size, 'bytes');
  
  // Tentar upload
  const userId = authData.user.id;
  const testPath = `${userId}/test/${Date.now()}_test.jpg`;
  
  console.log('[INFO] Tentando upload para:', testPath);
  
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('animal-images')
    .upload(testPath, file, {
      upsert: false,
      contentType: 'image/jpeg'
    });
  
  if (uploadError) {
    console.error('[ERROR] Falha no upload:', uploadError);
    return;
  }
  
  console.log('[OK] Upload realizado:', uploadData);
  
  // Obter URL pública
  const { data: urlData } = supabase.storage
    .from('animal-images')
    .getPublicUrl(testPath);
  
  console.log('[OK] URL pública:', urlData.publicUrl);
  
  // Verificar se o arquivo existe
  const { data: listData, error: listError } = await supabase.storage
    .from('animal-images')
    .list(`${userId}/test`);
  
  if (listError) {
    console.error('[ERROR] Falha ao listar:', listError);
  } else {
    console.log('[OK] Arquivos na pasta:', listData);
  }
  
  console.log('\n=== TESTE CONCLUÍDO COM SUCESSO! ===');
  console.log('O bucket animal-images está funcionando perfeitamente!');
}

main().catch(console.error);





