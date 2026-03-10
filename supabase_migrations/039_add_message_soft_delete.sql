-- =====================================================
-- MIGRATION 039: Sistema de Soft Delete para Mensagens
-- Data: 04/11/2025
-- Descrição: Adicionar colunas para permitir que usuários
--            apaguem mensagens individualmente sem afetar
--            a visualização da outra parte
-- =====================================================

-- Adicionar colunas de soft delete
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS hidden_for_sender BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS hidden_for_receiver BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- Criar índices para otimizar queries de mensagens ocultas
CREATE INDEX IF NOT EXISTS idx_messages_hidden_for_sender 
ON messages(hidden_for_sender) 
WHERE hidden_for_sender = true;

CREATE INDEX IF NOT EXISTS idx_messages_hidden_for_receiver 
ON messages(hidden_for_receiver) 
WHERE hidden_for_receiver = true;

CREATE INDEX IF NOT EXISTS idx_messages_deleted_at 
ON messages(deleted_at) 
WHERE deleted_at IS NOT NULL;

-- Comentários para documentação
COMMENT ON COLUMN messages.hidden_for_sender IS 'Se true, mensagem não aparece para quem enviou';
COMMENT ON COLUMN messages.hidden_for_receiver IS 'Se true, mensagem não aparece para quem recebeu';
COMMENT ON COLUMN messages.deleted_at IS 'Timestamp de quando a mensagem foi ocultada';

-- Criar função para ocultar mensagem (soft delete)
CREATE OR REPLACE FUNCTION hide_message_for_user(
  p_message_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sender_id UUID;
  v_is_sender BOOLEAN;
BEGIN
  -- Buscar sender_id da mensagem
  SELECT sender_id INTO v_sender_id
  FROM messages
  WHERE id = p_message_id;
  
  -- Se mensagem não existe, retorna false
  IF v_sender_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Verificar se usuário é o remetente
  v_is_sender := (v_sender_id = p_user_id);
  
  -- Atualizar campo apropriado
  IF v_is_sender THEN
    UPDATE messages
    SET hidden_for_sender = TRUE,
        deleted_at = NOW()
    WHERE id = p_message_id;
  ELSE
    UPDATE messages
    SET hidden_for_receiver = TRUE,
        deleted_at = NOW()
    WHERE id = p_message_id;
  END IF;
  
  RETURN TRUE;
END;
$$;

-- Comentário na função
COMMENT ON FUNCTION hide_message_for_user IS 'Oculta uma mensagem para um usuário específico (soft delete)';

-- Criar view para mensagens visíveis de um usuário
CREATE OR REPLACE VIEW user_visible_messages AS
SELECT 
  m.id,
  m.conversation_id,
  m.sender_id,
  m.content,
  m.type,
  m.read_at,
  m.created_at,
  m.deleted_at,
  c.animal_owner_id,
  c.interested_user_id,
  -- Determinar se mensagem é visível para cada participante
  CASE 
    WHEN m.sender_id = c.animal_owner_id THEN NOT m.hidden_for_sender
    ELSE NOT m.hidden_for_receiver
  END AS visible_for_owner,
  CASE 
    WHEN m.sender_id = c.interested_user_id THEN NOT m.hidden_for_sender
    ELSE NOT m.hidden_for_receiver
  END AS visible_for_interested
FROM messages m
JOIN conversations c ON c.id = m.conversation_id;

-- Comentário na view
COMMENT ON VIEW user_visible_messages IS 'View que mostra quais mensagens são visíveis para cada usuário';

-- =====================================================
-- Log de execução
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE 'Migration 039 executada com sucesso em %', NOW();
END $$;

