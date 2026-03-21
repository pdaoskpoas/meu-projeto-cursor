-- =====================================================
-- MIGRAÇÃO 097: REESTRUTURAÇÃO COMPLETA DE MONETIZAÇÃO
-- Data: 19/03/2026
-- Descrição:
--   Reestruturação do modelo de monetização para 100% baseado em planos.
--   - Novos planos: essencial, criador, haras, elite
--   - Novos limites de animais: 1, 5, 10, 25
--   - Novos turbinares por plano: 0, 2, 5, 10
--   - Turbinares por duração (24h/3d/7d) em vez de quantidade
--   - Bloqueio de re-turbinar animal já turbinado
--   - Prioridade: usar créditos do PLANO primeiro, depois comprados
--   - Migração de usuários existentes (basic→essencial, pro→criador, ultra→elite)
-- =====================================================

-- =====================================================
-- PARTE 1: ALTERAR CHECK CONSTRAINT DA TABELA PROFILES
-- Adicionar novos nomes de planos mantendo os antigos para compatibilidade
-- =====================================================

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_plan_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_plan_check
  CHECK (plan IN ('free', 'basic', 'pro', 'ultra', 'vip', 'essencial', 'criador', 'haras', 'elite'));

-- =====================================================
-- PARTE 2: MIGRAR USUÁRIOS EXISTENTES PARA NOVOS NOMES
-- basic → essencial | pro → criador | ultra → elite
-- =====================================================

UPDATE public.profiles SET plan = 'essencial' WHERE plan = 'basic';
UPDATE public.profiles SET plan = 'criador'   WHERE plan = 'pro';
UPDATE public.profiles SET plan = 'elite'     WHERE plan = 'ultra';

-- =====================================================
-- PARTE 3: ATUALIZAR TABELA DE PLANOS
-- Desativar planos antigos e inserir novos
-- =====================================================

-- Desativar todos os planos antigos (mantém histórico)
UPDATE public.plans SET is_active = false WHERE name IN (
  'basic', 'pro', 'ultra',
  'basic_annual', 'pro_annual', 'ultra_annual'
);

-- Inserir novos planos (upsert para evitar duplicatas)
INSERT INTO public.plans (
  name, display_name, description, price, duration,
  features, max_animals, max_events, available_boosts,
  is_active, is_featured, display_order
) VALUES
(
  'essencial',
  'Essencial',
  'Para quem está começando no mundo equestre',
  39.90, 1,
  '["Cadastre até 1 animal ativo", "Aparece no mapa interativo", "Perfil completo com link para Instagram", "Sistema completo de sociedades", "Relatórios de visualização", "Suporte por e-mail e tickets"]'::jsonb,
  1, 5, 0,
  true, false, 2
),
(
  'criador',
  'Criador',
  'Para criadores profissionais',
  97.90, 1,
  '["Cadastre até 5 animais ativos", "2 turbinares grátis por mês", "Destaque nos resultados", "Aparece no topo do mapa interativo", "Perfil avançado verificado", "Link para Instagram e WhatsApp", "Relatórios detalhados de performance", "Suporte prioritário"]'::jsonb,
  5, 10, 2,
  true, false, 3
),
(
  'haras',
  'Haras Destaque',
  'Para haras e criadores de destaque',
  197.90, 1,
  '["Cadastre até 10 animais ativos", "5 turbinares grátis por mês", "Máxima visibilidade e destaque", "Posição privilegiada no mapa", "Perfil Haras com selo premium", "Integração completa com redes sociais", "Analytics avançados e insights", "Suporte VIP dedicado"]'::jsonb,
  10, 15, 5,
  true, true, 4
),
(
  'elite',
  'Elite',
  'Máximo poder para seu negócio equestre',
  397.90, 1,
  '["Cadastre até 25 animais ativos", "10 turbinares grátis por mês", "Máxima visibilidade e destaque", "Posição privilegiada no mapa", "Perfil Elite com selo exclusivo", "Integração completa com redes sociais", "Analytics avançados e insights", "Suporte VIP dedicado", "Consultoria de marketing digital"]'::jsonb,
  25, 15, 10,
  true, false, 5
)
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  duration = EXCLUDED.duration,
  features = EXCLUDED.features,
  max_animals = EXCLUDED.max_animals,
  max_events = EXCLUDED.max_events,
  available_boosts = EXCLUDED.available_boosts,
  is_active = EXCLUDED.is_active,
  is_featured = EXCLUDED.is_featured,
  display_order = EXCLUDED.display_order,
  updated_at = NOW();

-- Atualizar VIP com novos limites (10 animais, 5 boosts)
UPDATE public.plans SET
  max_animals = 10,
  max_events = 10,
  available_boosts = 5,
  features = '["Mesmos limites do Haras Destaque", "10 animais ativos simultaneamente", "5 turbinares grátis por mês", "Concedido gratuitamente pelo administrador", "Suporte premium dedicado"]'::jsonb,
  updated_at = NOW()
WHERE name = 'vip';

-- =====================================================
-- PARTE 4: FUNÇÃO count_active_animals_with_partnerships
-- Remover filtro de is_individual_paid (modelo removido)
-- =====================================================

CREATE OR REPLACE FUNCTION public.count_active_animals_with_partnerships(user_id_param UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    total_count INTEGER;
BEGIN
    SELECT COUNT(DISTINCT animal_id)::INTEGER INTO total_count
    FROM (
        -- Animais próprios ativos
        SELECT a.id AS animal_id
        FROM public.animals a
        WHERE a.owner_id = user_id_param
          AND a.ad_status = 'active'

        UNION

        -- Animais em sociedade (somente se o usuário tem plano ativo)
        SELECT ap.animal_id
        FROM public.animal_partnerships ap
        JOIN public.animals a ON a.id = ap.animal_id
        JOIN public.profiles p ON p.id = user_id_param
        WHERE ap.partner_id = user_id_param
          AND a.ad_status = 'active'
          AND p.plan IS NOT NULL
          AND p.plan != 'free'
          AND (p.plan_expires_at IS NULL OR p.plan_expires_at > NOW())
    ) combined;

    RETURN COALESCE(total_count, 0);
END;
$$;

-- =====================================================
-- PARTE 5: FUNÇÃO check_user_publish_quota (NOVOS LIMITES)
-- essencial=1 | criador=5 | haras=10 | elite=25 | vip=10
-- =====================================================

CREATE OR REPLACE FUNCTION public.check_user_publish_quota(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_plan TEXT;
  v_plan_expires_at TIMESTAMPTZ;
  v_is_annual_plan BOOLEAN;
  v_allowed INT := 0;
  v_active_count INT := 0;
  v_remaining INT := 0;
  v_plan_is_valid BOOLEAN := FALSE;
BEGIN
  -- Buscar informações do perfil
  SELECT plan, plan_expires_at, is_annual_plan
  INTO v_plan, v_plan_expires_at, v_is_annual_plan
  FROM public.profiles
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'plan', 'free',
      'plan_expires_at', NULL,
      'is_annual_plan', false,
      'plan_is_valid', false,
      'allowedByPlan', 0,
      'active', 0,
      'remaining', 0
    );
  END IF;

  -- Plano é válido se não for free e não estiver expirado
  v_plan_is_valid := (
    v_plan IS NOT NULL
    AND v_plan != 'free'
    AND (v_plan_expires_at IS NULL OR v_plan_expires_at > NOW())
  );

  -- Limite permitido por plano (NOVOS VALORES)
  v_allowed := CASE v_plan
    WHEN 'essencial' THEN 1
    WHEN 'criador'   THEN 5
    WHEN 'haras'     THEN 10
    WHEN 'elite'     THEN 25
    WHEN 'vip'       THEN 10
    -- Legado (caso algum usuário ainda não tenha sido migrado)
    WHEN 'basic'     THEN 1
    WHEN 'pro'       THEN 5
    WHEN 'ultra'     THEN 25
    ELSE 0
  END;

  -- Se plano não é válido, tratar como free
  IF NOT v_plan_is_valid THEN
    v_allowed := 0;
  END IF;

  -- Contagem de anúncios ativos (inclui sociedades válidas)
  v_active_count := public.count_active_animals_with_partnerships(p_user_id);

  -- Cálculo de vagas restantes
  v_remaining := GREATEST(v_allowed - v_active_count, 0);

  RETURN jsonb_build_object(
    'plan', COALESCE(v_plan, 'free'),
    'plan_expires_at', v_plan_expires_at,
    'is_annual_plan', COALESCE(v_is_annual_plan, false),
    'plan_is_valid', v_plan_is_valid,
    'allowedByPlan', v_allowed,
    'active', v_active_count,
    'remaining', v_remaining
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'plan', 'free',
    'plan_expires_at', NULL,
    'is_annual_plan', false,
    'plan_is_valid', false,
    'allowedByPlan', 0,
    'active', 0,
    'remaining', 0,
    'error', SQLERRM
  );
END;
$$;

-- =====================================================
-- PARTE 6: FUNÇÃO grant_monthly_boosts (NOVOS VALORES)
-- essencial=0 | criador=2 | haras=5 | elite=10 | vip=5
-- =====================================================

CREATE OR REPLACE FUNCTION public.grant_monthly_boosts()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE profiles
  SET
    plan_boost_credits = CASE
      WHEN plan = 'essencial' THEN 0
      WHEN plan = 'criador'   THEN 2
      WHEN plan = 'haras'     THEN 5
      WHEN plan = 'elite'     THEN 10
      WHEN plan = 'vip'       THEN 5
      -- Legado
      WHEN plan = 'basic'     THEN 0
      WHEN plan = 'pro'       THEN 2
      WHEN plan = 'ultra'     THEN 5
      ELSE 0
    END,
    last_boost_grant_at = now()
  WHERE
    plan IN ('essencial', 'criador', 'haras', 'elite', 'vip', 'basic', 'pro', 'ultra')
    AND (
      last_boost_grant_at IS NULL
      OR last_boost_grant_at < date_trunc('month', now())
    )
    AND (plan_expires_at IS NULL OR plan_expires_at > NOW());
END;
$$;

-- =====================================================
-- PARTE 7: TRIGGER auto_grant_boost_on_plan_change (NOVOS PLANOS)
-- =====================================================

CREATE OR REPLACE FUNCTION public.auto_grant_boost_on_plan_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  boosts_to_add INTEGER := 0;
  old_plan_boosts INTEGER := 0;
  new_plan_boosts INTEGER := 0;
BEGIN
  -- Turbinares do plano antigo
  old_plan_boosts := CASE
    WHEN OLD.plan = 'essencial' THEN 0
    WHEN OLD.plan = 'criador'   THEN 2
    WHEN OLD.plan = 'haras'     THEN 5
    WHEN OLD.plan = 'elite'     THEN 10
    WHEN OLD.plan = 'vip'       THEN 5
    -- Legado
    WHEN OLD.plan = 'pro'       THEN 2
    WHEN OLD.plan = 'ultra'     THEN 5
    ELSE 0
  END;

  -- Turbinares do novo plano
  new_plan_boosts := CASE
    WHEN NEW.plan = 'essencial' THEN 0
    WHEN NEW.plan = 'criador'   THEN 2
    WHEN NEW.plan = 'haras'     THEN 5
    WHEN NEW.plan = 'elite'     THEN 10
    WHEN NEW.plan = 'vip'       THEN 5
    ELSE 0
  END;

  -- Se mudou de plano
  IF OLD.plan IS DISTINCT FROM NEW.plan THEN

    -- CASO 1: Nova assinatura (free → pago)
    IF (OLD.plan IS NULL OR OLD.plan = 'free') AND NEW.plan IN ('essencial', 'criador', 'haras', 'elite', 'vip') THEN
      boosts_to_add := new_plan_boosts;

    -- CASO 2: Upgrade (mais boosts no novo plano)
    ELSIF old_plan_boosts < new_plan_boosts THEN
      boosts_to_add := new_plan_boosts - old_plan_boosts;

    -- CASO 3: Downgrade ou plano sem boosts
    ELSE
      boosts_to_add := 0;
    END IF;

    -- Adicionar boosts se houver
    IF boosts_to_add > 0 THEN
      NEW.plan_boost_credits := COALESCE(NEW.plan_boost_credits, 0) + boosts_to_add;
    END IF;

  -- Se renovou o mesmo plano (verifica pela data de expiração)
  ELSIF OLD.plan_expires_at IS DISTINCT FROM NEW.plan_expires_at
    AND NEW.plan_expires_at > OLD.plan_expires_at
    AND NEW.plan IN ('criador', 'haras', 'elite', 'vip') THEN

    boosts_to_add := new_plan_boosts;
    NEW.plan_boost_credits := COALESCE(NEW.plan_boost_credits, 0) + boosts_to_add;
  END IF;

  RETURN NEW;
END;
$$;

-- Recriar trigger
DROP TRIGGER IF EXISTS trg_auto_grant_boost_on_plan_change ON public.profiles;

CREATE TRIGGER trg_auto_grant_boost_on_plan_change
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  WHEN (OLD.plan IS DISTINCT FROM NEW.plan OR OLD.plan_expires_at IS DISTINCT FROM NEW.plan_expires_at)
  EXECUTE FUNCTION public.auto_grant_boost_on_plan_change();

-- =====================================================
-- PARTE 8: FUNÇÃO boost_animal_atomic (REESTRUTURADA)
-- Mudanças:
--   1. BLOQUEIA re-turbinar animal já turbinado
--   2. PRIORIZA créditos do PLANO sobre comprados
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
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Usuário não encontrado.'
    );
  END IF;

  -- ===================================================
  -- STEP 2: Verificar saldo de boosts
  -- ===================================================
  IF (COALESCE(v_plan_credits, 0) + COALESCE(v_purchased_credits, 0)) <= 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Sem créditos de turbinar disponíveis. Compre mais ou aguarde a renovação mensal do seu plano.'
    );
  END IF;

  -- ===================================================
  -- STEP 3: Verificar ownership e status do animal
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
      'message', 'Você não tem permissão para turbinar este animal.'
    );
  END IF;

  -- ===================================================
  -- STEP 4: BLOQUEAR re-turbinar animal já turbinado
  -- ===================================================
  IF v_is_currently_boosted = TRUE
     AND v_current_expires_at IS NOT NULL
     AND v_current_expires_at > NOW() THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', format(
        '%s já está turbinado até %s. Aguarde o término para turbinar novamente.',
        v_animal_name,
        to_char(v_current_expires_at AT TIME ZONE 'America/Sao_Paulo', 'DD/MM/YYYY HH24:MI')
      ),
      'boost_expires_at', v_current_expires_at
    );
  END IF;

  -- ===================================================
  -- STEP 5: Calcular data de expiração (sempre novo período)
  -- ===================================================
  v_boost_expires_at := NOW() + (p_duration_hours || ' hours')::INTERVAL;

  -- ===================================================
  -- STEP 6: Debitar créditos (PRIORIZA PLANO primeiro)
  -- ===================================================
  IF COALESCE(v_plan_credits, 0) > 0 THEN
    -- Usar boost do plano PRIMEIRO
    UPDATE profiles
    SET plan_boost_credits = plan_boost_credits - 1
    WHERE id = p_user_id;

    v_boost_type := 'plan_included';
    v_plan_credits := v_plan_credits - 1;
  ELSE
    -- Depois usar boost comprado
    UPDATE profiles
    SET purchased_boost_credits = purchased_boost_credits - 1
    WHERE id = p_user_id;

    v_boost_type := 'purchased';
    v_purchased_credits := v_purchased_credits - 1;
  END IF;

  -- ===================================================
  -- STEP 7: Ativar boost no animal
  -- ===================================================
  UPDATE animals
  SET
    is_boosted = TRUE,
    boost_expires_at = v_boost_expires_at,
    boosted_by = p_user_id,
    boosted_at = NOW()
  WHERE id = p_animal_id;

  -- ===================================================
  -- STEP 8: Registrar no histórico de boosts
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
    0,
    NOW(),
    v_boost_expires_at,
    TRUE
  );

  -- ===================================================
  -- STEP 9: Preparar resposta
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
    'days_total', v_days_total,
    'boost_type', v_boost_type
  );

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', format('Erro ao turbinar: %s', SQLERRM)
    );
END;
$$;

-- =====================================================
-- PARTE 9: FUNÇÃO boost_event_atomic (REESTRUTURADA)
-- Mesmas mudanças: bloqueia re-turbinar + prioriza plano
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
  -- STEP 1: LOCK
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
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Usuário não encontrado.'
    );
  END IF;

  -- STEP 2: Verificar saldo
  IF (COALESCE(v_plan_credits, 0) + COALESCE(v_purchased_credits, 0)) <= 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Sem créditos de turbinar disponíveis. Compre mais ou aguarde a renovação mensal do seu plano.'
    );
  END IF;

  -- STEP 3: Verificar ownership
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
      'message', 'Você não tem permissão para turbinar este evento.'
    );
  END IF;

  -- STEP 4: BLOQUEAR re-turbinar evento já turbinado
  IF v_is_currently_boosted = TRUE
     AND v_current_expires_at IS NOT NULL
     AND v_current_expires_at > NOW() THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', format(
        '"%s" já está turbinado até %s. Aguarde o término para turbinar novamente.',
        v_event_title,
        to_char(v_current_expires_at AT TIME ZONE 'America/Sao_Paulo', 'DD/MM/YYYY HH24:MI')
      ),
      'boost_expires_at', v_current_expires_at
    );
  END IF;

  -- STEP 5: Calcular expiração (sempre novo período)
  v_boost_expires_at := NOW() + (p_duration_hours || ' hours')::INTERVAL;

  -- STEP 6: Debitar créditos (PRIORIZA PLANO primeiro)
  IF COALESCE(v_plan_credits, 0) > 0 THEN
    UPDATE profiles
    SET plan_boost_credits = plan_boost_credits - 1
    WHERE id = p_user_id;

    v_boost_type := 'plan_included';
    v_plan_credits := v_plan_credits - 1;
  ELSE
    UPDATE profiles
    SET purchased_boost_credits = purchased_boost_credits - 1
    WHERE id = p_user_id;

    v_boost_type := 'purchased';
    v_purchased_credits := v_purchased_credits - 1;
  END IF;

  -- STEP 7: Ativar boost no evento
  UPDATE events
  SET
    is_boosted = TRUE,
    boost_expires_at = v_boost_expires_at,
    boosted_by = p_user_id,
    boosted_at = NOW()
  WHERE id = p_event_id;

  -- STEP 8: Registrar no histórico
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

  -- STEP 9: Preparar resposta
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
    'days_total', v_days_total,
    'boost_type', v_boost_type
  );

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', format('Erro ao turbinar: %s', SQLERRM)
    );
END;
$$;

-- =====================================================
-- PARTE 10: ATUALIZAR COMENTÁRIOS E GRANTS
-- =====================================================

COMMENT ON FUNCTION public.count_active_animals_with_partnerships(UUID) IS
  'Conta anúncios ativos de um usuário, incluindo sociedades válidas.';

COMMENT ON FUNCTION public.check_user_publish_quota(UUID) IS
  'Retorna plano, validade e cotas de publicação. Limites: essencial=1, criador=5, haras=10, elite=25, vip=10.';

COMMENT ON FUNCTION public.grant_monthly_boosts() IS
  'Renova turbinares mensais por plano. essencial=0, criador=2, haras=5, elite=10, vip=5. Sem acúmulo.';

COMMENT ON FUNCTION public.auto_grant_boost_on_plan_change() IS
  'Concede turbinares automaticamente ao assinar, renovar ou fazer upgrade de plano.';

COMMENT ON FUNCTION public.boost_animal_atomic(UUID, UUID, INTEGER) IS
  'Função atômica para turbinar animal. Bloqueia re-turbinar. Prioriza créditos do plano sobre comprados.';

COMMENT ON FUNCTION public.boost_event_atomic(UUID, UUID, INTEGER) IS
  'Função atômica para turbinar evento. Bloqueia re-turbinar. Prioriza créditos do plano sobre comprados.';

-- Grants (reafirmar)
GRANT EXECUTE ON FUNCTION public.count_active_animals_with_partnerships(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_user_publish_quota(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.boost_animal_atomic(UUID, UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.boost_event_atomic(UUID, UUID, INTEGER) TO authenticated;

-- =====================================================
-- PARTE 11: VERIFICAÇÃO FINAL
-- =====================================================

DO $$
DECLARE
  v_plan_count INTEGER;
  v_migrated_users INTEGER;
BEGIN
  -- Verificar planos novos criados
  SELECT COUNT(*) INTO v_plan_count
  FROM plans WHERE name IN ('essencial', 'criador', 'haras', 'elite') AND is_active = true;

  IF v_plan_count != 4 THEN
    RAISE WARNING 'Esperava 4 planos ativos, encontrou %', v_plan_count;
  ELSE
    RAISE NOTICE '✅ 4 novos planos criados com sucesso (essencial, criador, haras, elite)';
  END IF;

  -- Verificar se não restaram usuários com planos antigos
  SELECT COUNT(*) INTO v_migrated_users
  FROM profiles WHERE plan IN ('basic', 'pro', 'ultra');

  IF v_migrated_users > 0 THEN
    RAISE WARNING '⚠️ Ainda existem % usuários com planos antigos (basic/pro/ultra)', v_migrated_users;
  ELSE
    RAISE NOTICE '✅ Todos os usuários migrados para novos planos';
  END IF;

  -- Verificar funções
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'boost_animal_atomic') THEN
    RAISE NOTICE '✅ boost_animal_atomic atualizada';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'boost_event_atomic') THEN
    RAISE NOTICE '✅ boost_event_atomic atualizada';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'check_user_publish_quota') THEN
    RAISE NOTICE '✅ check_user_publish_quota atualizada';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'grant_monthly_boosts') THEN
    RAISE NOTICE '✅ grant_monthly_boosts atualizada';
  END IF;

  RAISE NOTICE '=====================================================';
  RAISE NOTICE '✅ MIGRAÇÃO 097 CONCLUÍDA COM SUCESSO!';
  RAISE NOTICE 'Novos planos: essencial(1), criador(5), haras(10), elite(25)';
  RAISE NOTICE 'Turbinares: 0, 2, 5, 10 por mês respectivamente';
  RAISE NOTICE 'Re-turbinar: BLOQUEADO (aguardar expiração)';
  RAISE NOTICE 'Prioridade: créditos do PLANO primeiro';
  RAISE NOTICE '=====================================================';
END $$;

-- =====================================================
-- FIM DA MIGRAÇÃO 097
-- =====================================================
