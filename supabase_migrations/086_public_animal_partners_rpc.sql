-- ============================================================================
-- MIGRAÇÃO 086: RPC público para quadro societário
-- ============================================================================
-- Objetivo: permitir exibir quadro societário para usuários não logados
--           com dados básicos do haras (logo/nome/código).
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_animal_partners_public(animal_id_param UUID)
RETURNS TABLE (
  partner_id UUID,
  partner_name TEXT,
  partner_property_name TEXT,
  partner_public_code TEXT,
  partner_account_type TEXT,
  percentage NUMERIC,
  avatar_url TEXT
) 
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    ap.partner_id,
    p.name,
    COALESCE(p.property_name, p.name) AS partner_property_name,
    p.public_code,
    p.account_type,
    ap.percentage,
    p.avatar_url
  FROM public.animal_partnerships ap
  JOIN public.profiles p ON p.id = ap.partner_id
  WHERE ap.animal_id = animal_id_param
    AND (ap.status = 'accepted' OR ap.status IS NULL)
    AND p.plan IS NOT NULL
    AND p.plan != 'free'
    AND (p.plan_expires_at IS NULL OR p.plan_expires_at > NOW());
$$;

COMMENT ON FUNCTION public.get_animal_partners_public(UUID) IS
  'Retorna sócios ativos para exibição pública no quadro societário.';

GRANT EXECUTE ON FUNCTION public.get_animal_partners_public(UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.get_animal_partners_public(UUID) TO authenticated;
