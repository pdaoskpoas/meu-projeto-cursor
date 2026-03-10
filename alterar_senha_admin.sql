-- =====================================================
-- ALTERAÇÃO DE SENHA DO ADMINISTRADOR
-- Data: 08 de Novembro de 2025
-- Usuário: adm@gmail.com
-- =====================================================

-- ⚠️ IMPORTANTE: Execute este script apenas se você quiser
-- alterar a senha do administrador para uma senha FORTE

-- =====================================================
-- OPÇÃO 1: Definir nova senha diretamente
-- =====================================================

-- Substitua 'SUA_NOVA_SENHA_FORTE' pela senha real
-- RECOMENDAÇÃO: Use senha com 12+ caracteres, maiúsculas, minúsculas, números e símbolos
-- Exemplo: Admin@2025!Secure#Pltfrm

-- DESCOMENTAR e substituir a senha antes de executar:
/*
UPDATE auth.users
SET encrypted_password = crypt('SUA_NOVA_SENHA_FORTE', gen_salt('bf'))
WHERE email = 'adm@gmail.com';
*/

-- Exemplo com senha forte (NÃO use esta, crie a sua):
-- UPDATE auth.users
-- SET encrypted_password = crypt('Admin@2025!Secure#Pltfrm', gen_salt('bf'))
-- WHERE email = 'adm@gmail.com';

-- =====================================================
-- OPÇÃO 2: Verificar se a senha foi alterada
-- =====================================================

-- Você não pode VER a senha (ela é criptografada)
-- Mas pode verificar quando foi a última atualização
SELECT 
  email,
  encrypted_password IS NOT NULL as has_password,
  updated_at,
  last_sign_in_at
FROM auth.users
WHERE email = 'adm@gmail.com';

-- =====================================================
-- OPÇÃO 3: Forçar reset de senha por email
-- =====================================================

-- Esta opção envia um email para o administrador
-- com link para redefinir a senha

-- Executar via Supabase Dashboard:
-- Authentication > Users > adm@gmail.com > 
-- três pontos (...) > "Send password reset email"

-- =====================================================
-- RECOMENDAÇÕES DE SEGURANÇA
-- =====================================================

-- ✅ Senha forte deve ter:
-- - Mínimo 12 caracteres
-- - Letras maiúsculas (A-Z)
-- - Letras minúsculas (a-z)
-- - Números (0-9)
-- - Símbolos (!@#$%^&*)
-- - NÃO usar palavras do dicionário
-- - NÃO usar informações pessoais
-- - NÃO reutilizar senhas de outros serviços

-- ✅ Exemplos de senhas FORTES (NÃO use estas, crie a sua):
-- - Cavalaria@Digital#2025!Secure
-- - Admin$2025#Supabase!Pltfrm
-- - Eq3str!@n2025#AdmSecure

-- ❌ Exemplos de senhas FRACAS (NUNCA use):
-- - 12345678
-- - admin123
-- - password
-- - cavalaria123

-- =====================================================
-- APÓS ALTERAR A SENHA
-- =====================================================

-- 1. Documentar a nova senha em local seguro:
--    - Gestor de senhas (1Password, LastPass, Bitwarden)
--    - NUNCA em arquivo de texto não criptografado
--    - NUNCA em email ou chat

-- 2. Fazer logout da aplicação

-- 3. Fazer login novamente com a nova senha

-- 4. Verificar que o login funciona

-- 5. OPCIONAL: Habilitar 2FA (Two-Factor Authentication)
--    Ver arquivo: guia_2fa_admin.md

-- =====================================================
-- FIM DO SCRIPT
-- =====================================================


