-- =====================================================
-- Migration 075: Admin Protected Functions (SECURITY HARDENING)
-- Data: 25/11/2025
-- Descrição: Adiciona funções administrativas protegidas com validação
--            de role no backend (proteção contra bypass de frontend)
-- Compatibilidade: 100% - Não quebra código existente, apenas adiciona
-- =====================================================

-- =====================================================
-- 1. FUNÇÃO: Verificar se usuário é admin (helper)
-- =====================================================
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$;

COMMENT ON FUNCTION is_admin IS 
'Verifica se o usuário atual é admin - Função helper para outras functions';

GRANT EXECUTE ON FUNCTION is_admin TO authenticated;

-- =====================================================
-- 2. FUNÇÃO PROTEGIDA: Suspender Usuário
-- =====================================================
CREATE OR REPLACE FUNCTION admin_suspend_user(
  target_user_id UUID,
  suspension_reason TEXT,
  suspension_email TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_admin_id UUID;
  v_suspension_id UUID;
  v_user_email TEXT;
BEGIN
  -- 🔒 VALIDAÇÃO: Apenas admins podem suspender
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Admin role required'
      USING HINT = 'Only administrators can suspend users';
  END IF;

  v_admin_id := auth.uid();

  -- Obter email do usuário se não fornecido
  IF suspension_email IS NULL THEN
    SELECT email INTO v_user_email
    FROM profiles
    WHERE id = target_user_id;
    
    suspension_email := v_user_email;
  END IF;

  -- Criar suspensão
  INSERT INTO suspensions (
    user_id,
    email,
    reason,
    is_active,
    suspended_by,
    suspended_at
  ) VALUES (
    target_user_id,
    suspension_email,
    suspension_reason,
    true,
    v_admin_id,
    NOW()
  ) RETURNING id INTO v_suspension_id;

  -- Atualizar profile
  UPDATE profiles
  SET is_suspended = true
  WHERE id = target_user_id;

  -- Log de auditoria
  PERFORM log_admin_action(
    'SUSPEND_USER',
    'user',
    target_user_id,
    NULL,
    jsonb_build_object(
      'reason', suspension_reason,
      'email', suspension_email,
      'suspension_id', v_suspension_id
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'suspension_id', v_suspension_id,
    'user_id', target_user_id,
    'message', 'Usuário suspenso com sucesso'
  );
END;
$$;

COMMENT ON FUNCTION admin_suspend_user IS 
'[PROTEGIDO] Suspende um usuário - Requer role admin validado no backend';

GRANT EXECUTE ON FUNCTION admin_suspend_user TO authenticated;

-- =====================================================
-- 3. FUNÇÃO PROTEGIDA: Reativar Usuário
-- =====================================================
CREATE OR REPLACE FUNCTION admin_unsuspend_user(
  target_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_admin_id UUID;
BEGIN
  -- 🔒 VALIDAÇÃO: Apenas admins podem reativar
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Admin role required'
      USING HINT = 'Only administrators can unsuspend users';
  END IF;

  v_admin_id := auth.uid();

  -- Desativar suspensões ativas
  UPDATE suspensions
  SET 
    is_active = false,
    unsuspended_at = NOW(),
    unsuspended_by = v_admin_id
  WHERE user_id = target_user_id AND is_active = true;

  -- Atualizar profile
  UPDATE profiles
  SET is_suspended = false
  WHERE id = target_user_id;

  -- Log de auditoria
  PERFORM log_admin_action(
    'UNSUSPEND_USER',
    'user',
    target_user_id,
    NULL,
    jsonb_build_object(
      'admin_id', v_admin_id
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'user_id', target_user_id,
    'message', 'Usuário reativado com sucesso'
  );
END;
$$;

COMMENT ON FUNCTION admin_unsuspend_user IS 
'[PROTEGIDO] Reativa um usuário suspenso - Requer role admin';

GRANT EXECUTE ON FUNCTION admin_unsuspend_user TO authenticated;

-- =====================================================
-- 4. FUNÇÃO PROTEGIDA: Atualizar Plano de Usuário
-- =====================================================
CREATE OR REPLACE FUNCTION admin_update_user_plan(
  target_user_id UUID,
  new_plan TEXT,
  duration_days INT DEFAULT 30,
  is_annual BOOLEAN DEFAULT false
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_admin_id UUID;
  v_old_plan TEXT;
  v_new_expires_at TIMESTAMPTZ;
BEGIN
  -- 🔒 VALIDAÇÃO: Apenas admins
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Admin role required';
  END IF;

  -- Validar plano
  IF new_plan NOT IN ('free', 'basic', 'vip', 'pro', 'ultra') THEN
    RAISE EXCEPTION 'Invalid plan: %', new_plan
      USING HINT = 'Valid plans: free, basic, vip, pro, ultra';
  END IF;

  v_admin_id := auth.uid();

  -- Obter plano atual
  SELECT plan INTO v_old_plan
  FROM profiles
  WHERE id = target_user_id;

  -- Calcular nova data de expiração
  v_new_expires_at := NOW() + (duration_days || ' days')::INTERVAL;

  -- Atualizar plano
  UPDATE profiles
  SET 
    plan = new_plan,
    plan_expires_at = v_new_expires_at,
    plan_purchased_at = NOW(),
    is_annual_plan = is_annual,
    updated_at = NOW()
  WHERE id = target_user_id;

  -- Log de auditoria
  PERFORM log_admin_action(
    'UPDATE_PLAN',
    'user_plan',
    target_user_id,
    jsonb_build_object('old_plan', v_old_plan),
    jsonb_build_object(
      'new_plan', new_plan,
      'expires_at', v_new_expires_at,
      'duration_days', duration_days,
      'is_annual', is_annual
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'user_id', target_user_id,
    'old_plan', v_old_plan,
    'new_plan', new_plan,
    'expires_at', v_new_expires_at,
    'message', 'Plano atualizado com sucesso'
  );
END;
$$;

COMMENT ON FUNCTION admin_update_user_plan IS 
'[PROTEGIDO] Atualiza plano de assinatura de um usuário - Requer role admin';

GRANT EXECUTE ON FUNCTION admin_update_user_plan TO authenticated;

-- =====================================================
-- 5. FUNÇÃO PROTEGIDA: Aprovar Evento
-- =====================================================
CREATE OR REPLACE FUNCTION admin_approve_event(
  event_id UUID,
  approval_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_admin_id UUID;
  v_organizer_id UUID;
BEGIN
  -- 🔒 VALIDAÇÃO: Apenas admins
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Admin role required';
  END IF;

  v_admin_id := auth.uid();

  -- Obter organizador
  SELECT organizer_id INTO v_organizer_id
  FROM events
  WHERE id = event_id;

  IF v_organizer_id IS NULL THEN
    RAISE EXCEPTION 'Event not found: %', event_id;
  END IF;

  -- Aprovar evento
  UPDATE events
  SET 
    ad_status = 'active',
    updated_at = NOW()
  WHERE id = event_id;

  -- Log de auditoria
  PERFORM log_admin_action(
    'APPROVE_EVENT',
    'event',
    event_id,
    NULL,
    jsonb_build_object(
      'organizer_id', v_organizer_id,
      'notes', approval_notes
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'event_id', event_id,
    'message', 'Evento aprovado com sucesso'
  );
END;
$$;

COMMENT ON FUNCTION admin_approve_event IS 
'[PROTEGIDO] Aprova um evento - Requer role admin';

GRANT EXECUTE ON FUNCTION admin_approve_event TO authenticated;

-- =====================================================
-- 6. FUNÇÃO PROTEGIDA: Deletar Animal (Soft Delete)
-- =====================================================
CREATE OR REPLACE FUNCTION admin_delete_animal(
  animal_id UUID,
  deletion_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_admin_id UUID;
  v_owner_id UUID;
  v_animal_name TEXT;
BEGIN
  -- 🔒 VALIDAÇÃO: Apenas admins
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Admin role required';
  END IF;

  v_admin_id := auth.uid();

  -- Obter dados do animal
  SELECT owner_id, name INTO v_owner_id, v_animal_name
  FROM animals
  WHERE id = animal_id;

  IF v_owner_id IS NULL THEN
    RAISE EXCEPTION 'Animal not found: %', animal_id;
  END IF;

  -- Soft delete - marcar como inativo
  UPDATE animals
  SET 
    ad_status = 'inactive',
    updated_at = NOW()
  WHERE id = animal_id;

  -- Log de auditoria
  PERFORM log_admin_action(
    'DELETE_ANIMAL',
    'animal',
    animal_id,
    jsonb_build_object('name', v_animal_name, 'owner_id', v_owner_id),
    jsonb_build_object('reason', deletion_reason)
  );

  RETURN jsonb_build_object(
    'success', true,
    'animal_id', animal_id,
    'message', 'Animal removido com sucesso'
  );
END;
$$;

COMMENT ON FUNCTION admin_delete_animal IS 
'[PROTEGIDO] Remove um animal (soft delete) - Requer role admin';

GRANT EXECUTE ON FUNCTION admin_delete_animal TO authenticated;

-- =====================================================
-- 7. VIEW: Estatísticas Admin com Validação
-- =====================================================
CREATE OR REPLACE VIEW admin_dashboard_stats_secure AS
SELECT
  (SELECT COUNT(*) FROM profiles) as total_users,
  (SELECT COUNT(*) FROM profiles WHERE is_suspended = true) as suspended_users,
  (SELECT COUNT(*) FROM profiles WHERE plan != 'free') as paid_users,
  (SELECT COUNT(*) FROM animals WHERE ad_status = 'active') as active_animals,
  (SELECT COUNT(*) FROM events WHERE ad_status = 'active') as active_events,
  (SELECT COUNT(*) FROM suspensions WHERE is_active = true) as active_suspensions,
  (SELECT COUNT(*) FROM admin_audit_log WHERE created_at > NOW() - INTERVAL '24 hours') as admin_actions_24h
WHERE is_admin(); -- 🔒 Apenas admin pode ver

COMMENT ON VIEW admin_dashboard_stats_secure IS 
'[PROTEGIDO] Estatísticas do dashboard admin - Requer role admin';

GRANT SELECT ON admin_dashboard_stats_secure TO authenticated;

-- =====================================================
-- 8. FUNÇÃO: Validar Acesso Admin (Helper Frontend)
-- =====================================================
CREATE OR REPLACE FUNCTION validate_admin_access()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID;
  v_user_role TEXT;
  v_user_email TEXT;
  v_is_admin BOOLEAN;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'is_admin', false,
      'authenticated', false,
      'message', 'User not authenticated'
    );
  END IF;

  SELECT role, email INTO v_user_role, v_user_email
  FROM profiles
  WHERE id = v_user_id;

  v_is_admin := (v_user_role = 'admin');

  -- Log tentativa de acesso admin
  IF v_is_admin THEN
    INSERT INTO admin_audit_log (
      admin_id,
      action,
      resource_type,
      details
    ) VALUES (
      v_user_id,
      'VALIDATE_ACCESS',
      'admin_panel',
      jsonb_build_object('timestamp', NOW())
    );
  END IF;

  RETURN jsonb_build_object(
    'is_admin', v_is_admin,
    'authenticated', true,
    'user_id', v_user_id,
    'user_email', v_user_email,
    'message', CASE 
      WHEN v_is_admin THEN 'Admin access granted'
      ELSE 'Access denied: Admin role required'
    END
  );
END;
$$;

COMMENT ON FUNCTION validate_admin_access IS 
'Valida se usuário tem acesso admin - Registra tentativas de acesso';

GRANT EXECUTE ON FUNCTION validate_admin_access TO authenticated;

-- =====================================================
-- 9. ÍNDICES ADICIONAIS PARA PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_profiles_role_suspended 
ON profiles(role, is_suspended) 
WHERE role = 'admin' OR is_suspended = true;

CREATE INDEX IF NOT EXISTS idx_admin_audit_log_admin_action 
ON admin_audit_log(admin_id, action, created_at DESC);

-- =====================================================
-- ✅ MIGRATION COMPLETA
-- =====================================================
-- Todas as funções administrativas agora têm:
-- ✅ Validação de role no backend
-- ✅ Logs de auditoria automáticos
-- ✅ Proteção contra bypass de frontend
-- ✅ Mensagens de erro seguras
-- ✅ SECURITY DEFINER com search_path seguro



