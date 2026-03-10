-- =====================================================
-- MIGRAÇÃO 005: SISTEMA DE ANALYTICS
-- Data: 30/09/2025
-- Descrição: Criar tabelas para sistema de impressões e cliques
-- =====================================================

-- =====================================================
-- SISTEMA DE ANALYTICS - IMPRESSÕES
-- =====================================================
CREATE TABLE impressions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Identificação
  content_type TEXT CHECK (content_type IN ('animal', 'event', 'article')) NOT NULL,
  content_id UUID NOT NULL,
  
  -- Usuário (pode ser null para visitantes)
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  -- Sessão e contexto
  session_id TEXT NOT NULL,
  page_url TEXT,
  referrer TEXT,
  
  -- Localização da impressão
  viewport_position JSONB, -- {top, left, width, height}
  carousel_name TEXT, -- Nome do carrossel se aplicável
  carousel_position INTEGER, -- Posição no carrossel
  
  -- Metadados
  user_agent TEXT,
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- SISTEMA DE ANALYTICS - CLIQUES
-- =====================================================
CREATE TABLE clicks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Identificação
  content_type TEXT CHECK (content_type IN ('animal', 'event', 'article')) NOT NULL,
  content_id UUID NOT NULL,
  
  -- Usuário (pode ser null para visitantes)
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  -- Sessão e contexto
  session_id TEXT NOT NULL,
  page_url TEXT,
  referrer TEXT,
  click_target TEXT, -- Elemento clicado (botão, link, card, etc.)
  
  -- Metadados
  user_agent TEXT,
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para Analytics
CREATE INDEX idx_impressions_content ON impressions(content_type, content_id);
CREATE INDEX idx_impressions_user_id ON impressions(user_id);
CREATE INDEX idx_impressions_session ON impressions(session_id);
CREATE INDEX idx_impressions_created_at ON impressions(created_at);
CREATE INDEX idx_impressions_carousel ON impressions(carousel_name) WHERE carousel_name IS NOT NULL;

CREATE INDEX idx_clicks_content ON clicks(content_type, content_id);
CREATE INDEX idx_clicks_user_id ON clicks(user_id);
CREATE INDEX idx_clicks_session ON clicks(session_id);
CREATE INDEX idx_clicks_created_at ON clicks(created_at);

-- Comentários para documentação
COMMENT ON TABLE impressions IS 'Registro de impressões (visualizações) de conteúdo';
COMMENT ON TABLE clicks IS 'Registro de cliques em conteúdo';
COMMENT ON COLUMN impressions.content_type IS 'Tipo de conteúdo: animal, event, article';
COMMENT ON COLUMN impressions.viewport_position IS 'Posição do elemento na tela quando foi visualizado';
COMMENT ON COLUMN impressions.carousel_name IS 'Nome do carrossel onde o item foi visualizado';
COMMENT ON COLUMN clicks.click_target IS 'Elemento específico que foi clicado';





