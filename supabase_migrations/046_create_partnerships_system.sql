-- =====================================================
-- MIGRAÇÃO 046: SISTEMA COMPLETO DE SOCIEDADES
-- Data: 04/11/2025
-- Descrição: Views, funções e policies para sociedades de animais
-- =====================================================

-- =====================================================
-- 1. FUNÇÃO: CONTAR ANIMAIS ATIVOS COM SOCIEDADES
-- =====================================================

CREATE OR REPLACE FUNCTION public.count_active_animals_with_partnerships(user_id_param UUID)
RETURNS INTEGER AS $$
DECLARE
    total_count INTEGER;
BEGIN
    -- Contar animais próprios ativos + sociedades aceitas
    SELECT COUNT(DISTINCT animal_id)::INTEGER INTO total_count
    FROM (
        -- Animais próprios ativos (não pagos individualmente)
        SELECT id as animal_id
        FROM public.animals
        WHERE owner_id = user_id_param
          AND ad_status = 'active'
          AND is_individual_paid = false
        
        UNION
        
        -- Animais em sociedade aceitos (apenas se usuário tem plano ativo)
        SELECT ap.animal_id
        FROM public.animal_partnerships ap
        JOIN public.profiles p ON p.id = user_id_param
        WHERE ap.partner_id = user_id_param
          AND ap.status = 'accepted'
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.count_active_animals_with_partnerships IS 'Conta animais ativos do usuário incluindo sociedades aceitas';

-- =====================================================
-- 1.1 FUNÇÃO: VERIFICAR SE ANIMAL DEVE ESTAR ATIVO
-- =====================================================
-- Um animal fica ativo se:
-- - O dono (owner_id) tem plano ativo OU
-- - Pelo menos UM sócio com sociedade aceita tem plano ativo

CREATE OR REPLACE FUNCTION public.should_animal_be_active(animal_id_param UUID)
RETURNS BOOLEAN AS $$
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
    
    -- Verificar se algum sócio tem plano ativo
    SELECT EXISTS (
        SELECT 1
        FROM public.animal_partnerships ap
        JOIN public.profiles p ON p.id = ap.partner_id
        WHERE ap.animal_id = animal_id_param
          AND ap.status = 'accepted'
          AND p.plan IS NOT NULL
          AND p.plan != 'free'
          AND (p.plan_expires_at IS NULL OR p.plan_expires_at > NOW())
    ) INTO partner_has_plan;
    
    RETURN owner_has_plan OR partner_has_plan;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.should_animal_be_active IS 'Verifica se animal deve estar ativo baseado em planos do dono e sócios';

-- =====================================================
-- 1.2 FUNÇÃO: BUSCAR RESPONSÁVEL POR MENSAGENS
-- =====================================================
-- Sistema de fallback: dono → sócio 1 → sócio 2... (em ordem de aceitação)
-- Retorna o ID do usuário que deve receber mensagens sobre o animal

CREATE OR REPLACE FUNCTION public.get_animal_message_recipient(animal_id_param UUID)
RETURNS UUID AS $$
DECLARE
    owner_id_var UUID;
    owner_has_plan BOOLEAN;
    recipient_id UUID;
BEGIN
    -- Buscar dono do animal
    SELECT owner_id INTO owner_id_var
    FROM public.animals
    WHERE id = animal_id_param;
    
    -- Verificar se dono tem plano ativo
    SELECT 
        p.plan IS NOT NULL 
        AND p.plan != 'free' 
        AND (p.plan_expires_at IS NULL OR p.plan_expires_at > NOW())
    INTO owner_has_plan
    FROM public.profiles p
    WHERE p.id = owner_id_var;
    
    -- Se dono tem plano ativo, ele recebe
    IF owner_has_plan THEN
        RETURN owner_id_var;
    END IF;
    
    -- Caso contrário, buscar primeiro sócio com plano ativo (ordem de aceitação)
    SELECT ap.partner_id INTO recipient_id
    FROM public.animal_partnerships ap
    JOIN public.profiles p ON p.id = ap.partner_id
    WHERE ap.animal_id = animal_id_param
      AND ap.status = 'accepted'
      AND p.plan IS NOT NULL
      AND p.plan != 'free'
      AND (p.plan_expires_at IS NULL OR p.plan_expires_at > NOW())
    ORDER BY ap.updated_at ASC -- Primeiro que aceitou
    LIMIT 1;
    
    -- Se encontrou sócio ativo, retorna ele
    IF recipient_id IS NOT NULL THEN
        RETURN recipient_id;
    END IF;
    
    -- Fallback: retorna o dono mesmo sem plano (caso extremo)
    RETURN owner_id_var;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_animal_message_recipient IS 'Retorna quem deve receber mensagens: dono (se ativo) ou primeiro sócio ativo';

-- =====================================================
-- 2. VIEW: ANIMAIS COM INFORMAÇÕES DE SOCIEDADE
-- =====================================================

CREATE OR REPLACE VIEW public.animals_with_partnerships AS
SELECT 
    a.*,
    -- Estatísticas (do animals_with_stats)
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
    
    -- Informações de sociedade
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
                'status', ap.status,
                'has_active_plan', (
                    pp.plan IS NOT NULL 
                    AND pp.plan != 'free' 
                    AND (pp.plan_expires_at IS NULL OR pp.plan_expires_at > NOW())
                ),
                'created_at', ap.created_at
            ) ORDER BY ap.created_at
        ) FILTER (WHERE ap.id IS NOT NULL),
        '[]'::json
    ) as partners,
    
    -- Contadores de sociedade
    COUNT(ap.id) FILTER (WHERE ap.status = 'accepted') as active_partners_count,
    COUNT(ap.id) FILTER (WHERE ap.status = 'pending') as pending_partners_count
    
FROM public.animals a
LEFT JOIN public.profiles p ON a.owner_id = p.id
LEFT JOIN public.animal_partnerships ap ON a.id = ap.animal_id
LEFT JOIN public.profiles pp ON ap.partner_id = pp.id
LEFT JOIN (
    SELECT 
        content_id, 
        COUNT(*) as impression_count
    FROM public.impressions 
    WHERE content_type = 'animal'
    GROUP BY content_id
) imp ON a.id = imp.content_id
LEFT JOIN (
    SELECT 
        content_id, 
        COUNT(*) as click_count
    FROM public.clicks 
    WHERE content_type = 'animal'
    GROUP BY content_id
) cl ON a.id = cl.content_id
GROUP BY a.id, p.name, p.public_code, p.account_type, imp.impression_count, cl.click_count;

COMMENT ON VIEW public.animals_with_partnerships IS 'Animais com estatísticas e informações detalhadas de sociedades';

-- =====================================================
-- 3. FUNÇÃO: BUSCAR ANIMAIS DO PERFIL (com sociedades)
-- =====================================================

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
) AS $$
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
        AND ap.status = 'accepted'
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
          -- É sócio com sociedade aceita e plano ativo
          (
              ap.partner_id = profile_user_id
              AND ap.status = 'accepted'
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_profile_animals IS 'Retorna animais do perfil incluindo sociedades (apenas se usuário tem plano ativo)';

-- =====================================================
-- 4. FUNÇÃO: VERIFICAR SE PODE ACEITAR SOCIEDADE
-- =====================================================

CREATE OR REPLACE FUNCTION public.can_accept_partnership(
    partnership_id_param UUID,
    user_id_param UUID
)
RETURNS JSONB AS $$
DECLARE
    user_plan TEXT;
    plan_active BOOLEAN;
    current_count INTEGER;
    animal_limit INTEGER;
    partnership_status TEXT;
    partner_id_check UUID;
    animal_id_check UUID;
    current_partners_count INTEGER;
    result JSONB;
BEGIN
    -- Verificar se o convite existe e é para este usuário
    SELECT ap.status, ap.partner_id, ap.animal_id
    INTO partnership_status, partner_id_check, animal_id_check
    FROM public.animal_partnerships ap
    WHERE ap.id = partnership_id_param;
    
    IF partnership_status IS NULL THEN
        RETURN jsonb_build_object(
            'can_accept', false,
            'reason', 'not_found',
            'message', 'Convite não encontrado'
        );
    END IF;
    
    IF partner_id_check != user_id_param THEN
        RETURN jsonb_build_object(
            'can_accept', false,
            'reason', 'not_authorized',
            'message', 'Este convite não é para você'
        );
    END IF;
    
    IF partnership_status != 'pending' THEN
        RETURN jsonb_build_object(
            'can_accept', false,
            'reason', 'already_processed',
            'message', 'Este convite já foi processado'
        );
    END IF;
    
    -- Verificar limite de sócios do animal (máximo 10)
    SELECT COUNT(*)::INTEGER INTO current_partners_count
    FROM public.animal_partnerships
    WHERE animal_id = animal_id_check
      AND status = 'accepted';
    
    IF current_partners_count >= 10 THEN
        RETURN jsonb_build_object(
            'can_accept', false,
            'reason', 'animal_limit_reached',
            'message', 'Este animal já atingiu o limite de 10 sócios',
            'current_partners', current_partners_count,
            'max_partners', 10
        );
    END IF;
    
    -- Buscar plano do usuário
    SELECT p.plan, (p.plan_expires_at IS NULL OR p.plan_expires_at > NOW())
    INTO user_plan, plan_active
    FROM public.profiles p
    WHERE p.id = user_id_param;
    
    -- Se não tem plano ativo, não pode aceitar
    IF user_plan IS NULL OR user_plan = 'free' OR NOT plan_active THEN
        RETURN jsonb_build_object(
            'can_accept', false,
            'reason', 'no_active_plan',
            'message', 'Você precisa de um plano ativo para aceitar sociedades',
            'requires_plan', true
        );
    END IF;
    
    -- Contar animais ativos atuais
    current_count := public.count_active_animals_with_partnerships(user_id_param);
    
    -- Obter limite do plano
    animal_limit := CASE user_plan
        WHEN 'basic' THEN 10
        WHEN 'pro' THEN 15
        WHEN 'ultra' THEN 25
        WHEN 'vip' THEN 15
        ELSE 0
    END;
    
    -- Verificar se tem espaço
    IF current_count >= animal_limit THEN
        RETURN jsonb_build_object(
            'can_accept', false,
            'reason', 'limit_reached',
            'message', 'Você atingiu o limite de ' || animal_limit || ' animais ativos',
            'current_count', current_count,
            'limit', animal_limit,
            'can_upgrade', true
        );
    END IF;
    
    -- Pode aceitar
    RETURN jsonb_build_object(
        'can_accept', true,
        'reason', 'ok',
        'message', 'Você pode aceitar este convite',
        'current_count', current_count,
        'limit', animal_limit,
        'remaining', animal_limit - current_count - 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.can_accept_partnership IS 'Verifica se usuário pode aceitar convite de sociedade considerando limites do plano';

-- =====================================================
-- 5. TRIGGER: NOTIFICAR QUANDO SOCIEDADE É ACEITA
-- =====================================================

CREATE OR REPLACE FUNCTION public.notify_on_partnership_accepted()
RETURNS TRIGGER AS $$
DECLARE
  v_animal_name TEXT;
  v_partner_name TEXT;
  v_owner_id UUID;
BEGIN
  -- Apenas notificar quando status muda para aceito
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    
    -- Buscar informações
    SELECT name, owner_id INTO v_animal_name, v_owner_id
    FROM public.animals
    WHERE id = NEW.animal_id;
    
    SELECT name INTO v_partner_name
    FROM public.profiles
    WHERE id = NEW.partner_id;
    
    -- Notificar o dono do animal
    PERFORM public.create_notification(
      p_user_id := v_owner_id,
      p_type := 'partnership_accepted',
      p_title := 'Sociedade Aceita',
      p_message := v_partner_name || ' aceitou o convite de sociedade para o animal "' || v_animal_name || '".',
      p_action_url := '/dashboard/society',
      p_metadata := jsonb_build_object(
        'animal_id', NEW.animal_id,
        'animal_name', v_animal_name,
        'partnership_id', NEW.id,
        'partner_id', NEW.partner_id,
        'partner_name', v_partner_name,
        'percentage', NEW.percentage
      ),
      p_related_content_type := 'partnership',
      p_related_content_id := NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Dropar trigger antigo se existir
DROP TRIGGER IF EXISTS trigger_notify_on_partnership_accepted ON public.animal_partnerships;

-- Criar novo trigger
CREATE TRIGGER trigger_notify_on_partnership_accepted
  AFTER UPDATE ON public.animal_partnerships
  FOR EACH ROW
  WHEN (NEW.status = 'accepted' AND OLD.status = 'pending')
  EXECUTE FUNCTION public.notify_on_partnership_accepted();

COMMENT ON TRIGGER trigger_notify_on_partnership_accepted ON public.animal_partnerships IS 'Notifica o dono quando sociedade é aceita';

-- =====================================================
-- 6. POLÍTICAS RLS ADICIONAIS
-- =====================================================

-- Permitir sócios com plano ativo visualizarem animais onde são parceiros
DROP POLICY IF EXISTS "Partners with active plan can view animals" ON public.animals;

CREATE POLICY "Partners with active plan can view animals" ON public.animals
    FOR SELECT USING (
        -- Usuário é sócio aceito E tem plano ativo
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

COMMENT ON POLICY "Partners with active plan can view animals" ON public.animals IS 'Sócios com plano ativo podem visualizar animais onde são parceiros';

-- =====================================================
-- 7. GRANTS E PERMISSÕES
-- =====================================================

-- Permitir acesso à view
GRANT SELECT ON public.animals_with_partnerships TO authenticated;
GRANT SELECT ON public.animals_with_partnerships TO anon;

-- Permitir execução das funções
GRANT EXECUTE ON FUNCTION public.count_active_animals_with_partnerships(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.should_animal_be_active(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_animal_message_recipient(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_profile_animals(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_profile_animals(UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.can_accept_partnership(UUID, UUID) TO authenticated;

-- =====================================================
-- 8. ÍNDICES ADICIONAIS PARA PERFORMANCE
-- =====================================================

-- Índice composto para buscar sociedades aceitas de um parceiro
CREATE INDEX IF NOT EXISTS idx_animal_partnerships_partner_accepted 
    ON public.animal_partnerships(partner_id, status) 
    WHERE status = 'accepted';

-- Índice composto para buscar sociedades de um animal
CREATE INDEX IF NOT EXISTS idx_animal_partnerships_animal_status 
    ON public.animal_partnerships(animal_id, status);

COMMENT ON INDEX idx_animal_partnerships_partner_accepted IS 'Otimiza busca de sociedades aceitas por parceiro';
COMMENT ON INDEX idx_animal_partnerships_animal_status IS 'Otimiza busca de sociedades por animal e status';

-- =====================================================
-- FIM DA MIGRAÇÃO 046
-- =====================================================

