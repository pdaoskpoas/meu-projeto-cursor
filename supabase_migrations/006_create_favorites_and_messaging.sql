-- =====================================================
-- MIGRAÇÃO 006: FAVORITOS E SISTEMA DE MENSAGENS
-- Data: 30/09/2025
-- Descrição: Criar tabelas de favoritos, conversas e mensagens
-- =====================================================

-- =====================================================
-- TABELA DE FAVORITOS
-- =====================================================
CREATE TABLE favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  animal_id UUID REFERENCES animals(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, animal_id)
);

-- =====================================================
-- SISTEMA DE CONVERSAS
-- =====================================================
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Participantes
  animal_id UUID REFERENCES animals(id) ON DELETE CASCADE,
  animal_owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  interested_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Status
  is_temporary BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Metadados
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(animal_id, animal_owner_id, interested_user_id)
);

-- =====================================================
-- SISTEMA DE MENSAGENS
-- =====================================================
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  type TEXT DEFAULT 'text',
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_favorites_user_id ON favorites(user_id);
CREATE INDEX idx_favorites_animal_id ON favorites(animal_id);

CREATE INDEX idx_conversations_animal_id ON conversations(animal_id);
CREATE INDEX idx_conversations_animal_owner_id ON conversations(animal_owner_id);
CREATE INDEX idx_conversations_interested_user_id ON conversations(interested_user_id);
CREATE INDEX idx_conversations_is_active ON conversations(is_active);

CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_messages_read_at ON messages(read_at);

-- Comentários para documentação
COMMENT ON TABLE favorites IS 'Animais favoritados pelos usuários';
COMMENT ON TABLE conversations IS 'Conversas entre usuários interessados e proprietários de animais';
COMMENT ON TABLE messages IS 'Mensagens das conversas';
COMMENT ON COLUMN conversations.is_temporary IS 'Se a conversa é temporária (para usuários não cadastrados)';
COMMENT ON COLUMN messages.read_at IS 'Timestamp de quando a mensagem foi lida';





