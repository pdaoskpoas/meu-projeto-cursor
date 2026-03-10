-- ====================================================================================================
-- MIGRATION 050: CORREÇÃO DE SEGURANÇA - SEARCH_PATH EM FUNÇÕES SECURITY DEFINER
-- ====================================================================================================
-- Data: 2025-11-08
-- Objetivo: Proteger 29 funções SECURITY DEFINER contra Schema Injection (CVE-2018-1058)
-- 
-- MÉTODO: ALTER FUNCTION ... SET search_path
-- Esta abordagem é SEGURA porque:
-- - Não altera a assinatura da função
-- - Não precisa recriar o corpo da função
-- - Apenas adiciona a configuração de search_path
--
-- IMPACTO: Correção de vulnerabilidade crítica de segurança
-- RISCO: Zero (apenas adiciona proteção, não altera código)
-- ====================================================================================================

BEGIN;

-- ====================================================================================================
-- ADICIONAR SEARCH_PATH SEGURO EM TODAS AS FUNÇÕES SECURITY DEFINER
-- ====================================================================================================

-- 1. aggregate_notifications
ALTER FUNCTION public.aggregate_notifications(uuid, text, uuid, integer)
SET search_path = public, pg_temp;

-- 2. auto_create_notification_preferences
ALTER FUNCTION public.auto_create_notification_preferences()
SET search_path = public, pg_temp;

-- 3. auto_track_notification_delivered
ALTER FUNCTION public.auto_track_notification_delivered()
SET search_path = public, pg_temp;

-- 4. can_accept_partnership
ALTER FUNCTION public.can_accept_partnership(uuid, uuid)
SET search_path = public, pg_temp;

-- 5. can_create_event
ALTER FUNCTION public.can_create_event(uuid)
SET search_path = public, pg_temp;

-- 6. cleanup_old_notifications
ALTER FUNCTION public.cleanup_old_notifications()
SET search_path = public, pg_temp;

-- 7. count_active_animals_with_partnerships
ALTER FUNCTION public.count_active_animals_with_partnerships(uuid)
SET search_path = public, pg_temp;

-- 8. count_active_events
ALTER FUNCTION public.count_active_events(uuid)
SET search_path = public, pg_temp;

-- 9. create_default_notification_preferences
ALTER FUNCTION public.create_default_notification_preferences(uuid)
SET search_path = public, pg_temp;

-- 10. create_notification
ALTER FUNCTION public.create_notification(uuid, text, text, text, text, jsonb, text, uuid)
SET search_path = public, pg_temp;

-- 11. get_animal_message_recipient
ALTER FUNCTION public.get_animal_message_recipient(uuid)
SET search_path = public, pg_temp;

-- 12. get_event_analytics_summary
ALTER FUNCTION public.get_event_analytics_summary()
SET search_path = public, pg_temp;

-- 13. get_notification_analytics_report
ALTER FUNCTION public.get_notification_analytics_report(timestamp with time zone, timestamp with time zone)
SET search_path = public, pg_temp;

-- 14. get_notification_stats
ALTER FUNCTION public.get_notification_stats(uuid)
SET search_path = public, pg_temp;

-- 15. get_pending_reports_count
ALTER FUNCTION public.get_pending_reports_count()
SET search_path = public, pg_temp;

-- 16. get_profile_animals
ALTER FUNCTION public.get_profile_animals(uuid)
SET search_path = public, pg_temp;

-- 17. get_reports_stats
ALTER FUNCTION public.get_reports_stats()
SET search_path = public, pg_temp;

-- 18. merge_duplicate_notifications
ALTER FUNCTION public.merge_duplicate_notifications()
SET search_path = public, pg_temp;

-- 19. notify_on_animal_engagement
ALTER FUNCTION public.notify_on_animal_engagement()
SET search_path = public, pg_temp;

-- 20. notify_on_favorite
ALTER FUNCTION public.notify_on_favorite()
SET search_path = public, pg_temp;

-- 21. notify_on_message
ALTER FUNCTION public.notify_on_message()
SET search_path = public, pg_temp;

-- 22. notify_on_partnership_accepted
ALTER FUNCTION public.notify_on_partnership_accepted()
SET search_path = public, pg_temp;

-- 23. notify_on_partnership_invite
ALTER FUNCTION public.notify_on_partnership_invite()
SET search_path = public, pg_temp;

-- 24. pause_expired_individual_ads
ALTER FUNCTION public.pause_expired_individual_ads()
SET search_path = public, pg_temp;

-- 25. process_individual_event_payment
ALTER FUNCTION public.process_individual_event_payment(uuid, uuid, text)
SET search_path = public, pg_temp;

-- 26. should_animal_be_active
ALTER FUNCTION public.should_animal_be_active(uuid)
SET search_path = public, pg_temp;

-- 27. should_send_notification
ALTER FUNCTION public.should_send_notification(uuid, text)
SET search_path = public, pg_temp;

-- 28. sync_partnership_owner_id
ALTER FUNCTION public.sync_partnership_owner_id()
SET search_path = public, pg_temp;

-- 29. track_notification_event
ALTER FUNCTION public.track_notification_event(uuid, text, text, jsonb)
SET search_path = public, pg_temp;

-- ====================================================================================================
-- VALIDAÇÃO: Confirmar que todas as funções foram protegidas
-- ====================================================================================================

DO $$
DECLARE
    vulnerable_count INTEGER;
    protected_count INTEGER;
BEGIN
    -- Contar funções SECURITY DEFINER sem search_path
    SELECT COUNT(*) INTO vulnerable_count
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.prosecdef = true
    AND pg_get_functiondef(p.oid) NOT LIKE '%SET search_path%';
    
    -- Contar funções SECURITY DEFINER COM search_path
    SELECT COUNT(*) INTO protected_count
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.prosecdef = true
    AND pg_get_functiondef(p.oid) LIKE '%SET search_path%';
    
    RAISE NOTICE '=================================================';
    RAISE NOTICE 'RESULTADO DA MIGRATION DE SEGURANÇA:';
    RAISE NOTICE '=================================================';
    RAISE NOTICE 'Funções protegidas: %', protected_count;
    RAISE NOTICE 'Funções vulneráveis: %', vulnerable_count;
    
    IF vulnerable_count > 0 THEN
        RAISE WARNING '⚠️  Ainda existem % funções SECURITY DEFINER vulneráveis!', vulnerable_count;
        RAISE WARNING 'Execute: SELECT proname FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = ''public'' AND p.prosecdef = true AND pg_get_functiondef(p.oid) NOT LIKE ''%%SET search_path%%'';';
    ELSE
        RAISE NOTICE '✅ SUCESSO! Todas as 29 funções foram protegidas!';
        RAISE NOTICE '=================================================';
    END IF;
END $$;

COMMIT;

-- ====================================================================================================
-- NOTAS PÓS-MIGRATION
-- ====================================================================================================
-- 
-- ✅ O QUE FOI FEITO:
-- - Protegidas 29 funções SECURITY DEFINER contra Schema Injection (CVE-2018-1058)
-- - Adicionado "SET search_path = public, pg_temp" usando ALTER FUNCTION
-- - Método seguro: não altera assinaturas ou corpos de funções
--
-- 🔒 IMPACTO DE SEGURANÇA:
-- - Sistema protegido contra ataques de schema injection
-- - Funções privilegiadas não podem mais executar objetos maliciosos
-- - Conformidade com melhores práticas de segurança PostgreSQL
--
-- 🧪 TESTES RECOMENDADOS:
-- 1. Testar criação de notificações
-- 2. Testar aceitação de parcerias
-- 3. Testar criação de eventos
-- 4. Verificar que todas as funcionalidades continuam operando normalmente
--
-- 📚 REFERÊNCIAS:
-- - CVE-2018-1058: https://www.postgresql.org/about/news/postgresql-103-968-9512-9417-and-9322-released-1834/
-- - PostgreSQL ALTER FUNCTION: https://www.postgresql.org/docs/current/sql-alterfunction.html
-- - Supabase Security Best Practices
--
-- ====================================================================================================

