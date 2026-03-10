-- =====================================================
-- MIGRATION 041: Auto-limpeza de Mensagens Antigas
-- Data: 04/11/2025
-- Descrição: Delete automaticamente mensagens com mais
--            de 30 dias da última mensagem enviada na conversa
-- =====================================================

-- =====================================================
-- FUNÇÃO PARA LIMPAR MENSAGENS ANTIGAS
-- =====================================================

CREATE OR REPLACE FUNCTION cleanup_old_messages()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER := 0;
  rows_deleted INTEGER;
  conversation_record RECORD;
  last_message_date TIMESTAMP WITH TIME ZONE;
  cutoff_date TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Iterar sobre todas as conversas
  FOR conversation_record IN 
    SELECT id FROM conversations
  LOOP
    -- Buscar data da última mensagem desta conversa
    SELECT MAX(created_at) INTO last_message_date
    FROM messages
    WHERE conversation_id = conversation_record.id;
    
    -- Se não há mensagens, pular
    IF last_message_date IS NULL THEN
      CONTINUE;
    END IF;
    
    -- Calcular data de corte (30 dias após última mensagem)
    cutoff_date := last_message_date + INTERVAL '30 days';
    
    -- Se já passou o período de 30 dias, deletar todas as mensagens
    IF NOW() >= cutoff_date THEN
      -- Deletar mensagens desta conversa
      DELETE FROM messages
      WHERE conversation_id = conversation_record.id;
      
      -- Obter número de linhas deletadas e somar ao total
      GET DIAGNOSTICS rows_deleted = ROW_COUNT;
      deleted_count := deleted_count + rows_deleted;
      
      -- Opcional: Deletar também a conversa vazia
      DELETE FROM conversations
      WHERE id = conversation_record.id;
    END IF;
  END LOOP;
  
  -- Registrar no log do sistema
  IF deleted_count > 0 THEN
    INSERT INTO system_logs (operation, details, created_at)
    VALUES (
      'cleanup_old_messages',
      jsonb_build_object(
        'deleted_count', deleted_count,
        'executed_at', NOW()
      ),
      NOW()
    );
  END IF;
  
  RETURN deleted_count;
END;
$$;

-- Comentário na função
COMMENT ON FUNCTION cleanup_old_messages IS 'Delete mensagens e conversas com mais de 30 dias desde a última mensagem';

-- =====================================================
-- EXTENSÃO PG_CRON (se não existir)
-- =====================================================

-- Verificar se pg_cron está disponível
DO $$
BEGIN
  -- Tentar criar a extensão (pode falhar se não estiver disponível)
  BEGIN
    CREATE EXTENSION IF NOT EXISTS pg_cron;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'pg_cron extension not available. You will need to run cleanup_old_messages() manually or set up an external scheduler.';
  END;
END $$;

-- =====================================================
-- AGENDAMENTO AUTOMÁTICO (se pg_cron disponível)
-- =====================================================

-- Agendar para executar diariamente às 3h da manhã (horário do servidor)
-- IMPORTANTE: Isso só funciona se pg_cron estiver instalado
DO $$
BEGIN
  -- Verificar se pg_cron está instalado
  IF EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'
  ) THEN
    -- Tentar remover agendamento anterior se existir (ignorar erro se não existir)
    BEGIN
      PERFORM cron.unschedule('cleanup_old_messages_daily');
      RAISE NOTICE 'Previous schedule removed.';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'No previous schedule to remove (this is normal on first run).';
    END;
    
    -- Criar novo agendamento
    BEGIN
      PERFORM cron.schedule(
        'cleanup_old_messages_daily',  -- nome do job
        '0 3 * * *',                    -- cron: todos os dias às 3h
        'SELECT cleanup_old_messages();'
      );
      RAISE NOTICE 'Auto-cleanup scheduled successfully. Will run daily at 3 AM.';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Failed to schedule auto-cleanup. Error: %', SQLERRM;
    END;
  ELSE
    RAISE NOTICE 'pg_cron not installed. Installing now...';
    
    -- Tentar instalar pg_cron
    BEGIN
      CREATE EXTENSION IF NOT EXISTS pg_cron;
      RAISE NOTICE 'pg_cron installed successfully.';
      
      -- Agora tentar criar o agendamento
      BEGIN
        PERFORM cron.schedule(
          'cleanup_old_messages_daily',
          '0 3 * * *',
          'SELECT cleanup_old_messages();'
        );
        RAISE NOTICE 'Auto-cleanup scheduled successfully. Will run daily at 3 AM.';
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Failed to schedule. Error: %', SQLERRM;
      END;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'pg_cron not available. Please run cleanup_old_messages() manually via scheduled task or edge function.';
    END;
  END IF;
END $$;

-- =====================================================
-- ALTERNATIVA: TRIGGER PARA VERIFICAR AO INSERIR
-- =====================================================

-- Função trigger que verifica se deve limpar ao inserir nova mensagem
CREATE OR REPLACE FUNCTION check_old_messages_on_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  last_msg_date TIMESTAMP WITH TIME ZONE;
  cutoff_date TIMESTAMP WITH TIME ZONE;
  rows_deleted INTEGER;
BEGIN
  -- Buscar a última mensagem ANTES desta
  SELECT MAX(created_at) INTO last_msg_date
  FROM messages
  WHERE conversation_id = NEW.conversation_id
    AND id != NEW.id;
  
  -- Se há mensagem anterior
  IF last_msg_date IS NOT NULL THEN
    cutoff_date := last_msg_date + INTERVAL '30 days';
    
    -- Se passou mais de 30 dias, limpar mensagens antigas
    IF NOW() >= cutoff_date THEN
      -- Deletar mensagens antigas (exceto a nova)
      DELETE FROM messages
      WHERE conversation_id = NEW.conversation_id
        AND id != NEW.id;
      
      -- Obter número de linhas deletadas
      GET DIAGNOSTICS rows_deleted = ROW_COUNT;
      
      -- Log
      INSERT INTO system_logs (operation, details, created_at)
      VALUES (
        'auto_cleanup_on_insert',
        jsonb_build_object(
          'conversation_id', NEW.conversation_id,
          'last_message_date', last_msg_date,
          'triggered_by_message', NEW.id,
          'rows_deleted', rows_deleted
        ),
        NOW()
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar trigger (comentado por padrão - descomente se preferir esta abordagem)
-- DROP TRIGGER IF EXISTS trigger_check_old_messages ON messages;
-- CREATE TRIGGER trigger_check_old_messages
--   AFTER INSERT ON messages
--   FOR EACH ROW
--   EXECUTE FUNCTION check_old_messages_on_insert();

-- =====================================================
-- VIEW PARA MONITORAR CONVERSAS A SEREM LIMPAS
-- =====================================================

CREATE OR REPLACE VIEW conversations_to_cleanup AS
SELECT 
  c.id AS conversation_id,
  c.animal_id,
  a.name AS animal_name,
  MAX(m.created_at) AS last_message_date,
  NOW() - MAX(m.created_at) AS days_since_last_message,
  COUNT(m.id) AS message_count,
  CASE 
    WHEN NOW() >= (MAX(m.created_at) + INTERVAL '30 days') THEN true
    ELSE false
  END AS should_cleanup,
  (MAX(m.created_at) + INTERVAL '30 days') AS cleanup_date
FROM conversations c
LEFT JOIN animals a ON a.id = c.animal_id
LEFT JOIN messages m ON m.conversation_id = c.id
WHERE m.id IS NOT NULL
GROUP BY c.id, c.animal_id, a.name
ORDER BY last_message_date DESC;

-- Comentário na view
COMMENT ON VIEW conversations_to_cleanup IS 'Monitora conversas que devem ser limpas (30+ dias desde última mensagem)';

-- =====================================================
-- FUNÇÃO PARA VISUALIZAR ESTATÍSTICAS DE LIMPEZA
-- =====================================================

CREATE OR REPLACE FUNCTION get_cleanup_stats()
RETURNS TABLE (
  total_conversations BIGINT,
  conversations_to_cleanup BIGINT,
  total_messages BIGINT,
  messages_to_cleanup BIGINT,
  oldest_message_date TIMESTAMP WITH TIME ZONE,
  estimated_cleanup_date TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM conversations)::BIGINT AS total_conversations,
    (SELECT COUNT(*) FROM conversations_to_cleanup WHERE should_cleanup = true)::BIGINT AS conversations_to_cleanup,
    (SELECT COUNT(*) FROM messages)::BIGINT AS total_messages,
    (
      SELECT COUNT(m.id)
      FROM messages m
      JOIN conversations_to_cleanup ctc ON ctc.conversation_id = m.conversation_id
      WHERE ctc.should_cleanup = true
    )::BIGINT AS messages_to_cleanup,
    (SELECT MIN(created_at) FROM messages)::TIMESTAMP WITH TIME ZONE AS oldest_message_date,
    (
      SELECT MIN(cleanup_date) 
      FROM conversations_to_cleanup 
      WHERE should_cleanup = false
    )::TIMESTAMP WITH TIME ZONE AS estimated_cleanup_date;
END;
$$;

-- Comentário na função
COMMENT ON FUNCTION get_cleanup_stats IS 'Retorna estatísticas sobre mensagens a serem limpas';

-- =====================================================
-- FUNÇÃO MANUAL DE LIMPEZA COM CONFIRMAÇÃO
-- =====================================================

CREATE OR REPLACE FUNCTION manual_cleanup_messages(
  p_confirm BOOLEAN DEFAULT false
)
RETURNS TABLE (
  conversations_affected INTEGER,
  messages_deleted INTEGER,
  success BOOLEAN,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  -- Verificar se é admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RETURN QUERY
    SELECT 0, 0, false, 'Apenas administradores podem executar limpeza manual'::TEXT;
    RETURN;
  END IF;
  
  -- Verificar confirmação
  IF NOT p_confirm THEN
    RETURN QUERY
    SELECT 
      (SELECT COUNT(*)::INTEGER FROM conversations_to_cleanup WHERE should_cleanup = true),
      (
        SELECT COUNT(m.id)::INTEGER
        FROM messages m
        JOIN conversations_to_cleanup ctc ON ctc.conversation_id = m.conversation_id
        WHERE ctc.should_cleanup = true
      ),
      false,
      'Para confirmar, execute: SELECT * FROM manual_cleanup_messages(true)'::TEXT;
    RETURN;
  END IF;
  
  -- Executar limpeza
  v_deleted_count := cleanup_old_messages();
  
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*)::INTEGER FROM conversations_to_cleanup WHERE should_cleanup = true),
    v_deleted_count,
    true,
    format('Limpeza executada com sucesso. %s mensagens deletadas.', v_deleted_count)::TEXT;
END;
$$;

-- Comentário na função
COMMENT ON FUNCTION manual_cleanup_messages IS 'Permite admin executar limpeza manual com confirmação';

-- =====================================================
-- POLÍTICA RLS PARA VIEWS
-- =====================================================

-- Permitir admin ver conversas a serem limpas
GRANT SELECT ON conversations_to_cleanup TO authenticated;

-- =====================================================
-- EXEMPLOS DE USO
-- =====================================================

-- Ver conversas que serão limpas
-- SELECT * FROM conversations_to_cleanup WHERE should_cleanup = true;

-- Ver estatísticas de limpeza
-- SELECT * FROM get_cleanup_stats();

-- Executar limpeza manualmente (visualizar)
-- SELECT * FROM manual_cleanup_messages(false);

-- Executar limpeza manualmente (confirmar)
-- SELECT * FROM manual_cleanup_messages(true);

-- Ver logs de limpeza
-- SELECT * FROM system_logs WHERE operation IN ('cleanup_old_messages', 'auto_cleanup_on_insert') ORDER BY created_at DESC LIMIT 10;

-- =====================================================
-- INSTRUÇÕES DE AGENDAMENTO ALTERNATIVO
-- =====================================================

COMMENT ON FUNCTION cleanup_old_messages IS 
'AGENDAMENTO:

1. Se pg_cron disponível (Supabase Pro):
   - Já agendado automaticamente para executar diariamente às 3h
   
2. Se pg_cron não disponível (Supabase Free):
   
   OPÇÃO A - Edge Function Agendada:
   - Criar Edge Function que chama: SELECT cleanup_old_messages();
   - Agendar via cron service externo (cron-job.org, etc)
   
   OPÇÃO B - GitHub Actions:
   - Criar workflow que executa diariamente
   - Conecta no Supabase e executa a função
   
   OPÇÃO C - Vercel Cron:
   - Se usando Vercel, usar Vercel Cron
   - Endpoint que chama o Supabase
   
   OPÇÃO D - Manual:
   - Executar periodicamente via SQL Editor:
   - SELECT cleanup_old_messages();
';

-- =====================================================
-- Log de execução
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Migration 041 executada com sucesso em %', NOW();
  RAISE NOTICE '============================================';
  RAISE NOTICE 'IMPORTANTE:';
  RAISE NOTICE '- Mensagens serão deletadas após 30 dias da última mensagem';
  RAISE NOTICE '- Conversas vazias também serão deletadas';
  RAISE NOTICE '- Para monitorar: SELECT * FROM conversations_to_cleanup;';
  RAISE NOTICE '- Para estatísticas: SELECT * FROM get_cleanup_stats();';
  RAISE NOTICE '- Para executar manualmente: SELECT * FROM manual_cleanup_messages(true);';
  RAISE NOTICE '============================================';
END $$;

