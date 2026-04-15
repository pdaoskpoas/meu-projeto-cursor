-- =========================================================================
-- 120 - Registro de Consentimento de Cookies (LGPD Art. 8, §2º)
-- =========================================================================
-- Cria tabela cookie_consent_logs (append-only) que armazena todo aceite,
-- rejeição ou alteração de preferências de cookies feita por visitantes
-- (anônimos ou autenticados). Essencial para demonstrar conformidade:
-- o controlador deve provar que obteve consentimento válido.
--
-- Diferença para consent_logs (migração 101):
--   consent_logs         → aceite de Termos/Privacidade no signup (com user_id obrigatório)
--   cookie_consent_logs  → aceite de cookies (pode ser anônimo, por visitante)
-- =========================================================================

-- 1. TABELA cookie_consent_logs
CREATE TABLE IF NOT EXISTS cookie_consent_logs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  anonymous_id      UUID NOT NULL,
  consent_version   INTEGER NOT NULL,
  action            TEXT NOT NULL CHECK (action IN ('accept_all', 'reject_non_essential', 'custom', 'update', 'withdraw')),
  necessary         BOOLEAN NOT NULL DEFAULT TRUE,
  analytics         BOOLEAN NOT NULL DEFAULT FALSE,
  marketing         BOOLEAN NOT NULL DEFAULT FALSE,
  ip_address        INET,
  user_agent        TEXT,
  page_url          TEXT,
  referer           TEXT,
  metadata          JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Restrições de qualidade de dado
ALTER TABLE cookie_consent_logs
  DROP CONSTRAINT IF EXISTS cookie_consent_logs_necessary_always_true;
ALTER TABLE cookie_consent_logs
  ADD CONSTRAINT cookie_consent_logs_necessary_always_true
  CHECK (necessary = TRUE);

-- Índices para consulta
CREATE INDEX IF NOT EXISTS idx_cookie_consent_logs_user_id
  ON cookie_consent_logs(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cookie_consent_logs_anonymous_id
  ON cookie_consent_logs(anonymous_id);
CREATE INDEX IF NOT EXISTS idx_cookie_consent_logs_created_at
  ON cookie_consent_logs(created_at DESC);

-- Documentação
COMMENT ON TABLE cookie_consent_logs IS
  'Registro imutável de aceites de cookies (LGPD Art. 8 §2º). Append-only: nunca atualizar, apenas inserir nova linha para cada mudança de preferência.';
COMMENT ON COLUMN cookie_consent_logs.anonymous_id IS
  'UUID gerado no dispositivo do visitante, persistido em localStorage. Permite rastrear escolhas sem identificação pessoal.';
COMMENT ON COLUMN cookie_consent_logs.consent_version IS
  'Versão do framework de consentimento (incrementada quando a política de cookies muda materialmente).';
COMMENT ON COLUMN cookie_consent_logs.action IS
  'accept_all | reject_non_essential | custom | update | withdraw';
COMMENT ON COLUMN cookie_consent_logs.ip_address IS
  'IP de origem capturado pelo backend (edge function). Não preenchível pelo cliente.';

-- 2. RLS: append-only, leitura apenas do próprio registro
ALTER TABLE cookie_consent_logs ENABLE ROW LEVEL SECURITY;

-- Cliente NÃO insere direto — apenas via edge function (service_role)
-- Mantemos a policy de INSERT negada (sem CREATE POLICY para INSERT),
-- o que bloqueia anon e authenticated por padrão sob RLS.

-- SELECT: usuário autenticado vê seus próprios registros
DROP POLICY IF EXISTS "Users read own cookie consent" ON cookie_consent_logs;
CREATE POLICY "Users read own cookie consent"
  ON cookie_consent_logs FOR SELECT
  USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- SELECT: admin vê todos (auditoria e resposta a requisições do titular)
DROP POLICY IF EXISTS "Admin reads all cookie consent" ON cookie_consent_logs;
CREATE POLICY "Admin reads all cookie consent"
  ON cookie_consent_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Sem policies de UPDATE/DELETE — tabela totalmente append-only pelo RLS.

-- 3. FUNÇÃO RPC record_cookie_consent
--    Chamada exclusivamente pela edge function (service_role).
CREATE OR REPLACE FUNCTION record_cookie_consent(
  p_anonymous_id    UUID,
  p_consent_version INTEGER,
  p_action          TEXT,
  p_analytics       BOOLEAN,
  p_marketing       BOOLEAN,
  p_user_id         UUID DEFAULT NULL,
  p_ip_address      TEXT DEFAULT NULL,
  p_user_agent      TEXT DEFAULT NULL,
  p_page_url        TEXT DEFAULT NULL,
  p_referer         TEXT DEFAULT NULL,
  p_metadata        JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO cookie_consent_logs (
    user_id,
    anonymous_id,
    consent_version,
    action,
    necessary,
    analytics,
    marketing,
    ip_address,
    user_agent,
    page_url,
    referer,
    metadata
  ) VALUES (
    p_user_id,
    p_anonymous_id,
    p_consent_version,
    p_action,
    TRUE,
    COALESCE(p_analytics, FALSE),
    COALESCE(p_marketing, FALSE),
    NULLIF(p_ip_address, '')::INET,
    p_user_agent,
    p_page_url,
    p_referer,
    COALESCE(p_metadata, '{}'::jsonb)
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

COMMENT ON FUNCTION record_cookie_consent IS
  'Insere registro de aceite de cookies. SECURITY DEFINER para permitir inserção mesmo com RLS restritivo. Deve ser chamada apenas pelo backend (edge function).';

-- Apenas service_role executa (bloqueia anon/authenticated de inserir direto)
REVOKE EXECUTE ON FUNCTION record_cookie_consent FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION record_cookie_consent FROM anon;
REVOKE EXECUTE ON FUNCTION record_cookie_consent FROM authenticated;
GRANT  EXECUTE ON FUNCTION record_cookie_consent TO service_role;

-- 4. FUNÇÃO utilitária: último aceite de um anonymous_id (para exibir comprovante)
CREATE OR REPLACE FUNCTION get_latest_cookie_consent(p_anonymous_id UUID)
RETURNS TABLE (
  id              UUID,
  action          TEXT,
  analytics       BOOLEAN,
  marketing       BOOLEAN,
  consent_version INTEGER,
  created_at      TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
  SELECT id, action, analytics, marketing, consent_version, created_at
  FROM cookie_consent_logs
  WHERE anonymous_id = p_anonymous_id
  ORDER BY created_at DESC
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION get_latest_cookie_consent TO anon, authenticated;

-- 5. Verificação
DO $$
DECLARE
  v_count INT;
BEGIN
  SELECT COUNT(*) INTO v_count FROM cookie_consent_logs;
  RAISE NOTICE '✅ Migration 120: tabela cookie_consent_logs pronta (% registros existentes).', v_count;
END $$;
