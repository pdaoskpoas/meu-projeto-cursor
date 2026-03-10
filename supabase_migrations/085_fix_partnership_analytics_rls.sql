-- ============================================================================
-- MIGRAÇÃO 085: Corrigir analytics para sociedades (impressions/clicks)
-- ============================================================================
-- Objetivo: garantir que sócios vejam métricas de animais compartilhados,
-- mesmo se status não estiver definido (NULL) em animal_partnerships.
-- ============================================================================

-- IMPRESSIONS
DROP POLICY IF EXISTS "Partners can view partnership analytics" ON impressions;
CREATE POLICY "Partners can view partnership analytics" ON impressions
    FOR SELECT USING (
        content_type = 'animal' AND EXISTS (
            SELECT 1 FROM animal_partnerships 
            WHERE animal_id = impressions.content_id 
            AND partner_id = auth.uid() 
            AND (status = 'accepted' OR status IS NULL)
        )
    );

-- CLICKS
DROP POLICY IF EXISTS "Partners can view partnership clicks" ON clicks;
CREATE POLICY "Partners can view partnership clicks" ON clicks
    FOR SELECT USING (
        content_type = 'animal' AND EXISTS (
            SELECT 1 FROM animal_partnerships 
            WHERE animal_id = clicks.content_id 
            AND partner_id = auth.uid() 
            AND (status = 'accepted' OR status IS NULL)
        )
    );
