-- Migration 111: Corrigir turbinar para permitir extensão de tempo
-- Data: 06/04/2026
-- Problema: boost_animal_atomic e boost_event_atomic bloqueavam re-turbinar
--   um anúncio já turbinado. O comportamento correto é somar o tempo ao
--   período existente (ex: turbinado por mais 24h a partir da expiração atual).

-- =====================================================
-- FUNÇÃO: boost_animal_atomic (CORRIGIDA)
-- Mudanças:
--   1. REMOVE bloqueio de re-turbinar animal já turbinado
--   2. Calcula nova expiração a partir do MAIOR entre NOW() e boost_expires_at atual
--      (garante que sempre soma ao tempo restante, nunca reinicia)
-- =====================================================

CREATE OR REPLACE FUNCTION public.boost_animal_atomic(
  p_user_id UUID,
  p_animal_id UUID,
  p_duration_hours INTEGER DEFAULT 24
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_plan_credits INTEGER;
  v_purchased_credits INTEGER;
  v_animal_name TEXT;
  v_animal_owner UUID;
  v_boost_expires_at TIMESTAMPTZ;
  v_current_expires_at TIMESTAMPTZ;
  v_boost_type TEXT;
  v_days_total INTEGER;
  v_result JSONB;
BEGIN
  -- STEP 1: LOCK da linha do perfil
  SELECT
    plan_boost_credits,
    purchased_boost_credits
  INTO
    v_plan_credits,
    v_purchased_credits
  FROM profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Usuário não encontrado.');
  END IF;

  -- STEP 2: Verificar saldo
  IF (COALESCE(v_plan_credits, 0) + COALESCE(v_purchased_credits, 0)) <= 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Sem créditos de turbinar disponíveis. Compre mais ou aguarde a renovação mensal do seu plano.'
    );
  END IF;

  -- STEP 3: Verificar ownership
  SELECT name, owner_id, boost_expires_at
  INTO v_animal_name, v_animal_owner, v_current_expires_at
  FROM animals
  WHERE id = p_animal_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Animal não encontrado.');
  END IF;

  IF v_animal_owner != p_user_id THEN
    RETURN jsonb_build_object('success', false, 'message', 'Você não tem permissão para turbinar este animal.');
  END IF;

  -- STEP 4: Calcular nova expiração
  -- Se já está turbinado, soma ao tempo restante; caso contrário, conta a partir de agora
  v_boost_expires_at := GREATEST(NOW(), COALESCE(v_current_expires_at, NOW()))
                        + (p_duration_hours || ' hours')::INTERVAL;

  -- STEP 5: Debitar créditos (PRIORIZA PLANO primeiro)
  IF COALESCE(v_plan_credits, 0) > 0 THEN
    UPDATE profiles SET plan_boost_credits = plan_boost_credits - 1 WHERE id = p_user_id;
    v_boost_type := 'plan_included';
    v_plan_credits := v_plan_credits - 1;
  ELSE
    UPDATE profiles SET purchased_boost_credits = purchased_boost_credits - 1 WHERE id = p_user_id;
    v_boost_type := 'purchased';
    v_purchased_credits := v_purchased_credits - 1;
  END IF;

  -- STEP 6: Ativar/estender boost no animal
  UPDATE animals
  SET
    is_boosted = TRUE,
    boost_expires_at = v_boost_expires_at,
    boosted_by = p_user_id,
    boosted_at = NOW()
  WHERE id = p_animal_id;

  -- STEP 7: Registrar no histórico
  INSERT INTO boost_history (
    content_type, content_id, user_id, boost_type,
    duration_hours, cost, started_at, expires_at, is_active
  ) VALUES (
    'animal', p_animal_id, p_user_id, v_boost_type,
    p_duration_hours, 0, NOW(), v_boost_expires_at, TRUE
  );

  -- STEP 8: Resposta
  v_days_total := CEIL(EXTRACT(EPOCH FROM (v_boost_expires_at - NOW())) / 86400);

  RETURN jsonb_build_object(
    'success', true,
    'message', format(
      '%s está turbinado por mais %s hora(s)! Total turbinado: %s dia(s). Você tem %s boost(s) restante(s).',
      v_animal_name,
      p_duration_hours,
      v_days_total,
      (v_plan_credits + v_purchased_credits)
    ),
    'boosts_remaining', (v_plan_credits + v_purchased_credits),
    'boost_expires_at', v_boost_expires_at,
    'days_total', v_days_total,
    'boost_type', v_boost_type
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'message', format('Erro ao turbinar: %s', SQLERRM));
END;
$$;

-- =====================================================
-- FUNÇÃO: boost_event_atomic (CORRIGIDA)
-- Mesma lógica: remove bloqueio e soma ao tempo existente
-- =====================================================

CREATE OR REPLACE FUNCTION public.boost_event_atomic(
  p_user_id UUID,
  p_event_id UUID,
  p_duration_hours INTEGER DEFAULT 24
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_plan_credits INTEGER;
  v_purchased_credits INTEGER;
  v_event_title TEXT;
  v_event_organizer UUID;
  v_boost_expires_at TIMESTAMPTZ;
  v_current_expires_at TIMESTAMPTZ;
  v_boost_type TEXT;
  v_days_total INTEGER;
  v_result JSONB;
BEGIN
  -- STEP 1: LOCK
  SELECT plan_boost_credits, purchased_boost_credits
  INTO v_plan_credits, v_purchased_credits
  FROM profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Usuário não encontrado.');
  END IF;

  -- STEP 2: Verificar saldo
  IF (COALESCE(v_plan_credits, 0) + COALESCE(v_purchased_credits, 0)) <= 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Sem créditos de turbinar disponíveis. Compre mais ou aguarde a renovação mensal do seu plano.'
    );
  END IF;

  -- STEP 3: Verificar ownership
  SELECT title, organizer_id, boost_expires_at
  INTO v_event_title, v_event_organizer, v_current_expires_at
  FROM events
  WHERE id = p_event_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Evento não encontrado.');
  END IF;

  IF v_event_organizer != p_user_id THEN
    RETURN jsonb_build_object('success', false, 'message', 'Você não tem permissão para turbinar este evento.');
  END IF;

  -- STEP 4: Calcular nova expiração (soma ao tempo restante se já turbinado)
  v_boost_expires_at := GREATEST(NOW(), COALESCE(v_current_expires_at, NOW()))
                        + (p_duration_hours || ' hours')::INTERVAL;

  -- STEP 5: Debitar créditos
  IF COALESCE(v_plan_credits, 0) > 0 THEN
    UPDATE profiles SET plan_boost_credits = plan_boost_credits - 1 WHERE id = p_user_id;
    v_boost_type := 'plan_included';
    v_plan_credits := v_plan_credits - 1;
  ELSE
    UPDATE profiles SET purchased_boost_credits = purchased_boost_credits - 1 WHERE id = p_user_id;
    v_boost_type := 'purchased';
    v_purchased_credits := v_purchased_credits - 1;
  END IF;

  -- STEP 6: Ativar/estender boost no evento
  UPDATE events
  SET
    is_boosted = TRUE,
    boost_expires_at = v_boost_expires_at,
    boosted_by = p_user_id,
    boosted_at = NOW()
  WHERE id = p_event_id;

  -- STEP 7: Registrar no histórico
  INSERT INTO boost_history (
    content_type, content_id, user_id, boost_type,
    duration_hours, cost, started_at, expires_at, is_active
  ) VALUES (
    'event', p_event_id, p_user_id, v_boost_type,
    p_duration_hours, 0, NOW(), v_boost_expires_at, TRUE
  );

  -- STEP 8: Resposta
  v_days_total := CEIL(EXTRACT(EPOCH FROM (v_boost_expires_at - NOW())) / 86400);

  RETURN jsonb_build_object(
    'success', true,
    'message', format(
      '"%s" está turbinado por mais %s hora(s)! Total turbinado: %s dia(s). Você tem %s boost(s) restante(s).',
      v_event_title,
      p_duration_hours,
      v_days_total,
      (v_plan_credits + v_purchased_credits)
    ),
    'boosts_remaining', (v_plan_credits + v_purchased_credits),
    'boost_expires_at', v_boost_expires_at,
    'days_total', v_days_total,
    'boost_type', v_boost_type
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'message', format('Erro ao turbinar: %s', SQLERRM));
END;
$$;

COMMENT ON FUNCTION public.boost_animal_atomic(UUID, UUID, INTEGER) IS
  'Turbina animal somando tempo ao período existente. Permite turbinar múltiplas vezes (acumula duração).';

COMMENT ON FUNCTION public.boost_event_atomic(UUID, UUID, INTEGER) IS
  'Turbina evento somando tempo ao período existente. Permite turbinar múltiplas vezes (acumula duração).';
