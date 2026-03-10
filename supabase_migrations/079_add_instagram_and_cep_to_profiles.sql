-- Migration 079: Adicionar campos instagram e CEP ao perfil
-- Data: 27/11/2025
-- Objetivo: Permitir que usuários adicionem Instagram e CEP ao perfil

-- Adicionar colunas à tabela profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS instagram VARCHAR(100),
ADD COLUMN IF NOT EXISTS cep VARCHAR(9);

-- Adicionar comentários
COMMENT ON COLUMN public.profiles.instagram IS 'Username do Instagram sem o @';
COMMENT ON COLUMN public.profiles.cep IS 'CEP do endereço (formato: 12345-678)';

-- Criar índice para busca por instagram
CREATE INDEX IF NOT EXISTS idx_profiles_instagram ON public.profiles(instagram) WHERE instagram IS NOT NULL;


