-- =====================================================
-- MIGRAÇÃO 096: Correções da Auditoria de Segurança
-- Data: 16/03/2026
-- Descrição: Corrige problemas críticos identificados na auditoria completa
-- IMPORTANTE: Executar no Supabase SQL Editor com cuidado
-- =====================================================

BEGIN;

-- =============================================================================
-- PARTE 1: CORRIGIR FUNÇÕES SECURITY DEFINER SEM search_path (CRÍTICO)
-- =============================================================================

-- 1.1 Restaurar update_updated_at_column com segurança
-- (Migration 083 sobrescreveu a versão segura da 002_FINAL)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 1.2 create_notification
CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_action_url TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}',
  p_related_content_type TEXT DEFAULT NULL,
  p_related_content_id UUID DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO public.notifications (
    user_id, type, title, message, action_url,
    metadata, related_content_type, related_content_id
  ) VALUES (
    p_user_id, p_type, p_title, p_message, p_action_url,
    p_metadata, p_related_content_type, p_related_content_id
  ) RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$$;

-- 1.3 notify_on_favorite
CREATE OR REPLACE FUNCTION public.notify_on_favorite()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_animal_name TEXT;
  v_owner_id UUID;
BEGIN
  SELECT name, owner_id INTO v_animal_name, v_owner_id
  FROM public.animals
  WHERE id = NEW.animal_id;

  IF v_owner_id = NEW.user_id THEN
    RETURN NEW;
  END IF;

  PERFORM public.create_notification(
    p_user_id := v_owner_id,
    p_type := 'favorite_added',
    p_title := 'Novo Favorito!',
    p_message := 'Seu anúncio "' || v_animal_name || '" foi favoritado por alguém.',
    p_action_url := '/animals/' || NEW.animal_id,
    p_metadata := jsonb_build_object(
      'animal_id', NEW.animal_id,
      'animal_name', v_animal_name
    ),
    p_related_content_type := 'animal',
    p_related_content_id := NEW.animal_id
  );

  RETURN NEW;
END;
$$;

-- 1.4 notify_on_message
CREATE OR REPLACE FUNCTION public.notify_on_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_receiver_id UUID;
  v_conversation_rec RECORD;
  v_sender_name TEXT;
BEGIN
  SELECT c.*, a.name as animal_name
  INTO v_conversation_rec
  FROM public.conversations c
  LEFT JOIN public.animals a ON a.id = c.animal_id
  WHERE c.id = NEW.conversation_id;

  SELECT name INTO v_sender_name
  FROM public.profiles
  WHERE id = NEW.sender_id;

  IF NEW.sender_id = v_conversation_rec.animal_owner_id THEN
    v_receiver_id := v_conversation_rec.interested_user_id;
  ELSE
    v_receiver_id := v_conversation_rec.animal_owner_id;
  END IF;

  PERFORM public.create_notification(
    p_user_id := v_receiver_id,
    p_type := 'message_received',
    p_title := 'Nova Mensagem',
    p_message := v_sender_name || ' enviou uma mensagem sobre "' || v_conversation_rec.animal_name || '".',
    p_action_url := '/dashboard/messages',
    p_metadata := jsonb_build_object(
      'conversation_id', NEW.conversation_id,
      'sender_id', NEW.sender_id,
      'sender_name', v_sender_name,
      'animal_id', v_conversation_rec.animal_id,
      'animal_name', v_conversation_rec.animal_name
    ),
    p_related_content_type := 'message',
    p_related_content_id := NEW.id
  );

  RETURN NEW;
END;
$$;

-- 1.5 notify_on_animal_engagement
CREATE OR REPLACE FUNCTION public.notify_on_animal_engagement()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_animal_name TEXT;
  v_owner_id UUID;
  v_recent_impressions INTEGER;
  v_recent_clicks INTEGER;
BEGIN
  SELECT name, owner_id INTO v_animal_name, v_owner_id
  FROM public.animals
  WHERE id = NEW.content_id
  AND NEW.content_type = 'animal';

  IF v_owner_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT COUNT(*) INTO v_recent_impressions
  FROM public.impressions
  WHERE content_id = NEW.content_id
  AND content_type = 'animal'
  AND created_at > NOW() - INTERVAL '24 hours';

  SELECT COUNT(*) INTO v_recent_clicks
  FROM public.clicks
  WHERE content_id = NEW.content_id
  AND content_type = 'animal'
  AND created_at > NOW() - INTERVAL '24 hours';

  IF v_recent_impressions % 10 = 0 THEN
    PERFORM public.create_notification(
      p_user_id := v_owner_id,
      p_type := 'animal_view',
      p_title := 'Seu anúncio está sendo visto!',
      p_message := 'Seu anúncio "' || v_animal_name || '" atingiu ' || v_recent_impressions || ' visualizações nas últimas 24h.',
      p_action_url := '/animals/' || NEW.content_id,
      p_metadata := jsonb_build_object(
        'animal_id', NEW.content_id,
        'animal_name', v_animal_name,
        'impressions_count', v_recent_impressions,
        'clicks_count', v_recent_clicks
      ),
      p_related_content_type := 'animal',
      p_related_content_id := NEW.content_id
    );
  END IF;

  RETURN NEW;
END;
$$;

-- 1.6 notify_on_partnership_invite
CREATE OR REPLACE FUNCTION public.notify_on_partnership_invite()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_animal_name TEXT;
  v_inviter_name TEXT;
BEGIN
  SELECT name INTO v_animal_name
  FROM public.animals
  WHERE id = NEW.animal_id;

  SELECT p.name INTO v_inviter_name
  FROM public.animals a
  JOIN public.profiles p ON p.id = a.owner_id
  WHERE a.id = NEW.animal_id;

  IF NEW.status = 'pending' THEN
    PERFORM public.create_notification(
      p_user_id := NEW.partner_id,
      p_type := 'partnership_invite',
      p_title := 'Convite de Sociedade',
      p_message := v_inviter_name || ' convidou você para ser sócio do animal "' || v_animal_name || '".',
      p_action_url := '/dashboard/partnerships',
      p_metadata := jsonb_build_object(
        'animal_id', NEW.animal_id,
        'animal_name', v_animal_name,
        'partnership_id', NEW.id,
        'percentage', NEW.percentage
      ),
      p_related_content_type := 'partnership',
      p_related_content_id := NEW.id
    );
  END IF;

  RETURN NEW;
END;
$$;

-- 1.7 cleanup_old_notifications
CREATE OR REPLACE FUNCTION public.cleanup_old_notifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  DELETE FROM public.notifications
  WHERE expires_at < NOW();

  DELETE FROM public.notifications
  WHERE is_read = true
  AND read_at < NOW() - INTERVAL '7 days';
END;
$$;

-- 1.8 log_payment_audit
CREATE OR REPLACE FUNCTION public.log_payment_audit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO payment_audit_log (
    entity_type, entity_id, action,
    old_data, new_data, performed_by_type
  ) VALUES (
    TG_TABLE_NAME::TEXT,
    COALESCE(NEW.id, OLD.id),
    CASE
      WHEN TG_OP = 'INSERT' THEN 'created'
      WHEN TG_OP = 'UPDATE' THEN 'updated'
      WHEN TG_OP = 'DELETE' THEN 'deleted'
    END,
    to_jsonb(OLD),
    to_jsonb(NEW),
    'system'
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- 1.9 update_profile_on_subscription_active
CREATE OR REPLACE FUNCTION public.update_profile_on_subscription_active()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.status = 'active' AND (OLD IS NULL OR OLD.status != 'active') THEN
    UPDATE profiles SET
      plan = NEW.plan_type,
      plan_expires_at = NEW.expires_at,
      plan_purchased_at = NEW.started_at,
      is_annual_plan = (NEW.billing_type = 'annual'),
      updated_at = now()
    WHERE id = NEW.user_id;

    IF NEW.first_payment_at IS NOT NULL AND NEW.refund_deadline IS NULL THEN
      UPDATE asaas_subscriptions
      SET refund_deadline = NEW.first_payment_at + INTERVAL '7 days'
      WHERE id = NEW.id;
    END IF;
  END IF;

  IF NEW.status IN ('cancelled', 'expired', 'suspended') AND OLD.status = 'active' THEN
    UPDATE profiles SET
      plan = 'free',
      plan_expires_at = NULL,
      is_annual_plan = false,
      updated_at = now()
    WHERE id = NEW.user_id;

    UPDATE animals SET
      ad_status = 'paused',
      updated_at = now()
    WHERE owner_id = NEW.user_id AND ad_status = 'active' AND is_individual_paid = false;

    UPDATE events SET
      ad_status = 'paused',
      updated_at = now()
    WHERE organizer_id = NEW.user_id AND ad_status = 'active' AND is_individual_paid = false;
  END IF;

  RETURN NEW;
END;
$$;

-- 1.10 Corrigir admin functions (falta pg_temp no search_path)
CREATE OR REPLACE FUNCTION public.admin_search_conversations(
  p_search_term TEXT DEFAULT NULL,
  p_user_id UUID DEFAULT NULL,
  p_animal_id UUID DEFAULT NULL,
  p_is_active BOOLEAN DEFAULT NULL,
  p_limit INT DEFAULT 50,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  conversation_id UUID,
  animal_id UUID,
  animal_name TEXT,
  animal_status TEXT,
  owner_id UUID,
  owner_name TEXT,
  interested_id UUID,
  interested_name TEXT,
  message_count BIGINT,
  last_message_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN,
  is_temporary BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_is_admin BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = (SELECT auth.uid()) AND role = 'admin'
  ) INTO v_is_admin;

  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Apenas administradores podem executar esta função';
  END IF;

  RETURN QUERY
  SELECT
    c.id AS conversation_id,
    c.animal_id,
    a.name AS animal_name,
    a.ad_status AS animal_status,
    c.animal_owner_id AS owner_id,
    p_owner.name AS owner_name,
    c.interested_user_id AS interested_id,
    p_interested.name AS interested_name,
    COUNT(m.id) AS message_count,
    MAX(m.created_at) AS last_message_at,
    c.is_active,
    c.is_temporary,
    c.created_at
  FROM conversations c
  LEFT JOIN animals a ON a.id = c.animal_id
  LEFT JOIN profiles p_owner ON p_owner.id = c.animal_owner_id
  LEFT JOIN profiles p_interested ON p_interested.id = c.interested_user_id
  LEFT JOIN messages m ON m.conversation_id = c.id
  WHERE
    (p_search_term IS NULL OR
     a.name ILIKE '%' || p_search_term || '%' OR
     p_owner.name ILIKE '%' || p_search_term || '%' OR
     p_interested.name ILIKE '%' || p_search_term || '%')
    AND (p_user_id IS NULL OR
         c.animal_owner_id = p_user_id OR
         c.interested_user_id = p_user_id)
    AND (p_animal_id IS NULL OR c.animal_id = p_animal_id)
    AND (p_is_active IS NULL OR c.is_active = p_is_active)
  GROUP BY
    c.id, c.animal_id, a.name, a.ad_status,
    c.animal_owner_id, p_owner.name,
    c.interested_user_id, p_interested.name,
    c.is_active, c.is_temporary, c.created_at
  ORDER BY last_message_at DESC NULLS LAST
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_get_conversation_messages(
  p_conversation_id UUID
)
RETURNS TABLE (
  message_id UUID,
  sender_id UUID,
  sender_name TEXT,
  content TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE,
  hidden_for_sender BOOLEAN,
  hidden_for_receiver BOOLEAN,
  deleted_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_is_admin BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = (SELECT auth.uid()) AND role = 'admin'
  ) INTO v_is_admin;

  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Apenas administradores podem executar esta função';
  END IF;

  RETURN QUERY
  SELECT
    m.id AS message_id,
    m.sender_id,
    p.name AS sender_name,
    m.content,
    m.created_at,
    m.read_at,
    m.hidden_for_sender,
    m.hidden_for_receiver,
    m.deleted_at
  FROM messages m
  LEFT JOIN profiles p ON p.id = m.sender_id
  WHERE m.conversation_id = p_conversation_id
  ORDER BY m.created_at ASC;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_suspend_conversation(
  p_conversation_id UUID,
  p_reason TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_is_admin BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = (SELECT auth.uid()) AND role = 'admin'
  ) INTO v_is_admin;

  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Apenas administradores podem suspender conversas';
  END IF;

  UPDATE conversations
  SET is_active = FALSE, updated_at = NOW()
  WHERE id = p_conversation_id;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'system_logs') THEN
    INSERT INTO system_logs (operation, details, created_at)
    VALUES (
      'admin_suspend_conversation',
      jsonb_build_object(
        'conversation_id', p_conversation_id,
        'admin_id', (SELECT auth.uid()),
        'reason', p_reason,
        'suspended_at', NOW()
      ),
      NOW()
    );
  END IF;

  RETURN TRUE;
END;
$$;

-- 1.11 Funções do AdSense
CREATE OR REPLACE FUNCTION public.update_adsense_config_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.ensure_single_active_adsense_config()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.is_active = TRUE AND (OLD.is_active IS NULL OR OLD.is_active = FALSE) THEN
    UPDATE adsense_config
    SET is_active = FALSE
    WHERE id != NEW.id AND is_active = TRUE;
  END IF;
  RETURN NEW;
END;
$$;

-- =============================================================================
-- PARTE 2: CORRIGIR VIEWS SEM security_invoker (ALTO)
-- =============================================================================

-- 2.1 user_notification_stats
DROP VIEW IF EXISTS public.user_notification_stats CASCADE;
CREATE VIEW public.user_notification_stats
WITH (security_invoker = true)
AS
SELECT
  user_id,
  COUNT(*) as total_notifications,
  COUNT(*) FILTER (WHERE is_read = false) as unread_count,
  COUNT(*) FILTER (WHERE type = 'favorite_added') as favorites_count,
  COUNT(*) FILTER (WHERE type = 'message_received') as messages_count,
  COUNT(*) FILTER (WHERE type = 'animal_view') as views_count,
  MAX(created_at) as last_notification_at
FROM public.notifications
WHERE expires_at > NOW()
GROUP BY user_id;

GRANT SELECT ON public.user_notification_stats TO authenticated;

-- 2.2 admin_chat_stats
DROP VIEW IF EXISTS public.admin_chat_stats CASCADE;
CREATE VIEW public.admin_chat_stats
WITH (security_invoker = true)
AS
SELECT
  COUNT(DISTINCT c.id) AS total_conversations,
  COUNT(DISTINCT c.id) FILTER (WHERE c.is_active = true) AS active_conversations,
  COUNT(DISTINCT c.id) FILTER (WHERE c.is_active = false) AS suspended_conversations,
  COUNT(DISTINCT m.id) AS total_messages,
  COUNT(DISTINCT m.id) FILTER (WHERE m.created_at > NOW() - INTERVAL '24 hours') AS messages_last_24h,
  COUNT(DISTINCT m.id) FILTER (WHERE m.created_at > NOW() - INTERVAL '7 days') AS messages_last_7d,
  COUNT(DISTINCT m.id) FILTER (WHERE m.created_at > NOW() - INTERVAL '30 days') AS messages_last_30d,
  COUNT(DISTINCT m.sender_id) AS unique_senders,
  AVG(msg_count.count) AS avg_messages_per_conversation
FROM conversations c
LEFT JOIN messages m ON m.conversation_id = c.id
LEFT JOIN (
  SELECT conversation_id, COUNT(*) as count
  FROM messages
  GROUP BY conversation_id
) msg_count ON msg_count.conversation_id = c.id;

GRANT SELECT ON public.admin_chat_stats TO authenticated;

-- 2.3 active_subscriptions
DROP VIEW IF EXISTS public.active_subscriptions CASCADE;
CREATE VIEW public.active_subscriptions
WITH (security_invoker = true)
AS
SELECT
  s.id,
  s.user_id,
  p.name as user_name,
  p.email as user_email,
  s.plan_type,
  s.billing_type,
  s.value,
  s.status,
  s.started_at,
  s.expires_at,
  s.next_due_date,
  s.can_refund,
  s.refund_deadline,
  c.asaas_customer_id
FROM asaas_subscriptions s
JOIN profiles p ON p.id = s.user_id
JOIN asaas_customers c ON c.id = s.asaas_customer_id
WHERE s.status = 'active';

GRANT SELECT ON public.active_subscriptions TO authenticated;

-- 2.4 pending_payments
DROP VIEW IF EXISTS public.pending_payments CASCADE;
CREATE VIEW public.pending_payments
WITH (security_invoker = true)
AS
SELECT
  pay.id,
  pay.user_id,
  p.name as user_name,
  p.email as user_email,
  pay.payment_type,
  pay.value,
  pay.billing_type,
  pay.status,
  pay.due_date,
  pay.invoice_url,
  pay.pix_copy_paste,
  pay.created_at
FROM asaas_payments pay
JOIN profiles p ON p.id = pay.user_id
WHERE pay.status IN ('pending', 'overdue');

GRANT SELECT ON public.pending_payments TO authenticated;

-- 2.5 pending_refunds
DROP VIEW IF EXISTS public.pending_refunds CASCADE;
CREATE VIEW public.pending_refunds
WITH (security_invoker = true)
AS
SELECT
  r.id,
  r.user_id,
  p.name as user_name,
  p.email as user_email,
  r.amount,
  r.reason,
  r.user_notes,
  r.refund_type,
  r.status,
  r.requested_at,
  pay.asaas_payment_id
FROM refunds r
JOIN profiles p ON p.id = r.user_id
JOIN asaas_payments pay ON pay.id = r.payment_id
WHERE r.status IN ('requested', 'approved', 'processing');

GRANT SELECT ON public.pending_refunds TO authenticated;

-- =============================================================================
-- PARTE 3: CORRIGIR POLICIES RLS CRÍTICAS
-- =============================================================================

-- 3.1 Restringir INSERT em notifications (ALTO)
-- Apenas triggers/funções do sistema devem criar notificações
DROP POLICY IF EXISTS "system_can_create_notifications" ON public.notifications;
-- Nota: As notificações são criadas via funções SECURITY DEFINER
-- que já bypassam RLS. Não é necessária policy de INSERT para authenticated.
-- Se o frontend precisar criar notificações, usar a função create_notification().

-- 3.2 Restringir payment_audit_log (ALTO)
-- Apenas admins devem ver o audit log, não todos os autenticados
DROP POLICY IF EXISTS "Authenticated users can view audit log" ON public.payment_audit_log;
DROP POLICY IF EXISTS "Only admins can view audit log" ON public.payment_audit_log;
CREATE POLICY "Only admins can view audit log" ON public.payment_audit_log
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = (SELECT auth.uid()) AND role = 'admin'
    )
  );

-- 3.3 Remover policies de service_role (desnecessárias - service_role bypassa RLS)
DROP POLICY IF EXISTS "Service role can manage customers" ON asaas_customers;
DROP POLICY IF EXISTS "Service role can manage subscriptions" ON asaas_subscriptions;
DROP POLICY IF EXISTS "Service role can manage payments" ON asaas_payments;
DROP POLICY IF EXISTS "Service role can manage refunds" ON refunds;
DROP POLICY IF EXISTS "Service role can manage webhooks" ON asaas_webhooks_log;
DROP POLICY IF EXISTS "Service role can insert audit log" ON payment_audit_log;

-- 3.4 Otimizar auth.uid() em policies recentes (usar subquery)

-- Notifications
DROP POLICY IF EXISTS "users_can_view_own_notifications" ON public.notifications;
CREATE POLICY "users_can_view_own_notifications"
  ON public.notifications FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "users_can_update_own_notifications" ON public.notifications;
CREATE POLICY "users_can_update_own_notifications"
  ON public.notifications FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "users_can_delete_own_notifications" ON public.notifications;
CREATE POLICY "users_can_delete_own_notifications"
  ON public.notifications FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "admins_can_view_all_notifications" ON public.notifications;
CREATE POLICY "admins_can_view_all_notifications"
  ON public.notifications FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid()) AND role = 'admin'
    )
  );

-- Asaas Customers
DROP POLICY IF EXISTS "Users can view own customer data" ON asaas_customers;
CREATE POLICY "Users can view own customer data" ON asaas_customers
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Admins can view all customer data" ON asaas_customers;
CREATE POLICY "Admins can view all customer data" ON asaas_customers
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = (SELECT auth.uid()) AND role = 'admin')
  );

-- Asaas Subscriptions
DROP POLICY IF EXISTS "Users can view own subscriptions" ON asaas_subscriptions;
CREATE POLICY "Users can view own subscriptions" ON asaas_subscriptions
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Admins can view all subscriptions" ON asaas_subscriptions;
CREATE POLICY "Admins can view all subscriptions" ON asaas_subscriptions
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = (SELECT auth.uid()) AND role = 'admin')
  );

-- Asaas Payments
DROP POLICY IF EXISTS "Users can view own payments" ON asaas_payments;
CREATE POLICY "Users can view own payments" ON asaas_payments
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Admins can view all payments" ON asaas_payments;
CREATE POLICY "Admins can view all payments" ON asaas_payments
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = (SELECT auth.uid()) AND role = 'admin')
  );

-- Refunds
DROP POLICY IF EXISTS "Users can view own refunds" ON refunds;
CREATE POLICY "Users can view own refunds" ON refunds
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can request refunds" ON refunds;
CREATE POLICY "Users can request refunds" ON refunds
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Admins can manage all refunds" ON refunds;
CREATE POLICY "Admins can manage all refunds" ON refunds
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = (SELECT auth.uid()) AND role = 'admin')
  );

-- Webhooks Log
DROP POLICY IF EXISTS "Admins can view webhooks" ON asaas_webhooks_log;
CREATE POLICY "Admins can view webhooks" ON asaas_webhooks_log
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = (SELECT auth.uid()) AND role = 'admin')
  );

-- Page Visits
DROP POLICY IF EXISTS "Admins can read page visits" ON page_visits;
CREATE POLICY "Admins can read page visits" ON page_visits
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (SELECT auth.uid()) AND profiles.role = 'admin'
    )
  );

-- Newsletter
DROP POLICY IF EXISTS "newsletter_select_admin" ON public.newsletter_subscriptions;
CREATE POLICY "newsletter_select_admin"
  ON public.newsletter_subscriptions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid()) AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "newsletter_delete_admin" ON public.newsletter_subscriptions;
CREATE POLICY "newsletter_delete_admin"
  ON public.newsletter_subscriptions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid()) AND profiles.role = 'admin'
    )
  );

-- AdSense Config
DROP POLICY IF EXISTS "Admins can read adsense config" ON adsense_config;
CREATE POLICY "Admins can read adsense config" ON adsense_config
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = (SELECT auth.uid()) AND profiles.role = 'admin')
  );

DROP POLICY IF EXISTS "Admins can insert adsense config" ON adsense_config;
CREATE POLICY "Admins can insert adsense config" ON adsense_config
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = (SELECT auth.uid()) AND profiles.role = 'admin')
  );

DROP POLICY IF EXISTS "Admins can update adsense config" ON adsense_config;
CREATE POLICY "Admins can update adsense config" ON adsense_config
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = (SELECT auth.uid()) AND profiles.role = 'admin')
  );

DROP POLICY IF EXISTS "Admins can delete adsense config" ON adsense_config;
CREATE POLICY "Admins can delete adsense config" ON adsense_config
  FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = (SELECT auth.uid()) AND profiles.role = 'admin')
  );

-- 3.5 Limpar policies antigas que possam ter sobrado da migration 009
DROP POLICY IF EXISTS "Animals are viewable by everyone" ON animals;
DROP POLICY IF EXISTS "Owners can view own animals" ON animals;
DROP POLICY IF EXISTS "Partners can view partnership animals" ON animals;
DROP POLICY IF EXISTS "Users can insert own animals" ON animals;
DROP POLICY IF EXISTS "Owners can update own animals" ON animals;
DROP POLICY IF EXISTS "Admins can do everything on animals" ON animals;
DROP POLICY IF EXISTS "Events are viewable by everyone" ON events;

-- =============================================================================
-- PARTE 4: ÍNDICES DE PERFORMANCE FALTANTES
-- =============================================================================

-- 4.1 Índice composto para trigger de engagement
CREATE INDEX IF NOT EXISTS idx_impressions_content_type_id_created
ON impressions(content_type, content_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_clicks_content_type_id_created
ON clicks(content_type, content_id, created_at DESC);

-- 4.2 Índice para listagem paginada de notificações
CREATE INDEX IF NOT EXISTS idx_notifications_user_created
ON notifications(user_id, created_at DESC);

-- 4.3 Índices para conversations
CREATE INDEX IF NOT EXISTS idx_conversations_animal_owner_id
ON conversations(animal_owner_id);

CREATE INDEX IF NOT EXISTS idx_conversations_interested_user_id
ON conversations(interested_user_id);

-- 4.4 Índice para messages ordenadas
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created
ON messages(conversation_id, created_at);

-- 4.5 Índice composto para dashboard de pagamentos
CREATE INDEX IF NOT EXISTS idx_asaas_payments_user_status
ON asaas_payments(user_id, status);

-- =============================================================================
-- PARTE 5: LIMPEZA DE DADOS ANTIGOS (criar funções de manutenção)
-- =============================================================================

-- 5.1 Função para limpeza periódica de impressions/clicks antigos
CREATE OR REPLACE FUNCTION public.cleanup_old_analytics(days_to_keep INTEGER DEFAULT 90)
RETURNS TABLE(impressions_deleted BIGINT, clicks_deleted BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_impressions_deleted BIGINT;
  v_clicks_deleted BIGINT;
BEGIN
  WITH deleted AS (
    DELETE FROM impressions
    WHERE created_at < NOW() - (days_to_keep || ' days')::INTERVAL
    RETURNING 1
  )
  SELECT COUNT(*) INTO v_impressions_deleted FROM deleted;

  WITH deleted AS (
    DELETE FROM clicks
    WHERE created_at < NOW() - (days_to_keep || ' days')::INTERVAL
    RETURNING 1
  )
  SELECT COUNT(*) INTO v_clicks_deleted FROM deleted;

  RETURN QUERY SELECT v_impressions_deleted, v_clicks_deleted;
END;
$$;

COMMENT ON FUNCTION public.cleanup_old_analytics IS 'Remove registros antigos de impressions e clicks para evitar crescimento indefinido';

-- 5.2 Função para limpeza de page_visits antigos
CREATE OR REPLACE FUNCTION public.cleanup_old_page_visits(days_to_keep INTEGER DEFAULT 90)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_deleted BIGINT;
BEGIN
  WITH deleted AS (
    DELETE FROM page_visits
    WHERE created_at < NOW() - (days_to_keep || ' days')::INTERVAL
    RETURNING 1
  )
  SELECT COUNT(*) INTO v_deleted FROM deleted;

  RETURN v_deleted;
END;
$$;

-- 5.3 Função para limpeza de webhooks log antigos
CREATE OR REPLACE FUNCTION public.cleanup_old_webhooks_log(days_to_keep INTEGER DEFAULT 60)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_deleted BIGINT;
BEGIN
  WITH deleted AS (
    DELETE FROM asaas_webhooks_log
    WHERE created_at < NOW() - (days_to_keep || ' days')::INTERVAL
    AND processed = true
    RETURNING 1
  )
  SELECT COUNT(*) INTO v_deleted FROM deleted;

  RETURN v_deleted;
END;
$$;

COMMIT;

-- =============================================================================
-- VALIDAÇÃO FINAL
-- =============================================================================

-- Verificar funções com search_path
SELECT
  proname AS function_name,
  CASE
    WHEN prosecdef THEN 'SECURITY DEFINER'
    ELSE 'SECURITY INVOKER'
  END AS security_type,
  CASE
    WHEN proconfig IS NOT NULL
    AND array_to_string(proconfig, ',') LIKE '%search_path%'
    THEN 'OK'
    ELSE CASE WHEN prosecdef THEN 'PRECISA CORRIGIR' ELSE 'N/A' END
  END AS search_path_status
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
AND proname NOT LIKE 'pg_%'
ORDER BY search_path_status DESC, proname;

-- Verificar views com security_invoker
SELECT
  viewname,
  CASE
    WHEN viewname IN (
      'search_animals', 'animals_ranking', 'animals_with_stats',
      'events_with_stats', 'articles_with_stats', 'user_dashboard_stats',
      'user_notification_stats', 'admin_chat_stats',
      'active_subscriptions', 'pending_payments', 'pending_refunds'
    ) THEN 'Corrigida'
    ELSE 'VERIFICAR'
  END AS status
FROM pg_views
WHERE schemaname = 'public'
ORDER BY viewname;

-- Contar policies por tabela
SELECT
  tablename,
  COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY policy_count DESC;
