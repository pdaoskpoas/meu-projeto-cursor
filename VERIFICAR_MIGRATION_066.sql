-- =====================================================
-- VERIFICAÇÃO DA MIGRATION 066 - ANIMAL TITLES
-- Execute este SQL no Supabase para verificar se tudo funcionou
-- =====================================================

-- 1. VERIFICAR SE A TABELA FOI CRIADA
-- =====================================================
SELECT 
  'Tabela animal_titles' as verificacao,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'animal_titles'
    ) 
    THEN '✅ EXISTE' 
    ELSE '❌ NÃO EXISTE' 
  END as status;

-- 2. VERIFICAR COLUNAS DA TABELA
-- =====================================================
SELECT 
  'Colunas da tabela' as verificacao,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'animal_titles'
ORDER BY ordinal_position;

-- 3. VERIFICAR RLS (ROW LEVEL SECURITY)
-- =====================================================
SELECT 
  'RLS Habilitado' as verificacao,
  CASE 
    WHEN relrowsecurity = true 
    THEN '✅ ATIVADO' 
    ELSE '❌ DESATIVADO' 
  END as status
FROM pg_class
WHERE relname = 'animal_titles';

-- 4. VERIFICAR POLICIES
-- =====================================================
SELECT 
  'Policies da tabela' as verificacao,
  policyname as nome_policy,
  cmd as comando,
  CASE 
    WHEN qual IS NOT NULL THEN '✅ Configurada'
    ELSE '⚠️ Sem restrição'
  END as status
FROM pg_policies
WHERE tablename = 'animal_titles'
ORDER BY policyname;

-- 5. VERIFICAR ÍNDICES
-- =====================================================
SELECT 
  'Índices criados' as verificacao,
  indexname as nome_indice,
  indexdef as definicao
FROM pg_indexes
WHERE tablename = 'animal_titles'
ORDER BY indexname;

-- 6. VERIFICAR TRIGGER
-- =====================================================
SELECT 
  'Trigger updated_at' as verificacao,
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'animal_titles';

-- 7. VERIFICAR VIEW
-- =====================================================
SELECT 
  'View animals_with_titles' as verificacao,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.views 
      WHERE table_schema = 'public' 
      AND table_name = 'animals_with_titles'
    ) 
    THEN '✅ EXISTE' 
    ELSE '❌ NÃO EXISTE' 
  END as status;

-- 8. VERIFICAR FUNÇÃO DE MIGRAÇÃO
-- =====================================================
SELECT 
  'Função migrate_old_titles' as verificacao,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public'
      AND p.proname = 'migrate_old_titles_to_animal_titles'
    ) 
    THEN '✅ EXISTE' 
    ELSE '❌ NÃO EXISTE' 
  END as status;

-- 9. VERIFICAR GRANTS (PERMISSÕES)
-- =====================================================
SELECT 
  'Permissões authenticated' as verificacao,
  privilege_type,
  grantee
FROM information_schema.table_privileges
WHERE table_schema = 'public' 
  AND table_name = 'animal_titles'
  AND grantee = 'authenticated'
ORDER BY privilege_type;

-- 10. TESTE FUNCIONAL - INSERIR E DELETAR UM REGISTRO
-- =====================================================
-- Este teste cria e remove um registro de exemplo
-- Se você já tiver animais, substitua o UUID abaixo

DO $$
DECLARE
  test_animal_id UUID;
  test_title_id UUID;
BEGIN
  -- Buscar um animal existente (ou use um UUID específico)
  SELECT id INTO test_animal_id 
  FROM animals 
  WHERE owner_id = auth.uid() 
  LIMIT 1;
  
  IF test_animal_id IS NOT NULL THEN
    -- Tentar inserir um título de teste
    INSERT INTO animal_titles (
      animal_id,
      event_name,
      event_date,
      award
    ) VALUES (
      test_animal_id,
      'Teste de Verificação Migration 066',
      CURRENT_DATE,
      'Teste de Sistema'
    )
    RETURNING id INTO test_title_id;
    
    -- Se conseguiu inserir, deletar imediatamente
    IF test_title_id IS NOT NULL THEN
      DELETE FROM animal_titles WHERE id = test_title_id;
      RAISE NOTICE '✅ Teste funcional: INSERT e DELETE funcionaram!';
    END IF;
  ELSE
    RAISE NOTICE '⚠️ Nenhum animal encontrado para teste. Crie um animal primeiro.';
  END IF;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '❌ Erro no teste funcional: %', SQLERRM;
END $$;

-- =====================================================
-- RESUMO FINAL
-- =====================================================
SELECT 
  '===================' as linha,
  'RESUMO DA VERIFICAÇÃO' as titulo,
  '===================' as linha2;

SELECT 
  CASE 
    WHEN (
      SELECT COUNT(*) 
      FROM information_schema.tables 
      WHERE table_name = 'animal_titles'
    ) > 0
    AND (
      SELECT COUNT(*) 
      FROM pg_policies 
      WHERE tablename = 'animal_titles'
    ) >= 4
    AND (
      SELECT COUNT(*) 
      FROM information_schema.views 
      WHERE table_name = 'animals_with_titles'
    ) > 0
    THEN '✅✅✅ MIGRATION 066 APLICADA COM SUCESSO! ✅✅✅'
    ELSE '❌❌❌ MIGRATION INCOMPLETA - VERIFIQUE OS ERROS ACIMA ❌❌❌'
  END as status_final;

-- =====================================================
-- CONTAGEM DE TÍTULOS (se já existirem)
-- =====================================================
SELECT 
  'Total de títulos cadastrados' as info,
  COUNT(*) as quantidade
FROM animal_titles;

SELECT 
  'Animais com títulos' as info,
  COUNT(DISTINCT animal_id) as quantidade
FROM animal_titles;

