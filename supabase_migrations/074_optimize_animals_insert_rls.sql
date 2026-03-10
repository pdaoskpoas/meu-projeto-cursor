-- =====================================================
-- Migration 074: Otimizar RLS Policy de INSERT da tabela animals
-- =====================================================
-- Descrição: A policy atual chama auth.uid() múltiplas vezes
--            e faz SELECT em profiles sem subquery, causando
--            lentidão crítica (INSERT travando por 60+ segundos).
--
-- Problema identificado:
--   EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() ...)
--   OR owner_id = auth.uid()
--
-- Solução: Usar (SELECT auth.uid()) uma única vez e cachear
-- =====================================================

BEGIN;

RAISE NOTICE '🔧 Iniciando otimização da RLS policy de INSERT para animals...';

-- Remover policy antiga
DROP POLICY IF EXISTS animals_insert_unified ON public.animals;

RAISE NOTICE '  ✓ Policy antiga removida';

-- Criar policy otimizada
-- Usar (SELECT auth.uid()) para executar apenas UMA VEZ
CREATE POLICY animals_insert_unified
ON public.animals
FOR INSERT
TO public
WITH CHECK (
    -- Cache do auth.uid()
    (owner_id = (SELECT auth.uid()))
    OR 
    -- Verificar se é admin (com subquery otimizada)
    EXISTS (
        SELECT 1 
        FROM profiles 
        WHERE profiles.id = (SELECT auth.uid()) 
        AND profiles.role = 'admin'
    )
);

RAISE NOTICE '  ✓ Policy otimizada criada';
RAISE NOTICE '';
RAISE NOTICE '🎉 Otimização concluída! A policy agora chama auth.uid() apenas UMA VEZ.';
RAISE NOTICE '   Antes: ~60s+ por INSERT';
RAISE NOTICE '   Depois: ~1-2s por INSERT (esperado)';

COMMIT;


