-- Step 1: Add columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS event_publications_used_this_month INT DEFAULT 0;

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS event_publications_reset_at TIMESTAMPTZ 
DEFAULT DATE_TRUNC('month', NOW()) + INTERVAL '1 month';

-- Step 2: Add column to events table
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS can_edit_until TIMESTAMPTZ;

-- Step 3: Create indexes
CREATE INDEX IF NOT EXISTS idx_profiles_event_pub_reset 
ON profiles(event_publications_reset_at);

CREATE INDEX IF NOT EXISTS idx_events_can_edit 
ON events(can_edit_until);

-- Step 4: Function to get monthly quota
CREATE OR REPLACE FUNCTION get_event_monthly_quota(user_plan TEXT)
RETURNS INT
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN CASE 
    WHEN user_plan IN ('pro', 'pro_annual') THEN 1
    WHEN user_plan IN ('ultra', 'ultra_annual') THEN 2
    ELSE 0
  END;
END;
$$;

GRANT EXECUTE ON FUNCTION get_event_monthly_quota TO authenticated;

-- Step 5: Function to reset monthly publications
CREATE OR REPLACE FUNCTION reset_monthly_event_publications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  reset_count INT := 0;
BEGIN
  UPDATE profiles
  SET 
    event_publications_used_this_month = 0,
    event_publications_reset_at = DATE_TRUNC('month', NOW()) + INTERVAL '1 month'
  WHERE event_publications_reset_at <= NOW();
  
  GET DIAGNOSTICS reset_count = ROW_COUNT;
  RAISE NOTICE 'Reset completed for % users', reset_count;
END;
$$;

GRANT EXECUTE ON FUNCTION reset_monthly_event_publications TO authenticated;

-- Step 6: Function to check if user can create event
CREATE OR REPLACE FUNCTION can_create_event(user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_plan TEXT;
  v_plan_expires_at TIMESTAMPTZ;
  v_plan_is_valid BOOLEAN;
  v_publications_used INT;
  v_publications_quota INT;
  v_publications_available INT;
  v_active_events_count INT;
  v_reset_at TIMESTAMPTZ;
BEGIN
  SELECT plan, plan_expires_at, event_publications_used_this_month, event_publications_reset_at
  INTO v_plan, v_plan_expires_at, v_publications_used, v_reset_at
  FROM profiles
  WHERE id = user_id;

  IF v_plan IS NULL THEN
    RETURN jsonb_build_object(
      'can_create', false,
      'reason', 'user_not_found',
      'message', 'User not found',
      'current_count', 0,
      'event_limit', 1,
      'publications_used', 0,
      'publications_quota', 0
    );
  END IF;

  v_plan_is_valid := (v_plan IS NOT NULL AND v_plan != 'free' AND (v_plan_expires_at IS NULL OR v_plan_expires_at > NOW()));
  v_publications_quota := get_event_monthly_quota(v_plan);
  v_publications_available := GREATEST(0, v_publications_quota - v_publications_used);

  SELECT COUNT(*)::INT INTO v_active_events_count
  FROM events
  WHERE organizer_id = user_id AND ad_status = 'active' AND (expires_at IS NULL OR expires_at > NOW());

  IF v_active_events_count >= 1 THEN
    RETURN jsonb_build_object(
      'can_create', false,
      'reason', 'active_limit_reached',
      'message', 'You already have 1 active event. Delete it or pay R$ 49,99 for individual publication.',
      'current_count', v_active_events_count,
      'event_limit', 1,
      'publications_used', v_publications_used,
      'publications_quota', v_publications_quota,
      'can_upgrade', v_plan IN ('free', 'basic', 'pro', 'pro_annual'),
      'can_pay_individual', true,
      'individual_price', 49.99
    );
  END IF;

  IF NOT v_plan_is_valid OR v_plan = 'free' THEN
    RETURN jsonb_build_object(
      'can_create', false,
      'reason', 'no_active_plan',
      'message', 'You need an active plan or pay R$ 49,99 to publish this event.',
      'current_count', v_active_events_count,
      'event_limit', 1,
      'publications_used', 0,
      'publications_quota', 0,
      'requires_individual_payment', true,
      'can_pay_individual', true,
      'individual_price', 49.99,
      'can_upgrade', true
    );
  END IF;

  IF v_plan IN ('basic', 'basic_annual', 'vip') THEN
    RETURN jsonb_build_object(
      'can_create', false,
      'reason', 'no_monthly_quota',
      'message', 'Your plan does not include event publications. Upgrade to Pro/Elite or pay R$ 49,99.',
      'current_count', v_active_events_count,
      'event_limit', 1,
      'publications_used', 0,
      'publications_quota', 0,
      'can_upgrade', true,
      'can_pay_individual', true,
      'individual_price', 49.99
    );
  END IF;

  IF v_publications_used >= v_publications_quota THEN
    RETURN jsonb_build_object(
      'can_create', false,
      'reason', 'monthly_quota_exhausted',
      'message', format('You have used %s of %s publication(s) this month. Upgrade or pay R$ 49,99.', v_publications_used, v_publications_quota),
      'current_count', v_active_events_count,
      'event_limit', 1,
      'publications_used', v_publications_used,
      'publications_quota', v_publications_quota,
      'reset_at', v_reset_at,
      'can_upgrade', v_plan IN ('pro', 'pro_annual'),
      'can_pay_individual', true,
      'individual_price', 49.99
    );
  END IF;

  RETURN jsonb_build_object(
    'can_create', true,
    'reason', 'within_quota',
    'message', format('You can publish %s event(s). %s publication(s) remaining this month.', v_publications_available, v_publications_available),
    'current_count', v_active_events_count,
    'event_limit', 1,
    'publications_used', v_publications_used,
    'publications_quota', v_publications_quota,
    'publications_available', v_publications_available,
    'reset_at', v_reset_at
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'can_create', false,
    'reason', 'error',
    'message', 'Error checking limits: ' || SQLERRM,
    'current_count', 0,
    'event_limit', 1
  );
END;
$$;

GRANT EXECUTE ON FUNCTION can_create_event TO authenticated;

-- Step 7: Trigger function to increment publication count
CREATE OR REPLACE FUNCTION increment_event_publication_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.ad_status = 'active' 
     AND (NEW.is_individual_paid IS NULL OR NEW.is_individual_paid = false)
     AND (TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.ad_status != 'active'))
  THEN
    UPDATE profiles
    SET event_publications_used_this_month = event_publications_used_this_month + 1
    WHERE id = NEW.organizer_id;
    
    NEW.can_edit_until := NOW() + INTERVAL '24 hours';
    NEW.published_at := NOW();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_increment_event_publication ON events;

CREATE TRIGGER trigger_increment_event_publication
  BEFORE INSERT OR UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION increment_event_publication_count();

-- Step 8: Function to process individual payment
CREATE OR REPLACE FUNCTION process_individual_event_payment(
  p_user_id UUID,
  p_event_id UUID,
  p_payment_method TEXT DEFAULT 'simulated'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_transaction_id UUID;
  v_expires_at TIMESTAMPTZ;
BEGIN
  v_expires_at := NOW() + INTERVAL '30 days';
  
  INSERT INTO transactions (user_id, type, amount, currency, status, metadata)
  VALUES (
    p_user_id,
    'individual_ad',
    49.99,
    'BRL',
    'completed',
    jsonb_build_object('event_id', p_event_id, 'payment_method', p_payment_method, 'duration_days', 30)
  )
  RETURNING id INTO v_transaction_id;

  UPDATE events SET
    is_individual_paid = TRUE,
    individual_paid_expires_at = v_expires_at,
    ad_status = 'active',
    published_at = NOW(),
    expires_at = v_expires_at,
    paused_at = NULL,
    can_edit_until = NOW() + INTERVAL '24 hours'
  WHERE id = p_event_id AND organizer_id = p_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'transaction_id', v_transaction_id,
    'message', 'Payment processed! Your event will be active for 30 days. You have 24h to edit.',
    'expires_at', v_expires_at,
    'can_edit_until', NOW() + INTERVAL '24 hours'
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'message', 'Payment error: ' || SQLERRM
  );
END;
$$;

GRANT EXECUTE ON FUNCTION process_individual_event_payment TO authenticated;

-- Step 9: Update existing events
UPDATE events 
SET can_edit_until = published_at + INTERVAL '24 hours'
WHERE ad_status = 'active' 
  AND published_at > NOW() - INTERVAL '24 hours' 
  AND can_edit_until IS NULL;

UPDATE events 
SET can_edit_until = published_at + INTERVAL '24 hours'
WHERE ad_status = 'active' 
  AND published_at <= NOW() - INTERVAL '24 hours' 
  AND can_edit_until IS NULL;

-- Success
DO $$
BEGIN
  RAISE NOTICE 'Migration 073 applied successfully!';
END $$;


