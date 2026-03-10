-- =====================================================
-- MIGRAÇÃO 046 - PARTE 2: VIEWS
-- Data: 04/11/2025
-- =====================================================

-- View: Animais com informações de sociedade
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
    
    COUNT(ap.id) FILTER (WHERE ap.status = 'accepted') as active_partners_count,
    COUNT(ap.id) FILTER (WHERE ap.status = 'pending') as pending_partners_count
    
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

COMMENT ON VIEW public.animals_with_partnerships IS 'Animais com estatísticas e informações de sociedades';

-- Grants
GRANT SELECT ON public.animals_with_partnerships TO authenticated;
GRANT SELECT ON public.animals_with_partnerships TO anon;

