-- =====================================================
-- Migration 035 (PARCIAL): Completar Analytics de Eventos
-- Descrição: Criar apenas as views e função que estão faltando
-- Data: 2025-11-03
-- =====================================================

-- IMPORTANTE: A view events_with_stats JÁ EXISTE, então vamos criar apenas o que falta!

-- =====================================================
-- VIEW: events_ranking
-- Descrição: Ranking de eventos por popularidade
-- =====================================================

DROP VIEW IF EXISTS events_ranking CASCADE;

CREATE VIEW events_ranking
WITH (security_invoker = true)
AS
SELECT 
  e.id,
  e.title,
  e.event_type,
  e.start_date,
  e.end_date,
  e.city,
  e.state,
  e.location,
  p.property_name AS organizer_property,
  e.is_boosted,
  COALESCE(imp.impression_count, 0) AS views,
  COALESCE(clk.click_count, 0) AS clicks,
  -- Fórmula de ranking: impressões * 1 + cliques * 3 + boost
  (COALESCE(imp.impression_count, 0) * 1 + COALESCE(clk.click_count, 0) * 3 + CASE WHEN e.is_boosted THEN 1000 ELSE 0 END) AS ranking_score,
  e.published_at,
  e.cover_image_url
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
) clk ON e.id = clk.content_id
WHERE e.ad_status = 'active'
ORDER BY ranking_score DESC, e.is_boosted DESC, e.published_at DESC;

-- Permissões
GRANT SELECT ON events_ranking TO anon, authenticated;

-- Comentário
COMMENT ON VIEW events_ranking IS 'Ranking de eventos por popularidade (impressões + cliques + boost)';

-- =====================================================
-- VIEW: admin_events_analytics
-- Descrição: Analytics detalhados de eventos para o painel admin
-- =====================================================

DROP VIEW IF EXISTS admin_events_analytics CASCADE;

CREATE VIEW admin_events_analytics
WITH (security_invoker = true)
AS
SELECT 
  e.id,
  e.title,
  e.event_type,
  e.start_date,
  e.city,
  e.state,
  e.ad_status,
  e.is_boosted,
  p.name AS organizer_name,
  p.property_name AS organizer_property,
  p.email AS organizer_email,
  p.account_type AS organizer_account_type,
  COALESCE(imp.impression_count, 0) AS total_impressions,
  COALESCE(clk.click_count, 0) AS total_clicks,
  CASE
    WHEN COALESCE(imp.impression_count, 0) > 0 
    THEN ROUND(COALESCE(clk.click_count, 0)::NUMERIC / imp.impression_count::NUMERIC * 100, 2)
    ELSE 0
  END AS ctr,
  -- Impressões dos últimos 7 dias
  COALESCE(imp_7d.impression_count, 0) AS impressions_last_7_days,
  -- Cliques dos últimos 7 dias
  COALESCE(clk_7d.click_count, 0) AS clicks_last_7_days,
  -- Impressões dos últimos 30 dias
  COALESCE(imp_30d.impression_count, 0) AS impressions_last_30_days,
  -- Cliques dos últimos 30 dias
  COALESCE(clk_30d.click_count, 0) AS clicks_last_30_days,
  e.published_at,
  e.created_at,
  e.updated_at
FROM events e
LEFT JOIN profiles p ON e.organizer_id = p.id
-- Impressões totais
LEFT JOIN (
  SELECT content_id, COUNT(*) AS impression_count
  FROM impressions
  WHERE content_type = 'event'
  GROUP BY content_id
) imp ON e.id = imp.content_id
-- Cliques totais
LEFT JOIN (
  SELECT content_id, COUNT(*) AS click_count
  FROM clicks
  WHERE content_type = 'event'
  GROUP BY content_id
) clk ON e.id = clk.content_id
-- Impressões últimos 7 dias
LEFT JOIN (
  SELECT content_id, COUNT(*) AS impression_count
  FROM impressions
  WHERE content_type = 'event'
    AND created_at >= NOW() - INTERVAL '7 days'
  GROUP BY content_id
) imp_7d ON e.id = imp_7d.content_id
-- Cliques últimos 7 dias
LEFT JOIN (
  SELECT content_id, COUNT(*) AS click_count
  FROM clicks
  WHERE content_type = 'event'
    AND created_at >= NOW() - INTERVAL '7 days'
  GROUP BY content_id
) clk_7d ON e.id = clk_7d.content_id
-- Impressões últimos 30 dias
LEFT JOIN (
  SELECT content_id, COUNT(*) AS impression_count
  FROM impressions
  WHERE content_type = 'event'
    AND created_at >= NOW() - INTERVAL '30 days'
  GROUP BY content_id
) imp_30d ON e.id = imp_30d.content_id
-- Cliques últimos 30 dias
LEFT JOIN (
  SELECT content_id, COUNT(*) AS click_count
  FROM clicks
  WHERE content_type = 'event'
    AND created_at >= NOW() - INTERVAL '30 days'
  GROUP BY content_id
) clk_30d ON e.id = clk_30d.content_id
ORDER BY total_impressions DESC, total_clicks DESC;

-- Permissões (apenas para authenticated - será verificado no admin)
GRANT SELECT ON admin_events_analytics TO authenticated;

-- Comentário
COMMENT ON VIEW admin_events_analytics IS 'Analytics detalhados de eventos para o painel administrativo';

-- =====================================================
-- FUNÇÃO: get_event_analytics_summary
-- Descrição: Retorna resumo geral de analytics de eventos
-- =====================================================

CREATE OR REPLACE FUNCTION get_event_analytics_summary()
RETURNS TABLE (
  total_events BIGINT,
  active_events BIGINT,
  boosted_events BIGINT,
  total_impressions BIGINT,
  total_clicks BIGINT,
  avg_ctr NUMERIC,
  impressions_today BIGINT,
  clicks_today BIGINT,
  impressions_this_week BIGINT,
  clicks_this_week BIGINT,
  impressions_this_month BIGINT,
  clicks_this_month BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(DISTINCT e.id) AS total_events,
    COUNT(DISTINCT e.id) FILTER (WHERE e.ad_status = 'active') AS active_events,
    COUNT(DISTINCT e.id) FILTER (WHERE e.is_boosted = TRUE) AS boosted_events,
    COALESCE(SUM(COALESCE(imp.impression_count, 0)), 0) AS total_impressions,
    COALESCE(SUM(COALESCE(clk.click_count, 0)), 0) AS total_clicks,
    CASE 
      WHEN COALESCE(SUM(COALESCE(imp.impression_count, 0)), 0) > 0 
      THEN ROUND(COALESCE(SUM(COALESCE(clk.click_count, 0)), 0)::NUMERIC / SUM(COALESCE(imp.impression_count, 0))::NUMERIC * 100, 2)
      ELSE 0
    END AS avg_ctr,
    -- Hoje
    COALESCE((SELECT COUNT(*) FROM impressions WHERE content_type = 'event' AND created_at >= CURRENT_DATE), 0) AS impressions_today,
    COALESCE((SELECT COUNT(*) FROM clicks WHERE content_type = 'event' AND created_at >= CURRENT_DATE), 0) AS clicks_today,
    -- Esta semana
    COALESCE((SELECT COUNT(*) FROM impressions WHERE content_type = 'event' AND created_at >= DATE_TRUNC('week', CURRENT_DATE)), 0) AS impressions_this_week,
    COALESCE((SELECT COUNT(*) FROM clicks WHERE content_type = 'event' AND created_at >= DATE_TRUNC('week', CURRENT_DATE)), 0) AS clicks_this_week,
    -- Este mês
    COALESCE((SELECT COUNT(*) FROM impressions WHERE content_type = 'event' AND created_at >= DATE_TRUNC('month', CURRENT_DATE)), 0) AS impressions_this_month,
    COALESCE((SELECT COUNT(*) FROM clicks WHERE content_type = 'event' AND created_at >= DATE_TRUNC('month', CURRENT_DATE)), 0) AS clicks_this_month
  FROM events e
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
END;
$$;

-- Permissões
GRANT EXECUTE ON FUNCTION get_event_analytics_summary() TO authenticated;

-- Comentário
COMMENT ON FUNCTION get_event_analytics_summary() IS 'Retorna resumo agregado de analytics de eventos do sistema';

-- =====================================================
-- Log de sucesso
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Views e função de analytics para eventos criadas com sucesso!';
  RAISE NOTICE '📊 Sistema de analytics de eventos está 100%% operacional!';
END $$;


