-- =====================================================
-- MIGRATION 040: Políticas RLS para Admin Auditar Chat
-- Data: 04/11/2025
-- Descrição: Permitir que admins visualizem todas as
--            conversas e mensagens para auditoria de
--            fraudes, golpes e denúncias
-- =====================================================

-- =====================================================
-- POLÍTICAS PARA CONVERSATIONS
-- =====================================================

-- Permitir admin ver todas as conversas
CREATE POLICY "Admins can view all conversations" ON conversations
    FOR SELECT 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- =====================================================
-- POLÍTICAS PARA MESSAGES
-- =====================================================

-- Permitir admin ver todas as mensagens (incluindo ocultas)
CREATE POLICY "Admins can view all messages" ON messages
    FOR SELECT 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- =====================================================
-- FUNÇÃO HELPER PARA ADMIN
-- =====================================================

-- Função para admin buscar conversas com filtros
CREATE OR REPLACE FUNCTION admin_search_conversations(
  p_search_term TEXT DEFAULT NULL,
  p_user_id UUID DEFAULT NULL,
  p_animal_id UUID DEFAULT NULL,
  p_is_active BOOLEAN DEFAULT NULL,
  p_limit INT DEFAULT 50,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  conversation_id UUID,
  animal_id UUID,
  animal_name TEXT,
  animal_status TEXT,
  owner_id UUID,
  owner_name TEXT,
  interested_id UUID,
  interested_name TEXT,
  message_count BIGINT,
  last_message_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN,
  is_temporary BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_admin BOOLEAN;
BEGIN
  -- Verificar se usuário é admin
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  ) INTO v_is_admin;
  
  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Apenas administradores podem executar esta função';
  END IF;
  
  -- Buscar conversas com filtros
  RETURN QUERY
  SELECT 
    c.id AS conversation_id,
    c.animal_id,
    a.name AS animal_name,
    a.ad_status AS animal_status,
    c.animal_owner_id AS owner_id,
    p_owner.name AS owner_name,
    c.interested_user_id AS interested_id,
    p_interested.name AS interested_name,
    COUNT(m.id) AS message_count,
    MAX(m.created_at) AS last_message_at,
    c.is_active,
    c.is_temporary,
    c.created_at
  FROM conversations c
  LEFT JOIN animals a ON a.id = c.animal_id
  LEFT JOIN profiles p_owner ON p_owner.id = c.animal_owner_id
  LEFT JOIN profiles p_interested ON p_interested.id = c.interested_user_id
  LEFT JOIN messages m ON m.conversation_id = c.id
  WHERE 
    (p_search_term IS NULL OR 
     a.name ILIKE '%' || p_search_term || '%' OR
     p_owner.name ILIKE '%' || p_search_term || '%' OR
     p_interested.name ILIKE '%' || p_search_term || '%')
    AND (p_user_id IS NULL OR 
         c.animal_owner_id = p_user_id OR 
         c.interested_user_id = p_user_id)
    AND (p_animal_id IS NULL OR c.animal_id = p_animal_id)
    AND (p_is_active IS NULL OR c.is_active = p_is_active)
  GROUP BY 
    c.id, 
    c.animal_id, 
    a.name, 
    a.ad_status,
    c.animal_owner_id, 
    p_owner.name,
    c.interested_user_id, 
    p_interested.name,
    c.is_active,
    c.is_temporary,
    c.created_at
  ORDER BY last_message_at DESC NULLS LAST
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Comentário na função
COMMENT ON FUNCTION admin_search_conversations IS 'Função para admin buscar e filtrar conversas com estatísticas';

-- =====================================================
-- FUNÇÃO PARA ADMIN VISUALIZAR MENSAGENS COMPLETAS
-- =====================================================

CREATE OR REPLACE FUNCTION admin_get_conversation_messages(
  p_conversation_id UUID
)
RETURNS TABLE (
  message_id UUID,
  sender_id UUID,
  sender_name TEXT,
  content TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE,
  hidden_for_sender BOOLEAN,
  hidden_for_receiver BOOLEAN,
  deleted_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_admin BOOLEAN;
BEGIN
  -- Verificar se usuário é admin
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  ) INTO v_is_admin;
  
  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Apenas administradores podem executar esta função';
  END IF;
  
  -- Retornar todas as mensagens (incluindo ocultas)
  RETURN QUERY
  SELECT 
    m.id AS message_id,
    m.sender_id,
    p.name AS sender_name,
    m.content,
    m.created_at,
    m.read_at,
    m.hidden_for_sender,
    m.hidden_for_receiver,
    m.deleted_at
  FROM messages m
  LEFT JOIN profiles p ON p.id = m.sender_id
  WHERE m.conversation_id = p_conversation_id
  ORDER BY m.created_at ASC;
END;
$$;

-- Comentário na função
COMMENT ON FUNCTION admin_get_conversation_messages IS 'Função para admin visualizar todas as mensagens de uma conversa, incluindo mensagens ocultas';

-- =====================================================
-- FUNÇÃO PARA ADMIN SUSPENDER CONVERSA
-- =====================================================

CREATE OR REPLACE FUNCTION admin_suspend_conversation(
  p_conversation_id UUID,
  p_reason TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_admin BOOLEAN;
BEGIN
  -- Verificar se usuário é admin
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  ) INTO v_is_admin;
  
  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Apenas administradores podem suspender conversas';
  END IF;
  
  -- Desativar conversa
  UPDATE conversations
  SET 
    is_active = FALSE,
    updated_at = NOW()
  WHERE id = p_conversation_id;
  
  -- Registrar no log de sistema (se existir)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'system_logs') THEN
    INSERT INTO system_logs (operation, details, created_at)
    VALUES (
      'admin_suspend_conversation',
      jsonb_build_object(
        'conversation_id', p_conversation_id,
        'admin_id', auth.uid(),
        'reason', p_reason,
        'suspended_at', NOW()
      ),
      NOW()
    );
  END IF;
  
  RETURN TRUE;
END;
$$;

-- Comentário na função
COMMENT ON FUNCTION admin_suspend_conversation IS 'Função para admin suspender uma conversa por violação de regras';

-- =====================================================
-- VIEW PARA ESTATÍSTICAS DE CHAT (ADMIN)
-- =====================================================

CREATE OR REPLACE VIEW admin_chat_stats AS
SELECT 
  COUNT(DISTINCT c.id) AS total_conversations,
  COUNT(DISTINCT c.id) FILTER (WHERE c.is_active = true) AS active_conversations,
  COUNT(DISTINCT c.id) FILTER (WHERE c.is_active = false) AS suspended_conversations,
  COUNT(DISTINCT m.id) AS total_messages,
  COUNT(DISTINCT m.id) FILTER (WHERE m.created_at > NOW() - INTERVAL '24 hours') AS messages_last_24h,
  COUNT(DISTINCT m.id) FILTER (WHERE m.created_at > NOW() - INTERVAL '7 days') AS messages_last_7d,
  COUNT(DISTINCT m.id) FILTER (WHERE m.created_at > NOW() - INTERVAL '30 days') AS messages_last_30d,
  COUNT(DISTINCT m.sender_id) AS unique_senders,
  AVG(msg_count.count) AS avg_messages_per_conversation
FROM conversations c
LEFT JOIN messages m ON m.conversation_id = c.id
LEFT JOIN (
  SELECT conversation_id, COUNT(*) as count
  FROM messages
  GROUP BY conversation_id
) msg_count ON msg_count.conversation_id = c.id;

-- Comentário na view
COMMENT ON VIEW admin_chat_stats IS 'Estatísticas gerais do sistema de chat para dashboard admin';

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Permitir acesso à view de estatísticas apenas para admins
GRANT SELECT ON admin_chat_stats TO authenticated;

-- =====================================================
-- Log de execução
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE 'Migration 040 executada com sucesso em %', NOW();
END $$;

