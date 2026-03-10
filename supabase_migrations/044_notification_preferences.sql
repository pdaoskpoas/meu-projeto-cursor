-- =====================================================
-- MIGRAÇÃO 044: PREFERÊNCIAS DE NOTIFICAÇÕES
-- Data: 04/11/2025
-- Descrição: Permite usuário escolher quais notificações receber
-- Objetivo: Controle granular e melhor UX
-- =====================================================

-- =====================================================
-- 1. CRIAR TABELA DE PREFERÊNCIAS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Preferências por tipo de notificação
  favorite_added_enabled BOOLEAN DEFAULT true,
  message_received_enabled BOOLEAN DEFAULT true,
  animal_view_enabled BOOLEAN DEFAULT true,
  animal_click_enabled BOOLEAN DEFAULT false, -- Desabilitado por padrão (menos importante)
  boost_expiring_enabled BOOLEAN DEFAULT true,
  ad_expiring_enabled BOOLEAN DEFAULT true,
  partnership_invite_enabled BOOLEAN DEFAULT true,
  partnership_accepted_enabled BOOLEAN DEFAULT true,
  
  -- Preferências de frequência
  digest_mode BOOLEAN DEFAULT false, -- Se true, agrupa notificações em digest
  digest_frequency TEXT DEFAULT 'daily' CHECK (digest_frequency IN ('realtime', 'hourly', 'daily', 'weekly')),
  
  -- Preferências de canal
  in_app_enabled BOOLEAN DEFAULT true,
  email_enabled BOOLEAN DEFAULT false, -- Email desabilitado por padrão
  push_enabled BOOLEAN DEFAULT false,  -- Push desabilitado por padrão
  
  -- Horário silencioso (não enviar notificações)
  quiet_hours_enabled BOOLEAN DEFAULT false,
  quiet_hours_start TIME DEFAULT '22:00:00',
  quiet_hours_end TIME DEFAULT '08:00:00',
  
  -- Metadados
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraint: apenas uma preferência por usuário
  UNIQUE(user_id)
);

-- =====================================================
-- 2. ÍNDICES
-- =====================================================

CREATE INDEX idx_notification_preferences_user_id 
ON public.notification_preferences(user_id);

-- =====================================================
-- 3. COMENTÁRIOS
-- =====================================================

COMMENT ON TABLE public.notification_preferences IS 'Preferências de notificações por usuário - controle granular';
COMMENT ON COLUMN public.notification_preferences.digest_mode IS 'Se true, agrupa notificações ao invés de enviar em tempo real';
COMMENT ON COLUMN public.notification_preferences.digest_frequency IS 'Frequência do digest: realtime, hourly, daily, weekly';
COMMENT ON COLUMN public.notification_preferences.quiet_hours_enabled IS 'Se true, não envia notificações durante horário silencioso';

-- =====================================================
-- 4. RLS POLICIES
-- =====================================================

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver apenas suas preferências
CREATE POLICY "users_can_view_own_preferences"
  ON public.notification_preferences
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Usuários podem atualizar apenas suas preferências
CREATE POLICY "users_can_update_own_preferences"
  ON public.notification_preferences
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Usuários podem inserir apenas suas preferências
CREATE POLICY "users_can_insert_own_preferences"
  ON public.notification_preferences
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Admins podem ver todas
CREATE POLICY "admins_can_view_all_preferences"
  ON public.notification_preferences
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- 5. TRIGGER PARA UPDATED_AT
-- =====================================================

CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 6. FUNÇÃO PARA CRIAR PREFERÊNCIAS PADRÃO
-- =====================================================

CREATE OR REPLACE FUNCTION public.create_default_notification_preferences(p_user_id UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO public.notification_preferences (user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.create_default_notification_preferences IS 'Cria preferências padrão para um usuário';

-- =====================================================
-- 7. TRIGGER PARA CRIAR PREFERÊNCIAS AO CRIAR PERFIL
-- =====================================================

CREATE OR REPLACE FUNCTION public.auto_create_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM public.create_default_notification_preferences(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_auto_create_notification_preferences
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_create_notification_preferences();

COMMENT ON TRIGGER trigger_auto_create_notification_preferences ON public.profiles 
IS 'Cria preferências de notificação padrão ao criar novo usuário';

-- =====================================================
-- 8. FUNÇÃO PARA VERIFICAR SE DEVE NOTIFICAR
-- =====================================================

CREATE OR REPLACE FUNCTION public.should_send_notification(
  p_user_id UUID,
  p_notification_type TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_prefs RECORD;
  v_should_send BOOLEAN := true;
  v_current_time TIME;
BEGIN
  -- Buscar preferências do usuário
  SELECT * INTO v_prefs
  FROM public.notification_preferences
  WHERE user_id = p_user_id;
  
  -- Se não tem preferências, criar padrão e permitir
  IF v_prefs IS NULL THEN
    PERFORM public.create_default_notification_preferences(p_user_id);
    RETURN true;
  END IF;
  
  -- Verificar se tipo de notificação está habilitado
  v_should_send := CASE p_notification_type
    WHEN 'favorite_added' THEN v_prefs.favorite_added_enabled
    WHEN 'message_received' THEN v_prefs.message_received_enabled
    WHEN 'animal_view' THEN v_prefs.animal_view_enabled
    WHEN 'animal_click' THEN v_prefs.animal_click_enabled
    WHEN 'boost_expiring' THEN v_prefs.boost_expiring_enabled
    WHEN 'ad_expiring' THEN v_prefs.ad_expiring_enabled
    WHEN 'partnership_invite' THEN v_prefs.partnership_invite_enabled
    WHEN 'partnership_accepted' THEN v_prefs.partnership_accepted_enabled
    ELSE true
  END;
  
  -- Se já negado, retornar
  IF NOT v_should_send THEN
    RETURN false;
  END IF;
  
  -- Verificar horário silencioso
  IF v_prefs.quiet_hours_enabled THEN
    v_current_time := CURRENT_TIME;
    
    -- Verificar se está no horário silencioso
    IF v_prefs.quiet_hours_start < v_prefs.quiet_hours_end THEN
      -- Horário normal (ex: 22:00 - 08:00 no dia seguinte)
      IF v_current_time >= v_prefs.quiet_hours_start 
         OR v_current_time < v_prefs.quiet_hours_end THEN
        RETURN false;
      END IF;
    ELSE
      -- Horário que cruza meia-noite (ex: 22:00 - 02:00)
      IF v_current_time >= v_prefs.quiet_hours_start 
         AND v_current_time < v_prefs.quiet_hours_end THEN
        RETURN false;
      END IF;
    END IF;
  END IF;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.should_send_notification IS 'Verifica se deve enviar notificação baseado nas preferências do usuário';

-- =====================================================
-- 9. ATUALIZAR TRIGGERS PARA RESPEITAR PREFERÊNCIAS
-- =====================================================

-- Atualizar trigger de favoritos
CREATE OR REPLACE FUNCTION public.notify_on_favorite()
RETURNS TRIGGER AS $$
DECLARE
  v_animal_name TEXT;
  v_owner_id UUID;
  v_should_notify BOOLEAN;
BEGIN
  -- Buscar informações do animal
  SELECT name, owner_id INTO v_animal_name, v_owner_id
  FROM public.animals
  WHERE id = NEW.animal_id;
  
  -- Não notificar se o usuário favoritou seu próprio anúncio
  IF v_owner_id = NEW.user_id THEN
    RETURN NEW;
  END IF;
  
  -- Verificar preferências
  v_should_notify := public.should_send_notification(v_owner_id, 'favorite_added');
  
  IF v_should_notify THEN
    -- Criar notificação para o dono do animal
    PERFORM public.create_notification(
      p_user_id := v_owner_id,
      p_type := 'favorite_added',
      p_title := 'Novo Favorito!',
      p_message := 'Seu anúncio "' || v_animal_name || '" foi favoritado por alguém.',
      p_action_url := '/animals/' || NEW.animal_id,
      p_metadata := jsonb_build_object(
        'animal_id', NEW.animal_id,
        'animal_name', v_animal_name
      ),
      p_related_content_type := 'animal',
      p_related_content_id := NEW.animal_id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 10. VIEW: RESUMO DE PREFERÊNCIAS
-- =====================================================

CREATE OR REPLACE VIEW public.notification_preferences_summary AS
SELECT 
  COUNT(*) as total_users,
  COUNT(*) FILTER (WHERE favorite_added_enabled) as favorite_enabled_count,
  COUNT(*) FILTER (WHERE message_received_enabled) as message_enabled_count,
  COUNT(*) FILTER (WHERE animal_view_enabled) as view_enabled_count,
  COUNT(*) FILTER (WHERE digest_mode) as digest_mode_count,
  COUNT(*) FILTER (WHERE quiet_hours_enabled) as quiet_hours_count,
  COUNT(*) FILTER (WHERE email_enabled) as email_enabled_count,
  COUNT(*) FILTER (WHERE push_enabled) as push_enabled_count,
  ROUND(AVG(CASE WHEN favorite_added_enabled THEN 1 ELSE 0 END) * 100, 2) as favorite_enabled_pct,
  ROUND(AVG(CASE WHEN message_received_enabled THEN 1 ELSE 0 END) * 100, 2) as message_enabled_pct,
  ROUND(AVG(CASE WHEN digest_mode THEN 1 ELSE 0 END) * 100, 2) as digest_mode_pct
FROM public.notification_preferences;

COMMENT ON VIEW public.notification_preferences_summary IS 'Resumo agregado de preferências de notificação - útil para analytics';

-- =====================================================
-- 11. POPULAR PREFERÊNCIAS PARA USUÁRIOS EXISTENTES
-- =====================================================

-- Criar preferências padrão para todos os usuários que ainda não têm
INSERT INTO public.notification_preferences (user_id)
SELECT id FROM public.profiles
WHERE id NOT IN (SELECT user_id FROM public.notification_preferences)
ON CONFLICT (user_id) DO NOTHING;

-- =====================================================
-- FIM DA MIGRAÇÃO 044
-- =====================================================

