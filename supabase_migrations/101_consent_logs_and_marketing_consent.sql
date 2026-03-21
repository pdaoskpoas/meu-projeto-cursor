-- =========================================================================
-- 101 - Registro de Consentimento (LGPD) + Marketing Consent
-- =========================================================================
-- Cria tabela consent_logs para rastreabilidade juridica de aceite de termos,
-- adiciona marketing_consent ao profiles e cria trigger de seguranca que
-- impede criacao de perfil sem registro previo de consentimento.
-- =========================================================================

-- 1. TABELA consent_logs (append-only, historico imutavel)
CREATE TABLE IF NOT EXISTS consent_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  terms_version TEXT NOT NULL,
  privacy_version TEXT NOT NULL,
  ip_address    INET,
  user_agent    TEXT,
  mechanism     TEXT NOT NULL DEFAULT 'signup_checkbox',
  accepted_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at    TIMESTAMPTZ,
  metadata      JSONB DEFAULT '{}'::jsonb
);

-- Indice para busca por usuario (todas as versoes aceitas)
CREATE INDEX IF NOT EXISTS idx_consent_logs_user_id ON consent_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_consent_logs_accepted_at ON consent_logs(accepted_at DESC);

-- Comentarios para documentacao
COMMENT ON TABLE consent_logs IS 'Registro imutavel de consentimento do usuario (LGPD Art. 8, par. 2). Cada linha = um aceite. Nunca atualizar, apenas inserir.';
COMMENT ON COLUMN consent_logs.terms_version IS 'Versao dos Termos de Uso aceitos (ex: 1.0)';
COMMENT ON COLUMN consent_logs.privacy_version IS 'Versao da Politica de Privacidade aceita (ex: 1.0)';
COMMENT ON COLUMN consent_logs.ip_address IS 'IP do usuario no momento do aceite';
COMMENT ON COLUMN consent_logs.user_agent IS 'User-Agent do navegador no momento do aceite';
COMMENT ON COLUMN consent_logs.mechanism IS 'Mecanismo de aceite (signup_checkbox, terms_update_banner, etc.)';
COMMENT ON COLUMN consent_logs.accepted_at IS 'Timestamp UTC do aceite';
COMMENT ON COLUMN consent_logs.revoked_at IS 'Se preenchido, indica quando o consentimento foi revogado';
COMMENT ON COLUMN consent_logs.metadata IS 'Dados adicionais em JSON (ex: versao do app, plataforma)';


-- 2. RLS para consent_logs
ALTER TABLE consent_logs ENABLE ROW LEVEL SECURITY;

-- Usuario ve apenas seus proprios registros
DROP POLICY IF EXISTS "Users can view own consent logs" ON consent_logs;
CREATE POLICY "Users can view own consent logs"
  ON consent_logs FOR SELECT
  USING (auth.uid() = user_id);

-- Inserção permitida apenas para o próprio usuário (via service_role ou autenticado)
DROP POLICY IF EXISTS "Users can insert own consent logs" ON consent_logs;
CREATE POLICY "Users can insert own consent logs"
  ON consent_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Ninguem pode atualizar (append-only)
-- Nenhuma policy de UPDATE = bloqueio total via RLS

-- Admin pode ver todos (para auditoria)
DROP POLICY IF EXISTS "Admin can view all consent logs" ON consent_logs;
CREATE POLICY "Admin can view all consent logs"
  ON consent_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );


-- 3. MARKETING CONSENT no profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'marketing_consent'
  ) THEN
    ALTER TABLE profiles ADD COLUMN marketing_consent BOOLEAN NOT NULL DEFAULT FALSE;
    COMMENT ON COLUMN profiles.marketing_consent IS 'Consentimento para comunicacoes promocionais (LGPD Art. 7, I). Default false, opt-in explicito.';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'marketing_consent_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN marketing_consent_at TIMESTAMPTZ;
    COMMENT ON COLUMN profiles.marketing_consent_at IS 'Timestamp do ultimo consentimento ou revogacao de marketing';
  END IF;
END $$;


-- 4. FUNCAO para registrar consentimento (chamada via RPC)
CREATE OR REPLACE FUNCTION record_consent(
  p_user_id UUID,
  p_terms_version TEXT,
  p_privacy_version TEXT,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_mechanism TEXT DEFAULT 'signup_checkbox',
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_consent_id UUID;
BEGIN
  INSERT INTO consent_logs (
    user_id,
    terms_version,
    privacy_version,
    ip_address,
    user_agent,
    mechanism,
    metadata
  ) VALUES (
    p_user_id,
    p_terms_version,
    p_privacy_version,
    p_ip_address::INET,
    p_user_agent,
    p_mechanism,
    p_metadata
  )
  RETURNING id INTO v_consent_id;

  RETURN v_consent_id;
END;
$$;

COMMENT ON FUNCTION record_consent IS 'Registra aceite de termos/privacidade. SECURITY DEFINER para permitir insert mesmo antes do profile existir.';


-- 5. FUNCAO para verificar se usuario tem consentimento vigente
CREATE OR REPLACE FUNCTION check_user_consent(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM consent_logs
    WHERE user_id = p_user_id
      AND revoked_at IS NULL
    LIMIT 1
  );
END;
$$;


-- 6. FUNCAO para obter ultimo consentimento do usuario
CREATE OR REPLACE FUNCTION get_latest_consent(p_user_id UUID)
RETURNS TABLE (
  consent_id UUID,
  terms_version TEXT,
  privacy_version TEXT,
  accepted_at TIMESTAMPTZ,
  mechanism TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN QUERY
  SELECT
    cl.id,
    cl.terms_version,
    cl.privacy_version,
    cl.accepted_at,
    cl.mechanism
  FROM consent_logs cl
  WHERE cl.user_id = p_user_id
    AND cl.revoked_at IS NULL
  ORDER BY cl.accepted_at DESC
  LIMIT 1;
END;
$$;


-- 7. TRIGGER que impede criacao de perfil sem consentimento registrado
CREATE OR REPLACE FUNCTION enforce_consent_on_profile_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Verificar se existe registro de consentimento para este usuario
  IF NOT EXISTS (
    SELECT 1 FROM consent_logs
    WHERE user_id = NEW.id
    LIMIT 1
  ) THEN
    RAISE EXCEPTION 'Registro de consentimento obrigatório antes da criação do perfil (LGPD). User: %', NEW.id
      USING HINT = 'Chame record_consent() antes de inserir o perfil.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_consent_before_profile ON profiles;
CREATE TRIGGER trg_enforce_consent_before_profile
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION enforce_consent_on_profile_insert();

COMMENT ON FUNCTION enforce_consent_on_profile_insert IS 'Impede criacao de perfil sem consentimento previo registrado. Garante conformidade LGPD Art. 8.';


-- 8. PERMISSOES
GRANT EXECUTE ON FUNCTION record_consent TO authenticated;
GRANT EXECUTE ON FUNCTION check_user_consent TO authenticated;
GRANT EXECUTE ON FUNCTION get_latest_consent TO authenticated;
GRANT SELECT, INSERT ON consent_logs TO authenticated;

-- Anon precisa poder chamar record_consent durante signup
-- (usuario acabou de ser criado no auth mas ainda nao tem perfil)
GRANT EXECUTE ON FUNCTION record_consent TO anon;
