-- =====================================================
-- FASE 2C: CORREÇÃO DE POLÍTICAS RLS LENTAS RESTANTES
-- =====================================================
-- Descrição: Corrige 3 políticas RLS que ainda usam auth.uid() direto
-- Problema: auth.uid() é reavaliado para cada linha, causando lentidão
-- Solução: Substituir auth.uid() por (SELECT auth.uid()) para cache
-- Referência: https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select
-- =====================================================

-- =====================================================
-- 1. TABELA: animal_partnerships
-- =====================================================
-- Policy: Owners can create partnerships
-- Ação: INSERT
-- Problema: auth.uid() chamado múltiplas vezes por linha

DROP POLICY IF EXISTS "Owners can create partnerships" ON public.animal_partnerships;

CREATE POLICY "Owners can create partnerships" ON public.animal_partnerships
    FOR INSERT
    TO public
    WITH CHECK (
        animal_owner_id = (SELECT auth.uid())
        OR EXISTS (
            SELECT 1
            FROM profiles
            WHERE profiles.id = (SELECT auth.uid())
            AND profiles.role = 'admin'
        )
    );

-- =====================================================
-- 2. TABELA: animals
-- =====================================================
-- Policy: animals_insert_unified
-- Ação: INSERT
-- Problema: auth.uid() chamado múltiplas vezes por linha

DROP POLICY IF EXISTS "animals_insert_unified" ON public.animals;

CREATE POLICY "animals_insert_unified" ON public.animals
    FOR INSERT
    TO public
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM profiles
            WHERE profiles.id = (SELECT auth.uid())
            AND profiles.role = 'admin'
        )
        OR owner_id = (SELECT auth.uid())
    );

-- =====================================================
-- 3. TABELA: notification_preferences
-- =====================================================
-- Policy: users_can_insert_own_preferences
-- Ação: INSERT
-- Problema: auth.uid() chamado sem cache

DROP POLICY IF EXISTS "users_can_insert_own_preferences" ON public.notification_preferences;

CREATE POLICY "users_can_insert_own_preferences" ON public.notification_preferences
    FOR INSERT
    TO authenticated
    WITH CHECK (
        (SELECT auth.uid()) = user_id
    );

-- =====================================================
-- RESUMO DAS CORREÇÕES
-- =====================================================
-- ✅ 3 políticas RLS otimizadas
-- ✅ auth.uid() agora é cacheado via (SELECT auth.uid())
-- ✅ Performance de INSERT melhorada significativamente
-- ✅ Menos carga no banco de dados
-- ✅ Zero impacto na funcionalidade
-- =====================================================

