-- Criar tabela de tickets de suporte
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  subject TEXT NOT NULL CHECK (char_length(subject) >= 3 AND char_length(subject) <= 200),
  category TEXT NOT NULL CHECK (category IN ('technical', 'billing', 'account', 'animals', 'partnership', 'other')),
  description TEXT NOT NULL CHECK (char_length(description) >= 10),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'closed', 'resolved', 'rejected')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  admin_notes TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comentários
COMMENT ON TABLE support_tickets IS 'Tickets de suporte enviados pelos usuários';
COMMENT ON COLUMN support_tickets.user_id IS 'ID do usuário que criou o ticket';
COMMENT ON COLUMN support_tickets.subject IS 'Assunto do ticket (3-200 caracteres)';
COMMENT ON COLUMN support_tickets.category IS 'Categoria: technical, billing, account, animals, partnership, other';
COMMENT ON COLUMN support_tickets.description IS 'Descrição detalhada do problema (mínimo 10 caracteres)';
COMMENT ON COLUMN support_tickets.status IS 'Status: open, in_progress, closed, resolved, rejected';
COMMENT ON COLUMN support_tickets.priority IS 'Prioridade: low, normal, high, urgent';
COMMENT ON COLUMN support_tickets.assigned_to IS 'ID do admin responsável pelo ticket';
COMMENT ON COLUMN support_tickets.admin_notes IS 'Observações internas do administrador';
COMMENT ON COLUMN support_tickets.resolved_at IS 'Data/hora de resolução do ticket';

-- Índices para performance
CREATE INDEX idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX idx_support_tickets_status ON support_tickets(status);
CREATE INDEX idx_support_tickets_priority ON support_tickets(priority);
CREATE INDEX idx_support_tickets_assigned_to ON support_tickets(assigned_to);
CREATE INDEX idx_support_tickets_created_at ON support_tickets(created_at DESC);

-- Habilitar RLS
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

-- Policy: Usuários podem ver seus próprios tickets
CREATE POLICY "Users can view own tickets"
  ON support_tickets FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Usuários podem criar tickets
CREATE POLICY "Users can create tickets"
  ON support_tickets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Usuários podem atualizar seus próprios tickets (apenas alguns campos)
CREATE POLICY "Users can update own tickets"
  ON support_tickets FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Admins podem ver todos os tickets
CREATE POLICY "Admins can view all tickets"
  ON support_tickets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policy: Admins podem atualizar qualquer ticket
CREATE POLICY "Admins can update all tickets"
  ON support_tickets FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policy: Admins podem deletar tickets
CREATE POLICY "Admins can delete tickets"
  ON support_tickets FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_support_tickets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER support_tickets_updated_at
  BEFORE UPDATE ON support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_support_tickets_updated_at();

-- Função para auto-atribuir prioridade baseada em palavras-chave
CREATE OR REPLACE FUNCTION auto_set_ticket_priority()
RETURNS TRIGGER AS $$
BEGIN
  -- Palavras-chave para prioridade URGENT
  IF (
    NEW.subject ~* '(urgente|emergência|grave|crítico|bloqueado|não consigo acessar|não funciona)' OR
    NEW.description ~* '(urgente|emergência|grave|crítico|bloqueado|não consigo acessar)'
  ) THEN
    NEW.priority = 'urgent';
  -- Palavras-chave para prioridade HIGH
  ELSIF (
    NEW.subject ~* '(importante|problema sério|bug|erro|falha|não está funcionando)' OR
    NEW.description ~* '(importante|problema sério|bug|erro|falha)'
  ) THEN
    NEW.priority = 'high';
  -- Palavras-chave para prioridade LOW
  ELSIF (
    NEW.subject ~* '(dúvida|sugestão|melhoria|como faço)' OR
    NEW.description ~* '(dúvida|sugestão|melhoria)'
  ) THEN
    NEW.priority = 'low';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_set_ticket_priority_trigger
  BEFORE INSERT ON support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION auto_set_ticket_priority();


