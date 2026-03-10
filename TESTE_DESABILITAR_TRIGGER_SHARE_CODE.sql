-- =====================================================
-- TESTE: Desabilitar temporariamente o trigger de share_code
-- =====================================================
-- Se isso resolver, o problema está no trigger generate_animal_share_code()
-- que está demorando muito para verificar unicidade

-- PASSO 1: Desabilitar o trigger
ALTER TABLE public.animals DISABLE TRIGGER trigger_set_animal_share_code;

-- PASSO 2: Após testar, REABILITAR com:
-- ALTER TABLE public.animals ENABLE TRIGGER trigger_set_animal_share_code;


