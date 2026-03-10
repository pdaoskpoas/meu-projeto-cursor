-- =====================================================
-- MIGRAÇÃO 042: SISTEMA DE NOTIFICAÇÕES
-- Data: 04/11/2025
-- Descrição: Sistema completo de notificações em tempo real
-- Objetivo: Informar usuários sobre favoritos, mensagens e visitas
-- =====================================================

-- =====================================================
-- 1. CRIAR TABELA DE NOTIFICAÇÕES
-- =====================================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Usuário que receberá a notificação
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Tipo de notificação
  type TEXT NOT NULL CHECK (type IN (
    'favorite_added',      -- Alguém favoritou seu anúncio
    'message_received',    -- Nova mensagem recebida
    'animal_view',         -- Visualização no anúncio
    'animal_click',        -- Clique no anúncio
    'boost_expiring',      -- Boost próximo de expirar
    'ad_expiring',         -- Anúncio próximo de expirar
    'partnership_invite',  -- Convite de sociedade
    'partnership_accepted' -- Sociedade aceita
  )),
  
  -- Título e mensagem
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  
  -- Link/ação relacionada
  action_url TEXT,
  
  -- Dados adicionais (JSON flexível)
  metadata JSONB DEFAULT '{}',
  
  -- ID do conteúdo relacionado (animal, evento, mensagem, etc)
  related_content_type TEXT CHECK (related_content_type IN ('animal', 'event', 'message', 'conversation', 'partnership')),
  related_content_id UUID,
  
  -- Status
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days') -- Notificações expiram em 30 dias
);

-- =====================================================
-- 2. ÍNDICES PARA PERFORMANCE
-- =====================================================

CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_user_unread ON public.notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX idx_notifications_type ON public.notifications(type);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX idx_notifications_related_content ON public.notifications(related_content_type, related_content_id);

-- =====================================================
-- 3. COMENTÁRIOS
-- =====================================================

COMMENT ON TABLE public.notifications IS 'Sistema de notificações em tempo real para usuários';
COMMENT ON COLUMN public.notifications.type IS 'Tipo: favorite_added, message_received, animal_view, animal_click, boost_expiring, ad_expiring, partnership_invite, partnership_accepted';
COMMENT ON COLUMN public.notifications.metadata IS 'Dados adicionais em JSON (ex: nome do animal, quantidade de visualizações, etc)';
COMMENT ON COLUMN public.notifications.expires_at IS 'Notificações antigas são automaticamente removidas após 30 dias';

-- =====================================================
-- 4. RLS POLICIES
-- =====================================================

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Usuários podem ver apenas suas próprias notificações
CREATE POLICY "users_can_view_own_notifications"
  ON public.notifications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Usuários podem atualizar apenas suas próprias notificações (marcar como lida)
CREATE POLICY "users_can_update_own_notifications"
  ON public.notifications
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Usuários podem deletar apenas suas próprias notificações
CREATE POLICY "users_can_delete_own_notifications"
  ON public.notifications
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Sistema pode criar notificações (via triggers)
CREATE POLICY "system_can_create_notifications"
  ON public.notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: Admins podem ver todas as notificações
CREATE POLICY "admins_can_view_all_notifications"
  ON public.notifications
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- 5. FUNÇÃO PARA CRIAR NOTIFICAÇÕES
-- =====================================================

CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_action_url TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}',
  p_related_content_type TEXT DEFAULT NULL,
  p_related_content_id UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  -- Criar a notificação
  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    message,
    action_url,
    metadata,
    related_content_type,
    related_content_id
  ) VALUES (
    p_user_id,
    p_type,
    p_title,
    p_message,
    p_action_url,
    p_metadata,
    p_related_content_type,
    p_related_content_id
  ) RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.create_notification IS 'Função auxiliar para criar notificações de forma segura';

-- =====================================================
-- 6. TRIGGER: NOTIFICAR QUANDO ALGUÉM FAVORITAR
-- =====================================================

CREATE OR REPLACE FUNCTION public.notify_on_favorite()
RETURNS TRIGGER AS $$
DECLARE
  v_animal_name TEXT;
  v_owner_id UUID;
BEGIN
  -- Buscar informações do animal
  SELECT name, owner_id INTO v_animal_name, v_owner_id
  FROM public.animals
  WHERE id = NEW.animal_id;
  
  -- Não notificar se o usuário favoritou seu próprio anúncio
  IF v_owner_id = NEW.user_id THEN
    RETURN NEW;
  END IF;
  
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
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_notify_on_favorite
  AFTER INSERT ON public.favorites
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_favorite();

COMMENT ON TRIGGER trigger_notify_on_favorite ON public.favorites IS 'Notifica o dono do animal quando alguém favoritar';

-- =====================================================
-- 7. TRIGGER: NOTIFICAR QUANDO RECEBER MENSAGEM
-- =====================================================

CREATE OR REPLACE FUNCTION public.notify_on_message()
RETURNS TRIGGER AS $$
DECLARE
  v_receiver_id UUID;
  v_conversation_rec RECORD;
  v_sender_name TEXT;
  v_animal_name TEXT;
BEGIN
  -- Buscar informações da conversa
  SELECT c.*, a.name as animal_name
  INTO v_conversation_rec
  FROM public.conversations c
  LEFT JOIN public.animals a ON a.id = c.animal_id
  WHERE c.id = NEW.conversation_id;
  
  -- Buscar nome do remetente
  SELECT name INTO v_sender_name
  FROM public.profiles
  WHERE id = NEW.sender_id;
  
  -- Determinar quem é o receptor (quem NÃO enviou a mensagem)
  IF NEW.sender_id = v_conversation_rec.animal_owner_id THEN
    v_receiver_id := v_conversation_rec.interested_user_id;
  ELSE
    v_receiver_id := v_conversation_rec.animal_owner_id;
  END IF;
  
  -- Criar notificação para o receptor
  PERFORM public.create_notification(
    p_user_id := v_receiver_id,
    p_type := 'message_received',
    p_title := 'Nova Mensagem',
    p_message := v_sender_name || ' enviou uma mensagem sobre "' || v_conversation_rec.animal_name || '".',
    p_action_url := '/dashboard/messages',
    p_metadata := jsonb_build_object(
      'conversation_id', NEW.conversation_id,
      'sender_id', NEW.sender_id,
      'sender_name', v_sender_name,
      'animal_id', v_conversation_rec.animal_id,
      'animal_name', v_conversation_rec.animal_name
    ),
    p_related_content_type := 'message',
    p_related_content_id := NEW.id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_notify_on_message
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_message();

COMMENT ON TRIGGER trigger_notify_on_message ON public.messages IS 'Notifica o receptor quando receber nova mensagem';

-- =====================================================
-- 8. TRIGGER: NOTIFICAR SOBRE CLIQUES/VISUALIZAÇÕES
-- =====================================================

-- Função para agrupar visualizações e notificar periodicamente
CREATE OR REPLACE FUNCTION public.notify_on_animal_engagement()
RETURNS TRIGGER AS $$
DECLARE
  v_animal_name TEXT;
  v_owner_id UUID;
  v_recent_impressions INTEGER;
  v_recent_clicks INTEGER;
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
  
  -- Contar impressões recentes (últimas 24h)
  SELECT COUNT(*) INTO v_recent_impressions
  FROM public.impressions
  WHERE content_id = NEW.content_id
  AND content_type = 'animal'
  AND created_at > NOW() - INTERVAL '24 hours';
  
  -- Contar cliques recentes (últimas 24h)
  SELECT COUNT(*) INTO v_recent_clicks
  FROM public.clicks
  WHERE content_id = NEW.content_id
  AND content_type = 'animal'
  AND created_at > NOW() - INTERVAL '24 hours';
  
  -- Notificar a cada 10 visualizações
  IF v_recent_impressions % 10 = 0 THEN
    PERFORM public.create_notification(
      p_user_id := v_owner_id,
      p_type := 'animal_view',
      p_title := 'Seu anúncio está sendo visto!',
      p_message := 'Seu anúncio "' || v_animal_name || '" atingiu ' || v_recent_impressions || ' visualizações nas últimas 24h.',
      p_action_url := '/animals/' || NEW.content_id,
      p_metadata := jsonb_build_object(
        'animal_id', NEW.content_id,
        'animal_name', v_animal_name,
        'impressions_count', v_recent_impressions,
        'clicks_count', v_recent_clicks
      ),
      p_related_content_type := 'animal',
      p_related_content_id := NEW.content_id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_notify_on_impression
  AFTER INSERT ON public.impressions
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_animal_engagement();

COMMENT ON TRIGGER trigger_notify_on_impression ON public.impressions IS 'Notifica sobre visualizações a cada 10 impressões';

-- =====================================================
-- 9. TRIGGER: NOTIFICAR SOBRE CONVITE DE SOCIEDADE
-- =====================================================

CREATE OR REPLACE FUNCTION public.notify_on_partnership_invite()
RETURNS TRIGGER AS $$
DECLARE
  v_animal_name TEXT;
  v_inviter_name TEXT;
BEGIN
  -- Buscar informações do animal
  SELECT name INTO v_animal_name
  FROM public.animals
  WHERE id = NEW.animal_id;
  
  -- Buscar nome de quem convidou (dono do animal)
  SELECT p.name INTO v_inviter_name
  FROM public.animals a
  JOIN public.profiles p ON p.id = a.owner_id
  WHERE a.id = NEW.animal_id;
  
  -- Criar notificação para o parceiro convidado
  IF NEW.status = 'pending' THEN
    PERFORM public.create_notification(
      p_user_id := NEW.partner_id,
      p_type := 'partnership_invite',
      p_title := 'Convite de Sociedade',
      p_message := v_inviter_name || ' convidou você para ser sócio do animal "' || v_animal_name || '".',
      p_action_url := '/dashboard/partnerships',
      p_metadata := jsonb_build_object(
        'animal_id', NEW.animal_id,
        'animal_name', v_animal_name,
        'partnership_id', NEW.id,
        'percentage', NEW.percentage
      ),
      p_related_content_type := 'partnership',
      p_related_content_id := NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_notify_on_partnership_invite
  AFTER INSERT ON public.animal_partnerships
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_partnership_invite();

COMMENT ON TRIGGER trigger_notify_on_partnership_invite ON public.animal_partnerships IS 'Notifica sobre convites de sociedade';

-- =====================================================
-- 10. FUNÇÃO PARA LIMPAR NOTIFICAÇÕES ANTIGAS
-- =====================================================

CREATE OR REPLACE FUNCTION public.cleanup_old_notifications()
RETURNS void AS $$
BEGIN
  -- Deletar notificações expiradas (mais de 30 dias)
  DELETE FROM public.notifications
  WHERE expires_at < NOW();
  
  -- Deletar notificações lidas com mais de 7 dias
  DELETE FROM public.notifications
  WHERE is_read = true
  AND read_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.cleanup_old_notifications IS 'Remove notificações antigas automaticamente';

-- =====================================================
-- 11. VIEW: ESTATÍSTICAS DE NOTIFICAÇÕES POR USUÁRIO
-- =====================================================

CREATE OR REPLACE VIEW public.user_notification_stats AS
SELECT 
  user_id,
  COUNT(*) as total_notifications,
  COUNT(*) FILTER (WHERE is_read = false) as unread_count,
  COUNT(*) FILTER (WHERE type = 'favorite_added') as favorites_count,
  COUNT(*) FILTER (WHERE type = 'message_received') as messages_count,
  COUNT(*) FILTER (WHERE type = 'animal_view') as views_count,
  MAX(created_at) as last_notification_at
FROM public.notifications
WHERE expires_at > NOW()
GROUP BY user_id;

COMMENT ON VIEW public.user_notification_stats IS 'Estatísticas de notificações por usuário';

-- =====================================================
-- FIM DA MIGRAÇÃO 042
-- =====================================================

