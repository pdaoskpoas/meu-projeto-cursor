-- =====================================================
-- MIGRAÇÃO 046 - PARTE 5: POLÍTICAS RLS
-- Data: 04/11/2025
-- ⚠️ ATENÇÃO: Este arquivo foi substituído pela migration 047
-- ⚠️ NÃO APLICAR - Causa recursão infinita!
-- ⚠️ Use a migration 047_fix_partnership_policy_recursion.sql
-- =====================================================

-- DEPRECADO: Este arquivo causava recursão infinita
-- A lógica de sociedades foi integrada na policy original em 047

-- Para referência, a lógica original era:
/*
DROP POLICY IF EXISTS "Partners with active plan can view animals" ON public.animals;

CREATE POLICY "Partners with active plan can view animals" ON public.animals
    FOR SELECT USING (
        EXISTS (
            SELECT 1
            FROM public.animal_partnerships ap
            JOIN public.profiles p ON ap.partner_id = p.id
            WHERE ap.animal_id = animals.id
              AND ap.partner_id = auth.uid()
              AND ap.status = 'accepted'
              AND p.plan IS NOT NULL
              AND p.plan != 'free'
              AND (p.plan_expires_at IS NULL OR p.plan_expires_at > NOW())
        )
    );
*/

-- =====================================================
-- FIM DO ARQUIVO DEPRECADO
-- =====================================================
