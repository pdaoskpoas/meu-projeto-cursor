-- =====================================================
-- MIGRATION 091: Sistema de Ranking Histórico Mensal
-- Data: 2026-02-10
-- Descrição: Cria função para buscar rankings mensais históricos
--            de animais mais visualizados por categoria
-- =====================================================

-- Função para buscar ranking mensal histórico
-- Retorna o animal mais visualizado de cada categoria por mês/ano
CREATE OR REPLACE FUNCTION get_monthly_ranking_history(
    p_year INTEGER DEFAULT NULL
)
RETURNS TABLE (
    year INTEGER,
    month INTEGER,
    month_name TEXT,
    category TEXT,
    animal_id UUID,
    animal_name TEXT,
    animal_images JSONB,
    views_count BIGINT,
    ad_status TEXT
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
        WHERE i.content_type = 'animal'
            -- Excluir o mês atual - apenas mostrar meses finalizados
            AND DATE_TRUNC('month', i.created_at) < DATE_TRUNC('month', NOW())
        GROUP BY DATE_TRUNC('month', i.created_at)::DATE, i.content_id
    ),
    ranked_animals AS (
        SELECT 
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
            a.category,
            a.id as animal_id,
            a.name as animal_name,
            COALESCE(a.images, '[]'::jsonb) as animal_images,
            mi.views as views_count,
            COALESCE(a.ad_status, 'inactive') as ad_status,
            ROW_NUMBER() OVER (
                PARTITION BY 
                    EXTRACT(YEAR FROM mi.impression_month),
                    EXTRACT(MONTH FROM mi.impression_month),
                    a.category
                ORDER BY mi.views DESC, COALESCE(a.published_at, a.created_at) DESC
            ) as rank
        FROM monthly_impressions mi
        INNER JOIN animals a ON a.id = mi.content_id
        WHERE a.category IN ('Garanhão', 'Doadora', 'Potro', 'Potra')
            AND (p_year IS NULL OR EXTRACT(YEAR FROM mi.impression_month) = p_year)
    )
    SELECT 
        ra.year,
        ra.month,
        TRIM(ra.month_name) as month_name,
        ra.category,
        ra.animal_id,
        ra.animal_name,
        ra.animal_images,
        ra.views_count,
        ra.ad_status
    FROM ranked_animals ra
    WHERE ra.rank = 1
    ORDER BY ra.year DESC, ra.month DESC, ra.category;
END;
$$;

-- Conceder permissões
GRANT EXECUTE ON FUNCTION get_monthly_ranking_history(INTEGER) TO authenticated, anon;

COMMENT ON FUNCTION get_monthly_ranking_history IS 
'Retorna ranking histórico mensal de animais mais visualizados por categoria.
Funciona independente do status atual do anúncio (ativo, pausado ou excluído).
Parâmetro p_year: filtra por ano específico (NULL = todos os anos)';

-- Função auxiliar para obter anos disponíveis no histórico
-- Retorna apenas anos que têm animais cadastrados no ranking (com impressões e categorias válidas)
CREATE OR REPLACE FUNCTION get_available_ranking_years()
RETURNS TABLE (year INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    WITH monthly_impressions AS (
        SELECT 
            DATE_TRUNC('month', i.created_at)::DATE as impression_month,
            i.content_id
        FROM impressions i
        WHERE i.content_type = 'animal'
            -- Excluir o mês atual - apenas mostrar meses finalizados
            AND DATE_TRUNC('month', i.created_at) < DATE_TRUNC('month', NOW())
    ),
    valid_rankings AS (
        SELECT DISTINCT
            EXTRACT(YEAR FROM mi.impression_month)::INTEGER as year
        FROM monthly_impressions mi
        INNER JOIN animals a ON a.id = mi.content_id
        WHERE a.category IN ('Garanhão', 'Doadora', 'Potro', 'Potra')
    )
    SELECT year
    FROM valid_rankings
    ORDER BY year DESC;
END;
$$;

-- Conceder permissões
GRANT EXECUTE ON FUNCTION get_available_ranking_years() TO authenticated, anon;

COMMENT ON FUNCTION get_available_ranking_years IS 
'Retorna lista de anos disponíveis no histórico de rankings mensais';
