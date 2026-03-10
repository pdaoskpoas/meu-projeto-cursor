-- Criar bucket para imagens de eventos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'events',
  'events',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Políticas de acesso ao bucket events
-- Política 1: Usuários autenticados podem fazer upload em suas próprias pastas
DROP POLICY IF EXISTS "Eventos - Upload público 1rl01e_0" ON storage.objects;
CREATE POLICY "Eventos - Upload público 1rl01e_0"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'events' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Política 2: Leitura pública para todos
DROP POLICY IF EXISTS "Eventos - Leitura pública 1rl01e_1" ON storage.objects;
CREATE POLICY "Eventos - Leitura pública 1rl01e_1"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'events');

-- Política 3: Proprietário pode atualizar suas próprias imagens
DROP POLICY IF EXISTS "Eventos - Atualização do proprietário 1rl01e_2" ON storage.objects;
CREATE POLICY "Eventos - Atualização do proprietário 1rl01e_2"
ON storage.objects
FOR UPDATE
TO public
USING (bucket_id = 'events' AND auth.uid()::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'events' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Política 4: Proprietário pode deletar suas próprias imagens
DROP POLICY IF EXISTS "Eventos - Deletar do proprietário 1rl01e_3" ON storage.objects;
CREATE POLICY "Eventos - Deletar do proprietário 1rl01e_3"
ON storage.objects
FOR DELETE
TO public
USING (bucket_id = 'events' AND auth.uid()::text = (storage.foldername(name))[1]);


