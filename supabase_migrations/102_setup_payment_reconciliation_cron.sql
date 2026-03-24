-- =====================================================
-- Migration 102: Configurar Cron Job para Reconciliação de Pagamentos
-- Data: 23/03/2026
-- Descrição: Verifica pagamentos pendentes há mais de 15 minutos,
--            consulta o Asaas e aplica efeitos de pagamentos confirmados.
--            Garante consistência mesmo quando webhooks falham.
-- =====================================================

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Remover job anterior se existir
DO $$
BEGIN
  PERFORM cron.unschedule('reconcile-payments');
EXCEPTION
  WHEN OTHERS THEN
    NULL;
END $$;

-- Agendar job para executar a cada 15 minutos
SELECT cron.schedule(
  'reconcile-payments',
  '*/15 * * * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/reconcile-payments',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

-- Verificar se o job foi criado
SELECT jobname, schedule, active
FROM cron.job
WHERE jobname = 'reconcile-payments';

-- =====================================================
-- MONITORAMENTO
-- =====================================================

-- Ver histórico de execuções:
-- SELECT * FROM cron.job_run_details
-- WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'reconcile-payments')
-- ORDER BY start_time DESC LIMIT 20;

-- Ver próxima execução:
-- SELECT jobname, schedule, active,
--        timezone('America/Sao_Paulo', timezone('UTC', next_run_time)) as proxima_execucao
-- FROM cron.job
-- WHERE jobname = 'reconcile-payments';

-- =====================================================
-- IMPORTANTE: Requer variáveis já configuradas
-- (mesmas da migration 069)
-- ALTER DATABASE postgres SET app.settings.supabase_url = 'https://seu-projeto.supabase.co';
-- ALTER DATABASE postgres SET app.settings.service_role_key = 'sua-service-role-key';
-- =====================================================
