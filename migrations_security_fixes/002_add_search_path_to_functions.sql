-- =====================================================
-- CORREÇÃO DE SEGURANÇA
-- Adicionar search_path nas Functions
-- Tempo estimado: 10 minutos
-- =====================================================

-- INSTRUÇÕES:
-- 1. Acesse: https://supabase.com/dashboard/project/SEU_PROJETO/sql/new
-- 2. Cole este SQL completo
-- 3. Execute
-- 4. Verifique se não há erros

BEGIN;

-- =====================================================
-- FUNCTION 1/13: update_updated_at_column
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp  -- ✅ CORREÇÃO APLICADA
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.update_updated_at_column IS 'Atualiza timestamp - ✅ search_path corrigido';

-- =====================================================
-- FUNCTION 2/13: generate_public_code
-- =====================================================

CREATE OR REPLACE FUNCTION public.generate_public_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp  -- ✅ CORREÇÃO APLICADA
AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    new_code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8));
    SELECT EXISTS(SELECT 1 FROM profiles WHERE public_code = new_code) INTO code_exists;
    EXIT WHEN NOT code_exists;
  END LOOP;
  RETURN new_code;
END;
$$;

COMMENT ON FUNCTION public.generate_public_code IS 'Gera código público único - ✅ search_path corrigido';

-- =====================================================
-- FUNCTION 3/13: add_purchased_boost_credits
-- =====================================================

CREATE OR REPLACE FUNCTION public.add_purchased_boost_credits(
  user_id_param UUID,
  quantity INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp  -- ✅ CORREÇÃO APLICADA
AS $$
BEGIN
  UPDATE profiles
  SET purchased_boost_credits = purchased_boost_credits + quantity
  WHERE id = user_id_param;
END;
$$;

COMMENT ON FUNCTION public.add_purchased_boost_credits IS 'Adiciona créditos de boost comprados - ✅ search_path corrigido';

-- =====================================================
-- FUNCTION 4/13: zero_plan_boosts_on_free
-- =====================================================

CREATE OR REPLACE FUNCTION public.zero_plan_boosts_on_free()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp  -- ✅ CORREÇÃO APLICADA
AS $$
BEGIN
  IF NEW.plan = 'free' THEN
    NEW.plan_boost_credits := 0;
  END IF;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.zero_plan_boosts_on_free IS 'Zera boosts ao mudar para plano free - ✅ search_path corrigido';

-- =====================================================
-- FUNCTION 5/13: grant_monthly_boosts
-- =====================================================

CREATE OR REPLACE FUNCTION public.grant_monthly_boosts()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp  -- ✅ CORREÇÃO APLICADA
AS $$
BEGIN
  UPDATE profiles
  SET 
    plan_boost_credits = CASE
      WHEN plan = 'basic' THEN 1
      WHEN plan = 'pro' THEN 3
      WHEN plan = 'ultra' THEN 10
      WHEN plan = 'vip' THEN 999999
      ELSE 0
    END,
    last_boost_grant_at = now()
  WHERE 
    plan != 'free'
    AND (
      last_boost_grant_at IS NULL 
      OR last_boost_grant_at < date_trunc('month', now())
    );
END;
$$;

COMMENT ON FUNCTION public.grant_monthly_boosts IS 'Concede boosts mensais conforme plano - ✅ search_path corrigido';

-- =====================================================
-- FUNCTION 6/13: calculate_expiration_date
-- =====================================================

CREATE OR REPLACE FUNCTION public.calculate_expiration_date(
  user_id_param UUID
)
RETURNS TIMESTAMP WITH TIME ZONE
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp  -- ✅ CORREÇÃO APLICADA
AS $$
DECLARE
  user_plan TEXT;
  user_plan_expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
  SELECT plan, plan_expires_at INTO user_plan, user_plan_expires_at
  FROM profiles
  WHERE id = user_id_param;

  IF user_plan IN ('basic', 'pro', 'ultra', 'vip') AND user_plan_expires_at > now() THEN
    RETURN now() + INTERVAL '30 days';
  ELSE
    RETURN now() + INTERVAL '7 days';
  END IF;
END;
$$;

COMMENT ON FUNCTION public.calculate_expiration_date IS 'Calcula data de expiração conforme plano - ✅ search_path corrigido';

-- =====================================================
-- FUNCTION 7/13: is_in_grace_period
-- =====================================================

CREATE OR REPLACE FUNCTION public.is_in_grace_period(
  user_id_param UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp  -- ✅ CORREÇÃO APLICADA
AS $$
DECLARE
  user_plan TEXT;
  user_plan_expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
  SELECT plan, plan_expires_at INTO user_plan, user_plan_expires_at
  FROM profiles
  WHERE id = user_id_param;

  IF user_plan_expires_at IS NULL THEN
    RETURN FALSE;
  END IF;

  IF user_plan_expires_at < now() AND user_plan_expires_at > (now() - INTERVAL '7 days') THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$;

COMMENT ON FUNCTION public.is_in_grace_period IS 'Verifica se usuário está em período de graça - ✅ search_path corrigido';

-- =====================================================
-- FUNCTION 8/13: set_expiration_on_publish
-- =====================================================

CREATE OR REPLACE FUNCTION public.set_expiration_on_publish()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp  -- ✅ CORREÇÃO APLICADA
AS $$
BEGIN
  IF NEW.ad_status = 'active' AND (OLD.ad_status IS NULL OR OLD.ad_status != 'active') THEN
    NEW.published_at := now();
    NEW.expires_at := calculate_expiration_date(NEW.owner_id);
  END IF;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.set_expiration_on_publish IS 'Define expiração ao publicar - ✅ search_path corrigido';

-- =====================================================
-- FUNCTION 9/13: process_animal_expirations
-- =====================================================

CREATE OR REPLACE FUNCTION public.process_animal_expirations()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp  -- ✅ CORREÇÃO APLICADA
AS $$
BEGIN
  UPDATE animals
  SET ad_status = 'expired'
  WHERE 
    ad_status = 'active'
    AND expires_at < now()
    AND auto_renew = FALSE;

  UPDATE animals a
  SET 
    ad_status = 'active',
    published_at = now(),
    expires_at = calculate_expiration_date(a.owner_id)
  FROM profiles p
  WHERE 
    a.owner_id = p.id
    AND a.ad_status = 'active'
    AND a.expires_at < now()
    AND a.auto_renew = TRUE
    AND p.plan IN ('basic', 'pro', 'ultra', 'vip')
    AND p.plan_expires_at > now();
END;
$$;

COMMENT ON FUNCTION public.process_animal_expirations IS 'Processa expirações e auto-renovações - ✅ search_path corrigido';

-- =====================================================
-- FUNCTION 10/13: renew_animal_individually
-- =====================================================

CREATE OR REPLACE FUNCTION public.renew_animal_individually(
  animal_id_param UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp  -- ✅ CORREÇÃO APLICADA
AS $$
DECLARE
  animal_owner_id UUID;
BEGIN
  SELECT owner_id INTO animal_owner_id
  FROM animals
  WHERE id = animal_id_param;

  UPDATE animals
  SET 
    ad_status = 'active',
    published_at = now(),
    expires_at = calculate_expiration_date(animal_owner_id)
  WHERE id = animal_id_param;
END;
$$;

COMMENT ON FUNCTION public.renew_animal_individually IS 'Renova anúncio individual - ✅ search_path corrigido';

-- =====================================================
-- FUNCTION 11/13: expire_boosts
-- =====================================================

CREATE OR REPLACE FUNCTION public.expire_boosts()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp  -- ✅ CORREÇÃO APLICADA
AS $$
BEGIN
  UPDATE animals
  SET 
    is_boosted = FALSE,
    boost_expires_at = NULL
  WHERE 
    is_boosted = TRUE
    AND boost_expires_at < now();

  UPDATE events
  SET 
    is_boosted = FALSE,
    boost_expires_at = NULL
  WHERE 
    is_boosted = TRUE
    AND boost_expires_at < now();

  UPDATE boost_history
  SET is_active = FALSE
  WHERE 
    is_active = TRUE
    AND expires_at < now();
END;
$$;

COMMENT ON FUNCTION public.expire_boosts IS 'Expira boosts vencidos - ✅ search_path corrigido';

-- =====================================================
-- FUNCTION 12/13: expire_ads
-- =====================================================

CREATE OR REPLACE FUNCTION public.expire_ads()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp  -- ✅ CORREÇÃO APLICADA
AS $$
BEGIN
  UPDATE animals
  SET ad_status = 'expired'
  WHERE 
    ad_status = 'active'
    AND expires_at < now();

  UPDATE events
  SET ad_status = 'expired'
  WHERE 
    ad_status = 'active'
    AND expires_at < now();
END;
$$;

COMMENT ON FUNCTION public.expire_ads IS 'Expira anúncios vencidos - ✅ search_path corrigido';

-- =====================================================
-- FUNCTION 13/13: search_animals (function, não view)
-- =====================================================

CREATE OR REPLACE FUNCTION public.search_animals(
  search_term TEXT DEFAULT NULL,
  breed_filter TEXT DEFAULT NULL,
  gender_filter TEXT DEFAULT NULL,
  state_filter TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  breed TEXT,
  gender TEXT,
  birth_date DATE,
  coat TEXT,
  current_city TEXT,
  current_state TEXT,
  owner_name TEXT,
  property_name TEXT,
  is_boosted BOOLEAN,
  images JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp  -- ✅ CORREÇÃO APLICADA
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.name,
    a.breed,
    a.gender,
    a.birth_date,
    a.coat,
    a.current_city,
    a.current_state,
    p.name AS owner_name,
    p.property_name,
    a.is_boosted,
    a.images
  FROM animals a
  JOIN profiles p ON a.owner_id = p.id
  WHERE 
    a.ad_status = 'active'
    AND (search_term IS NULL OR a.name ILIKE '%' || search_term || '%')
    AND (breed_filter IS NULL OR a.breed = breed_filter)
    AND (gender_filter IS NULL OR a.gender = gender_filter)
    AND (state_filter IS NULL OR a.current_state = state_filter)
  ORDER BY a.is_boosted DESC, a.published_at DESC;
END;
$$;

COMMENT ON FUNCTION public.search_animals IS 'Busca animais com filtros - ✅ search_path corrigido';

-- =====================================================
-- VALIDAÇÃO
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Todas as 13 functions foram atualizadas com search_path!';
  RAISE NOTICE '✅ Vulnerabilidade de search_path injection eliminada';
END $$;

COMMIT;

-- =====================================================
-- RESULTADO
-- =====================================================
-- ✅ 13 functions atualizadas com SET search_path = public, pg_temp
-- ✅ Proteção contra search_path injection implementada
-- ✅ Comportamento consistente garantido
-- =====================================================

