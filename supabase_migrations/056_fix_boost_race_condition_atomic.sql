-- =====================================================
-- MIGRAÇÃO 056: CORREÇÃO DE RACE CONDITION NO BOOST
-- Data: 08 de Novembro de 2025
-- Descrição: Implementar função atômica para prevenir race conditions
--            ao impulsionar animais e eventos
-- Prioridade: 🔴 CRÍTICA
-- =====================================================

-- =====================================================
-- PARTE 1: FUNÇÃO ATÔMICA PARA BOOST DE ANIMAIS
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
  v_is_currently_boosted BOOLEAN;
  v_boost_type TEXT;
  v_days_total INTEGER;
  v_result JSONB;
BEGIN
  -- ===================================================
  -- STEP 1: LOCK da linha do perfil (PREVINE RACE CONDITION)
  -- ===================================================
  SELECT 
    plan_boost_credits, 
    purchased_boost_credits
  INTO 
    v_plan_credits, 
    v_purchased_credits
  FROM profiles
  WHERE id = p_user_id
  FOR UPDATE; -- 🔒 ROW-LEVEL LOCK
  
  -- Verificar se encontrou o perfil
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Usuário não encontrado.'
    );
  END IF;
  
  -- ===================================================
  -- STEP 2: Verificar saldo de boosts
  -- ===================================================
  IF (v_plan_credits + v_purchased_credits) <= 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Sem créditos de impulsionar disponíveis. Compre mais ou aguarde a renovação mensal do seu plano.'
    );
  END IF;
  
  -- ===================================================
  -- STEP 3: Verificar ownership do animal
  -- ===================================================
  SELECT 
    name, 
    owner_id,
    is_boosted,
    boost_expires_at
  INTO 
    v_animal_name, 
    v_animal_owner,
    v_is_currently_boosted,
    v_current_expires_at
  FROM animals
  WHERE id = p_animal_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Animal não encontrado.'
    );
  END IF;
  
  IF v_animal_owner != p_user_id THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Você não tem permissão para impulsionar este animal.'
    );
  END IF;
  
  -- ===================================================
  -- STEP 4: Calcular data de expiração (cumulativa se já estiver boosted)
  -- ===================================================
  IF v_is_currently_boosted AND v_current_expires_at IS NOT NULL AND v_current_expires_at > NOW() THEN
    -- Animal já está turbinado e ainda não expirou: SOMA tempo
    v_boost_expires_at := v_current_expires_at + (p_duration_hours || ' hours')::INTERVAL;
  ELSE
    -- Primeira vez ou boost expirado: REINICIA com novo período
    v_boost_expires_at := NOW() + (p_duration_hours || ' hours')::INTERVAL;
  END IF;
  
  -- ===================================================
  -- STEP 5: Debitar créditos (PRIORIZA COMPRADOS)
  -- ===================================================
  IF v_purchased_credits > 0 THEN
    -- Usar boost comprado
    UPDATE profiles
    SET purchased_boost_credits = purchased_boost_credits - 1
    WHERE id = p_user_id;
    
    v_boost_type := 'purchased';
    v_purchased_credits := v_purchased_credits - 1;
  ELSE
    -- Usar boost do plano
    UPDATE profiles
    SET plan_boost_credits = plan_boost_credits - 1
    WHERE id = p_user_id;
    
    v_boost_type := 'plan_included';
    v_plan_credits := v_plan_credits - 1;
  END IF;
  
  -- ===================================================
  -- STEP 6: Ativar boost no animal
  -- ===================================================
  UPDATE animals
  SET 
    is_boosted = TRUE,
    boost_expires_at = v_boost_expires_at,
    boosted_by = p_user_id,
    boosted_at = NOW()
  WHERE id = p_animal_id;
  
  -- ===================================================
  -- STEP 7: Registrar no histórico de boosts
  -- ===================================================
  INSERT INTO boost_history (
    content_type,
    content_id,
    user_id,
    boost_type,
    duration_hours,
    cost,
    started_at,
    expires_at,
    is_active
  ) VALUES (
    'animal',
    p_animal_id,
    p_user_id,
    v_boost_type,
    p_duration_hours,
    0, -- Custo 0 pois já foi debitado dos créditos
    NOW(),
    v_boost_expires_at,
    TRUE
  );
  
  -- ===================================================
  -- STEP 8: Calcular dias totais e preparar resposta
  -- ===================================================
  v_days_total := CEIL(EXTRACT(EPOCH FROM (v_boost_expires_at - NOW())) / 86400);
  
  v_result := jsonb_build_object(
    'success', true,
    'message', format(
      '%s está turbinado por %s dia(s)! Você tem %s boost(s) restante(s).',
      v_animal_name,
      v_days_total,
      (v_plan_credits + v_purchased_credits)
    ),
    'boosts_remaining', (v_plan_credits + v_purchased_credits),
    'boost_expires_at', v_boost_expires_at,
    'days_total', v_days_total
  );
  
  RETURN v_result;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Log do erro e rollback automático
    RETURN jsonb_build_object(
      'success', false,
      'message', format('Erro ao impulsionar: %s', SQLERRM)
    );
END;
$$;

-- =====================================================
-- PARTE 2: FUNÇÃO ATÔMICA PARA BOOST DE EVENTOS
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
  v_is_currently_boosted BOOLEAN;
  v_boost_type TEXT;
  v_days_total INTEGER;
  v_result JSONB;
BEGIN
  -- ===================================================
  -- STEP 1: LOCK da linha do perfil (PREVINE RACE CONDITION)
  -- ===================================================
  SELECT 
    plan_boost_credits, 
    purchased_boost_credits
  INTO 
    v_plan_credits, 
    v_purchased_credits
  FROM profiles
  WHERE id = p_user_id
  FOR UPDATE; -- 🔒 ROW-LEVEL LOCK
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Usuário não encontrado.'
    );
  END IF;
  
  -- ===================================================
  -- STEP 2: Verificar saldo de boosts
  -- ===================================================
  IF (v_plan_credits + v_purchased_credits) <= 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Sem créditos de impulsionar disponíveis. Compre mais ou aguarde a renovação mensal do seu plano.'
    );
  END IF;
  
  -- ===================================================
  -- STEP 3: Verificar ownership do evento
  -- ===================================================
  SELECT 
    title, 
    organizer_id,
    is_boosted,
    boost_expires_at
  INTO 
    v_event_title, 
    v_event_organizer,
    v_is_currently_boosted,
    v_current_expires_at
  FROM events
  WHERE id = p_event_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Evento não encontrado.'
    );
  END IF;
  
  IF v_event_organizer != p_user_id THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Você não tem permissão para impulsionar este evento.'
    );
  END IF;
  
  -- ===================================================
  -- STEP 4: Calcular data de expiração (cumulativa)
  -- ===================================================
  IF v_is_currently_boosted AND v_current_expires_at IS NOT NULL AND v_current_expires_at > NOW() THEN
    v_boost_expires_at := v_current_expires_at + (p_duration_hours || ' hours')::INTERVAL;
  ELSE
    v_boost_expires_at := NOW() + (p_duration_hours || ' hours')::INTERVAL;
  END IF;
  
  -- ===================================================
  -- STEP 5: Debitar créditos (PRIORIZA COMPRADOS)
  -- ===================================================
  IF v_purchased_credits > 0 THEN
    UPDATE profiles
    SET purchased_boost_credits = purchased_boost_credits - 1
    WHERE id = p_user_id;
    
    v_boost_type := 'purchased';
    v_purchased_credits := v_purchased_credits - 1;
  ELSE
    UPDATE profiles
    SET plan_boost_credits = plan_boost_credits - 1
    WHERE id = p_user_id;
    
    v_boost_type := 'plan_included';
    v_plan_credits := v_plan_credits - 1;
  END IF;
  
  -- ===================================================
  -- STEP 6: Ativar boost no evento
  -- ===================================================
  UPDATE events
  SET 
    is_boosted = TRUE,
    boost_expires_at = v_boost_expires_at,
    boosted_by = p_user_id,
    boosted_at = NOW()
  WHERE id = p_event_id;
  
  -- ===================================================
  -- STEP 7: Registrar no histórico
  -- ===================================================
  INSERT INTO boost_history (
    content_type,
    content_id,
    user_id,
    boost_type,
    duration_hours,
    cost,
    started_at,
    expires_at,
    is_active
  ) VALUES (
    'event',
    p_event_id,
    p_user_id,
    v_boost_type,
    p_duration_hours,
    0,
    NOW(),
    v_boost_expires_at,
    TRUE
  );
  
  -- ===================================================
  -- STEP 8: Preparar resposta
  -- ===================================================
  v_days_total := CEIL(EXTRACT(EPOCH FROM (v_boost_expires_at - NOW())) / 86400);
  
  v_result := jsonb_build_object(
    'success', true,
    'message', format(
      '"%s" está turbinado por %s dia(s)! Você tem %s boost(s) restante(s).',
      v_event_title,
      v_days_total,
      (v_plan_credits + v_purchased_credits)
    ),
    'boosts_remaining', (v_plan_credits + v_purchased_credits),
    'boost_expires_at', v_boost_expires_at,
    'days_total', v_days_total
  );
  
  RETURN v_result;
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', format('Erro ao impulsionar: %s', SQLERRM)
    );
END;
$$;

-- =====================================================
-- COMENTÁRIOS PARA DOCUMENTAÇÃO
-- =====================================================

COMMENT ON FUNCTION public.boost_animal_atomic(UUID, UUID, INTEGER) IS 
'Função atômica para impulsionar animal. Previne race conditions usando row-level lock (FOR UPDATE). Prioriza boosts comprados sobre boosts do plano.';

COMMENT ON FUNCTION public.boost_event_atomic(UUID, UUID, INTEGER) IS 
'Função atômica para impulsionar evento. Previne race conditions usando row-level lock (FOR UPDATE). Prioriza boosts comprados sobre boosts do plano.';

-- =====================================================
-- GRANTS
-- =====================================================

GRANT EXECUTE ON FUNCTION public.boost_animal_atomic(UUID, UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.boost_event_atomic(UUID, UUID, INTEGER) TO authenticated;

-- =====================================================
-- TESTES DE VALIDAÇÃO
-- =====================================================

-- Teste 1: Verificar se função foi criada
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'boost_animal_atomic'
  ) THEN
    RAISE EXCEPTION 'Função boost_animal_atomic não foi criada!';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'boost_event_atomic'
  ) THEN
    RAISE EXCEPTION 'Função boost_event_atomic não foi criada!';
  END IF;
  
  RAISE NOTICE '✅ Funções atômicas criadas com sucesso!';
END $$;


