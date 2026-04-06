-- Migration 112: Notificações de visualizações semanais
-- Data: 06/04/2026
-- Problema: trigger disparava notificação a cada 10 impressões nas últimas 24h,
--   gerando spam de notificações. O comportamento correto é enviar UMA notificação
--   por animal por semana com o resumo total de visualizações e cliques da semana.

CREATE OR REPLACE FUNCTION public.notify_on_animal_engagement()
RETURNS TRIGGER AS $$
DECLARE
  v_animal_name TEXT;
  v_owner_id UUID;
  v_weekly_impressions INTEGER;
  v_weekly_clicks INTEGER;
  v_last_notification_at TIMESTAMPTZ;
BEGIN
  -- Buscar informações do animal
  SELECT name, owner_id INTO v_animal_name, v_owner_id
  FROM public.animals
  WHERE id = NEW.content_id
  AND NEW.content_type = 'animal';

  -- Se não é um animal, retornar
  IF v_owner_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Verificar se já foi enviada notificação para este animal na última semana
  SELECT created_at INTO v_last_notification_at
  FROM public.notifications
  WHERE user_id = v_owner_id
    AND type = 'animal_view'
    AND metadata->>'animal_id' = NEW.content_id::TEXT
    AND created_at > NOW() - INTERVAL '7 days'
  ORDER BY created_at DESC
  LIMIT 1;

  -- Se já enviou notificação esta semana, não enviar outra
  IF v_last_notification_at IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Contar impressões da última semana
  SELECT COUNT(*) INTO v_weekly_impressions
  FROM public.impressions
  WHERE content_id = NEW.content_id
    AND content_type = 'animal'
    AND created_at > NOW() - INTERVAL '7 days';

  -- Contar cliques da última semana
  SELECT COUNT(*) INTO v_weekly_clicks
  FROM public.clicks
  WHERE content_id = NEW.content_id
    AND content_type = 'animal'
    AND created_at > NOW() - INTERVAL '7 days';

  -- Enviar resumo semanal
  PERFORM public.create_notification(
    p_user_id := v_owner_id,
    p_type := 'animal_view',
    p_title := 'Resumo semanal do seu anúncio',
    p_message := 'Seu anúncio "' || v_animal_name || '" teve ' || v_weekly_impressions || ' visualizações na última semana.',
    p_action_url := '/animals/' || NEW.content_id,
    p_metadata := jsonb_build_object(
      'animal_id', NEW.content_id,
      'animal_name', v_animal_name,
      'impressions_count', v_weekly_impressions,
      'clicks_count', v_weekly_clicks
    ),
    p_related_content_type := 'animal',
    p_related_content_id := NEW.content_id
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.notify_on_animal_engagement() IS
  'Envia no máximo 1 notificação por animal por semana com o total de visualizações e cliques da semana.';
