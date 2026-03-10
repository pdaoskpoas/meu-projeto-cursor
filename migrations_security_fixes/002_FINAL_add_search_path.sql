-- =====================================================
-- CORREÇÃO DE SEGURANÇA - VERSÃO FINAL
-- Adicionar search_path nas Functions
-- Esta versão faz DROP antes de recriar
-- =====================================================

BEGIN;

-- =====================================================
-- PASSO 1: DROP de funções que precisam mudar tipo
-- =====================================================

DROP FUNCTION IF EXISTS public.process_animal_expirations() CASCADE;
DROP FUNCTION IF EXISTS public.renew_animal_individually(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS public.search_animals(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, INTEGER, INTEGER) CASCADE;

-- =====================================================
-- PASSO 2: Recriar funções com tipos corretos
-- =====================================================

-- =====================================================
-- FUNCTION 1: update_updated_at_column
-- =====================================================

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

-- =====================================================
-- FUNCTION 2: generate_public_code
-- =====================================================

CREATE OR REPLACE FUNCTION public.generate_public_code(
  user_id_param UUID,
  account_type_param TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    prefix TEXT;
    user_code TEXT;
    year_suffix TEXT;
    result TEXT;
BEGIN
    IF account_type_param = 'institutional' THEN
        prefix := 'H';
    ELSE
        prefix := 'U';
    END IF;
    
    user_code := UPPER(REPLACE(SUBSTRING(user_id_param::TEXT FROM 32 FOR 6), '-', ''));
    year_suffix := SUBSTRING(EXTRACT(YEAR FROM NOW())::TEXT FROM 3 FOR 2);
    result := prefix || user_code || year_suffix;
    
    RETURN result;
END;
$$;

-- =====================================================
-- FUNCTION 3: add_purchased_boost_credits
-- =====================================================

CREATE OR REPLACE FUNCTION public.add_purchased_boost_credits()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.type = 'boost_purchase'
     AND NEW.status = 'completed'
     AND COALESCE(NEW.boost_quantity, 0) > 0 THEN
    UPDATE profiles
    SET 
      purchased_boost_credits = purchased_boost_credits + NEW.boost_quantity,
      available_boosts = plan_boost_credits + purchased_boost_credits
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$;

-- =====================================================
-- FUNCTION 4: zero_plan_boosts_on_free
-- =====================================================

CREATE OR REPLACE FUNCTION public.zero_plan_boosts_on_free(
  user_uuid UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE profiles
  SET plan_boost_credits = 0
  WHERE id = user_uuid AND plan = 'free';
END;
$$;

-- =====================================================
-- FUNCTION 5: grant_monthly_boosts
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

-- =====================================================
-- FUNCTION 6: calculate_expiration_date
-- =====================================================

CREATE OR REPLACE FUNCTION public.calculate_expiration_date(
  publish_date TIMESTAMP WITH TIME ZONE
)
RETURNS TIMESTAMP WITH TIME ZONE
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN publish_date + INTERVAL '30 days';
END;
$$;

-- =====================================================
-- FUNCTION 7: is_in_grace_period
-- =====================================================

CREATE OR REPLACE FUNCTION public.is_in_grace_period(
  expire_date TIMESTAMP WITH TIME ZONE
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF expire_date IS NULL THEN
    RETURN FALSE;
  END IF;

  IF expire_date < now() AND expire_date > (now() - INTERVAL '7 days') THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$;

-- =====================================================
-- FUNCTION 8: set_expiration_on_publish
-- =====================================================

CREATE OR REPLACE FUNCTION public.set_expiration_on_publish()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.ad_status = 'active' AND (OLD.ad_status IS NULL OR OLD.ad_status != 'active') THEN
    NEW.published_at := now();
    NEW.expires_at := calculate_expiration_date(now());
  END IF;
  RETURN NEW;
END;
$$;

-- =====================================================
-- FUNCTION 9: process_animal_expirations
-- RETORNO: INTEGER (contagem de animais processados)
-- =====================================================

CREATE FUNCTION public.process_animal_expirations()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  expired_count INTEGER := 0;
  renewed_count INTEGER := 0;
BEGIN
  -- Expirar anúncios sem auto_renew
  WITH expired AS (
    UPDATE animals
    SET ad_status = 'expired'
    WHERE 
      ad_status = 'active'
      AND expires_at < now()
      AND auto_renew = FALSE
    RETURNING id
  )
  SELECT COUNT(*) INTO expired_count FROM expired;

  -- Auto-renovar anúncios com auto_renew
  WITH renewed AS (
    UPDATE animals a
    SET 
      ad_status = 'active',
      published_at = now(),
      expires_at = calculate_expiration_date(now())
    FROM profiles p
    WHERE 
      a.owner_id = p.id
      AND a.ad_status = 'active'
      AND a.expires_at < now()
      AND a.auto_renew = TRUE
      AND p.plan IN ('basic', 'pro', 'ultra', 'vip')
      AND p.plan_expires_at > now()
    RETURNING a.id
  )
  SELECT COUNT(*) INTO renewed_count FROM renewed;

  RETURN expired_count + renewed_count;
END;
$$;

-- =====================================================
-- FUNCTION 10: renew_animal_individually
-- RETORNO: BOOLEAN (sucesso/falha)
-- =====================================================

CREATE FUNCTION public.renew_animal_individually(
  animal_id_param UUID,
  user_id_param UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  rows_affected INTEGER;
BEGIN
  UPDATE animals
  SET 
    ad_status = 'active',
    published_at = now(),
    expires_at = calculate_expiration_date(now())
  WHERE 
    id = animal_id_param
    AND owner_id = user_id_param;
  
  GET DIAGNOSTICS rows_affected = ROW_COUNT;
  
  RETURN rows_affected > 0;
END;
$$;

-- =====================================================
-- FUNCTION 11: expire_boosts
-- =====================================================

CREATE OR REPLACE FUNCTION public.expire_boosts()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
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

-- =====================================================
-- FUNCTION 12: expire_ads
-- =====================================================

CREATE OR REPLACE FUNCTION public.expire_ads()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
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

-- =====================================================
-- FUNCTION 13: search_animals
-- =====================================================

CREATE OR REPLACE FUNCTION public.search_animals(
  search_term TEXT DEFAULT NULL,
  breed_filter TEXT DEFAULT NULL,
  state_filter TEXT DEFAULT NULL,
  city_filter TEXT DEFAULT NULL,
  gender_filter TEXT DEFAULT NULL,
  property_type_filter TEXT DEFAULT NULL,
  order_by TEXT DEFAULT 'relevance',
  limit_count INTEGER DEFAULT 20,
  offset_count INTEGER DEFAULT 0
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
SET search_path = public, pg_temp
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
    AND (city_filter IS NULL OR a.current_city = city_filter)
    AND (property_type_filter IS NULL OR p.property_type = property_type_filter)
  ORDER BY 
    CASE WHEN order_by = 'relevance' THEN a.is_boosted::INTEGER END DESC,
    CASE WHEN order_by = 'newest' THEN a.published_at END DESC,
    CASE WHEN order_by = 'oldest' THEN a.published_at END ASC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$;

-- =====================================================
-- VALIDAÇÃO
-- =====================================================

DO $$
DECLARE
  total_functions INTEGER;
  functions_with_search_path INTEGER;
BEGIN
  -- Contar funções alvo
  SELECT COUNT(*) INTO total_functions
  FROM pg_proc
  WHERE pronamespace = 'public'::regnamespace
  AND proname IN (
    'update_updated_at_column',
    'generate_public_code',
    'add_purchased_boost_credits',
    'zero_plan_boosts_on_free',
    'grant_monthly_boosts',
    'calculate_expiration_date',
    'is_in_grace_period',
    'set_expiration_on_publish',
    'process_animal_expirations',
    'renew_animal_individually',
    'expire_boosts',
    'expire_ads',
    'search_animals'
  );
  
  -- Contar funções com search_path
  SELECT COUNT(*) INTO functions_with_search_path
  FROM pg_proc
  WHERE pronamespace = 'public'::regnamespace
  AND proname IN (
    'update_updated_at_column',
    'generate_public_code',
    'add_purchased_boost_credits',
    'zero_plan_boosts_on_free',
    'grant_monthly_boosts',
    'calculate_expiration_date',
    'is_in_grace_period',
    'set_expiration_on_publish',
    'process_animal_expirations',
    'renew_animal_individually',
    'expire_boosts',
    'expire_ads',
    'search_animals'
  )
  AND proconfig IS NOT NULL
  AND 'search_path' = ANY(string_to_array(array_to_string(proconfig, ','), ','));
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ CORREÇÃO CONCLUÍDA!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total de functions: %', total_functions;
  RAISE NOTICE 'Functions com search_path: %', functions_with_search_path;
  RAISE NOTICE '';
  
  IF functions_with_search_path = 13 THEN
    RAISE NOTICE '🎉 SUCESSO! Todas as 13 functions foram corrigidas!';
    RAISE NOTICE '✅ Proteção contra search_path injection implementada';
  ELSE
    RAISE WARNING 'Apenas % de 13 functions foram corrigidas', functions_with_search_path;
  END IF;
  
  RAISE NOTICE '========================================';
END $$;

COMMIT;

-- =====================================================
-- TESTE FINAL
-- =====================================================

SELECT 
  proname AS function_name,
  pg_get_function_identity_arguments(oid) AS arguments,
  pg_get_function_result(oid) AS return_type,
  CASE 
    WHEN proconfig IS NOT NULL 
    AND 'search_path' = ANY(string_to_array(array_to_string(proconfig, ','), ','))
    THEN '✅'
    ELSE '❌'
  END AS search_path_ok
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
AND proname IN (
  'update_updated_at_column',
  'generate_public_code',
  'add_purchased_boost_credits',
  'zero_plan_boosts_on_free',
  'grant_monthly_boosts',
  'calculate_expiration_date',
  'is_in_grace_period',
  'set_expiration_on_publish',
  'process_animal_expirations',
  'renew_animal_individually',
  'expire_boosts',
  'expire_ads',
  'search_animals'
)
ORDER BY proname;

-- =====================================================
-- RESULTADO ESPERADO
-- =====================================================
-- Todas as 13 funções com ✅ na coluna search_path_ok
-- =====================================================

