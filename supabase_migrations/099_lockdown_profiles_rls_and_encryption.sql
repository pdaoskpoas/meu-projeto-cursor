-- =====================================================
-- MIGRAÇÃO 099: LOCKDOWN DE PROFILES + VIEW PÚBLICA + CRIPTOGRAFIA PII
-- Data: 21/03/2026
-- Descrição: Remove acesso global à tabela profiles, cria view pública
--            sem dados sensíveis, ativa criptografia de CPF/telefone
-- Motivação: RLS "Profiles are viewable by everyone" expõe CPF, email,
--            telefone de TODOS os usuários para qualquer autenticado
-- =====================================================

-- =====================================================
-- PARTE 1: REMOÇÃO DA POLÍTICA ABERTA (CRÍTICO)
-- =====================================================

-- ❌ Remover a política que permite leitura irrestrita
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;

-- =====================================================
-- PARTE 2: NOVAS POLÍTICAS RESTRITIVAS (DENY BY DEFAULT)
-- =====================================================

-- ✅ Usuário autenticado pode ver APENAS seu próprio perfil completo
DROP POLICY IF EXISTS "Users can view own full profile" ON profiles;
CREATE POLICY "Users can view own full profile"
ON profiles FOR SELECT
TO authenticated
USING (id = (SELECT auth.uid()));

-- ✅ Admins podem ver todos os perfis (necessário para painel admin)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'profiles'
    AND policyname IN (
      'Admins can do everything on profiles',
      'Admins can manage profiles'
    )
  ) THEN
    -- Dropar caso exista de execução anterior
    EXECUTE 'DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles';
    EXECUTE $policy$
      CREATE POLICY "Admins can view all profiles"
      ON profiles FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM profiles p
          WHERE p.id = (SELECT auth.uid()) AND p.role = 'admin'
        )
      );
    $policy$;
  END IF;
END $$;

-- =====================================================
-- PARTE 3: VIEW PÚBLICA (SEM DADOS SENSÍVEIS)
-- =====================================================

DROP VIEW IF EXISTS public_profiles;

CREATE VIEW public_profiles
WITH (security_invoker = false)
AS
SELECT
  id,
  name,
  avatar_url,
  account_type,
  property_name,
  property_type,
  property_id,
  public_code,
  plan,
  city,
  state,
  country,
  founded_year,
  owner_name,
  bio,
  instagram,
  is_active,
  is_suspended,
  created_at
FROM profiles
WHERE is_active = true
  AND is_suspended = false;

COMMENT ON VIEW public_profiles IS
'View pública de perfis SEM dados sensíveis (CPF, email, phone, CEP).
 Deve ser usada para todas as consultas que exibem perfis de outros usuários.
 Campos EXCLUÍDOS: cpf, email, phone, cep, role, plan_expires_at,
 plan_purchased_at, is_annual_plan, available_boosts, boosts_reset_at, updated_at';

GRANT SELECT ON public_profiles TO authenticated;
GRANT SELECT ON public_profiles TO anon;

-- =====================================================
-- PARTE 4: TABELA DE CHAVES DE CRIPTOGRAFIA
-- =====================================================

CREATE TABLE IF NOT EXISTS pii_encryption_keys (
  id SERIAL PRIMARY KEY,
  key_value TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE pii_encryption_keys ENABLE ROW LEVEL SECURITY;
-- Sem políticas = nenhum acesso direto. Apenas SECURITY DEFINER functions leem.

-- =====================================================
-- PARTE 5: FUNÇÕES DE CRIPTOGRAFIA PII
-- =====================================================
-- IMPORTANTE: search_path DEVE incluir 'extensions' (onde pgcrypto está no Supabase)

CREATE OR REPLACE FUNCTION encrypt_pii(
  plaintext TEXT,
  encryption_key TEXT DEFAULT NULL
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
  v_key TEXT;
BEGIN
  v_key := encryption_key;

  IF v_key IS NULL OR v_key = '' THEN
    v_key := current_setting('app.encryption_key', true);
  END IF;

  IF v_key IS NULL OR v_key = '' THEN
    SELECT key_value INTO v_key
    FROM pii_encryption_keys
    WHERE is_active = true
    ORDER BY id DESC
    LIMIT 1;
  END IF;

  IF v_key IS NULL OR v_key = '' THEN
    RAISE EXCEPTION 'No encryption key configured';
  END IF;

  RETURN encode(
    pgp_sym_encrypt(plaintext, v_key, 'compress-algo=1, cipher-algo=aes256'),
    'base64'
  );
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Encryption error: %', SQLERRM;
    RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION decrypt_pii(
  ciphertext TEXT,
  encryption_key TEXT DEFAULT NULL
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
  v_key TEXT;
BEGIN
  IF ciphertext IS NULL OR ciphertext = '' THEN
    RETURN NULL;
  END IF;

  v_key := encryption_key;

  IF v_key IS NULL OR v_key = '' THEN
    v_key := current_setting('app.encryption_key', true);
  END IF;

  IF v_key IS NULL OR v_key = '' THEN
    SELECT key_value INTO v_key
    FROM pii_encryption_keys
    WHERE is_active = true
    ORDER BY id DESC
    LIMIT 1;
  END IF;

  IF v_key IS NULL OR v_key = '' THEN
    RAISE EXCEPTION 'No encryption key configured';
  END IF;

  -- pgp_sym_decrypt(bytea, text) retorna TEXT diretamente
  RETURN pgp_sym_decrypt(decode(ciphertext, 'base64'), v_key);
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Decryption error: %', SQLERRM;
    RETURN NULL;
END;
$$;

-- =====================================================
-- PARTE 6: CPF HASH PARA BUSCAS INDEXADAS
-- =====================================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cpf_hash TEXT;

CREATE OR REPLACE FUNCTION generate_cpf_hash(cpf_value TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
BEGIN
  IF cpf_value IS NULL OR cpf_value = '' THEN
    RETURN NULL;
  END IF;
  RETURN encode(
    digest(regexp_replace(cpf_value, '[^0-9]', '', 'g'), 'sha256'),
    'hex'
  );
END;
$$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_cpf_hash
ON profiles(cpf_hash) WHERE cpf_hash IS NOT NULL;

-- =====================================================
-- PARTE 7: TRIGGERS DE CRIPTOGRAFIA AUTOMÁTICA
-- =====================================================
-- O trigger de INSERT/UPDATE faz TUDO: gera cpf_hash + criptografa.
-- Detecção de plaintext vs encrypted: valores encrypted têm >50 chars.
-- (CPF max 14 chars, phone max 15 chars, encrypted ~100+ chars)

CREATE OR REPLACE FUNCTION trigger_encrypt_pii_on_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
BEGIN
  -- Generate cpf_hash from PLAINTEXT before encryption
  IF NEW.cpf IS NOT NULL AND LENGTH(NEW.cpf) < 50 THEN
    NEW.cpf_hash := generate_cpf_hash(NEW.cpf);
    NEW.cpf := encrypt_pii(NEW.cpf);
  END IF;
  -- Encrypt phone
  IF NEW.phone IS NOT NULL AND LENGTH(NEW.phone) < 50 THEN
    NEW.phone := encrypt_pii(NEW.phone);
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION trigger_encrypt_pii_on_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
BEGIN
  -- Generate cpf_hash from PLAINTEXT before encryption
  IF NEW.cpf IS DISTINCT FROM OLD.cpf AND NEW.cpf IS NOT NULL AND LENGTH(NEW.cpf) < 50 THEN
    NEW.cpf_hash := generate_cpf_hash(NEW.cpf);
    NEW.cpf := encrypt_pii(NEW.cpf);
  END IF;
  -- Encrypt phone if changed
  IF NEW.phone IS DISTINCT FROM OLD.phone AND NEW.phone IS NOT NULL AND LENGTH(NEW.phone) < 50 THEN
    NEW.phone := encrypt_pii(NEW.phone);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS encrypt_pii_on_profile_insert ON profiles;
CREATE TRIGGER encrypt_pii_on_profile_insert
BEFORE INSERT ON profiles
FOR EACH ROW
EXECUTE FUNCTION trigger_encrypt_pii_on_insert();

DROP TRIGGER IF EXISTS encrypt_pii_on_profile_update ON profiles;
CREATE TRIGGER encrypt_pii_on_profile_update
BEFORE UPDATE OF cpf, phone ON profiles
FOR EACH ROW
WHEN (
  (NEW.cpf IS DISTINCT FROM OLD.cpf) OR
  (NEW.phone IS DISTINCT FROM OLD.phone)
)
EXECUTE FUNCTION trigger_encrypt_pii_on_update();

-- Remover trigger separado de cpf_hash (integrado nos triggers acima)
DROP TRIGGER IF EXISTS update_cpf_hash_on_change ON profiles;

-- =====================================================
-- PARTE 8: ÍNDICES PARA A VIEW PÚBLICA
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_profiles_active_not_suspended
ON profiles(is_active, is_suspended)
WHERE is_active = true AND is_suspended = false;

CREATE INDEX IF NOT EXISTS idx_profiles_public_code_active
ON profiles(public_code)
WHERE is_active = true AND is_suspended = false AND public_code IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_account_type_active
ON profiles(account_type)
WHERE is_active = true AND is_suspended = false;

-- =====================================================
-- PARTE 9: FUNÇÕES RPC SEGURAS
-- =====================================================

DROP FUNCTION IF EXISTS find_profile_by_cpf_hash(TEXT);

CREATE FUNCTION find_profile_by_cpf_hash(search_cpf TEXT)
RETURNS TABLE (
  id UUID,
  name TEXT,
  account_type TEXT,
  is_suspended BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
  v_hash TEXT;
BEGIN
  -- Apenas admins podem buscar perfil por CPF
  IF NOT EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = (SELECT auth.uid()) AND p.role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem buscar por CPF';
  END IF;

  v_hash := generate_cpf_hash(search_cpf);
  RETURN QUERY
  SELECT p.id, p.name, p.account_type, p.is_suspended
  FROM profiles p
  WHERE p.cpf_hash = v_hash
  LIMIT 1;
END;
$$;

REVOKE EXECUTE ON FUNCTION find_profile_by_cpf_hash FROM anon;

CREATE OR REPLACE FUNCTION check_email_exists(check_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles WHERE email = check_email
  );
END;
$$;

GRANT EXECUTE ON FUNCTION check_email_exists TO anon;
GRANT EXECUTE ON FUNCTION check_email_exists TO authenticated;

CREATE OR REPLACE FUNCTION check_cpf_exists(check_cpf TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
  v_hash TEXT;
BEGIN
  v_hash := generate_cpf_hash(check_cpf);
  RETURN EXISTS (
    SELECT 1 FROM profiles WHERE cpf_hash = v_hash
  );
END;
$$;

GRANT EXECUTE ON FUNCTION check_cpf_exists TO anon;
GRANT EXECUTE ON FUNCTION check_cpf_exists TO authenticated;

-- =====================================================
-- PARTE 10: RESTRINGIR payment_audit_log E notifications
-- =====================================================

DROP POLICY IF EXISTS "Authenticated users can view audit log" ON payment_audit_log;
DROP POLICY IF EXISTS "Users can view own payment audit" ON payment_audit_log;

CREATE POLICY "Users can view own payment audit"
ON payment_audit_log FOR SELECT
TO authenticated
USING (
  performed_by = (SELECT auth.uid())
  OR EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = (SELECT auth.uid()) AND p.role = 'admin'
  )
);

DROP POLICY IF EXISTS "system_can_create_notifications" ON notifications;
DROP POLICY IF EXISTS "Users can only create own notifications" ON notifications;

CREATE POLICY "Users can only create own notifications"
ON notifications FOR INSERT
TO authenticated
WITH CHECK (user_id = (SELECT auth.uid()));

-- =====================================================
-- PARTE 11: POPULAR cpf_hash PARA REGISTROS EXISTENTES
-- =====================================================
-- Para dados já criptografados: descriptografar, gerar hash
UPDATE profiles
SET cpf_hash = generate_cpf_hash(decrypt_pii(cpf))
WHERE cpf IS NOT NULL AND cpf_hash IS NULL AND LENGTH(cpf) > 50;

-- Para dados em plaintext legado
UPDATE profiles
SET cpf_hash = generate_cpf_hash(cpf)
WHERE cpf IS NOT NULL AND cpf_hash IS NULL AND LENGTH(cpf) < 50;

-- =====================================================
-- ✅ MIGRATION COMPLETA
-- =====================================================
-- Resumo das alterações:
-- 1. Removida política "Profiles are viewable by everyone"
-- 2. Criada política: usuário só vê próprio perfil
-- 3. Criada VIEW public_profiles sem PII (19 colunas)
-- 4. Tabela pii_encryption_keys com RLS (sem políticas = sem acesso direto)
-- 5. encrypt_pii/decrypt_pii com AES-256 via pgcrypto
-- 6. Criptografia automática CPF/phone (INSERT + UPDATE triggers)
-- 7. cpf_hash SHA-256 para buscas indexadas sem descriptografar
-- 8. RPCs check_email_exists/check_cpf_exists (retornam apenas boolean)
-- 9. Restringido payment_audit_log (só dono + admin)
-- 10. Restringido notifications INSERT (só para próprio user_id)
-- 11. Índices otimizados para view pública
--
-- IMPORTANTE: Todas as funções usam search_path = public, extensions, pg_temp
-- porque pgcrypto está no schema 'extensions' no Supabase.
