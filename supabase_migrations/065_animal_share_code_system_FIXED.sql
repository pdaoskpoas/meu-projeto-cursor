-- =====================================================
-- MIGRAÇÃO 065: SISTEMA DE CÓDIGO EXCLUSIVO POR ANIMAL
-- Data: 17/11/2025
-- Versão: CORRIGIDA (sem RAISE NOTICE fora de blocos)
-- Descrição: Substituir sistema de convites por código exclusivo
-- =====================================================

-- =====================================================
-- PASSO 1: ADICIONAR CAMPO SHARE_CODE NA TABELA ANIMALS
-- =====================================================

-- Adicionar coluna apenas se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'animals' 
        AND column_name = 'share_code'
    ) THEN
        ALTER TABLE public.animals ADD COLUMN share_code TEXT UNIQUE;
        RAISE NOTICE 'Coluna share_code adicionada à tabela animals';
    ELSE
        RAISE NOTICE 'Coluna share_code já existe, pulando...';
    END IF;
END $$;

-- Criar índice apenas se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_animals_share_code'
    ) THEN
        CREATE INDEX idx_animals_share_code ON public.animals(share_code);
        RAISE NOTICE 'Índice idx_animals_share_code criado';
    ELSE
        RAISE NOTICE 'Índice idx_animals_share_code já existe, pulando...';
    END IF;
END $$;

COMMENT ON COLUMN public.animals.share_code IS 
  'Código exclusivo para compartilhamento do animal (formato: ANI-XXXXXX-YY)';

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
    max_attempts INTEGER := 100;
BEGIN
    LOOP
        attempts := attempts + 1;
        
        -- Segurança: Evitar loop infinito
        IF attempts > max_attempts THEN
            RAISE EXCEPTION 'Não foi possível gerar código único após % tentativas', max_attempts;
        END IF;
        
        -- Formato: ANI-XXXXXX-YY
        random_code := 'ANI-' || 
                      UPPER(SUBSTRING(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT) FROM 1 FOR 6)) || 
                      '-' || 
                      SUBSTRING(EXTRACT(YEAR FROM NOW())::TEXT FROM 3 FOR 2);
        
        -- Verificar se já existe
        SELECT EXISTS (
            SELECT 1 FROM public.animals WHERE share_code = random_code
        ) INTO exists_check;
        
        -- Se não existe, retornar
        IF NOT exists_check THEN
            RETURN random_code;
        END IF;
    END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION public.generate_animal_share_code() TO authenticated;

COMMENT ON FUNCTION public.generate_animal_share_code IS 
  'Gera código exclusivo para compartilhamento de animal (formato: ANI-XXXXXX-YY). Exemplo: ANI-R3L4MP-25';

-- =====================================================
-- PASSO 3: TRIGGER PARA GERAR CÓDIGO AUTOMATICAMENTE
-- =====================================================

CREATE OR REPLACE FUNCTION public.set_animal_share_code()
RETURNS TRIGGER 
LANGUAGE plpgsql
AS $$
BEGIN
    -- Gerar código apenas se não foi fornecido
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

COMMENT ON TRIGGER trigger_set_animal_share_code ON public.animals IS 
  'Gera automaticamente código exclusivo ao criar novo animal';

-- =====================================================
-- PASSO 4: POPULAR CÓDIGOS PARA ANIMAIS EXISTENTES
-- =====================================================

DO $$
DECLARE
  animal_record RECORD;
  total_animals INTEGER := 0;
  processed_count INTEGER := 0;
BEGIN
  -- Contar total de animais sem código
  SELECT COUNT(*) INTO total_animals 
  FROM public.animals 
  WHERE share_code IS NULL;
  
  IF total_animals > 0 THEN
    RAISE NOTICE 'Encontrados % animais sem código, gerando...', total_animals;
    
    -- Popular códigos em lotes
    FOR animal_record IN 
      SELECT id FROM public.animals WHERE share_code IS NULL
    LOOP
      UPDATE public.animals 
      SET share_code = generate_animal_share_code() 
      WHERE id = animal_record.id;
      
      processed_count := processed_count + 1;
      
      -- Log a cada 100 animais
      IF processed_count % 100 = 0 THEN
        RAISE NOTICE 'Processados %/%', processed_count, total_animals;
      END IF;
    END LOOP;
    
    RAISE NOTICE 'Total de % códigos gerados com sucesso', processed_count;
  ELSE
    RAISE NOTICE 'Todos os animais já possuem código, pulando...';
  END IF;
END $$;

-- Validar que todos os animais têm código
DO $$
DECLARE
  count_without_code INTEGER;
  total_animals INTEGER;
  count_duplicates INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_animals FROM public.animals;
  
  SELECT COUNT(*) INTO count_without_code
  FROM public.animals
  WHERE share_code IS NULL;
  
  SELECT COUNT(*) INTO count_duplicates FROM (
    SELECT share_code, COUNT(*) as count
    FROM public.animals
    WHERE share_code IS NOT NULL
    GROUP BY share_code
    HAVING COUNT(*) > 1
  ) dupes;
  
  IF count_without_code > 0 THEN
    RAISE EXCEPTION 'ERRO: Ainda existem % animais sem código exclusivo', count_without_code;
  END IF;
  
  IF count_duplicates > 0 THEN
    RAISE EXCEPTION 'ERRO: Existem % códigos duplicados!', count_duplicates;
  END IF;
  
  RAISE NOTICE 'Validação OK: % animais, todos com código único', total_animals;
END $$;

-- =====================================================
-- PASSO 5: MIGRAR DADOS DA TABELA ANIMAL_PARTNERSHIPS
-- =====================================================

-- Adicionar novas colunas apenas se não existirem
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'animal_partnerships' 
        AND column_name = 'joined_at'
    ) THEN
        ALTER TABLE public.animal_partnerships 
        ADD COLUMN joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Coluna joined_at adicionada';
    ELSE
        RAISE NOTICE 'Coluna joined_at já existe';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'animal_partnerships' 
        AND column_name = 'added_by'
    ) THEN
        ALTER TABLE public.animal_partnerships 
        ADD COLUMN added_by UUID REFERENCES profiles(id);
        RAISE NOTICE 'Coluna added_by adicionada';
    ELSE
        RAISE NOTICE 'Coluna added_by já existe';
    END IF;
END $$;

-- Popular joined_at para registros existentes (usar created_at como base)
UPDATE public.animal_partnerships 
SET joined_at = created_at 
WHERE joined_at IS NULL;

-- Popular added_by com partner_id para registros existentes
UPDATE public.animal_partnerships 
SET added_by = partner_id 
WHERE added_by IS NULL;

-- Relatório de convites pendentes/rejeitados
DO $$
DECLARE
  count_pending INTEGER;
  count_rejected INTEGER;
  count_accepted INTEGER;
BEGIN
  -- Verificar se coluna status existe
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'animal_partnerships' 
    AND column_name = 'status'
  ) THEN
    SELECT COUNT(*) INTO count_pending 
    FROM public.animal_partnerships 
    WHERE status = 'pending';
    
    SELECT COUNT(*) INTO count_rejected 
    FROM public.animal_partnerships 
    WHERE status = 'rejected';
    
    SELECT COUNT(*) INTO count_accepted 
    FROM public.animal_partnerships 
    WHERE status = 'accepted';
    
    RAISE NOTICE 'Sociedades aceitas: %', count_accepted;
    RAISE NOTICE 'Convites pendentes: %', count_pending;
    RAISE NOTICE 'Convites rejeitados: %', count_rejected;
    
    -- Deletar convites não aceitos
    IF count_pending > 0 OR count_rejected > 0 THEN
      RAISE WARNING 'Deletando % convites pendentes/rejeitados', (count_pending + count_rejected);
      DELETE FROM public.animal_partnerships 
      WHERE status IN ('pending', 'rejected');
      RAISE NOTICE 'Convites não aceitos removidos';
    END IF;
  ELSE
    RAISE NOTICE 'Coluna status não existe, pulando limpeza de convites';
  END IF;
END $$;

-- Remover colunas obsoletas apenas se existirem
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'animal_partnerships' 
        AND column_name = 'status'
    ) THEN
        ALTER TABLE public.animal_partnerships DROP COLUMN status;
        RAISE NOTICE 'Coluna status removida';
    ELSE
        RAISE NOTICE 'Coluna status não existe, pulando...';
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'animal_partnerships' 
        AND column_name = 'partner_public_code'
    ) THEN
        ALTER TABLE public.animal_partnerships DROP COLUMN partner_public_code;
        RAISE NOTICE 'Coluna partner_public_code removida';
    ELSE
        RAISE NOTICE 'Coluna partner_public_code não existe, pulando...';
    END IF;
END $$;

-- Atualizar comentários da tabela
COMMENT ON TABLE public.animal_partnerships IS 
  'Sociedades ativas de animais (sistema baseado em código exclusivo do animal)';

COMMENT ON COLUMN public.animal_partnerships.joined_at IS 
  'Data e hora em que o sócio se associou ao animal';

COMMENT ON COLUMN public.animal_partnerships.added_by IS 
  'ID do usuário que criou a associação (para auditoria)';

-- =====================================================
-- PASSO 6: ATUALIZAR FUNÇÕES SQL
-- =====================================================

-- 6.1: Atualizar função de contagem (remover filtro de status)
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
        -- Animais próprios ativos (não pagos individualmente)
        SELECT id as animal_id
        FROM public.animals
        WHERE owner_id = user_id_param
          AND ad_status = 'active'
          AND is_individual_paid = false
        
        UNION
        
        -- Animais em sociedade (sem filtro de status)
        SELECT ap.animal_id
        FROM public.animal_partnerships ap
        JOIN public.profiles p ON p.id = user_id_param
        WHERE ap.partner_id = user_id_param
          AND p.plan IS NOT NULL
          AND p.plan != 'free'
          AND (p.plan_expires_at IS NULL OR p.plan_expires_at > NOW())
          AND EXISTS (
              SELECT 1 FROM public.animals
              WHERE id = ap.animal_id
                AND ad_status = 'active'
          )
    ) combined;
    
    RETURN COALESCE(total_count, 0);
END;
$$;

COMMENT ON FUNCTION public.count_active_animals_with_partnerships IS 
  'Conta animais ativos do usuário incluindo sociedades (sistema de código exclusivo)';

-- 6.2: Atualizar função should_animal_be_active
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
    -- Verificar se o dono tem plano ativo
    SELECT EXISTS (
        SELECT 1
        FROM public.animals a
        JOIN public.profiles p ON p.id = a.owner_id
        WHERE a.id = animal_id_param
          AND p.plan IS NOT NULL
          AND p.plan != 'free'
          AND (p.plan_expires_at IS NULL OR p.plan_expires_at > NOW())
    ) INTO owner_has_plan;
    
    -- Verificar se algum sócio tem plano ativo (sem filtro de status)
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

-- 6.3: Atualizar função get_profile_animals
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
          -- É o dono
          a.owner_id = profile_user_id
          OR
          -- É sócio com plano ativo
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

-- 6.4: REMOVER função can_accept_partnership (não é mais necessária)
DROP FUNCTION IF EXISTS public.can_accept_partnership(UUID, UUID);

-- =====================================================
-- PASSO 7: ATUALIZAR VIEW ANIMALS_WITH_PARTNERSHIPS
-- =====================================================

CREATE OR REPLACE VIEW public.animals_with_partnerships AS
SELECT 
    a.*,
    -- Estatísticas
    COALESCE(imp.impression_count, 0) as impression_count,
    COALESCE(cl.click_count, 0) as click_count,
    CASE 
        WHEN COALESCE(imp.impression_count, 0) > 0 
        THEN ROUND((COALESCE(cl.click_count, 0)::DECIMAL / imp.impression_count) * 100, 2)
        ELSE 0 
    END as click_rate,
    
    -- Informações do dono
    p.name as owner_name,
    p.public_code as owner_public_code,
    p.account_type as owner_account_type,
    
    -- Array de sócios (sem filtro de status)
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
    
    -- Contadores de sociedade
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

COMMENT ON VIEW public.animals_with_partnerships IS 
  'Animais com estatísticas e informações detalhadas de sociedades (sistema de código exclusivo)';

-- =====================================================
-- PASSO 8: ATUALIZAR TRIGGERS DE NOTIFICAÇÕES
-- =====================================================

-- Remover trigger antigo
DROP TRIGGER IF EXISTS trigger_notify_on_partnership_accepted 
ON public.animal_partnerships;

DROP FUNCTION IF EXISTS public.notify_on_partnership_accepted();

-- Criar novo trigger (notificar dono quando alguém se associa via código)
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
  -- Buscar informações do animal e dono
  SELECT name, owner_id INTO v_animal_name, v_owner_id
  FROM public.animals
  WHERE id = NEW.animal_id;
  
  -- Buscar nome do sócio
  SELECT name INTO v_partner_name
  FROM public.profiles
  WHERE id = NEW.partner_id;
  
  -- Notificar o dono do animal (se função create_notification existir)
  IF EXISTS (
    SELECT 1 FROM information_schema.routines 
    WHERE routine_name = 'create_notification'
  ) THEN
    PERFORM public.create_notification(
      p_user_id := v_owner_id,
      p_type := 'new_partnership',
      p_title := 'Novo Sócio',
      p_message := v_partner_name || ' agora é sócio do animal "' || v_animal_name || '" usando o código exclusivo.',
      p_action_url := '/animal/' || NEW.animal_id,
      p_metadata := jsonb_build_object(
        'animal_id', NEW.animal_id,
        'animal_name', v_animal_name,
        'partnership_id', NEW.id,
        'partner_id', NEW.partner_id,
        'partner_name', v_partner_name,
        'joined_at', NEW.joined_at
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

COMMENT ON TRIGGER trigger_notify_on_new_partnership ON public.animal_partnerships IS 
  'Notifica o dono quando alguém se associa ao animal via código exclusivo';

-- =====================================================
-- PASSO 9: ATUALIZAR RLS POLICIES
-- =====================================================

-- Atualizar policy de visualização para sócios
DROP POLICY IF EXISTS "Partners with active plan can view animals" ON public.animals;

CREATE POLICY "Partners with active plan can view animals" ON public.animals
    FOR SELECT USING (
        -- Usuário é sócio E tem plano ativo (sem filtro de status)
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

COMMENT ON POLICY "Partners with active plan can view animals" ON public.animals IS 
  'Sócios com plano ativo podem visualizar animais onde são parceiros (sistema de código exclusivo)';

-- =====================================================
-- PASSO 10: GRANTS E PERMISSÕES
-- =====================================================

-- Garantir acesso à view
GRANT SELECT ON public.animals_with_partnerships TO authenticated;
GRANT SELECT ON public.animals_with_partnerships TO anon;

-- Garantir execução das funções
GRANT EXECUTE ON FUNCTION public.count_active_animals_with_partnerships(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.should_animal_be_active(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_animal_message_recipient(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_profile_animals(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_profile_animals(UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.generate_animal_share_code() TO authenticated;

-- =====================================================
-- VALIDAÇÕES FINAIS E RELATÓRIO
-- =====================================================

DO $$
DECLARE
  total_animals INTEGER;
  animals_with_code INTEGER;
  duplicate_codes INTEGER;
  total_partnerships INTEGER;
  partnerships_with_joined_at INTEGER;
BEGIN
  -- Contar animais
  SELECT COUNT(*) INTO total_animals FROM public.animals;
  SELECT COUNT(*) INTO animals_with_code 
  FROM public.animals WHERE share_code IS NOT NULL;
  
  -- Verificar duplicações
  SELECT COUNT(*) INTO duplicate_codes FROM (
    SELECT share_code, COUNT(*) as count
    FROM public.animals
    WHERE share_code IS NOT NULL
    GROUP BY share_code
    HAVING COUNT(*) > 1
  ) dupes;
  
  -- Validar partnerships
  SELECT COUNT(*) INTO total_partnerships FROM public.animal_partnerships;
  SELECT COUNT(*) INTO partnerships_with_joined_at 
  FROM public.animal_partnerships WHERE joined_at IS NOT NULL;
  
  -- Validações críticas
  IF total_animals != animals_with_code THEN
    RAISE EXCEPTION 'ERRO: Nem todos os animais possuem código exclusivo (% de %)', 
      animals_with_code, total_animals;
  END IF;
  
  IF duplicate_codes > 0 THEN
    RAISE EXCEPTION 'ERRO: Existem % códigos duplicados!', duplicate_codes;
  END IF;
  
  IF total_partnerships > 0 AND total_partnerships != partnerships_with_joined_at THEN
    RAISE WARNING 'AVISO: Nem todas as sociedades têm joined_at (% de %)', 
      partnerships_with_joined_at, total_partnerships;
  END IF;
  
  -- Relatório final
  RAISE NOTICE '';
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'MIGRATION 065 CONCLUÍDA COM SUCESSO!';
  RAISE NOTICE '===========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'ESTATÍSTICAS FINAIS:';
  RAISE NOTICE '  - Animais processados: %', total_animals;
  RAISE NOTICE '  - Códigos gerados: %', animals_with_code;
  RAISE NOTICE '  - Códigos duplicados: %', duplicate_codes;
  RAISE NOTICE '  - Sociedades ativas: %', total_partnerships;
  RAISE NOTICE '';
  RAISE NOTICE 'ALTERAÇÕES APLICADAS:';
  RAISE NOTICE '  - Campo share_code adicionado';
  RAISE NOTICE '  - Trigger automático criado';
  RAISE NOTICE '  - Tabela animal_partnerships simplificada';
  RAISE NOTICE '  - 3 funções SQL atualizadas';
  RAISE NOTICE '  - 1 função SQL removida (can_accept_partnership)';
  RAISE NOTICE '  - View animals_with_partnerships atualizada';
  RAISE NOTICE '  - Sistema de notificações adaptado';
  RAISE NOTICE '  - Políticas RLS ajustadas';
  RAISE NOTICE '';
  RAISE NOTICE '===========================================';
END $$;

-- =====================================================
-- FIM DA MIGRAÇÃO 065
-- =====================================================

