-- Migration 110: Corrigir plano VIP para não receber turbinares
-- Data: 06/04/2026
-- Problema: Migration 097 atribuiu 5 turbinares ao VIP indevidamente.
--   O VIP é cortesia do admin e NÃO deve receber turbinares gratuitos,
--   nem ao ativar o plano nem na renovação mensal.

-- =====================================================
-- PARTE 1: Corrigir tabela plans (VIP = 0 turbinares)
-- =====================================================

UPDATE public.plans
SET
  available_boosts = 0,
  features = '["Mesmos limites do Haras Destaque", "10 animais ativos simultaneamente", "Sem turbinares grátis", "Concedido gratuitamente pelo administrador", "Suporte premium dedicado"]'::jsonb,
  updated_at = NOW()
WHERE name = 'vip';

-- =====================================================
-- PARTE 2: grant_monthly_boosts — VIP não recebe boosts mensais
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
      WHEN plan = 'essencial' THEN 0
      WHEN plan = 'criador'   THEN 2
      WHEN plan = 'haras'     THEN 5
      WHEN plan = 'elite'     THEN 10
      WHEN plan = 'vip'       THEN 0   -- VIP não recebe turbinares (plano cortesia)
      -- Legado
      WHEN plan = 'basic'     THEN 0
      WHEN plan = 'pro'       THEN 2
      WHEN plan = 'ultra'     THEN 5
      ELSE 0
    END,
    last_boost_grant_at = now()
  WHERE
    plan IN ('essencial', 'criador', 'haras', 'elite', 'vip', 'basic', 'pro', 'ultra')
    AND (
      last_boost_grant_at IS NULL
      OR last_boost_grant_at < date_trunc('month', now())
    )
    AND (plan_expires_at IS NULL OR plan_expires_at > NOW());
END;
$$;

-- =====================================================
-- PARTE 3: auto_grant_boost_on_plan_change — VIP não recebe boosts
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
  -- Turbinares do plano antigo (VIP = 0, plano cortesia)
  old_plan_boosts := CASE
    WHEN OLD.plan = 'essencial' THEN 0
    WHEN OLD.plan = 'criador'   THEN 2
    WHEN OLD.plan = 'haras'     THEN 5
    WHEN OLD.plan = 'elite'     THEN 10
    WHEN OLD.plan = 'vip'       THEN 0   -- VIP não tem turbinares
    -- Legado
    WHEN OLD.plan = 'pro'       THEN 2
    WHEN OLD.plan = 'ultra'     THEN 5
    ELSE 0
  END;

  -- Turbinares do novo plano (VIP = 0, plano cortesia)
  new_plan_boosts := CASE
    WHEN NEW.plan = 'essencial' THEN 0
    WHEN NEW.plan = 'criador'   THEN 2
    WHEN NEW.plan = 'haras'     THEN 5
    WHEN NEW.plan = 'elite'     THEN 10
    WHEN NEW.plan = 'vip'       THEN 0   -- VIP não tem turbinares
    ELSE 0
  END;

  -- Se mudou de plano
  IF OLD.plan IS DISTINCT FROM NEW.plan THEN

    -- CASO 1: Nova assinatura (free → pago)
    -- VIP está excluído pois new_plan_boosts = 0
    IF (OLD.plan IS NULL OR OLD.plan = 'free') AND NEW.plan IN ('essencial', 'criador', 'haras', 'elite', 'vip') THEN
      boosts_to_add := new_plan_boosts;

    -- CASO 2: Upgrade (mais boosts no novo plano)
    ELSIF old_plan_boosts < new_plan_boosts THEN
      boosts_to_add := new_plan_boosts - old_plan_boosts;

    -- CASO 3: Downgrade ou plano sem boosts
    ELSE
      boosts_to_add := 0;
    END IF;

    -- Adicionar boosts se houver
    IF boosts_to_add > 0 THEN
      NEW.plan_boost_credits := COALESCE(NEW.plan_boost_credits, 0) + boosts_to_add;
    END IF;

  -- Se renovou o mesmo plano — VIP excluído (sem boosts na renovação)
  ELSIF OLD.plan_expires_at IS DISTINCT FROM NEW.plan_expires_at
    AND NEW.plan_expires_at > OLD.plan_expires_at
    AND NEW.plan IN ('criador', 'haras', 'elite') THEN  -- 'vip' removido daqui

    boosts_to_add := new_plan_boosts;
    NEW.plan_boost_credits := COALESCE(NEW.plan_boost_credits, 0) + boosts_to_add;
  END IF;

  RETURN NEW;
END;
$$;

-- Recriar trigger (mantém configuração existente)
DROP TRIGGER IF EXISTS trg_auto_grant_boost_on_plan_change ON public.profiles;

CREATE TRIGGER trg_auto_grant_boost_on_plan_change
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  WHEN (OLD.plan IS DISTINCT FROM NEW.plan OR OLD.plan_expires_at IS DISTINCT FROM NEW.plan_expires_at)
  EXECUTE FUNCTION public.auto_grant_boost_on_plan_change();

-- =====================================================
-- PARTE 4: Zerar turbinares de plano de usuários VIP ativos
-- (corrigir créditos indevidamente concedidos pela migration 097)
-- =====================================================

UPDATE public.profiles
SET plan_boost_credits = 0
WHERE plan = 'vip'
  AND plan_boost_credits > 0
  AND (plan_expires_at IS NULL OR plan_expires_at > NOW());

-- =====================================================
-- Atualizar comentários
-- =====================================================

COMMENT ON FUNCTION public.grant_monthly_boosts() IS
  'Renova turbinares mensais por plano. essencial=0, criador=2, haras=5, elite=10, vip=0 (cortesia sem turbinares).';

COMMENT ON FUNCTION public.auto_grant_boost_on_plan_change() IS
  'Concede turbinares ao assinar/renovar/fazer upgrade de plano. VIP (cortesia admin) não recebe turbinares.';
