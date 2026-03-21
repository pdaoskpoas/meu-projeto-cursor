-- =================================================================
-- 098: WEBHOOK IDEMPOTENCY & SECURITY HARDENING
-- =================================================================
-- Adds idempotency_key UNIQUE column to asaas_webhooks_log
-- Adds index for fast duplicate lookups
-- Adds PIX data cleanup function for LGPD compliance
-- Adds rate limiting integration for payment Edge Functions
-- =================================================================

-- 1. Add idempotency_key column with UNIQUE constraint
ALTER TABLE asaas_webhooks_log
  ADD COLUMN IF NOT EXISTS idempotency_key TEXT;

-- Create unique index (allows NULLs for old rows, enforces uniqueness for new ones)
CREATE UNIQUE INDEX IF NOT EXISTS idx_webhooks_idempotency_key
  ON asaas_webhooks_log (idempotency_key)
  WHERE idempotency_key IS NOT NULL;

-- Index for faster lookups by payment_id + event_type
CREATE INDEX IF NOT EXISTS idx_webhooks_payment_event
  ON asaas_webhooks_log (asaas_payment_id, event_type)
  WHERE asaas_payment_id IS NOT NULL;

-- Index for faster lookups by subscription_id + event_type
CREATE INDEX IF NOT EXISTS idx_webhooks_subscription_event
  ON asaas_webhooks_log (asaas_subscription_id, event_type)
  WHERE asaas_subscription_id IS NOT NULL;

-- 2. LGPD: Function to clear PIX data after payment confirmation
-- PIX QR codes and copy-paste codes should not be stored indefinitely
CREATE OR REPLACE FUNCTION clear_pix_data_on_confirmation()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IN ('confirmed', 'received') AND OLD.status NOT IN ('confirmed', 'received') THEN
    NEW.pix_qr_code := NULL;
    NEW.pix_copy_paste := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists to allow re-run
DROP TRIGGER IF EXISTS trg_clear_pix_on_confirmation ON asaas_payments;

CREATE TRIGGER trg_clear_pix_on_confirmation
  BEFORE UPDATE ON asaas_payments
  FOR EACH ROW
  EXECUTE FUNCTION clear_pix_data_on_confirmation();

-- 3. Clean up any existing PIX data on already-confirmed payments (LGPD retroactive)
UPDATE asaas_payments
SET pix_qr_code = NULL,
    pix_copy_paste = NULL
WHERE status IN ('confirmed', 'received', 'refunded')
  AND (pix_qr_code IS NOT NULL OR pix_copy_paste IS NOT NULL);

-- 4. Add request metadata columns to webhook log for audit trail
ALTER TABLE asaas_webhooks_log
  ADD COLUMN IF NOT EXISTS request_ip TEXT,
  ADD COLUMN IF NOT EXISTS request_user_agent TEXT;

-- 5. Ensure rate_limit_tracker has proper indexes for Edge Function lookups
CREATE INDEX IF NOT EXISTS idx_rate_limit_tracker_lookup
  ON rate_limit_tracker (identifier, action, window_start);
