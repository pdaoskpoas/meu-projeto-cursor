-- ============================================================================
-- MIGRATION 060: Infraestrutura Completa de Storage
-- ============================================================================
-- Descrição: Cria buckets, políticas RLS e tabelas para sistema completo de imagens
-- Data: 2024-11-14
-- Autor: Engenheiro Senior
-- ============================================================================

-- ============================================================================
-- PARTE 1: CRIAR BUCKETS
-- ============================================================================

-- Bucket para avatares de usuários/haras
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true, -- Público para exibição
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

-- Bucket para imagens de eventos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'event-images',
  'event-images',
  true,
  15728640, -- 15MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 15728640,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

-- Bucket para logos de patrocinadores
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'sponsor-logos',
  'sponsor-logos',
  true,
  3145728, -- 3MB
  ARRAY['image/png', 'image/svg+xml', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 3145728,
  allowed_mime_types = ARRAY['image/png', 'image/svg+xml', 'image/webp'];

-- Atualizar bucket animal-images com limites
UPDATE storage.buckets
SET 
  file_size_limit = 10485760, -- 10MB
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
WHERE id = 'animal-images';

-- ============================================================================
-- PARTE 2: LIMPAR POLÍTICAS RLS DUPLICADAS
-- ============================================================================

-- Remover políticas antigas/duplicadas do animal-images
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow own deletes" ON storage.objects;
DROP POLICY IF EXISTS "Allow own updates" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;

-- ============================================================================
-- PARTE 3: POLÍTICAS RLS OTIMIZADAS - ANIMAL IMAGES
-- ============================================================================

-- SELECT: Público (mantém existente)
-- Já existe: "Imagens de animais são publicamente visíveis"

-- INSERT: Apenas proprietário (mantém existente)
-- Já existe: "Usuários podem fazer upload das próprias imagens de animais"

-- UPDATE: Apenas proprietário (mantém existente)
-- Já existe: "Usuários podem atualizar suas próprias imagens"

-- DELETE: Apenas proprietário (mantém existente)
-- Já existe: "Usuários podem deletar suas próprias imagens"

-- ============================================================================
-- PARTE 4: POLÍTICAS RLS - AVATARS
-- ============================================================================

-- SELECT: Público
CREATE POLICY "Avatares são publicamente visíveis"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- INSERT: Apenas o próprio usuário
CREATE POLICY "Usuários podem fazer upload do próprio avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- UPDATE: Apenas o próprio usuário
CREATE POLICY "Usuários podem atualizar próprio avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- DELETE: Apenas o próprio usuário
CREATE POLICY "Usuários podem deletar próprio avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================================================
-- PARTE 5: POLÍTICAS RLS - EVENT IMAGES
-- ============================================================================

-- SELECT: Público
CREATE POLICY "Imagens de eventos são publicamente visíveis"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'event-images');

-- INSERT: Organizador do evento ou admin
CREATE POLICY "Organizadores podem fazer upload de imagens de eventos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'event-images' AND
  (
    -- Verifica se é o organizador do evento
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM events WHERE organizer_id = auth.uid()
    )
    OR
    -- Ou se é admin
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  )
);

-- UPDATE: Organizador do evento ou admin
CREATE POLICY "Organizadores podem atualizar imagens de eventos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'event-images' AND
  (
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM events WHERE organizer_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  )
);

-- DELETE: Organizador do evento ou admin
CREATE POLICY "Organizadores podem deletar imagens de eventos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'event-images' AND
  (
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM events WHERE organizer_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  )
);

-- ============================================================================
-- PARTE 6: POLÍTICAS RLS - SPONSOR LOGOS
-- ============================================================================

-- SELECT: Público
CREATE POLICY "Logos de patrocinadores são públicas"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'sponsor-logos');

-- INSERT: Apenas admins
CREATE POLICY "Apenas admins podem fazer upload de logos de patrocinadores"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'sponsor-logos' AND
  EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  )
);

-- UPDATE: Apenas admins
CREATE POLICY "Apenas admins podem atualizar logos de patrocinadores"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'sponsor-logos' AND
  EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  )
);

-- DELETE: Apenas admins
CREATE POLICY "Apenas admins podem deletar logos de patrocinadores"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'sponsor-logos' AND
  EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  )
);

-- ============================================================================
-- PARTE 7: TABELA DE PATROCINADORES
-- ============================================================================

CREATE TABLE IF NOT EXISTS sponsors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  website_url TEXT,
  logo_url TEXT, -- URL principal da logo
  logo_horizontal_url TEXT, -- Logo formato landscape (4:1)
  logo_square_url TEXT, -- Logo formato quadrado (1:1)
  logo_vertical_url TEXT, -- Logo formato portrait (1:4)
  is_active BOOLEAN DEFAULT true,
  display_priority INTEGER DEFAULT 0, -- Maior = mais prioridade
  start_date TIMESTAMPTZ, -- Início da campanha
  end_date TIMESTAMPTZ, -- Fim da campanha
  display_locations TEXT[] DEFAULT ARRAY[]::TEXT[], -- ['home', 'events', 'footer']
  click_count INTEGER DEFAULT 0,
  impression_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  -- Constraints
  CONSTRAINT valid_dates CHECK (end_date IS NULL OR end_date > start_date),
  CONSTRAINT valid_priority CHECK (display_priority >= 0)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_sponsors_active ON sponsors(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_sponsors_priority ON sponsors(display_priority DESC) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_sponsors_dates ON sponsors(start_date, end_date) WHERE is_active = true;

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_sponsors_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_sponsors_updated_at
  BEFORE UPDATE ON sponsors
  FOR EACH ROW
  EXECUTE FUNCTION update_sponsors_updated_at();

-- ============================================================================
-- PARTE 8: RLS PARA TABELA SPONSORS
-- ============================================================================

ALTER TABLE sponsors ENABLE ROW LEVEL SECURITY;

-- SELECT: Público pode ver patrocinadores ativos
CREATE POLICY "Patrocinadores ativos são públicos"
ON sponsors FOR SELECT
TO public
USING (
  is_active = true AND
  (start_date IS NULL OR start_date <= NOW()) AND
  (end_date IS NULL OR end_date >= NOW())
);

-- SELECT: Admins veem todos
CREATE POLICY "Admins veem todos os patrocinadores"
ON sponsors FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  )
);

-- INSERT/UPDATE/DELETE: Apenas admins
CREATE POLICY "Apenas admins podem gerenciar patrocinadores"
ON sponsors FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  )
);

-- ============================================================================
-- PARTE 9: FUNÇÃO PARA INCREMENTAR VISUALIZAÇÕES
-- ============================================================================

CREATE OR REPLACE FUNCTION increment_sponsor_impression(sponsor_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE sponsors
  SET impression_count = impression_count + 1
  WHERE id = sponsor_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_sponsor_click(sponsor_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE sponsors
  SET click_count = click_count + 1
  WHERE id = sponsor_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PARTE 10: VIEW PARA PATROCINADORES ATIVOS
-- ============================================================================

CREATE OR REPLACE VIEW active_sponsors AS
SELECT 
  id,
  name,
  description,
  website_url,
  logo_url,
  logo_horizontal_url,
  logo_square_url,
  logo_vertical_url,
  display_priority,
  display_locations,
  click_count,
  impression_count
FROM sponsors
WHERE 
  is_active = true AND
  (start_date IS NULL OR start_date <= NOW()) AND
  (end_date IS NULL OR end_date >= NOW())
ORDER BY display_priority DESC, created_at DESC;

-- Permissão de SELECT para todos
GRANT SELECT ON active_sponsors TO public;

-- ============================================================================
-- FIM DA MIGRATION
-- ============================================================================

-- Comentários para documentação
COMMENT ON TABLE sponsors IS 'Tabela de patrocinadores com suporte a campanhas agendadas e analytics';
COMMENT ON COLUMN sponsors.display_priority IS 'Maior valor = maior prioridade de exibição';
COMMENT ON COLUMN sponsors.display_locations IS 'Array de locais onde o logo deve aparecer';
COMMENT ON COLUMN sponsors.start_date IS 'Data de início da campanha (NULL = sempre ativo)';
COMMENT ON COLUMN sponsors.end_date IS 'Data de fim da campanha (NULL = sem fim)';

