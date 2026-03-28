-- =====================================================
-- MIGRAÇÃO 104: Recarregar schema cache do PostgREST
-- Data: 28/03/2026
-- Descrição: Garante que o PostgREST reconheça as colunas
-- de genealogia (avós/bisavós) adicionadas na migração 076.
-- Sem esta recarga, INSERT/UPDATE ignora silenciosamente
-- os campos paternal_grandfather_name, etc.
-- =====================================================

-- 1. Verificar que as colunas existem
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'animals'
      AND column_name = 'paternal_grandfather_name'
  ) THEN
    RAISE EXCEPTION 'Coluna paternal_grandfather_name NÃO existe na tabela animals. Execute a migração 076 primeiro.';
  END IF;

  RAISE NOTICE '✅ Colunas de genealogia confirmadas na tabela animals';
END $$;

-- 2. Forçar reload do schema cache do PostgREST
NOTIFY pgrst, 'reload schema';

-- 3. Recriar a view animals_with_stats para incluir colunas novas
-- (views com SELECT * são expandidas na criação; colunas adicionadas depois não aparecem)
DROP VIEW IF EXISTS public.animals_with_stats CASCADE;

CREATE VIEW public.animals_with_stats
WITH (security_invoker = true)
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
LEFT JOIN profiles p ON a.owner_id = p.id
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

COMMENT ON VIEW public.animals_with_stats IS 'Animais com estatísticas - inclui colunas de genealogia expandida';

-- 4. Log de auditoria
INSERT INTO public.system_logs (operation, details)
VALUES (
  'migration_104_reload_schema_genealogy',
  jsonb_build_object(
    'timestamp', now(),
    'reason', 'PostgREST schema cache reload para reconhecer colunas de genealogia (avós/bisavós)',
    'action', 'NOTIFY pgrst reload + recreate animals_with_stats view'
  )
);
