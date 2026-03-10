-- =====================================================
-- Migration 073: Sistema de Cotas Mensais para Eventos
-- Data: 24/11/2025
-- Descrição: Implementa sistema de publicações mensais para eventos
--            com lógica diferente dos animais (não-recuperável)
-- =====================================================

-- =====================================================
-- 1. ADICIONAR CAMPOS NA TABELA PROFILES
-- =====================================================
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS event_publications_used_this_month INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS event_publications_reset_at TIMESTAMPTZ DEFAULT DATE_TRUNC('month', NOW()) + INTERVAL '1 month';

-- Comentários nas colunas
COMMENT ON COLUMN profiles.event_publications_used_this_month IS 'Contador de publicações de eventos usadas no mês atual (reseta mensalmente)';

COMMENT ON COLUMN profiles.event_publications_reset_at IS 'Data do próximo reset do contador de publicações (primeiro dia do próximo mês)';

-- Criar índice para otimizar reset mensal
CREATE INDEX IF NOT EXISTS idx_profiles_event_publications_reset 
ON profiles(event_publications_reset_at);

-- =====================================================
-- 2. ADICIONAR CAMPO PARA CONTROLAR EDIÇÃO (24h)
-- =====================================================
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS can_edit_until TIMESTAMPTZ;

COMMENT ON COLUMN events.can_edit_until IS 'Data/hora limite para edição (24h após publicação). Após isso, o evento não pode mais ser editado.';

-- Criar índice
CREATE INDEX IF NOT EXISTS idx_events_can_edit_until 
ON events(can_edit_until);

-- =====================================================
-- 3. FUNÇÃO: Obter cotas de publicação por plano
-- =====================================================
CREATE OR REPLACE FUNCTION get_event_monthly_quota(user_plan TEXT)
RETURNS INT
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN CASE 
    WHEN user_plan IN ('pro', 'pro_annual') THEN 1      -- Pro: 1 publicação/mês
    WHEN user_plan IN ('ultra', 'ultra_annual') THEN 2  -- Elite: 2 publicações/mês
    ELSE 0                                              -- Free/Basic/VIP: 0 publicações incluídas
  END;
END;
$$;

COMMENT ON FUNCTION get_event_monthly_quota IS 'Retorna quantas publicações mensais o plano permite (Pro=1, Elite=2, outros=0)';

GRANT EXECUTE ON FUNCTION get_event_monthly_quota TO authenticated;

-- =====================================================
-- 4. FUNÇÃO: Resetar publicações mensais (CRON)
-- =====================================================
CREATE OR REPLACE FUNCTION reset_monthly_event_publications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  reset_count INT := 0;
BEGIN
  -- Resetar contador para usuários que já passaram da data de reset
  UPDATE profiles
  SET 
    event_publications_used_this_month = 0,
    event_publications_reset_at = DATE_TRUNC('month', NOW()) + INTERVAL '1 month'
  WHERE event_publications_reset_at <= NOW();
  
  GET DIAGNOSTICS reset_count = ROW_COUNT;
  
  RAISE NOTICE 'Reset mensal: % usuários resetados', reset_count;
END;
$$;

COMMENT ON FUNCTION reset_monthly_event_publications IS 'Reseta o contador de publicações mensais para todos os usuários elegíveis (executado mensalmente via CRON)';

GRANT EXECUTE ON FUNCTION reset_monthly_event_publications TO authenticated;

-- =====================================================
-- 5. FUNÇÃO: Verificar se pode publicar evento
-- =====================================================
CREATE OR REPLACE FUNCTION can_create_event(user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_plan TEXT;
  v_plan_expires_at TIMESTAMPTZ;
  v_plan_is_valid BOOLEAN;
  v_publications_used INT;
  v_publications_quota INT;
  v_publications_available INT;
  v_active_events_count INT;
  v_reset_at TIMESTAMPTZ;
  v_result JSONB;
BEGIN
  -- 1. Buscar informações do perfil
  SELECT 
    plan,
    plan_expires_at,
    event_publications_used_this_month,
    event_publications_reset_at
  INTO 
    v_plan,
    v_plan_expires_at,
    v_publications_used,
    v_reset_at
  FROM profiles
  WHERE id = user_id;

  -- Se não encontrou usuário
  IF v_plan IS NULL THEN
    RETURN jsonb_build_object(
      'can_create', false,
      'reason', 'user_not_found',
      'message', 'Usuário não encontrado',
      'current_count', 0,
      'event_limit', 1,
      'publications_used', 0,
      'publications_quota', 0
    );
  END IF;

  -- 2. Verificar se plano está ativo
  v_plan_is_valid := (
    v_plan IS NOT NULL 
    AND v_plan != 'free' 
    AND (v_plan_expires_at IS NULL OR v_plan_expires_at > NOW())
  );

  -- 3. Obter cota mensal do plano
  v_publications_quota := get_event_monthly_quota(v_plan);
  v_publications_available := GREATEST(0, v_publications_quota - v_publications_used);

  -- 4. Contar eventos ativos (NÃO considera individuais pagos na cota)
  SELECT COUNT(*)::INT INTO v_active_events_count
  FROM events
  WHERE organizer_id = user_id
    AND ad_status = 'active'
    AND (expires_at IS NULL OR expires_at > NOW());

  -- =====================================================
  -- REGRA 1: LIMITE DE 1 EVENTO ATIVO (independente do plano)
  -- =====================================================
  IF v_active_events_count >= 1 THEN
    RETURN jsonb_build_object(
      'can_create', false,
      'reason', 'active_limit_reached',
      'message', 'Você já tem 1 evento ativo. Para publicar outro, delete o atual ou pague R$ 49,99 pela publicação individual.',
      'current_count', v_active_events_count,
      'event_limit', 1,
      'publications_used', v_publications_used,
      'publications_quota', v_publications_quota,
      'can_upgrade', v_plan IN ('free', 'basic', 'pro', 'pro_annual'),
      'can_pay_individual', true,
      'individual_price', 49.99
    );
  END IF;

  -- =====================================================
  -- REGRA 2: USUÁRIO FREE OU SEM PLANO ATIVO
  -- =====================================================
  IF NOT v_plan_is_valid OR v_plan = 'free' THEN
    RETURN jsonb_build_object(
      'can_create', false,
      'reason', 'no_active_plan',
      'message', 'Você precisa de um plano ativo ou pagar R$ 49,99 para publicar este evento.',
      'current_count', v_active_events_count,
      'event_limit', 1,
      'publications_used', 0,
      'publications_quota', 0,
      'requires_individual_payment', true,
      'can_pay_individual', true,
      'individual_price', 49.99,
      'can_upgrade', true
    );
  END IF;

  -- =====================================================
  -- REGRA 3: PLANO BASIC OU VIP (sem cotas mensais)
  -- =====================================================
  IF v_plan IN ('basic', 'basic_annual', 'vip') THEN
    RETURN jsonb_build_object(
      'can_create', false,
      'reason', 'no_monthly_quota',
      'message', 'Seu plano não inclui publicações de eventos. Faça upgrade para Pro/Elite ou pague R$ 49,99 pela publicação individual.',
      'current_count', v_active_events_count,
      'event_limit', 1,
      'publications_used', 0,
      'publications_quota', 0,
      'can_upgrade', true,
      'can_pay_individual', true,
      'individual_price', 49.99
    );
  END IF;

  -- =====================================================
  -- REGRA 4: JÁ USOU TODAS AS PUBLICAÇÕES DO MÊS
  -- =====================================================
  IF v_publications_used >= v_publications_quota THEN
    RETURN jsonb_build_object(
      'can_create', false,
      'reason', 'monthly_quota_exhausted',
      'message', format(
        'Você já usou %s de %s publicação(ões) do mês. Próximo reset: %s. Para publicar agora, faça upgrade ou pague R$ 49,99.',
        v_publications_used,
        v_publications_quota,
        TO_CHAR(v_reset_at, 'DD/MM/YYYY')
      ),
      'current_count', v_active_events_count,
      'event_limit', 1,
      'publications_used', v_publications_used,
      'publications_quota', v_publications_quota,
      'reset_at', v_reset_at,
      'can_upgrade', v_plan IN ('pro', 'pro_annual'),
      'can_pay_individual', true,
      'individual_price', 49.99
    );
  END IF;

  -- =====================================================
  -- PODE PUBLICAR COM A COTA DO PLANO
  -- =====================================================
  RETURN jsonb_build_object(
    'can_create', true,
    'reason', 'within_quota',
    'message', format(
      'Você pode publicar %s evento(s) com a cota do plano. Restam %s publicação(ões) este mês.',
      v_publications_available,
      v_publications_available
    ),
    'current_count', v_active_events_count,
    'event_limit', 1,
    'publications_used', v_publications_used,
    'publications_quota', v_publications_quota,
    'publications_available', v_publications_available,
    'reset_at', v_reset_at
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'can_create', false,
    'reason', 'error',
    'message', 'Erro ao verificar limites: ' || SQLERRM,
    'current_count', 0,
    'event_limit', 1
  );
END;
$$;

COMMENT ON FUNCTION can_create_event IS 'Verifica se usuário pode criar evento considerando: limite de 1 ativo, cotas mensais por plano';

GRANT EXECUTE ON FUNCTION can_create_event TO authenticated;

-- =====================================================
-- 6. FUNÇÃO: Incrementar contador de publicações
-- =====================================================
CREATE OR REPLACE FUNCTION increment_event_publication_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Incrementar apenas quando:
  -- 1. Evento está sendo publicado (não é draft)
  -- 2. Não é pagamento individual (se for individual, não conta na cota)
  -- 3. É uma nova publicação (INSERT com status active)
  IF NEW.ad_status = 'active' 
     AND (NEW.is_individual_paid IS NULL OR NEW.is_individual_paid = false)
     AND (TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.ad_status != 'active'))
  THEN
    UPDATE profiles
    SET event_publications_used_this_month = event_publications_used_this_month + 1
    WHERE id = NEW.organizer_id;
    
    -- Definir prazo de edição (24h após publicação)
    NEW.can_edit_until := NOW() + INTERVAL '24 hours';
    NEW.published_at := NOW();
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION increment_event_publication_count IS 'Incrementa contador de publicações quando evento é publicado (não conta individuais pagos)';

-- =====================================================
-- 7. CRIAR TRIGGER
-- =====================================================
DROP TRIGGER IF EXISTS trigger_increment_event_publication ON events;

CREATE TRIGGER trigger_increment_event_publication
  BEFORE INSERT OR UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION increment_event_publication_count();

COMMENT ON TRIGGER trigger_increment_event_publication ON events IS 'Incrementa contador de publicações ao publicar evento';

-- =====================================================
-- 8. FUNÇÃO: Atualizar evento pago individual
-- =====================================================
CREATE OR REPLACE FUNCTION process_individual_event_payment(
  p_user_id UUID,
  p_event_id UUID,
  p_payment_method TEXT DEFAULT 'simulated'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_transaction_id UUID;
  v_expires_at TIMESTAMPTZ;
BEGIN
  v_expires_at := NOW() + INTERVAL '30 days';
  
  -- 1. Criar transação simulada
  INSERT INTO transactions (
    user_id,
    type,
    amount,
    currency,
    status,
    metadata
  ) VALUES (
    p_user_id,
    'individual_ad',
    49.99,
    'BRL',
    'completed',
    jsonb_build_object(
      'event_id', p_event_id,
      'payment_method', p_payment_method,
      'duration_days', 30
    )
  ) RETURNING id INTO v_transaction_id;

  -- 2. Atualizar evento
  UPDATE events SET
    is_individual_paid = TRUE,
    individual_paid_expires_at = v_expires_at,
    ad_status = 'active',
    published_at = NOW(),
    expires_at = v_expires_at,
    paused_at = NULL,
    can_edit_until = NOW() + INTERVAL '24 hours' -- 24h para editar
  WHERE id = p_event_id 
    AND organizer_id = p_user_id;

  -- NÃO incrementa contador de publicações (individuais não contam)

  RETURN jsonb_build_object(
    'success', true,
    'transaction_id', v_transaction_id,
    'message', 'Pagamento processado! Seu evento estará ativo por 30 dias. Você tem 24h para editar.',
    'expires_at', v_expires_at,
    'can_edit_until', NOW() + INTERVAL '24 hours'
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'message', 'Erro ao processar pagamento: ' || SQLERRM
  );
END;
$$;

COMMENT ON FUNCTION process_individual_event_payment IS 'Processa pagamento individual de R$ 49,99 por 30 dias (não conta na cota mensal)';

GRANT EXECUTE ON FUNCTION process_individual_event_payment TO authenticated;

-- =====================================================
-- 9. ATUALIZAR EVENTOS EXISTENTES
-- =====================================================
-- Definir can_edit_until para eventos ativos recentes (publicados há menos de 24h)
UPDATE events
SET can_edit_until = published_at + INTERVAL '24 hours'
WHERE ad_status = 'active'
  AND published_at > NOW() - INTERVAL '24 hours'
  AND can_edit_until IS NULL;

-- Eventos publicados há mais de 24h não podem mais ser editados
UPDATE events
SET can_edit_until = published_at + INTERVAL '24 hours'
WHERE ad_status = 'active'
  AND published_at <= NOW() - INTERVAL '24 hours'
  AND can_edit_until IS NULL;

-- =====================================================
-- 10. CONFIGURAR CRON JOB PARA RESET MENSAL
-- =====================================================
-- NOTA: Este job será configurado manualmente via Supabase Dashboard
-- Devido a limitações do pg_cron em migrations

-- Para configurar manualmente:
-- 1. Acesse: Supabase Dashboard > Database > Cron Jobs
-- 2. Crie um novo job:
--    - Nome: reset-monthly-event-publications
--    - Schedule: 5 0 1 * * (todo dia 1 às 00:05)
--    - Comando: SELECT reset_monthly_event_publications();

-- Alternativamente, execute este SQL diretamente no SQL Editor:
/*
SELECT cron.schedule(
  'reset-monthly-event-publications',
  '5 0 1 * *',
  'SELECT reset_monthly_event_publications();'
);
*/

-- =====================================================
-- 11. LOG DE SUCESSO
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Migration 073: Sistema de cotas mensais para eventos criado com sucesso!';
  RAISE NOTICE '   - Pro: 1 publicação/mês';
  RAISE NOTICE '   - Elite: 2 publicações/mês';
  RAISE NOTICE '   - Limite: 1 evento ativo por usuário';
  RAISE NOTICE '   - Edição: 24h após publicação';
  RAISE NOTICE '   - Pagamento individual: R$ 49,99 (não conta na cota)';
END $$;

