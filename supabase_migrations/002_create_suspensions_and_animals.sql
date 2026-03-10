-- =====================================================
-- MIGRAÇÃO 002: SUSPENSÕES E ANIMAIS
-- Data: 30/09/2025
-- Descrição: Criar tabelas de suspensões e animais
-- =====================================================

-- =====================================================
-- TABELA DE SUSPENSÕES
-- =====================================================
CREATE TABLE suspensions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  email TEXT,
  cpf TEXT,
  reason TEXT NOT NULL,
  suspended_by UUID REFERENCES profiles(id),
  suspended_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  suspended_until TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABELA DE ANIMAIS
-- =====================================================
CREATE TABLE animals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Informações básicas
  name TEXT NOT NULL,
  breed TEXT NOT NULL,
  gender TEXT CHECK (gender IN ('Macho', 'Fêmea')) NOT NULL,
  birth_date DATE NOT NULL,
  coat TEXT,
  height DECIMAL,
  weight DECIMAL,
  chip TEXT,
  registration_number TEXT,
  
  -- Genealogia
  father_name TEXT,
  mother_name TEXT,
  
  -- Localização
  current_city TEXT,
  current_state TEXT,
  
  -- Propriedade
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  haras_id UUID REFERENCES profiles(id),
  haras_name TEXT,
  
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
  allow_messages BOOLEAN DEFAULT TRUE,
  featured BOOLEAN DEFAULT FALSE,
  can_edit BOOLEAN DEFAULT TRUE,
  
  -- Títulos e conquistas
  titles TEXT[] DEFAULT '{}',
  
  -- Metadados
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para animals
CREATE INDEX idx_animals_owner_id ON animals(owner_id);
CREATE INDEX idx_animals_haras_id ON animals(haras_id);
CREATE INDEX idx_animals_ad_status ON animals(ad_status);
CREATE INDEX idx_animals_is_boosted ON animals(is_boosted);
CREATE INDEX idx_animals_breed ON animals(breed);
CREATE INDEX idx_animals_published_at ON animals(published_at);
CREATE INDEX idx_animals_expires_at ON animals(expires_at);

-- Comentários para documentação
COMMENT ON TABLE suspensions IS 'Histórico de suspensões de usuários';
COMMENT ON TABLE animals IS 'Animais cadastrados no sistema';
COMMENT ON COLUMN animals.ad_status IS 'Status do anúncio: active, paused, expired, draft';
COMMENT ON COLUMN animals.expires_at IS 'Data de expiração do anúncio (30 dias da publicação)';
COMMENT ON COLUMN animals.is_boosted IS 'Se o animal está atualmente impulsionado';
COMMENT ON COLUMN animals.can_edit IS 'Se o animal pode ser editado (false após boost ou 24h)';





