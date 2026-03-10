# 🚨 APLICAR URGENTE - Correção de View

**Problema Detectado:** View insegura criada pela migration 019  
**Severidade:** 🔴 ERRO DE SEGURANÇA  
**Tempo para corrigir:** 1 minuto

---

## ❌ O Que Aconteceu

A migration 019 criou a view `admin_audit_logs_with_admin` com **SECURITY DEFINER** (padrão do PostgreSQL).

Isso permite **bypass de RLS** - qualquer usuário pode ver logs de auditoria!

O próprio Supabase detectou e alertou via MCP.

---

## ✅ Solução

Aplicar migration 020 que recria a view com **SECURITY INVOKER**.

---

## 🚀 APLICAR AGORA

### SQL para copiar:

```sql
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
```

---

## 📋 Passos:

1. Supabase Dashboard > SQL Editor
2. Copiar SQL acima
3. Colar
4. RUN
5. Aguardar: "Success"

---

## ✅ Depois da Correção

O erro desaparecerá dos Supabase Advisors.

---

**APLICAR IMEDIATAMENTE!** 🚨




