-- =====================================================
-- MIGRAÇÃO 003: MÍDIA E PARCERIAS
-- Data: 30/09/2025
-- Descrição: Criar tabelas de mídia dos animais e parcerias
-- =====================================================

-- =====================================================
-- TABELA DE MÍDIA DOS ANIMAIS
-- =====================================================
CREATE TABLE animal_media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  animal_id UUID REFERENCES animals(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('photo', 'video')) NOT NULL,
  url TEXT NOT NULL,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABELA DE SOCIEDADES (PARCERIAS)
-- =====================================================
CREATE TABLE animal_partnerships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  animal_id UUID REFERENCES animals(id) ON DELETE CASCADE,
  partner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  partner_haras_name TEXT,
  partner_public_code TEXT,
  percentage DECIMAL CHECK (percentage >= 0 AND percentage <= 100),
  status TEXT CHECK (status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(animal_id, partner_id)
);

-- Índices
CREATE INDEX idx_animal_media_animal_id ON animal_media(animal_id);
CREATE INDEX idx_animal_media_type ON animal_media(type);
CREATE INDEX idx_animal_partnerships_animal_id ON animal_partnerships(animal_id);
CREATE INDEX idx_animal_partnerships_partner_id ON animal_partnerships(partner_id);
CREATE INDEX idx_animal_partnerships_status ON animal_partnerships(status);

-- Comentários para documentação
COMMENT ON TABLE animal_media IS 'Fotos e vídeos dos animais';
COMMENT ON TABLE animal_partnerships IS 'Sociedades/parcerias entre usuários para animais';
COMMENT ON COLUMN animal_partnerships.percentage IS 'Percentual de participação na sociedade';
COMMENT ON COLUMN animal_partnerships.status IS 'Status da parceria: pending, accepted, rejected';





