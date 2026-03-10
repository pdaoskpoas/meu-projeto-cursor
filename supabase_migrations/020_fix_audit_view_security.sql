-- 🔒 Correção de Segurança: View admin_audit_logs_with_admin
-- Problema: SECURITY DEFINER permite bypass de RLS
-- Solução: Recriar com SECURITY INVOKER
-- Data: 2 de outubro de 2025

-- Deletar view antiga (insegura)
DROP VIEW IF EXISTS public.admin_audit_logs_with_admin;

-- Recriar view com SECURITY INVOKER (seguro)
CREATE OR REPLACE VIEW public.admin_audit_logs_with_admin
WITH (security_invoker = true)
AS
SELECT 
  al.*,
  p.name as admin_name,
  p.email as admin_email
FROM admin_audit_log al
JOIN profiles p ON al.admin_id = p.id
ORDER BY al.created_at DESC;

COMMENT ON VIEW public.admin_audit_logs_with_admin IS 
'View de logs de auditoria com informações do admin que executou a ação - SECURITY INVOKER para respeitar RLS';

-- Grant permissions
GRANT SELECT ON admin_audit_logs_with_admin TO authenticated;




