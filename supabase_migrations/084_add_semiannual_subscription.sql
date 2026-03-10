-- =====================================================
-- MIGRAÇÃO 084: Adicionar billing_type semestral
-- =====================================================

DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'asaas_subscriptions_billing_type_check'
  ) THEN
    ALTER TABLE asaas_subscriptions
      DROP CONSTRAINT asaas_subscriptions_billing_type_check;
  END IF;
END $$;

ALTER TABLE asaas_subscriptions
  ADD CONSTRAINT asaas_subscriptions_billing_type_check
  CHECK (billing_type IN ('monthly', 'annual', 'semiannual'));
