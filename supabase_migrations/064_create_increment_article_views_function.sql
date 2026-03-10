-- =====================================================
-- MIGRAÇÃO 064: FUNÇÃO PARA INCREMENTAR VIEWS
-- Data: 17/11/2025
-- Descrição: Criar função para incrementar views de artigos de forma atômica
-- =====================================================

-- =====================================================
-- FUNÇÃO PARA INCREMENTAR VIEWS
-- =====================================================

CREATE OR REPLACE FUNCTION increment_article_views(article_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE articles
  SET views = COALESCE(views, 0) + 1
  WHERE id = article_id 
    AND is_published = true;
END;
$$;

COMMENT ON FUNCTION increment_article_views IS 
  'Incrementa atomicamente o contador de views de um artigo publicado';

-- =====================================================
-- GRANTS
-- =====================================================

GRANT EXECUTE ON FUNCTION increment_article_views TO authenticated;
GRANT EXECUTE ON FUNCTION increment_article_views TO anon;

