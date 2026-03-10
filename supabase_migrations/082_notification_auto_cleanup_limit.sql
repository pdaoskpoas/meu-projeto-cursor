-- =====================================================
-- MIGRAÇÃO 082: LIMPEZA AUTOMÁTICA DE NOTIFICAÇÕES
-- Data: 27/11/2024
-- Descrição: Mantém apenas as 20 notificações mais recentes por usuário
-- Objetivo: Otimizar armazenamento e melhorar performance
-- =====================================================

-- =====================================================
-- 1. FUNÇÃO DE LIMPEZA DE NOTIFICAÇÕES ANTIGAS
-- =====================================================

CREATE OR REPLACE FUNCTION public.cleanup_old_notifications()
RETURNS TRIGGER AS $$
DECLARE
  v_notification_count INTEGER;
  v_notifications_to_delete UUID[];
BEGIN
  -- Contar quantas notificações o usuário tem
  SELECT COUNT(*)
  INTO v_notification_count
  FROM public.notifications
  WHERE user_id = NEW.user_id;

  -- Se ultrapassou o limite de 20, deletar as mais antigas
  IF v_notification_count > 20 THEN
    -- Selecionar IDs das notificações mais antigas que excedem o limite
    SELECT ARRAY_AGG(id)
    INTO v_notifications_to_delete
    FROM (
      SELECT id
      FROM public.notifications
      WHERE user_id = NEW.user_id
      ORDER BY created_at DESC
      OFFSET 20
    ) old_notifications;

    -- Deletar as notificações antigas
    IF v_notifications_to_delete IS NOT NULL THEN
      DELETE FROM public.notifications
      WHERE id = ANY(v_notifications_to_delete);
      
      RAISE NOTICE 'Limpeza automática: % notificações antigas removidas para usuário %', 
        array_length(v_notifications_to_delete, 1), NEW.user_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.cleanup_old_notifications() IS 
'Trigger que mantém apenas as 20 notificações mais recentes por usuário';

-- =====================================================
-- 2. CRIAR TRIGGER PARA LIMPEZA AUTOMÁTICA
-- =====================================================

-- Remover trigger existente se houver
DROP TRIGGER IF EXISTS trigger_cleanup_notifications ON public.notifications;

-- Criar trigger que executa APÓS inserir nova notificação
CREATE TRIGGER trigger_cleanup_notifications
  AFTER INSERT ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.cleanup_old_notifications();

COMMENT ON TRIGGER trigger_cleanup_notifications ON public.notifications IS
'Trigger que garante que cada usuário tenha no máximo 20 notificações';

-- =====================================================
-- 3. LIMPEZA INICIAL (OPCIONAL - EXECUTAR UMA VEZ)
-- =====================================================

-- Esta parte limpa notificações existentes que ultrapassam o limite
-- Pode ser comentada após a primeira execução para melhorar performance

DO $$
DECLARE
  v_user_id UUID;
  v_deleted_count INTEGER := 0;
BEGIN
  -- Para cada usuário com mais de 20 notificações
  FOR v_user_id IN 
    SELECT user_id 
    FROM public.notifications 
    GROUP BY user_id 
    HAVING COUNT(*) > 20
  LOOP
    -- Deletar notificações antigas mantendo apenas as 20 mais recentes
    WITH old_notifications AS (
      SELECT id
      FROM public.notifications
      WHERE user_id = v_user_id
      ORDER BY created_at DESC
      OFFSET 20
    )
    DELETE FROM public.notifications
    WHERE id IN (SELECT id FROM old_notifications);
    
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    
    IF v_deleted_count > 0 THEN
      RAISE NOTICE 'Usuário %: % notificações antigas removidas', v_user_id, v_deleted_count;
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Limpeza inicial concluída!';
END;
$$;

-- =====================================================
-- 4. ÍNDICE PARA PERFORMANCE (SE NÃO EXISTIR)
-- =====================================================

-- Índice para buscar notificações por usuário ordenadas por data
CREATE INDEX IF NOT EXISTS idx_notifications_user_created 
ON public.notifications(user_id, created_at DESC);

-- =====================================================
-- 5. FUNÇÃO UTILITÁRIA PARA CONSULTAR LIMITE
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_notification_stats()
RETURNS TABLE (
  user_id UUID,
  notification_count BIGINT,
  oldest_notification TIMESTAMPTZ,
  newest_notification TIMESTAMPTZ,
  unread_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    n.user_id,
    COUNT(*) as notification_count,
    MIN(n.created_at) as oldest_notification,
    MAX(n.created_at) as newest_notification,
    COUNT(*) FILTER (WHERE n.is_read = false) as unread_count
  FROM public.notifications n
  GROUP BY n.user_id
  ORDER BY notification_count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_notification_stats() IS 
'Retorna estatísticas de notificações por usuário (útil para monitoramento)';

-- =====================================================
-- ✅ MIGRAÇÃO COMPLETA
-- =====================================================

-- Resultado esperado:
-- ✅ Cada usuário terá no máximo 20 notificações
-- ✅ Notificações mais antigas são automaticamente deletadas
-- ✅ Sistema otimizado e escalável
-- ✅ Performance melhorada nas queries


