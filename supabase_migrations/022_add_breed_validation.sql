-- =====================================================
-- Migration: 022_add_breed_validation
-- Descrição: Remove animais com raças antigas e adiciona constraint de validação
-- Data: 2025-10-03
-- =====================================================

-- PASSO 1: Remover animais com raças que não estão na lista oficial
-- Isso garante que apenas raças válidas permaneçam no sistema

-- Registrar quantos animais serão deletados (para log)
DO $$
DECLARE
  delete_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO delete_count
  FROM animals
  WHERE breed NOT IN (
    'Brasileiro de Hipismo',
    'Campolina',
    'Mangalarga Marchador',
    'Mangalarga Paulista',
    'Pônei Brasileiro',
    'Quarto de Milha',
    'Árabe',
    'Andaluz',
    'Puro-Sangue Inglês',
    'Crioulo',
    'Appaloosa',
    'Paint Horse',
    'Friesian',
    'Bretão',
    'Percheron',
    'Morgan'
  );
  
  RAISE NOTICE '⚠️ Serão deletados % animais com raças não oficiais', delete_count;
END $$;

-- Deletar animais com raças antigas/inválidas
DELETE FROM animals 
WHERE breed NOT IN (
  'Brasileiro de Hipismo',
  'Campolina',
  'Mangalarga Marchador',
  'Mangalarga Paulista',
  'Pônei Brasileiro',
  'Quarto de Milha',
  'Árabe',
  'Andaluz',
  'Puro-Sangue Inglês',
  'Crioulo',
  'Appaloosa',
  'Paint Horse',
  'Friesian',
  'Bretão',
  'Percheron',
  'Morgan'
);

-- PASSO 2: Adicionar constraint de validação
-- Lista completa de 16 raças oficiais aceitas no sistema

ALTER TABLE animals 
ADD CONSTRAINT animals_breed_valid CHECK (
  breed IN (
    'Brasileiro de Hipismo',
    'Campolina',
    'Mangalarga Marchador',
    'Mangalarga Paulista',
    'Pônei Brasileiro',
    'Quarto de Milha',
    'Árabe',
    'Andaluz',
    'Puro-Sangue Inglês',
    'Crioulo',
    'Appaloosa',
    'Paint Horse',
    'Friesian',
    'Bretão',
    'Percheron',
    'Morgan'
  )
);

COMMENT ON CONSTRAINT animals_breed_valid ON animals IS 
'Valida que apenas raças oficiais cadastradas sejam aceitas no sistema. Lista completa de 16 raças permitidas.';

-- =====================================================
-- Verificação Final
-- =====================================================

-- Verificar que não há mais raças inválidas
DO $$
DECLARE
  invalid_count INTEGER;
  total_count INTEGER;
  corrected_count INTEGER;
BEGIN
  -- Contar total de animais
  SELECT COUNT(*) INTO total_count FROM animals;
  
  -- Contar animais com raças válidas
  SELECT COUNT(*) INTO invalid_count
  FROM animals
  WHERE breed NOT IN (
    'Brasileiro de Hipismo',
    'Campolina',
    'Mangalarga Marchador',
    'Mangalarga Paulista',
    'Pônei Brasileiro',
    'Quarto de Milha',
    'Árabe',
    'Andaluz',
    'Puro-Sangue Inglês',
    'Crioulo',
    'Appaloosa',
    'Paint Horse',
    'Friesian',
    'Bretão',
    'Percheron',
    'Morgan'
  );

  corrected_count := total_count - invalid_count;

  RAISE NOTICE '✅ Migration 022 concluída com sucesso!';
  RAISE NOTICE 'Total de animais: %', total_count;
  RAISE NOTICE 'Animais com raças válidas: %', corrected_count;
  RAISE NOTICE 'Animais com raças inválidas restantes: %', invalid_count;
  
  IF invalid_count > 0 THEN
    RAISE WARNING 'ATENÇÃO: Ainda existem % animais com raças não permitidas!', invalid_count;
  END IF;
END $$;


