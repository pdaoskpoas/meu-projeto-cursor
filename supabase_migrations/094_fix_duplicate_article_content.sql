-- =====================================================
-- MIGRATION 094: Corrigir Conteúdo Duplicado em Artigos
-- Data: 2025-12-XX
-- Descrição: Identifica e corrige artigos com conteúdo duplicado
--            Remove duplicações onde o conteúdo aparece duas vezes
-- =====================================================

-- Função para detectar e remover conteúdo duplicado
CREATE OR REPLACE FUNCTION clean_duplicate_article_content()
RETURNS TABLE (
  article_id UUID,
  article_title TEXT,
  original_length INT,
  cleaned_length INT,
  was_duplicated BOOLEAN
)
LANGUAGE plpgsql
AS $$
DECLARE
  article_record RECORD;
  content_text TEXT;
  content_length INT;
  half_length INT;
  first_half TEXT;
  second_half TEXT;
  cleaned_content TEXT;
  is_duplicated BOOLEAN;
  text_only_first TEXT;
  text_only_second TEXT;
BEGIN
  FOR article_record IN 
    SELECT id, title, content 
    FROM articles 
    WHERE content IS NOT NULL 
      AND LENGTH(TRIM(content)) > 100  -- Apenas artigos com conteúdo significativo
  LOOP
    content_text := article_record.content;
    content_length := LENGTH(content_text);
    half_length := FLOOR(content_length / 2)::INTEGER;
    
    -- Pegar primeira e segunda metade
    first_half := SUBSTRING(content_text FROM 1 FOR half_length);
    second_half := SUBSTRING(content_text FROM (half_length + 1));
    
    is_duplicated := FALSE;
    cleaned_content := content_text;
    
    -- Remover tags HTML e espaços para comparação de texto puro
    text_only_first := REGEXP_REPLACE(first_half, '<[^>]+>', '', 'g');
    text_only_first := REGEXP_REPLACE(text_only_first, '\s+', ' ', 'g');
    text_only_first := TRIM(text_only_first);
    
    text_only_second := REGEXP_REPLACE(second_half, '<[^>]+>', '', 'g');
    text_only_second := REGEXP_REPLACE(text_only_second, '\s+', ' ', 'g');
    text_only_second := TRIM(text_only_second);
    
    -- Verificar se as duas metades são muito similares (duplicação)
    -- Comparar primeiros 500 caracteres do texto puro
    IF LENGTH(text_only_first) > 100 AND LENGTH(text_only_second) > 100 THEN
      IF SUBSTRING(text_only_first FROM 1 FOR LEAST(500, LENGTH(text_only_first))::INTEGER) = 
         SUBSTRING(text_only_second FROM 1 FOR LEAST(500, LENGTH(text_only_second))::INTEGER) THEN
        is_duplicated := TRUE;
        cleaned_content := first_half;
      -- Verificar se o texto completo da primeira metade aparece no início da segunda
      ELSIF text_only_second LIKE text_only_first || '%' AND 
            LENGTH(text_only_first) > (LENGTH(text_only_second) * 0.8) THEN
        is_duplicated := TRUE;
        cleaned_content := first_half;
      END IF;
    END IF;
    
    -- Se encontrou duplicação, atualizar o artigo
    IF is_duplicated THEN
      UPDATE articles
      SET content = cleaned_content,
          updated_at = NOW()
      WHERE id = article_record.id;
      
      -- Retornar informação sobre a correção
      article_id := article_record.id;
      article_title := article_record.title;
      original_length := content_length;
      cleaned_length := LENGTH(cleaned_content);
      was_duplicated := TRUE;
      
      RETURN NEXT;
    END IF;
  END LOOP;
  
  RETURN;
END;
$$;

-- Executar a limpeza e mostrar resultados
DO $$
DECLARE
  result_record RECORD;
  total_fixed INT := 0;
BEGIN
  RAISE NOTICE 'Iniciando limpeza de conteúdo duplicado em artigos...';
  
  FOR result_record IN 
    SELECT * FROM clean_duplicate_article_content()
  LOOP
    total_fixed := total_fixed + 1;
    RAISE NOTICE 'Artigo corrigido: % (ID: %) - Tamanho original: %, Tamanho após limpeza: %', 
      result_record.article_title, 
      result_record.article_id,
      result_record.original_length,
      result_record.cleaned_length;
  END LOOP;
  
  RAISE NOTICE 'Limpeza concluída. Total de artigos corrigidos: %', total_fixed;
END;
$$;

-- Comentários
COMMENT ON FUNCTION clean_duplicate_article_content IS 
'Identifica e corrige artigos com conteúdo duplicado no banco de dados. 
Compara a primeira e segunda metade do conteúdo e remove a duplicação se detectada.
Retorna informações sobre os artigos corrigidos.';
