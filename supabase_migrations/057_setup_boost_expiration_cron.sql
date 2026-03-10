-- =====================================================
-- MIGRACAO 057: CONFIGURAR EXPIRACAO AUTOMATICA DE BOOSTS
-- Data: 08 de Novembro de 2025
-- Descricao: Implementar pg_cron para expirar boosts automaticamente
-- Prioridade: CRITICA
-- =====================================================

-- =====================================================
-- PARTE 1: INSTALAR EXTENSAO pg_cron (se necessario)
-- =====================================================

-- Nota: Em Supabase, pg_cron ja vem instalado por padrao
-- Se estiver usando outro ambiente, descomente:
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- =====================================================
-- PARTE 2: MELHORAR FUNCAO DE EXPIRACAO
-- =====================================================

-- DROP da funcao antiga (retorna void)
DROP FUNCTION IF EXISTS public.expire_boosts();

-- Criar nova versao (retorna TABLE com estatisticas)
CREATE FUNCTION public.expire_boosts()
RETURNS TABLE (
  animals_expired INTEGER,
  events_expired INTEGER,
  history_deactivated INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_animals_count INTEGER;
  v_events_count INTEGER;
  v_history_count INTEGER;
BEGIN
  -- STEP 1: Expirar boosts de ANIMAIS
  UPDATE animals
  SET 
    is_boosted = FALSE,
    boost_expires_at = NULL
  WHERE 
    is_boosted = TRUE
    AND boost_expires_at <= NOW();
  
  GET DIAGNOSTICS v_animals_count = ROW_COUNT;
  
  -- STEP 2: Expirar boosts de EVENTOS
  UPDATE events
  SET 
    is_boosted = FALSE,
    boost_expires_at = NULL
  WHERE 
    is_boosted = TRUE
    AND boost_expires_at <= NOW();
  
  GET DIAGNOSTICS v_events_count = ROW_COUNT;
  
  -- STEP 3: Desativar historico de boosts expirados
  UPDATE boost_history
  SET is_active = FALSE
  WHERE 
    is_active = TRUE
    AND expires_at <= NOW();
  
  GET DIAGNOSTICS v_history_count = ROW_COUNT;
  
  -- STEP 4: Log da execucao
  IF (v_animals_count + v_events_count + v_history_count) > 0 THEN
    RAISE NOTICE 'Boosts expirados: % animais, % eventos, % registros de historico',
      v_animals_count, v_events_count, v_history_count;
  END IF;
  
  -- STEP 5: Retornar estatisticas
  RETURN QUERY SELECT v_animals_count, v_events_count, v_history_count;
END;
$$;

-- =====================================================
-- PARTE 3: CONFIGURAR CRON JOB
-- =====================================================

-- Remover job anterior se existir (sem erro se nao existir)
DO $$
BEGIN
  PERFORM cron.unschedule('expire-boosts-every-5min');
EXCEPTION
  WHEN OTHERS THEN
    NULL;
END $$;

-- Agendar job para executar a cada 5 minutos
SELECT cron.schedule(
  'expire-boosts-every-5min',
  '*/5 * * * *',
  $$SELECT public.expire_boosts();$$
);

-- =====================================================
-- PARTE 4: FUNCAO AUXILIAR PARA MONITORAMENTO
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_boost_expiration_stats()
RETURNS TABLE (
  total_active_boosts BIGINT,
  animals_boosted BIGINT,
  events_boosted BIGINT,
  boosts_expiring_soon BIGINT,
  boosts_expired_but_active BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM boost_history WHERE is_active = TRUE),
    (SELECT COUNT(*) FROM animals WHERE is_boosted = TRUE),
    (SELECT COUNT(*) FROM events WHERE is_boosted = TRUE),
    (SELECT COUNT(*) FROM boost_history 
     WHERE is_active = TRUE 
       AND expires_at BETWEEN NOW() AND NOW() + INTERVAL '1 hour'),
    (SELECT COUNT(*) FROM boost_history 
     WHERE is_active = TRUE 
       AND expires_at < NOW());
END;
$$;

-- =====================================================
-- PARTE 5: VIEW PARA ADMIN MONITORAR CRON JOBS
-- =====================================================

CREATE OR REPLACE VIEW public.boost_cron_status AS
SELECT 
  jobid,
  schedule,
  command,
  nodename,
  nodeport,
  database,
  username,
  active,
  jobname
FROM cron.job
WHERE jobname LIKE '%boost%'
ORDER BY jobid DESC;

-- =====================================================
-- COMENTARIOS
-- =====================================================

COMMENT ON FUNCTION public.expire_boosts() IS 
'Expira boosts de animais e eventos que atingiram boost_expires_at. Executada automaticamente a cada 5 minutos via pg_cron.';

COMMENT ON FUNCTION public.get_boost_expiration_stats() IS 
'Retorna estatisticas de boosts ativos e expirados para monitoramento no admin dashboard.';

COMMENT ON VIEW public.boost_cron_status IS 
'View para admin monitorar status do cron job de expiracao de boosts.';

-- =====================================================
-- GRANTS
-- =====================================================

GRANT SELECT ON public.boost_cron_status TO authenticated;
GRANT EXECUTE ON FUNCTION public.expire_boosts() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_boost_expiration_stats() TO authenticated;

-- =====================================================
-- TESTES DE VALIDACAO
-- =====================================================

-- Teste 1: Verificar se cron job foi criado
DO $$
DECLARE
  v_job_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM cron.job 
    WHERE jobname = 'expire-boosts-every-5min'
  ) INTO v_job_exists;
  
  IF NOT v_job_exists THEN
    RAISE WARNING 'Cron job nao foi criado. Verifique permissoes do pg_cron.';
  ELSE
    RAISE NOTICE 'Cron job expire-boosts-every-5min criado com sucesso!';
  END IF;
END $$;

-- Teste 2: Executar funcao manualmente para verificar
SELECT * FROM public.expire_boosts();

-- Teste 3: Ver estatisticas
SELECT * FROM public.get_boost_expiration_stats();

-- Teste 4: Ver status do cron
SELECT * FROM public.boost_cron_status;
