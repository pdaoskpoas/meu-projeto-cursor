-- =====================================================
-- Migration: Adicionar sistema de pagamento e ciclo de vida para eventos
-- Descrição: Adiciona campos para controlar pagamentos individuais, 
--            limites por plano e ciclo de vida dos eventos
-- Data: 2025-11-03
-- =====================================================

-- Adicionar campos de pagamento individual e ciclo de vida
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS is_individual_paid BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS individual_paid_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS paused_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS auto_renew BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS organizer_property TEXT;

-- Comentários para documentação
COMMENT ON COLUMN events.is_individual_paid IS 'TRUE = Evento pago individualmente (R$ 49,90) por 1 mês, NÃO conta no limite do plano';
COMMENT ON COLUMN events.individual_paid_expires_at IS 'Data de expiração do pagamento individual (1 mês após pagamento)';
COMMENT ON COLUMN events.paused_at IS 'Data em que o evento foi pausado (após expiração)';
COMMENT ON COLUMN events.auto_renew IS 'Se deve tentar renovar automaticamente quando o plano permitir';
COMMENT ON COLUMN events.organizer_property IS 'Nome da propriedade do organizador';

-- Criar índices para otimizar consultas
CREATE INDEX IF NOT EXISTS idx_events_organizer_status ON events(organizer_id, ad_status);
CREATE INDEX IF NOT EXISTS idx_events_expires_at ON events(expires_at) WHERE ad_status = 'active';
CREATE INDEX IF NOT EXISTS idx_events_paused_at ON events(paused_at) WHERE ad_status = 'paused';

-- Criar função para contar eventos ativos por usuário
CREATE OR REPLACE FUNCTION count_active_events(user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  active_count INTEGER;
BEGIN
  SELECT COUNT(*)::INTEGER INTO active_count
  FROM events
  WHERE organizer_id = user_id
    AND ad_status = 'active'
    AND (expires_at IS NULL OR expires_at > NOW());
  
  RETURN COALESCE(active_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentário da função
COMMENT ON FUNCTION count_active_events IS 'Retorna o número de eventos ativos de um usuário';

-- Criar função para obter limite de eventos por plano
CREATE OR REPLACE FUNCTION get_event_limit(user_plan TEXT)
RETURNS INTEGER AS $$
BEGIN
  RETURN CASE user_plan
    WHEN 'basic' THEN 1     -- Iniciante: 1 evento
    WHEN 'pro' THEN 2       -- Pro: 2 eventos
    WHEN 'ultra' THEN 3     -- Elite: 3 eventos
    WHEN 'vip' THEN 999     -- VIP: ilimitado
    ELSE 0                  -- Free: 0 eventos (precisa pagar individual)
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Comentário da função
COMMENT ON FUNCTION get_event_limit IS 'Retorna o limite de eventos ativos por tipo de plano';

-- Criar função para verificar se usuário pode criar evento
CREATE OR REPLACE FUNCTION can_create_event(user_id UUID)
RETURNS JSONB AS $$
DECLARE
  user_plan TEXT;
  plan_active BOOLEAN;
  current_count INTEGER;
  event_limit INTEGER;
  result JSONB;
BEGIN
  -- Buscar informações do usuário
  SELECT plan, (plan_expires_at IS NULL OR plan_expires_at > NOW())
  INTO user_plan, plan_active
  FROM profiles
  WHERE id = user_id;

  -- Se não encontrou usuário
  IF user_plan IS NULL THEN
    RETURN jsonb_build_object(
      'can_create', false,
      'reason', 'user_not_found',
      'message', 'Usuário não encontrado'
    );
  END IF;

  -- Contar eventos ativos
  current_count := count_active_events(user_id);
  event_limit := get_event_limit(user_plan);

  -- Plano free ou vip sem plano ativo: não pode criar no plano
  IF user_plan = 'free' OR NOT plan_active THEN
    RETURN jsonb_build_object(
      'can_create', false,
      'reason', 'no_active_plan',
      'message', 'Você precisa de um plano ativo ou pagar R$ 49,90 para publicar este evento',
      'current_count', current_count,
      'event_limit', 0,
      'requires_individual_payment', true,
      'individual_price', 49.90
    );
  END IF;

  -- Verificar limite do plano
  IF current_count >= event_limit THEN
    RETURN jsonb_build_object(
      'can_create', false,
      'reason', 'limit_reached',
      'message', format('Você atingiu o limite de %s eventos ativos do plano %s', event_limit, UPPER(user_plan)),
      'current_count', current_count,
      'event_limit', event_limit,
      'can_upgrade', true,
      'can_pay_individual', true,
      'individual_price', 49.90
    );
  END IF;

  -- Pode criar evento
  RETURN jsonb_build_object(
    'can_create', true,
    'reason', 'within_limit',
    'message', format('Você pode criar mais %s evento(s) no seu plano', event_limit - current_count),
    'current_count', current_count,
    'event_limit', event_limit
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentário da função
COMMENT ON FUNCTION can_create_event IS 'Verifica se um usuário pode criar um novo evento baseado no seu plano';

-- Criar função para processar pagamento individual de evento (SIMULADO)
CREATE OR REPLACE FUNCTION process_individual_event_payment(
  p_user_id UUID,
  p_event_id UUID,
  p_payment_method TEXT DEFAULT 'simulated'
)
RETURNS JSONB AS $$
DECLARE
  transaction_id UUID;
  result JSONB;
BEGIN
  -- Criar transação simulada
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
    49.90,
    'BRL',
    'completed', -- SIMULADO: sempre completa
    jsonb_build_object(
      'event_id', p_event_id,
      'payment_method', p_payment_method,
      'duration_days', 30
    )
  ) RETURNING id INTO transaction_id;

  -- Atualizar evento
  UPDATE events SET
    is_individual_paid = TRUE,
    individual_paid_expires_at = NOW() + INTERVAL '30 days',
    ad_status = 'active',
    published_at = NOW(),
    expires_at = NOW() + INTERVAL '30 days',
    paused_at = NULL
  WHERE id = p_event_id AND organizer_id = p_user_id;

  -- Retornar resultado
  RETURN jsonb_build_object(
    'success', true,
    'transaction_id', transaction_id,
    'message', 'Pagamento processado com sucesso! Seu evento estará ativo por 30 dias.',
    'expires_at', NOW() + INTERVAL '30 days'
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'message', 'Erro ao processar pagamento: ' || SQLERRM
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentário da função
COMMENT ON FUNCTION process_individual_event_payment IS 'Processa pagamento individual de evento (SIMULADO - sem integração real)';

-- Criar view para eventos do dashboard do usuário
CREATE OR REPLACE VIEW user_events_dashboard AS
SELECT 
  e.id,
  e.title,
  e.event_type,
  e.start_date,
  e.end_date,
  e.city,
  e.state,
  e.ad_status,
  e.published_at,
  e.expires_at,
  e.is_boosted,
  e.boost_expires_at,
  e.is_individual_paid,
  e.individual_paid_expires_at,
  e.paused_at,
  e.cover_image_url,
  e.organizer_id,
  e.created_at,
  -- Analytics
  COALESCE(i.impressions, 0) AS impressions,
  COALESCE(c.clicks, 0) AS clicks,
  -- Status computed
  CASE 
    WHEN e.ad_status = 'active' AND e.expires_at > NOW() THEN 'active'
    WHEN e.ad_status = 'paused' THEN 'paused'
    WHEN e.expires_at <= NOW() THEN 'expired'
    ELSE e.ad_status
  END AS computed_status,
  -- Dias restantes
  CASE 
    WHEN e.ad_status = 'active' AND e.expires_at > NOW() 
    THEN EXTRACT(DAY FROM (e.expires_at - NOW()))::INTEGER
    ELSE 0
  END AS days_remaining
FROM events e
LEFT JOIN (
  SELECT content_id, COUNT(*) AS impressions
  FROM impressions
  WHERE content_type = 'event'
  GROUP BY content_id
) i ON i.content_id = e.id
LEFT JOIN (
  SELECT content_id, COUNT(*) AS clicks
  FROM clicks
  WHERE content_type = 'event'
  GROUP BY content_id
) c ON c.content_id = e.id;

-- Comentário da view
COMMENT ON VIEW user_events_dashboard IS 'View otimizada para exibir eventos no dashboard do usuário com analytics';

-- Grant permissions
GRANT SELECT ON user_events_dashboard TO authenticated;
GRANT EXECUTE ON FUNCTION count_active_events TO authenticated;
GRANT EXECUTE ON FUNCTION get_event_limit TO authenticated;
GRANT EXECUTE ON FUNCTION can_create_event TO authenticated;
GRANT EXECUTE ON FUNCTION process_individual_event_payment TO authenticated;

-- Log de sucesso
DO $$
BEGIN
  RAISE NOTICE 'Migration 036: Sistema de pagamento e ciclo de vida de eventos criado com sucesso';
END $$;


