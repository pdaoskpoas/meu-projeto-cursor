-- Migration 077: Corrigir valores dos turbinares mensais por plano
-- Data: 26/11/2025
-- Objetivo: Atualizar a funcao grant_monthly_boosts com os valores corretos
-- Iniciante: 0 turbinares | Pro: 2 turbinares | Elite: 5 turbinares | VIP: 0 turbinares

-- =====================================================
-- FUNCTION: grant_monthly_boosts (CORRIGIDA)
-- =====================================================

CREATE OR REPLACE FUNCTION public.grant_monthly_boosts()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE profiles
  SET 
    plan_boost_credits = CASE
      WHEN plan = 'basic' THEN 0
      WHEN plan = 'pro' THEN 2
      WHEN plan = 'ultra' THEN 5
      WHEN plan = 'vip' THEN 0
      ELSE 0
    END,
    last_boost_grant_at = now()
  WHERE 
    plan IN ('basic', 'pro', 'ultra', 'vip')
    AND (
      last_boost_grant_at IS NULL 
      OR last_boost_grant_at < date_trunc('month', now())
    );
END;
$$;
