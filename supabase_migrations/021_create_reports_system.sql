-- =====================================================
-- MIGRATION: Sistema de Denúncias e Reports
-- Descrição: Criação de tabela para gerenciar denúncias
-- Data: 2025-10-02
-- =====================================================

-- Criar tabela de reports/denúncias
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Informações do denunciante
  reporter_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reporter_email TEXT,
  reporter_name TEXT,
  
  -- Informações do denunciado
  reported_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reported_user_name TEXT,
  
  -- Tipo de conteúdo denunciado
  content_type TEXT NOT NULL CHECK (content_type IN ('animal', 'user', 'message', 'conversation', 'profile', 'other')),
  content_id UUID,
  
  -- Detalhes da denúncia
  reason TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT CHECK (category IN ('fake_info', 'scam', 'inappropriate', 'spam', 'harassment', 'other')),
  
  -- URLs e localização
  report_location TEXT, -- URL ou path onde ocorreu
  evidence_urls TEXT[], -- URLs de evidências (screenshots, etc)
  
  -- Status e prioridade
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'resolved', 'rejected')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  
  -- Análise administrativa
  admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  admin_notes TEXT,
  admin_action TEXT CHECK (admin_action IN ('none', 'warning', 'content_removed', 'user_suspended', 'user_banned')),
  reviewed_at TIMESTAMPTZ,
  
  -- IDs relacionados (mensagens, conversas, etc)
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
  message_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
  animal_id UUID REFERENCES public.animals(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_reports_status ON public.reports(status);
CREATE INDEX idx_reports_priority ON public.reports(priority);
CREATE INDEX idx_reports_reporter_id ON public.reports(reporter_id);
CREATE INDEX idx_reports_reported_user_id ON public.reports(reported_user_id);
CREATE INDEX idx_reports_content_type ON public.reports(content_type);
CREATE INDEX idx_reports_created_at ON public.reports(created_at DESC);
CREATE INDEX idx_reports_admin_id ON public.reports(admin_id);

-- Comentários
COMMENT ON TABLE public.reports IS 'Sistema de denúncias e reports da plataforma';
COMMENT ON COLUMN public.reports.content_type IS 'Tipo de conteúdo denunciado: animal, user, message, conversation, profile, other';
COMMENT ON COLUMN public.reports.status IS 'Status da denúncia: pending, under_review, resolved, rejected';
COMMENT ON COLUMN public.reports.priority IS 'Prioridade: low, medium, high, urgent';
COMMENT ON COLUMN public.reports.admin_action IS 'Ação tomada: none, warning, content_removed, user_suspended, user_banned';

-- Trigger para atualizar updated_at
CREATE TRIGGER update_reports_updated_at
  BEFORE UPDATE ON public.reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Habilitar RLS
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Policy: Usuários podem criar denúncias
CREATE POLICY "users_can_create_reports"
  ON public.reports
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

-- Policy: Usuários podem ver suas próprias denúncias
CREATE POLICY "users_can_view_own_reports"
  ON public.reports
  FOR SELECT
  TO authenticated
  USING (auth.uid() = reporter_id);

-- Policy: Admins podem ver todas as denúncias
CREATE POLICY "admins_can_view_all_reports"
  ON public.reports
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Admins podem atualizar denúncias
CREATE POLICY "admins_can_update_reports"
  ON public.reports
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Admins podem deletar denúncias (soft delete recomendado)
CREATE POLICY "admins_can_delete_reports"
  ON public.reports
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- =====================================================
-- FUNÇÕES AUXILIARES
-- =====================================================

-- Função para contar denúncias pendentes
CREATE OR REPLACE FUNCTION get_pending_reports_count()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM public.reports
    WHERE status = 'pending'
  );
END;
$$;

-- Função para obter estatísticas de denúncias
CREATE OR REPLACE FUNCTION get_reports_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  stats JSON;
BEGIN
  SELECT json_build_object(
    'total', COUNT(*),
    'pending', COUNT(*) FILTER (WHERE status = 'pending'),
    'under_review', COUNT(*) FILTER (WHERE status = 'under_review'),
    'resolved', COUNT(*) FILTER (WHERE status = 'resolved'),
    'rejected', COUNT(*) FILTER (WHERE status = 'rejected'),
    'high_priority', COUNT(*) FILTER (WHERE priority IN ('high', 'urgent')),
    'by_type', json_build_object(
      'animal', COUNT(*) FILTER (WHERE content_type = 'animal'),
      'user', COUNT(*) FILTER (WHERE content_type = 'user'),
      'message', COUNT(*) FILTER (WHERE content_type = 'message')
    )
  ) INTO stats
  FROM public.reports;
  
  RETURN stats;
END;
$$;

-- Grants
GRANT SELECT ON public.reports TO authenticated;
GRANT INSERT ON public.reports TO authenticated;
GRANT UPDATE ON public.reports TO authenticated;
GRANT DELETE ON public.reports TO authenticated;

-- =====================================================
-- DADOS DE EXEMPLO (OPCIONAL - REMOVER EM PRODUÇÃO)
-- =====================================================

-- Comentar ou remover esta seção em produção
-- INSERT INTO public.reports (reporter_email, reporter_name, reported_user_name, content_type, reason, description, category, priority, status)
-- VALUES 
--   ('user1@example.com', 'João Silva', 'Carlos Mendes', 'animal', 'Informações incorretas', 'Pedigree falso detectado', 'fake_info', 'high', 'pending'),
--   ('user2@example.com', 'Maria Santos', 'Pedro Oliveira', 'message', 'Comportamento inadequado', 'Mensagens ofensivas', 'harassment', 'urgent', 'pending');




