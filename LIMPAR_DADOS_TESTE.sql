-- =====================================================
-- LIMPAR TODOS OS DADOS DE TESTE
-- Data: 17/11/2025
-- ATENÇÃO: Este script vai DELETAR TUDO exceto o admin!
-- =====================================================

-- ⚠️ IMPORTANTE: Execute este script NO SUPABASE SQL EDITOR
-- ⚠️ Não há como reverter após executar!

BEGIN;

-- =====================================================
-- PASSO 1: Confirmar qual é o admin
-- =====================================================

-- EXECUTE ESTA QUERY PRIMEIRO PARA CONFIRMAR O ID DO ADMIN:
SELECT id, email, name, role 
FROM profiles 
WHERE email = 'seu_email_admin@exemplo.com';

-- ❗ ANOTE O ID ACIMA ANTES DE CONTINUAR!

-- =====================================================
-- PASSO 2: Deletar TODOS os perfis EXCETO o admin
-- =====================================================

-- Esta linha vai deletar TUDO via CASCADE:
-- - Animais e fotos
-- - Conversas e mensagens
-- - Favoritos
-- - Notificações
-- - Transações
-- - Boosts
-- - Sociedades
-- - Tudo relacionado!

DELETE FROM profiles
WHERE email != 'seu_email_admin@exemplo.com'
  AND email != 'admin@gmail.com'; -- Por segurança, proteger variações

-- =====================================================
-- PASSO 3: Deletar usuários órfãos da autenticação
-- =====================================================

-- Deletar da tabela auth.users do Supabase
-- ATENÇÃO: Isso vai forçar logout de todos os usuários de teste

DELETE FROM auth.users
WHERE email NOT IN ('seu_email_admin@exemplo.com', 'admin@gmail.com');

-- =====================================================
-- PASSO 4: Limpar tabelas auxiliares órfãs (se houver)
-- =====================================================

-- Limpar impressions/clicks sem user_id (anônimos)
-- OPCIONAL: Comente se quiser manter estatísticas anônimas
-- DELETE FROM impressions WHERE user_id IS NULL;
-- DELETE FROM clicks WHERE user_id IS NULL;

-- =====================================================
-- PASSO 5: Resetar sequências (opcional)
-- =====================================================

-- Se quiser começar do zero com IDs limpos:
-- ALTER SEQUENCE IF EXISTS animals_id_seq RESTART WITH 1;
-- ALTER SEQUENCE IF EXISTS conversations_id_seq RESTART WITH 1;
-- (adicione outras se necessário)

-- =====================================================
-- VERIFICAÇÃO: O que sobrou?
-- =====================================================

SELECT 
  'Usuários restantes' AS tabela,
  COUNT(*) AS quantidade
FROM profiles
UNION ALL
SELECT 
  'Animais restantes',
  COUNT(*)
FROM animals
UNION ALL
SELECT 
  'Conversas restantes',
  COUNT(*)
FROM conversations
UNION ALL
SELECT 
  'Mensagens restantes',
  COUNT(*)
FROM messages
UNION ALL
SELECT 
  'Favoritos restantes',
  COUNT(*)
FROM favorites;

-- =====================================================
-- Se estiver tudo OK, COMMIT. Se não, ROLLBACK!
-- =====================================================

-- COMMIT; -- Descomente para confirmar
-- ROLLBACK; -- Ou use para cancelar

-- =====================================================
-- RESULTADO ESPERADO
-- =====================================================

-- ✅ Apenas 1 usuário: seu_email_admin@exemplo.com
-- ✅ 0 animais (incluindo os 2 que você viu em "buscar")
-- ✅ 0 conversas
-- ✅ 0 mensagens
-- ✅ 0 favoritos
-- ✅ Sistema limpo para dados reais

-- =====================================================
-- ⚠️ ATENÇÃO FINAL
-- =====================================================

-- ANTES DE EXECUTAR:
-- 1. Confirme que 'seu_email_admin@exemplo.com' é o email correto do admin
-- 2. Faça backup se tiver dúvidas
-- 3. Execute linha por linha se preferir mais controle
-- 4. Use ROLLBACK se algo der errado

-- DEPOIS DE EXECUTAR:
-- 1. Faça logout e login novamente como admin
-- 2. Verifique se consegue acessar o sistema
-- 3. Vá em "Buscar" e confirme que não há mais animais
-- 4. Sistema está pronto para dados reais! 🚀

