-- =====================================================
-- MIGRAÇÃO 045: ANALYTICS DE NOTIFICAÇÕES
-- Data: 04/11/2025
-- Descrição: Sistema de analytics para notificações
-- Objetivo: Medir engagement e otimizar sistema
-- =====================================================

-- =====================================================
-- 1. CRIAR TABELA DE ANALYTICS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.notification_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  notification_id UUID NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Eventos
  event_type TEXT NOT NULL CHECK (event_type IN ('delivered', 'viewed', 'clicked', 'dismissed')),
  
  -- Tempo de resposta
  time_to_view_seconds INTEGER, -- Tempo até visualizar
  time_to_click_seconds INTEGER, -- Tempo até clicar
  
  -- Contexto
  device_type TEXT, -- web, mobile, tablet
  browser TEXT,
  os TEXT,
  
  -- Metadados
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- 2. ÍNDICES PARA ANALYTICS
-- =====================================================

CREATE INDEX idx_notification_analytics_notification_id 
ON public.notification_analytics(notification_id);

CREATE INDEX idx_notification_analytics_user_id 
ON public.notification_analytics(user_id);

CREATE INDEX idx_notification_analytics_event_type 
ON public.notification_analytics(event_type);

CREATE INDEX idx_notification_analytics_created_at 
ON public.notification_analytics(created_at DESC);

-- =====================================================
-- 3. COMENTÁRIOS
-- =====================================================

COMMENT ON TABLE public.notification_analytics IS 'Analytics de notificações - engagement e performance';
COMMENT ON COLUMN public.notification_analytics.event_type IS 'Tipo de evento: delivered, viewed, clicked, dismissed';
COMMENT ON COLUMN public.notification_analytics.time_to_view_seconds IS 'Tempo em segundos desde criação até visualização';
COMMENT ON COLUMN public.notification_analytics.time_to_click_seconds IS 'Tempo em segundos desde criação até clique';

-- =====================================================
-- 4. RLS POLICIES
-- =====================================================

ALTER TABLE public.notification_analytics ENABLE ROW LEVEL SECURITY;

-- Sistema pode inserir
CREATE POLICY "system_can_insert_analytics"
  ON public.notification_analytics
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Usuários podem ver apenas seus analytics
CREATE POLICY "users_can_view_own_analytics"
  ON public.notification_analytics
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins podem ver todos
CREATE POLICY "admins_can_view_all_analytics"
  ON public.notification_analytics
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- 5. FUNÇÃO PARA REGISTRAR EVENTO
-- =====================================================

CREATE OR REPLACE FUNCTION public.track_notification_event(
  p_notification_id UUID,
  p_event_type TEXT,
  p_device_type TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
  v_analytics_id UUID;
  v_notification RECORD;
  v_time_diff INTEGER;
BEGIN
  -- Buscar notificação
  SELECT * INTO v_notification
  FROM public.notifications
  WHERE id = p_notification_id;
  
  IF v_notification IS NULL THEN
    RAISE EXCEPTION 'Notificação não encontrada';
  END IF;
  
  -- Calcular tempo decorrido
  v_time_diff := EXTRACT(EPOCH FROM (NOW() - v_notification.created_at))::INTEGER;
  
  -- Inserir evento
  INSERT INTO public.notification_analytics (
    notification_id,
    user_id,
    event_type,
    time_to_view_seconds,
    time_to_click_seconds,
    device_type,
    metadata
  ) VALUES (
    p_notification_id,
    v_notification.user_id,
    p_event_type,
    CASE WHEN p_event_type = 'viewed' THEN v_time_diff ELSE NULL END,
    CASE WHEN p_event_type = 'clicked' THEN v_time_diff ELSE NULL END,
    p_device_type,
    p_metadata
  ) RETURNING id INTO v_analytics_id;
  
  RETURN v_analytics_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.track_notification_event IS 'Registra evento de analytics para notificação';

-- =====================================================
-- 6. VIEW: MÉTRICAS GERAIS
-- =====================================================

CREATE OR REPLACE VIEW public.notification_metrics AS
WITH notification_counts AS (
  SELECT 
    COUNT(DISTINCT n.id) as total_notifications,
    COUNT(DISTINCT CASE WHEN n.is_read THEN n.id END) as total_read,
    COUNT(DISTINCT a.id) FILTER (WHERE a.event_type = 'viewed') as total_viewed,
    COUNT(DISTINCT a.id) FILTER (WHERE a.event_type = 'clicked') as total_clicked,
    
    -- Taxas
    ROUND(
      COUNT(DISTINCT CASE WHEN n.is_read THEN n.id END)::NUMERIC / 
      NULLIF(COUNT(DISTINCT n.id), 0) * 100, 2
    ) as read_rate_pct,
    
    ROUND(
      COUNT(DISTINCT a.id) FILTER (WHERE a.event_type = 'clicked')::NUMERIC / 
      NULLIF(COUNT(DISTINCT a.id) FILTER (WHERE a.event_type = 'viewed'), 0) * 100, 2
    ) as click_through_rate_pct,
    
    -- Tempos médios
    ROUND(AVG(a.time_to_view_seconds) FILTER (WHERE a.time_to_view_seconds IS NOT NULL), 2) as avg_time_to_view_seconds,
    ROUND(AVG(a.time_to_click_seconds) FILTER (WHERE a.time_to_click_seconds IS NOT NULL), 2) as avg_time_to_click_seconds
  FROM public.notifications n
  LEFT JOIN public.notification_analytics a ON a.notification_id = n.id
  WHERE n.created_at > NOW() - INTERVAL '30 days'
),
type_counts AS (
  SELECT 
    jsonb_object_agg(type, count) as count_by_type
  FROM (
    SELECT 
      COALESCE(type, 'unknown') as type,
      COUNT(*) as count
    FROM public.notifications
    WHERE created_at > NOW() - INTERVAL '30 days'
      AND type IS NOT NULL
    GROUP BY type
  ) t
)
SELECT 
  nc.*,
  tc.count_by_type
FROM notification_counts nc
CROSS JOIN type_counts tc;

COMMENT ON VIEW public.notification_metrics IS 'Métricas agregadas de notificações - últimos 30 dias';

-- =====================================================
-- 7. VIEW: MÉTRICAS POR USUÁRIO
-- =====================================================

CREATE OR REPLACE VIEW public.user_notification_metrics AS
SELECT 
  n.user_id,
  COUNT(DISTINCT n.id) as total_notifications,
  COUNT(DISTINCT CASE WHEN n.is_read THEN n.id END) as total_read,
  COUNT(DISTINCT a.id) FILTER (WHERE a.event_type = 'viewed') as total_viewed,
  COUNT(DISTINCT a.id) FILTER (WHERE a.event_type = 'clicked') as total_clicked,
  
  ROUND(
    COUNT(DISTINCT CASE WHEN n.is_read THEN n.id END)::NUMERIC / 
    NULLIF(COUNT(DISTINCT n.id), 0) * 100, 2
  ) as read_rate_pct,
  
  ROUND(AVG(a.time_to_view_seconds) FILTER (WHERE a.time_to_view_seconds IS NOT NULL), 2) as avg_time_to_view_seconds,
  
  MAX(n.created_at) as last_notification_at
  
FROM public.notifications n
LEFT JOIN public.notification_analytics a ON a.notification_id = n.id
WHERE n.created_at > NOW() - INTERVAL '30 days'
GROUP BY n.user_id;

COMMENT ON VIEW public.user_notification_metrics IS 'Métricas por usuário - últimos 30 dias';

-- =====================================================
-- 8. VIEW: PERFORMANCE POR TIPO
-- =====================================================

CREATE OR REPLACE VIEW public.notification_type_performance AS
SELECT 
  n.type,
  COUNT(DISTINCT n.id) as total_sent,
  COUNT(DISTINCT CASE WHEN n.is_read THEN n.id END) as total_read,
  COUNT(DISTINCT a.id) FILTER (WHERE a.event_type = 'clicked') as total_clicked,
  
  ROUND(
    COUNT(DISTINCT CASE WHEN n.is_read THEN n.id END)::NUMERIC / 
    NULLIF(COUNT(DISTINCT n.id), 0) * 100, 2
  ) as read_rate_pct,
  
  ROUND(
    COUNT(DISTINCT a.id) FILTER (WHERE a.event_type = 'clicked')::NUMERIC / 
    NULLIF(COUNT(DISTINCT CASE WHEN n.is_read THEN n.id END), 0) * 100, 2
  ) as click_rate_pct,
  
  ROUND(AVG(a.time_to_view_seconds) FILTER (WHERE a.time_to_view_seconds IS NOT NULL), 2) as avg_time_to_view_seconds,
  ROUND(AVG(a.time_to_click_seconds) FILTER (WHERE a.time_to_click_seconds IS NOT NULL), 2) as avg_time_to_click_seconds
  
FROM public.notifications n
LEFT JOIN public.notification_analytics a ON a.notification_id = n.id
WHERE n.created_at > NOW() - INTERVAL '30 days'
GROUP BY n.type
ORDER BY total_sent DESC;

COMMENT ON VIEW public.notification_type_performance IS 'Performance por tipo de notificação - últimos 30 dias';

-- =====================================================
-- 9. FUNÇÃO: RELATÓRIO DE ANALYTICS
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_notification_analytics_report(
  p_start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days',
  p_end_date TIMESTAMPTZ DEFAULT NOW()
) RETURNS TABLE (
  metric TEXT,
  value NUMERIC,
  unit TEXT
) AS $$
BEGIN
  RETURN QUERY
  -- Total de notificações
  SELECT 
    'total_notifications'::TEXT,
    COUNT(*)::NUMERIC,
    'count'::TEXT
  FROM public.notifications
  WHERE created_at BETWEEN p_start_date AND p_end_date
  
  UNION ALL
  
  -- Taxa de leitura
  SELECT 
    'read_rate'::TEXT,
    ROUND(
      COUNT(*) FILTER (WHERE is_read)::NUMERIC / 
      NULLIF(COUNT(*), 0) * 100, 2
    ),
    'percent'::TEXT
  FROM public.notifications
  WHERE created_at BETWEEN p_start_date AND p_end_date
  
  UNION ALL
  
  -- Tempo médio até leitura
  SELECT 
    'avg_time_to_read'::TEXT,
    ROUND(AVG(
      EXTRACT(EPOCH FROM (read_at - created_at)) / 3600
    ), 2),
    'hours'::TEXT
  FROM public.notifications
  WHERE created_at BETWEEN p_start_date AND p_end_date
    AND read_at IS NOT NULL
  
  UNION ALL
  
  -- Taxa de cliques
  SELECT 
    'click_through_rate'::TEXT,
    ROUND(
      COUNT(DISTINCT a.id) FILTER (WHERE a.event_type = 'clicked')::NUMERIC / 
      NULLIF(COUNT(DISTINCT n.id) FILTER (WHERE n.is_read), 0) * 100, 2
    ),
    'percent'::TEXT
  FROM public.notifications n
  LEFT JOIN public.notification_analytics a ON a.notification_id = n.id
  WHERE n.created_at BETWEEN p_start_date AND p_end_date
  
  UNION ALL
  
  -- Notificações agregadas
  SELECT 
    'aggregated_notifications'::TEXT,
    COUNT(*)::NUMERIC,
    'count'::TEXT
  FROM public.notifications
  WHERE created_at BETWEEN p_start_date AND p_end_date
    AND is_aggregated = true
  
  UNION ALL
  
  -- Taxa de agregação
  SELECT 
    'aggregation_rate'::TEXT,
    ROUND(
      COUNT(*) FILTER (WHERE is_aggregated)::NUMERIC / 
      NULLIF(COUNT(*), 0) * 100, 2
    ),
    'percent'::TEXT
  FROM public.notifications
  WHERE created_at BETWEEN p_start_date AND p_end_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_notification_analytics_report IS 'Relatório completo de analytics de notificações';

-- =====================================================
-- 10. TRIGGER: AUTO-TRACK DELIVERED
-- =====================================================

CREATE OR REPLACE FUNCTION public.auto_track_notification_delivered()
RETURNS TRIGGER AS $$
BEGIN
  -- Registrar evento "delivered" automaticamente
  PERFORM public.track_notification_event(
    NEW.id,
    'delivered',
    'web',
    '{}'::jsonb
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_auto_track_delivered
  AFTER INSERT ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_track_notification_delivered();

COMMENT ON TRIGGER trigger_auto_track_delivered ON public.notifications 
IS 'Registra automaticamente evento "delivered" para analytics';

-- =====================================================
-- FIM DA MIGRAÇÃO 045
-- =====================================================

