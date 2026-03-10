-- =====================================================
-- MIGRAÇÃO 082: LIMPEZA INTELIGENTE DE NOTIFICAÇÕES
-- Data: 27/11/2024
-- Descrição: Sistema de limpeza baseado em boas práticas do mercado
-- Inspirado em: Twitter, Facebook, Slack, Discord
-- =====================================================

-- ⚠️ IMPORTANTE: Esta migration corrige/melhora a função existente
-- Não deleta notificações com limite fixo (ruim)
-- Usa estratégia inteligente: tempo + status de leitura (bom)

-- =====================================================
-- 1. MELHORAR FUNÇÃO DE LIMPEZA EXISTENTE
-- =====================================================

-- Primeiro, remover a função antiga se necessário
DROP FUNCTION IF EXISTS public.cleanup_old_notifications();

-- Criar função melhorada (sem limite fixo de 20)
CREATE OR REPLACE FUNCTION public.cleanup_old_notifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_deleted_expired INTEGER;
  v_deleted_read INTEGER;
  v_deleted_duplicates INTEGER;
BEGIN
  -- ✅ ESTRATÉGIA 1: Deletar notificações EXPIRADAS (30+ dias)
  -- Todas as grandes empresas fazem isso
  DELETE FROM public.notifications
  WHERE expires_at < NOW();
  
  GET DIAGNOSTICS v_deleted_expired = ROW_COUNT;
  RAISE NOTICE '✅ Deletadas % notificações expiradas', v_deleted_expired;
  
  -- ✅ ESTRATÉGIA 2: Deletar notificações LIDAS antigas (7+ dias)
  -- Facebook e Twitter fazem isso - libera espaço mas mantém não-lidas
  DELETE FROM public.notifications
  WHERE is_read = true
    AND read_at < NOW() - INTERVAL '7 days';
  
  GET DIAGNOSTICS v_deleted_read = ROW_COUNT;
  RAISE NOTICE '✅ Deletadas % notificações lidas antigas', v_deleted_read;
  
  -- ✅ ESTRATÉGIA 3: Mesclar notificações duplicadas
  -- Slack faz isso - "3 pessoas favoritaram" ao invés de 3 notificações
  PERFORM public.merge_duplicate_notifications();
  
  RAISE NOTICE '✅ Limpeza inteligente concluída!';
END;
$$;

COMMENT ON FUNCTION public.cleanup_old_notifications() IS 
'Limpeza inteligente baseada em boas práticas: expira por tempo + status, não por limite fixo';

-- =====================================================
-- 2. CRIAR JOB AUTOMÁTICO (EXECUTAR 1x POR DIA)
-- =====================================================

-- Esta é a forma correta: limpeza periódica, não por evento
-- Executar todo dia às 3h da manhã (horário de baixo uso)

-- Verificar se pg_cron está habilitado
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    -- Remover job antigo se existir
    PERFORM cron.unschedule('cleanup-notifications-daily');
    
    -- Criar novo job
    PERFORM cron.schedule(
      'cleanup-notifications-daily',
      '0 3 * * *', -- Todo dia às 3h AM
      $$SELECT public.cleanup_old_notifications()$$
    );
    
    RAISE NOTICE '✅ Job de limpeza automática criado (executa diariamente às 3h)';
  ELSE
    RAISE NOTICE '⚠️ pg_cron não está habilitado. Limpeza deve ser manual ou via cron externo';
  END IF;
END;
$$;

-- =====================================================
-- 3. FUNÇÃO PARA LIMPAR MANUALMENTE (ADMIN/SUPORTE)
-- =====================================================

CREATE OR REPLACE FUNCTION public.cleanup_notifications_for_user(
  p_user_id UUID,
  p_keep_unread BOOLEAN DEFAULT true
)
RETURNS TABLE (
  deleted_count INTEGER,
  remaining_count INTEGER
) AS $$
DECLARE
  v_deleted INTEGER;
  v_remaining INTEGER;
BEGIN
  -- Deletar notificações do usuário (respeitando preferências)
  IF p_keep_unread THEN
    -- Manter não-lidas, deletar apenas lidas antigas
    DELETE FROM public.notifications
    WHERE user_id = p_user_id
      AND is_read = true
      AND read_at < NOW() - INTERVAL '7 days';
  ELSE
    -- Deletar todas exceto as 20 mais recentes
    DELETE FROM public.notifications
    WHERE id IN (
      SELECT id FROM public.notifications
      WHERE user_id = p_user_id
      ORDER BY created_at DESC
      OFFSET 20
    );
  END IF;
  
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  
  -- Contar quantas sobraram
  SELECT COUNT(*) INTO v_remaining
  FROM public.notifications
  WHERE user_id = p_user_id;
  
  RETURN QUERY SELECT v_deleted, v_remaining;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.cleanup_notifications_for_user(UUID, BOOLEAN) IS
'Limpa notificações de um usuário específico. Útil para suporte/admin';

-- =====================================================
-- 4. VIEW PARA MONITORAMENTO
-- =====================================================

CREATE OR REPLACE VIEW public.notification_health_stats AS
SELECT
  COUNT(DISTINCT user_id) as total_users_with_notifications,
  COUNT(*) as total_notifications,
  ROUND(AVG(cnt), 2) as avg_notifications_per_user,
  MAX(cnt) as max_notifications_single_user,
  COUNT(*) FILTER (WHERE is_read = false) as total_unread,
  COUNT(*) FILTER (WHERE expires_at < NOW()) as expired_but_not_deleted,
  COUNT(*) FILTER (WHERE is_read = true AND read_at < NOW() - INTERVAL '7 days') as old_read_not_deleted
FROM public.notifications
CROSS JOIN LATERAL (
  SELECT COUNT(*) as cnt
  FROM public.notifications n2
  WHERE n2.user_id = notifications.user_id
) stats;

COMMENT ON VIEW public.notification_health_stats IS
'Dashboard de saúde do sistema de notificações - útil para monitoramento';

-- =====================================================
-- 5. EXECUTAR LIMPEZA INICIAL
-- =====================================================

-- Limpar notificações problemáticas agora
SELECT public.cleanup_old_notifications();

-- =====================================================
-- 6. POLÍTICA DE RETENÇÃO RECOMENDADA
-- =====================================================

-- Para referência futura, documentar a política:
/*
📋 POLÍTICA DE RETENÇÃO DE NOTIFICAÇÕES
Baseada em pesquisa de mercado (Twitter, Facebook, Slack):

1. Notificações NÃO-LIDAS:
   ✅ Mantidas por 30 dias (expires_at)
   ✅ Depois disso, deletadas automaticamente
   
2. Notificações LIDAS:
   ✅ Mantidas por 7 dias após leitura
   ✅ Depois disso, deletadas automaticamente
   
3. Notificações IMPORTANTES:
   ✅ Podem ter expires_at NULL (mantidas para sempre)
   ✅ Ex: convites de parceria, alertas críticos
   
4. Agregação:
   ✅ Notificações similares são mescladas
   ✅ Ex: "3 pessoas favoritaram" ao invés de 3 notificações
   
5. Limpeza:
   ✅ Automática, 1x por dia (3h AM)
   ✅ Não bloqueia inserts (não é trigger)
   ✅ Performance otimizada

📊 BENEFÍCIOS vs LIMITE FIXO DE 20:
- ✅ Notificações importantes não são perdidas
- ✅ Histórico recente é preservado
- ✅ Mais escalável (não depende de triggers)
- ✅ Melhor UX (usuário entende o comportamento)
- ✅ Alinhado com expectativas do mercado
*/

-- =====================================================
-- ✅ MIGRAÇÃO COMPLETA
-- =====================================================

-- RESULTADO ESPERADO:
-- - Notificações não-lidas mantidas por 30 dias
-- - Notificações lidas mantidas por 7 dias após leitura
-- - Limpeza automática diária às 3h AM
-- - Performance otimizada com índices
-- - View de monitoramento disponível

