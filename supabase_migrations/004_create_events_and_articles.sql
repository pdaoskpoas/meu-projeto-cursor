-- =====================================================
-- MIGRAÇÃO 004: EVENTOS E ARTIGOS
-- Data: 30/09/2025
-- Descrição: Criar tabelas de eventos e artigos/notícias
-- =====================================================

-- =====================================================
-- TABELA DE EVENTOS
-- =====================================================
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Informações básicas
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT,
  
  -- Data e local
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE,
  location TEXT,
  city TEXT,
  state TEXT,
  
  -- Organização
  organizer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  max_participants INTEGER,
  registration_deadline TIMESTAMP WITH TIME ZONE,
  
  -- Status do anúncio
  ad_status TEXT CHECK (ad_status IN ('active', 'paused', 'expired', 'draft')) DEFAULT 'active',
  published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'),
  
  -- Boost
  is_boosted BOOLEAN DEFAULT FALSE,
  boost_expires_at TIMESTAMP WITH TIME ZONE,
  boosted_by UUID REFERENCES profiles(id),
  boosted_at TIMESTAMP WITH TIME ZONE,
  
  -- Configurações
  can_edit BOOLEAN DEFAULT TRUE,
  cover_image_url TEXT,
  
  -- Metadados
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABELA DE ARTIGOS/NOTÍCIAS
-- =====================================================
CREATE TABLE articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  author_id UUID REFERENCES profiles(id),
  category TEXT,
  tags TEXT[] DEFAULT '{}',
  cover_image_url TEXT,
  published_at TIMESTAMP WITH TIME ZONE,
  is_published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para events
CREATE INDEX idx_events_organizer_id ON events(organizer_id);
CREATE INDEX idx_events_start_date ON events(start_date);
CREATE INDEX idx_events_ad_status ON events(ad_status);
CREATE INDEX idx_events_is_boosted ON events(is_boosted);
CREATE INDEX idx_events_city_state ON events(city, state);

-- Índices para articles
CREATE INDEX idx_articles_author_id ON articles(author_id);
CREATE INDEX idx_articles_published_at ON articles(published_at);
CREATE INDEX idx_articles_is_published ON articles(is_published);
CREATE INDEX idx_articles_category ON articles(category);

-- Comentários para documentação
COMMENT ON TABLE events IS 'Eventos cadastrados no sistema';
COMMENT ON TABLE articles IS 'Artigos e notícias do sistema';
COMMENT ON COLUMN events.ad_status IS 'Status do anúncio do evento: active, paused, expired, draft';
COMMENT ON COLUMN events.is_boosted IS 'Se o evento está atualmente impulsionado';
COMMENT ON COLUMN events.can_edit IS 'Se o evento pode ser editado (false após boost ou 24h)';





