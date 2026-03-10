-- ================================================================
-- EXECUTAR ESTE SQL NO SUPABASE MANUALMENTE
-- ================================================================

-- 1. Adicionar campo 'status' às partnerships
ALTER TABLE animal_partnerships
ADD COLUMN IF NOT EXISTS status TEXT CHECK (status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending';

-- 2. Atualizar sociedades existentes para 'accepted' (compatibilidade)
UPDATE animal_partnerships SET status = 'accepted' WHERE status IS NULL OR status = '';

-- 3. Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_animal_partnerships_status ON animal_partnerships(status);

-- 4. Comentário para documentação
COMMENT ON COLUMN animal_partnerships.status IS 'Status da sociedade: pending (aguardando aceitação), accepted (aceita), rejected (rejeitada)';

-- ================================================================
-- Após executar, delete este arquivo
-- ================================================================


