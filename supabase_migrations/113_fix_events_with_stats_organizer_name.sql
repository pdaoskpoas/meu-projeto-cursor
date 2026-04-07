-- =====================================================
-- Migration 113: Fix events_with_stats organizer name fallback
-- Descrição: Troca JOIN de profiles → public_profiles (migration 099
--            bloqueou leitura de profiles para anon/security_invoker),
--            garantindo que organizer_name sempre exiba o nome do publicador.
-- Data: 2026-04-07
-- =====================================================

DROP VIEW IF EXISTS events_with_stats CASCADE;

CREATE VIEW events_with_stats
WITH (security_invoker = true)
AS
SELECT
  e.*,
  -- organizer_property já existe na tabela events (migration 036); não repetir aqui.
  -- organizer_name NÃO existe na tabela events; buscar do public_profiles com fallback.
  -- public_profiles usa security_invoker=false e é acessível para anon (migration 099).
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
LEFT JOIN public_profiles p ON e.organizer_id = p.id
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

-- Permissões
GRANT SELECT ON events_with_stats TO anon, authenticated;

COMMENT ON VIEW events_with_stats IS 'Eventos com estatísticas. JOIN em public_profiles (não profiles) para compatibilidade com RLS de anon (migration 099).';

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 113: events_with_stats corrigida — JOIN em public_profiles, organizer_name sempre tem valor.';
END $$;
