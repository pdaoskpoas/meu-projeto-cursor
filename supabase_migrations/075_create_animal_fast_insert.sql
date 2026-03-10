-- =====================================================
-- Migration 075: Função RPC para INSERT rápido de animais
-- =====================================================
-- SOLUÇÃO PROFISSIONAL: Bypassa RLS policies lentas
-- Executa INSERT como SECURITY DEFINER (sem RLS)
-- Mantém segurança através de validações dentro da função
-- =====================================================

BEGIN;

-- Drop se já existir
DROP FUNCTION IF EXISTS public.create_animal_fast(json);

-- Criar função otimizada
CREATE OR REPLACE FUNCTION public.create_animal_fast(animal_data json)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER -- ✅ Executa como dono (bypassa RLS)
SET search_path = public
AS $$
DECLARE
    current_user_id uuid;
    owner_id_param uuid;
    new_animal_id uuid;
    result json;
BEGIN
    -- ✅ SEGURANÇA: Obter usuário autenticado
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'Não autenticado';
    END IF;
    
    -- ✅ SEGURANÇA: Validar que owner_id é o usuário atual ou é admin
    owner_id_param := (animal_data->>'owner_id')::uuid;
    
    IF owner_id_param IS NULL THEN
        RAISE EXCEPTION 'owner_id é obrigatório';
    END IF;
    
    -- Verificar se é o próprio usuário ou admin
    IF owner_id_param != current_user_id THEN
        IF NOT EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = current_user_id 
            AND role = 'admin'
        ) THEN
            RAISE EXCEPTION 'Sem permissão para criar animal para outro usuário';
        END IF;
    END IF;
    
    -- ✅ INSERT DIRETO (sem RLS!)
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
        share_code,
        ad_status,
        published_at,
        expires_at
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
        animal_data->>'share_code',
        COALESCE(animal_data->>'ad_status', 'paused'),
        COALESCE((animal_data->>'published_at')::timestamptz, now()),
        (animal_data->>'expires_at')::timestamptz
    ) RETURNING id INTO new_animal_id;
    
    -- ✅ SELECT DIRETO do animal criado (sem RLS!)
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
        -- Log do erro
        RAISE EXCEPTION 'Erro ao criar animal: %', SQLERRM;
END;
$$;

-- ✅ Permitir execução para usuários autenticados
GRANT EXECUTE ON FUNCTION public.create_animal_fast(json) TO authenticated;

COMMENT ON FUNCTION public.create_animal_fast IS 
  'Cria animal de forma otimizada, bypassando RLS policies lentas. Mantém segurança via validações internas.';

RAISE NOTICE '✅ Função create_animal_fast criada com sucesso!';
RAISE NOTICE '   Uso: SELECT create_animal_fast(''{"name": "...", "owner_id": "..."}''::json)';

COMMIT;


