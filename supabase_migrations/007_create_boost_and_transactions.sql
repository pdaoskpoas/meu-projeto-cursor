-- =====================================================
-- MIGRAÇÃO 007: SISTEMA DE BOOST E TRANSAÇÕES
-- Data: 30/09/2025
-- Descrição: Criar tabelas de histórico de boost e transações financeiras
-- =====================================================

-- =====================================================
-- HISTÓRICO DE BOOSTS
-- =====================================================
CREATE TABLE boost_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Identificação
  content_type TEXT CHECK (content_type IN ('animal', 'event')) NOT NULL,
  content_id UUID NOT NULL,
  
  -- Usuário que fez o boost
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Detalhes do boost
  boost_type TEXT CHECK (boost_type IN ('plan_included', 'purchased')) NOT NULL,
  duration_hours INTEGER DEFAULT 24,
  cost DECIMAL DEFAULT 0,
  
  -- Período
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours'),
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- HISTÓRICO DE TRANSAÇÕES (PARA STRIPE)
-- =====================================================
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Usuário
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Stripe
  stripe_payment_intent_id TEXT UNIQUE,
  stripe_subscription_id TEXT,
  
  -- Detalhes da transação
  type TEXT CHECK (type IN ('plan_subscription', 'boost_purchase', 'individual_ad')) NOT NULL,
  amount DECIMAL NOT NULL,
  currency TEXT DEFAULT 'BRL',
  
  -- Produto comprado
  plan_type TEXT,
  boost_quantity INTEGER,
  is_annual BOOLEAN DEFAULT FALSE,
  
  -- Status
  status TEXT CHECK (status IN ('pending', 'completed', 'failed', 'refunded')) DEFAULT 'pending',
  
  -- Metadados
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para Boost History
CREATE INDEX idx_boost_history_content ON boost_history(content_type, content_id);
CREATE INDEX idx_boost_history_user_id ON boost_history(user_id);
CREATE INDEX idx_boost_history_active ON boost_history(is_active);
CREATE INDEX idx_boost_history_expires_at ON boost_history(expires_at);
CREATE INDEX idx_boost_history_started_at ON boost_history(started_at);

-- Índices para Transactions
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_stripe_payment_intent ON transactions(stripe_payment_intent_id);
CREATE INDEX idx_transactions_stripe_subscription ON transactions(stripe_subscription_id);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);

-- Comentários para documentação
COMMENT ON TABLE boost_history IS 'Histórico de impulsionamentos (boosts) de animais e eventos';
COMMENT ON TABLE transactions IS 'Histórico de transações financeiras (integração com Stripe)';
COMMENT ON COLUMN boost_history.boost_type IS 'Tipo do boost: plan_included (incluído no plano) ou purchased (comprado avulso)';
COMMENT ON COLUMN boost_history.duration_hours IS 'Duração do boost em horas (padrão 24h)';
COMMENT ON COLUMN transactions.type IS 'Tipo da transação: plan_subscription, boost_purchase, individual_ad';
COMMENT ON COLUMN transactions.metadata IS 'Dados adicionais da transação em formato JSON';





