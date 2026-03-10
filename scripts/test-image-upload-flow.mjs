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
  const email = 'haras.mcp2@teste.com.br';
  const password = '12345678';

  // 1. Autenticar
  console.log('[1] Autenticando usuário...');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
  if (authError) throw authError;
  const userId = authData.user?.id;
  if (!userId) throw new Error('Usuário não autenticado.');
  console.log(`[OK] Usuário autenticado: ${userId}`);

  // 2. Criar rascunho
  console.log('[2] Criando rascunho...');
  const { data: draft, error: draftError } = await supabase
    .from('animal_drafts')
    .insert({ user_id: userId, data: {} })
    .select()
    .single();
  if (draftError) throw draftError;
  console.log(`[OK] Rascunho criado: ${draft.id}`);

  // 3. Preencher dados do rascunho
  console.log('[3] Preenchendo dados do rascunho...');
  const formData = {
    name: 'Cavalo de Teste Upload',
    breed: 'Mangalarga Marchador',
    birthDate: '2020-03-15',
    gender: 'Macho',
    color: 'Castanho',
    currentCity: 'São Paulo',
    currentState: 'SP',
    allowMessages: true,
  };

  const { error: updateError } = await supabase
    .from('animal_drafts')
    .update({ data: formData })
    .eq('id', draft.id);
  if (updateError) throw updateError;
  console.log('[OK] Dados do rascunho preenchidos');

  // 4. Simular 2 imagens no localStorage (apenas loggar o que seria feito)
  console.log('[4] Simulando salvamento de 2 imagens no localStorage...');
  const mockImages = ['data:image/jpeg;base64,iVBORw0KGgoAAAANSUhEUg...', 'data:image/jpeg;base64,iVBORw0KGgoAAAANSUhEUg...'];
  console.log(`[OK] ${mockImages.length} imagens "salvas" no localStorage para draft ${draft.id}`);

  // 5. Verificar se bucket existe
  console.log('[5] Verificando bucket animal-images...');
  const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
  if (bucketsError) {
    console.warn('[WARN] Erro ao listar buckets:', bucketsError.message);
  } else {
    const animalImagesBucket = buckets.find(b => b.name === 'animal-images');
    if (!animalImagesBucket) {
      console.warn('[WARN] Bucket animal-images não encontrado. Crie-o manualmente no Dashboard.');
    } else {
      console.log('[OK] Bucket animal-images encontrado e configurado');
      console.log(`     - Público: ${animalImagesBucket.public ? 'Sim' : 'Não'}`);
      console.log(`     - ID: ${animalImagesBucket.id}`);
    }
  }

  // 6. Finalizar rascunho em animal (sem upload real por enquanto)
  console.log('[6] Finalizando rascunho em animal...');
  const { data: profile } = await supabase
    .from('profiles')
    .select('property_name')
    .eq('id', userId)
    .single();

  const { data: animal, error: animalError } = await supabase
    .from('animals')
    .insert({
      name: formData.name,
      breed: formData.breed,
      gender: formData.gender,
      birth_date: formData.birthDate,
      coat: formData.color,
      current_city: formData.currentCity,
      current_state: formData.currentState,
      owner_id: userId,
      haras_id: userId,
      haras_name: profile?.property_name || null,
      ad_status: 'paused',
      allow_messages: formData.allowMessages,
      can_edit: true,
      images: [] // Vazio por enquanto, será preenchido após upload
    })
    .select('id')
    .single();
  if (animalError) throw animalError;
  console.log(`[OK] Animal criado: ${animal.id}`);

  // 7. Simular upload de imagens (mock URLs)
  console.log('[7] Simulando upload de imagens...');
  const mockUploadedUrls = [
    `https://exemplo.supabase.co/storage/v1/object/public/animal-images/${userId}/${animal.id}/image1.jpg`,
    `https://exemplo.supabase.co/storage/v1/object/public/animal-images/${userId}/${animal.id}/image2.jpg`
  ];
  
  // 8. Atualizar animal com URLs das imagens
  console.log('[8] Atualizando animal com URLs das imagens...');
  const { error: updateImagesError } = await supabase
    .from('animals')
    .update({ images: mockUploadedUrls })
    .eq('id', animal.id);
  if (updateImagesError) throw updateImagesError;
  console.log('[OK] URLs das imagens salvas no animal');

  // 9. Publicar animal
  console.log('[9] Publicando animal...');
  const { error: publishError } = await supabase
    .from('animals')
    .update({ ad_status: 'active', published_at: new Date().toISOString() })
    .eq('id', animal.id);
  if (publishError) throw publishError;
  console.log('[OK] Animal publicado');

  // 10. Excluir rascunho
  console.log('[10] Excluindo rascunho...');
  const { error: deleteError } = await supabase
    .from('animal_drafts')
    .delete()
    .eq('id', draft.id);
  if (deleteError) throw deleteError;
  console.log('[OK] Rascunho excluído');

  // 11. Verificar animal final
  console.log('[11] Verificando animal final...');
  const { data: finalAnimal, error: finalError } = await supabase
    .from('animals')
    .select('id, name, breed, ad_status, images')
    .eq('id', animal.id)
    .single();
  if (finalError) throw finalError;
  
  console.log('\n=== RESULTADO FINAL ===');
  console.log(`Animal ID: ${finalAnimal.id}`);
  console.log(`Nome: ${finalAnimal.name}`);
  console.log(`Raça: ${finalAnimal.breed}`);
  console.log(`Status: ${finalAnimal.ad_status}`);
  console.log(`Imagens: ${finalAnimal.images?.length || 0} URLs`);
  if (finalAnimal.images?.length > 0) {
    finalAnimal.images.forEach((url, i) => {
      console.log(`  ${i + 1}. ${url}`);
    });
  }
  console.log('\n[SUCCESS] Fluxo de upload completo simulado com sucesso!');
}

main().catch((e) => {
  console.error('[ERROR]', e);
  process.exit(1);
});
