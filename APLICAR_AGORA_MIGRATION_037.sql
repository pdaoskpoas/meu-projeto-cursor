-- =====================================================
-- Migration: Adicionar colunas de pagamento faltantes para eventos
-- Descrição: Adiciona plan_type, payment_status e payment_id
--            para controlar sistema de pagamentos de eventos
-- Data: 2025-11-03
-- Status: ❌ PENDENTE DE APLICAÇÃO
-- =====================================================

-- Adicionar colunas de pagamento
ALTER TABLE events
ADD COLUMN IF NOT EXISTS plan_type TEXT
  CHECK (plan_type IN ('free', 'basic', 'pro', 'elite', 'vip', 'individual')),
ADD COLUMN IF NOT EXISTS payment_status TEXT
  CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded'))
  DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS payment_id UUID;

-- Comentários para documentação
COMMENT ON COLUMN events.plan_type IS 'Tipo de plano associado ao evento (free, basic, pro, elite, vip, individual)';
COMMENT ON COLUMN events.payment_status IS 'Status do pagamento do evento (pending, completed, failed, refunded)';
COMMENT ON COLUMN events.payment_id IS 'ID da transação de pagamento associada a este evento';

-- Adicionar foreign key para payment_id (referência à tabela transactions)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'transactions') THEN
    -- Remover constraint se já existir (evitar erro)
    IF EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE constraint_name = 'events_payment_id_fkey'
      AND table_name = 'events'
    ) THEN
      ALTER TABLE events DROP CONSTRAINT events_payment_id_fkey;
    END IF;
    
    -- Adicionar nova constraint
    ALTER TABLE events
    ADD CONSTRAINT events_payment_id_fkey
    FOREIGN KEY (payment_id) REFERENCES public.transactions(id)
    ON DELETE SET NULL;
  END IF;
END $$;

-- Criar índice para otimizar consultas por payment_id
CREATE INDEX IF NOT EXISTS idx_events_payment_id ON events(payment_id) WHERE payment_id IS NOT NULL;

-- Log de sucesso
DO $$
BEGIN
  RAISE NOTICE 'Migration 037: Colunas de pagamento adicionadas com sucesso à tabela events';
END $$;


