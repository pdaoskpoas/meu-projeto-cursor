-- =====================================================
-- MIGRAÇÃO 046 - PARTE 3: FUNÇÕES DE PERFIL
-- Data: 04/11/2025
-- =====================================================

-- Função: Buscar animais do perfil considerando sociedades
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
          a.owner_id = profile_user_id
          OR
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

COMMENT ON FUNCTION public.get_profile_animals(UUID) IS 'Retorna animais do perfil incluindo sociedades';

-- Função: Verificar se pode aceitar sociedade
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
BEGIN
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
    
    SELECT p.plan, (p.plan_expires_at IS NULL OR p.plan_expires_at > NOW())
    INTO user_plan, plan_active
    FROM public.profiles p
    WHERE p.id = user_id_param;
    
    IF user_plan IS NULL OR user_plan = 'free' OR NOT plan_active THEN
        RETURN jsonb_build_object(
            'can_accept', false,
            'reason', 'no_active_plan',
            'message', 'Você precisa de um plano ativo para aceitar sociedades',
            'requires_plan', true
        );
    END IF;
    
    current_count := public.count_active_animals_with_partnerships(user_id_param);
    
    animal_limit := CASE user_plan
        WHEN 'basic' THEN 10
        WHEN 'pro' THEN 15
        WHEN 'ultra' THEN 25
        WHEN 'vip' THEN 15
        ELSE 0
    END;
    
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

COMMENT ON FUNCTION public.can_accept_partnership(UUID, UUID) IS 'Verifica se usuário pode aceitar convite de sociedade';

-- Grants
GRANT EXECUTE ON FUNCTION public.get_profile_animals(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_profile_animals(UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.can_accept_partnership(UUID, UUID) TO authenticated;

