-- =====================================================
-- CORREÇÃO DE SEGURANÇA - VERSÃO CORRIGIDA
-- Adicionar search_path nas Functions
-- Baseado nas assinaturas REAIS do banco
-- =====================================================

BEGIN;

-- =====================================================
-- FUNCTION 1: update_updated_at_column
-- Assinatura: sem parâmetros
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp  -- ✅ CORREÇÃO
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- =====================================================
-- FUNCTION 2: generate_public_code
-- Assinatura: (user_id_param uuid, account_type_param text)
-- =====================================================

CREATE OR REPLACE FUNCTION public.generate_public_code(
  user_id_param UUID,
  account_type_param TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp  -- ✅ CORREÇÃO
AS $$
DECLARE
    prefix TEXT;
    user_code TEXT;
    year_suffix TEXT;
    result TEXT;
BEGIN
    -- Definir prefixo baseado no tipo de conta
    IF account_type_param = 'institutional' THEN
        prefix := 'H'; -- Haras
    ELSE
        prefix := 'U'; -- User
    END IF;
    
    -- Pegar últimos 6 caracteres do UUID (sem hífens)
    user_code := UPPER(REPLACE(SUBSTRING(user_id_param::TEXT FROM 32 FOR 6), '-', ''));
    
    -- Pegar últimos 2 dígitos do ano atual
    year_suffix := SUBSTRING(EXTRACT(YEAR FROM NOW())::TEXT FROM 3 FOR 2);
    
    -- Montar código final
    result := prefix || user_code || year_suffix;
    
    RETURN result;
END;
$$;

-- =====================================================
-- FUNCTION 3: add_purchased_boost_credits
-- Assinatura: sem parâmetros (TRIGGER)
-- =====================================================

CREATE OR REPLACE FUNCTION public.add_purchased_boost_credits()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp  -- ✅ CORREÇÃO
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
-- Assinatura: (user_uuid uuid)
-- =====================================================

CREATE OR REPLACE FUNCTION public.zero_plan_boosts_on_free(
  user_uuid UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp  -- ✅ CORREÇÃO
AS $$
BEGIN
  UPDATE profiles
  SET plan_boost_credits = 0
  WHERE id = user_uuid AND plan = 'free';
END;
$$;

-- =====================================================
-- FUNCTION 5: grant_monthly_boosts
-- Assinatura: sem parâmetros
-- =====================================================

CREATE OR REPLACE FUNCTION public.grant_monthly_boosts()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp  -- ✅ CORREÇÃO
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
-- Assinatura: (publish_date timestamp with time zone)
-- =====================================================

CREATE OR REPLACE FUNCTION public.calculate_expiration_date(
  publish_date TIMESTAMP WITH TIME ZONE
)
RETURNS TIMESTAMP WITH TIME ZONE
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp  -- ✅ CORREÇÃO
AS $$
BEGIN
  -- Retorna 30 dias após a data de publicação
  RETURN publish_date + INTERVAL '30 days';
END;
$$;

-- =====================================================
-- FUNCTION 7: is_in_grace_period
-- Assinatura: (expire_date timestamp with time zone)
-- =====================================================

CREATE OR REPLACE FUNCTION public.is_in_grace_period(
  expire_date TIMESTAMP WITH TIME ZONE
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp  -- ✅ CORREÇÃO
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
-- Assinatura: sem parâmetros (TRIGGER)
-- =====================================================

CREATE OR REPLACE FUNCTION public.set_expiration_on_publish()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp  -- ✅ CORREÇÃO
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
-- Assinatura: sem parâmetros
-- =====================================================

CREATE OR REPLACE FUNCTION public.process_animal_expirations()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp  -- ✅ CORREÇÃO
AS $$
BEGIN
  -- Expirar anúncios sem auto_renew
  UPDATE animals
  SET ad_status = 'expired'
  WHERE 
    ad_status = 'active'
    AND expires_at < now()
    AND auto_renew = FALSE;

  -- Auto-renovar anúncios com auto_renew de usuários com plano ativo
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
    AND p.plan_expires_at > now();
END;
$$;

-- =====================================================
-- FUNCTION 10: renew_animal_individually
-- Assinatura: (animal_id_param uuid, user_id_param uuid)
-- =====================================================

CREATE OR REPLACE FUNCTION public.renew_animal_individually(
  animal_id_param UUID,
  user_id_param UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp  -- ✅ CORREÇÃO
AS $$
BEGIN
  UPDATE animals
  SET 
    ad_status = 'active',
    published_at = now(),
    expires_at = calculate_expiration_date(now())
  WHERE 
    id = animal_id_param
    AND owner_id = user_id_param;
END;
$$;

-- =====================================================
-- FUNCTION 11: expire_boosts
-- Assinatura: sem parâmetros
-- =====================================================

CREATE OR REPLACE FUNCTION public.expire_boosts()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp  -- ✅ CORREÇÃO
AS $$
BEGIN
  -- Expirar boosts de animais
  UPDATE animals
  SET 
    is_boosted = FALSE,
    boost_expires_at = NULL
  WHERE 
    is_boosted = TRUE
    AND boost_expires_at < now();

  -- Expirar boosts de eventos
  UPDATE events
  SET 
    is_boosted = FALSE,
    boost_expires_at = NULL
  WHERE 
    is_boosted = TRUE
    AND boost_expires_at < now();

  -- Desativar histórico de boosts
  UPDATE boost_history
  SET is_active = FALSE
  WHERE 
    is_active = TRUE
    AND expires_at < now();
END;
$$;

-- =====================================================
-- FUNCTION 12: expire_ads
-- Assinatura: sem parâmetros
-- =====================================================

CREATE OR REPLACE FUNCTION public.expire_ads()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp  -- ✅ CORREÇÃO
AS $$
BEGIN
  -- Expirar anúncios de animais
  UPDATE animals
  SET ad_status = 'expired'
  WHERE 
    ad_status = 'active'
    AND expires_at < now();

  -- Expirar anúncios de eventos
  UPDATE events
  SET ad_status = 'expired'
  WHERE 
    ad_status = 'active'
    AND expires_at < now();
END;
$$;

-- =====================================================
-- FUNCTION 13: search_animals
-- Assinatura: (search_term, breed_filter, state_filter, city_filter, 
--              gender_filter, property_type_filter, order_by, 
--              limit_count, offset_count)
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
SET search_path = public, pg_temp  -- ✅ CORREÇÃO
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
  functions_updated INTEGER;
BEGIN
  SELECT COUNT(*) INTO functions_updated
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
  AND 'search_path' = ANY(string_to_array(array_to_string(proconfig, ','), ','));
  
  RAISE NOTICE '✅ Functions atualizadas com search_path: %', functions_updated;
  RAISE NOTICE 'Esperado: 13 functions';
  
  IF functions_updated = 13 THEN
    RAISE NOTICE '✅ SUCESSO: Todas as functions foram corrigidas!';
  ELSE
    RAISE WARNING 'Apenas % de 13 functions foram atualizadas', functions_updated;
  END IF;
END $$;

COMMIT;

-- =====================================================
-- TESTE FINAL
-- =====================================================

SELECT 
  proname AS function_name,
  pg_get_function_identity_arguments(oid) AS arguments,
  CASE 
    WHEN proconfig IS NOT NULL AND 'search_path' = ANY(string_to_array(array_to_string(proconfig, ','), ','))
    THEN '✅ YES'
    ELSE '❌ NO'
  END AS has_search_path
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
-- ✅ 13 functions atualizadas
-- ✅ Todas com search_path = public, pg_temp
-- ✅ Proteção contra injection implementada
-- =====================================================

