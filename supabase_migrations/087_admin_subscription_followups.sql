-- =====================================================
-- MIGRAÇÃO 087: Controle de Contato de Assinaturas
-- Data: 29/01/2026
-- Descrição: Registro de contatos e feedbacks para assinaturas expiradas/expirando
-- =====================================================

CREATE TABLE IF NOT EXISTS admin_subscription_followups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  admin_id UUID REFERENCES profiles(id) ON DELETE SET NULL,

  outreach_status TEXT NOT NULL DEFAULT 'pending' CHECK (outreach_status IN (
    'pending',
    'contacted',
    'responded',
    'no_response',
    'wants_return',
    'not_interested'
  )),
  contact_channel TEXT CHECK (contact_channel IN ('whatsapp', 'email', 'phone', 'instagram', 'other')),

  contact_notes TEXT,
  cancellation_reason TEXT,
  feedback TEXT,

  contacted_at TIMESTAMPTZ DEFAULT now(),
  responded_at TIMESTAMPTZ,
  next_follow_up_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE admin_subscription_followups IS 'Registro de contatos administrativos para reativação de assinaturas';
COMMENT ON COLUMN admin_subscription_followups.outreach_status IS 'Status do contato com o usuário';
COMMENT ON COLUMN admin_subscription_followups.cancellation_reason IS 'Motivo informado para cancelamento/expiração';

CREATE INDEX IF NOT EXISTS idx_admin_followups_user_id ON admin_subscription_followups(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_followups_status ON admin_subscription_followups(outreach_status);
CREATE INDEX IF NOT EXISTS idx_admin_followups_contacted_at ON admin_subscription_followups(contacted_at);

ALTER TABLE admin_subscription_followups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage subscription followups" ON admin_subscription_followups
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE OR REPLACE FUNCTION update_admin_followups_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_admin_followups_updated_at
  BEFORE UPDATE ON admin_subscription_followups
  FOR EACH ROW EXECUTE FUNCTION update_admin_followups_updated_at();

-- =====================================================
-- FIM DA MIGRAÇÃO 087
-- =====================================================
