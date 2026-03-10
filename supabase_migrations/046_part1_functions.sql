-- =====================================================
-- MIGRAÇÃO 046 - PARTE 1: FUNÇÕES
-- Data: 04/11/2025
-- =====================================================

-- Função 1: Contar animais ativos com sociedades
CREATE OR REPLACE FUNCTION public.count_active_animals_with_partnerships(user_id_param UUID)
RETURNS INTEGER AS $$
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
          AND ap.status = 'accepted'
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.count_active_animals_with_partnerships(UUID) IS 'Conta animais ativos incluindo sociedades aceitas';

-- Função 2: Verificar se animal deve estar ativo
CREATE OR REPLACE FUNCTION public.should_animal_be_active(animal_id_param UUID)
RETURNS BOOLEAN AS $$
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
          AND ap.status = 'accepted'
          AND p.plan IS NOT NULL
          AND p.plan != 'free'
          AND (p.plan_expires_at IS NULL OR p.plan_expires_at > NOW())
    ) INTO partner_has_plan;
    
    RETURN owner_has_plan OR partner_has_plan;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.should_animal_be_active(UUID) IS 'Verifica se animal deve estar ativo baseado em planos';

-- Função 3: Buscar responsável por mensagens
CREATE OR REPLACE FUNCTION public.get_animal_message_recipient(animal_id_param UUID)
RETURNS UUID AS $$
DECLARE
    owner_id_var UUID;
    owner_has_plan BOOLEAN;
    recipient_id UUID;
BEGIN
    SELECT owner_id INTO owner_id_var
    FROM public.animals
    WHERE id = animal_id_param;
    
    SELECT 
        p.plan IS NOT NULL 
        AND p.plan != 'free' 
        AND (p.plan_expires_at IS NULL OR p.plan_expires_at > NOW())
    INTO owner_has_plan
    FROM public.profiles p
    WHERE p.id = owner_id_var;
    
    IF owner_has_plan THEN
        RETURN owner_id_var;
    END IF;
    
    SELECT ap.partner_id INTO recipient_id
    FROM public.animal_partnerships ap
    JOIN public.profiles p ON p.id = ap.partner_id
    WHERE ap.animal_id = animal_id_param
      AND ap.status = 'accepted'
      AND p.plan IS NOT NULL
      AND p.plan != 'free'
      AND (p.plan_expires_at IS NULL OR p.plan_expires_at > NOW())
    ORDER BY ap.updated_at ASC
    LIMIT 1;
    
    IF recipient_id IS NOT NULL THEN
        RETURN recipient_id;
    END IF;
    
    RETURN owner_id_var;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_animal_message_recipient(UUID) IS 'Retorna responsável por mensagens com fallback inteligente';

-- Grants
GRANT EXECUTE ON FUNCTION public.count_active_animals_with_partnerships(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.should_animal_be_active(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_animal_message_recipient(UUID) TO authenticated;

