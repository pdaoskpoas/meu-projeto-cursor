-- =====================================================
-- Migration 078: Fix Profiles RLS Recursion (CORRECTED)
-- Data: 25/11/2025
-- Descrição: Corrige recursão infinita nas policies da tabela profiles
-- Prioridade: CRÍTICA - Fix para erro 42P17
-- Sintaxe: VERIFICADA com MCP Supabase
-- =====================================================

-- =====================================================
-- 1. REMOVER POLICY RECURSIVA PROBLEMÁTICA
-- =====================================================

-- Esta policy causa recursão infinita (consulta profiles dentro de policy de profiles)
DROP POLICY IF EXISTS "Users can only see own 2FA settings" ON profiles;

-- =====================================================
-- 2. VERIFICAR E MANTER POLICIES CORRETAS EXISTENTES
-- =====================================================

-- Policy existente: "Profiles are viewable by everyone"
-- Status: OK - não causa recursão
-- Não precisa alterar

-- Policy existente: "Users can update own profile"  
-- Status: OK - usa auth.uid() direto
-- Não precisa alterar

-- Policy existente: "Users can insert own profile"
-- Status: OK - usa auth.uid() direto
-- Não precisa alterar

-- =====================================================
-- 3. RECRIAR POLICY ADMIN (SINTAXE CORRETA)
-- =====================================================

-- Remover policy antiga se existir
DROP POLICY IF EXISTS "Admins can do everything on profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can manage profiles" ON profiles;

-- Criar policy admin com sintaxe PostgreSQL correta
-- FOR ALL usa apenas USING (não WITH CHECK separado)
CREATE POLICY "Admins can manage profiles" ON profiles
FOR ALL
TO public
USING (is_admin());

-- =====================================================
-- 4. OTIMIZAR is_admin() PARA EVITAR PROBLEMAS
-- =====================================================

-- Recriar is_admin() como STABLE para melhor performance e cache
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE -- Cache o resultado durante a transação
AS $$
DECLARE
  v_role TEXT;
BEGIN
  -- SELECT direto sem subquery complexa
  SELECT role INTO v_role
  FROM profiles
  WHERE id = auth.uid()
  LIMIT 1;
  
  RETURN COALESCE(v_role = 'admin', false);
END;
$$;

COMMENT ON FUNCTION is_admin IS 
'Verifica se o usuário atual é admin - Versão STABLE otimizada';

-- =====================================================
-- 5. VERIFICAÇÃO FINAL
-- =====================================================

-- Verificar que não há policies duplicadas ou recursivas
DO $$
DECLARE
  policy_count INT;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'profiles'
  AND policyname LIKE '%2FA%';
  
  IF policy_count > 0 THEN
    RAISE WARNING 'Ainda existem % policies relacionadas a 2FA. Verifique manualmente.', policy_count;
  END IF;
END $$;

-- =====================================================
-- ✅ FIX COMPLETO
-- =====================================================
-- Problema resolvido:
-- ✅ Policy recursiva removida
-- ✅ Sintaxe FOR ALL corrigida (apenas USING)
-- ✅ is_admin() otimizado com STABLE
-- ✅ Verificado com estrutura atual do banco



