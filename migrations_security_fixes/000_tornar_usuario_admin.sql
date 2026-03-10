-- =====================================================
-- TORNAR USUÁRIO ADMIN
-- Tempo estimado: 1 minuto
-- =====================================================

-- INSTRUÇÕES:
-- 1. Acesse: https://supabase.com/dashboard/project/wyufgltprapazpxmtaff/sql/new
-- 2. Cole este SQL
-- 3. Execute

BEGIN;

-- =====================================================
-- Tornar adm@gmail.com um administrador
-- =====================================================

UPDATE public.profiles
SET role = 'admin'
WHERE email = 'adm@gmail.com';

-- =====================================================
-- VALIDAÇÃO
-- =====================================================

-- Verificar se foi atualizado
SELECT 
  id,
  name,
  email,
  role,
  account_type,
  plan,
  CASE 
    WHEN role = 'admin' THEN '✅ Admin configurado com sucesso!'
    ELSE '❌ Ainda não é admin'
  END AS status
FROM public.profiles
WHERE email = 'adm@gmail.com';

COMMIT;

-- =====================================================
-- RESULTADO ESPERADO
-- =====================================================
-- name: ADM
-- email: adm@gmail.com
-- role: admin ✅
-- status: ✅ Admin configurado com sucesso!
-- =====================================================

