-- =====================================================
-- APLICAR AGORA: Migration 038 - Filtro de Categoria
-- =====================================================
-- Copie e cole este SQL no SQL Editor do Supabase
-- =====================================================

-- 1. Remover função antiga
DROP FUNCTION IF EXISTS search_animals(
    text, text, text, text, text, text, text, integer, integer
);

-- 2. Criar nova função com filtro de categoria
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
    registration_number TEXT,
    images JSONB
) AS $$
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
        p.full_name AS owner_name,
        p.property_name,
        a.is_boosted,
        COALESCE(views, 0::bigint) AS impression_count,
        COALESCE(clicks, 0::bigint) AS click_count,
        CASE 
            WHEN COALESCE(views, 0) > 0 
            THEN ROUND((COALESCE(clicks, 0)::numeric / COALESCE(views, 1)::numeric) * 100, 2)
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
             p.full_name ILIKE '%' || search_term || '%' OR
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
$$ LANGUAGE plpgsql;

-- 3. Adicionar comentário
COMMENT ON FUNCTION search_animals IS 'Função para buscar animais com filtros e ordenação, incluindo filtro por categoria (Garanhão, Doadora, Outro). Ranking baseado em CLIQUES.';

-- =====================================================
-- FIM - Migration aplicada com sucesso! ✅
-- =====================================================


