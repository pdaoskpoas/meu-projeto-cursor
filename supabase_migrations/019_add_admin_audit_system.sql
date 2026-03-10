-- 🔒 Sistema de Auditoria para Ações Administrativas
-- Baseado em security-report.md - MÉDIA #15
-- Data: 2 de outubro de 2025

-- ✅ NOTA: system_logs já tem policy (aplicada anteriormente)
-- Esta migration cria APENAS o sistema de auditoria admin (admin_audit_log)

-- =============================================================================
-- Criar sistema de auditoria admin (MÉDIA #15)
-- =============================================================================

-- Tabela de auditoria de ações administrativas
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES profiles(id),
  action text NOT NULL, -- INSERT, UPDATE, DELETE, CUSTOM
  resource_type text NOT NULL, -- 'animal', 'user', 'event', 'suspension', etc
  resource_id uuid, -- ID do recurso afetado
  old_data jsonb, -- Estado anterior (para UPDATE/DELETE)
  new_data jsonb, -- Estado novo (para INSERT/UPDATE)
  ip_address inet,
  user_agent text,
  details jsonb, -- Informações adicionais
  created_at timestamptz DEFAULT now()
);

-- Índices para queries eficientes
CREATE INDEX IF NOT EXISTS idx_admin_audit_admin_id 
ON public.admin_audit_log(admin_id);

CREATE INDEX IF NOT EXISTS idx_admin_audit_resource 
ON public.admin_audit_log(resource_type, resource_id);

CREATE INDEX IF NOT EXISTS idx_admin_audit_created_at 
ON public.admin_audit_log(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_audit_action 
ON public.admin_audit_log(action);

-- Comentários
COMMENT ON TABLE public.admin_audit_log IS 
'Log de auditoria de todas as ações administrativas - imutável para conformidade LGPD';

COMMENT ON COLUMN public.admin_audit_log.action IS 
'Tipo de ação: INSERT, UPDATE, DELETE, SUSPEND, UNSUSPEND, BOOST, etc';

COMMENT ON COLUMN public.admin_audit_log.old_data IS 
'Estado anterior do recurso (para UPDATE/DELETE) - conformidade LGPD';

-- RLS Policies
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Apenas admins podem visualizar logs de auditoria
CREATE POLICY "Only admins can view audit logs"
ON public.admin_audit_log FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = (select auth.uid()) AND role = 'admin'
  )
);

-- Sistema pode inserir (via triggers e functions)
CREATE POLICY "System can insert audit logs"
ON public.admin_audit_log FOR INSERT
WITH CHECK (true);

-- Logs são IMUTÁVEIS - ninguém pode atualizar ou deletar
-- (nem mesmo admins, para conformidade)

-- Function para registrar ação admin
CREATE OR REPLACE FUNCTION log_admin_action(
  p_action text,
  p_resource_type text,
  p_resource_id uuid,
  p_old_data jsonb DEFAULT NULL,
  p_new_data jsonb DEFAULT NULL,
  p_details jsonb DEFAULT NULL
) RETURNS uuid AS $$
DECLARE
  log_id uuid;
BEGIN
  -- Verificar se é admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = (select auth.uid()) AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can create audit logs';
  END IF;

  -- Inserir log
  INSERT INTO admin_audit_log (
    admin_id,
    action,
    resource_type,
    resource_id,
    old_data,
    new_data,
    details,
    ip_address,
    user_agent
  ) VALUES (
    (select auth.uid()),
    p_action,
    p_resource_type,
    p_resource_id,
    p_old_data,
    p_new_data,
    p_details,
    NULL, -- IP seria capturado via Edge Function
    NULL  -- User-Agent seria capturado via Edge Function
  ) RETURNING id INTO log_id;

  RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

COMMENT ON FUNCTION log_admin_action IS 
'Registra ação administrativa para auditoria e conformidade LGPD';

-- Trigger automático para suspensões
CREATE OR REPLACE FUNCTION trigger_log_suspension_action()
RETURNS TRIGGER AS $$
BEGIN
  -- Registrar suspensão
  IF TG_OP = 'INSERT' THEN
    PERFORM log_admin_action(
      'SUSPEND_USER',
      'suspension',
      NEW.id,
      NULL,
      to_jsonb(NEW),
      jsonb_build_object(
        'user_id', NEW.user_id,
        'email', NEW.email,
        'reason', NEW.reason
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

-- Aplicar trigger em suspensions
DROP TRIGGER IF EXISTS log_suspension_actions ON public.suspensions;
CREATE TRIGGER log_suspension_actions
AFTER INSERT ON public.suspensions
FOR EACH ROW
EXECUTE FUNCTION trigger_log_suspension_action();

-- View para facilitar consulta de audit logs
CREATE OR REPLACE VIEW admin_audit_logs_with_admin AS
SELECT 
  al.*,
  p.name as admin_name,
  p.email as admin_email
FROM admin_audit_log al
JOIN profiles p ON al.admin_id = p.id
ORDER BY al.created_at DESC;

COMMENT ON VIEW admin_audit_logs_with_admin IS 
'View de logs de auditoria com informações do admin que executou a ação';

-- Grant permissions
GRANT SELECT ON admin_audit_log TO authenticated;
GRANT INSERT ON admin_audit_log TO authenticated;
GRANT SELECT ON admin_audit_logs_with_admin TO authenticated;

