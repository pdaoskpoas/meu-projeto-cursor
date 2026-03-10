-- Implementar sistema de expiração de anúncios
-- 1. Anúncios expiram após 1 mês da publicação (status = 'expired')
-- 2. Anúncios expirados NÃO aparecem nas buscas públicas (só 'active' são exibidos)
-- 3. Usuário tem 7 dias de graça para reativar sem perder dados
-- 4. Após 7 dias, anúncios são deletados definitivamente

-- Atualizar coluna expires_at para refletir 1 mês após publicação
UPDATE animals 
SET expires_at = (published_at::timestamp + interval '1 month')::timestamp with time zone
WHERE ad_status = 'active' AND expires_at IS NULL;

-- Criar função para calcular data de expiração
CREATE OR REPLACE FUNCTION calculate_expiration_date(publish_date timestamp with time zone)
RETURNS timestamp with time zone AS $$
BEGIN
  RETURN publish_date + interval '1 month';
END;
$$ LANGUAGE plpgsql;

-- Criar função para verificar se anúncio expirado está no período de graça
CREATE OR REPLACE FUNCTION is_in_grace_period(expire_date timestamp with time zone)
RETURNS boolean AS $$
BEGIN
  -- Verifica se ainda está dentro dos 7 dias após expiração
  RETURN now() <= (expire_date + interval '7 days');
END;
$$ LANGUAGE plpgsql;

-- Atualizar trigger para definir expires_at automaticamente na publicação
CREATE OR REPLACE FUNCTION set_expiration_on_publish()
RETURNS TRIGGER AS $$
BEGIN
  -- Se o status mudou para 'active' (publicação inicial ou reativação)
  IF NEW.ad_status = 'active' AND OLD.ad_status != 'active' THEN
    NEW.published_at = now();
    NEW.expires_at = calculate_expiration_date(NEW.published_at);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger
DROP TRIGGER IF EXISTS trg_set_expiration_on_publish ON animals;
CREATE TRIGGER trg_set_expiration_on_publish
  BEFORE UPDATE ON animals
  FOR EACH ROW
  EXECUTE FUNCTION set_expiration_on_publish();

-- Função para processar expirações (deve ser executada diariamente)
CREATE OR REPLACE FUNCTION process_animal_expirations()
RETURNS INTEGER AS $$
DECLARE
  expired_count INTEGER := 0;
  deleted_count INTEGER := 0;
BEGIN
  -- 1. Marcar anúncios como expirados (1 mês após publicação)
  -- Status 'expired' = não aparece nas buscas públicas
  UPDATE animals 
  SET ad_status = 'expired'
  WHERE ad_status = 'active' 
    AND expires_at < now()
    AND expires_at IS NOT NULL;
  
  GET DIAGNOSTICS expired_count = ROW_COUNT;
  
  -- 2. Deletar anúncios que estão expirados há mais de 7 dias
  -- (período de graça terminou)
  DELETE FROM animals
  WHERE ad_status = 'expired'
    AND expires_at < now() - interval '7 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Log das operações
  INSERT INTO system_logs (operation, details, created_at)
  VALUES (
    'animal_expiration_process',
    json_build_object(
      'expired_count', expired_count,
      'deleted_count', deleted_count,
      'processed_at', now()
    ),
    now()
  );
  
  RETURN expired_count + deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Criar tabela de logs do sistema se não existir
CREATE TABLE IF NOT EXISTS system_logs (
  id SERIAL PRIMARY KEY,
  operation VARCHAR(100) NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Atualizar view search_animals para exibir APENAS anúncios ativos
DROP VIEW IF EXISTS search_animals;
CREATE VIEW search_animals AS
SELECT 
  a.id,
  a.name,
  a.breed,
  a.gender,
  a.birth_date,
  a.coat,
  a.current_city,
  a.current_state,
  p.name as owner_name,
  p.property_name,
  a.is_boosted,
  COALESCE(imp.impression_count, 0) as impression_count,
  COALESCE(clk.click_count, 0) as click_count,
  CASE 
    WHEN COALESCE(imp.impression_count, 0) > 0 
    THEN ROUND((COALESCE(clk.click_count, 0)::decimal / imp.impression_count) * 100, 2)
    ELSE 0 
  END as click_rate,
  a.published_at,
  a.images
FROM animals a
JOIN profiles p ON a.owner_id = p.id
LEFT JOIN (
  SELECT content_id, COUNT(*) as impression_count
  FROM impressions 
  WHERE content_type = 'animal'
  GROUP BY content_id
) imp ON a.id = imp.content_id
LEFT JOIN (
  SELECT content_id, COUNT(*) as click_count
  FROM clicks 
  WHERE content_type = 'animal'
  GROUP BY content_id
) clk ON a.id = clk.content_id
WHERE a.ad_status = 'active'  -- APENAS anúncios ativos são exibidos publicamente
ORDER BY 
  a.is_boosted DESC,  -- Impulsionados primeiro
  clk.click_count DESC,  -- Depois por cliques
  a.published_at DESC;  -- Depois por data

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_animals_expires_at ON animals (expires_at) WHERE ad_status IN ('active', 'expired');
CREATE INDEX IF NOT EXISTS idx_animals_ad_status_expires ON animals (ad_status, expires_at);
CREATE INDEX IF NOT EXISTS idx_animals_public_search ON animals (ad_status, is_boosted, published_at) WHERE ad_status = 'active';

-- Comentários para documentação
COMMENT ON FUNCTION process_animal_expirations() IS 'Processa expirações: marca como expired (não aparece publicamente) após 1 mês, deleta após 7 dias de graça';
COMMENT ON FUNCTION calculate_expiration_date(timestamp with time zone) IS 'Calcula data de expiração (1 mês após publicação)';
COMMENT ON FUNCTION is_in_grace_period(timestamp with time zone) IS 'Verifica se anúncio expirado ainda está no período de graça de 7 dias para reativação';
COMMENT ON VIEW search_animals IS 'View pública que exibe APENAS anúncios com status active - anúncios expired não aparecem nas buscas';
