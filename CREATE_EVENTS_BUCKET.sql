-- =====================================================
-- SCRIPT PARA CRIAR BUCKET 'events' NO SUPABASE
-- =====================================================
-- Execute este script no Supabase Studio:
-- 1. Vá para: SQL Editor
-- 2. Cole todo este script
-- 3. Clique em "Run" ou pressione Ctrl+Enter
-- =====================================================

-- 1. Criar bucket para imagens de eventos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'events',
  'events',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Política: Usuários autenticados podem fazer upload em suas próprias pastas
DROP POLICY IF EXISTS "Eventos - Upload público" ON storage.objects;
CREATE POLICY "Eventos - Upload público"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'events' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 3. Política: Leitura pública para todos
DROP POLICY IF EXISTS "Eventos - Leitura pública" ON storage.objects;
CREATE POLICY "Eventos - Leitura pública"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'events');

-- 4. Política: Proprietário pode atualizar suas próprias imagens
DROP POLICY IF EXISTS "Eventos - Atualização do proprietário" ON storage.objects;
CREATE POLICY "Eventos - Atualização do proprietário"
ON storage.objects
FOR UPDATE
TO public
USING (bucket_id = 'events' AND auth.uid()::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'events' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 5. Política: Proprietário pode deletar suas próprias imagens
DROP POLICY IF EXISTS "Eventos - Deletar do proprietário" ON storage.objects;
CREATE POLICY "Eventos - Deletar do proprietário"
ON storage.objects
FOR DELETE
TO public
USING (bucket_id = 'events' AND auth.uid()::text = (storage.foldername(name))[1]);

-- =====================================================
-- VERIFICAR SE FOI CRIADO CORRETAMENTE
-- =====================================================
SELECT * FROM storage.buckets WHERE id = 'events';

-- =====================================================
-- LIMPEZA DE RASCUNHOS ÓRFÃOS (OPCIONAL)
-- =====================================================
-- Se houver eventos em rascunho por mais de 1 hora, delete-os
-- Descomente a linha abaixo se quiser executar a limpeza:
-- DELETE FROM events WHERE ad_status = 'draft' AND created_at < NOW() - INTERVAL '1 hour';


