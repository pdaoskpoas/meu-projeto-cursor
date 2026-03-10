-- =====================================================
-- MIGRAÇÃO 043: SISTEMA DE AGREGAÇÃO DE NOTIFICAÇÕES
-- Data: 04/11/2025
-- Descrição: Agrupa notificações similares para melhor UX
-- Objetivo: Reduzir poluição visual e melhorar performance
-- =====================================================

-- =====================================================
-- 1. ADICIONAR CAMPOS DE AGREGAÇÃO
-- =====================================================

ALTER TABLE public.notifications
ADD COLUMN IF NOT EXISTS is_aggregated BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS aggregated_count INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS aggregation_key TEXT,
ADD COLUMN IF NOT EXISTS last_aggregated_at TIMESTAMPTZ DEFAULT NOW();

COMMENT ON COLUMN public.notifications.is_aggregated IS 'Se true, esta notificação representa múltiplas notificações agregadas';
COMMENT ON COLUMN public.notifications.aggregated_count IS 'Quantidade de notificações representadas nesta agregação';
COMMENT ON COLUMN public.notifications.aggregation_key IS 'Chave única para agrupar notificações similares (ex: favorite_animal_123)';
COMMENT ON COLUMN public.notifications.last_aggregated_at IS 'Última vez que uma notificação foi adicionada a esta agregação';

-- Índice para buscar por chave de agregação
CREATE INDEX IF NOT EXISTS idx_notifications_aggregation_key 
ON public.notifications(aggregation_key) 
WHERE is_aggregated = false;

-- =====================================================
-- 2. FUNÇÃO DE AGREGAÇÃO DE NOTIFICAÇÕES
-- =====================================================

CREATE OR REPLACE FUNCTION public.aggregate_notifications(
  p_user_id UUID,
  p_notification_type TEXT,
  p_related_content_id UUID,
  p_time_window_hours INTEGER DEFAULT 24
) RETURNS void AS $$
DECLARE
  v_aggregation_key TEXT;
  v_existing_notification_id UUID;
  v_count INTEGER;
  v_new_message TEXT;
BEGIN
  -- Criar chave de agregação
  v_aggregation_key := p_notification_type || '_' || p_related_content_id::text;
  
  -- Buscar notificação agregada existente (últimas N horas)
  SELECT id, aggregated_count INTO v_existing_notification_id, v_count
  FROM public.notifications
  WHERE user_id = p_user_id
    AND aggregation_key = v_aggregation_key
    AND is_aggregated = true
    AND created_at > NOW() - (p_time_window_hours || ' hours')::INTERVAL
  LIMIT 1;
  
  IF v_existing_notification_id IS NOT NULL THEN
    -- Atualizar notificação existente
    v_count := v_count + 1;
    
    -- Atualizar mensagem baseada na contagem
    CASE p_notification_type
      WHEN 'favorite_added' THEN
        v_new_message := v_count || ' pessoas favoritaram seu anúncio nas últimas ' || p_time_window_hours || 'h.';
      WHEN 'animal_view' THEN
        v_new_message := 'Seu anúncio recebeu ' || v_count || ' novas visualizações nas últimas ' || p_time_window_hours || 'h.';
      ELSE
        v_new_message := v_count || ' novas interações no seu anúncio.';
    END CASE;
    
    UPDATE public.notifications
    SET 
      aggregated_count = v_count,
      last_aggregated_at = NOW(),
      message = v_new_message,
      is_read = false -- Marcar como não lida novamente
    WHERE id = v_existing_notification_id;
    
  ELSE
    -- Não há notificação para agregar ainda
    -- A primeira notificação será criada pelo trigger normal
    RETURN;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.aggregate_notifications IS 'Agrupa notificações similares para reduzir poluição visual';

-- =====================================================
-- 3. FUNÇÃO PARA LIMPAR NOTIFICAÇÕES DUPLICADAS
-- =====================================================

CREATE OR REPLACE FUNCTION public.merge_duplicate_notifications()
RETURNS INTEGER AS $$
DECLARE
  v_merged_count INTEGER := 0;
  v_rec RECORD;
BEGIN
  -- Buscar notificações duplicadas (mesmo tipo, mesmo conteúdo, mesmo dia)
  FOR v_rec IN
    SELECT 
      user_id,
      type,
      related_content_id,
      DATE(created_at) as notification_date,
      COUNT(*) as dup_count,
      MIN(id) as keep_id,
      ARRAY_AGG(id ORDER BY created_at) as all_ids
    FROM public.notifications
    WHERE 
      is_aggregated = false
      AND created_at > NOW() - INTERVAL '24 hours'
      AND type IN ('favorite_added', 'animal_view')
    GROUP BY user_id, type, related_content_id, DATE(created_at)
    HAVING COUNT(*) > 1
  LOOP
    -- Manter a primeira notificação e marcar como agregada
    UPDATE public.notifications
    SET 
      is_aggregated = true,
      aggregated_count = v_rec.dup_count,
      aggregation_key = v_rec.type || '_' || v_rec.related_content_id::text,
      last_aggregated_at = NOW(),
      message = CASE 
        WHEN v_rec.type = 'favorite_added' THEN
          v_rec.dup_count || ' pessoas favoritaram seu anúncio hoje.'
        WHEN v_rec.type = 'animal_view' THEN
          'Seu anúncio recebeu ' || v_rec.dup_count || ' visualizações hoje.'
        ELSE
          v_rec.dup_count || ' novas interações no seu anúncio.'
      END
    WHERE id = v_rec.keep_id;
    
    -- Deletar notificações duplicadas
    DELETE FROM public.notifications
    WHERE id = ANY(v_rec.all_ids)
      AND id != v_rec.keep_id;
    
    v_merged_count := v_merged_count + (v_rec.dup_count - 1);
  END LOOP;
  
  RETURN v_merged_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.merge_duplicate_notifications IS 'Mescla notificações duplicadas existentes - executar periodicamente';

-- =====================================================
-- 4. ATUALIZAR FUNÇÃO DE LIMPEZA
-- =====================================================

CREATE OR REPLACE FUNCTION public.cleanup_old_notifications()
RETURNS void AS $$
BEGIN
  -- 1. Deletar notificações expiradas (mais de 30 dias)
  DELETE FROM public.notifications
  WHERE expires_at < NOW();
  
  -- 2. Deletar notificações lidas com mais de 7 dias
  DELETE FROM public.notifications
  WHERE is_read = true
    AND read_at < NOW() - INTERVAL '7 days';
  
  -- 3. Mesclar notificações duplicadas antes de limpar
  PERFORM public.merge_duplicate_notifications();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 5. VIEW: NOTIFICAÇÕES AGREGADAS POR USUÁRIO
-- =====================================================

CREATE OR REPLACE VIEW public.notifications_summary AS
SELECT 
  user_id,
  type,
  DATE(created_at) as notification_date,
  COUNT(*) as total_notifications,
  SUM(aggregated_count) as total_events,
  MAX(created_at) as most_recent,
  BOOL_OR(NOT is_read) as has_unread
FROM public.notifications
WHERE expires_at > NOW()
GROUP BY user_id, type, DATE(created_at)
ORDER BY most_recent DESC;

COMMENT ON VIEW public.notifications_summary IS 'Resumo de notificações agregadas por usuário e tipo';

-- =====================================================
-- 6. FUNÇÃO PARA ESTATÍSTICAS DE AGREGAÇÃO
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_notification_stats(p_user_id UUID)
RETURNS TABLE (
  metric TEXT,
  value NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 'total_notifications'::TEXT, COUNT(*)::NUMERIC
  FROM public.notifications
  WHERE user_id = p_user_id
  
  UNION ALL
  
  SELECT 'unread_notifications'::TEXT, COUNT(*)::NUMERIC
  FROM public.notifications
  WHERE user_id = p_user_id AND is_read = false
  
  UNION ALL
  
  SELECT 'aggregated_notifications'::TEXT, COUNT(*)::NUMERIC
  FROM public.notifications
  WHERE user_id = p_user_id AND is_aggregated = true
  
  UNION ALL
  
  SELECT 'total_events'::TEXT, COALESCE(SUM(aggregated_count), 0)::NUMERIC
  FROM public.notifications
  WHERE user_id = p_user_id
  
  UNION ALL
  
  SELECT 'avg_events_per_notification'::TEXT, 
    COALESCE(AVG(aggregated_count), 0)::NUMERIC
  FROM public.notifications
  WHERE user_id = p_user_id AND is_aggregated = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_notification_stats IS 'Retorna estatísticas detalhadas de notificações para um usuário';

-- =====================================================
-- 7. TRIGGER PARA AUTO-AGREGAÇÃO (OPCIONAL)
-- =====================================================

-- Este trigger pode ser ativado para agregar automaticamente
-- Por padrão está desabilitado, executar merge manualmente ou via cron

/*
CREATE OR REPLACE FUNCTION public.auto_aggregate_on_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- Tentar agregar notificação recém-criada
  PERFORM public.aggregate_notifications(
    NEW.user_id,
    NEW.type,
    NEW.related_content_id,
    24 -- Janela de 24 horas
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_auto_aggregate_notifications
  AFTER INSERT ON public.notifications
  FOR EACH ROW
  WHEN (NEW.type IN ('favorite_added', 'animal_view'))
  EXECUTE FUNCTION public.auto_aggregate_on_insert();
*/

-- =====================================================
-- 8. EXEMPLO DE USO
-- =====================================================

-- Mesclar notificações duplicadas manualmente:
-- SELECT public.merge_duplicate_notifications();

-- Ver estatísticas de um usuário:
-- SELECT * FROM public.get_notification_stats('user-uuid-here');

-- Ver resumo de notificações:
-- SELECT * FROM public.notifications_summary WHERE user_id = 'user-uuid-here';

-- Agendar limpeza automática (requer pg_cron):
-- SELECT cron.schedule(
--   'merge-notifications',
--   '0 */6 * * *', -- A cada 6 horas
--   'SELECT public.merge_duplicate_notifications();'
-- );

-- =====================================================
-- FIM DA MIGRAÇÃO 043
-- =====================================================

