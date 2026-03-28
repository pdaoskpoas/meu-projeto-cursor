-- =====================================================
-- MIGRAÇÃO 106: Corrigir get_featured_animals_rotated_fast
-- Data: 28/03/2026
-- Descrição:
--   1) stats.clicks → stats.click_count (view foi recriada na migração 105
--      com click_count, não clicks)
--   2) haras_name → owner_name (padronizar com o restante do sistema)
--   3) Adicionar owner_account_type e owner_property_name
--   4) Sem estas correções, o RPC falha e o fallback também
--      não consegue resolver o nome do proprietário.
-- =====================================================

-- Dropar função antiga (RETURNS TABLE mudou, PostgreSQL exige DROP primeiro)
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
    owner_name TEXT,
    property_name TEXT,
    owner_account_type TEXT,
    images JSONB,
    titles TEXT[],
    is_boosted BOOLEAN,
    boost_expires_at TIMESTAMP WITH TIME ZONE,
    boosted_at TIMESTAMP WITH TIME ZONE,
    published_at TIMESTAMP WITH TIME ZONE,
    ad_status TEXT,
    impression_count BIGINT,
    click_count BIGINT,
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
    v_rotation_offset := v_minute_counter % v_total_boosted;

    RETURN QUERY
    WITH boosted_animals AS (
        SELECT
            a.*,
            stats.impression_count,
            stats.click_count,
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
        p.name AS owner_name,
        p.property_name,
        p.account_type AS owner_account_type,
        rs.images,
        rs.titles,
        rs.is_boosted,
        rs.boost_expires_at,
        rs.boosted_at,
        rs.published_at,
        rs.ad_status,
        COALESCE(rs.impression_count, 0) AS impression_count,
        COALESCE(rs.click_count, 0) AS click_count,
        COALESCE(rs.click_rate, 0) AS click_rate,
        rs.rotation_position::INTEGER
    FROM rotated_selection rs
    JOIN profiles p ON rs.owner_id = p.id
    ORDER BY rs.rotation_position ASC
    LIMIT p_limit;
END;
$$;

-- Log de auditoria
INSERT INTO public.system_logs (operation, details)
VALUES (
  'migration_106_fix_featured_rpc',
  jsonb_build_object(
    'timestamp', now(),
    'reason', 'Corrigido get_featured_animals_rotated_fast: stats.clicks→stats.click_count, haras_name→owner_name, adicionado owner_account_type',
    'fixes', ARRAY[
      'stats.clicks → stats.click_count (view recriada na mig 105)',
      'haras_name → owner_name (padronização)',
      'Adicionado owner_account_type na resposta'
    ]
  )
);
