-- =====================================================
-- MIGRAÇÃO 115: Ocultar conteúdo de usuários suspensos
-- Data: 2026-04-10
-- Descrição:
--   Quando um usuário é suspenso (is_suspended = true) ou desativado
--   (is_active = false), seu perfil, animais e eventos não devem mais
--   aparecer publicamente no site — como se o plano estivesse "pausado".
--
--   Perfis:
--     - Já resolvido: a view public_profiles (migração 103) filtra
--       is_active = true AND is_suspended = false.
--
--   Animais:
--     - Atualiza animals_with_stats para ocultar registros cujo owner
--       esteja suspenso ou inativo.
--
--   Eventos:
--     - Atualiza events_with_stats para ocultar registros cujo organizer
--       esteja suspenso ou inativo.
--
--   Observações:
--     - Administradores consultam diretamente as tabelas `animals` /
--       `events` (não as views), portanto seu acesso não é afetado.
--     - Usuários suspensos não conseguem fazer login (authService),
--       portanto não impactamos fluxos do próprio dashboard.
-- =====================================================

BEGIN;

-- =============================================================================
-- 1) animals_with_stats — filtrar por owner suspenso/inativo
-- =============================================================================
-- A view é recriada mantendo security_invoker = false (migração 105) para
-- permitir o JOIN com profiles sem esbarrar nas RLS restritas (migração 099).

DROP VIEW IF EXISTS public.animals_with_stats CASCADE;

CREATE VIEW public.animals_with_stats
AS
SELECT
  a.*,
  p.name AS owner_name,
  p.property_name,
  p.property_name AS owner_property_name,
  p.public_code AS owner_public_code,
  p.account_type AS owner_account_type,
  p.avatar_url AS owner_avatar_url,
  COALESCE(imp.impression_count, 0) AS impression_count,
  COALESCE(clk.click_count, 0) AS click_count,
  CASE
    WHEN COALESCE(imp.impression_count, 0) > 0
    THEN ROUND((COALESCE(clk.click_count, 0)::DECIMAL / imp.impression_count) * 100, 2)
    ELSE 0
  END AS click_rate
FROM animals a
INNER JOIN profiles p
  ON a.owner_id = p.id
  AND p.is_active = true
  AND p.is_suspended = false
LEFT JOIN (
  SELECT content_id, COUNT(*) AS impression_count
  FROM impressions
  WHERE content_type = 'animal'
  GROUP BY content_id
) imp ON a.id = imp.content_id
LEFT JOIN (
  SELECT content_id, COUNT(*) AS click_count
  FROM clicks
  WHERE content_type = 'animal'
  GROUP BY content_id
) clk ON a.id = clk.content_id;

GRANT SELECT ON public.animals_with_stats TO anon, authenticated;

COMMENT ON VIEW public.animals_with_stats IS
  'Animais com estatísticas e dados do proprietário. Oculta animais cujo owner esteja suspenso ou inativo (migração 115).';


-- =============================================================================
-- 2) events_with_stats — filtrar por organizer suspenso/inativo
-- =============================================================================
-- Recriado mantendo security_invoker = true (migração 113). O JOIN é feito
-- contra a view public_profiles, que já exclui suspensos/inativos — e agora
-- usamos INNER JOIN para que o evento suma junto quando o organizador é
-- suspenso.

DROP VIEW IF EXISTS public.events_with_stats CASCADE;

CREATE VIEW public.events_with_stats
WITH (security_invoker = true)
AS
SELECT
  e.*,
  COALESCE(p.property_name, p.name, 'Usuário') AS organizer_name,
  p.public_code                                 AS organizer_public_code,
  p.account_type                                AS organizer_account_type,
  COALESCE(imp.impression_count, 0) AS impressions,
  COALESCE(clk.click_count, 0)      AS clicks,
  CASE
    WHEN COALESCE(imp.impression_count, 0) > 0
    THEN ROUND(COALESCE(clk.click_count, 0)::NUMERIC / imp.impression_count::NUMERIC * 100, 2)
    ELSE 0
  END AS ctr
FROM events e
INNER JOIN public_profiles p ON e.organizer_id = p.id
LEFT JOIN (
  SELECT content_id, COUNT(*) AS impression_count
  FROM impressions
  WHERE content_type = 'event'
  GROUP BY content_id
) imp ON e.id = imp.content_id
LEFT JOIN (
  SELECT content_id, COUNT(*) AS click_count
  FROM clicks
  WHERE content_type = 'event'
  GROUP BY content_id
) clk ON e.id = clk.content_id;

GRANT SELECT ON public.events_with_stats TO anon, authenticated;

COMMENT ON VIEW public.events_with_stats IS
  'Eventos com estatísticas. INNER JOIN em public_profiles — oculta eventos cujo organizer esteja suspenso/inativo (migração 115).';


-- =============================================================================
-- 3) get_featured_animals_rotated_fast — filtrar por owner suspenso/inativo
-- =============================================================================
-- Também ocultamos animais de usuários suspensos do carrossel de destaques
-- (home). Mantém a mesma assinatura da migração 106.

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
    -- Contar total de animais impulsionados ativos (e cujo dono NÃO está suspenso)
    SELECT COUNT(*) INTO v_total_boosted
    FROM animals a
    JOIN profiles p ON p.id = a.owner_id
    WHERE a.is_boosted = TRUE
      AND a.boost_expires_at IS NOT NULL
      AND a.boost_expires_at > NOW()
      AND a.ad_status = 'active'
      AND p.is_active = true
      AND p.is_suspended = false;

    IF v_total_boosted = 0 THEN
        RETURN;
    END IF;

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
        JOIN profiles op
          ON op.id = a.owner_id
          AND op.is_active = true
          AND op.is_suspended = false
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

COMMIT;

-- =============================================================================
-- VALIDAÇÃO (rode separadamente após aplicar)
-- =============================================================================
-- SELECT COUNT(*) FROM animals_with_stats;      -- não deve trazer suspensos
-- SELECT COUNT(*) FROM events_with_stats;       -- não deve trazer suspensos
-- SELECT * FROM get_featured_animals_rotated_fast(10);
