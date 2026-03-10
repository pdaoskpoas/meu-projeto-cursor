-- =====================================================
-- MIGRATION 062: Sistema de Rotação de Animais Impulsionados
-- Data: 17/11/2025
-- Objetivo: Garantir que todos os animais impulsionados sejam
--           exibidos com a mesma frequência (distribuição equitativa)
-- =====================================================

-- =====================================================
-- FUNÇÃO: Buscar Animais Impulsionados com Rotação
-- =====================================================

DROP FUNCTION IF EXISTS get_featured_animals_rotated(INTEGER);

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
    
    -- Calcular slot de tempo (muda a cada 30 minutos)
    -- Isso faz os anúncios rotacionarem a cada meia hora
    v_time_slot := FLOOR(EXTRACT(EPOCH FROM NOW()) / 1800)::INTEGER;
    
    -- Calcular offset de rotação
    -- Se há 20 anúncios e limite é 10:
    -- - Slot 0: offset 0  → mostra anúncios 1-10
    -- - Slot 1: offset 10 → mostra anúncios 11-20
    -- - Slot 2: offset 0  → mostra anúncios 1-10 novamente
    v_rotation_offset := (v_time_slot * p_limit) % v_total_boosted;
    
    -- Buscar animais com rotação
    RETURN QUERY
    WITH boosted_animals AS (
        SELECT 
            a.*,
            stats.impression_count,
            stats.clicks,
            stats.click_rate,
            ROW_NUMBER() OVER (ORDER BY a.boosted_at ASC, a.id) AS position
        FROM animals a
        LEFT JOIN animals_with_stats stats ON a.id = stats.id
        WHERE a.is_boosted = TRUE
          AND a.boost_expires_at IS NOT NULL
          AND a.boost_expires_at > NOW()
          AND a.ad_status = 'active'
    ),
    rotated_selection AS (
        SELECT 
            ba.*,
            -- Aplicar rotação circular
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
'Retorna animais impulsionados com rotação automática para distribuição equitativa.
- Rotaciona a cada 30 minutos
- Garante que todos os anúncios apareçam com a mesma frequência
- Se há 20 anúncios e limite 10, alterna entre os 2 grupos a cada 30 min';

-- =====================================================
-- FUNÇÃO ALTERNATIVA: Rotação por Minuto
-- (Mais dinâmica, muda a cada minuto)
-- =====================================================

DROP FUNCTION IF EXISTS get_featured_animals_rotated_fast(INTEGER);

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
    SELECT COUNT(*) INTO v_total_boosted
    FROM animals a
    WHERE a.is_boosted = TRUE
      AND a.boost_expires_at IS NOT NULL
      AND a.boost_expires_at > NOW()
      AND a.ad_status = 'active';
    
    IF v_total_boosted = 0 THEN
        RETURN;
    END IF;
    
    -- Calcular minuto atual (rotaciona a cada minuto)
    v_minute_counter := FLOOR(EXTRACT(EPOCH FROM NOW()) / 60)::INTEGER;
    
    -- Calcular offset: move 1 posição a cada minuto
    -- Se há 20 anúncios:
    -- - Minuto 0: offset 0  → anúncios começam em 1
    -- - Minuto 1: offset 1  → anúncios começam em 2
    -- - Minuto 2: offset 2  → anúncios começam em 3
    -- - ...
    -- - Minuto 20: offset 0 → volta ao início
    v_rotation_offset := v_minute_counter % v_total_boosted;
    
    RETURN QUERY
    WITH boosted_animals AS (
        SELECT 
            a.*,
            stats.impression_count,
            stats.clicks,
            stats.click_rate,
            ROW_NUMBER() OVER (ORDER BY a.boosted_at ASC, a.id) AS position
        FROM animals a
        LEFT JOIN animals_with_stats stats ON a.id = stats.id
        WHERE a.is_boosted = TRUE
          AND a.boost_expires_at IS NOT NULL
          AND a.boost_expires_at > NOW()
          AND a.ad_status = 'active'
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
'Rotação mais rápida: muda a cada minuto.
- Move 1 posição por minuto
- Se há 20 anúncios, cada um terá seu turno de ser o primeiro
- Garante distribuição 100% equitativa ao longo do tempo';

-- =====================================================
-- GRANT DE PERMISSÕES
-- =====================================================

GRANT EXECUTE ON FUNCTION get_featured_animals_rotated TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_featured_animals_rotated_fast TO authenticated, anon;

-- =====================================================
-- TESTES DE VALIDAÇÃO
-- =====================================================

-- Teste 1: Ver rotação normal (30 minutos)
SELECT 
    name,
    rotation_position,
    boosted_at,
    'Rotação 30min' AS tipo
FROM get_featured_animals_rotated(10)
ORDER BY rotation_position;

-- Teste 2: Ver rotação rápida (1 minuto)
SELECT 
    name,
    rotation_position,
    boosted_at,
    'Rotação 1min' AS tipo
FROM get_featured_animals_rotated_fast(10)
ORDER BY rotation_position;

-- Teste 3: Simular passagem de tempo
DO $$
DECLARE
    v_current_time TIMESTAMP;
    v_slot INTEGER;
BEGIN
    v_current_time := NOW();
    
    RAISE NOTICE '=== SIMULAÇÃO DE ROTAÇÃO ===';
    RAISE NOTICE 'Hora atual: %', v_current_time;
    RAISE NOTICE 'Slot (30min): %', FLOOR(EXTRACT(EPOCH FROM v_current_time) / 1800);
    RAISE NOTICE 'Minuto: %', FLOOR(EXTRACT(EPOCH FROM v_current_time) / 60);
    RAISE NOTICE '';
    RAISE NOTICE 'Total de animais impulsionados: %', (
        SELECT COUNT(*) FROM animals a
        WHERE a.is_boosted = TRUE 
          AND a.boost_expires_at > NOW() 
          AND a.ad_status = 'active'
    );
END $$;

-- =====================================================
-- EXEMPLO DE USO NO CÓDIGO
-- =====================================================

-- No animalService.ts, substituir:
-- 
-- async getFeaturedAnimals(limit: number = 10): Promise<AnimalWithStats[]> {
--   const { data, error } = await supabase
--     .rpc('get_featured_animals_rotated', { p_limit: limit })
--   
--   return data as AnimalWithStats[]
-- }

-- =====================================================
-- FIM DA MIGRATION 062
-- =====================================================

SELECT 'Migration 062 aplicada com sucesso! Sistema de rotação implementado.' AS status;

