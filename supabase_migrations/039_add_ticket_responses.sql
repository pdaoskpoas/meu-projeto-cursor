-- =====================================================
-- MIGRATION: Sistema de Respostas para Tickets
-- Descrição: Adicionar tabela de respostas para tickets de suporte
-- Data: 2025-11-23
-- =====================================================

-- Criar tabela de respostas de tickets
CREATE TABLE IF NOT EXISTS public.ticket_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Ticket relacionado
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  
  -- Admin que respondeu
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Resposta
  response TEXT NOT NULL,
  
  -- Novo status após a resposta (opcional - se null, mantém status atual)
  new_status TEXT CHECK (new_status IN ('open', 'in_progress', 'closed')),
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_ticket_responses_ticket_id ON public.ticket_responses(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_responses_admin_id ON public.ticket_responses(admin_id);
CREATE INDEX IF NOT EXISTS idx_ticket_responses_created_at ON public.ticket_responses(created_at DESC);

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Habilitar RLS
ALTER TABLE public.ticket_responses ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver respostas dos seus próprios tickets
CREATE POLICY "Users can view responses to own tickets"
  ON public.ticket_responses
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.support_tickets
      WHERE id = ticket_responses.ticket_id
      AND user_id = auth.uid()
    )
  );

-- Admins podem ver todas as respostas
CREATE POLICY "Admins can view all responses"
  ON public.ticket_responses
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins podem criar respostas
CREATE POLICY "Admins can create responses"
  ON public.ticket_responses
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins podem atualizar suas próprias respostas
CREATE POLICY "Admins can update own responses"
  ON public.ticket_responses
  FOR UPDATE
  USING (
    admin_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- FUNÇÃO: Criar resposta e atualizar ticket
-- =====================================================

CREATE OR REPLACE FUNCTION public.respond_to_ticket(
  p_ticket_id UUID,
  p_admin_id UUID,
  p_response TEXT,
  p_new_status TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_response_id UUID;
  v_user_id UUID;
  v_ticket_subject TEXT;
BEGIN
  -- Buscar informações do ticket
  SELECT user_id, subject INTO v_user_id, v_ticket_subject
  FROM public.support_tickets
  WHERE id = p_ticket_id;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Ticket não encontrado';
  END IF;

  -- Criar a resposta
  INSERT INTO public.ticket_responses (ticket_id, admin_id, response, new_status)
  VALUES (p_ticket_id, p_admin_id, p_response, p_new_status)
  RETURNING id INTO v_response_id;

  -- Atualizar status do ticket se fornecido
  IF p_new_status IS NOT NULL THEN
    UPDATE public.support_tickets
    SET 
      status = p_new_status,
      updated_at = NOW()
    WHERE id = p_ticket_id;
  END IF;

  -- Criar notificação para o usuário
  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    message,
    action_url,
    related_content_type,
    related_content_id
  ) VALUES (
    v_user_id,
    'ticket_response',
    'Resposta ao seu ticket',
    'Sua solicitação "' || v_ticket_subject || '" foi respondida pela equipe de suporte.',
    '/ajuda',
    'ticket',
    p_ticket_id
  );

  RETURN v_response_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.respond_to_ticket IS 'Cria resposta ao ticket, atualiza status e notifica usuário';

-- =====================================================
-- TRIGGER: Definir prioridade baseada no plano
-- =====================================================

CREATE OR REPLACE FUNCTION public.set_ticket_priority_by_plan()
RETURNS TRIGGER AS $$
DECLARE
  v_user_plan TEXT;
BEGIN
  -- Buscar o plano do usuário
  SELECT plan INTO v_user_plan
  FROM public.profiles
  WHERE id = NEW.user_id;

  -- Se o plano não for 'free', definir prioridade como 'high'
  IF v_user_plan IS NOT NULL AND v_user_plan != 'free' THEN
    NEW.priority := 'high';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para definir prioridade ao criar ticket
DROP TRIGGER IF EXISTS trigger_set_ticket_priority ON public.support_tickets;
CREATE TRIGGER trigger_set_ticket_priority
  BEFORE INSERT ON public.support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.set_ticket_priority_by_plan();

-- =====================================================
-- ATUALIZAR TIPO DE NOTIFICAÇÃO
-- =====================================================

-- Adicionar novo tipo de notificação se ainda não existir
DO $$ 
BEGIN
  -- Verificar se a constraint existe
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'notifications_type_check' 
    AND table_name = 'notifications'
  ) THEN
    -- Remover constraint antiga
    ALTER TABLE public.notifications DROP CONSTRAINT notifications_type_check;
  END IF;

  -- Adicionar nova constraint com o tipo 'ticket_response'
  ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check
  CHECK (type IN (
    'favorite_added',
    'message_received',
    'animal_view',
    'animal_click',
    'boost_expiring',
    'ad_expiring',
    'partnership_invite',
    'partnership_accepted',
    'ticket_response'
  ));
END $$;

-- =====================================================
-- COMENTÁRIOS
-- =====================================================

COMMENT ON TABLE public.ticket_responses IS 'Respostas dos administradores aos tickets de suporte';
COMMENT ON COLUMN public.ticket_responses.ticket_id IS 'ID do ticket relacionado';
COMMENT ON COLUMN public.ticket_responses.admin_id IS 'ID do admin que respondeu';
COMMENT ON COLUMN public.ticket_responses.response IS 'Texto da resposta';
COMMENT ON COLUMN public.ticket_responses.new_status IS 'Novo status do ticket após a resposta (opcional)';

