-- =====================================================
-- Migration 076: Sistema de Criptografia PII (OPCIONAL)
-- Data: 25/11/2025
-- Descrição: Adiciona funções de criptografia para dados pessoais
--            sensíveis (CPF, telefone). COMPATÍVEL com código existente.
-- Uso: Opcional - Pode ser habilitado gradualmente
-- =====================================================

-- =====================================================
-- 1. HABILITAR EXTENSÃO pgcrypto
-- =====================================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;

COMMENT ON EXTENSION pgcrypto IS 
'Extensão para criptografia de dados sensíveis (PII)';

-- =====================================================
-- 2. CRIAR TABELA DE CONFIGURAÇÃO (Encryption Key Rotation)
-- =====================================================
CREATE TABLE IF NOT EXISTS encryption_config (
  id SERIAL PRIMARY KEY,
  key_version INT NOT NULL UNIQUE,
  key_hash TEXT NOT NULL, -- Hash da chave (não a chave em si)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  rotated_at TIMESTAMPTZ,
  notes TEXT
);

COMMENT ON TABLE encryption_config IS 
'Configuração e histórico de rotação de chaves de criptografia';

-- Criar versão inicial
INSERT INTO encryption_config (key_version, key_hash, notes)
VALUES (
  1, 
  encode(digest('initial_key_v1', 'sha256'), 'hex'),
  'Initial encryption key version'
) ON CONFLICT (key_version) DO NOTHING;

-- RLS para proteger config
ALTER TABLE encryption_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view encryption config"
ON encryption_config FOR SELECT
TO authenticated
USING (is_admin());

-- =====================================================
-- 3. FUNÇÕES DE CRIPTOGRAFIA
-- =====================================================

-- Função para criptografar dados sensíveis
CREATE OR REPLACE FUNCTION encrypt_pii(
  plaintext TEXT,
  encryption_key TEXT DEFAULT NULL
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_key TEXT;
BEGIN
  -- Se não fornecido, usar chave do ambiente
  -- ⚠️ IMPORTANTE: Em produção, usar vault seguro (não hardcode)
  v_key := COALESCE(
    encryption_key,
    current_setting('app.encryption_key', true),
    'default_development_key_change_in_production'
  );

  -- Criptografar usando AES-256 (pgp_sym_encrypt)
  RETURN encode(
    pgp_sym_encrypt(plaintext::bytea, v_key, 'compress-algo=1, cipher-algo=aes256'),
    'base64'
  );
EXCEPTION
  WHEN OTHERS THEN
    -- Em caso de erro, logar e retornar NULL
    RAISE WARNING 'Encryption error: %', SQLERRM;
    RETURN NULL;
END;
$$;

COMMENT ON FUNCTION encrypt_pii IS 
'Criptografa dados sensíveis usando AES-256 (pgp_sym_encrypt)';

GRANT EXECUTE ON FUNCTION encrypt_pii TO authenticated;

-- Função para descriptografar dados sensíveis
CREATE OR REPLACE FUNCTION decrypt_pii(
  ciphertext TEXT,
  encryption_key TEXT DEFAULT NULL
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_key TEXT;
BEGIN
  -- Se NULL ou vazio, retornar NULL
  IF ciphertext IS NULL OR ciphertext = '' THEN
    RETURN NULL;
  END IF;

  -- Usar chave do ambiente
  v_key := COALESCE(
    encryption_key,
    current_setting('app.encryption_key', true),
    'default_development_key_change_in_production'
  );

  -- Descriptografar
  RETURN convert_from(
    pgp_sym_decrypt(decode(ciphertext, 'base64'), v_key),
    'UTF8'
  );
EXCEPTION
  WHEN OTHERS THEN
    -- Se falhar descriptografia, pode ser texto plano antigo
    RAISE WARNING 'Decryption error (maybe plaintext?): %', SQLERRM;
    RETURN NULL;
END;
$$;

COMMENT ON FUNCTION decrypt_pii IS 
'Descriptografa dados sensíveis criptografados com encrypt_pii';

GRANT EXECUTE ON FUNCTION decrypt_pii TO authenticated;

-- =====================================================
-- 4. FUNÇÃO: Validar CPF Criptografado
-- =====================================================
CREATE OR REPLACE FUNCTION validate_encrypted_cpf(
  encrypted_cpf TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_plaintext_cpf TEXT;
BEGIN
  -- Descriptografar
  v_plaintext_cpf := decrypt_pii(encrypted_cpf);
  
  IF v_plaintext_cpf IS NULL THEN
    RETURN false;
  END IF;

  -- Validar formato
  RETURN v_plaintext_cpf ~ '^\d{3}\.\d{3}\.\d{3}-\d{2}$';
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$;

COMMENT ON FUNCTION validate_encrypted_cpf IS 
'Valida CPF criptografado (descriptografa e verifica formato)';

-- =====================================================
-- 5. FUNÇÃO: Buscar Perfil por CPF (Com Suporte a Criptografia)
-- =====================================================
CREATE OR REPLACE FUNCTION find_profile_by_cpf(
  search_cpf TEXT
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  email TEXT,
  account_type TEXT,
  is_suspended BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Tentar buscar diretamente (se não criptografado)
  RETURN QUERY
  SELECT p.id, p.name, p.email, p.account_type, p.is_suspended
  FROM profiles p
  WHERE p.cpf = search_cpf;

  -- Se não encontrou, pode estar criptografado
  -- ⚠️ NOTA: Busca em CPFs criptografados requer scan completo
  -- Em produção, usar índice com hash do CPF para otimizar
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT p.id, p.name, p.email, p.account_type, p.is_suspended
    FROM profiles p
    WHERE decrypt_pii(p.cpf) = search_cpf
    LIMIT 1;
  END IF;
END;
$$;

COMMENT ON FUNCTION find_profile_by_cpf IS 
'Busca perfil por CPF (suporta tanto texto plano quanto criptografado)';

-- =====================================================
-- 6. VIEW: Profiles com PII Descriptografado (Somente Admin)
-- =====================================================
CREATE OR REPLACE VIEW admin_profiles_with_pii AS
SELECT
  id,
  name,
  email,
  CASE 
    WHEN cpf IS NOT NULL THEN 
      COALESCE(decrypt_pii(cpf), cpf) -- Tenta descriptografar, senão mostra original
    ELSE NULL
  END as cpf_decrypted,
  CASE 
    WHEN phone IS NOT NULL THEN 
      COALESCE(decrypt_pii(phone), phone)
    ELSE NULL
  END as phone_decrypted,
  account_type,
  plan,
  is_suspended,
  created_at
FROM profiles
WHERE is_admin(); -- 🔒 Apenas admins podem ver

COMMENT ON VIEW admin_profiles_with_pii IS 
'[PROTEGIDO] View com PII descriptografado - Apenas para admins';

GRANT SELECT ON admin_profiles_with_pii TO authenticated;

-- =====================================================
-- 7. FUNÇÃO ADMIN: Migrar Dados para Criptografia
-- =====================================================
CREATE OR REPLACE FUNCTION admin_migrate_pii_to_encrypted(
  batch_size INT DEFAULT 100,
  dry_run BOOLEAN DEFAULT true
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_count INT := 0;
  v_errors INT := 0;
  v_profile RECORD;
BEGIN
  -- 🔒 VALIDAÇÃO: Apenas admins
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Admin role required';
  END IF;

  -- Processar profiles com CPF em texto plano
  FOR v_profile IN 
    SELECT id, cpf, phone
    FROM profiles
    WHERE cpf IS NOT NULL 
      AND cpf !~ '^[A-Za-z0-9+/]+=*$' -- Não é base64 (provavelmente plaintext)
    LIMIT batch_size
  LOOP
    BEGIN
      IF NOT dry_run THEN
        UPDATE profiles
        SET 
          cpf = encrypt_pii(v_profile.cpf),
          phone = CASE 
            WHEN v_profile.phone IS NOT NULL 
            THEN encrypt_pii(v_profile.phone)
            ELSE phone
          END
        WHERE id = v_profile.id;
      END IF;
      
      v_count := v_count + 1;
    EXCEPTION
      WHEN OTHERS THEN
        v_errors := v_errors + 1;
        RAISE WARNING 'Error encrypting profile %: %', v_profile.id, SQLERRM;
    END;
  END LOOP;

  -- Log de auditoria
  PERFORM log_admin_action(
    'MIGRATE_PII_ENCRYPTION',
    'profiles',
    NULL,
    NULL,
    jsonb_build_object(
      'count', v_count,
      'errors', v_errors,
      'dry_run', dry_run,
      'batch_size', batch_size
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'migrated', v_count,
    'errors', v_errors,
    'dry_run', dry_run,
    'message', CASE 
      WHEN dry_run THEN 'Dry run completed - no changes made'
      ELSE format('Migrated %s profiles to encrypted format', v_count)
    END
  );
END;
$$;

COMMENT ON FUNCTION admin_migrate_pii_to_encrypted IS 
'[PROTEGIDO] Migra CPF/telefone de texto plano para criptografado - Apenas admin';

GRANT EXECUTE ON FUNCTION admin_migrate_pii_to_encrypted TO authenticated;

-- =====================================================
-- 8. TRIGGER: Criptografar automaticamente novos registros (OPCIONAL)
-- =====================================================
-- ⚠️ DESABILITADO POR PADRÃO - Descomentar para habilitar

/*
CREATE OR REPLACE FUNCTION trigger_encrypt_pii_on_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Criptografar CPF se fornecido em plaintext
  IF NEW.cpf IS NOT NULL AND NEW.cpf !~ '^[A-Za-z0-9+/]+=*$' THEN
    NEW.cpf := encrypt_pii(NEW.cpf);
  END IF;

  -- Criptografar telefone se fornecido em plaintext
  IF NEW.phone IS NOT NULL AND NEW.phone !~ '^[A-Za-z0-9+/]+=*$' THEN
    NEW.phone := encrypt_pii(NEW.phone);
  END IF;

  RETURN NEW;
END;
$$;

-- Aplicar trigger (COMENTADO - habilitar manualmente)
-- DROP TRIGGER IF EXISTS encrypt_pii_on_profile_insert ON profiles;
-- CREATE TRIGGER encrypt_pii_on_profile_insert
-- BEFORE INSERT ON profiles
-- FOR EACH ROW
-- EXECUTE FUNCTION trigger_encrypt_pii_on_insert();
*/

-- =====================================================
-- 9. FUNÇÃO: Rotação de Chave de Criptografia
-- =====================================================
CREATE OR REPLACE FUNCTION admin_rotate_encryption_key(
  old_key TEXT,
  new_key TEXT,
  batch_size INT DEFAULT 50
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_count INT := 0;
  v_errors INT := 0;
  v_new_version INT;
  v_profile RECORD;
BEGIN
  -- 🔒 VALIDAÇÃO: Apenas admins
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Admin role required';
  END IF;

  -- Obter próxima versão
  SELECT COALESCE(MAX(key_version), 0) + 1 INTO v_new_version
  FROM encryption_config;

  -- Registrar nova versão
  INSERT INTO encryption_config (key_version, key_hash, notes)
  VALUES (
    v_new_version,
    encode(digest(new_key, 'sha256'), 'hex'),
    'Key rotation performed'
  );

  -- Re-criptografar dados com nova chave
  FOR v_profile IN 
    SELECT id, cpf, phone
    FROM profiles
    WHERE cpf IS NOT NULL
    LIMIT batch_size
  LOOP
    BEGIN
      UPDATE profiles
      SET 
        cpf = encrypt_pii(decrypt_pii(v_profile.cpf, old_key), new_key),
        phone = CASE 
          WHEN v_profile.phone IS NOT NULL 
          THEN encrypt_pii(decrypt_pii(v_profile.phone, old_key), new_key)
          ELSE phone
        END
      WHERE id = v_profile.id;
      
      v_count := v_count + 1;
    EXCEPTION
      WHEN OTHERS THEN
        v_errors := v_errors + 1;
    END;
  END LOOP;

  -- Log de auditoria
  PERFORM log_admin_action(
    'ROTATE_ENCRYPTION_KEY',
    'encryption',
    NULL,
    NULL,
    jsonb_build_object(
      'new_version', v_new_version,
      'count', v_count,
      'errors', v_errors
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'new_version', v_new_version,
    'migrated', v_count,
    'errors', v_errors
  );
END;
$$;

COMMENT ON FUNCTION admin_rotate_encryption_key IS 
'[PROTEGIDO] Rotaciona chave de criptografia - Re-criptografa dados';

-- =====================================================
-- ✅ MIGRATION COMPLETA - CRIPTOGRAFIA PII
-- =====================================================
-- Sistema de criptografia implementado com:
-- ✅ Funções encrypt_pii / decrypt_pii
-- ✅ Compatibilidade com dados existentes
-- ✅ Migração opcional e controlada
-- ✅ Rotação de chaves
-- ✅ Views protegidas para admins
-- ✅ Trigger opcional para auto-encrypt
-- 
-- ⚠️ PRÓXIMOS PASSOS:
-- 1. Definir chave de criptografia segura (vault/secrets manager)
-- 2. Executar migração gradual com admin_migrate_pii_to_encrypted
-- 3. Habilitar trigger para novos registros (se desejado)
-- 4. Configurar rotação periódica de chaves



