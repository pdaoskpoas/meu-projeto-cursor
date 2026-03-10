-- =====================================================
-- Migration 069: Configurar Cron Job para Publicação Automática
-- Data: 23/11/2025
-- Versão: CORRIGIDA
-- Descrição: Configura job para publicar artigos agendados automaticamente
-- =====================================================

-- Remover job anterior APENAS se existir
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM cron.job WHERE jobname = 'publish-scheduled-articles'
    ) THEN
        PERFORM cron.unschedule('publish-scheduled-articles');
    END IF;
END
$$;

-- =====================================================
-- Método 1: Via função no banco (RECOMENDADO)
-- =====================================================

-- Criar função que será chamada pelo cron
CREATE OR REPLACE FUNCTION public.publish_scheduled_articles()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  article_record RECORD;
  published_count INTEGER := 0;
BEGIN
  -- Log início
  RAISE NOTICE 'Iniciando verificação de artigos agendados...';

  -- Buscar e publicar artigos agendados
  FOR article_record IN
    SELECT id, title, slug, scheduled_publish_at
    FROM public.articles
    WHERE scheduled_publish_at <= NOW()
      AND is_published = FALSE
      AND scheduled_publish_at IS NOT NULL
  LOOP
    -- Publicar artigo
    UPDATE public.articles
    SET 
      is_published = TRUE,
      published_at = NOW(),
      scheduled_publish_at = NULL,
      updated_at = NOW()
    WHERE id = article_record.id;

    published_count := published_count + 1;
    RAISE NOTICE 'Artigo publicado: % (slug: %)', article_record.title, article_record.slug;
  END LOOP;

  RAISE NOTICE 'Publicados % artigos', published_count;
END;
$$;

-- Criar o cron job usando o mesmo padrão dos jobs existentes
SELECT cron.schedule(
  'publish-scheduled-articles',    -- Nome do job
  '*/5 * * * *',                    -- A cada 5 minutos
  'SELECT public.publish_scheduled_articles();'  -- Comando SQL
);

-- =====================================================
-- Verificação
-- =====================================================

-- Verificar se o job foi criado corretamente
DO $$
DECLARE
  job_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'publish-scheduled-articles'
  ) INTO job_exists;

  IF job_exists THEN
    RAISE NOTICE '✅ Job "publish-scheduled-articles" criado com sucesso!';
  ELSE
    RAISE EXCEPTION '❌ Erro: Job não foi criado';
  END IF;
END
$$;

-- =====================================================
-- IMPORTANTE: Testar a função manualmente
-- =====================================================

-- Você pode testar a função manualmente a qualquer momento:
-- SELECT public.publish_scheduled_articles();

-- =====================================================
-- Monitoramento
-- =====================================================

-- Ver status do job
-- SELECT 
--   jobid,
--   jobname, 
--   schedule, 
--   active,
--   database,
--   username
-- FROM cron.job 
-- WHERE jobname = 'publish-scheduled-articles';

-- Ver histórico de execuções (últimas 10)
-- SELECT 
--   runid,
--   job_pid,
--   status,
--   return_message,
--   start_time,
--   end_time
-- FROM cron.job_run_details 
-- WHERE jobid = (
--   SELECT jobid FROM cron.job WHERE jobname = 'publish-scheduled-articles'
-- )
-- ORDER BY start_time DESC 
-- LIMIT 10;

-- Ver próxima execução
-- SELECT 
--   jobname,
--   schedule,
--   timezone('America/Sao_Paulo', timezone('UTC', 
--     start_time + INTERVAL '5 minutes'
--   )) as proxima_execucao
-- FROM cron.job_run_details
-- WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'publish-scheduled-articles')
-- ORDER BY start_time DESC
-- LIMIT 1;

-- =====================================================
-- Remover job (se necessário)
-- =====================================================

-- Para remover o job completamente:
-- SELECT cron.unschedule('publish-scheduled-articles');
-- DROP FUNCTION IF EXISTS public.publish_scheduled_articles();



