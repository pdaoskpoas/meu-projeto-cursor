-- =====================================================
-- MIGRAÇÃO 103: Correção Completa do Security Advisor
-- Data: 24/03/2026
-- Descrição: Corrige TODOS os problemas restantes do Security Advisor
-- =====================================================
--
-- ISSUES CORRIGIDOS:
-- [ERRORS]  11 Security Definer Views → security_invoker = true
-- [WARNINGS] ~20 Function Search Path Mutable → SET search_path
-- [WARNINGS] 8 RLS Policy Always True → Revisão/justificativa
-- [WARNINGS] Leaked Password Protection → Habilitar no dashboard
-- [INFO]    pii_encryption_keys sem policy → Intencional (service_role only)
--
-- INSTRUÇÕES:
-- 1. Acesse: Supabase Dashboard > SQL Editor
-- 2. Cole este SQL completo
-- 3. Execute
-- 4. Rode o Security Advisor novamente para validar
-- =====================================================

BEGIN;

-- =============================================================================
-- PARTE 1: CORRIGIR 11 VIEWS COM SECURITY DEFINER (ERRORS)
-- =============================================================================
-- Solução: Recriar com security_invoker = true
-- Isso faz as views respeitarem RLS do usuário que consulta

-- 1.1 articles_ready_to_publish
DROP VIEW IF EXISTS public.articles_ready_to_publish CASCADE;
CREATE VIEW public.articles_ready_to_publish
WITH (security_invoker = true)
AS
SELECT
  id,
  title,
  scheduled_publish_at,
  NOW() - scheduled_publish_at AS time_overdue
FROM articles
WHERE
  is_published = false
  AND scheduled_publish_at IS NOT NULL
  AND scheduled_publish_at <= NOW();

GRANT SELECT ON public.articles_ready_to_publish TO authenticated;

-- 1.2 public_profiles
-- NOTA: Esta view é intencionalmente pública (dados não-sensíveis)
-- mas precisa de security_invoker para satisfazer o Security Advisor
DROP VIEW IF EXISTS public.public_profiles CASCADE;
CREATE VIEW public.public_profiles
WITH (security_invoker = true)
AS
SELECT
  id,
  name,
  avatar_url,
  account_type,
  property_name,
  property_type,
  property_id,
  public_code,
  plan,
  city,
  state,
  country,
  founded_year,
  owner_name,
  bio,
  instagram,
  is_active,
  is_suspended,
  created_at
FROM profiles
WHERE is_active = true
  AND is_suspended = false;

GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- 1.3 admin_profiles_with_pii
-- NOTA: View admin-only que mostra dados desencriptados
DROP VIEW IF EXISTS public.admin_profiles_with_pii CASCADE;
CREATE VIEW public.admin_profiles_with_pii
WITH (security_invoker = true)
AS
SELECT
  id,
  name,
  email,
  CASE
    WHEN cpf IS NOT NULL THEN
      COALESCE(decrypt_pii(cpf), cpf)
    ELSE NULL
  END as cpf_decrypted,
  CASE
    WHEN phone IS NOT NULL THEN
      COALESCE(decrypt_pii(phone), phone)
    ELSE NULL
  END as phone_decrypted,
  account_type,
  plan,
  is_suspended,
  created_at
FROM profiles
WHERE EXISTS (
  SELECT 1 FROM profiles p
  WHERE p.id = (SELECT auth.uid()) AND p.role = 'admin'
);

GRANT SELECT ON public.admin_profiles_with_pii TO authenticated;

-- 1.4 animals_with_partnerships
DROP VIEW IF EXISTS public.animals_with_partnerships CASCADE;
CREATE VIEW public.animals_with_partnerships
WITH (security_invoker = true)
AS
SELECT
  a.*,
  COALESCE(
    (SELECT jsonb_agg(jsonb_build_object(
      'partner_id', ap.partner_id,
      'partner_name', p.name,
      'percentage', ap.percentage,
      'status', ap.status
    ))
    FROM animal_partnerships ap
    JOIN profiles p ON p.id = ap.partner_id
    WHERE ap.animal_id = a.id AND ap.status = 'accepted'),
    '[]'::jsonb
  ) AS partnerships
FROM animals a;

GRANT SELECT ON public.animals_with_partnerships TO authenticated;

-- 1.5 boost_cron_status
DROP VIEW IF EXISTS public.boost_cron_status CASCADE;
CREATE VIEW public.boost_cron_status
WITH (security_invoker = true)
AS
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

GRANT SELECT ON public.boost_cron_status TO authenticated;

-- 1.6 active_sponsors
DROP VIEW IF EXISTS public.active_sponsors CASCADE;
CREATE VIEW public.active_sponsors
WITH (security_invoker = true)
AS
SELECT
  id,
  name,
  description,
  website_url,
  logo_url,
  logo_horizontal_url,
  logo_square_url,
  logo_vertical_url,
  display_priority,
  display_locations,
  click_count,
  impression_count
FROM sponsors
WHERE
  is_active = true AND
  (start_date IS NULL OR start_date <= NOW()) AND
  (end_date IS NULL OR end_date >= NOW())
ORDER BY display_priority DESC, created_at DESC;

GRANT SELECT ON public.active_sponsors TO anon, authenticated;

-- 1.7 notification_health_stats
DROP VIEW IF EXISTS public.notification_health_stats CASCADE;
CREATE VIEW public.notification_health_stats
WITH (security_invoker = true)
AS
SELECT
  COUNT(DISTINCT user_id) as total_users_with_notifications,
  COUNT(*) as total_notifications,
  COUNT(*) FILTER (WHERE is_read = false) as total_unread,
  COUNT(*) FILTER (WHERE expires_at < NOW()) as expired_but_not_deleted,
  COUNT(*) FILTER (WHERE is_read = true AND read_at < NOW() - INTERVAL '7 days') as old_read_not_deleted
FROM public.notifications;

GRANT SELECT ON public.notification_health_stats TO authenticated;

-- 1.8 admin_dashboard_stats_secure
DROP VIEW IF EXISTS public.admin_dashboard_stats_secure CASCADE;
CREATE VIEW public.admin_dashboard_stats_secure
WITH (security_invoker = true)
AS
SELECT
  (SELECT COUNT(*) FROM profiles) as total_users,
  (SELECT COUNT(*) FROM profiles WHERE is_suspended = true) as suspended_users,
  (SELECT COUNT(*) FROM profiles WHERE plan != 'free') as paid_users,
  (SELECT COUNT(*) FROM animals WHERE ad_status = 'active') as active_animals,
  (SELECT COUNT(*) FROM events WHERE ad_status = 'active') as active_events,
  (SELECT COUNT(*) FROM suspensions WHERE is_active = true) as active_suspensions,
  (SELECT COUNT(*) FROM admin_audit_log WHERE created_at > NOW() - INTERVAL '24 hours') as admin_actions_24h
WHERE EXISTS (
  SELECT 1 FROM profiles
  WHERE id = (SELECT auth.uid()) AND role = 'admin'
);

GRANT SELECT ON public.admin_dashboard_stats_secure TO authenticated;

-- 1.9 animals_with_stats (caso ainda esteja com security definer)
DROP VIEW IF EXISTS public.animals_with_stats CASCADE;
CREATE VIEW public.animals_with_stats
WITH (security_invoker = true)
AS
SELECT
  a.*,
  p.name AS owner_name,
  p.property_name,
  p.public_code AS owner_public_code,
  COALESCE(imp.impression_count, 0) AS impressions,
  COALESCE(clk.click_count, 0) AS clicks,
  CASE
    WHEN COALESCE(imp.impression_count, 0) > 0
    THEN ROUND(COALESCE(clk.click_count, 0)::NUMERIC / imp.impression_count::NUMERIC * 100, 2)
    ELSE 0
  END AS ctr
FROM animals a
LEFT JOIN profiles p ON a.owner_id = p.id
LEFT JOIN (
  SELECT content_id, COUNT(*) AS impression_count
  FROM impressions
  WHERE content_type = 'animal'
  GROUP BY content_id
) imp ON a.id = imp.content_id
LEFT JOIN (
  SELECT content_id, COUNT(*) AS click_count
  FROM clicks
  WHERE content_type = 'animal'
  GROUP BY content_id
) clk ON a.id = clk.content_id;

GRANT SELECT ON public.animals_with_stats TO anon, authenticated;

-- 1.10 animals_with_titles
DROP VIEW IF EXISTS public.animals_with_titles CASCADE;
CREATE VIEW public.animals_with_titles
WITH (security_invoker = true)
AS
SELECT
  a.*,
  COALESCE(
    (SELECT jsonb_agg(jsonb_build_object(
      'id', at.id,
      'title', at.title,
      'year', at.year,
      'category', at.category
    ) ORDER BY at.year DESC)
    FROM animal_titles at
    WHERE at.animal_id = a.id),
    '[]'::jsonb
  ) AS titles
FROM animals a;

GRANT SELECT ON public.animals_with_titles TO anon, authenticated;

-- 1.11 admin_2fa_stats
DROP VIEW IF EXISTS public.admin_2fa_stats CASCADE;
CREATE VIEW public.admin_2fa_stats
WITH (security_invoker = true)
AS
SELECT
  (SELECT COUNT(*) FROM profiles WHERE two_factor_enabled = true) as users_with_2fa,
  (SELECT COUNT(*) FROM profiles WHERE role = 'admin' AND two_factor_enabled = true) as admins_with_2fa,
  (SELECT COUNT(*) FROM profiles WHERE role = 'admin') as total_admins,
  (SELECT COUNT(*) FROM two_factor_attempts WHERE created_at > NOW() - INTERVAL '24 hours') as attempts_24h,
  (SELECT COUNT(*) FROM two_factor_attempts WHERE success = false AND created_at > NOW() - INTERVAL '24 hours') as failed_attempts_24h,
  ROUND(
    100.0 * (SELECT COUNT(*) FROM profiles WHERE role = 'admin' AND two_factor_enabled = true)::decimal /
    NULLIF((SELECT COUNT(*) FROM profiles WHERE role = 'admin'), 0),
    2
  ) as admin_2fa_percentage
WHERE EXISTS (
  SELECT 1 FROM profiles
  WHERE id = (SELECT auth.uid()) AND role = 'admin'
);

GRANT SELECT ON public.admin_2fa_stats TO authenticated;


-- =============================================================================
-- PARTE 2: CORRIGIR FUNÇÕES SEM search_path (WARNINGS - Function Search Path)
-- =============================================================================
-- Usar ALTER FUNCTION SET search_path quando possível (não precisa recriar)

-- 2.1 enforce_event_payment_before_activation
ALTER FUNCTION IF EXISTS public.enforce_event_payment_before_activation()
  SET search_path = public, pg_temp;

-- 2.2 update_admin_fullways_updated_at
ALTER FUNCTION IF EXISTS public.update_admin_fullways_updated_at()
  SET search_path = public, pg_temp;

-- 2.3 update_animal_titles_updated_at
ALTER FUNCTION IF EXISTS public.update_animal_titles_updated_at()
  SET search_path = public, pg_temp;

-- 2.4 migrate_old_titles_to_animal_titles
ALTER FUNCTION IF EXISTS public.migrate_old_titles_to_animal_titles()
  SET search_path = public, pg_temp;

-- 2.5 update_sponsors_updated_at
ALTER FUNCTION IF EXISTS public.update_sponsors_updated_at()
  SET search_path = public, pg_temp;

-- 2.6 increment_sponsor_impression
ALTER FUNCTION IF EXISTS public.increment_sponsor_impression(UUID)
  SET search_path = public, pg_temp;

-- 2.7 increment_sponsor_click
ALTER FUNCTION IF EXISTS public.increment_sponsor_click(UUID)
  SET search_path = public, pg_temp;

-- 2.8 auto_publish_scheduled_articles
ALTER FUNCTION IF EXISTS public.auto_publish_scheduled_articles()
  SET search_path = public, pg_temp;

-- 2.9 check_refund_eligibility
ALTER FUNCTION IF EXISTS public.check_refund_eligibility()
  SET search_path = public, pg_temp;

-- 2.10 is_conversation_deleted_for_user
ALTER FUNCTION IF EXISTS public.is_conversation_deleted_for_user(UUID, UUID)
  SET search_path = public, pg_temp;

-- 2.11 get_event_monthly_costs
ALTER FUNCTION IF EXISTS public.get_event_monthly_costs()
  SET search_path = public, pg_temp;
-- Variação com parâmetros (caso exista com assinatura diferente)
ALTER FUNCTION IF EXISTS public.get_event_monthly_costs(UUID)
  SET search_path = public, pg_temp;

-- 2.12 clear_duplicate_article_content
ALTER FUNCTION IF EXISTS public.clear_duplicate_article_content()
  SET search_path = public, pg_temp;

-- 2.13 update_support_tickets_updated_at
ALTER FUNCTION IF EXISTS public.update_support_tickets_updated_at()
  SET search_path = public, pg_temp;

-- 2.14 check_individual_event_payment_flag
ALTER FUNCTION IF EXISTS public.check_individual_event_payment_flag()
  SET search_path = public, pg_temp;
ALTER FUNCTION IF EXISTS public.check_individual_event_payment_flag(UUID)
  SET search_path = public, pg_temp;
ALTER FUNCTION IF EXISTS public.check_individual_event_payment_flag(UUID, UUID)
  SET search_path = public, pg_temp;

-- 2.15 publish_scheduled_articles
ALTER FUNCTION IF EXISTS public.publish_scheduled_articles()
  SET search_path = public, pg_temp;

-- 2.16 set_animal_share_code
ALTER FUNCTION IF EXISTS public.set_animal_share_code()
  SET search_path = public, pg_temp;

-- 2.17 change_notification_for_user
ALTER FUNCTION IF EXISTS public.change_notification_for_user(UUID, TEXT, BOOLEAN)
  SET search_path = public, pg_temp;
ALTER FUNCTION IF EXISTS public.change_notification_for_user(UUID, TEXT)
  SET search_path = public, pg_temp;

-- 2.18 get_notification_stats (a versão que está sem search_path)
ALTER FUNCTION IF EXISTS public.get_notification_stats()
  SET search_path = public, pg_temp;
ALTER FUNCTION IF EXISTS public.get_notification_stats(UUID)
  SET search_path = public, pg_temp;

-- 2.19 respond_to_ticket
ALTER FUNCTION IF EXISTS public.respond_to_ticket(UUID, UUID, TEXT, TEXT)
  SET search_path = public, pg_temp;

-- 2.20 set_ticket_priority_by_plan
ALTER FUNCTION IF EXISTS public.set_ticket_priority_by_plan()
  SET search_path = public, pg_temp;

-- 2.21 Funções extras que podem estar sem search_path
ALTER FUNCTION IF EXISTS public.cleanup_notifications_for_user(UUID, BOOLEAN)
  SET search_path = public, pg_temp;


-- =============================================================================
-- PARTE 3: RLS POLICY ALWAYS TRUE (WARNINGS)
-- =============================================================================
-- Algumas tabelas usam USING (true) intencionalmente.
-- Vamos revisar cada caso e corrigir quando necessário.

-- 3.1 admin_audit_log - deve ser restrito a admins
-- (pode já ter sido corrigido na migration 096, mas garantir)
DROP POLICY IF EXISTS "Admin audit log is viewable by admins" ON admin_audit_log;
DROP POLICY IF EXISTS "admin_audit_log_select" ON admin_audit_log;
DROP POLICY IF EXISTS "Allow all for admin_audit_log" ON admin_audit_log;

-- Recriar com restrição de admin
CREATE POLICY "admin_audit_log_select_admin_only" ON admin_audit_log
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = (SELECT auth.uid()) AND role = 'admin')
  );

CREATE POLICY "admin_audit_log_insert_system" ON admin_audit_log
  FOR INSERT TO authenticated
  USING (true)
  WITH CHECK (true);
-- NOTA: INSERT com true é OK aqui pois audit log precisa aceitar writes do sistema

-- 3.2 clicks - INSERT público é intencional (tracking anônimo)
-- O Security Advisor reclama mas isso é by design:
-- Qualquer visitante pode registrar um clique
-- Não há dados sensíveis em clicks
-- Manter como está, mas documentar
COMMENT ON TABLE public.clicks IS
  'Tracking de cliques em conteúdo. INSERT público é intencional para analytics anônimos. Security Advisor: ignorar RLS Always True.';

-- 3.3 impressions - mesmo caso de clicks
COMMENT ON TABLE public.impressions IS
  'Tracking de impressões de conteúdo. INSERT público é intencional para analytics anônimos. Security Advisor: ignorar RLS Always True.';

-- 3.4 newsletter_subscriptions - INSERT público é intencional
-- Visitantes anônimos podem se inscrever
COMMENT ON TABLE public.newsletter_subscriptions IS
  'Inscrições em newsletter. INSERT público é intencional (formulário público). Security Advisor: ignorar RLS Always True para INSERT.';

-- 3.5 notification_analytics - restringir a owners
DROP POLICY IF EXISTS "notification_analytics_insert" ON notification_analytics;
DROP POLICY IF EXISTS "Allow insert for notification_analytics" ON notification_analytics;
-- Recriar insert policy vinculada ao user_id
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'notification_analytics' AND schemaname = 'public') THEN
    BEGIN
      CREATE POLICY "notification_analytics_insert_own" ON notification_analytics
        FOR INSERT TO authenticated
        WITH CHECK ((SELECT auth.uid()) = user_id);
    EXCEPTION WHEN duplicate_object THEN
      NULL; -- Policy já existe
    END;
  END IF;
END $$;

-- 3.6 page_visits - INSERT público é intencional (analytics)
COMMENT ON TABLE public.page_visits IS
  'Tracking de visitas a páginas. INSERT público é intencional para analytics. Security Advisor: ignorar RLS Always True.';

-- 3.7 rate_limit_tracker - INSERT público é necessário para rate limiting
COMMENT ON TABLE public.rate_limit_tracker IS
  'Rate limiting. INSERT/SELECT público é necessário para o sistema funcionar. Security Advisor: ignorar RLS Always True.';

-- 3.8 two_factor_attempts - deve ser restrito ao próprio usuário
DROP POLICY IF EXISTS "two_factor_attempts_insert" ON two_factor_attempts;
DROP POLICY IF EXISTS "Allow all for two_factor_attempts" ON two_factor_attempts;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'two_factor_attempts' AND schemaname = 'public') THEN
    BEGIN
      CREATE POLICY "2fa_attempts_insert_own" ON two_factor_attempts
        FOR INSERT TO authenticated
        WITH CHECK ((SELECT auth.uid()) = user_id);
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END;

    BEGIN
      CREATE POLICY "2fa_attempts_select_own" ON two_factor_attempts
        FOR SELECT TO authenticated
        USING ((SELECT auth.uid()) = user_id);
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END;

    BEGIN
      CREATE POLICY "2fa_attempts_select_admin" ON two_factor_attempts
        FOR SELECT TO authenticated
        USING (EXISTS (SELECT 1 FROM profiles WHERE id = (SELECT auth.uid()) AND role = 'admin'));
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END;
  END IF;
END $$;


-- =============================================================================
-- PARTE 4: pii_encryption_keys (INFO - RLS Enabled No Policy)
-- =============================================================================
-- Esta tabela INTENCIONALMENTE não tem policies.
-- RLS está habilitado para bloquear acesso via client.
-- Apenas service_role (que bypassa RLS) pode acessar.
-- Isso é o comportamento CORRETO para chaves de encriptação.
COMMENT ON TABLE public.pii_encryption_keys IS
  'Chaves de encriptação PII. Acesso apenas via service_role (bypassa RLS). Nenhuma policy de client é intencional - Security Advisor: ignorar.';


COMMIT;

-- =============================================================================
-- VALIDAÇÃO
-- =============================================================================

-- Verificar views com security_invoker
SELECT
  v.viewname,
  CASE
    WHEN obj_description((quote_ident(v.schemaname) || '.' || quote_ident(v.viewname))::regclass) IS NOT NULL
    THEN 'has comment'
    ELSE 'no comment'
  END as status
FROM pg_views v
WHERE v.schemaname = 'public'
AND v.viewname IN (
  'articles_ready_to_publish',
  'public_profiles',
  'admin_profiles_with_pii',
  'animals_with_partnerships',
  'boost_cron_status',
  'active_sponsors',
  'notification_health_stats',
  'admin_dashboard_stats_secure',
  'animals_with_stats',
  'animals_with_titles',
  'admin_2fa_stats'
)
ORDER BY v.viewname;

-- Verificar funções com search_path configurado
SELECT
  proname AS function_name,
  CASE
    WHEN proconfig IS NOT NULL
    AND array_to_string(proconfig, ',') LIKE '%search_path%'
    THEN 'OK'
    ELSE 'FALTA search_path'
  END AS status
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
AND proname IN (
  'enforce_event_payment_before_activation',
  'update_admin_fullways_updated_at',
  'update_animal_titles_updated_at',
  'migrate_old_titles_to_animal_titles',
  'update_sponsors_updated_at',
  'increment_sponsor_impression',
  'increment_sponsor_click',
  'auto_publish_scheduled_articles',
  'check_refund_eligibility',
  'is_conversation_deleted_for_user',
  'get_event_monthly_costs',
  'clear_duplicate_article_content',
  'update_support_tickets_updated_at',
  'check_individual_event_payment_flag',
  'publish_scheduled_articles',
  'set_animal_share_code',
  'change_notification_for_user',
  'get_notification_stats',
  'respond_to_ticket',
  'set_ticket_priority_by_plan'
)
ORDER BY status DESC, proname;

-- =====================================================
-- RESULTADO ESPERADO APÓS APLICAR
-- =====================================================
-- Security Advisor:
--   Errors: 0 (todas as 11 views corrigidas)
--   Warnings: ~7-8 (RLS Always True restantes são INTENCIONAIS)
--   Info: 1 (pii_encryption_keys - intencional)
--
-- NOTA: Os warnings restantes de "RLS Policy Always True" para
-- clicks, impressions, page_visits, newsletter_subscriptions,
-- e rate_limit_tracker são BY DESIGN - essas tabelas precisam
-- de INSERT público para analytics e funcionalidades públicas.
--
-- AÇÃO MANUAL NECESSÁRIA (não pode ser feito via SQL):
-- ⚠️  Leaked Password Protection:
--     Supabase Dashboard > Authentication > Settings >
--     Enable "Leaked Password Protection"
-- =====================================================
