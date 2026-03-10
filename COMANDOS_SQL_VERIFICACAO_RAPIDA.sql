-- ===================================================================
-- COMANDOS SQL: Verificação Rápida
-- Execute estes comandos no Supabase SQL Editor para verificar tudo
-- ===================================================================

-- ===================================================================
-- 1. VERIFICAR SE FUNÇÃO FOI CRIADA
-- ===================================================================

SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name = 'check_user_publish_quota';

-- ✅ Deve retornar 1 linha com routine_name = 'check_user_publish_quota'

-- ===================================================================
-- 2. VERIFICAR PERMISSÕES DA FUNÇÃO
-- ===================================================================

SELECT 
    grantee, 
    privilege_type 
FROM information_schema.routine_privileges 
WHERE routine_name = 'check_user_publish_quota';

-- ✅ Deve mostrar: authenticated | EXECUTE

-- ===================================================================
-- 3. VERIFICAR SE ÍNDICE FOI CRIADO
-- ===================================================================

SELECT 
    indexname, 
    indexdef 
FROM pg_indexes 
WHERE tablename = 'animals' 
  AND indexname = 'idx_animals_owner_active_individual';

-- ✅ Deve retornar 1 linha com o índice

-- ===================================================================
-- 4. TESTAR FUNÇÃO COM SEU USUÁRIO
-- ===================================================================

-- ⚠️ SUBSTITUIR 'SEU_USER_ID_AQUI' pelo seu ID real de usuário!
SELECT check_user_publish_quota('SEU_USER_ID_AQUI');

-- ✅ Resultado esperado (exemplo):
-- {
--   "plan": "vip",
--   "plan_expires_at": null,
--   "is_annual_plan": false,
--   "plan_is_valid": true,
--   "allowedByPlan": 15,
--   "active": 3,
--   "remaining": 12
-- }

-- ===================================================================
-- 5. VERIFICAR SEU PLANO ATUAL
-- ===================================================================

-- ⚠️ SUBSTITUIR 'SEU_USER_ID_AQUI'
SELECT 
    id,
    name,
    email,
    plan,
    plan_expires_at,
    plan_purchased_at,
    is_annual_plan,
    account_type
FROM profiles 
WHERE id = 'SEU_USER_ID_AQUI';

-- ✅ Verificar:
-- - plan = 'vip', 'basic', 'pro', 'ultra', ou 'free'
-- - plan_expires_at = NULL (vitalício) ou data futura (válido)

-- ===================================================================
-- 6. CONTAR SEUS ANÚNCIOS ATIVOS
-- ===================================================================

-- ⚠️ SUBSTITUIR 'SEU_USER_ID_AQUI'
SELECT 
    COUNT(*) as anuncios_ativos,
    COUNT(*) FILTER (WHERE is_individual_paid = true) as individuais_pagos,
    COUNT(*) FILTER (WHERE is_individual_paid IS NULL OR is_individual_paid = false) as do_plano
FROM animals
WHERE owner_id = 'SEU_USER_ID_AQUI'
  AND ad_status = 'active';

-- ✅ Verificar:
-- - anuncios_ativos = Total de anúncios ativos
-- - individuais_pagos = Anúncios pagos individualmente (NÃO contam no limite)
-- - do_plano = Anúncios que CONTAM no limite do plano

-- ===================================================================
-- 7. VER DETALHES DOS SEUS ANÚNCIOS
-- ===================================================================

-- ⚠️ SUBSTITUIR 'SEU_USER_ID_AQUI'
SELECT 
    id,
    name,
    ad_status,
    is_individual_paid,
    published_at,
    expires_at,
    CASE 
        WHEN is_individual_paid = true THEN 'Individual Pago (NÃO conta)'
        ELSE 'Do Plano (conta no limite)'
    END as tipo
FROM animals
WHERE owner_id = 'SEU_USER_ID_AQUI'
ORDER BY published_at DESC
LIMIT 20;

-- ✅ Ver lista dos seus anúncios e qual conta no limite

-- ===================================================================
-- 8. CALCULAR VAGAS DISPONÍVEIS (MANUAL)
-- ===================================================================

-- ⚠️ SUBSTITUIR 'SEU_USER_ID_AQUI'
WITH user_info AS (
    SELECT 
        plan,
        CASE plan
            WHEN 'basic' THEN 10
            WHEN 'pro' THEN 15
            WHEN 'ultra' THEN 25
            WHEN 'vip' THEN 15
            ELSE 0
        END as limite
    FROM profiles
    WHERE id = 'SEU_USER_ID_AQUI'
),
animal_count AS (
    SELECT COUNT(*) as ativos
    FROM animals
    WHERE owner_id = 'SEU_USER_ID_AQUI'
      AND ad_status = 'active'
      AND (is_individual_paid IS NULL OR is_individual_paid = false)
)
SELECT 
    u.plan as seu_plano,
    u.limite as limite_do_plano,
    a.ativos as anuncios_ativos,
    GREATEST(u.limite - a.ativos, 0) as vagas_disponiveis
FROM user_info u, animal_count a;

-- ✅ Resultado deve bater com o que aparece no modal

-- ===================================================================
-- 9. TESTAR PERFORMANCE DA FUNÇÃO
-- ===================================================================

-- ⚠️ SUBSTITUIR 'SEU_USER_ID_AQUI'
EXPLAIN ANALYZE 
SELECT check_user_publish_quota('SEU_USER_ID_AQUI');

-- ✅ Verificar "Execution Time" deve ser < 50ms

-- ===================================================================
-- 10. VERIFICAR TODOS OS PLANOS NO SISTEMA
-- ===================================================================

SELECT 
    plan,
    COUNT(*) as total_usuarios,
    COUNT(*) FILTER (WHERE plan_expires_at IS NULL OR plan_expires_at > NOW()) as planos_validos,
    COUNT(*) FILTER (WHERE plan_expires_at < NOW()) as planos_expirados
FROM profiles
GROUP BY plan
ORDER BY 
    CASE plan
        WHEN 'vip' THEN 1
        WHEN 'ultra' THEN 2
        WHEN 'pro' THEN 3
        WHEN 'basic' THEN 4
        WHEN 'free' THEN 5
    END;

-- ✅ Ver distribuição de planos no sistema

-- ===================================================================
-- 11. CORRIGIR VIP PARA VITALÍCIO (SE NECESSÁRIO)
-- ===================================================================

-- ⚠️ DESCOMENTE APENAS SE VIP TIVER DATA DE EXPIRAÇÃO
-- UPDATE profiles 
-- SET plan_expires_at = NULL 
-- WHERE plan = 'vip' 
--   AND plan_expires_at IS NOT NULL;

-- ✅ VIP deve ter plan_expires_at = NULL (vitalício)

-- ===================================================================
-- 12. TESTE COMPLETO - SIMULAR DIFERENTES CENÁRIOS
-- ===================================================================

-- ⚠️ SUBSTITUIR 'SEU_USER_ID_AQUI'
DO $$
DECLARE
    user_id UUID := 'SEU_USER_ID_AQUI';
    result JSONB;
BEGIN
    -- Testar função
    SELECT check_user_publish_quota(user_id) INTO result;
    
    -- Mostrar resultado
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'TESTE DA FUNÇÃO check_user_publish_quota';
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'User ID: %', user_id;
    RAISE NOTICE 'Plano: %', result->>'plan';
    RAISE NOTICE 'Plano Válido: %', result->>'plan_is_valid';
    RAISE NOTICE 'Limite: %', result->>'allowedByPlan';
    RAISE NOTICE 'Ativos: %', result->>'active';
    RAISE NOTICE 'Disponíveis: %', result->>'remaining';
    RAISE NOTICE '==============================================';
    
    -- Validações
    IF result->>'plan' IS NULL THEN
        RAISE EXCEPTION '❌ ERRO: Plano não encontrado!';
    END IF;
    
    IF (result->>'allowedByPlan')::INT < 0 THEN
        RAISE EXCEPTION '❌ ERRO: Limite negativo!';
    END IF;
    
    IF (result->>'remaining')::INT < 0 THEN
        RAISE EXCEPTION '❌ ERRO: Vagas negativas!';
    END IF;
    
    RAISE NOTICE '✅ TODOS OS TESTES PASSARAM!';
    RAISE NOTICE '==============================================';
END $$;

-- ✅ Deve mostrar todas as informações e "TODOS OS TESTES PASSARAM"

-- ===================================================================
-- FIM DOS COMANDOS DE VERIFICAÇÃO
-- ===================================================================

-- RESUMO:
-- 1. ✅ Função criada
-- 2. ✅ Permissões OK
-- 3. ✅ Índice criado
-- 4. ✅ Função funciona
-- 5. ✅ Plano identificado
-- 6. ✅ Contagem correta
-- 7. ✅ Cálculo de vagas correto
-- 8. ✅ Performance OK


