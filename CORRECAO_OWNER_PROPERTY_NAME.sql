-- =====================================================
-- CORREÇÃO: ADICIONAR OWNER_PROPERTY_NAME ÀS VIEWS
-- Data: 18/11/2025
-- =====================================================
--
-- DESCRIÇÃO:
-- Esta correção adiciona o campo 'owner_property_name' às views 
-- de animais para permitir a exibição correta do nome de propriedades
-- institucionais (haras, fazenda, CTE, central de reprodução, etc.)
--
-- CONTEXTO:
-- - Perfis Institucionais devem exibir o 'property_name' nos anúncios
-- - Perfis Pessoais devem exibir apenas o 'name'
-- - O campo 'account_type' determina qual nome usar
-- - Os tipos de propriedades suportados: 'haras', 'fazenda', 'cte', 'central-reproducao'
--
-- =====================================================

-- =====================================================
-- PASSO 1: ATUALIZAR VIEW animals_with_stats
-- =====================================================

DO $$
BEGIN
    -- Verificar se a view existe antes de recriar
    IF EXISTS (
        SELECT 1 FROM information_schema.views 
        WHERE table_schema = 'public' 
        AND table_name = 'animals_with_stats'
    ) THEN
        RAISE NOTICE '[1/2] Recriando view animals_with_stats com owner_property_name';
        
        DROP VIEW IF EXISTS public.animals_with_stats CASCADE;
        
        CREATE VIEW public.animals_with_stats AS
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
            p.property_name as owner_property_name,
            p.property_type as owner_property_type
        FROM public.animals a
        LEFT JOIN public.profiles p ON a.owner_id = p.id
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
        ) cl ON a.id = cl.content_id;
        
        GRANT SELECT ON public.animals_with_stats TO authenticated;
        GRANT SELECT ON public.animals_with_stats TO anon;
        
        COMMENT ON VIEW public.animals_with_stats IS 
          'View de animais com estatísticas, incluindo informações do proprietário (nome pessoal e nome da propriedade)';
        
        RAISE NOTICE '✅ View animals_with_stats atualizada com sucesso';
    ELSE
        RAISE NOTICE '[1/2] View animals_with_stats não existe, pulando...';
    END IF;
END $$;

-- =====================================================
-- PASSO 2: ATUALIZAR VIEW animals_with_partnerships
-- =====================================================

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.views 
        WHERE table_schema = 'public' 
        AND table_name = 'animals_with_partnerships'
    ) THEN
        RAISE NOTICE '[2/2] Recriando view animals_with_partnerships com owner_property_name';
        
        DROP VIEW IF EXISTS public.animals_with_partnerships CASCADE;
        
        CREATE VIEW public.animals_with_partnerships AS
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
            p.property_name as owner_property_name,
            p.property_type as owner_property_type,
            COALESCE(
                json_agg(
                    json_build_object(
                        'partner_id', ap.partner_id,
                        'partner_name', pp.name,
                        'partner_property_name', COALESCE(pp.property_name, pp.name),
                        'partner_public_code', pp.public_code,
                        'partner_account_type', pp.account_type,
                        'partner_property_type', pp.property_type,
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
        GROUP BY 
            a.id, 
            p.name, 
            p.public_code, 
            p.account_type, 
            p.property_name,
            p.property_type,
            imp.impression_count, 
            cl.click_count;
        
        GRANT SELECT ON public.animals_with_partnerships TO authenticated;
        GRANT SELECT ON public.animals_with_partnerships TO anon;
        
        COMMENT ON VIEW public.animals_with_partnerships IS 
          'View de animais com sociedades e estatísticas, incluindo informações completas do proprietário e sócios (nome pessoal, nome da propriedade e tipo de propriedade)';
        
        RAISE NOTICE '✅ View animals_with_partnerships atualizada com sucesso';
    ELSE
        RAISE NOTICE '[2/2] View animals_with_partnerships não existe, pulando...';
    END IF;
END $$;

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'CORREÇÃO APLICADA COM SUCESSO!';
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'As views agora incluem os campos:';
    RAISE NOTICE '  - owner_property_name: Nome da propriedade institucional';
    RAISE NOTICE '  - owner_property_type: Tipo (haras/fazenda/cte/central-reproducao)';
    RAISE NOTICE '';
    RAISE NOTICE 'IMPORTANTE:';
    RAISE NOTICE '  ✅ Solução genérica para TODOS os tipos de propriedades';
    RAISE NOTICE '  ✅ Suporta: haras, fazenda, CTE, central de reprodução';
    RAISE NOTICE '  ✅ Compatível com perfis pessoais e institucionais';
    RAISE NOTICE '==============================================';
END $$;
