-- Migration 078: Sistema automatico de concessao de turbinares
-- Data: 27/11/2025
-- Objetivo: Creditar turbinares automaticamente ao assinar/renovar/fazer upgrade de plano

-- =====================================================
-- FUNCTION: Conceder turbinares automaticamente
-- =====================================================

CREATE OR REPLACE FUNCTION public.auto_grant_boost_on_plan_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  boosts_to_add INTEGER := 0;
  old_plan_boosts INTEGER := 0;
  new_plan_boosts INTEGER := 0;
BEGIN
  -- Determinar turbinares do plano antigo
  old_plan_boosts := CASE
    WHEN OLD.plan = 'pro' THEN 2
    WHEN OLD.plan = 'ultra' THEN 5
    ELSE 0
  END;

  -- Determinar turbinares do novo plano
  new_plan_boosts := CASE
    WHEN NEW.plan = 'pro' THEN 2
    WHEN NEW.plan = 'ultra' THEN 5
    ELSE 0
  END;

  -- Se mudou de plano (incluindo de free para pago, ou upgrade)
  IF OLD.plan IS DISTINCT FROM NEW.plan THEN
    
    -- CASO 1: Nova assinatura (free -> pago)
    IF (OLD.plan IS NULL OR OLD.plan = 'free') AND NEW.plan IN ('basic', 'pro', 'ultra', 'vip') THEN
      boosts_to_add := new_plan_boosts;
      
    -- CASO 2: Upgrade de plano (basic -> pro, pro -> ultra, etc)
    ELSIF NEW.plan IN ('pro', 'ultra') AND old_plan_boosts < new_plan_boosts THEN
      boosts_to_add := new_plan_boosts - old_plan_boosts;
      
    -- CASO 3: Downgrade ou mudança para plano sem boosts
    ELSE
      boosts_to_add := 0;
    END IF;

    -- Adicionar boosts se houver
    IF boosts_to_add > 0 THEN
      NEW.plan_boost_credits := COALESCE(NEW.plan_boost_credits, 0) + boosts_to_add;
    END IF;

  -- Se renovou o mesmo plano (verifica pela data de expiracao)
  ELSIF OLD.plan_expires_at IS DISTINCT FROM NEW.plan_expires_at 
    AND NEW.plan_expires_at > OLD.plan_expires_at 
    AND NEW.plan IN ('pro', 'ultra') THEN
    
    boosts_to_add := new_plan_boosts;
    NEW.plan_boost_credits := COALESCE(NEW.plan_boost_credits, 0) + boosts_to_add;
  END IF;

  RETURN NEW;
END;
$$;

-- =====================================================
-- TRIGGER: Acionar concessao automatica
-- =====================================================

DROP TRIGGER IF EXISTS trg_auto_grant_boost_on_plan_change ON public.profiles;

CREATE TRIGGER trg_auto_grant_boost_on_plan_change
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  WHEN (OLD.plan IS DISTINCT FROM NEW.plan OR OLD.plan_expires_at IS DISTINCT FROM NEW.plan_expires_at)
  EXECUTE FUNCTION public.auto_grant_boost_on_plan_change();

COMMENT ON FUNCTION public.auto_grant_boost_on_plan_change IS 'Concede turbinares automaticamente ao assinar, renovar ou fazer upgrade de plano';


