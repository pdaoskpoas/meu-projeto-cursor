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
  const anonKey = env['VITE_SUPABASE_ANON_KEY']; // Use anon key for now
  if (!url || !anonKey) {
    throw new Error('VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY ausentes');
  }
  return createClient(url, anonKey);
}

async function main() {
  const supabase = await getClient();
  
  console.log('[INFO] Criando bucket animal-images...');
  
  // Create bucket
  const { data, error } = await supabase.storage.createBucket('animal-images', {
    public: true,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    fileSizeLimit: 5242880 // 5MB
  });
  
  if (error) {
    if (error.message.includes('already exists')) {
      console.log('[OK] Bucket animal-images já existe');
    } else {
      console.error('[ERROR]', error);
      throw error;
    }
  } else {
    console.log('[OK] Bucket animal-images criado:', data);
  }
  
  // Verify bucket exists and is public
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  if (listError) {
    console.error('[ERROR] Falha ao listar buckets:', listError);
  } else {
    const animalImagesBucket = buckets.find(b => b.name === 'animal-images');
    if (animalImagesBucket) {
      console.log('[OK] Bucket confirmado:', animalImagesBucket);
    } else {
      console.error('[ERROR] Bucket animal-images não encontrado após criação');
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
