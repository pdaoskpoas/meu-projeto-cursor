-- Newsletter subscriptions captured from public pages.
CREATE TABLE IF NOT EXISTS public.newsletter_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  source TEXT NOT NULL DEFAULT 'site_home',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_newsletter_subscriptions_created_at
  ON public.newsletter_subscriptions (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_newsletter_subscriptions_email
  ON public.newsletter_subscriptions (email);

ALTER TABLE public.newsletter_subscriptions ENABLE ROW LEVEL SECURITY;

-- Public users can subscribe.
DROP POLICY IF EXISTS "newsletter_insert_public" ON public.newsletter_subscriptions;
CREATE POLICY "newsletter_insert_public"
  ON public.newsletter_subscriptions
  FOR INSERT
  WITH CHECK (true);

-- Only admins can read subscriptions.
DROP POLICY IF EXISTS "newsletter_select_admin" ON public.newsletter_subscriptions;
CREATE POLICY "newsletter_select_admin"
  ON public.newsletter_subscriptions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- Only admins can delete subscriptions.
DROP POLICY IF EXISTS "newsletter_delete_admin" ON public.newsletter_subscriptions;
CREATE POLICY "newsletter_delete_admin"
  ON public.newsletter_subscriptions
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );
