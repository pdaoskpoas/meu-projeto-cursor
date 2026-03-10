-- =====================================================
-- FIX: Preservar Mensagens e Conversas
-- Data: 17/11/2025
-- URGÊNCIA: ALTA (Experiência do Usuário)
-- =====================================================

-- PROBLEMA:
-- Quando usuário é deletado, TODAS as conversas são apagadas
-- Isso afeta negativamente OUTROS usuários que perdem histórico

-- SOLUÇÃO:
-- 1. Mudar CASCADE para SET NULL em conversations
-- 2. Mudar CASCADE para SET NULL em messages
-- 3. Adicionar campos para identificar usuários deletados
-- 4. Criar função para "anonimizar" ao invés de deletar

BEGIN;

-- =====================================================
-- PASSO 1: Adicionar Campos de Identificação
-- =====================================================

-- Conversas
ALTER TABLE conversations
ADD COLUMN IF NOT EXISTS animal_owner_deleted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS interested_user_deleted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS animal_owner_name_backup TEXT,
ADD COLUMN IF NOT EXISTS interested_user_name_backup TEXT;

COMMENT ON COLUMN conversations.animal_owner_deleted IS 
'TRUE se o dono do animal foi deletado';

COMMENT ON COLUMN conversations.interested_user_deleted IS 
'TRUE se o usuário interessado foi deletado';

-- Mensagens
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS sender_deleted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS sender_name_backup TEXT;

COMMENT ON COLUMN messages.sender_deleted IS 
'TRUE se o remetente foi deletado';

COMMENT ON COLUMN messages.sender_name_backup IS 
'Nome do remetente no momento do envio - preservado após deleção';

-- =====================================================
-- PASSO 2: Popular Campos com Dados Existentes
-- =====================================================

-- Popular backup de nomes em conversas
UPDATE conversations c
SET 
  animal_owner_name_backup = p1.name,
  interested_user_name_backup = p2.name
FROM 
  profiles p1,
  profiles p2
WHERE 
  c.animal_owner_id = p1.id
  AND c.interested_user_id = p2.id
  AND c.animal_owner_name_backup IS NULL;

-- Popular backup de nomes em mensagens
UPDATE messages m
SET sender_name_backup = p.name
FROM profiles p
WHERE m.sender_id = p.id
  AND m.sender_name_backup IS NULL;

-- =====================================================
-- PASSO 3: Remover Constraints Antigas (CASCADE)
-- =====================================================

ALTER TABLE conversations
DROP CONSTRAINT IF EXISTS conversations_animal_owner_id_fkey,
DROP CONSTRAINT IF EXISTS conversations_interested_user_id_fkey;

ALTER TABLE messages
DROP CONSTRAINT IF EXISTS messages_sender_id_fkey;

-- =====================================================
-- PASSO 4: Adicionar Novas Constraints (SET NULL)
-- =====================================================

ALTER TABLE conversations
ADD CONSTRAINT conversations_animal_owner_id_fkey
  FOREIGN KEY (animal_owner_id) 
  REFERENCES profiles(id) 
  ON DELETE SET NULL,
  
ADD CONSTRAINT conversations_interested_user_id_fkey
  FOREIGN KEY (interested_user_id) 
  REFERENCES profiles(id) 
  ON DELETE SET NULL;

ALTER TABLE messages
ADD CONSTRAINT messages_sender_id_fkey
  FOREIGN KEY (sender_id) 
  REFERENCES profiles(id) 
  ON DELETE SET NULL;

-- =====================================================
-- PASSO 5: Criar Trigger para Backup Automático
-- =====================================================

-- Trigger para conversas
CREATE OR REPLACE FUNCTION backup_conversation_user_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Salvar nomes dos participantes quando conversa é criada
  IF NEW.animal_owner_id IS NOT NULL THEN
    SELECT name INTO NEW.animal_owner_name_backup
    FROM profiles WHERE id = NEW.animal_owner_id;
  END IF;
  
  IF NEW.interested_user_id IS NOT NULL THEN
    SELECT name INTO NEW.interested_user_name_backup
    FROM profiles WHERE id = NEW.interested_user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER before_insert_conversation
BEFORE INSERT ON conversations
FOR EACH ROW
EXECUTE FUNCTION backup_conversation_user_data();

-- Trigger para mensagens
CREATE OR REPLACE FUNCTION backup_message_sender_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Salvar nome do remetente quando mensagem é enviada
  IF NEW.sender_id IS NOT NULL THEN
    SELECT name INTO NEW.sender_name_backup
    FROM profiles WHERE id = NEW.sender_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER before_insert_message
BEFORE INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION backup_message_sender_data();

-- =====================================================
-- PASSO 6: Criar Trigger para Marcar Usuários Deletados
-- =====================================================

CREATE OR REPLACE FUNCTION mark_user_deleted_in_messages()
RETURNS TRIGGER AS $$
BEGIN
  -- Marcar conversas onde usuário participava
  UPDATE conversations
  SET 
    animal_owner_deleted = CASE 
      WHEN animal_owner_id = OLD.id THEN TRUE 
      ELSE animal_owner_deleted 
    END,
    interested_user_deleted = CASE 
      WHEN interested_user_id = OLD.id THEN TRUE 
      ELSE interested_user_deleted 
    END
  WHERE animal_owner_id = OLD.id 
     OR interested_user_id = OLD.id;
  
  -- Marcar mensagens enviadas por usuário
  UPDATE messages
  SET sender_deleted = TRUE
  WHERE sender_id = OLD.id;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER before_delete_profile_mark_messages
BEFORE DELETE ON profiles
FOR EACH ROW
EXECUTE FUNCTION mark_user_deleted_in_messages();

-- =====================================================
-- PASSO 7: Criar Views para Exibição
-- =====================================================

-- View para conversas (mostra "[Usuário Deletado]" quando necessário)
CREATE OR REPLACE VIEW conversations_display AS
SELECT 
  c.id,
  c.animal_id,
  -- Dono do animal
  COALESCE(c.animal_owner_id, NULL) AS animal_owner_id,
  CASE 
    WHEN c.animal_owner_deleted THEN COALESCE(c.animal_owner_name_backup, '[Usuário Deletado]')
    WHEN c.animal_owner_id IS NULL THEN '[Usuário Deletado]'
    ELSE p1.name
  END AS animal_owner_name,
  c.animal_owner_deleted,
  -- Usuário interessado
  COALESCE(c.interested_user_id, NULL) AS interested_user_id,
  CASE 
    WHEN c.interested_user_deleted THEN COALESCE(c.interested_user_name_backup, '[Usuário Deletado]')
    WHEN c.interested_user_id IS NULL THEN '[Usuário Deletado]'
    ELSE p2.name
  END AS interested_user_name,
  c.interested_user_deleted,
  -- Outros campos
  c.status,
  c.last_message_at,
  c.created_at,
  c.updated_at
FROM conversations c
LEFT JOIN profiles p1 ON c.animal_owner_id = p1.id
LEFT JOIN profiles p2 ON c.interested_user_id = p2.id;

-- View para mensagens (mostra "[Usuário Deletado]" quando necessário)
CREATE OR REPLACE VIEW messages_display AS
SELECT 
  m.id,
  m.conversation_id,
  -- Remetente
  COALESCE(m.sender_id, NULL) AS sender_id,
  CASE 
    WHEN m.sender_deleted THEN COALESCE(m.sender_name_backup, '[Usuário Deletado]')
    WHEN m.sender_id IS NULL THEN '[Usuário Deletado]'
    ELSE p.name
  END AS sender_name,
  m.sender_deleted,
  -- Conteúdo
  m.content,
  m.type,
  m.read_at,
  m.created_at,
  -- Soft delete
  m.hidden_for_sender,
  m.hidden_for_receiver,
  m.deleted_at
FROM messages m
LEFT JOIN profiles p ON m.sender_id = p.id;

-- =====================================================
-- PASSO 8: Criar Função para Obter Nome de Exibição
-- =====================================================

CREATE OR REPLACE FUNCTION get_user_display_name(
  p_user_id UUID,
  p_user_deleted BOOLEAN,
  p_name_backup TEXT
)
RETURNS TEXT AS $$
DECLARE
  v_name TEXT;
BEGIN
  -- Se usuário está deletado, usar backup ou placeholder
  IF p_user_deleted OR p_user_id IS NULL THEN
    RETURN COALESCE(p_name_backup, '[Usuário Deletado]');
  END IF;
  
  -- Buscar nome atual do usuário
  SELECT name INTO v_name
  FROM profiles
  WHERE id = p_user_id;
  
  -- Se não encontrou, usar backup ou placeholder
  RETURN COALESCE(v_name, p_name_backup, '[Usuário Deletado]');
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- VERIFICAÇÃO
-- =====================================================

-- Verificar conversas com dados de backup
SELECT 
  COUNT(*) AS total_conversations,
  COUNT(animal_owner_id) AS with_active_owner,
  COUNT(interested_user_id) AS with_active_interested,
  COUNT(animal_owner_name_backup) AS with_owner_backup,
  COUNT(interested_user_name_backup) AS with_interested_backup,
  SUM(CASE WHEN animal_owner_deleted THEN 1 ELSE 0 END) AS owner_deleted_count,
  SUM(CASE WHEN interested_user_deleted THEN 1 ELSE 0 END) AS interested_deleted_count
FROM conversations;

-- Verificar mensagens com dados de backup
SELECT 
  COUNT(*) AS total_messages,
  COUNT(sender_id) AS with_active_sender,
  COUNT(sender_name_backup) AS with_sender_backup,
  SUM(CASE WHEN sender_deleted THEN 1 ELSE 0 END) AS sender_deleted_count
FROM messages;

COMMIT;

-- =====================================================
-- RESULTADO ESPERADO
-- =====================================================

-- ✅ Conversas são preservadas quando usuário é deletado
-- ✅ Mensagens são preservadas e aparecem como "[Usuário Deletado]"
-- ✅ Outros usuários NÃO perdem histórico de conversas
-- ✅ UX melhorada (comportamento similar a WhatsApp/Telegram)
-- ✅ Dados anonimizados mas preservados

-- IMPORTANTE: Atualizar frontend para usar as views:
-- - conversations_display ao invés de conversations
-- - messages_display ao invés de messages
-- - Ou usar função get_user_display_name() diretamente

COMMENT ON TABLE conversations IS 
'Conversas - PRESERVADAS mesmo após deleção de participantes';

COMMENT ON TABLE messages IS 
'Mensagens - PRESERVADAS mesmo após deleção do remetente';

