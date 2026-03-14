-- =====================================================
-- MIGRATION 092: Sistema de Relatório de Visualizações Mensais/Anuais por Artigo
-- Data: 2025-11-19
-- Descrição: Cria função para buscar visualizações mensais e anuais de artigos
--            para relatórios detalhados no painel administrativo
-- =====================================================

-- Função para buscar visualizações mensais/anuais por artigo
-- Retorna visualizações agrupadas por mês/ano para cada artigo
CREATE OR REPLACE FUNCTION get_article_monthly_views(
    p_article_id UUID DEFAULT NULL,
    p_year INTEGER DEFAULT NULL,
    p_month INTEGER DEFAULT NULL
)
RETURNS TABLE (
    article_id UUID,
    article_title TEXT,
    year INTEGER,
    month INTEGER,
    month_name TEXT,
    views_count BIGINT,
    clicks_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    WITH monthly_impressions AS (
        SELECT 
            DATE_TRUNC('month', i.created_at)::DATE as impression_month,
            i.content_id,
            COUNT(*) as views
        FROM impressions i
        WHERE i.content_type = 'article'
            AND (p_article_id IS NULL OR i.content_id = p_article_id)
            AND (p_year IS NULL OR EXTRACT(YEAR FROM i.created_at) = p_year)
            AND (p_month IS NULL OR EXTRACT(MONTH FROM i.created_at) = p_month)
        GROUP BY DATE_TRUNC('month', i.created_at)::DATE, i.content_id
    ),
    monthly_clicks AS (
        SELECT 
            DATE_TRUNC('month', c.created_at)::DATE as click_month,
            c.content_id,
            COUNT(*) as clicks
        FROM clicks c
        WHERE c.content_type = 'article'
            AND (p_article_id IS NULL OR c.content_id = p_article_id)
            AND (p_year IS NULL OR EXTRACT(YEAR FROM c.created_at) = p_year)
            AND (p_month IS NULL OR EXTRACT(MONTH FROM c.created_at) = p_month)
        GROUP BY DATE_TRUNC('month', c.created_at)::DATE, c.content_id
    )
    SELECT 
        a.id as article_id,
        a.title as article_title,
        EXTRACT(YEAR FROM mi.impression_month)::INTEGER as year,
        EXTRACT(MONTH FROM mi.impression_month)::INTEGER as month,
        CASE EXTRACT(MONTH FROM mi.impression_month)
            WHEN 1 THEN 'Janeiro'
            WHEN 2 THEN 'Fevereiro'
            WHEN 3 THEN 'Março'
            WHEN 4 THEN 'Abril'
            WHEN 5 THEN 'Maio'
            WHEN 6 THEN 'Junho'
            WHEN 7 THEN 'Julho'
            WHEN 8 THEN 'Agosto'
            WHEN 9 THEN 'Setembro'
            WHEN 10 THEN 'Outubro'
            WHEN 11 THEN 'Novembro'
            WHEN 12 THEN 'Dezembro'
        END as month_name,
        COALESCE(mi.views, 0)::BIGINT as views_count,
        COALESCE(mc.clicks, 0)::BIGINT as clicks_count
    FROM monthly_impressions mi
    INNER JOIN articles a ON a.id = mi.content_id
    LEFT JOIN monthly_clicks mc ON mc.content_id = mi.content_id 
        AND mc.click_month = mi.impression_month
    ORDER BY 
        a.title,
        EXTRACT(YEAR FROM mi.impression_month) DESC,
        EXTRACT(MONTH FROM mi.impression_month) DESC;
END;
$$;

-- Conceder permissões
GRANT EXECUTE ON FUNCTION get_article_monthly_views(UUID, INTEGER, INTEGER) TO authenticated;

COMMENT ON FUNCTION get_article_monthly_views IS 
'Retorna visualizações e cliques mensais/anuais de artigos para relatórios detalhados.
Parâmetros:
- p_article_id: UUID do artigo (NULL = todos os artigos)
- p_year: Ano específico (NULL = todos os anos)
- p_month: Mês específico 1-12 (NULL = todos os meses)';

-- Criar índice para otimizar queries de visualizações por artigo
CREATE INDEX IF NOT EXISTS idx_impressions_article_month 
ON impressions(content_type, content_id, created_at)
WHERE content_type = 'article';

-- Criar índice para otimizar queries de cliques por artigo
CREATE INDEX IF NOT EXISTS idx_clicks_article_month 
ON clicks(content_type, content_id, created_at)
WHERE content_type = 'article';

COMMENT ON INDEX idx_impressions_article_month IS 
'Índice otimizado para queries de visualizações mensais de artigos';

COMMENT ON INDEX idx_clicks_article_month IS 
'Índice otimizado para queries de cliques mensais de artigos';
