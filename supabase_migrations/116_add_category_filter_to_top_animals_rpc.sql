-- =====================================================
-- MIGRAÇÃO 116: Filtro de categoria no ranking mensal de animais
-- Data: 2026-04-11
-- Descrição:
--   A RPC get_top_animals_by_impressions (migração 114) filtra apenas
--   por gênero. Isso é suficiente para o Hero ("macho mais visto do
--   mês"), mas quebra os carrosséis "Top Garanhões do Mês" e "Top
--   Doadoras do Mês": um potro/castrado ou potra/matriz aparecia sob
--   o rótulo de garanhão/doadora.
--
--   Adiciona parâmetro opcional p_category para filtrar por
--   animals.category (Garanhão, Castrado, Potro, Doadora, Matriz,
--   Potra, Outro). O filtro acontece no DB para que o LIMIT seja
--   aplicado DEPOIS do filtro — caso contrário, um pedido de 10
--   garanhões poderia voltar com 3 porque os outros 7 slots foram
--   consumidos por castrados/potros.
--
--   Compatibilidade: chamadas existentes sem p_category continuam
--   funcionando (default NULL = nenhum filtro de categoria).
-- =====================================================

BEGIN;

DROP FUNCTION IF EXISTS public.get_top_animals_by_impressions(TEXT, INTEGER);

CREATE OR REPLACE FUNCTION public.get_top_animals_by_impressions(
  p_gender TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 10,
  p_category TEXT DEFAULT NULL
)
RETURNS TABLE (
  animal_id UUID,
  impressions BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_start_of_month TIMESTAMPTZ;
BEGIN
  v_start_of_month := date_trunc('month', now());

  RETURN QUERY
  SELECT
    i.content_id AS animal_id,
    COUNT(*) AS impressions
  FROM impressions i
  INNER JOIN animals a ON a.id = i.content_id
  WHERE i.content_type = 'animal'
    AND i.created_at >= v_start_of_month
    AND a.ad_status = 'active'
    AND (p_gender IS NULL OR a.gender = p_gender)
    AND (p_category IS NULL OR a.category = p_category)
  GROUP BY i.content_id
  ORDER BY impressions DESC
  LIMIT p_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_top_animals_by_impressions(TEXT, INTEGER, TEXT)
  TO anon, authenticated;

COMMENT ON FUNCTION public.get_top_animals_by_impressions(TEXT, INTEGER, TEXT) IS
  'Retorna ranking mensal de animais por impressões. Filtra opcionalmente por gênero (Macho/Fêmea) e categoria (Garanhão, Castrado, Doadora, Matriz, Potro, Potra, Outro). SECURITY DEFINER para bypassar RLS de impressions.';

COMMIT;

-- =============================================================================
-- VALIDAÇÃO (rode separadamente após aplicar)
-- =============================================================================
-- SELECT * FROM get_top_animals_by_impressions('Macho', 10, 'Garanhão');
-- SELECT * FROM get_top_animals_by_impressions('Fêmea', 10, 'Doadora');
-- SELECT * FROM get_top_animals_by_impressions('Macho', 10); -- sem categoria (Hero)
