-- =====================================================
-- FIX: Preservar Transações Financeiras
-- Data: 17/11/2025
-- URGÊNCIA: CRÍTICA (Compliance Fiscal)
-- =====================================================

-- PROBLEMA:
-- Quando usuário é deletado, todas as transações são apagadas
-- Isso viola obrigações fiscais de manter registros por 5+ anos

-- SOLUÇÃO:
-- 1. Mudar CASCADE para SET NULL
-- 2. Adicionar campos de backup para informações essenciais
-- 3. Popular campos de backup com dados existentes

BEGIN;

-- =====================================================
-- PASSO 1: Adicionar Campos de Backup
-- =====================================================

ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS user_email_backup TEXT,
ADD COLUMN IF NOT EXISTS user_name_backup TEXT,
ADD COLUMN IF NOT EXISTS user_cpf_backup TEXT,
ADD COLUMN IF NOT EXISTS user_deleted_at TIMESTAMP WITH TIME ZONE;

-- Comentários para documentação
COMMENT ON COLUMN transactions.user_email_backup IS 
'Email do usuário no momento da transação - preservado mesmo após deleção';

COMMENT ON COLUMN transactions.user_name_backup IS 
'Nome do usuário no momento da transação - preservado mesmo após deleção';

COMMENT ON COLUMN transactions.user_cpf_backup IS 
'CPF do usuário no momento da transação - preservado mesmo após deleção';

COMMENT ON COLUMN transactions.user_deleted_at IS 
'Timestamp de quando o usuário foi deletado (NULL se ainda ativo)';

-- =====================================================
-- PASSO 2: Popular Campos de Backup com Dados Existentes
-- =====================================================

UPDATE transactions t
SET 
  user_email_backup = p.email,
  user_name_backup = p.name,
  user_cpf_backup = p.cpf
FROM profiles p
WHERE t.user_id = p.id
  AND t.user_email_backup IS NULL;

-- =====================================================
-- PASSO 3: Remover Constraint Antiga (CASCADE)
-- =====================================================

ALTER TABLE transactions
DROP CONSTRAINT IF EXISTS transactions_user_id_fkey;

-- =====================================================
-- PASSO 4: Adicionar Nova Constraint (SET NULL)
-- =====================================================

ALTER TABLE transactions
ADD CONSTRAINT transactions_user_id_fkey
FOREIGN KEY (user_id) 
REFERENCES profiles(id) 
ON DELETE SET NULL;

-- =====================================================
-- PASSO 5: Criar Trigger para Atualizar Backup em INSERT/UPDATE
-- =====================================================

CREATE OR REPLACE FUNCTION backup_transaction_user_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Quando transação é criada/atualizada, salvar dados do usuário
  IF NEW.user_id IS NOT NULL THEN
    SELECT 
      email, 
      name, 
      cpf
    INTO 
      NEW.user_email_backup,
      NEW.user_name_backup,
      NEW.user_cpf_backup
    FROM profiles
    WHERE id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER before_insert_update_transaction
BEFORE INSERT OR UPDATE ON transactions
FOR EACH ROW
EXECUTE FUNCTION backup_transaction_user_data();

-- =====================================================
-- PASSO 6: Criar Trigger para Marcar Quando Usuário é Deletado
-- =====================================================

CREATE OR REPLACE FUNCTION mark_transactions_user_deleted()
RETURNS TRIGGER AS $$
BEGIN
  -- Quando usuário é deletado, marcar timestamp em suas transações
  UPDATE transactions
  SET user_deleted_at = NOW()
  WHERE user_id = OLD.id
    AND user_deleted_at IS NULL;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER before_delete_profile_mark_transactions
BEFORE DELETE ON profiles
FOR EACH ROW
EXECUTE FUNCTION mark_transactions_user_deleted();

-- =====================================================
-- PASSO 7: Criar View para Relatórios Fiscais
-- =====================================================

CREATE OR REPLACE VIEW transactions_fiscal_report AS
SELECT 
  t.id,
  t.created_at,
  COALESCE(t.user_id::TEXT, 'USUÁRIO DELETADO') AS user_id,
  COALESCE(p.email, t.user_email_backup, 'N/A') AS user_email,
  COALESCE(p.name, t.user_name_backup, 'N/A') AS user_name,
  COALESCE(p.cpf, t.user_cpf_backup, 'N/A') AS user_cpf,
  t.amount,
  t.currency,
  t.payment_method,
  t.status,
  t.stripe_payment_intent_id,
  t.type,
  t.description,
  CASE 
    WHEN t.user_deleted_at IS NOT NULL THEN 'Usuário deletado em ' || t.user_deleted_at::TEXT
    WHEN t.user_id IS NULL THEN 'Usuário deletado (data desconhecida)'
    ELSE 'Usuário ativo'
  END AS user_status
FROM transactions t
LEFT JOIN profiles p ON t.user_id = p.id;

COMMENT ON VIEW transactions_fiscal_report IS 
'View para relatórios fiscais - mantém dados mesmo de usuários deletados';

-- =====================================================
-- VERIFICAÇÃO
-- =====================================================

-- Verificar quantas transações têm dados de backup
SELECT 
  COUNT(*) AS total_transactions,
  COUNT(user_id) AS with_active_user,
  COUNT(user_email_backup) AS with_email_backup,
  COUNT(user_name_backup) AS with_name_backup,
  COUNT(user_cpf_backup) AS with_cpf_backup
FROM transactions;

COMMIT;

-- =====================================================
-- RESULTADO ESPERADO
-- =====================================================

-- ✅ Transações são preservadas quando usuário é deletado
-- ✅ user_id vira NULL mas dados essenciais ficam em backup
-- ✅ Compliance fiscal mantido (histórico de 5+ anos)
-- ✅ Auditoria possível através da view fiscal
-- ✅ Novos registros já vêm com backup automático

COMMENT ON TABLE transactions IS 
'Transações financeiras - PRESERVADAS mesmo após deleção do usuário (compliance fiscal)';

