-- =====================================================
-- MIGRAÇÃO 016: ÍNDICES E RLS EM SYSTEM_LOGS
-- Data: 02/10/2025
-- Descrição: Adiciona índices faltantes e habilita RLS em system_logs
-- =====================================================

-- Índices de performance faltantes
CREATE INDEX IF NOT EXISTS idx_animals_boosted_by ON animals(boosted_by);
CREATE INDEX IF NOT EXISTS idx_events_boosted_by ON events(boosted_by);
CREATE INDEX IF NOT EXISTS idx_suspensions_suspended_by ON suspensions(suspended_by);
CREATE INDEX IF NOT EXISTS idx_suspensions_user_id ON suspensions(user_id);

-- Endurecer segurança em system_logs (apenas funções/servicerole devem manipular)
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

-- Remover quaisquer permissões para clientes
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON TABLE public.system_logs FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON TABLE public.system_logs FROM authenticated;
  END IF;
END $$;

COMMENT ON INDEX idx_animals_boosted_by IS 'Acelera filtros por boosted_by em animals';
COMMENT ON INDEX idx_events_boosted_by IS 'Acelera filtros por boosted_by em events';
COMMENT ON INDEX idx_suspensions_suspended_by IS 'Acelera filtros por suspended_by em suspensions';
COMMENT ON INDEX idx_suspensions_user_id IS 'Acelera filtros por user_id em suspensions';
COMMENT ON TABLE public.system_logs IS 'Logs internos do sistema; acesso restrito via RLS/service role';


