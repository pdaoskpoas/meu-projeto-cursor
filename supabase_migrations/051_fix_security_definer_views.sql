-- ====================================================================================================
-- MIGRATION 051: CORREÇÃO DE SEGURANÇA - VIEWS SECURITY DEFINER → SECURITY INVOKER
-- ====================================================================================================
-- Data: 2025-11-08
-- Objetivo: Converter 11 views de SECURITY DEFINER para SECURITY INVOKER
-- 
-- PROBLEMA:
-- Views criadas pelo usuário "postgres" executam como SECURITY DEFINER por padrão.
-- Isso significa que as views BYPASSAM as políticas RLS e executam com permissões elevadas.
-- Qualquer usuário pode acessar TODOS os dados através dessas views, ignorando RLS.
--
-- SOLUÇÃO:
-- Adicionar "security_invoker = true" nas views usando ALTER VIEW.
-- Isso força as views a respeitarem as permissões do USUÁRIO que está consultando,
-- não do criador da view (postgres).
--
-- IMPACTO: Correção de vulnerabilidade crítica de RLS bypass
-- RISCO: Baixo (views passarão a respeitar RLS corretamente)
-- ====================================================================================================

BEGIN;

-- ====================================================================================================
-- CONVERTER TODAS AS VIEWS PARA SECURITY INVOKER
-- ====================================================================================================

-- 1. notification_type_performance
-- Analytics de performance por tipo de notificação
ALTER VIEW public.notification_type_performance 
SET (security_invoker = true);

-- 2. notifications_summary  
-- Resumo de notificações
ALTER VIEW public.notifications_summary 
SET (security_invoker = true);

-- 3. notification_metrics
-- Métricas de notificações
ALTER VIEW public.notification_metrics 
SET (security_invoker = true);

-- 4. user_visible_messages
-- Mensagens visíveis para o usuário (respeitando ocultações)
ALTER VIEW public.user_visible_messages 
SET (security_invoker = true);

-- 5. notification_preferences_summary
-- Resumo de preferências de notificações
ALTER VIEW public.notification_preferences_summary 
SET (security_invoker = true);

-- 6. conversations_to_cleanup
-- Conversas marcadas para limpeza
ALTER VIEW public.conversations_to_cleanup 
SET (security_invoker = true);

-- 7. user_notification_metrics
-- Métricas de notificações por usuário
ALTER VIEW public.user_notification_metrics 
SET (security_invoker = true);

-- 8. user_events_dashboard
-- Dashboard de eventos do usuário
ALTER VIEW public.user_events_dashboard 
SET (security_invoker = true);

-- 9. animals_with_partnerships
-- Animais com parcerias ativas
ALTER VIEW public.animals_with_partnerships 
SET (security_invoker = true);

-- 10. user_notification_stats
-- Estatísticas de notificações do usuário
ALTER VIEW public.user_notification_stats 
SET (security_invoker = true);

-- 11. admin_chat_stats
-- Estatísticas de chat para admins
ALTER VIEW public.admin_chat_stats 
SET (security_invoker = true);

-- ====================================================================================================
-- VALIDAÇÃO: Confirmar que todas as views foram convertidas
-- ====================================================================================================

DO $$
DECLARE
    vulnerable_count INTEGER;
    protected_count INTEGER;
    total_views INTEGER := 11;
BEGIN
    -- Contar views sem security_invoker
    SELECT COUNT(*) INTO vulnerable_count
    FROM pg_class c
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE n.nspname = 'public'
    AND c.relkind = 'v'
    AND c.relname IN (
        'notification_type_performance',
        'notifications_summary',
        'notification_metrics',
        'user_visible_messages',
        'notification_preferences_summary',
        'conversations_to_cleanup',
        'user_notification_metrics',
        'user_events_dashboard',
        'animals_with_partnerships',
        'user_notification_stats',
        'admin_chat_stats'
    )
    AND (c.reloptions IS NULL OR NOT ('security_invoker=true' = ANY(c.reloptions)));
    
    -- Contar views COM security_invoker
    SELECT COUNT(*) INTO protected_count
    FROM pg_class c
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE n.nspname = 'public'
    AND c.relkind = 'v'
    AND c.relname IN (
        'notification_type_performance',
        'notifications_summary',
        'notification_metrics',
        'user_visible_messages',
        'notification_preferences_summary',
        'conversations_to_cleanup',
        'user_notification_metrics',
        'user_events_dashboard',
        'animals_with_partnerships',
        'user_notification_stats',
        'admin_chat_stats'
    )
    AND 'security_invoker=true' = ANY(c.reloptions);
    
    RAISE NOTICE '=================================================';
    RAISE NOTICE 'RESULTADO DA MIGRATION DE VIEWS:';
    RAISE NOTICE '=================================================';
    RAISE NOTICE 'Total de views alvo: %', total_views;
    RAISE NOTICE 'Views protegidas (SECURITY INVOKER): %', protected_count;
    RAISE NOTICE 'Views vulneráveis (SECURITY DEFINER): %', vulnerable_count;
    RAISE NOTICE '=================================================';
    
    IF vulnerable_count > 0 THEN
        RAISE WARNING '⚠️  Ainda existem % views vulneráveis!', vulnerable_count;
        RAISE WARNING 'Execute: SELECT relname FROM pg_class c JOIN pg_namespace n ON c.relnamespace = n.oid WHERE n.nspname = ''public'' AND c.relkind = ''v'' AND (c.reloptions IS NULL OR NOT (''security_invoker=true'' = ANY(c.reloptions)));';
    ELSIF protected_count = total_views THEN
        RAISE NOTICE '✅ SUCESSO! Todas as % views foram convertidas para SECURITY INVOKER!', total_views;
        RAISE NOTICE '✅ RLS agora será respeitada corretamente em todas as views!';
        RAISE NOTICE '=================================================';
    ELSE
        RAISE WARNING '⚠️  Resultado inesperado: % protegidas, % vulneráveis de % total', protected_count, vulnerable_count, total_views;
    END IF;
END $$;

COMMIT;

-- ====================================================================================================
-- NOTAS PÓS-MIGRATION
-- ====================================================================================================
-- 
-- ✅ O QUE FOI FEITO:
-- - Convertidas 11 views de SECURITY DEFINER para SECURITY INVOKER
-- - Views agora respeitam as políticas RLS do usuário que as consulta
-- - Não é mais possível bypassar RLS através dessas views
--
-- 🔒 IMPACTO DE SEGURANÇA:
-- - Views não podem mais ser usadas para bypassar RLS
-- - Usuários veem apenas os dados que têm permissão para ver
-- - Conformidade com o modelo de segurança definido nas RLS policies
--
-- ⚠️ MUDANÇA DE COMPORTAMENTO:
-- - ANTES: Views mostravam TODOS os dados (bypassavam RLS)
-- - DEPOIS: Views mostram apenas dados que o usuário tem permissão
--
-- 🧪 TESTES RECOMENDADOS:
-- 1. Testar views como usuário comum (não admin):
--    SELECT * FROM notification_type_performance;
--    (deve mostrar apenas dados do usuário)
--
-- 2. Testar views como admin:
--    SELECT * FROM notification_type_performance;
--    (deve mostrar todos os dados se policy permite)
--
-- 3. Verificar que aplicação continua funcionando:
--    - Dashboard de notificações
--    - Analytics de performance
--    - Listagem de eventos
--
-- 📚 REFERÊNCIAS:
-- - PostgreSQL 15+ security_invoker: https://www.postgresql.org/docs/current/sql-createview.html
-- - Supabase Views Security: https://supabase.com/docs/guides/database/postgres/row-level-security
-- - RLS Best Practices: https://supabase.com/docs/guides/database/database-linter
--
-- ====================================================================================================

