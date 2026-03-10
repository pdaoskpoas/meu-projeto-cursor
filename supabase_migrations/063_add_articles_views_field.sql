-- =====================================================
-- MIGRAÇÃO 063: ADICIONAR CAMPO VIEWS EM ARTICLES
-- Data: 17/11/2025
-- Descrição: Adicionar campo para tracking de visualizações
-- =====================================================

BEGIN;

-- =====================================================
-- ADICIONAR CAMPO VIEWS
-- =====================================================

ALTER TABLE articles
ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0;

COMMENT ON COLUMN articles.views IS 'Contador de visualizações do artigo';

-- =====================================================
-- CRIAR ÍNDICE PARA PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_articles_views 
ON articles(views DESC) 
WHERE is_published = true;

COMMENT ON INDEX idx_articles_views IS 'Índice para ordenar artigos por visualizações';

-- =====================================================
-- ATUALIZAR VIEWS EXISTENTES PARA 0
-- =====================================================

UPDATE articles 
SET views = 0 
WHERE views IS NULL;

COMMIT;

-- =====================================================
-- VERIFICAÇÃO
-- =====================================================

SELECT 
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'articles'
  AND column_name = 'views';

