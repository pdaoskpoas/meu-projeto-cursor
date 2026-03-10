-- =====================================================
-- MIGRAÇÃO 046 - PARTE 4: TRIGGERS
-- Data: 04/11/2025
-- =====================================================

-- Trigger: Notificar quando sociedade é aceita
CREATE OR REPLACE FUNCTION public.notify_on_partnership_accepted()
RETURNS TRIGGER AS $$
DECLARE
  v_animal_name TEXT;
  v_partner_name TEXT;
  v_owner_id UUID;
BEGIN
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    
    SELECT name, owner_id INTO v_animal_name, v_owner_id
    FROM public.animals
    WHERE id = NEW.animal_id;
    
    SELECT name INTO v_partner_name
    FROM public.profiles
    WHERE id = NEW.partner_id;
    
    PERFORM public.create_notification(
      p_user_id := v_owner_id,
      p_type := 'partnership_accepted',
      p_title := 'Sociedade Aceita',
      p_message := v_partner_name || ' aceitou o convite de sociedade para o animal "' || v_animal_name || '".',
      p_action_url := '/dashboard/society',
      p_metadata := jsonb_build_object(
        'animal_id', NEW.animal_id,
        'animal_name', v_animal_name,
        'partnership_id', NEW.id,
        'partner_id', NEW.partner_id,
        'partner_name', v_partner_name,
        'percentage', NEW.percentage
      ),
      p_related_content_type := 'partnership',
      p_related_content_id := NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_on_partnership_accepted ON public.animal_partnerships;

CREATE TRIGGER trigger_notify_on_partnership_accepted
  AFTER UPDATE ON public.animal_partnerships
  FOR EACH ROW
  WHEN (NEW.status = 'accepted' AND OLD.status = 'pending')
  EXECUTE FUNCTION public.notify_on_partnership_accepted();

COMMENT ON TRIGGER trigger_notify_on_partnership_accepted ON public.animal_partnerships IS 'Notifica o dono quando sociedade é aceita';

