-- =====================================================
-- MIGRAÇÃO 105: Corrigir security_invoker da view animals_with_stats
-- Data: 28/03/2026
-- Descrição: A migração 104 recriou a view com security_invoker = true,
-- o que faz a RLS da tabela profiles bloquear o LEFT JOIN.
-- Resultado: todas as colunas do proprietário (owner_name, owner_account_type,
-- owner_property_name) retornam NULL para usuários anônimos/autenticados,
-- causando "Proprietário não informado" em todos os cards.
--
-- Correção: Recriar a view SEM security_invoker (default = false),
-- para que o JOIN com profiles funcione como antes.
-- =====================================================

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

COMMENT ON VIEW public.animals_with_stats IS 'Animais com estatísticas e dados do proprietário - SEM security_invoker para permitir JOIN com profiles';

-- Log de auditoria
INSERT INTO public.system_logs (operation, details)
VALUES (
  'migration_105_fix_security_invoker',
  jsonb_build_object(
    'timestamp', now(),
    'reason', 'Removido security_invoker=true que bloqueava JOIN com profiles via RLS',
    'fix', 'View recriada sem security_invoker (default=false)'
  )
);
