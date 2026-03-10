-- =====================================================
-- MIGRAÇÃO 065: SISTEMA DE CÓDIGO EXCLUSIVO POR ANIMAL
-- Versão: FINAL CORRIGIDA (com remoção de dependências)
-- Data: 17/11/2025
-- =====================================================
-- 
-- IMPORTANTE: Esta migration remove a coluna 'status' de animal_partnerships
-- mas ANTES remove TODAS as dependências conforme erro do Supabase:
--   1. Policies em impressions
--   2. Policies em clicks  
--   3. View animals_with_partnerships
--   4. Trigger trigger_notify_on_partnership_accepted
--
-- =====================================================

-- =====================================================
-- PASSO 1: ADICIONAR CAMPO SHARE_CODE EM ANIMALS
-- =====================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'animals' 
        AND column_name = 'share_code'
    ) THEN
        ALTER TABLE public.animals ADD COLUMN share_code TEXT UNIQUE;
        RAISE NOTICE '[1/11] Coluna share_code adicionada';
    ELSE
        RAISE NOTICE '[1/11] Coluna share_code já existe';
    END IF;
END $$;

-- Criar índice
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_animals_share_code'
    ) THEN
        CREATE INDEX idx_animals_share_code ON public.animals(share_code);
        RAISE NOTICE '[2/11] Índice idx_animals_share_code criado';
    ELSE
        RAISE NOTICE '[2/11] Índice já existe';
    END IF;
END $$;

COMMENT ON COLUMN public.animals.share_code IS 
  'Código exclusivo para compartilhamento (formato: ANI-XXXXXX-YY)';

-- =====================================================
-- PASSO 2: FUNÇÃO PARA GERAR CÓDIGO ÚNICO
-- =====================================================

CREATE OR REPLACE FUNCTION public.generate_animal_share_code()
RETURNS TEXT 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    random_code TEXT;
    exists_check BOOLEAN;
    attempts INTEGER := 0;
BEGIN
    LOOP
        attempts := attempts + 1;
        IF attempts > 100 THEN
            RAISE EXCEPTION 'Não foi possível gerar código único após 100 tentativas';
        END IF;
        
        random_code := 'ANI-' || 
                      UPPER(SUBSTRING(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT) FROM 1 FOR 6)) || 
                      '-' || 
                      SUBSTRING(EXTRACT(YEAR FROM NOW())::TEXT FROM 3 FOR 2);
        
        SELECT EXISTS (
            SELECT 1 FROM public.animals WHERE share_code = random_code
        ) INTO exists_check;
        
        IF NOT exists_check THEN
            RETURN random_code;
        END IF;
    END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION public.generate_animal_share_code() TO authenticated;

DO $$ BEGIN RAISE NOTICE '[3/11] Função generate_animal_share_code criada'; END $$;

-- =====================================================
-- PASSO 3: TRIGGER PARA GERAR CÓDIGO AUTOMATICAMENTE
-- =====================================================

CREATE OR REPLACE FUNCTION public.set_animal_share_code()
RETURNS TRIGGER 
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.share_code IS NULL THEN
        NEW.share_code := generate_animal_share_code();
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_set_animal_share_code ON public.animals;

CREATE TRIGGER trigger_set_animal_share_code
BEFORE INSERT ON public.animals
FOR EACH ROW
EXECUTE FUNCTION set_animal_share_code();

DO $$ BEGIN RAISE NOTICE '[4/11] Trigger de geração automática criado'; END $$;

-- =====================================================
-- PASSO 4: POPULAR CÓDIGOS PARA ANIMAIS EXISTENTES
-- =====================================================

DO $$
DECLARE
  animal_record RECORD;
  total_animals INTEGER := 0;
  processed_count INTEGER := 0;
BEGIN
  SELECT COUNT(*) INTO total_animals 
  FROM public.animals 
  WHERE share_code IS NULL;
  
  IF total_animals > 0 THEN
    RAISE NOTICE '[5/11] Gerando códigos para % animais...', total_animals;
    
    FOR animal_record IN 
      SELECT id FROM public.animals WHERE share_code IS NULL
    LOOP
      UPDATE public.animals 
      SET share_code = generate_animal_share_code() 
      WHERE id = animal_record.id;
      
      processed_count := processed_count + 1;
      IF processed_count % 100 = 0 THEN
        RAISE NOTICE '  Processados %/%', processed_count, total_animals;
      END IF;
    END LOOP;
    
    RAISE NOTICE '  Total: % códigos gerados', processed_count;
  ELSE
    RAISE NOTICE '[5/11] Todos os animais já têm código';
  END IF;
  
  -- Validar
  SELECT COUNT(*) INTO total_animals FROM public.animals WHERE share_code IS NULL;
  IF total_animals > 0 THEN
    RAISE EXCEPTION 'ERRO: % animais ainda sem código!', total_animals;
  END IF;
END $$;

-- =====================================================
-- PASSO 5: ADICIONAR NOVAS COLUNAS EM ANIMAL_PARTNERSHIPS
-- =====================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'animal_partnerships' 
        AND column_name = 'joined_at'
    ) THEN
        ALTER TABLE public.animal_partnerships 
        ADD COLUMN joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE '[6/11] Coluna joined_at adicionada';
    ELSE
        RAISE NOTICE '[6/11] Coluna joined_at já existe';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'animal_partnerships' 
        AND column_name = 'added_by'
    ) THEN
        ALTER TABLE public.animal_partnerships 
        ADD COLUMN added_by UUID REFERENCES profiles(id);
        RAISE NOTICE '[6/11] Coluna added_by adicionada';
    ELSE
        RAISE NOTICE '[6/11] Coluna added_by já existe';
    END IF;
END $$;

-- Popular colunas
UPDATE public.animal_partnerships 
SET joined_at = created_at 
WHERE joined_at IS NULL;

UPDATE public.animal_partnerships 
SET added_by = partner_id 
WHERE added_by IS NULL;

-- =====================================================
-- PASSO 6: MIGRAR DADOS (DELETAR PENDENTES/REJEITADOS)
-- =====================================================

DO $$
DECLARE
  count_pending INTEGER;
  count_rejected INTEGER;
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'animal_partnerships' AND column_name = 'status'
  ) THEN
    SELECT COUNT(*) INTO count_pending FROM public.animal_partnerships WHERE status = 'pending';
    SELECT COUNT(*) INTO count_rejected FROM public.animal_partnerships WHERE status = 'rejected';
    
    RAISE NOTICE '[7/11] Limpando convites não aceitos...';
    RAISE NOTICE '  - Pendentes: %', count_pending;
    RAISE NOTICE '  - Rejeitados: %', count_rejected;
    
    IF (count_pending + count_rejected) > 0 THEN
      DELETE FROM public.animal_partnerships WHERE status IN ('pending', 'rejected');
      RAISE NOTICE '  Removidos: %', (count_pending + count_rejected);
    END IF;
  ELSE
    RAISE NOTICE '[7/11] Coluna status não existe, pulando limpeza';
  END IF;
END $$;

-- =====================================================
-- PASSO 7: REMOVER DEPENDÊNCIAS DA COLUNA STATUS
-- =====================================================

DO $$ BEGIN RAISE NOTICE '[8/11] Removendo dependências da coluna status...'; END $$;

-- 7.1: Dropar policies em IMPRESSIONS que dependem de status
DROP POLICY IF EXISTS "Partners can view partnership analytics" ON public.impressions;

-- 7.2: Dropar policies em CLICKS que dependem de status  
DROP POLICY IF EXISTS "Partners can view partnership clicks" ON public.clicks;

-- 7.3: Dropar VIEW que depende de status
DROP VIEW IF EXISTS public.animals_with_partnerships CASCADE;

-- 7.4: Dropar TRIGGER que depende de status
DROP TRIGGER IF EXISTS trigger_notify_on_partnership_accepted ON public.animal_partnerships;
DROP FUNCTION IF EXISTS public.notify_on_partnership_accepted();

-- 7.5: Dropar ÍNDICES que dependem de status
DROP INDEX IF EXISTS public.idx_animal_partnerships_status;
DROP INDEX IF EXISTS public.idx_animal_partnerships_partner_accepted;
DROP INDEX IF EXISTS public.idx_animal_partnerships_animal_status;

DO $$ BEGIN RAISE NOTICE '  Todas as dependências removidas'; END $$;

-- =====================================================
-- PASSO 8: REMOVER COLUNA STATUS
-- =====================================================

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'animal_partnerships' 
        AND column_name = 'status'
    ) THEN
        ALTER TABLE public.animal_partnerships DROP COLUMN status;
        RAISE NOTICE '[9/11] Coluna status removida com sucesso';
    ELSE
        RAISE NOTICE '[9/11] Coluna status não existe';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'animal_partnerships' 
        AND column_name = 'partner_public_code'
    ) THEN
        ALTER TABLE public.animal_partnerships DROP COLUMN partner_public_code;
        RAISE NOTICE '[9/11] Coluna partner_public_code removida';
    ELSE
        RAISE NOTICE '[9/11] Coluna partner_public_code não existe';
    END IF;
END $$;

-- =====================================================
-- PASSO 9: ATUALIZAR FUNÇÕES SQL (SEM FILTRO DE STATUS)
-- =====================================================

DO $$ BEGIN RAISE NOTICE '[10/11] Atualizando funções SQL...'; END $$;

-- 9.1: count_active_animals_with_partnerships
CREATE OR REPLACE FUNCTION public.count_active_animals_with_partnerships(user_id_param UUID)
RETURNS INTEGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    total_count INTEGER;
BEGIN
    SELECT COUNT(DISTINCT animal_id)::INTEGER INTO total_count
    FROM (
        SELECT id as animal_id
        FROM public.animals
        WHERE owner_id = user_id_param
          AND ad_status = 'active'
          AND is_individual_paid = false
        
        UNION
        
        SELECT ap.animal_id
        FROM public.animal_partnerships ap
        JOIN public.profiles p ON p.id = user_id_param
        WHERE ap.partner_id = user_id_param
          AND p.plan IS NOT NULL
          AND p.plan != 'free'
          AND (p.plan_expires_at IS NULL OR p.plan_expires_at > NOW())
          AND EXISTS (
              SELECT 1 FROM public.animals
              WHERE id = ap.animal_id AND ad_status = 'active'
          )
    ) combined;
    
    RETURN COALESCE(total_count, 0);
END;
$$;

-- 9.2: should_animal_be_active
CREATE OR REPLACE FUNCTION public.should_animal_be_active(animal_id_param UUID)
RETURNS BOOLEAN 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    owner_has_plan BOOLEAN;
    partner_has_plan BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM public.animals a
        JOIN public.profiles p ON p.id = a.owner_id
        WHERE a.id = animal_id_param
          AND p.plan IS NOT NULL
          AND p.plan != 'free'
          AND (p.plan_expires_at IS NULL OR p.plan_expires_at > NOW())
    ) INTO owner_has_plan;
    
    SELECT EXISTS (
        SELECT 1
        FROM public.animal_partnerships ap
        JOIN public.profiles p ON p.id = ap.partner_id
        WHERE ap.animal_id = animal_id_param
          AND p.plan IS NOT NULL
          AND p.plan != 'free'
          AND (p.plan_expires_at IS NULL OR p.plan_expires_at > NOW())
    ) INTO partner_has_plan;
    
    RETURN owner_has_plan OR partner_has_plan;
END;
$$;

-- 9.3: get_profile_animals
CREATE OR REPLACE FUNCTION public.get_profile_animals(profile_user_id UUID)
RETURNS TABLE (
    animal_id UUID,
    animal_name TEXT,
    breed TEXT,
    gender TEXT,
    ad_status TEXT,
    is_boosted BOOLEAN,
    is_owner BOOLEAN,
    is_partner BOOLEAN,
    partnership_percentage DECIMAL,
    impression_count BIGINT,
    click_count BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id as animal_id,
        a.name as animal_name,
        a.breed,
        a.gender,
        a.ad_status,
        a.is_boosted,
        (a.owner_id = profile_user_id) as is_owner,
        (ap.partner_id = profile_user_id) as is_partner,
        ap.percentage as partnership_percentage,
        COALESCE(imp.impression_count, 0) as impression_count,
        COALESCE(cl.click_count, 0) as click_count
    FROM public.animals a
    LEFT JOIN public.animal_partnerships ap 
        ON a.id = ap.animal_id 
        AND ap.partner_id = profile_user_id
    LEFT JOIN (
        SELECT content_id, COUNT(*) as impression_count
        FROM public.impressions 
        WHERE content_type = 'animal'
        GROUP BY content_id
    ) imp ON a.id = imp.content_id
    LEFT JOIN (
        SELECT content_id, COUNT(*) as click_count
        FROM public.clicks 
        WHERE content_type = 'animal'
        GROUP BY content_id
    ) cl ON a.id = cl.content_id
    WHERE a.ad_status = 'active'
      AND (
          a.owner_id = profile_user_id
          OR
          (
              ap.partner_id = profile_user_id
              AND EXISTS (
                  SELECT 1 FROM public.profiles p
                  WHERE p.id = profile_user_id
                    AND p.plan IS NOT NULL
                    AND p.plan != 'free'
                    AND (p.plan_expires_at IS NULL OR p.plan_expires_at > NOW())
              )
          )
      )
    ORDER BY a.created_at DESC;
END;
$$;

-- 9.4: Remover função obsoleta
DROP FUNCTION IF EXISTS public.can_accept_partnership(UUID, UUID);

-- =====================================================
-- PASSO 10: RECRIAR VIEW ANIMALS_WITH_PARTNERSHIPS
-- =====================================================

CREATE OR REPLACE VIEW public.animals_with_partnerships AS
SELECT 
    a.*,
    COALESCE(imp.impression_count, 0) as impression_count,
    COALESCE(cl.click_count, 0) as click_count,
    CASE 
        WHEN COALESCE(imp.impression_count, 0) > 0 
        THEN ROUND((COALESCE(cl.click_count, 0)::DECIMAL / imp.impression_count) * 100, 2)
        ELSE 0 
    END as click_rate,
    p.name as owner_name,
    p.public_code as owner_public_code,
    p.account_type as owner_account_type,
    COALESCE(
        json_agg(
            json_build_object(
                'partner_id', ap.partner_id,
                'partner_name', pp.name,
                'partner_property_name', COALESCE(pp.property_name, pp.name),
                'partner_public_code', pp.public_code,
                'partner_account_type', pp.account_type,
                'partner_avatar_url', pp.avatar_url,
                'percentage', ap.percentage,
                'joined_at', ap.joined_at,
                'has_active_plan', (
                    pp.plan IS NOT NULL 
                    AND pp.plan != 'free' 
                    AND (pp.plan_expires_at IS NULL OR pp.plan_expires_at > NOW())
                ),
                'created_at', ap.created_at
            ) ORDER BY ap.joined_at
        ) FILTER (WHERE ap.id IS NOT NULL),
        '[]'::json
    ) as partners,
    COUNT(ap.id) as active_partners_count
FROM public.animals a
LEFT JOIN public.profiles p ON a.owner_id = p.id
LEFT JOIN public.animal_partnerships ap ON a.id = ap.animal_id
LEFT JOIN public.profiles pp ON ap.partner_id = pp.id
LEFT JOIN (
    SELECT content_id, COUNT(*) as impression_count
    FROM public.impressions 
    WHERE content_type = 'animal'
    GROUP BY content_id
) imp ON a.id = imp.content_id
LEFT JOIN (
    SELECT content_id, COUNT(*) as click_count
    FROM public.clicks 
    WHERE content_type = 'animal'
    GROUP BY content_id
) cl ON a.id = cl.content_id
GROUP BY a.id, p.name, p.public_code, p.account_type, imp.impression_count, cl.click_count;

GRANT SELECT ON public.animals_with_partnerships TO authenticated;
GRANT SELECT ON public.animals_with_partnerships TO anon;

-- =====================================================
-- PASSO 11: RECRIAR TRIGGER DE NOTIFICAÇÕES
-- =====================================================

CREATE OR REPLACE FUNCTION public.notify_on_new_partnership()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_animal_name TEXT;
  v_partner_name TEXT;
  v_owner_id UUID;
BEGIN
  SELECT name, owner_id INTO v_animal_name, v_owner_id
  FROM public.animals WHERE id = NEW.animal_id;
  
  SELECT name INTO v_partner_name
  FROM public.profiles WHERE id = NEW.partner_id;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.routines 
    WHERE routine_name = 'create_notification'
  ) THEN
    PERFORM public.create_notification(
      p_user_id := v_owner_id,
      p_type := 'new_partnership',
      p_title := 'Novo Sócio',
      p_message := v_partner_name || ' agora é sócio do animal "' || v_animal_name || '".',
      p_action_url := '/animal/' || NEW.animal_id,
      p_metadata := jsonb_build_object(
        'animal_id', NEW.animal_id,
        'partnership_id', NEW.id,
        'partner_id', NEW.partner_id
      ),
      p_related_content_type := 'partnership',
      p_related_content_id := NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notify_on_new_partnership ON public.animal_partnerships;

CREATE TRIGGER trigger_notify_on_new_partnership
  AFTER INSERT ON public.animal_partnerships
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_new_partnership();

-- =====================================================
-- PASSO 12: ATUALIZAR RLS POLICY (SEM FILTRO DE STATUS)
-- =====================================================

DROP POLICY IF EXISTS "Partners with active plan can view animals" ON public.animals;

CREATE POLICY "Partners with active plan can view animals" ON public.animals
    FOR SELECT USING (
        EXISTS (
            SELECT 1
            FROM public.animal_partnerships ap
            JOIN public.profiles p ON ap.partner_id = p.id
            WHERE ap.animal_id = animals.id
              AND ap.partner_id = auth.uid()
              AND p.plan IS NOT NULL
              AND p.plan != 'free'
              AND (p.plan_expires_at IS NULL OR p.plan_expires_at > NOW())
        )
    );

-- =====================================================
-- PASSO 13: GRANTS E PERMISSÕES
-- =====================================================

GRANT EXECUTE ON FUNCTION public.count_active_animals_with_partnerships(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.should_animal_be_active(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_animal_message_recipient(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_profile_animals(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_profile_animals(UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.generate_animal_share_code() TO authenticated;

-- =====================================================
-- VALIDAÇÕES FINAIS
-- =====================================================

DO $$
DECLARE
  total_animals INTEGER;
  animals_with_code INTEGER;
  duplicate_codes INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_animals FROM public.animals;
  SELECT COUNT(*) INTO animals_with_code FROM public.animals WHERE share_code IS NOT NULL;
  
  SELECT COUNT(*) INTO duplicate_codes FROM (
    SELECT share_code, COUNT(*) as count
    FROM public.animals
    WHERE share_code IS NOT NULL
    GROUP BY share_code
    HAVING COUNT(*) > 1
  ) dupes;
  
  IF total_animals != animals_with_code THEN
    RAISE EXCEPTION 'ERRO: % animais sem código (total: %)', 
      (total_animals - animals_with_code), total_animals;
  END IF;
  
  IF duplicate_codes > 0 THEN
    RAISE EXCEPTION 'ERRO: % códigos duplicados encontrados!', duplicate_codes;
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '====================================';
  RAISE NOTICE 'MIGRATION 065 CONCLUÍDA COM SUCESSO!';
  RAISE NOTICE '====================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Animais processados: %', total_animals;
  RAISE NOTICE 'Códigos gerados: %', animals_with_code;
  RAISE NOTICE 'Códigos duplicados: 0';
  RAISE NOTICE '';
  RAISE NOTICE 'ALTERAÇÕES:';
  RAISE NOTICE '  - Campo share_code adicionado';
  RAISE NOTICE '  - Trigger automático criado';
  RAISE NOTICE '  - Tabela simplificada (status removido)';
  RAISE NOTICE '  - 3 funções atualizadas';
  RAISE NOTICE '  - View recriada';
  RAISE NOTICE '  - Trigger de notificações atualizado';
  RAISE NOTICE '  - Policies atualizadas';
  RAISE NOTICE '';
  RAISE NOTICE '====================================';
END $$;

-- =====================================================
-- FIM DA MIGRAÇÃO 065
-- =====================================================

