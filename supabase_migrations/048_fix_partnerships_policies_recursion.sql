-- =====================================================
-- MIGRAÇÃO 048: CORREÇÃO FINAL - Recursão em animal_partnerships
-- Problema: Policies de animal_partnerships fazem SELECT em animals,
--           causando recursão infinita quando animals também consulta partnerships
-- Solução: Reescrever policies sem SELECT em animals
-- Data: 04/11/2025
-- =====================================================

-- ======================================
-- PARTE 1: Adicionar coluna owner_id em animal_partnerships
-- Para evitar SELECT em animals, armazenamos o owner_id diretamente
-- ======================================

-- Adicionar coluna se não existir
ALTER TABLE public.animal_partnerships 
ADD COLUMN IF NOT EXISTS animal_owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Popular coluna com dados existentes
UPDATE public.animal_partnerships ap
SET animal_owner_id = a.owner_id
FROM public.animals a
WHERE ap.animal_id = a.id
  AND ap.animal_owner_id IS NULL;

-- Criar trigger para manter sincronizado
CREATE OR REPLACE FUNCTION sync_partnership_owner_id()
RETURNS TRIGGER AS $$
BEGIN
    -- Ao inserir nova partnership, pegar owner_id do animal
    IF (TG_OP = 'INSERT') THEN
        SELECT owner_id INTO NEW.animal_owner_id
        FROM public.animals
        WHERE id = NEW.animal_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_sync_partnership_owner_id ON public.animal_partnerships;

CREATE TRIGGER trigger_sync_partnership_owner_id
    BEFORE INSERT ON public.animal_partnerships
    FOR EACH ROW
    EXECUTE FUNCTION sync_partnership_owner_id();

COMMENT ON TRIGGER trigger_sync_partnership_owner_id ON public.animal_partnerships IS 
'Sincroniza animal_owner_id ao inserir partnership';

-- ======================================
-- PARTE 2: Recriar Policies SEM Recursão
-- ======================================

-- 2.1 SELECT Policy
DROP POLICY IF EXISTS "Partnerships are viewable by involved parties" ON public.animal_partnerships;

CREATE POLICY "Partnerships are viewable by involved parties" ON public.animal_partnerships
    FOR SELECT USING (
        -- Dono do animal (usando coluna denormalizada)
        animal_owner_id = auth.uid()
        OR
        -- Sócio
        partner_id = auth.uid()
        OR
        -- Admin
        EXISTS (
            SELECT 1 
            FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

COMMENT ON POLICY "Partnerships are viewable by involved parties" ON public.animal_partnerships IS 
'Dono, sócio ou admin podem ver partnerships (sem recursão em animals)';

-- 2.2 UPDATE Policy  
DROP POLICY IF EXISTS "Involved parties can update partnerships" ON public.animal_partnerships;

CREATE POLICY "Involved parties can update partnerships" ON public.animal_partnerships
    FOR UPDATE USING (
        -- Dono do animal (usando coluna denormalizada)
        animal_owner_id = auth.uid()
        OR
        -- Sócio pode atualizar (aceitar/rejeitar)
        partner_id = auth.uid()
        OR
        -- Admin
        EXISTS (
            SELECT 1 
            FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

COMMENT ON POLICY "Involved parties can update partnerships" ON public.animal_partnerships IS 
'Dono, sócio ou admin podem atualizar partnerships (sem recursão em animals)';

-- 2.3 INSERT Policy (já existe, mas vamos melhorar)
DROP POLICY IF EXISTS "Owners can create partnerships" ON public.animal_partnerships;

CREATE POLICY "Owners can create partnerships" ON public.animal_partnerships
    FOR INSERT 
    WITH CHECK (
        -- Verificar se usuário é dono (a coluna será populada pelo trigger)
        animal_owner_id = auth.uid()
        OR
        -- Admin
        EXISTS (
            SELECT 1 
            FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

COMMENT ON POLICY "Owners can create partnerships" ON public.animal_partnerships IS 
'Apenas dono do animal ou admin podem criar partnerships';

-- 2.4 DELETE Policy
DROP POLICY IF EXISTS "Involved parties can delete partnerships" ON public.animal_partnerships;

CREATE POLICY "Involved parties can delete partnerships" ON public.animal_partnerships
    FOR DELETE USING (
        -- Dono pode deletar
        animal_owner_id = auth.uid()
        OR
        -- Sócio pode se remover (deixar sociedade)
        partner_id = auth.uid()
        OR
        -- Admin
        EXISTS (
            SELECT 1 
            FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

COMMENT ON POLICY "Involved parties can delete partnerships" ON public.animal_partnerships IS 
'Dono, sócio ou admin podem deletar partnerships';

-- ======================================
-- PARTE 3: Índice para Performance
-- ======================================

CREATE INDEX IF NOT EXISTS idx_animal_partnerships_owner 
ON public.animal_partnerships(animal_owner_id);

COMMENT ON INDEX idx_animal_partnerships_owner IS 
'Índice para otimizar queries por dono do animal';

-- =====================================================
-- FIM DA MIGRAÇÃO 048
-- =====================================================

