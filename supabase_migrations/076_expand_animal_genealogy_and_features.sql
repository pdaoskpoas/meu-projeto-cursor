-- Migration: Expansão da Genealogia e Novas Features para Animais
-- Criado em: 27 de Novembro de 2025
-- Descrição: Adiciona avós, bisavós, descrição do anúncio e cidade/UF para premiações

-- ==========================================
-- 1. EXPANDIR CATEGORIAS (adicionar Potro e Potra)
-- ==========================================

-- Remover constraint antiga
ALTER TABLE public.animals 
DROP CONSTRAINT IF EXISTS animals_category_check;

-- Adicionar nova constraint com Potro e Potra
ALTER TABLE public.animals 
ADD CONSTRAINT animals_category_check 
CHECK (category = ANY (ARRAY['Garanhão'::text, 'Doadora'::text, 'Potro'::text, 'Potra'::text, 'Outro'::text]));

COMMENT ON COLUMN public.animals.category IS 'Categoria do animal: Garanhão (reprodutor macho), Doadora (reprodutora fêmea), Potro (jovem macho), Potra (jovem fêmea) ou Outro';

-- ==========================================
-- 2. ADICIONAR CAMPOS DE GENEALOGIA EXPANDIDA
-- ==========================================

-- Avós paternos
ALTER TABLE public.animals 
ADD COLUMN IF NOT EXISTS paternal_grandfather_name TEXT;

ALTER TABLE public.animals 
ADD COLUMN IF NOT EXISTS paternal_grandmother_name TEXT;

-- Avós maternos
ALTER TABLE public.animals 
ADD COLUMN IF NOT EXISTS maternal_grandfather_name TEXT;

ALTER TABLE public.animals 
ADD COLUMN IF NOT EXISTS maternal_grandmother_name TEXT;

-- Bisavós paternos (lado do avô paterno)
ALTER TABLE public.animals 
ADD COLUMN IF NOT EXISTS paternal_gg_father_name TEXT;

ALTER TABLE public.animals 
ADD COLUMN IF NOT EXISTS paternal_gg_mother_name TEXT;

-- Bisavós paternos (lado da avó paterna)
ALTER TABLE public.animals 
ADD COLUMN IF NOT EXISTS paternal_gm_father_name TEXT;

ALTER TABLE public.animals 
ADD COLUMN IF NOT EXISTS paternal_gm_mother_name TEXT;

-- Bisavós maternos (lado do avô materno)
ALTER TABLE public.animals 
ADD COLUMN IF NOT EXISTS maternal_gg_father_name TEXT;

ALTER TABLE public.animals 
ADD COLUMN IF NOT EXISTS maternal_gg_mother_name TEXT;

-- Bisavós maternos (lado da avó materna)
ALTER TABLE public.animals 
ADD COLUMN IF NOT EXISTS maternal_gm_father_name TEXT;

ALTER TABLE public.animals 
ADD COLUMN IF NOT EXISTS maternal_gm_mother_name TEXT;

-- Comentários
COMMENT ON COLUMN public.animals.paternal_grandfather_name IS 'Nome do avô paterno (pai do pai)';
COMMENT ON COLUMN public.animals.paternal_grandmother_name IS 'Nome da avó paterna (mãe do pai)';
COMMENT ON COLUMN public.animals.maternal_grandfather_name IS 'Nome do avô materno (pai da mãe)';
COMMENT ON COLUMN public.animals.maternal_grandmother_name IS 'Nome da avó materna (mãe da mãe)';
COMMENT ON COLUMN public.animals.paternal_gg_father_name IS 'Bisavô paterno - pai do avô paterno';
COMMENT ON COLUMN public.animals.paternal_gg_mother_name IS 'Bisavó paterna - mãe do avô paterno';
COMMENT ON COLUMN public.animals.paternal_gm_father_name IS 'Bisavô paterno - pai da avó paterna';
COMMENT ON COLUMN public.animals.paternal_gm_mother_name IS 'Bisavó paterna - mãe da avó paterna';
COMMENT ON COLUMN public.animals.maternal_gg_father_name IS 'Bisavô materno - pai do avô materno';
COMMENT ON COLUMN public.animals.maternal_gg_mother_name IS 'Bisavó materna - mãe do avô materno';
COMMENT ON COLUMN public.animals.maternal_gm_father_name IS 'Bisavô materno - pai da avó materna';
COMMENT ON COLUMN public.animals.maternal_gm_mother_name IS 'Bisavó materna - mãe da avó materna';

-- ==========================================
-- 3. ADICIONAR CAMPO DE DESCRIÇÃO DO ANÚNCIO
-- ==========================================

ALTER TABLE public.animals 
ADD COLUMN IF NOT EXISTS description TEXT;

ALTER TABLE public.animals 
ADD CONSTRAINT animals_description_length_check 
CHECK (description IS NULL OR char_length(description) <= 300);

COMMENT ON COLUMN public.animals.description IS 'Descrição do anúncio do animal - máximo 300 caracteres';

-- ==========================================
-- 4. ADICIONAR CIDADE/UF NAS PREMIAÇÕES
-- ==========================================

ALTER TABLE public.animal_titles 
ADD COLUMN IF NOT EXISTS city TEXT;

ALTER TABLE public.animal_titles 
ADD COLUMN IF NOT EXISTS state TEXT;

ALTER TABLE public.animal_titles 
ADD CONSTRAINT animal_titles_city_state_check 
CHECK (
  (city IS NULL AND state IS NULL) OR 
  (city IS NOT NULL AND state IS NOT NULL AND char_length(state) = 2)
);

COMMENT ON COLUMN public.animal_titles.city IS 'Cidade onde ocorreu o evento (ex: IRARÁ)';
COMMENT ON COLUMN public.animal_titles.state IS 'UF onde ocorreu o evento - 2 caracteres (ex: BA)';

-- ==========================================
-- 5. ÍNDICES PARA OTIMIZAÇÃO
-- ==========================================

-- Índice para buscar animais por categoria
CREATE INDEX IF NOT EXISTS idx_animals_category ON public.animals(category) WHERE category IS NOT NULL;

-- Índice para buscar animais com descrição
CREATE INDEX IF NOT EXISTS idx_animals_with_description ON public.animals(id) WHERE description IS NOT NULL;

-- Índice para buscar premiações por localidade
CREATE INDEX IF NOT EXISTS idx_animal_titles_location ON public.animal_titles(state, city) WHERE state IS NOT NULL;

-- ==========================================
-- 6. GRANTS (RLS já está configurado)
-- ==========================================

-- Garantir que usuários autenticados possam ler/escrever suas próprias premiações
-- (As políticas RLS já existentes da tabela animal_titles devem cobrir isso)

-- ==========================================
-- 7. LOGS E AUDITORIA
-- ==========================================

INSERT INTO public.system_logs (operation, details)
VALUES (
  'migration_076_genealogy_expansion',
  jsonb_build_object(
    'timestamp', now(),
    'changes', jsonb_build_array(
      'Adicionadas categorias Potro e Potra',
      'Adicionados 12 campos de genealogia (avós e bisavós)',
      'Adicionado campo description (300 chars)',
      'Adicionados campos city e state em animal_titles',
      'Criados índices de otimização'
    )
  )
);


