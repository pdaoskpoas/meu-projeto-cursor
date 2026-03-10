-- =====================================================
-- MIGRAÇÃO 082: LIMPEZA INTELIGENTE DE NOTIFICAÇÕES
-- Data: 27/11/2024
-- Versão: TESTADA E VALIDADA
-- =====================================================

-- PASSO 1: Remover função antiga
DROP FUNCTION IF EXISTS public.cleanup_old_notifications();

-- PASSO 2: Criar função de limpeza inteligente
CREATE FUNCTION public.cleanup_old_notifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_deleted_expired INTEGER;
  v_deleted_read INTEGER;
BEGIN
  DELETE FROM public.notifications
  WHERE expires_at < NOW();
  GET DIAGNOSTICS v_deleted_expired = ROW_COUNT;
  
  DELETE FROM public.notifications
  WHERE is_read = true AND read_at < NOW() - INTERVAL '7 days';
  GET DIAGNOSTICS v_deleted_read = ROW_COUNT;
  
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'merge_duplicate_notifications') THEN
    PERFORM public.merge_duplicate_notifications();
  END IF;
  
  RAISE NOTICE 'Limpeza: % expiradas, % lidas antigas deletadas', v_deleted_expired, v_deleted_read;
END;
$function$;

-- PASSO 3: Criar função de limpeza por usuário
CREATE OR REPLACE FUNCTION public.cleanup_notifications_for_user(
  p_user_id UUID,
  p_keep_unread BOOLEAN DEFAULT true
)
RETURNS TABLE (
  deleted_count INTEGER,
  remaining_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
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
  SELECT COUNT(*) INTO v_remaining FROM public.notifications WHERE user_id = p_user_id;
  
  RETURN QUERY SELECT v_deleted, v_remaining;
END;
$function$;

-- PASSO 4: Criar view de monitoramento
CREATE OR REPLACE VIEW public.notification_health_stats AS
WITH user_counts AS (
  SELECT user_id, COUNT(*) as cnt
  FROM public.notifications
  GROUP BY user_id
)
SELECT
  COUNT(DISTINCT n.user_id) as total_users_with_notifications,
  COUNT(n.*) as total_notifications,
  ROUND(AVG(uc.cnt), 2) as avg_notifications_per_user,
  MAX(uc.cnt) as max_notifications_single_user,
  COUNT(*) FILTER (WHERE n.is_read = false) as total_unread,
  COUNT(*) FILTER (WHERE n.expires_at < NOW()) as expired_but_not_deleted,
  COUNT(*) FILTER (WHERE n.is_read = true AND n.read_at < NOW() - INTERVAL '7 days') as old_read_not_deleted
FROM public.notifications n
LEFT JOIN user_counts uc ON uc.user_id = n.user_id;

-- PASSO 5: Criar função de estatísticas
CREATE OR REPLACE FUNCTION public.get_notification_stats()
RETURNS TABLE (
  user_id UUID,
  notification_count BIGINT,
  oldest_notification TIMESTAMPTZ,
  newest_notification TIMESTAMPTZ,
  unread_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
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
$function$;

-- PASSO 6: Criar índice
CREATE INDEX IF NOT EXISTS idx_notifications_user_created 
ON public.notifications(user_id, created_at DESC);

-- PASSO 7: Executar limpeza inicial
SELECT public.cleanup_old_notifications();

-- PASSO 8: Configurar cron job (apenas se pg_cron estiver habilitado)
DO $cron$
DECLARE
  v_job_exists BOOLEAN;
BEGIN
  -- Verificar se o job já existe
  SELECT EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'cleanup-notifications-daily'
  ) INTO v_job_exists;
  
  -- Remover se existir
  IF v_job_exists THEN
    PERFORM cron.unschedule('cleanup-notifications-daily');
    RAISE NOTICE 'Job antigo removido';
  END IF;
  
  -- Criar novo job
  PERFORM cron.schedule(
    'cleanup-notifications-daily',
    '0 3 * * *',
    'SELECT public.cleanup_old_notifications();'
  );
  
  RAISE NOTICE 'Job criado com sucesso - executa diariamente às 3h AM';
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Não foi possível criar cron job: %', SQLERRM;
    RAISE NOTICE 'Execute manualmente: SELECT cron.schedule(''cleanup-notifications-daily'', ''0 3 * * *'', ''SELECT public.cleanup_old_notifications();'');';
END;
$cron$;

-- Sucesso!


