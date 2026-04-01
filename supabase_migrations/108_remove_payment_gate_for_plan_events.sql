-- =====================================================
-- MIGRAÇÃO 108: REMOVER BLOQUEIO DE PAGAMENTO PARA EVENTOS
-- Data: 2026-04-01
-- Descrição:
--   Remove o trigger/função enforce_event_payment_before_activation
--   que bloqueava ativação de eventos sem pagamento individual.
--   Nova regra: usuário com plano pago ativo pode publicar eventos
--   diretamente, sem necessidade de pagamento individual por evento.
--   O pagamento individual (turbinar) continua existindo para
--   destaque na home.
-- =====================================================

-- 1. Remover o trigger da tabela events (tenta todos os nomes possíveis)
DROP TRIGGER IF EXISTS enforce_event_payment_before_activation ON public.events;
DROP TRIGGER IF EXISTS trg_enforce_event_payment_before_activation ON public.events;
DROP TRIGGER IF EXISTS trg_enforce_event_payment ON public.events;
DROP TRIGGER IF EXISTS enforce_event_payment ON public.events;
DROP TRIGGER IF EXISTS check_event_payment_before_activation ON public.events;
DROP TRIGGER IF EXISTS trg_check_event_payment ON public.events;

-- 2. Substituir a função pelo comportamento correto:
--    Usuários com plano ativo podem publicar sem pagamento individual.
--    Apenas registra o timestamp de publicação e incrementa o contador.
CREATE OR REPLACE FUNCTION public.enforce_event_payment_before_activation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_plan TEXT;
  v_plan_expires_at TIMESTAMPTZ;
  v_plan_active BOOLEAN;
BEGIN
  -- Apenas validar quando o evento está sendo ativado
  IF NEW.ad_status = 'active' AND (TG_OP = 'INSERT' OR OLD.ad_status IS DISTINCT FROM 'active') THEN

    -- Buscar plano do organizador
    SELECT plan, plan_expires_at
    INTO v_plan, v_plan_expires_at
    FROM public.profiles
    WHERE id = NEW.organizer_id;

    v_plan_active := (
      v_plan IS NOT NULL
      AND v_plan != 'free'
      AND (v_plan_expires_at IS NULL OR v_plan_expires_at > NOW())
    );

    -- Bloquear apenas se: sem plano ativo E sem pagamento individual
    IF NOT v_plan_active AND (NEW.is_individual_paid IS NULL OR NEW.is_individual_paid = false) THEN
      RAISE EXCEPTION 'É necessário um plano ativo para publicar eventos.';
    END IF;

    -- Garantir que published_at seja preenchido
    IF NEW.published_at IS NULL THEN
      NEW.published_at := NOW();
    END IF;

  END IF;

  RETURN NEW;
END;
$$;

-- 3. Recriar o trigger com o nome original
CREATE TRIGGER enforce_event_payment_before_activation
  BEFORE INSERT OR UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_event_payment_before_activation();

-- 4. Garantir que eventos inseridos com ad_status = 'active' por
--    usuários com plano não precisem de payment_status = 'completed'
--    (caso a coluna exista — não quebra se não existir)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'events'
      AND column_name = 'payment_status'
  ) THEN
    -- Alterar default para 'completed' em inserções de plano
    -- (o frontend não precisará passar este campo)
    ALTER TABLE public.events
      ALTER COLUMN payment_status SET DEFAULT 'completed';

    RAISE NOTICE '✅ payment_status default alterado para completed';
  ELSE
    RAISE NOTICE 'ℹ️ Coluna payment_status não existe — nenhuma alteração necessária';
  END IF;
END $$;

-- 5. Verificação final
DO $$
DECLARE
  v_trigger_count INT;
BEGIN
  SELECT COUNT(*) INTO v_trigger_count
  FROM pg_trigger t
  JOIN pg_class c ON c.oid = t.tgrelid
  WHERE c.relname = 'events'
    AND t.tgname = 'enforce_event_payment_before_activation';

  IF v_trigger_count > 0 THEN
    RAISE NOTICE '✅ Trigger enforce_event_payment_before_activation recriado com nova lógica';
  ELSE
    RAISE NOTICE '⚠️ Trigger não encontrado — verifique manualmente';
  END IF;

  RAISE NOTICE '=====================================================';
  RAISE NOTICE '✅ MIGRAÇÃO 108 CONCLUÍDA';
  RAISE NOTICE 'Regra: plano ativo = pode publicar evento';
  RAISE NOTICE 'payment_status default = completed (se coluna existir)';
  RAISE NOTICE '=====================================================';
END $$;
