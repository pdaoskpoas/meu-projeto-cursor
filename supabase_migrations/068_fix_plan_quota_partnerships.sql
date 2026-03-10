-- ===================================================================
-- MIGRAÇÃO 068: Correções no controle de cotas de publicação
-- Data: 19/11/2025
-- Descrição:
--   1. Corrige contagem de animais ativos para incluir sociedades
--      apenas quando o animal NÃO é individual pago.
--   2. Atualiza a função check_user_publish_quota para usar a função
--      acima e zerar a cota quando o plano estiver expirado/inválido.
-- ===================================================================

-- ===================================================================
-- 1. FUNÇÃO: count_active_animals_with_partnerships
-- ===================================================================
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
        -- Animais próprios ativos (exclui anúncios individuais pagos)
        SELECT a.id AS animal_id
        FROM public.animals a
        WHERE a.owner_id = user_id_param
          AND a.ad_status = 'active'
          AND (a.is_individual_paid IS NULL OR a.is_individual_paid = false)

        UNION

        -- Animais em sociedade (somente se o usuário tem plano ativo)
        SELECT ap.animal_id
        FROM public.animal_partnerships ap
        JOIN public.animals a ON a.id = ap.animal_id
        JOIN public.profiles p ON p.id = user_id_param
        WHERE ap.partner_id = user_id_param
          AND a.ad_status = 'active'
          AND (a.is_individual_paid IS NULL OR a.is_individual_paid = false)
          AND p.plan IS NOT NULL
          AND p.plan != 'free'
          AND (p.plan_expires_at IS NULL OR p.plan_expires_at > NOW())
    ) combined;

    RETURN COALESCE(total_count, 0);
END;
$$;

COMMENT ON FUNCTION public.count_active_animals_with_partnerships(UUID) IS
  'Conta anúncios ativos de um usuário, incluindo sociedades válidas (exclui anúncios individuais pagos).';

GRANT EXECUTE ON FUNCTION public.count_active_animals_with_partnerships(UUID) TO authenticated;

-- ===================================================================
-- 2. FUNÇÃO: check_user_publish_quota
-- ===================================================================
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
  SELECT
    plan,
    plan_expires_at,
    is_annual_plan
  INTO
    v_plan,
    v_plan_expires_at,
    v_is_annual_plan
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

  -- Plano é considerado válido apenas se não for free e não estiver expirado
  v_plan_is_valid := (
    v_plan IS NOT NULL
    AND v_plan != 'free'
    AND (
      v_plan_expires_at IS NULL
      OR v_plan_expires_at > NOW()
    )
  );

  -- Limite permitido por plano
  v_allowed := CASE v_plan
    WHEN 'basic' THEN 10
    WHEN 'basic_annual' THEN 10
    WHEN 'pro' THEN 15
    WHEN 'pro_annual' THEN 15
    WHEN 'ultra' THEN 25
    WHEN 'ultra_annual' THEN 25
    WHEN 'vip' THEN 15
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

COMMENT ON FUNCTION public.check_user_publish_quota(UUID) IS
  'Retorna plano, validade e cotas de publicação (inclui sociedades e desconsidera planos expirados).';

GRANT EXECUTE ON FUNCTION public.check_user_publish_quota(UUID) TO authenticated;

-- ===================================================================
-- FIM DA MIGRAÇÃO 068
-- ===================================================================



