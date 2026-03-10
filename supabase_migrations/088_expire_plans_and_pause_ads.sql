-- =====================================================
-- MIGRAÇÃO 088: EXPIRAR PLANOS E PAUSAR ANÚNCIOS
-- Data: 29/01/2026
-- Descrição: Reverte plano para free quando expirar e pausa anúncios automaticamente
-- =====================================================

-- Função para processar planos expirados
CREATE OR REPLACE FUNCTION public.process_expired_plans()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  expired_user_ids UUID[];
  affected_count INTEGER := 0;
BEGIN
  -- Coletar usuários com plano expirado
  SELECT array_agg(id) INTO expired_user_ids
  FROM profiles
  WHERE plan IS NOT NULL
    AND plan <> 'free'
    AND plan_expires_at IS NOT NULL
    AND plan_expires_at <= NOW();

  IF expired_user_ids IS NULL THEN
    RETURN 0;
  END IF;

  affected_count := array_length(expired_user_ids, 1);

  -- Reverter plano para free
  UPDATE profiles
  SET plan = 'free',
      plan_expires_at = NULL,
      is_annual_plan = false,
      updated_at = now()
  WHERE id = ANY(expired_user_ids);

  -- Pausar anúncios de animais
  UPDATE animals
  SET ad_status = 'paused',
      updated_at = now()
  WHERE owner_id = ANY(expired_user_ids)
    AND ad_status = 'active'
    AND is_individual_paid = false;

  -- Pausar anúncios de eventos
  UPDATE events
  SET ad_status = 'paused',
      updated_at = now()
  WHERE organizer_id = ANY(expired_user_ids)
    AND ad_status = 'active'
    AND is_individual_paid = false;

  -- Log da operação (se tabela existir)
  INSERT INTO system_logs (operation, details, created_at)
  VALUES (
    'plan_expiration_process',
    json_build_object(
      'affected_users', affected_count,
      'processed_at', now()
    ),
    now()
  );

  RETURN affected_count;
END;
$$;

COMMENT ON FUNCTION public.process_expired_plans() IS
  'Reverte planos expirados para free e pausa anúncios não pagos individualmente.';

-- Agendamento via pg_cron (se disponível)
DO $cron$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule('expire-plans-daily') WHERE EXISTS (
      SELECT 1 FROM cron.job WHERE jobname = 'expire-plans-daily'
    );

    PERFORM cron.schedule(
      'expire-plans-daily',
      '0 2 * * *', -- todo dia 02:00
      'SELECT public.process_expired_plans();'
    );
  ELSE
    RAISE NOTICE 'pg_cron não está habilitado. Execute manualmente: SELECT public.process_expired_plans();';
  END IF;
END;
$cron$;

