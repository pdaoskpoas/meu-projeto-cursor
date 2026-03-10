-- =====================================================
-- Migration 069: Configurar Cron Job para Publicação Automática
-- Data: 23/11/2025
-- Descrição: Configura job para publicar artigos agendados automaticamente
-- =====================================================

-- Habilitar extensão pg_cron (se ainda não estiver habilitada)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Remover job anterior se existir
SELECT cron.unschedule('publish-scheduled-articles');

-- Criar job para executar a cada 5 minutos
SELECT cron.schedule(
  'publish-scheduled-articles',
  '*/5 * * * *', -- A cada 5 minutos
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/publish-scheduled-articles',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

-- Verificar se o job foi criado
SELECT * FROM cron.job WHERE jobname = 'publish-scheduled-articles';

-- =====================================================
-- IMPORTANTE: Configurar variáveis de ambiente
-- =====================================================
-- No Supabase Dashboard > Project Settings > Database > Custom Postgres Config
-- Adicionar:
-- ALTER DATABASE postgres SET app.settings.supabase_url = 'https://seu-projeto.supabase.co';
-- ALTER DATABASE postgres SET app.settings.service_role_key = 'sua-service-role-key';

-- =====================================================
-- Monitoramento
-- =====================================================

-- Ver histórico de execuções
-- SELECT * FROM cron.job_run_details 
-- WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'publish-scheduled-articles')
-- ORDER BY start_time DESC LIMIT 10;

-- Ver próximas execuções agendadas
-- SELECT jobname, schedule, active, 
--        timezone('America/Sao_Paulo', timezone('UTC', next_run_time)) as proxima_execucao
-- FROM cron.job 
-- WHERE jobname = 'publish-scheduled-articles';



