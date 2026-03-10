-- Migration: Garantir que o bucket de avatars existe
-- Description: Cria o bucket 'avatars' para armazenar fotos de perfil e logos de haras
-- Nota: As políticas de acesso (RLS) já existem e foram criadas em migrations anteriores

-- Criar bucket se não existir
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- As seguintes políticas já existem no sistema:
-- 1. "Avatares são publicamente visíveis" - SELECT para public
-- 2. "Usuários podem fazer upload do próprio avatar" - INSERT para authenticated
-- 3. "Usuários podem atualizar próprio avatar" - UPDATE para authenticated
-- 4. "Usuários podem deletar próprio avatar" - DELETE para authenticated

