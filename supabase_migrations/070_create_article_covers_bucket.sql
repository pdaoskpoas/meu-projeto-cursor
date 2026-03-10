-- Migration 070: Criar bucket para imagens de capa de artigos
-- Data: 23/11/2025
-- Descrição: Cria bucket dedicado para armazenamento de imagens de capa de artigos

-- Criar bucket para imagens de artigos
INSERT INTO storage.buckets (id, name, public)
VALUES ('article-covers', 'article-covers', true)
ON CONFLICT (id) DO NOTHING;

-- Criar políticas de acesso para o bucket
CREATE POLICY IF NOT EXISTS "Permitir upload de imagens de capa 1ofe8o_0"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'article-covers');

CREATE POLICY IF NOT EXISTS "Permitir leitura pública de imagens de capa 1ofe8o_1"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'article-covers');

CREATE POLICY IF NOT EXISTS "Permitir deletar próprias imagens de capa 1ofe8o_2"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'article-covers');


