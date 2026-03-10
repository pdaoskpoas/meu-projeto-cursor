-- Migração: Adicionar campos para "Atualizar Perfil" (informações complementares)
-- Data: 2025-10-28
-- Descrição: Separar cadastro simples (obrigatório) de atualização de perfil (opcional)

-- Adicionar campos para perfil estendido
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS country text DEFAULT 'Brasil',
ADD COLUMN IF NOT EXISTS state text,
ADD COLUMN IF NOT EXISTS city text,
ADD COLUMN IF NOT EXISTS founded_year text,
ADD COLUMN IF NOT EXISTS owner_name text,
ADD COLUMN IF NOT EXISTS bio text;

-- Adicionar comentários para documentação
COMMENT ON COLUMN public.profiles.country IS 'País do usuário/instituição (perfil estendido)';
COMMENT ON COLUMN public.profiles.state IS 'Estado/região do usuário/instituição (perfil estendido)';
COMMENT ON COLUMN public.profiles.city IS 'Cidade do usuário/instituição (perfil estendido)';
COMMENT ON COLUMN public.profiles.founded_year IS 'Ano de fundação para instituições (perfil estendido)';
COMMENT ON COLUMN public.profiles.owner_name IS 'Nome do proprietário/responsável para instituições (perfil estendido)';
COMMENT ON COLUMN public.profiles.bio IS 'Biografia/descrição da instituição - máx 500 caracteres (perfil estendido)';

-- Adicionar constraint para limitar tamanho da bio
ALTER TABLE public.profiles 
ADD CONSTRAINT bio_length_check CHECK (length(bio) <= 500);

-- Criar índice para consultas por localização (para futuro mapa)
CREATE INDEX IF NOT EXISTS idx_profiles_location 
ON public.profiles(state, city) 
WHERE state IS NOT NULL AND city IS NOT NULL;

-- Atualizar RLS policies se necessário (manter as existentes)
-- As políticas atuais já cobrem estes campos

