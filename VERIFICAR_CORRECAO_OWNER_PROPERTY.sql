-- =====================================================
-- VERIFICAÇÃO: Correção owner_property_name Aplicada
-- =====================================================

-- 1. Verificar se as views existem
SELECT 
    table_name,
    view_definition IS NOT NULL as exists
FROM information_schema.views
WHERE table_schema = 'public'
  AND table_name IN ('animals_with_stats', 'animals_with_partnerships')
ORDER BY table_name;

-- 2. Verificar colunas da view animals_with_stats
SELECT 
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'animals_with_stats'
  AND column_name IN ('owner_property_name', 'owner_property_type', 'owner_name', 'owner_account_type')
ORDER BY column_name;

-- 3. Testar query com os novos campos
SELECT 
    a.name as animal_name,
    a.owner_name,
    a.owner_property_name,
    a.owner_account_type,
    a.owner_property_type,
    CASE 
        WHEN a.owner_account_type = 'institutional' 
        THEN COALESCE(a.owner_property_name, a.owner_name)
        ELSE a.owner_name
    END as display_name
FROM animals_with_stats a
LIMIT 5;

-- ✅ Se retornar resultados, a correção foi aplicada com sucesso!


