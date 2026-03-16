import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://your-project-ref.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY não encontrada nas variáveis de ambiente');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function setupStorageBuckets() {
  console.log('🚀 Configurando buckets de storage...');

  try {
    // Verificar buckets existentes
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      throw listError;
    }

    console.log('📦 Buckets existentes:', buckets?.map(b => b.name) || []);

    // Criar bucket de avatars se não existir
    const avatarsBucket = buckets?.find(bucket => bucket.name === 'avatars');
    
    if (!avatarsBucket) {
      console.log('📁 Criando bucket "avatars"...');
      
      const { error: createError } = await supabase.storage.createBucket('avatars', {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
        fileSizeLimit: 5242880 // 5MB
      });
      
      if (createError) {
        throw createError;
      }
      
      console.log('✅ Bucket "avatars" criado com sucesso');
    } else {
      console.log('✅ Bucket "avatars" já existe');
    }

    // Configurar políticas RLS para o bucket avatars
    console.log('🔐 Configurando políticas de acesso...');
    
    // Política para permitir upload de avatars (usuários autenticados)
    const uploadPolicy = `
      CREATE POLICY IF NOT EXISTS "Users can upload avatars" ON storage.objects
      FOR INSERT WITH CHECK (
        bucket_id = 'avatars' AND 
        auth.uid()::text = (storage.foldername(name))[1]
      );
    `;

    // Política para permitir visualização pública de avatars
    const viewPolicy = `
      CREATE POLICY IF NOT EXISTS "Avatars are publicly viewable" ON storage.objects
      FOR SELECT USING (bucket_id = 'avatars');
    `;

    // Política para permitir atualização de avatars próprios
    const updatePolicy = `
      CREATE POLICY IF NOT EXISTS "Users can update own avatars" ON storage.objects
      FOR UPDATE USING (
        bucket_id = 'avatars' AND 
        auth.uid()::text = (storage.foldername(name))[1]
      );
    `;

    // Política para permitir deleção de avatars próprios
    const deletePolicy = `
      CREATE POLICY IF NOT EXISTS "Users can delete own avatars" ON storage.objects
      FOR DELETE USING (
        bucket_id = 'avatars' AND 
        auth.uid()::text = (storage.foldername(name))[1]
      );
    `;

    // Executar políticas
    const policies = [uploadPolicy, viewPolicy, updatePolicy, deletePolicy];
    
    for (const policy of policies) {
      const { error } = await supabase.rpc('exec_sql', { sql: policy });
      if (error) {
        console.warn('⚠️ Erro ao criar política (pode já existir):', error.message);
      }
    }

    console.log('✅ Configuração de storage concluída!');
    console.log('\n📋 Resumo:');
    console.log('   - Bucket "avatars" configurado');
    console.log('   - Políticas RLS aplicadas');
    console.log('   - Limite de 5MB por arquivo');
    console.log('   - Tipos permitidos: JPEG, JPG, PNG, WebP');

  } catch (error) {
    console.error('❌ Erro na configuração:', error);
    process.exit(1);
  }
}

setupStorageBuckets();

