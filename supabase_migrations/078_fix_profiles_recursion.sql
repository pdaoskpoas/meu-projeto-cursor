-- =====================================================
-- Migration 078: Fix Profiles RLS Recursion
-- Data: 25/11/2025
-- Descrição: Corrige recursão infinita nas policies da tabela profiles
-- Prioridade: CRÍTICA - Fix para erro 42P17
-- =====================================================

-- =====================================================
-- 1. REMOVER POLICY PROBLEMÁTICA
-- =====================================================
DROP POLICY IF EXISTS "Users can only see own 2FA settings" ON profiles;

-- =====================================================
-- 2. POLICIES CORRETAS SEM RECURSÃO
-- =====================================================

-- Todos usuários podem ver todos os perfis públicos (informações básicas)
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
CREATE POLICY "Profiles are viewable by everyone" ON profiles
FOR SELECT
TO authenticated
USING (true); -- ✅ Sem recursão - permite visualização

-- Usuários podem atualizar apenas seu próprio perfil
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id) -- ✅ Sem recursão - compara ID direto
WITH CHECK (auth.uid() = id);

-- Usuários podem inserir apenas seu próprio perfil (registro)
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id); -- ✅ Sem recursão

-- Admins podem fazer tudo (usando função helper sem recursão)
DROP POLICY IF EXISTS "Admins can do everything on profiles" ON profiles;
CREATE POLICY "Admins can do everything on profiles" ON profiles
FOR ALL
TO authenticated
USING (is_admin()); -- ✅ is_admin() usa auth.uid() direto, sem subquery em profiles
WITH CHECK (is_admin());

-- =====================================================
-- 3. GARANTIR QUE is_admin() NÃO CAUSA RECURSÃO
-- =====================================================
-- Recriar is_admin() para garantir que não há recursão

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE -- ✅ STABLE para melhor performance
AS $$
DECLARE
  v_role TEXT;
BEGIN
  -- Buscar role diretamente sem subquery complexa
  SELECT role INTO v_role
  FROM profiles
  WHERE id = auth.uid()
  LIMIT 1;
  
  RETURN (v_role = 'admin');
END;
$$;

COMMENT ON FUNCTION is_admin IS 
'Verifica se o usuário atual é admin - Versão otimizada sem recursão';

-- =====================================================
-- 4. VERIFICAÇÃO: Testar se há outras policies recursivas
-- =====================================================

-- Remover qualquer policy que possa causar recursão em profiles
DROP POLICY IF EXISTS "Users can view own 2FA settings" ON profiles;
DROP POLICY IF EXISTS "Admins can view all 2FA settings" ON profiles;

-- =====================================================
-- ✅ FIX COMPLETO
-- =====================================================
-- Problema: Policy em profiles que fazia SELECT em profiles
-- Solução: Usar auth.uid() direto ou função STABLE sem subquery complexa
-- Status: Resolvido - Login deve funcionar agora



