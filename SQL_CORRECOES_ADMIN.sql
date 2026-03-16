-- =====================================================
-- SQL PARA CORREÇÕES DO FLUXO ADMINISTRATIVO
-- Data: 08 de Novembro de 2025
-- Descrição: Scripts SQL para corrigir e validar o sistema admin
-- =====================================================

-- =====================================================
-- PARTE 1: CRIAR E CONFIGURAR USUÁRIO ADMIN
-- =====================================================

-- 1.1 Atualizar usuário existente para admin
-- (Executar DEPOIS de criar o usuário no Supabase Dashboard)
UPDATE profiles 
SET 
  role = 'admin',
  name = 'Administrador do Sistema',
  account_type = 'institutional',
  property_name = 'Administração',
  updated_at = NOW()
WHERE email = 'seu_email_admin@exemplo.com';

-- 1.2 Verificar se o usuário foi criado corretamente
SELECT 
  id, 
  email, 
  role, 
  name,
  account_type,
  created_at
FROM profiles 
WHERE email = 'seu_email_admin@exemplo.com';
-- Resultado esperado: 1 linha com role = 'admin'

-- 1.3 Confirmar email do usuário (se necessário)
UPDATE auth.users 
SET 
  email_confirmed_at = NOW(),
  updated_at = NOW()
WHERE email = 'seu_email_admin@exemplo.com';

-- =====================================================
-- PARTE 2: VALIDAÇÕES E VERIFICAÇÕES
-- =====================================================

-- 2.1 Listar todos os administradores
SELECT 
  id,
  name,
  email,
  role,
  account_type,
  created_at
FROM profiles
WHERE role = 'admin'
ORDER BY created_at DESC;

-- 2.2 Verificar políticas RLS para admins
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE policyname ILIKE '%admin%'
ORDER BY schemaname, tablename;

-- 2.3 Verificar logs de auditoria administrativa
SELECT 
  al.id,
  al.admin_id,
  p.name as admin_name,
  p.email as admin_email,
  al.action,
  al.resource_type,
  al.resource_id,
  al.created_at
FROM admin_audit_log al
LEFT JOIN profiles p ON al.admin_id = p.id
ORDER BY al.created_at DESC
LIMIT 20;

-- 2.4 Contar ações por administrador
SELECT 
  p.name as admin_name,
  p.email as admin_email,
  COUNT(*) as total_actions,
  MIN(al.created_at) as first_action,
  MAX(al.created_at) as last_action
FROM admin_audit_log al
JOIN profiles p ON al.admin_id = p.id
GROUP BY p.id, p.name, p.email
ORDER BY total_actions DESC;

-- =====================================================
-- PARTE 3: ESTATÍSTICAS DO SISTEMA (DADOS REAIS)
-- =====================================================

-- 3.1 Estatísticas de usuários
SELECT 
  COUNT(*) as total_users,
  COUNT(*) FILTER (WHERE is_active = true AND is_suspended = false) as active_users,
  COUNT(*) FILTER (WHERE plan != 'free') as paid_users,
  COUNT(*) FILTER (WHERE plan = 'free') as free_users,
  COUNT(*) FILTER (WHERE role = 'admin') as admin_users
FROM profiles;

-- 3.2 Estatísticas de planos
SELECT 
  plan,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE plan_expires_at >= NOW()) as active,
  COUNT(*) FILTER (WHERE plan_expires_at < NOW()) as expired
FROM profiles
WHERE plan != 'free'
GROUP BY plan
ORDER BY 
  CASE plan
    WHEN 'vip' THEN 1
    WHEN 'ultra' THEN 2
    WHEN 'pro' THEN 3
    WHEN 'basic' THEN 4
    ELSE 5
  END;

-- 3.3 Estatísticas de conteúdo
SELECT 
  'Animais' as tipo,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE ad_status = 'active') as ativos,
  COUNT(*) FILTER (WHERE is_boosted = true) as impulsionados
FROM animals
UNION ALL
SELECT 
  'Eventos' as tipo,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE ad_status = 'active') as ativos,
  COUNT(*) FILTER (WHERE is_boosted = true) as impulsionados
FROM events
UNION ALL
SELECT 
  'Artigos' as tipo,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE is_published = true) as ativos,
  NULL as impulsionados
FROM articles;

-- 3.4 Estatísticas de analytics
SELECT 
  'Impressões' as metrica,
  COUNT(*) as total,
  COUNT(DISTINCT user_id) as usuarios_unicos,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as ultimos_30_dias
FROM impressions
UNION ALL
SELECT 
  'Cliques' as metrica,
  COUNT(*) as total,
  COUNT(DISTINCT user_id) as usuarios_unicos,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as ultimos_30_dias
FROM clicks;

-- 3.5 Top usuários por atividade
SELECT 
  p.name,
  p.email,
  p.account_type,
  p.plan,
  COUNT(DISTINCT a.id) as total_animais,
  COUNT(DISTINCT e.id) as total_eventos,
  COUNT(DISTINCT bh.id) as total_boosts
FROM profiles p
LEFT JOIN animals a ON a.owner_id = p.id
LEFT JOIN events e ON e.organizer_id = p.id
LEFT JOIN boost_history bh ON bh.user_id = p.id
WHERE p.role != 'admin'
GROUP BY p.id, p.name, p.email, p.account_type, p.plan
HAVING COUNT(DISTINCT a.id) > 0 OR COUNT(DISTINCT e.id) > 0
ORDER BY (COUNT(DISTINCT a.id) + COUNT(DISTINCT e.id)) DESC
LIMIT 20;

-- =====================================================
-- PARTE 4: GESTÃO DE PERMISSÕES
-- =====================================================

-- 4.1 Remover privilégios de admin de um usuário
-- (Descomentar e substituir o email para executar)
-- UPDATE profiles 
-- SET role = 'user', updated_at = NOW()
-- WHERE email = 'usuario@exemplo.com' AND role = 'admin';

-- 4.2 Adicionar novo administrador
-- (Descomentar e substituir o email para executar)
-- UPDATE profiles 
-- SET role = 'admin', updated_at = NOW()
-- WHERE email = 'novo-admin@exemplo.com';

-- 4.3 Listar usuários candidatos a admin (contas institucionais ativas)
SELECT 
  id,
  name,
  email,
  account_type,
  property_name,
  plan,
  created_at
FROM profiles
WHERE 
  account_type = 'institutional'
  AND is_active = true
  AND is_suspended = false
  AND role = 'user'
ORDER BY created_at ASC;

-- =====================================================
-- PARTE 5: LIMPEZA E MANUTENÇÃO
-- =====================================================

-- 5.1 Limpar logs de auditoria antigos (> 1 ano)
-- (Executar com cuidado - logs são imutáveis por design)
-- DELETE FROM admin_audit_log 
-- WHERE created_at < NOW() - INTERVAL '1 year';

-- 5.2 Verificar integridade de perfis sem usuário auth
SELECT 
  p.id,
  p.email,
  p.name
FROM profiles p
LEFT JOIN auth.users au ON au.id = p.id
WHERE au.id IS NULL;
-- Resultado esperado: 0 linhas (todos os perfis devem ter usuário auth)

-- 5.3 Verificar usuários auth sem perfil
SELECT 
  au.id,
  au.email,
  au.created_at
FROM auth.users au
LEFT JOIN profiles p ON p.id = au.id
WHERE p.id IS NULL;
-- Resultado esperado: 0 linhas (todos os usuários auth devem ter perfil)

-- =====================================================
-- PARTE 6: SEGURANÇA E AUDITORIA
-- =====================================================

-- 6.1 Últimas suspensões realizadas
SELECT 
  s.id,
  s.user_id,
  s.email as suspended_email,
  s.reason,
  s.suspended_at,
  s.is_active,
  p.name as suspended_user_name
FROM suspensions s
LEFT JOIN profiles p ON p.id = s.user_id
ORDER BY s.suspended_at DESC
LIMIT 20;

-- 6.2 Denúncias pendentes (alta prioridade)
SELECT 
  r.id,
  r.content_type,
  r.reason,
  r.priority,
  r.status,
  r.reporter_email,
  r.reported_user_name,
  r.created_at
FROM reports r
WHERE r.status = 'pending'
ORDER BY 
  CASE r.priority
    WHEN 'urgent' THEN 1
    WHEN 'high' THEN 2
    WHEN 'medium' THEN 3
    WHEN 'low' THEN 4
  END,
  r.created_at ASC;

-- 6.3 Transações financeiras recentes
SELECT 
  t.id,
  t.user_id,
  p.name as user_name,
  p.email as user_email,
  t.type,
  t.amount,
  t.currency,
  t.status,
  t.plan_type,
  t.created_at
FROM transactions t
LEFT JOIN profiles p ON p.id = t.user_id
ORDER BY t.created_at DESC
LIMIT 50;

-- 6.4 Resumo financeiro
SELECT 
  t.status,
  t.type,
  COUNT(*) as total_transactions,
  SUM(t.amount) as total_amount,
  AVG(t.amount) as avg_amount
FROM transactions t
GROUP BY t.status, t.type
ORDER BY t.status, t.type;

-- =====================================================
-- PARTE 7: PERFORMANCE E OTIMIZAÇÃO
-- =====================================================

-- 7.1 Verificar índices existentes
SELECT 
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- 7.2 Tabelas com mais registros
SELECT 
  schemaname,
  tablename,
  n_live_tup as row_count,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY n_live_tup DESC;

-- 7.3 Queries mais lentas (requer pg_stat_statements)
-- (Descomentar se a extensão estiver habilitada)
-- SELECT 
--   calls,
--   mean_exec_time,
--   max_exec_time,
--   query
-- FROM pg_stat_statements
-- WHERE query NOT LIKE '%pg_stat_statements%'
-- ORDER BY mean_exec_time DESC
-- LIMIT 10;

-- =====================================================
-- PARTE 8: TESTES E VALIDAÇÃO
-- =====================================================

-- 8.1 Testar permissões de admin (executar como admin)
-- Deve retornar dados
SELECT COUNT(*) as total FROM profiles;
SELECT COUNT(*) as total FROM animals;
SELECT COUNT(*) as total FROM suspensions;
SELECT COUNT(*) as total FROM admin_audit_log;

-- 8.2 Testar se policies RLS estão ativas
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
-- Todas as tabelas devem ter rowsecurity = true

-- 8.3 Verificar funções de auditoria
SELECT 
  proname as function_name,
  prosrc as function_code
FROM pg_proc
WHERE proname LIKE '%admin%' OR proname LIKE '%audit%'
ORDER BY proname;

-- =====================================================
-- FIM DO SCRIPT
-- =====================================================

-- NOTAS IMPORTANTES:
-- 1. Sempre testar em ambiente de desenvolvimento primeiro
-- 2. Fazer backup antes de executar comandos de DELETE ou UPDATE
-- 3. Verificar resultados após cada execução
-- 4. Documentar todas as alterações realizadas
-- 5. Logs de auditoria são imutáveis por design (não deletar)

-- EXECUTADO EM: [DATA]
-- EXECUTADO POR: [NOME DO ADMIN]
-- AMBIENTE: [DEV/STAGING/PROD]


