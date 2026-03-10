-- =====================================================
-- MIGRATION 058: Corrigir Função search_animals - Filtrar Boosts Expirados
-- =====================================================
-- Data: 14/11/2025
-- Descrição: Atualiza a função search_animals para considerar apenas boosts
--            ativos (não expirados) na ordenação e priorização
-- Prioridade: ALTA
-- =====================================================

-- Remover função antiga
DROP FUNCTION IF EXISTS search_animals(
    text, text, text, text, text, text, text, text, integer, integer
);

-- Recriar função com lógica correta de boost ativo
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
        p.full_name AS owner_name,
        p.property_name,
        -- ✅ Retornar is_boosted como TRUE apenas se não expirou
        (a.is_boosted AND a.boost_expires_at > NOW()) AS is_boosted,
        COALESCE(ar.impression_count, 0::bigint) AS impression_count,
        COALESCE(ar.click_count, 0::bigint) AS click_count,
        CASE 
            WHEN COALESCE(ar.impression_count, 0) > 0 
            THEN ROUND((COALESCE(ar.click_count, 0)::numeric / COALESCE(ar.impression_count, 1)::numeric) * 100, 2)
            ELSE 0::numeric
        END AS click_rate,
        a.published_at,
        a.category,
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
             p.full_name ILIKE '%' || search_term || '%' OR
             p.property_name ILIKE '%' || search_term || '%')
        AND (breed_filter IS NULL OR a.breed = breed_filter)
        AND (state_filter IS NULL OR a.current_state = state_filter)
        AND (city_filter IS NULL OR a.current_city = city_filter)
        AND (gender_filter IS NULL OR a.gender = gender_filter)
        AND (property_type_filter IS NULL OR p.property_type = property_type_filter)
        AND (category_filter IS NULL OR a.category = category_filter)
    ORDER BY 
        -- ✅ PRIORIDADE 1: Animais com boost ATIVO (não expirado) primeiro
        (a.is_boosted AND a.boost_expires_at > NOW()) DESC,
        -- ✅ PRIORIDADE 2: Dentro do mesmo grupo (boosted ou não), ordenar por métrica
        CASE 
            WHEN order_by = 'ranking' THEN ar.click_count  -- Ranking por CLIQUES
            WHEN order_by = 'most_viewed' THEN ar.impression_count  -- Mais visualizados
            ELSE 0
        END DESC,
        -- ✅ PRIORIDADE 3: Recentes (quando order_by = 'recent')
        CASE WHEN order_by = 'recent' THEN a.published_at END DESC,
        -- ✅ PRIORIDADE 4: Alfabético (empate)
        a.name ASC
    LIMIT limit_count
    OFFSET offset_count;
END;
$$;

-- Comentário para documentação
COMMENT ON FUNCTION search_animals IS 
'Busca animais com filtros e ordenação inteligente.
✅ Prioriza animais com boost ATIVO (não expirado) primeiro.
✅ Dentro de cada grupo (boosted/não-boosted), ordena por cliques ou visualizações.
✅ Animais com boost expirado são tratados como não-boosted na ordenação.';

-- =====================================================
-- GRANT de permissões
-- =====================================================

GRANT EXECUTE ON FUNCTION search_animals TO anon, authenticated;

-- =====================================================
-- TESTE DE VALIDAÇÃO
-- =====================================================

-- Teste 1: Verificar se função foi criada
DO $$
DECLARE
  v_function_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'search_animals'
  ) INTO v_function_exists;
  
  IF NOT v_function_exists THEN
    RAISE WARNING 'Função search_animals não foi criada corretamente';
  ELSE
    RAISE NOTICE '✅ Função search_animals criada com sucesso!';
  END IF;
END $$;

-- Teste 2: Executar busca simples para validar
DO $$
DECLARE
  v_result_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_result_count
  FROM search_animals(
    search_term := NULL,
    breed_filter := NULL,
    state_filter := NULL,
    city_filter := NULL,
    gender_filter := NULL,
    property_type_filter := NULL,
    category_filter := NULL,
    order_by := 'ranking',
    limit_count := 10,
    offset_count := 0
  );
  
  RAISE NOTICE '✅ Teste executado com sucesso! Encontrados % resultados', v_result_count;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Erro ao executar teste: %', SQLERRM;
END $$;

-- =====================================================
-- FIM DA MIGRATION 058
-- =====================================================


