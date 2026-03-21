-- =====================================================
-- MIGRAÇÃO 100: RESET COMPLETO DE DADOS DE TESTE
-- Data: 21/03/2026
-- Descrição: Remove TODOS os dados de teste do sistema
--            para preparação do ambiente de produção.
-- ATENÇÃO: Esta migration só deve ser executada UMA VEZ
--          em ambiente de teste. NUNCA em produção com dados reais.
-- =====================================================

-- =====================================================
-- FASE 1: TABELAS SEM CASCADE (precisam ser limpas manualmente)
-- Ordem: mais dependente → menos dependente
-- =====================================================

-- 1.1: Logs e auditoria (sem FK, standalone)
TRUNCATE TABLE payment_audit_log;
TRUNCATE TABLE asaas_webhooks_log;

-- 1.2: Newsletter (standalone)
TRUNCATE TABLE newsletter_subscriptions;

-- 1.3: Analytics com SET NULL (não são removidos pelo CASCADE)
TRUNCATE TABLE page_visits;
TRUNCATE TABLE impressions;
TRUNCATE TABLE clicks;

-- 1.4: Reports (SET NULL em múltiplas colunas)
TRUNCATE TABLE reports;

-- 1.5: Encryption config (reseta para estado limpo)
DELETE FROM encryption_config WHERE key_version > 0;
INSERT INTO encryption_config (key_version, key_hash, notes)
VALUES (
  1,
  encode(digest('initial_key_v1', 'sha256'), 'hex'),
  'Clean slate - production key must be configured'
) ON CONFLICT (key_version) DO NOTHING;

-- =====================================================
-- FASE 2: TABELAS COM CASCADE A PARTIR DE PROFILES
-- Deletar profiles dispara CASCADE em:
--   animals → animal_media, animal_partnerships, conversations → messages
--   favorites, boost_history, transactions
--   asaas_customers → asaas_subscriptions → asaas_payments → refunds
--   notifications, notification_preferences
--   suspensions, animal_drafts, events
--   support_tickets → ticket_responses
-- =====================================================

-- 2.1: Primeiro, limpar articles (author_id não tem CASCADE)
UPDATE articles SET author_id = NULL WHERE author_id IS NOT NULL;

-- 2.2: Deletar todos os perfis (CASCADE remove 24+ tabelas dependentes)
DELETE FROM profiles;

-- 2.3: Agora limpar articles órfãos (se necessário manter estrutura)
-- Se quiser remover artigos de teste também:
DELETE FROM articles;

-- =====================================================
-- FASE 3: LIMPAR AUTH.USERS (Supabase Auth)
-- =====================================================
-- Nota: Em Supabase, deletar auth.users é necessário para
-- remover completamente os usuários do sistema de autenticação.
-- O CASCADE de profiles já limpou os dados, mas os registros
-- de auth precisam ser removidos separadamente.

DELETE FROM auth.users;

-- =====================================================
-- FASE 4: RESETAR SEQUENCES (contadores limpos)
-- =====================================================

-- Resetar sequences de tabelas que usam SERIAL
ALTER SEQUENCE IF EXISTS encryption_config_id_seq RESTART WITH 2;

-- =====================================================
-- FASE 5: LIMPAR STORAGE (referências a arquivos)
-- =====================================================
-- Nota: Os arquivos físicos no Supabase Storage precisam
-- ser removidos via Dashboard ou API separadamente.
-- Esta migration apenas limpa as referências no banco.

-- =====================================================
-- FASE 6: VALIDAÇÃO DE INTEGRIDADE
-- =====================================================

-- Verificar que todas as tabelas de usuário estão vazias
DO $$
DECLARE
  v_count BIGINT;
  v_table TEXT;
  v_tables TEXT[] := ARRAY[
    'profiles',
    'animals',
    'animal_media',
    'animal_partnerships',
    'animal_drafts',
    'events',
    'conversations',
    'messages',
    'favorites',
    'boost_history',
    'transactions',
    'asaas_customers',
    'asaas_subscriptions',
    'asaas_payments',
    'refunds',
    'notifications',
    'notification_preferences',
    'suspensions',
    'support_tickets',
    'ticket_responses',
    'reports',
    'impressions',
    'clicks',
    'page_visits',
    'payment_audit_log',
    'asaas_webhooks_log',
    'newsletter_subscriptions',
    'articles'
  ];
BEGIN
  FOREACH v_table IN ARRAY v_tables
  LOOP
    EXECUTE format('SELECT count(*) FROM %I', v_table) INTO v_count;
    IF v_count > 0 THEN
      RAISE WARNING 'VALIDAÇÃO FALHOU: Tabela % ainda tem % registros!', v_table, v_count;
    ELSE
      RAISE NOTICE 'OK: Tabela % está vazia', v_table;
    END IF;
  END LOOP;

  -- Verificar auth.users
  SELECT count(*) INTO v_count FROM auth.users;
  IF v_count > 0 THEN
    RAISE WARNING 'VALIDAÇÃO FALHOU: auth.users ainda tem % registros!', v_count;
  ELSE
    RAISE NOTICE 'OK: auth.users está vazio';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'RESET COMPLETO FINALIZADO';
  RAISE NOTICE 'Sistema limpo e pronto para produção';
  RAISE NOTICE '========================================';
END $$;

-- =====================================================
-- FASE 7: MANTER TABELAS DE REFERÊNCIA INTACTAS
-- =====================================================
-- As seguintes tabelas NÃO foram alteradas (são configuração):
--   plans          → Definições de planos (estrutura do negócio)
--   adsense_config → Configuração de monetização
--
-- =====================================================
-- ✅ MIGRATION COMPLETA - RESET DE DADOS DE TESTE
-- =====================================================
-- Resultado esperado:
--   Zero usuários em auth.users
--   Zero perfis em profiles
--   Zero dados pessoais no banco
--   Zero dados financeiros de teste
--   Zero conversas/mensagens
--   Zero animais/eventos/artigos
--   Tabela plans preservada (configuração)
--   Sistema funcional e pronto para cadastros reais
--
-- ⚠️ PRÓXIMOS PASSOS PÓS-RESET:
--   1. Configurar chave de criptografia de produção:
--      ALTER DATABASE postgres SET app.encryption_key = 'CHAVE_SEGURA';
--   2. Remover arquivos do Supabase Storage via Dashboard
--   3. Criar primeiro usuário admin
--   4. Verificar que RLS está ativo (migration 099)
