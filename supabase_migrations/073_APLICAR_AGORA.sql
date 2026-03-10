-- =====================================================
-- Migration 073: Sistema de Cotas Mensais para Eventos
-- COPIE E COLE ESTE ARQUIVO NO SQL EDITOR DO SUPABASE
-- =====================================================

-- 1. Adicionar campos na tabela profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS event_publications_used_this_month INT DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS event_publications_reset_at TIMESTAMPTZ DEFAULT DATE_TRUNC('month', NOW()) + INTERVAL '1 month';

COMMENT ON COLUMN profiles.event_publications_used_this_month IS 'Contador de publicações de eventos usadas no mês atual (reseta mensalmente)';
COMMENT ON COLUMN profiles.event_publications_reset_at IS 'Data do próximo reset do contador de publicações (primeiro dia do próximo mês)';

CREATE INDEX IF NOT EXISTS idx_profiles_event_publications_reset ON profiles(event_publications_reset_at);

-- 2. Adicionar campo na tabela events
ALTER TABLE events ADD COLUMN IF NOT EXISTS can_edit_until TIMESTAMPTZ;

COMMENT ON COLUMN events.can_edit_until IS 'Data/hora limite para edição (24h após publicação)';

CREATE INDEX IF NOT EXISTS idx_events_can_edit_until ON events(can_edit_until);

-- 3. Função: Obter cotas de publicação por plano
CREATE OR REPLACE FUNCTION get_event_monthly_quota(user_plan TEXT)
RETURNS INT
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN CASE 
    WHEN user_plan IN ('pro', 'pro_annual') THEN 1
    WHEN user_plan IN ('ultra', 'ultra_annual') THEN 2
    ELSE 0
  END;
END;
$$;

COMMENT ON FUNCTION get_event_monthly_quota IS 'Retorna quantas publicações mensais o plano permite';
GRANT EXECUTE ON FUNCTION get_event_monthly_quota TO authenticated;

-- 4. Função: Resetar publicações mensais
CREATE OR REPLACE FUNCTION reset_monthly_event_publications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  reset_count INT := 0;
BEGIN
  UPDATE profiles
  SET 
    event_publications_used_this_month = 0,
    event_publications_reset_at = DATE_TRUNC('month', NOW()) + INTERVAL '1 month'
  WHERE event_publications_reset_at <= NOW();
  
  GET DIAGNOSTICS reset_count = ROW_COUNT;
  RAISE NOTICE 'Reset mensal: % usuários resetados', reset_count;
END;
$$;

COMMENT ON FUNCTION reset_monthly_event_publications IS 'Reseta o contador de publicações mensais';
GRANT EXECUTE ON FUNCTION reset_monthly_event_publications TO authenticated;

-- 5. Função: Verificar se pode publicar evento
CREATE OR REPLACE FUNCTION can_create_event(user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_plan TEXT;
  v_plan_expires_at TIMESTAMPTZ;
  v_plan_is_valid BOOLEAN;
  v_publications_used INT;
  v_publications_quota INT;
  v_publications_available INT;
  v_active_events_count INT;
  v_reset_at TIMESTAMPTZ;
BEGIN
  SELECT 
    plan, plan_expires_at, event_publications_used_this_month, event_publications_reset_at
  INTO 
    v_plan, v_plan_expires_at, v_publications_used, v_reset_at
  FROM profiles
  WHERE id = user_id;

  IF v_plan IS NULL THEN
    RETURN jsonb_build_object(
      'can_create', false, 'reason', 'user_not_found', 'message', 'Usuário não encontrado',
      'current_count', 0, 'event_limit', 1, 'publications_used', 0, 'publications_quota', 0
    );
  END IF;

  v_plan_is_valid := (v_plan IS NOT NULL AND v_plan != 'free' AND (v_plan_expires_at IS NULL OR v_plan_expires_at > NOW()));
  v_publications_quota := get_event_monthly_quota(v_plan);
  v_publications_available := GREATEST(0, v_publications_quota - v_publications_used);

  SELECT COUNT(*)::INT INTO v_active_events_count
  FROM events
  WHERE organizer_id = user_id AND ad_status = 'active' AND (expires_at IS NULL OR expires_at > NOW());

  IF v_active_events_count >= 1 THEN
    RETURN jsonb_build_object(
      'can_create', false, 'reason', 'active_limit_reached',
      'message', 'Você já tem 1 evento ativo. Para publicar outro, delete o atual ou pague R$ 49,99 pela publicação individual.',
      'current_count', v_active_events_count, 'event_limit', 1,
      'publications_used', v_publications_used, 'publications_quota', v_publications_quota,
      'can_upgrade', v_plan IN ('free', 'basic', 'pro', 'pro_annual'),
      'can_pay_individual', true, 'individual_price', 49.99
    );
  END IF;

  IF NOT v_plan_is_valid OR v_plan = 'free' THEN
    RETURN jsonb_build_object(
      'can_create', false, 'reason', 'no_active_plan',
      'message', 'Você precisa de um plano ativo ou pagar R$ 49,99 para publicar este evento.',
      'current_count', v_active_events_count, 'event_limit', 1,
      'publications_used', 0, 'publications_quota', 0,
      'requires_individual_payment', true, 'can_pay_individual', true,
      'individual_price', 49.99, 'can_upgrade', true
    );
  END IF;

  IF v_plan IN ('basic', 'basic_annual', 'vip') THEN
    RETURN jsonb_build_object(
      'can_create', false, 'reason', 'no_monthly_quota',
      'message', 'Seu plano não inclui publicações de eventos. Faça upgrade para Pro/Elite ou pague R$ 49,99 pela publicação individual.',
      'current_count', v_active_events_count, 'event_limit', 1,
      'publications_used', 0, 'publications_quota', 0,
      'can_upgrade', true, 'can_pay_individual', true, 'individual_price', 49.99
    );
  END IF;

  IF v_publications_used >= v_publications_quota THEN
    RETURN jsonb_build_object(
      'can_create', false, 'reason', 'monthly_quota_exhausted',
      'message', format('Você já usou %s de %s publicação(ões) do mês. Próximo reset: %s. Para publicar agora, faça upgrade ou pague R$ 49,99.', v_publications_used, v_publications_quota, TO_CHAR(v_reset_at, 'DD/MM/YYYY')),
      'current_count', v_active_events_count, 'event_limit', 1,
      'publications_used', v_publications_used, 'publications_quota', v_publications_quota,
      'reset_at', v_reset_at, 'can_upgrade', v_plan IN ('pro', 'pro_annual'),
      'can_pay_individual', true, 'individual_price', 49.99
    );
  END IF;

  RETURN jsonb_build_object(
    'can_create', true, 'reason', 'within_quota',
    'message', format('Você pode publicar %s evento(s) com a cota do plano. Restam %s publicação(ões) este mês.', v_publications_available, v_publications_available),
    'current_count', v_active_events_count, 'event_limit', 1,
    'publications_used', v_publications_used, 'publications_quota', v_publications_quota,
    'publications_available', v_publications_available, 'reset_at', v_reset_at
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'can_create', false, 'reason', 'error',
    'message', 'Erro ao verificar limites: ' || SQLERRM,
    'current_count', 0, 'event_limit', 1
  );
END;
$$;

COMMENT ON FUNCTION can_create_event IS 'Verifica se usuário pode criar evento';
GRANT EXECUTE ON FUNCTION can_create_event TO authenticated;

-- 6. Trigger: Incrementar contador de publicações
CREATE OR REPLACE FUNCTION increment_event_publication_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.ad_status = 'active' 
     AND (NEW.is_individual_paid IS NULL OR NEW.is_individual_paid = false)
     AND (TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.ad_status != 'active'))
  THEN
    UPDATE profiles
    SET event_publications_used_this_month = event_publications_used_this_month + 1
    WHERE id = NEW.organizer_id;
    
    NEW.can_edit_until := NOW() + INTERVAL '24 hours';
    NEW.published_at := NOW();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_increment_event_publication ON events;
CREATE TRIGGER trigger_increment_event_publication BEFORE INSERT OR UPDATE ON events FOR EACH ROW EXECUTE FUNCTION increment_event_publication_count();

-- 7. Função: Pagamento individual
CREATE OR REPLACE FUNCTION process_individual_event_payment(p_user_id UUID, p_event_id UUID, p_payment_method TEXT DEFAULT 'simulated')
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_transaction_id UUID;
  v_expires_at TIMESTAMPTZ;
BEGIN
  v_expires_at := NOW() + INTERVAL '30 days';
  
  INSERT INTO transactions (user_id, type, amount, currency, status, metadata)
  VALUES (p_user_id, 'individual_ad', 49.99, 'BRL', 'completed', jsonb_build_object('event_id', p_event_id, 'payment_method', p_payment_method, 'duration_days', 30))
  RETURNING id INTO v_transaction_id;

  UPDATE events SET
    is_individual_paid = TRUE, individual_paid_expires_at = v_expires_at,
    ad_status = 'active', published_at = NOW(), expires_at = v_expires_at,
    paused_at = NULL, can_edit_until = NOW() + INTERVAL '24 hours'
  WHERE id = p_event_id AND organizer_id = p_user_id;

  RETURN jsonb_build_object(
    'success', true, 'transaction_id', v_transaction_id,
    'message', 'Pagamento processado! Seu evento estará ativo por 30 dias. Você tem 24h para editar.',
    'expires_at', v_expires_at, 'can_edit_until', NOW() + INTERVAL '24 hours'
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'message', 'Erro ao processar pagamento: ' || SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION process_individual_event_payment TO authenticated;

-- 8. Atualizar eventos existentes
UPDATE events SET can_edit_until = published_at + INTERVAL '24 hours'
WHERE ad_status = 'active' AND published_at > NOW() - INTERVAL '24 hours' AND can_edit_until IS NULL;

UPDATE events SET can_edit_until = published_at + INTERVAL '24 hours'
WHERE ad_status = 'active' AND published_at <= NOW() - INTERVAL '24 hours' AND can_edit_until IS NULL;

-- 9. Sucesso
DO $$
BEGIN
  RAISE NOTICE '✅ Migration 073 aplicada com sucesso!';
  RAISE NOTICE '   - Pro: 1 publicação/mês';
  RAISE NOTICE '   - Elite: 2 publicações/mês';
  RAISE NOTICE '   - Limite: 1 evento ativo';
  RAISE NOTICE '   - Edição: 24h após publicação';
END $$;

