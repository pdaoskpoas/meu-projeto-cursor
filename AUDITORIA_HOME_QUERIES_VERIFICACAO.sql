-- =====================================================
-- AUDITORIA TÉCNICA - QUERIES DE VERIFICAÇÃO
-- Página Home - Todas as Camadas
-- Data: 17/11/2025
-- =====================================================

-- =====================================================
-- CAMADA 1: ANIMAIS EM DESTAQUE (IMPULSIONADOS)
-- =====================================================

-- Verificar animais com boost ativo no momento
SELECT 
    '1. ANIMAIS IMPULSIONADOS (BOOST ATIVO)' AS categoria,
    COUNT(*) AS total,
    STRING_AGG(name, ', ') AS nomes_animais
FROM animals
WHERE is_boosted = TRUE
  AND boost_expires_at IS NOT NULL
  AND boost_expires_at > NOW()
  AND ad_status = 'active';

-- Verificar se há animais com boost expirado mas ainda marcados como boosted
SELECT 
    '1.1 ANIMAIS COM BOOST EXPIRADO (ERRO)' AS categoria,
    COUNT(*) AS total_erro,
    STRING_AGG(name || ' (expira em: ' || boost_expires_at::TEXT || ')', ', ') AS animais_com_problema
FROM animals
WHERE is_boosted = TRUE
  AND boost_expires_at IS NOT NULL
  AND boost_expires_at <= NOW()
  AND ad_status = 'active';

-- =====================================================
-- CAMADA 2: ANIMAIS MAIS BUSCADOS (CLIQUES TOTAIS)
-- =====================================================

-- Top 10 animais com mais cliques (acumulado total)
SELECT 
    '2. TOP 10 ANIMAIS MAIS BUSCADOS (CLIQUES TOTAIS)' AS categoria,
    a.name,
    a.breed,
    a.gender,
    COUNT(c.id) AS total_cliques,
    a.ad_status,
    a.published_at
FROM animals a
LEFT JOIN clicks c ON c.content_id = a.id AND c.content_type = 'animal'
WHERE a.ad_status = 'active'
GROUP BY a.id, a.name, a.breed, a.gender, a.ad_status, a.published_at
ORDER BY total_cliques DESC
LIMIT 10;

-- Verificar se a view animals_with_stats está calculando corretamente
SELECT 
    '2.1 VALIDAÇÃO ANIMALS_WITH_STATS' AS categoria,
    id,
    name,
    COALESCE(clicks, 0) AS clicks_view,
    (SELECT COUNT(*) FROM clicks WHERE content_id = a.id AND content_type = 'animal') AS clicks_real
FROM animals_with_stats a
WHERE ad_status = 'active'
ORDER BY clicks DESC
LIMIT 10;

-- =====================================================
-- CAMADA 3: GARANHÕES MAIS BUSCADOS DO MÊS
-- =====================================================

-- Verificar início do mês atual
SELECT 
    '3. DATA INÍCIO DO MÊS ATUAL' AS categoria,
    DATE_TRUNC('month', NOW())::DATE AS inicio_mes,
    NOW()::DATE AS data_hoje;

-- Top 10 garanhões com mais cliques no mês atual
SELECT 
    '3.1 TOP 10 GARANHÕES DO MÊS' AS categoria,
    a.name,
    a.breed,
    COUNT(c.id) AS cliques_mes_atual,
    a.ad_status,
    a.category
FROM animals a
LEFT JOIN clicks c ON c.content_id = a.id 
    AND c.content_type = 'animal'
    AND c.created_at >= DATE_TRUNC('month', NOW())
WHERE a.ad_status = 'active'
  AND a.gender = 'Macho'
GROUP BY a.id, a.name, a.breed, a.ad_status, a.category
ORDER BY cliques_mes_atual DESC
LIMIT 10;

-- Verificar se existem cliques de meses anteriores sendo contados (ERRO)
SELECT 
    '3.2 CLIQUES ANTIGOS (VERIFICAÇÃO)' AS categoria,
    DATE_TRUNC('month', c.created_at)::DATE AS mes_clique,
    COUNT(*) AS total_cliques
FROM clicks c
JOIN animals a ON c.content_id = a.id AND c.content_type = 'animal'
WHERE a.gender = 'Macho'
  AND a.ad_status = 'active'
GROUP BY DATE_TRUNC('month', c.created_at)
ORDER BY mes_clique DESC
LIMIT 12;

-- =====================================================
-- CAMADA 4: DOADORAS MAIS BUSCADAS DO MÊS
-- =====================================================

-- Top 10 doadoras com mais cliques no mês atual
SELECT 
    '4. TOP 10 DOADORAS DO MÊS' AS categoria,
    a.name,
    a.breed,
    COUNT(c.id) AS cliques_mes_atual,
    a.ad_status,
    a.category
FROM animals a
LEFT JOIN clicks c ON c.content_id = a.id 
    AND c.content_type = 'animal'
    AND c.created_at >= DATE_TRUNC('month', NOW())
WHERE a.ad_status = 'active'
  AND a.gender = 'Fêmea'
GROUP BY a.id, a.name, a.breed, a.ad_status, a.category
ORDER BY cliques_mes_atual DESC
LIMIT 10;

-- =====================================================
-- CAMADA 5: ÚLTIMAS POSTAGENS
-- =====================================================

-- Top 10 animais mais recentes por published_at
SELECT 
    '5. TOP 10 ÚLTIMAS POSTAGENS' AS categoria,
    a.name,
    a.breed,
    a.gender,
    a.published_at,
    a.ad_status,
    EXTRACT(EPOCH FROM (NOW() - a.published_at))/3600 AS horas_desde_publicacao
FROM animals a
WHERE a.ad_status = 'active'
ORDER BY a.published_at DESC
LIMIT 10;

-- Verificar se há problemas de timezone
SELECT 
    '5.1 VERIFICAÇÃO DE TIMEZONE' AS categoria,
    NOW() AS timestamp_servidor,
    NOW() AT TIME ZONE 'America/Sao_Paulo' AS timestamp_brasilia,
    CURRENT_SETTING('timezone') AS timezone_configurado;

-- =====================================================
-- VERIFICAÇÕES GERAIS DE INTEGRIDADE
-- =====================================================

-- Total de animais ativos
SELECT 
    '6. TOTAL DE ANIMAIS ATIVOS' AS categoria,
    COUNT(*) AS total
FROM animals
WHERE ad_status = 'active';

-- Animais com dados incompletos ou suspeitos
SELECT 
    '6.1 ANIMAIS COM DADOS SUSPEITOS' AS categoria,
    COUNT(*) AS total_com_problema,
    STRING_AGG(
        name || ' (' || 
        CASE 
            WHEN images IS NULL OR JSONB_ARRAY_LENGTH(images) = 0 THEN 'sem imagens, '
            ELSE ''
        END ||
        CASE 
            WHEN published_at IS NULL THEN 'sem published_at, '
            ELSE ''
        END ||
        CASE 
            WHEN published_at > NOW() THEN 'published_at futuro, '
            ELSE ''
        END || 
        'status: ' || ad_status || 
        ')', 
        '; '
    ) AS problemas
FROM animals
WHERE ad_status = 'active'
  AND (
    images IS NULL 
    OR JSONB_ARRAY_LENGTH(images) = 0 
    OR published_at IS NULL 
    OR published_at > NOW()
  );

-- Verificar status do cron job de expiração de boost
SELECT 
    '7. STATUS DO CRON JOB DE EXPIRAÇÃO' AS categoria,
    jobname,
    schedule,
    active,
    command
FROM cron.job
WHERE jobname LIKE '%boost%';

-- Verificar se há impressões sem cliques (CTR)
SELECT 
    '8. TAXA DE CONVERSÃO (IMPRESSÕES -> CLIQUES)' AS categoria,
    COUNT(DISTINCT i.content_id) AS animais_com_impressoes,
    COUNT(DISTINCT c.content_id) AS animais_com_cliques,
    ROUND(
        (COUNT(DISTINCT c.content_id)::DECIMAL / NULLIF(COUNT(DISTINCT i.content_id), 0)) * 100, 
        2
    ) AS taxa_conversao_pct
FROM impressions i
LEFT JOIN clicks c ON i.content_id = c.content_id 
    AND i.content_type = c.content_type
WHERE i.content_type = 'animal';

-- Verificar animais sem nenhuma métrica
SELECT 
    '9. ANIMAIS ATIVOS SEM MÉTRICAS' AS categoria,
    COUNT(*) AS total_sem_metricas,
    STRING_AGG(name, ', ') AS nomes
FROM animals a
LEFT JOIN impressions i ON a.id = i.content_id AND i.content_type = 'animal'
LEFT JOIN clicks c ON a.id = c.content_id AND c.content_type = 'animal'
WHERE a.ad_status = 'active'
  AND i.id IS NULL
  AND c.id IS NULL
LIMIT 20;

-- =====================================================
-- VERIFICAR CONSISTÊNCIA ENTRE TABELAS E VIEWS
-- =====================================================

-- Comparar contagem de cliques: tabela vs view
SELECT 
    '10. CONSISTÊNCIA: TABELA CLICKS vs VIEW' AS categoria,
    a.id,
    a.name,
    (SELECT COUNT(*) FROM clicks WHERE content_id = a.id AND content_type = 'animal') AS clicks_tabela,
    aws.clicks AS clicks_view,
    CASE 
        WHEN (SELECT COUNT(*) FROM clicks WHERE content_id = a.id AND content_type = 'animal') = COALESCE(aws.clicks, 0)
        THEN 'OK'
        ELSE 'INCONSISTENTE'
    END AS status
FROM animals a
LEFT JOIN animals_with_stats aws ON a.id = aws.id
WHERE a.ad_status = 'active'
ORDER BY clicks_tabela DESC
LIMIT 10;

-- =====================================================
-- FIM DAS QUERIES DE VERIFICAÇÃO
-- =====================================================

