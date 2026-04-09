-- ============================================
-- Tabela: vitrine_link_clicks
-- Registra cada clique em botao da vitrine /u/
-- ============================================

CREATE TABLE IF NOT EXISTS public.vitrine_link_clicks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  link_id UUID NOT NULL REFERENCES public.haras_custom_links(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,  -- dono do haras (para facilitar queries)
  session_id TEXT NOT NULL,
  referrer TEXT DEFAULT NULL,
  user_agent TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vitrine_link_clicks_link_id ON public.vitrine_link_clicks(link_id);
CREATE INDEX IF NOT EXISTS idx_vitrine_link_clicks_user_id ON public.vitrine_link_clicks(user_id);

-- RLS
ALTER TABLE public.vitrine_link_clicks ENABLE ROW LEVEL SECURITY;

-- Qualquer pessoa pode INSERIR (visitante anonimo clica no botao)
CREATE POLICY "Qualquer pessoa pode registrar clique"
  ON public.vitrine_link_clicks
  FOR INSERT
  WITH CHECK (true);

-- Apenas o dono do haras pode LER seus cliques
CREATE POLICY "Dono ve seus cliques"
  ON public.vitrine_link_clicks
  FOR SELECT
  USING (auth.uid() = user_id);

-- Adicionar colunas de contagem na tabela de links (cache para performance)
ALTER TABLE public.haras_custom_links
  ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS click_count INTEGER DEFAULT 0;
