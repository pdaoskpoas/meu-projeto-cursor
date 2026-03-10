-- 🔒 Sistema de Rate Limiting para proteger contra abuso
-- Baseado em security-report.md - CRÍTICA #6
-- Data: 2 de outubro de 2025

-- Tabela para rastrear tentativas de operações por usuário/IP
CREATE TABLE IF NOT EXISTS public.rate_limit_tracker (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_identifier text NOT NULL, -- user_id (authenticated) ou IP address (anonymous)
  operation_type text NOT NULL, -- 'login', 'register', 'upload', 'api_call', etc
  attempt_count integer DEFAULT 1,
  window_start timestamptz DEFAULT now(),
  blocked_until timestamptz, -- NULL se não bloqueado, timestamp se bloqueado
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_rate_limit_identifier_operation 
ON public.rate_limit_tracker(user_identifier, operation_type);

CREATE INDEX IF NOT EXISTS idx_rate_limit_window_start 
ON public.rate_limit_tracker(window_start);

CREATE INDEX IF NOT EXISTS idx_rate_limit_blocked_until 
ON public.rate_limit_tracker(blocked_until) 
WHERE blocked_until IS NOT NULL;

-- Comentários
COMMENT ON TABLE public.rate_limit_tracker IS 
'Sistema de rate limiting para prevenir abuso de recursos e ataques DDoS';

COMMENT ON COLUMN public.rate_limit_tracker.user_identifier IS 
'User ID (auth.uid()) se autenticado, ou IP address se anônimo';

COMMENT ON COLUMN public.rate_limit_tracker.operation_type IS 
'Tipo de operação: login, register, upload, api_call, etc';

-- Function para verificar rate limit
CREATE OR REPLACE FUNCTION check_rate_limit(
  identifier text,
  operation text,
  max_attempts integer,
  window_minutes integer
) RETURNS jsonb AS $$
DECLARE
  recent_attempts integer;
  is_blocked boolean;
  existing_record RECORD;
BEGIN
  -- Verificar se está bloqueado
  SELECT * INTO existing_record
  FROM rate_limit_tracker
  WHERE user_identifier = identifier
    AND operation_type = operation
    AND blocked_until > now()
  ORDER BY blocked_until DESC
  LIMIT 1;

  IF FOUND THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'blocked',
      'blocked_until', existing_record.blocked_until,
      'message', 'Muitas tentativas. Tente novamente mais tarde.'
    );
  END IF;

  -- Contar tentativas recentes
  SELECT COUNT(*) INTO recent_attempts
  FROM rate_limit_tracker
  WHERE user_identifier = identifier
    AND operation_type = operation
    AND window_start > now() - (window_minutes || ' minutes')::interval;

  -- Se excedeu limite, bloquear
  IF recent_attempts >= max_attempts THEN
    -- Inserir registro de bloqueio
    INSERT INTO rate_limit_tracker (
      user_identifier,
      operation_type,
      attempt_count,
      blocked_until
    ) VALUES (
      identifier,
      operation,
      recent_attempts,
      now() + (window_minutes * 2 || ' minutes')::interval -- Bloquear por 2x a window
    );

    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'rate_limit_exceeded',
      'attempts', recent_attempts,
      'max_attempts', max_attempts,
      'message', format('Muitas tentativas (%s/%s). Aguarde %s minutos.', 
                       recent_attempts, max_attempts, window_minutes * 2)
    );
  END IF;

  -- Permitido - registrar tentativa
  INSERT INTO rate_limit_tracker (
    user_identifier,
    operation_type,
    attempt_count,
    window_start
  ) VALUES (
    identifier,
    operation,
    1,
    now()
  );

  RETURN jsonb_build_object(
    'allowed', true,
    'attempts', recent_attempts + 1,
    'max_attempts', max_attempts,
    'message', 'Operação permitida'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

COMMENT ON FUNCTION check_rate_limit IS 
'Verifica se operação está dentro do rate limit. Retorna JSON com status.';

-- Function para limpar registros antigos (rodar via cron)
CREATE OR REPLACE FUNCTION cleanup_rate_limit_tracker() 
RETURNS void AS $$
BEGIN
  -- Deletar registros com mais de 7 dias
  DELETE FROM rate_limit_tracker
  WHERE window_start < now() - interval '7 days';
  
  -- Deletar bloqueios expirados
  DELETE FROM rate_limit_tracker
  WHERE blocked_until IS NOT NULL 
    AND blocked_until < now() - interval '1 day';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

COMMENT ON FUNCTION cleanup_rate_limit_tracker IS 
'Limpa registros antigos de rate limiting (rodar diariamente via pg_cron)';

-- RLS Policies
ALTER TABLE public.rate_limit_tracker ENABLE ROW LEVEL SECURITY;

-- Apenas system/admins podem visualizar
CREATE POLICY "Admins can view rate limit data"
ON public.rate_limit_tracker FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- System pode inserir (via function)
CREATE POLICY "System can insert rate limit records"
ON public.rate_limit_tracker FOR INSERT
WITH CHECK (true); -- Controlled by SECURITY DEFINER function

-- Grants
GRANT SELECT, INSERT ON public.rate_limit_tracker TO authenticated;
GRANT SELECT, INSERT ON public.rate_limit_tracker TO anon;





