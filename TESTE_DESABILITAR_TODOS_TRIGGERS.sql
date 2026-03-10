-- =====================================================
-- TESTE: Desabilitar TODOS os triggers da tabela animals
-- =====================================================
-- Isso vai nos dizer se o problema é nos triggers ou não

-- Desabilitar TODOS os triggers
ALTER TABLE public.animals DISABLE TRIGGER ALL;

-- Para reabilitar depois:
-- ALTER TABLE public.animals ENABLE TRIGGER ALL;


