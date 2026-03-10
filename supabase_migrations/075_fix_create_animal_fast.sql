-- =====================================================
-- FIX: Função RPC com TODOS os campos necessários
-- =====================================================

DROP FUNCTION IF EXISTS public.create_animal_fast(json);

CREATE OR REPLACE FUNCTION public.create_animal_fast(animal_data json)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_user_id uuid;
    owner_id_param uuid;
    new_animal_id uuid;
    result json;
BEGIN
    -- SEGURANÇA: Obter usuário autenticado
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'Não autenticado';
    END IF;
    
    -- SEGURANÇA: Validar owner_id
    owner_id_param := (animal_data->>'owner_id')::uuid;
    
    IF owner_id_param IS NULL THEN
        RAISE EXCEPTION 'owner_id é obrigatório';
    END IF;
    
    -- Verificar permissão
    IF owner_id_param != current_user_id THEN
        IF NOT EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = current_user_id 
            AND role = 'admin'
        ) THEN
            RAISE EXCEPTION 'Sem permissão';
        END IF;
    END IF;
    
    -- INSERT com TODOS os campos possíveis
    INSERT INTO animals (
        owner_id,
        name,
        breed,
        gender,
        birth_date,
        coat,
        category,
        current_city,
        current_state,
        father_name,
        mother_name,
        paternal_grandfather_name,
        paternal_grandmother_name,
        maternal_grandfather_name,
        maternal_grandmother_name,
        registration_number,
        microchip,
        description,
        allow_messages,
        auto_renew,
        share_code,
        ad_status,
        published_at,
        expires_at,
        haras_id,
        haras_name,
        is_individual_paid
    ) VALUES (
        owner_id_param,
        animal_data->>'name',
        animal_data->>'breed',
        animal_data->>'gender',
        (animal_data->>'birth_date')::date,
        animal_data->>'coat',
        animal_data->>'category',
        animal_data->>'current_city',
        animal_data->>'current_state',
        animal_data->>'father_name',
        animal_data->>'mother_name',
        animal_data->>'paternal_grandfather_name',
        animal_data->>'paternal_grandmother_name',
        animal_data->>'maternal_grandfather_name',
        animal_data->>'maternal_grandmother_name',
        animal_data->>'registration_number',
        animal_data->>'microchip',
        animal_data->>'description',
        COALESCE((animal_data->>'allow_messages')::boolean, true),
        COALESCE((animal_data->>'auto_renew')::boolean, true),
        animal_data->>'share_code',
        COALESCE(animal_data->>'ad_status', 'paused'),
        COALESCE((animal_data->>'published_at')::timestamptz, now()),
        (animal_data->>'expires_at')::timestamptz,
        (animal_data->>'haras_id')::uuid,
        animal_data->>'haras_name',
        COALESCE((animal_data->>'is_individual_paid')::boolean, false)
    ) RETURNING id INTO new_animal_id;
    
    -- SELECT DIRETO do animal criado
    SELECT json_build_object(
        'id', a.id,
        'owner_id', a.owner_id,
        'name', a.name,
        'breed', a.breed,
        'gender', a.gender,
        'birth_date', a.birth_date,
        'coat', a.coat,
        'category', a.category,
        'current_city', a.current_city,
        'current_state', a.current_state,
        'share_code', a.share_code,
        'ad_status', a.ad_status,
        'published_at', a.published_at,
        'expires_at', a.expires_at,
        'created_at', a.created_at,
        'updated_at', a.updated_at
    ) INTO result
    FROM animals a
    WHERE a.id = new_animal_id;
    
    RETURN result;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Erro ao criar animal: %', SQLERRM;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_animal_fast(json) TO authenticated;


