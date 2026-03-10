-- Migration 071: Sistema de publicação automática de artigos agendados
-- Data: 23/11/2025
-- Descrição: Cria função e trigger para publicar automaticamente artigos
--            quando o horário agendado é atingido

-- Função para publicar artigos agendados
CREATE OR REPLACE FUNCTION auto_publish_scheduled_articles()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Atualizar artigos que devem ser publicados
  UPDATE articles
  SET 
    is_published = true,
    published_at = NOW(),
    scheduled_publish_at = NULL,
    updated_at = NOW()
  WHERE 
    is_published = false
    AND scheduled_publish_at IS NOT NULL
    AND scheduled_publish_at <= NOW();
END;
$$;

-- Comentário sobre a função
COMMENT ON FUNCTION auto_publish_scheduled_articles() IS 
'Publica automaticamente artigos agendados quando o horário agendado é atingido';

-- Criar uma view que mostra artigos prontos para publicação
CREATE OR REPLACE VIEW articles_ready_to_publish AS
SELECT 
  id,
  title,
  scheduled_publish_at,
  NOW() - scheduled_publish_at AS time_overdue
FROM articles
WHERE 
  is_published = false
  AND scheduled_publish_at IS NOT NULL
  AND scheduled_publish_at <= NOW();

-- Comentário sobre a view
COMMENT ON VIEW articles_ready_to_publish IS 
'Lista artigos que estão prontos para serem publicados (horário agendado já passou)';


