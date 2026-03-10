-- =====================================================
-- MIGRAÇÃO 083: Sistema de Pagamentos Asaas.com
-- Descrição: Cria infraestrutura completa para integração com Asaas
-- Conformidade: LGPD + CDC (Código de Defesa do Consumidor)
-- Data: 2025-11-27
-- Autor: Sistema Cavalaria Digital
-- =====================================================

-- PARTE 1: TABELAS PRINCIPAIS
-- =====================================================

-- 1.1. Tabela de Clientes Asaas
-- Vincula usuários do sistema com clientes criados no Asaas
CREATE TABLE IF NOT EXISTS asaas_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  asaas_customer_id TEXT NOT NULL UNIQUE,
  
  -- Dados básicos (cache para consulta rápida)
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  cpf_cnpj TEXT, -- LGPD: necessário para pagamentos (base legal = execução de contrato Art. 7º, V)
  phone TEXT,
  
  -- Controle e sincronização
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  last_synced_at TIMESTAMPTZ DEFAULT now(),
  
  -- Garantir unicidade
  CONSTRAINT unique_user_asaas UNIQUE(user_id)
);

COMMENT ON TABLE asaas_customers IS 'Clientes cadastrados no Asaas.com - vínculo com usuários do sistema';
COMMENT ON COLUMN asaas_customers.asaas_customer_id IS 'ID do cliente no Asaas (formato: cus_xxxxx)';
COMMENT ON COLUMN asaas_customers.cpf_cnpj IS 'CPF/CNPJ - armazenado para fins de cobrança (LGPD Art. 7º, V - execução de contrato)';

-- 1.2. Tabela de Assinaturas
-- Gerencia assinaturas mensais e anuais dos planos
CREATE TABLE IF NOT EXISTS asaas_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  asaas_customer_id UUID NOT NULL REFERENCES asaas_customers(id) ON DELETE CASCADE,
  asaas_subscription_id TEXT UNIQUE,
  
  -- Detalhes da assinatura
  plan_type TEXT NOT NULL CHECK (plan_type IN ('basic', 'pro', 'ultra', 'vip')),
  billing_type TEXT NOT NULL CHECK (billing_type IN ('monthly', 'annual')),
  value NUMERIC(10,2) NOT NULL,
  
  -- Status da assinatura
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',      -- Aguardando primeiro pagamento
    'active',       -- Ativa e funcionando
    'suspended',    -- Suspensa por falta de pagamento
    'cancelled',    -- Cancelada pelo usuário
    'expired'       -- Expirada naturalmente
  )),
  
  -- Datas importantes
  started_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  next_due_date TIMESTAMPTZ,
  
  -- Controle de renovação
  auto_renew BOOLEAN DEFAULT true,
  
  -- Reembolso (CDC - 7 dias)
  can_refund BOOLEAN DEFAULT true,
  refund_deadline TIMESTAMPTZ, -- 7 dias após primeiro pagamento confirmado
  first_payment_at TIMESTAMPTZ, -- Data do primeiro pagamento confirmado
  
  -- Metadados adicionais
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE asaas_subscriptions IS 'Assinaturas de planos gerenciadas pelo Asaas';
COMMENT ON COLUMN asaas_subscriptions.refund_deadline IS 'Data limite para reembolso - 7 dias após primeiro pagamento (CDC Art. 49)';
COMMENT ON COLUMN asaas_subscriptions.can_refund IS 'Se ainda está dentro do período de reembolso de 7 dias';
COMMENT ON COLUMN asaas_subscriptions.billing_type IS 'monthly = recorrente mensal | annual = pagamento único para 12 meses';

-- 1.3. Tabela de Pagamentos/Cobranças
-- Registra todas as cobranças individuais criadas no Asaas
CREATE TABLE IF NOT EXISTS asaas_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  asaas_customer_id UUID NOT NULL REFERENCES asaas_customers(id) ON DELETE CASCADE,
  asaas_payment_id TEXT NOT NULL UNIQUE,
  
  -- Tipo de pagamento
  payment_type TEXT NOT NULL CHECK (payment_type IN (
    'subscription',      -- Pagamento de assinatura mensal/anual
    'boost_purchase',    -- Compra de boost avulso
    'individual_ad',     -- Anúncio individual (animal)
    'individual_event'   -- Evento individual
  )),
  
  -- Relacionamentos opcionais
  subscription_id UUID REFERENCES asaas_subscriptions(id) ON DELETE SET NULL,
  related_content_type TEXT CHECK (related_content_type IN ('animal', 'event')),
  related_content_id UUID,
  
  -- Detalhes financeiros
  value NUMERIC(10,2) NOT NULL,
  net_value NUMERIC(10,2), -- Valor líquido após taxas Asaas
  original_value NUMERIC(10,2), -- Valor original antes de descontos
  discount_value NUMERIC(10,2) DEFAULT 0,
  
  -- Método de pagamento
  billing_type TEXT NOT NULL CHECK (billing_type IN ('CREDIT_CARD', 'PIX', 'BOLETO', 'UNDEFINED')),
  
  -- Status do pagamento (conforme API Asaas)
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',           -- Aguardando pagamento
    'confirmed',         -- Pagamento confirmado
    'received',          -- Recebido
    'overdue',           -- Vencido
    'refunded',          -- Reembolsado
    'received_in_cash',  -- Recebido em dinheiro
    'refund_requested',  -- Reembolso solicitado
    'chargeback_requested', -- Chargeback solicitado
    'chargeback_dispute',   -- Disputa de chargeback
    'awaiting_chargeback_reversal', -- Aguardando reversão
    'dunning_requested', -- Cobrança solicitada
    'dunning_received',  -- Cobrança recebida
    'awaiting_risk_analysis' -- Aguardando análise de risco
  )),
  
  -- Datas
  due_date DATE NOT NULL,
  payment_date TIMESTAMPTZ,
  confirmed_at TIMESTAMPTZ,
  
  -- URLs de pagamento (Asaas)
  invoice_url TEXT,
  bank_slip_url TEXT,
  pix_qr_code TEXT,
  pix_copy_paste TEXT,
  
  -- Parcelamento (para planos anuais)
  installment_count INTEGER DEFAULT 1,
  installment_number INTEGER DEFAULT 1,
  
  -- Controle e metadados
  description TEXT,
  external_reference TEXT, -- Referência externa para rastreamento
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE asaas_payments IS 'Pagamentos e cobranças individuais processados pelo Asaas';
COMMENT ON COLUMN asaas_payments.asaas_payment_id IS 'ID do pagamento no Asaas (formato: pay_xxxxx)';
COMMENT ON COLUMN asaas_payments.pix_copy_paste IS 'Código Pix Copia e Cola (válido por tempo limitado)';
COMMENT ON COLUMN asaas_payments.installment_count IS 'Quantidade de parcelas (para planos anuais - máx 12x)';

-- 1.4. Tabela de Webhooks do Asaas
-- Log completo de todos os webhooks recebidos
CREATE TABLE IF NOT EXISTS asaas_webhooks_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Tipo de evento
  event_type TEXT NOT NULL,
  asaas_payment_id TEXT,
  asaas_subscription_id TEXT,
  
  -- Payload completo (para auditoria)
  payload JSONB NOT NULL,
  
  -- Status de processamento
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMPTZ,
  processing_error TEXT,
  retry_count INTEGER DEFAULT 0,
  
  -- Segurança e validação
  signature TEXT,
  ip_address INET,
  user_agent TEXT,
  is_valid_signature BOOLEAN DEFAULT false,
  
  -- Timestamps
  received_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE asaas_webhooks_log IS 'Log de todos os webhooks recebidos do Asaas para auditoria e troubleshooting';
COMMENT ON COLUMN asaas_webhooks_log.is_valid_signature IS 'Se a assinatura do webhook foi validada com sucesso';
COMMENT ON COLUMN asaas_webhooks_log.payload IS 'Payload completo do webhook em JSON (para análise posterior)';

-- 1.5. Tabela de Reembolsos
-- Controle manual de reembolsos (CDC - 7 dias)
CREATE TABLE IF NOT EXISTS refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL REFERENCES asaas_payments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  asaas_refund_id TEXT,
  
  -- Detalhes do reembolso
  amount NUMERIC(10,2) NOT NULL,
  reason TEXT NOT NULL,
  refund_type TEXT NOT NULL CHECK (refund_type IN (
    'full',          -- Reembolso total
    'partial',       -- Reembolso parcial
    'chargeback'     -- Chargeback/contestação
  )),
  
  -- Status do reembolso
  status TEXT NOT NULL DEFAULT 'requested' CHECK (status IN (
    'requested',   -- Solicitado pelo usuário
    'approved',    -- Aprovado pelo admin
    'processing',  -- Em processamento no Asaas
    'completed',   -- Concluído
    'rejected',    -- Rejeitado
    'failed'       -- Falhou
  )),
  
  -- Processamento administrativo
  processed_by UUID REFERENCES profiles(id),
  processed_at TIMESTAMPTZ,
  admin_notes TEXT,
  
  -- Dados do solicitante
  user_notes TEXT,
  requested_at TIMESTAMPTZ DEFAULT now(),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE refunds IS 'Controle manual de reembolsos dentro do período de 7 dias (CDC Art. 49)';
COMMENT ON COLUMN refunds.reason IS 'Motivo do reembolso fornecido pelo usuário';
COMMENT ON COLUMN refunds.admin_notes IS 'Notas do administrador sobre o processamento do reembolso';

-- 1.6. Tabela de Auditoria de Pagamentos (LGPD)
-- Auditoria imutável de todas as operações
CREATE TABLE IF NOT EXISTS payment_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Entidade afetada
  entity_type TEXT NOT NULL CHECK (entity_type IN ('payment', 'subscription', 'refund', 'customer')),
  entity_id UUID NOT NULL,
  
  -- Ação realizada
  action TEXT NOT NULL CHECK (action IN (
    'created', 'updated', 'deleted', 'status_changed',
    'refunded', 'cancelled', 'suspended', 'reactivated'
  )),
  
  -- Dados da mudança (para conformidade LGPD)
  old_data JSONB,
  new_data JSONB,
  changes JSONB, -- Diff específico das mudanças
  
  -- Quem realizou a ação
  performed_by UUID, -- NULL = sistema automático
  performed_by_type TEXT DEFAULT 'system' CHECK (performed_by_type IN ('user', 'admin', 'system', 'webhook')),
  
  -- Contexto da ação
  ip_address INET,
  user_agent TEXT,
  reason TEXT,
  
  -- Timestamp (imutável)
  created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE payment_audit_log IS 'Auditoria imutável de todas as operações de pagamento - conformidade LGPD Art. 37';
COMMENT ON COLUMN payment_audit_log.performed_by_type IS 'Tipo de entidade que realizou a ação';
COMMENT ON COLUMN payment_audit_log.changes IS 'Diferença específica entre old_data e new_data';

-- PARTE 2: ATUALIZAR TABELA TRANSACTIONS
-- =====================================================

-- Adicionar campos do Asaas na tabela transactions existente
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS asaas_payment_id TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS asaas_subscription_id TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS asaas_customer_id TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS billing_type TEXT CHECK (billing_type IN ('CREDIT_CARD', 'PIX', 'BOLETO', 'UNDEFINED'));

COMMENT ON COLUMN transactions.asaas_payment_id IS 'ID do pagamento no Asaas (para referência cruzada)';
COMMENT ON COLUMN transactions.asaas_subscription_id IS 'ID da assinatura no Asaas (para referência cruzada)';

-- PARTE 3: ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices para asaas_customers
CREATE INDEX IF NOT EXISTS idx_asaas_customers_user_id ON asaas_customers(user_id);
CREATE INDEX IF NOT EXISTS idx_asaas_customers_asaas_id ON asaas_customers(asaas_customer_id);
CREATE INDEX IF NOT EXISTS idx_asaas_customers_active ON asaas_customers(is_active) WHERE is_active = true;

-- Índices para asaas_subscriptions
CREATE INDEX IF NOT EXISTS idx_asaas_subscriptions_user_id ON asaas_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_asaas_subscriptions_status ON asaas_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_asaas_subscriptions_expires_at ON asaas_subscriptions(expires_at) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_asaas_subscriptions_next_due ON asaas_subscriptions(next_due_date) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_asaas_subscriptions_refund ON asaas_subscriptions(refund_deadline) WHERE can_refund = true;

-- Índices para asaas_payments
CREATE INDEX IF NOT EXISTS idx_asaas_payments_user_id ON asaas_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_asaas_payments_status ON asaas_payments(status);
CREATE INDEX IF NOT EXISTS idx_asaas_payments_asaas_id ON asaas_payments(asaas_payment_id);
CREATE INDEX IF NOT EXISTS idx_asaas_payments_due_date ON asaas_payments(due_date);
CREATE INDEX IF NOT EXISTS idx_asaas_payments_type ON asaas_payments(payment_type);
CREATE INDEX IF NOT EXISTS idx_asaas_payments_subscription ON asaas_payments(subscription_id) WHERE subscription_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_asaas_payments_content ON asaas_payments(related_content_type, related_content_id) WHERE related_content_id IS NOT NULL;

-- Índices para asaas_webhooks_log
CREATE INDEX IF NOT EXISTS idx_asaas_webhooks_processed ON asaas_webhooks_log(processed);
CREATE INDEX IF NOT EXISTS idx_asaas_webhooks_event_type ON asaas_webhooks_log(event_type);
CREATE INDEX IF NOT EXISTS idx_asaas_webhooks_payment_id ON asaas_webhooks_log(asaas_payment_id) WHERE asaas_payment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_asaas_webhooks_created_at ON asaas_webhooks_log(created_at);

-- Índices para refunds
CREATE INDEX IF NOT EXISTS idx_refunds_payment_id ON refunds(payment_id);
CREATE INDEX IF NOT EXISTS idx_refunds_user_id ON refunds(user_id);
CREATE INDEX IF NOT EXISTS idx_refunds_status ON refunds(status);
CREATE INDEX IF NOT EXISTS idx_refunds_requested_at ON refunds(requested_at);

-- Índices para payment_audit_log
CREATE INDEX IF NOT EXISTS idx_payment_audit_entity ON payment_audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_payment_audit_action ON payment_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_payment_audit_created_at ON payment_audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_payment_audit_performed_by ON payment_audit_log(performed_by) WHERE performed_by IS NOT NULL;

-- PARTE 4: ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE asaas_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE asaas_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE asaas_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE asaas_webhooks_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_audit_log ENABLE ROW LEVEL SECURITY;

-- 4.1. Políticas para ASAAS_CUSTOMERS

-- Usuários podem ver apenas seus próprios dados
CREATE POLICY "Users can view own customer data" ON asaas_customers
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Admins podem ver todos os dados
CREATE POLICY "Admins can view all customer data" ON asaas_customers
  FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Service role pode fazer tudo (para webhooks e integrações)
CREATE POLICY "Service role can manage customers" ON asaas_customers
  FOR ALL 
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- 4.2. Políticas para ASAAS_SUBSCRIPTIONS

CREATE POLICY "Users can view own subscriptions" ON asaas_subscriptions
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all subscriptions" ON asaas_subscriptions
  FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Service role can manage subscriptions" ON asaas_subscriptions
  FOR ALL 
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- 4.3. Políticas para ASAAS_PAYMENTS

CREATE POLICY "Users can view own payments" ON asaas_payments
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all payments" ON asaas_payments
  FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Service role can manage payments" ON asaas_payments
  FOR ALL 
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- 4.4. Políticas para REFUNDS

CREATE POLICY "Users can view own refunds" ON refunds
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can request refunds" ON refunds
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all refunds" ON refunds
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Service role can manage refunds" ON refunds
  FOR ALL 
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- 4.5. Políticas para ASAAS_WEBHOOKS_LOG

-- Apenas service role pode acessar (webhooks são internos)
CREATE POLICY "Service role can manage webhooks" ON asaas_webhooks_log
  FOR ALL 
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Admins podem visualizar para debugging
CREATE POLICY "Admins can view webhooks" ON asaas_webhooks_log
  FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 4.6. Políticas para PAYMENT_AUDIT_LOG

-- Todos usuários autenticados podem ver o audit log (transparência LGPD)
CREATE POLICY "Authenticated users can view audit log" ON payment_audit_log
  FOR SELECT 
  USING (auth.role() = 'authenticated');

-- Apenas service role pode inserir (auditoria é automática)
CREATE POLICY "Service role can insert audit log" ON payment_audit_log
  FOR INSERT 
  WITH CHECK (auth.role() = 'service_role');

-- PARTE 5: TRIGGERS E FUNÇÕES
-- =====================================================

-- 5.1. Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger em todas as tabelas relevantes
CREATE TRIGGER update_asaas_customers_updated_at 
  BEFORE UPDATE ON asaas_customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_asaas_subscriptions_updated_at 
  BEFORE UPDATE ON asaas_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_asaas_payments_updated_at 
  BEFORE UPDATE ON asaas_payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_refunds_updated_at 
  BEFORE UPDATE ON refunds
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5.2. Função para registrar auditoria automaticamente
CREATE OR REPLACE FUNCTION log_payment_audit()
RETURNS TRIGGER AS $$
BEGIN
  -- Registra a mudança no audit log
  INSERT INTO payment_audit_log (
    entity_type,
    entity_id,
    action,
    old_data,
    new_data,
    performed_by_type
  ) VALUES (
    TG_TABLE_NAME::TEXT,
    COALESCE(NEW.id, OLD.id),
    CASE 
      WHEN TG_OP = 'INSERT' THEN 'created'
      WHEN TG_OP = 'UPDATE' THEN 'updated'
      WHEN TG_OP = 'DELETE' THEN 'deleted'
    END,
    to_jsonb(OLD),
    to_jsonb(NEW),
    'system'
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aplicar trigger de auditoria nas tabelas principais
CREATE TRIGGER audit_asaas_payments
  AFTER INSERT OR UPDATE OR DELETE ON asaas_payments
  FOR EACH ROW EXECUTE FUNCTION log_payment_audit();

CREATE TRIGGER audit_asaas_subscriptions
  AFTER INSERT OR UPDATE OR DELETE ON asaas_subscriptions
  FOR EACH ROW EXECUTE FUNCTION log_payment_audit();

CREATE TRIGGER audit_refunds
  AFTER INSERT OR UPDATE OR DELETE ON refunds
  FOR EACH ROW EXECUTE FUNCTION log_payment_audit();

-- 5.3. Função para atualizar perfil do usuário quando assinatura é ativada
CREATE OR REPLACE FUNCTION update_profile_on_subscription_active()
RETURNS TRIGGER AS $$
BEGIN
  -- Apenas processa se status mudou para 'active'
  IF NEW.status = 'active' AND (OLD IS NULL OR OLD.status != 'active') THEN
    -- Atualizar o plano no perfil do usuário
    UPDATE profiles SET
      plan = NEW.plan_type,
      plan_expires_at = NEW.expires_at,
      plan_purchased_at = NEW.started_at,
      is_annual_plan = (NEW.billing_type = 'annual'),
      updated_at = now()
    WHERE id = NEW.user_id;
    
    -- Definir deadline de reembolso (7 dias após primeiro pagamento)
    IF NEW.first_payment_at IS NOT NULL AND NEW.refund_deadline IS NULL THEN
      UPDATE asaas_subscriptions 
      SET refund_deadline = NEW.first_payment_at + INTERVAL '7 days'
      WHERE id = NEW.id;
    END IF;
  END IF;
  
  -- Se assinatura foi cancelada, voltar para free
  IF NEW.status IN ('cancelled', 'expired', 'suspended') AND OLD.status = 'active' THEN
    UPDATE profiles SET
      plan = 'free',
      plan_expires_at = NULL,
      is_annual_plan = false,
      updated_at = now()
    WHERE id = NEW.user_id;
    
    -- Pausar todos os anúncios do usuário
    UPDATE animals SET
      ad_status = 'paused',
      updated_at = now()
    WHERE owner_id = NEW.user_id AND ad_status = 'active' AND is_individual_paid = false;
    
    UPDATE events SET
      ad_status = 'paused',
      updated_at = now()
    WHERE organizer_id = NEW.user_id AND ad_status = 'active' AND is_individual_paid = false;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER sync_profile_on_subscription_change
  AFTER INSERT OR UPDATE ON asaas_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_profile_on_subscription_active();

-- 5.4. Função para verificar e atualizar status de reembolso
CREATE OR REPLACE FUNCTION check_refund_eligibility()
RETURNS TRIGGER AS $$
BEGIN
  -- Verificar se ainda está dentro do prazo de 7 dias
  IF NEW.refund_deadline IS NOT NULL AND NEW.refund_deadline < now() THEN
    NEW.can_refund = false;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_subscription_refund
  BEFORE UPDATE ON asaas_subscriptions
  FOR EACH ROW EXECUTE FUNCTION check_refund_eligibility();

-- PARTE 6: VIEWS ÚTEIS
-- =====================================================

-- View para listar assinaturas ativas com detalhes
CREATE OR REPLACE VIEW active_subscriptions AS
SELECT 
  s.id,
  s.user_id,
  p.name as user_name,
  p.email as user_email,
  s.plan_type,
  s.billing_type,
  s.value,
  s.status,
  s.started_at,
  s.expires_at,
  s.next_due_date,
  s.can_refund,
  s.refund_deadline,
  c.asaas_customer_id
FROM asaas_subscriptions s
JOIN profiles p ON p.id = s.user_id
JOIN asaas_customers c ON c.id = s.asaas_customer_id
WHERE s.status = 'active';

-- View para pagamentos pendentes
CREATE OR REPLACE VIEW pending_payments AS
SELECT 
  pay.id,
  pay.user_id,
  p.name as user_name,
  p.email as user_email,
  pay.payment_type,
  pay.value,
  pay.billing_type,
  pay.status,
  pay.due_date,
  pay.invoice_url,
  pay.pix_copy_paste,
  pay.created_at
FROM asaas_payments pay
JOIN profiles p ON p.id = pay.user_id
WHERE pay.status IN ('pending', 'overdue');

-- View para reembolsos pendentes (para admins)
CREATE OR REPLACE VIEW pending_refunds AS
SELECT 
  r.id,
  r.user_id,
  p.name as user_name,
  p.email as user_email,
  r.amount,
  r.reason,
  r.user_notes,
  r.refund_type,
  r.status,
  r.requested_at,
  pay.asaas_payment_id
FROM refunds r
JOIN profiles p ON p.id = r.user_id
JOIN asaas_payments pay ON pay.id = r.payment_id
WHERE r.status IN ('requested', 'approved', 'processing');

-- =====================================================
-- FIM DA MIGRAÇÃO 083
-- =====================================================

-- Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE '✅ Migração 083 aplicada com sucesso!';
  RAISE NOTICE '📦 Tabelas criadas: asaas_customers, asaas_subscriptions, asaas_payments, asaas_webhooks_log, refunds, payment_audit_log';
  RAISE NOTICE '🔒 RLS habilitado em todas as tabelas';
  RAISE NOTICE '📊 Views criadas para consultas rápidas';
  RAISE NOTICE '🔄 Triggers configurados para auditoria automática';
END $$;


