-- =====================================================
-- CORREÇÃO DE SEGURANÇA CRÍTICA
-- Remover SECURITY DEFINER de Views
-- Tempo estimado: 15 minutos (executar no Supabase Dashboard)
-- =====================================================

-- INSTRUÇÕES:
-- 1. Acesse: https://supabase.com/dashboard/project/SEU_PROJETO/sql/new
-- 2. Cole este SQL completo
-- 3. Execute
-- 4. Verifique se não há erros

BEGIN;

-- =====================================================
-- VIEW 1/6: search_animals
-- =====================================================

DROP VIEW IF EXISTS public.search_animals CASCADE;

CREATE VIEW public.search_animals
WITH (security_invoker = true)
AS
SELECT 
  a.id,
  a.name,
  a.breed,
  a.gender,
  a.birth_date,
  a.coat,
  a.current_city,
  a.current_state,
  p.name AS owner_name,
  p.property_name,
  a.is_boosted,
  COALESCE(imp.impression_count, 0) AS impression_count,
  COALESCE(clk.click_count, 0) AS click_count,
  CASE
    WHEN COALESCE(imp.impression_count, 0) > 0 
    THEN ROUND(COALESCE(clk.click_count, 0)::NUMERIC / imp.impression_count::NUMERIC * 100, 2)
    ELSE 0
  END AS click_rate,
  a.published_at,
  a.images
FROM animals a
JOIN profiles p ON a.owner_id = p.id
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
) clk ON a.id = clk.content_id
WHERE a.ad_status = 'active'
ORDER BY a.is_boosted DESC, clk.click_count DESC, a.published_at DESC;

GRANT SELECT ON public.search_animals TO anon, authenticated;

COMMENT ON VIEW public.search_animals IS 'Busca otimizada de animais ativos - ✅ Corrigido: security_invoker';

-- =====================================================
-- VIEW 2/6: animals_ranking
-- =====================================================

DROP VIEW IF EXISTS public.animals_ranking CASCADE;

CREATE VIEW public.animals_ranking
WITH (security_invoker = true)
AS
SELECT 
  a.id,
  a.name,
  a.breed,
  a.gender,
  a.birth_date,
  a.current_city,
  a.current_state,
  p.property_name AS haras_name,
  a.is_boosted,
  COALESCE(imp.impression_count, 0) AS views,
  COALESCE(clk.click_count, 0) AS clicks,
  (COALESCE(imp.impression_count, 0) * 1 + COALESCE(clk.click_count, 0) * 3) AS ranking_score,
  a.published_at,
  a.images
FROM animals a
JOIN profiles p ON a.owner_id = p.id
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
) clk ON a.id = clk.content_id
WHERE a.ad_status = 'active'
ORDER BY ranking_score DESC, a.is_boosted DESC, a.published_at DESC;

GRANT SELECT ON public.animals_ranking TO anon, authenticated;

COMMENT ON VIEW public.animals_ranking IS 'Ranking de animais por popularidade - ✅ Corrigido: security_invoker';

-- =====================================================
-- VIEW 3/6: animals_with_stats
-- =====================================================

DROP VIEW IF EXISTS public.animals_with_stats CASCADE;

CREATE VIEW public.animals_with_stats
WITH (security_invoker = true)
AS
SELECT 
  a.*,
  p.name AS owner_name,
  p.property_name,
  p.public_code AS owner_public_code,
  COALESCE(imp.impression_count, 0) AS impressions,
  COALESCE(clk.click_count, 0) AS clicks,
  CASE
    WHEN COALESCE(imp.impression_count, 0) > 0 
    THEN ROUND(COALESCE(clk.click_count, 0)::NUMERIC / imp.impression_count::NUMERIC * 100, 2)
    ELSE 0
  END AS ctr
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

COMMENT ON VIEW public.animals_with_stats IS 'Animais com estatísticas - ✅ Corrigido: security_invoker';

-- =====================================================
-- VIEW 4/6: events_with_stats
-- =====================================================

DROP VIEW IF EXISTS public.events_with_stats CASCADE;

CREATE VIEW public.events_with_stats
WITH (security_invoker = true)
AS
SELECT 
  e.*,
  p.name AS organizer_name,
  p.property_name,
  COALESCE(imp.impression_count, 0) AS impressions,
  COALESCE(clk.click_count, 0) AS clicks,
  CASE
    WHEN COALESCE(imp.impression_count, 0) > 0 
    THEN ROUND(COALESCE(clk.click_count, 0)::NUMERIC / imp.impression_count::NUMERIC * 100, 2)
    ELSE 0
  END AS ctr
FROM events e
LEFT JOIN profiles p ON e.organizer_id = p.id
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

COMMENT ON VIEW public.events_with_stats IS 'Eventos com estatísticas - ✅ Corrigido: security_invoker';

-- =====================================================
-- VIEW 5/6: articles_with_stats
-- =====================================================

DROP VIEW IF EXISTS public.articles_with_stats CASCADE;

CREATE VIEW public.articles_with_stats
WITH (security_invoker = true)
AS
SELECT 
  a.*,
  p.name AS author_name,
  COALESCE(imp.impression_count, 0) AS impressions,
  COALESCE(clk.click_count, 0) AS clicks,
  CASE
    WHEN COALESCE(imp.impression_count, 0) > 0 
    THEN ROUND(COALESCE(clk.click_count, 0)::NUMERIC / imp.impression_count::NUMERIC * 100, 2)
    ELSE 0
  END AS ctr
FROM articles a
LEFT JOIN profiles p ON a.author_id = p.id
LEFT JOIN (
  SELECT content_id, COUNT(*) AS impression_count
  FROM impressions
  WHERE content_type = 'article'
  GROUP BY content_id
) imp ON a.id = imp.content_id
LEFT JOIN (
  SELECT content_id, COUNT(*) AS click_count
  FROM clicks
  WHERE content_type = 'article'
  GROUP BY content_id
) clk ON a.id = clk.content_id;

GRANT SELECT ON public.articles_with_stats TO anon, authenticated;

COMMENT ON VIEW public.articles_with_stats IS 'Artigos com estatísticas - ✅ Corrigido: security_invoker';

-- =====================================================
-- VIEW 6/6: user_dashboard_stats
-- =====================================================

DROP VIEW IF EXISTS public.user_dashboard_stats CASCADE;

CREATE VIEW public.user_dashboard_stats
WITH (security_invoker = true)
AS
SELECT 
  p.id AS user_id,
  p.name,
  p.property_name,
  p.plan,
  p.available_boosts,
  COUNT(DISTINCT a.id) AS total_animals,
  COUNT(DISTINCT CASE WHEN a.ad_status = 'active' THEN a.id END) AS active_animals,
  COUNT(DISTINCT CASE WHEN a.is_boosted THEN a.id END) AS boosted_animals,
  COALESCE(SUM(imp.impression_count), 0) AS total_impressions,
  COALESCE(SUM(clk.click_count), 0) AS total_clicks,
  CASE
    WHEN COALESCE(SUM(imp.impression_count), 0) > 0 
    THEN ROUND(COALESCE(SUM(clk.click_count), 0)::NUMERIC / SUM(imp.impression_count)::NUMERIC * 100, 2)
    ELSE 0
  END AS overall_ctr
FROM profiles p
LEFT JOIN animals a ON p.id = a.owner_id
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
) clk ON a.id = clk.content_id
GROUP BY p.id, p.name, p.property_name, p.plan, p.available_boosts;

GRANT SELECT ON public.user_dashboard_stats TO authenticated;

COMMENT ON VIEW public.user_dashboard_stats IS 'Estatísticas do dashboard do usuário - ✅ Corrigido: security_invoker';

-- =====================================================
-- VALIDAÇÃO
-- =====================================================

-- Verificar que todas as views foram criadas
DO $$
DECLARE
  view_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO view_count
  FROM information_schema.views
  WHERE table_schema = 'public'
  AND table_name IN (
    'search_animals',
    'animals_ranking',
    'animals_with_stats',
    'events_with_stats',
    'articles_with_stats',
    'user_dashboard_stats'
  );
  
  IF view_count = 6 THEN
    RAISE NOTICE '✅ Todas as 6 views foram recriadas com sucesso!';
  ELSE
    RAISE EXCEPTION '❌ Erro: Apenas % views foram criadas. Esperado: 6', view_count;
  END IF;
END $$;

COMMIT;

-- =====================================================
-- TESTE FINAL
-- =====================================================

-- Testar que as views funcionam
SELECT 'search_animals' AS view_name, COUNT(*) AS records FROM search_animals
UNION ALL
SELECT 'animals_ranking', COUNT(*) FROM animals_ranking
UNION ALL
SELECT 'animals_with_stats', COUNT(*) FROM animals_with_stats
UNION ALL
SELECT 'events_with_stats', COUNT(*) FROM events_with_stats
UNION ALL
SELECT 'articles_with_stats', COUNT(*) FROM articles_with_stats
UNION ALL
SELECT 'user_dashboard_stats', COUNT(*) FROM user_dashboard_stats;

-- =====================================================
-- RESULTADO ESPERADO
-- =====================================================
-- ✅ 6 views recriadas com security_invoker = true
-- ✅ Vulnerabilidade de SECURITY DEFINER eliminada
-- ✅ RLS policies dos usuários agora são respeitadas
-- ✅ Sem erro de escalação de privilégios
-- =====================================================

