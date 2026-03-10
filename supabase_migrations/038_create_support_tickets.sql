-- =====================================================
-- MIGRATION: Sistema de Tickets de Suporte
-- Descrição: Criação de tabela para gerenciar tickets de suporte
-- Data: 2025-11-23
-- =====================================================

-- Criar tabela de tickets de suporte
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Informações do usuário
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Informações do ticket
  subject TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('technical', 'billing', 'account', 'animals', 'partnership', 'other')),
  description TEXT NOT NULL,
  
  -- Status e prioridade
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'closed')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  
  -- Atribuição e resolução
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  admin_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON public.support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned_to ON public.support_tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON public.support_tickets(created_at DESC);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_support_tickets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_support_tickets_updated_at_trigger
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_support_tickets_updated_at();

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Habilitar RLS
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver apenas seus próprios tickets
CREATE POLICY "Users can view own tickets"
  ON public.support_tickets
  FOR SELECT
  USING (auth.uid() = user_id);

-- Usuários podem criar tickets
CREATE POLICY "Users can create tickets"
  ON public.support_tickets
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Usuários podem atualizar seus próprios tickets (apenas descrição)
CREATE POLICY "Users can update own tickets"
  ON public.support_tickets
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admins podem ver todos os tickets
CREATE POLICY "Admins can view all tickets"
  ON public.support_tickets
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins podem atualizar qualquer ticket
CREATE POLICY "Admins can update all tickets"
  ON public.support_tickets
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- COMENTÁRIOS
-- =====================================================

COMMENT ON TABLE public.support_tickets IS 'Tabela para gerenciar tickets de suporte dos usuários';
COMMENT ON COLUMN public.support_tickets.user_id IS 'ID do usuário que criou o ticket';
COMMENT ON COLUMN public.support_tickets.subject IS 'Assunto do ticket';
COMMENT ON COLUMN public.support_tickets.category IS 'Categoria do problema (technical, billing, account, animals, partnership, other)';
COMMENT ON COLUMN public.support_tickets.description IS 'Descrição detalhada do problema';
COMMENT ON COLUMN public.support_tickets.status IS 'Status do ticket (open, in_progress, closed)';
COMMENT ON COLUMN public.support_tickets.priority IS 'Prioridade do ticket (low, normal, high, urgent)';
COMMENT ON COLUMN public.support_tickets.assigned_to IS 'ID do admin responsável pelo ticket';
COMMENT ON COLUMN public.support_tickets.resolved_at IS 'Data e hora de resolução do ticket';
COMMENT ON COLUMN public.support_tickets.admin_notes IS 'Notas administrativas sobre o ticket';

