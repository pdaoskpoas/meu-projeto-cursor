-- =====================================================
-- MIGRACAO 088: PAGE VISITS PARA ANALYTICS DO SITE
-- Data: 09/03/2026
-- Descricao: Registrar acessos do site e da home com historico por periodo
-- =====================================================

CREATE TABLE IF NOT EXISTS page_visits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  page_key TEXT NOT NULL,
  page_path TEXT NOT NULL,
  page_title TEXT,
  session_id TEXT NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  referrer TEXT,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_page_visits_page_key ON page_visits(page_key);
CREATE INDEX IF NOT EXISTS idx_page_visits_page_path ON page_visits(page_path);
CREATE INDEX IF NOT EXISTS idx_page_visits_session_id ON page_visits(session_id);
CREATE INDEX IF NOT EXISTS idx_page_visits_created_at ON page_visits(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_page_visits_page_key_created_at ON page_visits(page_key, created_at DESC);

COMMENT ON TABLE page_visits IS 'Historico de acessos ao site e paginas publicas';
COMMENT ON COLUMN page_visits.page_key IS 'Identificador logico da pagina, ex: home, noticias, eventos, site_access';
COMMENT ON COLUMN page_visits.page_path IS 'Path acessado pelo visitante';
COMMENT ON COLUMN page_visits.metadata IS 'Metadados adicionais do acesso';

ALTER TABLE page_visits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can insert page visits" ON page_visits;
CREATE POLICY "Anyone can insert page visits"
ON page_visits
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can read page visits" ON page_visits;
CREATE POLICY "Admins can read page visits"
ON page_visits
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
  )
);
