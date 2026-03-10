-- =====================================================
-- MIGRATION 062: Sistema de Rotação de Animais Impulsionados
-- VERSÃO CORRIGIDA - SEM AMBIGUIDADE
-- Data: 17/11/2025
-- =====================================================

-- =====================================================
-- LIMPEZA: Remover funções antigas se existirem
-- =====================================================

DROP FUNCTION IF EXISTS get_featured_animals_rotated(INTEGER);
DROP FUNCTION IF EXISTS get_featured_animals_rotated_fast(INTEGER);

-- =====================================================
-- FUNÇÃO PRINCIPAL: Rotação Rápida (1 minuto)
-- =====================================================

CREATE OR REPLACE FUNCTION get_featured_animals_rotated_fast(
    p_limit INTEGER DEFAULT 10
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
    owner_id UUID,
    haras_name TEXT,
    property_name TEXT,
    images JSONB,
    titles TEXT[],
    is_boosted BOOLEAN,
    boost_expires_at TIMESTAMP WITH TIME ZONE,
    boosted_at TIMESTAMP WITH TIME ZONE,
    published_at TIMESTAMP WITH TIME ZONE,
    ad_status TEXT,
    impression_count BIGINT,
    clicks BIGINT,
    click_rate NUMERIC,
    rotation_position INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_total_boosted INTEGER;
    v_rotation_offset INTEGER;
    v_minute_counter INTEGER;
BEGIN
    -- Contar total de animais impulsionados ativos
    -- ✅ Usando alias 'a' para evitar ambiguidade
    SELECT COUNT(*) INTO v_total_boosted
    FROM animals a
    WHERE a.is_boosted = TRUE
      AND a.boost_expires_at IS NOT NULL
      AND a.boost_expires_at > NOW()
      AND a.ad_status = 'active';
    
    -- Se não há animais impulsionados, retornar vazio
    IF v_total_boosted = 0 THEN
        RETURN;
    END IF;
    
    -- Calcular minuto atual (rotaciona a cada minuto)
    v_minute_counter := FLOOR(EXTRACT(EPOCH FROM NOW()) / 60)::INTEGER;
    
    -- Calcular offset de rotação
    -- Move 1 posição a cada minuto
    v_rotation_offset := v_minute_counter % v_total_boosted;
    
    -- Buscar animais com rotação
    RETURN QUERY
    WITH boosted_animals AS (
        SELECT 
            anim.*,
            stats.impression_count,
            stats.clicks,
            stats.click_rate,
            ROW_NUMBER() OVER (ORDER BY anim.boosted_at ASC, anim.id) AS position
        FROM animals anim
        LEFT JOIN animals_with_stats stats ON anim.id = stats.id
        WHERE anim.is_boosted = TRUE
          AND anim.boost_expires_at IS NOT NULL
          AND anim.boost_expires_at > NOW()
          AND anim.ad_status = 'active'
    ),
    rotated_selection AS (
        SELECT 
            ba.*,
            ((ba.position - 1 + v_rotation_offset) % v_total_boosted) + 1 AS rotation_position
        FROM boosted_animals ba
    )
    SELECT 
        rs.id,
        rs.name,
        rs.breed,
        rs.gender,
        rs.birth_date,
        rs.coat,
        rs.current_city,
        rs.current_state,
        rs.owner_id,
        p.name AS haras_name,
        p.property_name,
        rs.images,
        rs.titles,
        rs.is_boosted,
        rs.boost_expires_at,
        rs.boosted_at,
        rs.published_at,
        rs.ad_status,
        COALESCE(rs.impression_count, 0) AS impression_count,
        COALESCE(rs.clicks, 0) AS clicks,
        COALESCE(rs.click_rate, 0) AS click_rate,
        rs.rotation_position::INTEGER
    FROM rotated_selection rs
    JOIN profiles p ON rs.owner_id = p.id
    ORDER BY rs.rotation_position ASC
    LIMIT p_limit;
END;
$$;

COMMENT ON FUNCTION get_featured_animals_rotated_fast IS 
'Rotação rápida de anúncios impulsionados (muda a cada minuto).
- Move 1 posição por minuto
- Se há 20 anúncios, em 20 minutos todos foram o primeiro
- Distribuição 100% equitativa
- CORRIGIDO: Aliases explícitos para evitar ambiguidade';

-- =====================================================
-- FUNÇÃO ALTERNATIVA: Rotação Lenta (30 minutos)
-- =====================================================

CREATE OR REPLACE FUNCTION get_featured_animals_rotated(
    p_limit INTEGER DEFAULT 10
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
    owner_id UUID,
    haras_name TEXT,
    property_name TEXT,
    images JSONB,
    titles TEXT[],
    is_boosted BOOLEAN,
    boost_expires_at TIMESTAMP WITH TIME ZONE,
    boosted_at TIMESTAMP WITH TIME ZONE,
    published_at TIMESTAMP WITH TIME ZONE,
    ad_status TEXT,
    impression_count BIGINT,
    clicks BIGINT,
    click_rate NUMERIC,
    rotation_position INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_total_boosted INTEGER;
    v_rotation_offset INTEGER;
    v_time_slot INTEGER;
BEGIN
    -- Contar total de animais impulsionados ativos
    -- ✅ Usando alias 'a' para evitar ambiguidade
    SELECT COUNT(*) INTO v_total_boosted
    FROM animals a
    WHERE a.is_boosted = TRUE
      AND a.boost_expires_at IS NOT NULL
      AND a.boost_expires_at > NOW()
      AND a.ad_status = 'active';
    
    IF v_total_boosted = 0 THEN
        RETURN;
    END IF;
    
    -- Calcular slot de tempo (muda a cada 30 minutos)
    v_time_slot := FLOOR(EXTRACT(EPOCH FROM NOW()) / 1800)::INTEGER;
    
    -- Calcular offset de rotação
    v_rotation_offset := (v_time_slot * p_limit) % v_total_boosted;
    
    RETURN QUERY
    WITH boosted_animals AS (
        SELECT 
            anim.*,
            stats.impression_count,
            stats.clicks,
            stats.click_rate,
            ROW_NUMBER() OVER (ORDER BY anim.boosted_at ASC, anim.id) AS position
        FROM animals anim
        LEFT JOIN animals_with_stats stats ON anim.id = stats.id
        WHERE anim.is_boosted = TRUE
          AND anim.boost_expires_at IS NOT NULL
          AND anim.boost_expires_at > NOW()
          AND anim.ad_status = 'active'
    ),
    rotated_selection AS (
        SELECT 
            ba.*,
            ((ba.position - 1 + v_rotation_offset) % v_total_boosted) + 1 AS rotation_position
        FROM boosted_animals ba
    )
    SELECT 
        rs.id,
        rs.name,
        rs.breed,
        rs.gender,
        rs.birth_date,
        rs.coat,
        rs.current_city,
        rs.current_state,
        rs.owner_id,
        p.name AS haras_name,
        p.property_name,
        rs.images,
        rs.titles,
        rs.is_boosted,
        rs.boost_expires_at,
        rs.boosted_at,
        rs.published_at,
        rs.ad_status,
        COALESCE(rs.impression_count, 0) AS impression_count,
        COALESCE(rs.clicks, 0) AS clicks,
        COALESCE(rs.click_rate, 0) AS click_rate,
        rs.rotation_position::INTEGER
    FROM rotated_selection rs
    JOIN profiles p ON rs.owner_id = p.id
    ORDER BY rs.rotation_position ASC
    LIMIT p_limit;
END;
$$;

COMMENT ON FUNCTION get_featured_animals_rotated IS 
'Rotação lenta de anúncios impulsionados (muda a cada 30 minutos).
- Mais estável que a versão fast
- Ideal para menos mudanças frequentes
- CORRIGIDO: Aliases explícitos para evitar ambiguidade';

-- =====================================================
-- GRANT DE PERMISSÕES
-- =====================================================

GRANT EXECUTE ON FUNCTION get_featured_animals_rotated TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_featured_animals_rotated_fast TO authenticated, anon;

-- =====================================================
-- TESTES DE VALIDAÇÃO
-- =====================================================

-- Teste 1: Verificar se funções foram criadas
DO $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM pg_proc
    WHERE proname LIKE '%featured_animals_rotated%';
    
    IF v_count >= 2 THEN
        RAISE NOTICE '✅ Funções criadas com sucesso! Total: %', v_count;
    ELSE
        RAISE WARNING '⚠️ Esperado 2 funções, encontrado: %', v_count;
    END IF;
END $$;

-- Teste 2: Contar animais impulsionados
DO $$
DECLARE
    v_total INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_total
    FROM animals a
    WHERE a.is_boosted = TRUE 
      AND a.boost_expires_at > NOW() 
      AND a.ad_status = 'active';
    
    RAISE NOTICE '📊 Total de animais impulsionados ativos: %', v_total;
    
    IF v_total = 0 THEN
        RAISE NOTICE '⚠️ Não há animais impulsionados no momento. Crie alguns para testar a rotação.';
    END IF;
END $$;

-- Teste 3: Testar função de rotação rápida
DO $$
DECLARE
    v_result_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_result_count
    FROM get_featured_animals_rotated_fast(10);
    
    RAISE NOTICE '✅ Função get_featured_animals_rotated_fast executada!';
    RAISE NOTICE '📊 Resultados retornados: %', v_result_count;
END $$;

-- Teste 4: Mostrar ordem atual
DO $$
DECLARE
    v_rec RECORD;
    v_count INTEGER := 0;
BEGIN
    RAISE NOTICE '📋 ORDEM ATUAL DOS ANÚNCIOS:';
    RAISE NOTICE '════════════════════════════════════════';
    
    FOR v_rec IN 
        SELECT name, rotation_position
        FROM get_featured_animals_rotated_fast(10)
        ORDER BY rotation_position
    LOOP
        v_count := v_count + 1;
        RAISE NOTICE 'Posição %: %', v_rec.rotation_position, v_rec.name;
    END LOOP;
    
    IF v_count = 0 THEN
        RAISE NOTICE '(Nenhum resultado - não há anúncios impulsionados)';
    END IF;
    
    RAISE NOTICE '════════════════════════════════════════';
END $$;

-- =====================================================
-- INFORMAÇÕES FINAIS
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════════════════════';
    RAISE NOTICE '✅ MIGRATION 062 APLICADA COM SUCESSO!';
    RAISE NOTICE '═══════════════════════════════════════════════════════';
    RAISE NOTICE '';
    RAISE NOTICE '📌 FUNÇÕES CRIADAS:';
    RAISE NOTICE '  1. get_featured_animals_rotated_fast(limit)';
    RAISE NOTICE '     → Rotação rápida (1 minuto)';
    RAISE NOTICE '';
    RAISE NOTICE '  2. get_featured_animals_rotated(limit)';
    RAISE NOTICE '     → Rotação lenta (30 minutos)';
    RAISE NOTICE '';
    RAISE NOTICE '🔧 PRÓXIMOS PASSOS:';
    RAISE NOTICE '  1. Testar: SELECT * FROM get_featured_animals_rotated_fast(10);';
    RAISE NOTICE '  2. Deploy do frontend (código já está atualizado)';
    RAISE NOTICE '  3. Verificar página home após deploy';
    RAISE NOTICE '';
    RAISE NOTICE '📚 DOCUMENTAÇÃO: SISTEMA_ROTACAO_IMPULSIONADOS.md';
    RAISE NOTICE '═══════════════════════════════════════════════════════';
END $$;

