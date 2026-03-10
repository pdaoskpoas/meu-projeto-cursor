-- =====================================================
-- CORREÇÕES URGENTES - PÁGINA HOME
-- Data: 17/11/2025
-- Prioridade: ALTA
-- =====================================================

-- =====================================================
-- CORREÇÃO 1: ÍNDICE COMPOSTO PARA QUERIES MENSAIS
-- Melhora drasticamente performance de ranking mensal
-- =====================================================

-- Criar índice para otimizar queries de cliques por mês
CREATE INDEX IF NOT EXISTS idx_clicks_content_type_date 
ON clicks(content_type, created_at DESC) 
WHERE content_type = 'animal';

-- Criar índice adicional para filtros por gender
CREATE INDEX IF NOT EXISTS idx_animals_gender_status 
ON animals(gender, ad_status) 
WHERE ad_status = 'active';

COMMENT ON INDEX idx_clicks_content_type_date IS 
'Otimiza queries de ranking mensal (garanhões e doadoras mais buscados do mês)';

-- =====================================================
-- CORREÇÃO 2: FUNÇÃO SQL PARA RANKING MENSAL
-- Elimina necessidade de trazer todos os cliques para o cliente
-- =====================================================

-- Criar função para obter top animais por gênero do mês
CREATE OR REPLACE FUNCTION get_top_animals_by_gender_month(
    p_gender TEXT,
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
    haras_name TEXT,
    property_name TEXT,
    images JSONB,
    titles TEXT[],
    clicks_month BIGINT,
    impressions BIGINT,
    clicks_total BIGINT,
    published_at TIMESTAMP WITH TIME ZONE,
    ad_status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_start_of_month TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Calcular início do mês atual
    v_start_of_month := DATE_TRUNC('month', NOW());
    
    RETURN QUERY
    SELECT 
        a.id,
        a.name,
        a.breed,
        a.gender,
        a.birth_date,
        a.coat,
        a.current_city,
        a.current_state,
        p.name AS haras_name,
        p.property_name,
        a.images,
        a.titles,
        COUNT(c_month.id) AS clicks_month,
        COALESCE(stats.impression_count, 0) AS impressions,
        COALESCE(stats.clicks, 0) AS clicks_total,
        a.published_at,
        a.ad_status
    FROM animals a
    JOIN profiles p ON a.owner_id = p.id
    LEFT JOIN clicks c_month ON c_month.content_id = a.id 
        AND c_month.content_type = 'animal'
        AND c_month.created_at >= v_start_of_month
    LEFT JOIN animals_with_stats stats ON a.id = stats.id
    WHERE a.ad_status = 'active'
        AND a.gender = p_gender
    GROUP BY 
        a.id, a.name, a.breed, a.gender, a.birth_date, a.coat,
        a.current_city, a.current_state, a.images, a.titles,
        a.published_at, a.ad_status,
        p.name, p.property_name,
        stats.impression_count, stats.clicks
    ORDER BY clicks_month DESC
    LIMIT p_limit;
END;
$$;

COMMENT ON FUNCTION get_top_animals_by_gender_month IS 
'Retorna top N animais por gênero com mais cliques no mês atual.
Performance otimizada: query executada no servidor, não no cliente.';

-- Conceder permissões
GRANT EXECUTE ON FUNCTION get_top_animals_by_gender_month TO authenticated, anon;

-- =====================================================
-- CORREÇÃO 3: MATERIALIZAR VIEW animals_with_stats
-- Melhora performance de todas as queries que usam estatísticas
-- =====================================================

-- Backup da view atual
CREATE OR REPLACE VIEW animals_with_stats_old AS
SELECT * FROM animals_with_stats;

-- Dropar view atual
DROP VIEW IF EXISTS animals_with_stats CASCADE;

-- Criar materialized view
CREATE MATERIALIZED VIEW animals_with_stats AS
SELECT 
    a.*,
    COALESCE(imp.impression_count, 0) as impression_count,
    COALESCE(cl.click_count, 0) as clicks,
    CASE 
        WHEN COALESCE(imp.impression_count, 0) > 0 
        THEN ROUND((COALESCE(cl.click_count, 0)::DECIMAL / imp.impression_count) * 100, 2)
        ELSE 0 
    END as click_rate,
    p.name as owner_name,
    p.public_code as owner_public_code,
    p.account_type as owner_account_type,
    p.property_name as property_name,
    p.full_name as owner_full_name
FROM animals a
LEFT JOIN profiles p ON a.owner_id = p.id
LEFT JOIN (
    SELECT 
        content_id, 
        COUNT(*) as impression_count
    FROM impressions 
    WHERE content_type = 'animal'
    GROUP BY content_id
) imp ON a.id = imp.content_id
LEFT JOIN (
    SELECT 
        content_id, 
        COUNT(*) as click_count
    FROM clicks 
    WHERE content_type = 'animal'
    GROUP BY content_id
) cl ON a.id = cl.content_id;

-- Criar índices na materialized view
CREATE UNIQUE INDEX ON animals_with_stats(id);
CREATE INDEX idx_mv_animals_stats_clicks ON animals_with_stats(clicks DESC);
CREATE INDEX idx_mv_animals_stats_impressions ON animals_with_stats(impression_count DESC);
CREATE INDEX idx_mv_animals_stats_status ON animals_with_stats(ad_status);
CREATE INDEX idx_mv_animals_stats_published ON animals_with_stats(published_at DESC);
CREATE INDEX idx_mv_animals_stats_gender ON animals_with_stats(gender);

COMMENT ON MATERIALIZED VIEW animals_with_stats IS 
'View materializada de animais com estatísticas de impressões e cliques.
Refresh automático a cada 5 minutos via cron job.';

-- =====================================================
-- CORREÇÃO 4: CRON JOB PARA REFRESH DA MATERIALIZED VIEW
-- =====================================================

-- Remover job anterior se existir
DO $$
BEGIN
    PERFORM cron.unschedule('refresh-animals-stats');
EXCEPTION
    WHEN OTHERS THEN
        NULL;
END $$;

-- Agendar refresh a cada 5 minutos
SELECT cron.schedule(
    'refresh-animals-stats',
    '*/5 * * * *',
    $$REFRESH MATERIALIZED VIEW CONCURRENTLY animals_with_stats;$$
);

-- =====================================================
-- CORREÇÃO 5: CONCEDER PERMISSÕES
-- =====================================================

GRANT SELECT ON animals_with_stats TO authenticated, anon;

-- =====================================================
-- TESTES DE VALIDAÇÃO
-- =====================================================

-- Teste 1: Verificar se índices foram criados
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename IN ('clicks', 'animals', 'animals_with_stats')
    AND indexname LIKE '%idx_%'
ORDER BY tablename, indexname;

-- Teste 2: Testar função de ranking mensal
SELECT * FROM get_top_animals_by_gender_month('Macho', 10);
SELECT * FROM get_top_animals_by_gender_month('Fêmea', 10);

-- Teste 3: Verificar materialized view
SELECT COUNT(*) AS total_animals, 
       SUM(CASE WHEN clicks > 0 THEN 1 ELSE 0 END) AS with_clicks,
       SUM(CASE WHEN impression_count > 0 THEN 1 ELSE 0 END) AS with_impressions
FROM animals_with_stats;

-- Teste 4: Verificar cron job
SELECT 
    jobname,
    schedule,
    active,
    command
FROM cron.job
WHERE jobname IN ('expire-boosts-every-5min', 'refresh-animals-stats')
ORDER BY jobname;

-- Teste 5: Comparar performance (executar EXPLAIN ANALYZE)
EXPLAIN ANALYZE
SELECT * FROM animals_with_stats
WHERE ad_status = 'active'
ORDER BY clicks DESC
LIMIT 10;

-- =====================================================
-- ROLLBACK (se necessário)
-- =====================================================

-- Para reverter as mudanças, execute:
/*
-- 1. Dropar materialized view
DROP MATERIALIZED VIEW IF EXISTS animals_with_stats CASCADE;

-- 2. Recriar view original
CREATE VIEW animals_with_stats AS
SELECT * FROM animals_with_stats_old;

-- 3. Remover cron job
SELECT cron.unschedule('refresh-animals-stats');

-- 4. Dropar função
DROP FUNCTION IF EXISTS get_top_animals_by_gender_month;

-- 5. Dropar índices
DROP INDEX IF EXISTS idx_clicks_content_type_date;
DROP INDEX IF EXISTS idx_animals_gender_status;
*/

-- =====================================================
-- FIM DAS CORREÇÕES
-- =====================================================

-- Executar refresh manual inicial
REFRESH MATERIALIZED VIEW animals_with_stats;

SELECT 'Correções aplicadas com sucesso!' AS status;

