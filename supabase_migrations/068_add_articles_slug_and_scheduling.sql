-- =====================================================
-- Migration 068: Adicionar Slug e Agendamento de Publicação
-- Data: 23/11/2025
-- Descrição: Adiciona campos para SEO (slug) e agendamento
-- =====================================================

-- Adicionar campo slug para URLs amigáveis (SEO)
ALTER TABLE articles 
ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- Adicionar campo para agendamento de publicação
ALTER TABLE articles
ADD COLUMN IF NOT EXISTS scheduled_publish_at TIMESTAMPTZ;

-- Comentários para documentação
COMMENT ON COLUMN articles.slug IS 'Slug único para URL amigável (SEO) - ex: meu-primeiro-artigo';
COMMENT ON COLUMN articles.scheduled_publish_at IS 'Data/hora agendada para publicação automática do artigo';

-- Criar índice para busca por slug (otimização)
CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug);

-- Criar índice para busca de artigos agendados
CREATE INDEX IF NOT EXISTS idx_articles_scheduled ON articles(scheduled_publish_at) 
WHERE scheduled_publish_at IS NOT NULL AND is_published = FALSE;

-- Gerar slugs para artigos existentes (migração de dados)
UPDATE articles 
SET slug = LOWER(
  REGEXP_REPLACE(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        TRANSLATE(
          title,
          'àáâãäåāăąèéêëēėęìíîïīįòóôõöōøùúûüūůçćčñńň',
          'aaaaaaaaaeeeeeeeiiiiiioooooooouuuuuucccnnn'
        ),
        '[^a-z0-9\s-]', '', 'g'
      ),
      '\s+', '-', 'g'
    ),
    '-+', '-', 'g'
  )
)
WHERE slug IS NULL;

-- Garantir unicidade de slugs (adicionar sufixo numérico se necessário)
DO $$
DECLARE
  article_record RECORD;
  new_slug TEXT;
  counter INT;
BEGIN
  FOR article_record IN 
    SELECT id, slug 
    FROM articles 
    WHERE slug IS NOT NULL
    ORDER BY created_at
  LOOP
    counter := 1;
    new_slug := article_record.slug;
    
    -- Verificar se slug já existe
    WHILE EXISTS (
      SELECT 1 FROM articles 
      WHERE slug = new_slug 
      AND id != article_record.id
    ) LOOP
      new_slug := article_record.slug || '-' || counter;
      counter := counter + 1;
    END LOOP;
    
    -- Atualizar se slug foi modificado
    IF new_slug != article_record.slug THEN
      UPDATE articles SET slug = new_slug WHERE id = article_record.id;
    END IF;
  END LOOP;
END $$;

-- =====================================================
-- Verificação
-- =====================================================
-- Para verificar se a migration foi aplicada:
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name = 'articles' AND column_name IN ('slug', 'scheduled_publish_at');



