-- =====================================================
-- CONFIGURAÇÃO DO ROLE ADMINISTRATIVO
-- Data: 08 de Novembro de 2025
-- Usuário: seu_email_admin@exemplo.com
-- UID: ADMIN_UUID_EXAMPLE
-- =====================================================

-- PASSO 1: Verificar o estado atual do usuário
-- Execute este SELECT primeiro para ver o que temos
SELECT 
  id,
  email,
  name,
  role,
  account_type,
  property_name,
  is_active,
  is_suspended,
  created_at
FROM profiles 
WHERE email = 'seu_email_admin@exemplo.com';

-- =====================================================
-- Se o SELECT acima retornar 0 linhas:
-- O perfil não existe na tabela profiles, precisa ser criado
-- =====================================================

-- CENÁRIO A: Perfil NÃO existe (0 linhas retornadas)
-- Descomente e execute apenas se necessário:

/*
INSERT INTO profiles (
  id,
  email,
  name,
  role,
  account_type,
  property_name,
  plan,
  is_active,
  is_suspended,
  created_at,
  updated_at
) VALUES (
  'ADMIN_UUID_EXAMPLE',
  'seu_email_admin@exemplo.com',
  'Administrador do Sistema',
  'admin',
  'institutional',
  'Administração',
  'vip',
  true,
  false,
  NOW(),
  NOW()
);
*/

-- =====================================================
-- CENÁRIO B: Perfil existe mas role != 'admin'
-- Execute este UPDATE se o SELECT retornou 1 linha mas role não é 'admin'
-- =====================================================

UPDATE profiles 
SET 
  role = 'admin',
  name = COALESCE(NULLIF(name, ''), 'Administrador do Sistema'),
  account_type = 'institutional',
  property_name = COALESCE(NULLIF(property_name, ''), 'Administração'),
  is_active = true,
  is_suspended = false,
  updated_at = NOW()
WHERE email = 'seu_email_admin@exemplo.com';

-- =====================================================
-- PASSO 2: Verificar se a atualização funcionou
-- Execute este SELECT para confirmar
-- =====================================================

SELECT 
  id,
  email,
  name,
  role,
  account_type,
  property_name,
  plan,
  is_active,
  is_suspended,
  created_at,
  updated_at
FROM profiles 
WHERE email = 'seu_email_admin@exemplo.com';

-- =====================================================
-- RESULTADO ESPERADO:
-- role = 'admin'
-- is_active = true
-- is_suspended = false
-- account_type = 'institutional'
-- =====================================================

-- =====================================================
-- PASSO 3: Verificar políticas RLS (opcional - apenas validação)
-- =====================================================

-- Verificar se as policies de admin existem
SELECT 
  tablename,
  policyname,
  permissive,
  cmd
FROM pg_policies
WHERE policyname ILIKE '%admin%'
ORDER BY tablename;

-- =====================================================
-- FIM DO SCRIPT
-- Aguarde confirmação visual antes de testar o login
-- =====================================================


