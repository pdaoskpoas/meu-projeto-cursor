-- =====================================================
-- Migration: 056 - Otimizar RLS Policy da Tabela Plans
-- Otimiza performance usando subquery (SELECT auth.uid())
-- =====================================================

-- Remover policy antiga
DROP POLICY IF EXISTS "Only admins can manage plans" ON public.plans;

-- Criar policy otimizada
CREATE POLICY "Admins can manage plans (optimized)"
ON public.plans
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE id = (SELECT auth.uid()) 
      AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE id = (SELECT auth.uid()) 
      AND role = 'admin'
  )
);

-- Criar índice no campo role (se não existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' 
      AND tablename = 'profiles' 
      AND indexname = 'idx_profiles_role'
  ) THEN
    CREATE INDEX idx_profiles_role ON public.profiles(role);
  END IF;
END;
$$;

-- Atualizar estatísticas
ANALYZE public.plans;
ANALYZE public.profiles;
