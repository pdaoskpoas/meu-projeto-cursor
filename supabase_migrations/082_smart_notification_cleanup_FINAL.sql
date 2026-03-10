-- =====================================================
-- MIGRAÇÃO 082: LIMPEZA INTELIGENTE DE NOTIFICAÇÕES
-- Data: 27/11/2024
-- Descrição: Sistema de limpeza baseado em boas práticas do mercado
-- Inspirado em: Twitter, Facebook, Slack, Discord
-- =====================================================

-- =====================================================
-- 1. REMOVER FUNÇÃO ANTIGA
-- =====================================================

DROP FUNCTION IF EXISTS public.cleanup_old_notifications();

-- =====================================================
-- 2. CRIAR FUNÇÃO DE LIMPEZA INTELIGENTE
-- =====================================================

CREATE FUNCTION public.cleanup_old_notifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_deleted_expired INTEGER;
  v_deleted_read INTEGER;
BEGIN
  -- Estratégia 1: Deletar notificações EXPIRADAS (30+ dias)
  DELETE FROM public.notifications
  WHERE expires_at < NOW();
  
  GET DIAGNOSTICS v_deleted_expired = ROW_COUNT;
  
  -- Estratégia 2: Deletar notificações LIDAS antigas (7+ dias)
  DELETE FROM public.notifications
  WHERE is_read = true
    AND read_at < NOW() - INTERVAL '7 days';
  
  GET DIAGNOSTICS v_deleted_read = ROW_COUNT;
  
  -- Estratégia 3: Mesclar notificações duplicadas (se a função existir)
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'merge_duplicate_notifications') THEN
    PERFORM public.merge_duplicate_notifications();
  END IF;
  
  RAISE NOTICE 'Limpeza concluída: % expiradas, % lidas antigas', v_deleted_expired, v_deleted_read;
END;
$$;

COMMENT ON FUNCTION public.cleanup_old_notifications() IS 
'Limpeza inteligente baseada em boas práticas: expira por tempo + status, não por limite fixo';

-- =====================================================
-- 3. CRIAR FUNÇÃO DE LIMPEZA POR USUÁRIO
-- =====================================================

CREATE OR REPLACE FUNCTION public.cleanup_notifications_for_user(
  p_user_id UUID,
  p_keep_unread BOOLEAN DEFAULT true
)
RETURNS TABLE (
  deleted_count INTEGER,
  remaining_count INTEGER
) AS $$
DECLARE
  v_deleted INTEGER;
  v_remaining INTEGER;
BEGIN
  IF p_keep_unread THEN
    DELETE FROM public.notifications
    WHERE user_id = p_user_id
      AND is_read = true
      AND read_at < NOW() - INTERVAL '7 days';
  ELSE
    DELETE FROM public.notifications
    WHERE id IN (
      SELECT id FROM public.notifications
      WHERE user_id = p_user_id
      ORDER BY created_at DESC
      OFFSET 20
    );
  END IF;
  
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  
  SELECT COUNT(*) INTO v_remaining
  FROM public.notifications
  WHERE user_id = p_user_id;
  
  RETURN QUERY SELECT v_deleted, v_remaining;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.cleanup_notifications_for_user(UUID, BOOLEAN) IS
'Limpa notificações de um usuário específico. Útil para suporte/admin';

-- =====================================================
-- 4. CRIAR JOB AUTOMÁTICO (DIÁRIO)
-- =====================================================

-- Remover job existente se houver
SELECT cron.unschedule('cleanup-notifications-daily') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'cleanup-notifications-daily'
);

-- Criar novo job (executa todo dia às 3h AM)
SELECT cron.schedule(
  'cleanup-notifications-daily',
  '0 3 * * *',
  'SELECT public.cleanup_old_notifications();'
);

-- =====================================================
-- 5. VIEW DE MONITORAMENTO
-- =====================================================

CREATE OR REPLACE VIEW public.notification_health_stats AS
SELECT
  COUNT(DISTINCT user_id) as total_users_with_notifications,
  COUNT(*) as total_notifications,
  ROUND(AVG(user_count), 2) as avg_notifications_per_user,
  MAX(user_count) as max_notifications_single_user,
  COUNT(*) FILTER (WHERE is_read = false) as total_unread,
  COUNT(*) FILTER (WHERE expires_at < NOW()) as expired_but_not_deleted,
  COUNT(*) FILTER (WHERE is_read = true AND read_at < NOW() - INTERVAL '7 days') as old_read_not_deleted
FROM public.notifications
LEFT JOIN LATERAL (
  SELECT COUNT(*) as user_count
  FROM public.notifications n2
  WHERE n2.user_id = notifications.user_id
) stats ON true;

COMMENT ON VIEW public.notification_health_stats IS
'Dashboard de saúde do sistema de notificações';

-- =====================================================
-- 6. CRIAR FUNÇÃO DE ESTATÍSTICAS
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
-- 7. CRIAR ÍNDICE PARA PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_notifications_user_created 
ON public.notifications(user_id, created_at DESC);

-- =====================================================
-- 8. EXECUTAR LIMPEZA INICIAL
-- =====================================================

SELECT public.cleanup_old_notifications();

-- =====================================================
-- ✅ MIGRAÇÃO CONCLUÍDA
-- =====================================================

