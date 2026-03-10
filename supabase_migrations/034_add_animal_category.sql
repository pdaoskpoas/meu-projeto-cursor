-- =====================================================
-- Migration: Adicionar campo de categoria aos animais
-- Descrição: Adiciona campo 'category' para classificar animais como
--            Garanhão, Doadora ou Outro, facilitando filtros de busca
-- Data: 2025-11-03
-- =====================================================

-- Adicionar coluna category à tabela animals
ALTER TABLE animals 
ADD COLUMN IF NOT EXISTS category TEXT 
CHECK (category IN ('Garanhão', 'Doadora', 'Outro'));

-- Definir valor padrão 'Outro' para registros existentes
UPDATE animals 
SET category = 'Outro' 
WHERE category IS NULL;

-- Criar índice para otimizar filtros por categoria
CREATE INDEX IF NOT EXISTS idx_animals_category ON animals(category);

-- Adicionar comentário para documentação
COMMENT ON COLUMN animals.category IS 'Categoria do animal: Garanhão (reprodutor macho), Doadora (reprodutora fêmea) ou Outro';

-- Log de sucesso
DO $$
BEGIN
  RAISE NOTICE 'Migration 034: Campo category adicionado com sucesso à tabela animals';
END $$;


