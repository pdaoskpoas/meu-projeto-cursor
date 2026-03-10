-- =====================================================
-- Migration 069: Corrigir Slugs dos Artigos Existentes
-- Data: 23/11/2025
-- Descrição: Corrige artigos que têm UUIDs como slug
-- =====================================================

-- Função auxiliar para gerar slug a partir do título
CREATE OR REPLACE FUNCTION generate_slug_from_title(title TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN LOWER(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        REGEXP_REPLACE(
          TRANSLATE(
            title,
            'àáâãäåāăąèéêëēėęìíîïīįòóôõöōøùúûüūůçćčñńňÀÁÂÃÄÅĀĂĄÈÉÊËĒĖĘÌÍÎÏĪĮÒÓÔÕÖŌØÙÚÛÜŪŮÇĆČÑŃŇ',
            'aaaaaaaaaeeeeeeeiiiiiioooooooouuuuuucccnnnAAAAAAAAEEEEEEEIIIIIIOOOOOOOUUUUUUCCCNNN'
          ),
          '[^a-z0-9\s-]', '', 'g'
        ),
        '\s+', '-', 'g'
      ),
      '-+', '-', 'g'
    )
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Atualizar artigos que têm UUIDs como slug
-- Um UUID tem o formato: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx (36 caracteres com hífens)
DO $$
DECLARE
  article_record RECORD;
  new_slug TEXT;
  counter INT;
  is_uuid BOOLEAN;
BEGIN
  FOR article_record IN 
    SELECT id, title, slug 
    FROM articles 
    WHERE slug IS NOT NULL
    ORDER BY created_at
  LOOP
    -- Verificar se o slug parece ser um UUID (36 caracteres com padrão de hífens)
    is_uuid := LENGTH(article_record.slug) = 36 
               AND article_record.slug ~ '^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$';
    
    -- Se for UUID ou slug vazio, gerar novo slug
    IF is_uuid OR article_record.slug = '' THEN
      new_slug := generate_slug_from_title(article_record.title);
      counter := 1;
      
      -- Garantir unicidade
      WHILE EXISTS (
        SELECT 1 FROM articles 
        WHERE slug = new_slug 
        AND id != article_record.id
      ) LOOP
        new_slug := generate_slug_from_title(article_record.title) || '-' || counter;
        counter := counter + 1;
      END LOOP;
      
      -- Atualizar slug
      UPDATE articles 
      SET slug = new_slug, 
          updated_at = NOW()
      WHERE id = article_record.id;
      
      RAISE NOTICE 'Artigo "%" atualizado: % → %', 
        article_record.title, 
        article_record.slug, 
        new_slug;
    END IF;
  END LOOP;
END $$;

-- Remover a função auxiliar após uso
DROP FUNCTION IF EXISTS generate_slug_from_title(TEXT);

-- Verificar resultados
DO $$
DECLARE
  total_articles INT;
  articles_with_slugs INT;
  articles_with_uuid_slugs INT;
BEGIN
  SELECT COUNT(*) INTO total_articles FROM articles;
  
  SELECT COUNT(*) INTO articles_with_slugs 
  FROM articles 
  WHERE slug IS NOT NULL AND slug != '';
  
  SELECT COUNT(*) INTO articles_with_uuid_slugs 
  FROM articles 
  WHERE slug ~ '^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$';
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'VERIFICAÇÃO DE SLUGS';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total de artigos: %', total_articles;
  RAISE NOTICE 'Artigos com slug: %', articles_with_slugs;
  RAISE NOTICE 'Artigos com UUID como slug: %', articles_with_uuid_slugs;
  RAISE NOTICE '========================================';
  
  IF articles_with_uuid_slugs > 0 THEN
    RAISE WARNING 'Ainda existem % artigos com UUID como slug!', articles_with_uuid_slugs;
  ELSE
    RAISE NOTICE '✅ Todos os artigos têm slugs corretos!';
  END IF;
END $$;

-- =====================================================
-- Índices e Constraints
-- =====================================================

-- Garantir que slug seja único e não nulo para artigos publicados
CREATE UNIQUE INDEX IF NOT EXISTS idx_articles_slug_unique ON articles(slug) 
WHERE slug IS NOT NULL;

-- =====================================================
-- Comentários
-- =====================================================
COMMENT ON COLUMN articles.slug IS 'Slug SEO-friendly gerado automaticamente do título (ex: meu-primeiro-artigo). Nunca deve ser UUID.';


