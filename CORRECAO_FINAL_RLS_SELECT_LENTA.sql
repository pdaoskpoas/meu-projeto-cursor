-- =====================================================
-- CORREÇÃO FINAL: Otimizar policy de SELECT que trava INSERT
-- =====================================================
-- PROBLEMA: A policy "Partners with active plan can view animals"
--           está causando timeout de 60s no SELECT após INSERT
--
-- CAUSA: Policy tem 2 JOINs + auth.uid() sem subquery
-- =====================================================

-- PASSO 1: Remover a policy lenta
DROP POLICY IF EXISTS "Partners with active plan can view animals" ON public.animals;

-- PASSO 2: Recriar a policy OTIMIZADA
CREATE POLICY "Partners with active plan can view animals"
ON public.animals
FOR SELECT
TO public
USING (
    EXISTS (
        SELECT 1
        FROM animal_partnerships ap
        JOIN profiles p ON ap.partner_id = p.id
        WHERE 
            ap.animal_id = animals.id
            AND ap.partner_id = (SELECT auth.uid()) -- ✅ Subquery para cachear
            AND p.plan IS NOT NULL
            AND p.plan <> 'free'
            AND (p.plan_expires_at IS NULL OR p.plan_expires_at > now())
    )
);

-- ✅ Pronto! Agora o SELECT após INSERT será rápido


