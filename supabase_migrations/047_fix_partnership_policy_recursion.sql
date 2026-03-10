-- =====================================================
-- MIGRAÇÃO 047: CORREÇÃO - Recursão Infinita em Policy
-- Problema: Duas policies de SELECT causando recursão
-- Solução: Unificar em uma única policy
-- Data: 04/11/2025
-- =====================================================

-- 1. Remover a policy de sociedades que causa recursão
DROP POLICY IF EXISTS "Partners with active plan can view animals" ON public.animals;

-- 2. Atualizar a policy original para incluir sociedades
DROP POLICY IF EXISTS "animals_select_unified" ON public.animals;

CREATE POLICY "animals_select_unified" ON public.animals
    FOR SELECT USING (
        -- Admin pode ver tudo
        EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE profiles.id = auth.uid() 
              AND profiles.role = 'admin'
        )
        OR
        -- Dono pode ver seus animais
        owner_id = auth.uid()
        OR
        -- Público pode ver animais ativos
        (ad_status = 'active' AND expires_at > NOW())
        OR
        -- Sócios com plano ativo podem ver animais onde são parceiros
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

COMMENT ON POLICY "animals_select_unified" ON public.animals IS 
'Política unificada de SELECT: admin vê tudo, dono vê seus animais, público vê ativos, sócios veem animais onde são parceiros com plano ativo';

-- =====================================================
-- FIM DA MIGRAÇÃO 047
-- =====================================================

