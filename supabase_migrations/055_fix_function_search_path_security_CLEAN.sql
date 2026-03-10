-- =====================================================
-- Migration: 055 - Corrigir Search Path de Funções (VERSÃO LIMPA)
-- Data: 08/11/2025
-- Descrição: Corrige vulnerabilidade de SQL injection em 3 funções
--            adicionando SECURITY DEFINER e search_path seguro
-- =====================================================

-- =====================================================
-- 1. FUNÇÃO: get_event_limit
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_event_limit(user_plan text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN CASE user_plan
    WHEN 'free' THEN 0
    WHEN 'basic' THEN 5
    WHEN 'pro' THEN 10
    WHEN 'ultra' THEN 15
    WHEN 'vip' THEN 10
    ELSE 0
  END;
END;
$$;

-- =====================================================
-- 2. FUNÇÃO: search_animals  
-- =====================================================

CREATE OR REPLACE FUNCTION public.search_animals(
  search_term text DEFAULT NULL,
  breed_filter text DEFAULT NULL,
  state_filter text DEFAULT NULL,
  city_filter text DEFAULT NULL,
  gender_filter text DEFAULT NULL,
  property_type_filter text DEFAULT NULL,
  category_filter text DEFAULT NULL,
  order_by text DEFAULT 'ranking',
  limit_count integer DEFAULT 20,
  offset_count integer DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  name text,
  breed text,
  gender text,
  birth_date date,
  coat text,
  current_city text,
  current_state text,
  owner_name text,
  property_name text,
  is_boosted boolean,
  impression_count bigint,
  click_count bigint,
  click_rate numeric,
  published_at timestamptz,
  category text,
  registration_number text,
  images jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
        COALESCE(ar.views, 0::bigint) AS impression_count,
        COALESCE(ar.clicks, 0::bigint) AS click_count,
        CASE 
            WHEN COALESCE(ar.views, 0) > 0 
            THEN ROUND((COALESCE(ar.clicks, 0)::numeric / COALESCE(ar.views, 1)::numeric) * 100, 2)
            ELSE 0::numeric
        END AS click_rate,
        a.published_at,
        a.category,
        a.registration_number,
        ar.images
    FROM animals a
    JOIN profiles p ON a.owner_id = p.id
    LEFT JOIN animals_ranking ar ON a.id = ar.id
    WHERE 
        a.ad_status = 'active'
        AND (search_term IS NULL OR 
             a.name ILIKE '%' || search_term || '%' OR 
             a.breed ILIKE '%' || search_term || '%' OR
             p.name ILIKE '%' || search_term || '%' OR
             p.property_name ILIKE '%' || search_term || '%')
        AND (breed_filter IS NULL OR a.breed = breed_filter)
        AND (state_filter IS NULL OR a.current_state = state_filter)
        AND (city_filter IS NULL OR a.current_city = city_filter)
        AND (gender_filter IS NULL OR a.gender = gender_filter)
        AND (property_type_filter IS NULL OR p.property_type = property_type_filter)
        AND (category_filter IS NULL OR a.category = category_filter)
    ORDER BY 
        a.is_boosted DESC,
        CASE 
            WHEN order_by = 'ranking' THEN ar.clicks
            WHEN order_by = 'most_viewed' THEN ar.views
            ELSE 0
        END DESC,
        CASE WHEN order_by = 'recent' THEN a.published_at END DESC,
        a.name ASC
    LIMIT limit_count
    OFFSET offset_count;
END;
$$;

-- =====================================================
-- 3. FUNÇÃO: update_plans_updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_plans_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- =====================================================
-- VERIFICAÇÃO
-- =====================================================

DO $$
DECLARE
  func_count integer;
BEGIN
  SELECT COUNT(*) INTO func_count
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
    AND p.proname IN ('get_event_limit', 'search_animals', 'update_plans_updated_at');
  
  IF func_count >= 3 THEN
    RAISE NOTICE '✅ Funções recriadas com search_path seguro! Total: %', func_count;
  ELSE
    RAISE WARNING '⚠️ Apenas % função(ões) encontrada(s)', func_count;
  END IF;
END;
$$;


