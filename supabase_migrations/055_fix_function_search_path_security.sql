-- =====================================================
-- Migration: 055 - Adicionar search_path seguro às funções
-- Código EXATAMENTE como está no banco + SECURITY DEFINER + SET search_path
-- =====================================================

-- =====================================================
-- 1. get_event_limit
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_event_limit(user_plan text)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
 IMMUTABLE
AS $function$
BEGIN
  RETURN CASE user_plan
    WHEN 'basic' THEN 1
    WHEN 'pro' THEN 2
    WHEN 'ultra' THEN 3
    WHEN 'vip' THEN 999
    ELSE 0
  END;
END;
$function$;

-- =====================================================
-- 2. search_animals (CODIGO EXATO DO BANCO)
-- =====================================================

CREATE OR REPLACE FUNCTION public.search_animals(search_term text DEFAULT NULL::text, breed_filter text DEFAULT NULL::text, state_filter text DEFAULT NULL::text, city_filter text DEFAULT NULL::text, gender_filter text DEFAULT NULL::text, property_type_filter text DEFAULT NULL::text, category_filter text DEFAULT NULL::text, order_by text DEFAULT 'ranking'::text, limit_count integer DEFAULT 20, offset_count integer DEFAULT 0)
 RETURNS TABLE(id uuid, name text, breed text, gender text, birth_date date, coat text, current_city text, current_state text, owner_name text, property_name text, is_boosted boolean, impression_count bigint, click_count bigint, click_rate numeric, published_at timestamp with time zone, category text, registration_number text, images jsonb)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
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
$function$;

-- =====================================================
-- 3. update_plans_updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_plans_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;
