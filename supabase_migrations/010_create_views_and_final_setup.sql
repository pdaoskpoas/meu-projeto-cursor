-- =====================================================
-- MIGRAÇÃO 010: VIEWS E CONFIGURAÇÃO FINAL
-- Data: 30/09/2025
-- Descrição: Criar views úteis e configurações finais
-- =====================================================

-- =====================================================
-- VIEW: ANIMAIS COM ESTATÍSTICAS
-- =====================================================
CREATE VIEW animals_with_stats AS
SELECT 
    a.*,
    COALESCE(imp.impression_count, 0) as impression_count,
    COALESCE(cl.click_count, 0) as click_count,
    CASE 
        WHEN COALESCE(imp.impression_count, 0) > 0 
        THEN ROUND((COALESCE(cl.click_count, 0)::DECIMAL / imp.impression_count) * 100, 2)
        ELSE 0 
    END as click_rate,
    p.name as owner_name,
    p.public_code as owner_public_code,
    p.account_type as owner_account_type
FROM animals a
LEFT JOIN profiles p ON a.owner_id = p.id
LEFT JOIN (
    SELECT 
        content_id, 
        COUNT(*) as impression_count
    FROM impressions 
    WHERE content_type = 'animal'
    GROUP BY content_id
) imp ON a.id = imp.content_id
LEFT JOIN (
    SELECT 
        content_id, 
        COUNT(*) as click_count
    FROM clicks 
    WHERE content_type = 'animal'
    GROUP BY content_id
) cl ON a.id = cl.content_id;

-- =====================================================
-- VIEW: EVENTOS COM ESTATÍSTICAS
-- =====================================================
CREATE VIEW events_with_stats AS
SELECT 
    e.*,
    COALESCE(imp.impression_count, 0) as impression_count,
    COALESCE(cl.click_count, 0) as click_count,
    CASE 
        WHEN COALESCE(imp.impression_count, 0) > 0 
        THEN ROUND((COALESCE(cl.click_count, 0)::DECIMAL / imp.impression_count) * 100, 2)
        ELSE 0 
    END as click_rate,
    p.name as organizer_name,
    p.public_code as organizer_public_code
FROM events e
LEFT JOIN profiles p ON e.organizer_id = p.id
LEFT JOIN (
    SELECT 
        content_id, 
        COUNT(*) as impression_count
    FROM impressions 
    WHERE content_type = 'event'
    GROUP BY content_id
) imp ON e.id = imp.content_id
LEFT JOIN (
    SELECT 
        content_id, 
        COUNT(*) as click_count
    FROM clicks 
    WHERE content_type = 'event'
    GROUP BY content_id
) cl ON e.id = cl.content_id;

-- =====================================================
-- VIEW: ARTIGOS COM ESTATÍSTICAS
-- =====================================================
CREATE VIEW articles_with_stats AS
SELECT 
    a.*,
    COALESCE(imp.impression_count, 0) as view_count,
    p.name as author_name
FROM articles a
LEFT JOIN profiles p ON a.author_id = p.id
LEFT JOIN (
    SELECT 
        content_id, 
        COUNT(*) as impression_count
    FROM impressions 
    WHERE content_type = 'article'
    GROUP BY content_id
) imp ON a.id = imp.content_id;

-- =====================================================
-- VIEW: DASHBOARD DE USUÁRIO
-- =====================================================
CREATE VIEW user_dashboard_stats AS
SELECT 
    p.id as user_id,
    p.name,
    p.plan,
    p.available_boosts,
    COUNT(DISTINCT a.id) FILTER (WHERE a.ad_status = 'active') as active_animals,
    COUNT(DISTINCT e.id) FILTER (WHERE e.ad_status = 'active') as active_events,
    COALESCE(SUM(COALESCE(imp_a.impression_count, 0)), 0) as total_animal_impressions,
    COALESCE(SUM(COALESCE(cl_a.click_count, 0)), 0) as total_animal_clicks,
    COALESCE(SUM(COALESCE(imp_e.impression_count, 0)), 0) as total_event_impressions,
    COALESCE(SUM(COALESCE(cl_e.click_count, 0)), 0) as total_event_clicks,
    COUNT(DISTINCT bh.id) FILTER (WHERE bh.is_active = true) as active_boosts
FROM profiles p
LEFT JOIN animals a ON p.id = a.owner_id
LEFT JOIN events e ON p.id = e.organizer_id
LEFT JOIN (
    SELECT content_id, COUNT(*) as impression_count
    FROM impressions WHERE content_type = 'animal'
    GROUP BY content_id
) imp_a ON a.id = imp_a.content_id
LEFT JOIN (
    SELECT content_id, COUNT(*) as click_count
    FROM clicks WHERE content_type = 'animal'
    GROUP BY content_id
) cl_a ON a.id = cl_a.content_id
LEFT JOIN (
    SELECT content_id, COUNT(*) as impression_count
    FROM impressions WHERE content_type = 'event'
    GROUP BY content_id
) imp_e ON e.id = imp_e.content_id
LEFT JOIN (
    SELECT content_id, COUNT(*) as click_count
    FROM clicks WHERE content_type = 'event'
    GROUP BY content_id
) cl_e ON e.id = cl_e.content_id
LEFT JOIN boost_history bh ON p.id = bh.user_id
GROUP BY p.id, p.name, p.plan, p.available_boosts;

-- =====================================================
-- VIEW: RANKING DE ANIMAIS (PARA PÁGINA DE BUSCA)
-- =====================================================
CREATE VIEW animals_ranking AS
SELECT 
    a.*,
    COALESCE(imp.impression_count, 0) as impression_count,
    COALESCE(cl.click_count, 0) as click_count,
    CASE 
        WHEN COALESCE(imp.impression_count, 0) > 0 
        THEN ROUND((COALESCE(cl.click_count, 0)::DECIMAL / imp.impression_count) * 100, 2)
        ELSE 0 
    END as click_rate,
    p.name as owner_name,
    p.public_code as owner_public_code,
    p.property_name as property_name,
    -- Pontuação para ranking (boosted primeiro, depois por click_rate)
    CASE 
        WHEN a.is_boosted = true THEN 1000000 + COALESCE(cl.click_count, 0)
        ELSE COALESCE(cl.click_count, 0)
    END as ranking_score
FROM animals a
LEFT JOIN profiles p ON a.owner_id = p.id
LEFT JOIN (
    SELECT content_id, COUNT(*) as impression_count
    FROM impressions WHERE content_type = 'animal'
    GROUP BY content_id
) imp ON a.id = imp.content_id
LEFT JOIN (
    SELECT content_id, COUNT(*) as click_count
    FROM clicks WHERE content_type = 'animal'
    GROUP BY content_id
) cl ON a.id = cl.content_id
WHERE a.ad_status = 'active';

-- =====================================================
-- FUNÇÃO PARA BUSCAR ANIMAIS COM FILTROS
-- =====================================================
CREATE OR REPLACE FUNCTION search_animals(
    search_term TEXT DEFAULT NULL,
    breed_filter TEXT DEFAULT NULL,
    state_filter TEXT DEFAULT NULL,
    city_filter TEXT DEFAULT NULL,
    gender_filter TEXT DEFAULT NULL,
    property_type_filter TEXT DEFAULT NULL,
    order_by TEXT DEFAULT 'ranking', -- 'ranking', 'recent', 'most_viewed'
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
    published_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ar.id,
        ar.name,
        ar.breed,
        ar.gender,
        ar.birth_date,
        ar.coat,
        ar.current_city,
        ar.current_state,
        ar.owner_name,
        ar.property_name,
        ar.is_boosted,
        ar.impression_count,
        ar.click_count,
        ar.click_rate,
        ar.published_at
    FROM animals_ranking ar
    LEFT JOIN profiles p ON ar.owner_id = p.id
    WHERE 
        (search_term IS NULL OR 
         ar.name ILIKE '%' || search_term || '%' OR 
         ar.breed ILIKE '%' || search_term || '%' OR
         ar.owner_name ILIKE '%' || search_term || '%' OR
         ar.property_name ILIKE '%' || search_term || '%')
        AND (breed_filter IS NULL OR ar.breed = breed_filter)
        AND (state_filter IS NULL OR ar.current_state = state_filter)
        AND (city_filter IS NULL OR ar.current_city = city_filter)
        AND (gender_filter IS NULL OR ar.gender = gender_filter)
        AND (property_type_filter IS NULL OR p.property_type = property_type_filter)
    ORDER BY 
        CASE 
            WHEN order_by = 'ranking' THEN ar.ranking_score
            WHEN order_by = 'most_viewed' THEN ar.click_count
            ELSE 0
        END DESC,
        CASE WHEN order_by = 'recent' THEN ar.published_at END DESC,
        ar.name ASC
    LIMIT limit_count
    OFFSET offset_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- CONFIGURAÇÕES FINAIS
-- =====================================================

-- Permitir que usuários autenticados executem as funções
GRANT EXECUTE ON FUNCTION search_animals TO authenticated;
GRANT EXECUTE ON FUNCTION reset_monthly_boosts TO authenticated;
GRANT EXECUTE ON FUNCTION expire_boosts TO authenticated;
GRANT EXECUTE ON FUNCTION expire_ads TO authenticated;
GRANT EXECUTE ON FUNCTION generate_public_code TO authenticated;

-- Permitir acesso às views
GRANT SELECT ON animals_with_stats TO authenticated;
GRANT SELECT ON events_with_stats TO authenticated;
GRANT SELECT ON articles_with_stats TO authenticated;
GRANT SELECT ON user_dashboard_stats TO authenticated;
GRANT SELECT ON animals_ranking TO authenticated;

-- Comentários para documentação
COMMENT ON VIEW animals_with_stats IS 'Animais com estatísticas de impressões e cliques';
COMMENT ON VIEW events_with_stats IS 'Eventos com estatísticas de impressões e cliques';
COMMENT ON VIEW articles_with_stats IS 'Artigos com estatísticas de visualizações';
COMMENT ON VIEW user_dashboard_stats IS 'Estatísticas consolidadas para dashboard do usuário';
COMMENT ON VIEW animals_ranking IS 'Ranking de animais para página de busca (boosted primeiro)';
COMMENT ON FUNCTION search_animals IS 'Função para buscar animais com filtros e ordenação';
