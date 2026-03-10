-- =====================================================
-- MIGRAÇÃO 024: ADICIONAR CAMPOS DE LOCALIZAÇÃO
-- Data: 28/10/2025
-- Descrição: Adicionar campos cidade, estado e país para o mapa
-- =====================================================

-- Adicionar campos de localização à tabela profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'Brasil',
ADD COLUMN IF NOT EXISTS founded_year TEXT,
ADD COLUMN IF NOT EXISTS owner_name TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT;

-- Criar índice para melhorar performance de buscas por localização
CREATE INDEX IF NOT EXISTS idx_profiles_location ON profiles(country, state, city);

-- Comentários nas colunas
COMMENT ON COLUMN profiles.city IS 'Cidade onde o usuário está localizado (para exibição no mapa)';
COMMENT ON COLUMN profiles.state IS 'Estado onde o usuário está localizado (para exibição no mapa)';
COMMENT ON COLUMN profiles.country IS 'País onde o usuário está localizado (para exibição no mapa)';
COMMENT ON COLUMN profiles.founded_year IS 'Ano de fundação (apenas para contas institucionais)';
COMMENT ON COLUMN profiles.owner_name IS 'Nome do proprietário (apenas para contas institucionais)';
COMMENT ON COLUMN profiles.bio IS 'Biografia/Sobre a instituição - máximo 500 caracteres';

-- Atualizar usuários existentes com localização padrão
UPDATE profiles 
SET country = 'Brasil', 
    state = 'São Paulo', 
    city = 'São Paulo'
WHERE country IS NULL OR country = '';

-- Criar função para validar localização
CREATE OR REPLACE FUNCTION validate_location()
RETURNS TRIGGER AS $$
BEGIN
  -- Se informar cidade, deve informar estado
  IF NEW.city IS NOT NULL AND NEW.city != '' THEN
    IF NEW.state IS NULL OR NEW.state = '' THEN
      RAISE EXCEPTION 'Estado é obrigatório quando cidade é informada';
    END IF;
  END IF;
  
  -- Se informar estado, deve informar país
  IF NEW.state IS NOT NULL AND NEW.state != '' THEN
    IF NEW.country IS NULL OR NEW.country = '' THEN
      RAISE EXCEPTION 'País é obrigatório quando estado é informado';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para validar localização
DROP TRIGGER IF EXISTS trigger_validate_location ON profiles;
CREATE TRIGGER trigger_validate_location
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION validate_location();
