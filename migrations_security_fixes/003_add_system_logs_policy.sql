-- =====================================================
-- CORREÇÃO DE SEGURANÇA
-- Adicionar RLS Policy para system_logs
-- Tempo estimado: 2 minutos
-- =====================================================

-- INSTRUÇÕES:
-- 1. Acesse: https://supabase.com/dashboard/project/SEU_PROJETO/sql/new
-- 2. Cole este SQL
-- 3. Execute

BEGIN;

-- =====================================================
-- Policy para system_logs
-- =====================================================

-- Criar policy para permitir apenas admins visualizarem logs
CREATE POLICY "Only admins can view system logs"
ON public.system_logs
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (SELECT auth.uid()) AND role = 'admin'
  )
);

COMMENT ON POLICY "Only admins can view system logs" ON public.system_logs 
IS '✅ Apenas administradores podem visualizar logs do sistema';

-- =====================================================
-- VALIDAÇÃO
-- =====================================================

DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
  AND tablename = 'system_logs';
  
  IF policy_count > 0 THEN
    RAISE NOTICE '✅ Policy criada com sucesso para system_logs!';
    RAISE NOTICE 'Total de policies na tabela: %', policy_count;
  ELSE
    RAISE EXCEPTION '❌ Erro: Nenhuma policy foi criada';
  END IF;
END $$;

COMMIT;

-- =====================================================
-- TESTE
-- =====================================================

-- Verificar policies criadas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'system_logs'
ORDER BY policyname;

-- =====================================================
-- RESULTADO ESPERADO
-- =====================================================
-- ✅ RLS habilitado com policy definida
-- ✅ Apenas admins podem visualizar system_logs
-- ✅ Segurança implementada corretamente
-- =====================================================

