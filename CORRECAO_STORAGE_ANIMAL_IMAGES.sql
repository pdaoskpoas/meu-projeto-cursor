-- ============================================================================
-- CORREÇÃO CRÍTICA: Políticas RLS para Upload de Imagens de Animais
-- ============================================================================
-- 
-- PROBLEMA IDENTIFICADO:
-- O bucket 'animal-images' existe e é público, mas NÃO tem políticas RLS.
-- Isso impede que usuários façam upload de imagens de seus animais.
-- 
-- SOLUÇÃO:
-- Criar 4 políticas RLS para permitir upload, visualização, atualização e deleção.
-- 
-- COMO APLICAR:
-- 1. Acesse o Supabase Dashboard > SQL Editor
-- 2. Cole este script completo
-- 3. Execute
-- 
-- ============================================================================

-- 1. Permitir INSERT (upload) para usuários autenticados nas suas próprias pastas
-- Estrutura do caminho: {user_id}/{animal_id}/{filename}
CREATE POLICY "Usuários podem fazer upload das próprias imagens de animais"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'animal-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 2. Permitir SELECT (visualização) pública de todas as imagens
-- Qualquer pessoa pode ver as imagens (bucket é público)
CREATE POLICY "Imagens de animais são publicamente visíveis"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'animal-images');

-- 3. Permitir UPDATE (atualização) para o proprietário
-- Usuários podem substituir suas próprias imagens
CREATE POLICY "Usuários podem atualizar suas próprias imagens"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'animal-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'animal-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. Permitir DELETE (exclusão) para o proprietário
-- Usuários podem deletar suas próprias imagens
CREATE POLICY "Usuários podem deletar suas próprias imagens"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'animal-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================================================
-- VERIFICAÇÃO
-- ============================================================================
-- Execute esta query para confirmar que as políticas foram criadas:
SELECT 
  policyname,
  cmd
FROM pg_policies
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE '%animais%'
ORDER BY policyname;








