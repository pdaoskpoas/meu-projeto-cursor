-- ============================================
-- Tabela: haras_custom_links
-- Botões personalizados para a vitrine (/u/:slug)
-- Cada usuário pode ter até 3 botões
-- ============================================

CREATE TABLE IF NOT EXISTS public.haras_custom_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  position SMALLINT NOT NULL CHECK (position BETWEEN 1 AND 3),
  label TEXT NOT NULL DEFAULT '',
  url TEXT NOT NULL DEFAULT '',
  icon TEXT DEFAULT NULL,  -- opcional: 'whatsapp', 'instagram', 'youtube', 'telegram', 'link'
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, position)
);

-- Índice para busca rápida por user_id (usado na página /u/)
CREATE INDEX IF NOT EXISTS idx_haras_custom_links_user_id ON public.haras_custom_links(user_id);

-- RLS (Row Level Security)
ALTER TABLE public.haras_custom_links ENABLE ROW LEVEL SECURITY;

-- Qualquer pessoa pode LER links ativos (página pública /u/)
CREATE POLICY "Links publicos sao visiveis para todos"
  ON public.haras_custom_links
  FOR SELECT
  USING (is_active = true);

-- Apenas o dono pode ver TODOS os seus links (incluindo inativos)
CREATE POLICY "Usuário vê todos os próprios links"
  ON public.haras_custom_links
  FOR SELECT
  USING (auth.uid() = user_id);

-- Apenas o dono pode inserir
CREATE POLICY "Usuário insere próprios links"
  ON public.haras_custom_links
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Apenas o dono pode atualizar
CREATE POLICY "Usuário atualiza próprios links"
  ON public.haras_custom_links
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Apenas o dono pode deletar
CREATE POLICY "Usuário deleta próprios links"
  ON public.haras_custom_links
  FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_haras_custom_links_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_haras_custom_links_updated_at
  BEFORE UPDATE ON public.haras_custom_links
  FOR EACH ROW
  EXECUTE FUNCTION update_haras_custom_links_updated_at();
