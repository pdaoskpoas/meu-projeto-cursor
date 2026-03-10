-- =====================================================
-- MIGRATION 089: Registro do animal e novas categorias
-- Data: 03/02/2026
-- Descrição: Adiciona flag de registro, atualiza categorias e RPC search_animals
-- =====================================================

-- 1) Adicionar coluna is_registered (default TRUE para registros existentes)
ALTER TABLE public.animals
ADD COLUMN IF NOT EXISTS is_registered BOOLEAN NOT NULL DEFAULT TRUE;

COMMENT ON COLUMN public.animals.is_registered IS
'Indica se o animal possui registro oficial';

UPDATE public.animals
SET is_registered = TRUE
WHERE is_registered IS NULL;

-- 2) Atualizar constraint de categoria
ALTER TABLE public.animals
DROP CONSTRAINT IF EXISTS animals_category_check;

ALTER TABLE public.animals
ADD CONSTRAINT animals_category_check
CHECK (category = ANY (ARRAY[
  'Garanhão'::text,
  'Castrado'::text,
  'Doadora'::text,
  'Matriz'::text,
  'Potro'::text,
  'Potra'::text,
  'Outro'::text
]));

COMMENT ON COLUMN public.animals.category IS
'Categoria do animal: Garanhão, Castrado, Doadora, Matriz, Potro, Potra ou Outro';

-- 3) Atualizar função search_animals para retornar is_registered
DROP FUNCTION IF EXISTS search_animals(
    text, text, text, text, text, text, text, text, integer, integer
);

CREATE OR REPLACE FUNCTION search_animals(
    search_term TEXT DEFAULT NULL,
    breed_filter TEXT DEFAULT NULL,
    state_filter TEXT DEFAULT NULL,
    city_filter TEXT DEFAULT NULL,
    gender_filter TEXT DEFAULT NULL,
    property_type_filter TEXT DEFAULT NULL,
    category_filter TEXT DEFAULT NULL,
    order_by TEXT DEFAULT 'ranking',
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
    impression_count BIGINT,
    click_count BIGINT,
    click_rate NUMERIC,
    published_at TIMESTAMP WITH TIME ZONE,
    category TEXT,
    is_registered BOOLEAN,
    registration_number TEXT,
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
        (a.is_boosted AND (a.boost_expires_at IS NULL OR a.boost_expires_at > NOW())) AS is_boosted,
        COALESCE(ar.impression_count, 0) AS impression_count,
        COALESCE(ar.click_count, 0) AS click_count,
        CASE 
            WHEN COALESCE(ar.impression_count, 0) > 0 
                THEN ROUND((COALESCE(ar.click_count, 0)::NUMERIC / COALESCE(ar.impression_count, 1)::NUMERIC) * 100, 2)
            ELSE 0::NUMERIC
        END AS click_rate,
        a.published_at,
        a.category,
        a.is_registered,
        a.registration_number,
        a.images
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
        CASE 
            WHEN order_by IN ('recent', 'most_viewed') THEN 0
            ELSE CASE 
                WHEN (a.is_boosted AND (a.boost_expires_at IS NULL OR a.boost_expires_at > NOW())) THEN 0 
                ELSE 1 
            END
        END,
        CASE 
            WHEN order_by IN ('ranking', 'most_viewed') THEN COALESCE(ar.click_count, 0)
            ELSE 0
        END DESC,
        CASE 
            WHEN order_by = 'ranking' THEN COALESCE(ar.impression_count, 0)
            ELSE 0
        END DESC,
        a.published_at DESC
    LIMIT limit_count
    OFFSET offset_count;
END;
$$;

COMMENT ON FUNCTION search_animals IS
'Retorna animais ativos com filtros e ordenações personalizadas:
- ranking: boost ativo primeiro, depois cliques/visualizações.
- recent: mais novos primeiro.
- most_viewed: cliques independentes de boost.';

GRANT EXECUTE ON FUNCTION search_animals TO anon, authenticated;
