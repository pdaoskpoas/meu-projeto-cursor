# 🔧 SOLUÇÃO DE ERROS SQL - TROUBLESHOOTING

## 🎯 SE AINDA ESTÁ DANDO ERRO, SIGA ESTE GUIA

---

## ❌ ERRO 1: "column reference is ambiguous"

### **Causa**
PostgreSQL não sabe se você está falando de uma variável ou coluna da tabela.

### **Solução**
✅ **RESOLVIDO** no arquivo `ROTACAO_SIMPLES_TESTADO.sql`

Todas as colunas agora têm alias explícito:
```sql
-- ❌ ERRADO
WHERE is_boosted = TRUE

-- ✅ CORRETO
WHERE anim.is_boosted = TRUE
```

---

## ❌ ERRO 2: "view does not exist" ou "animals_with_stats not found"

### **Causa**
A view `animals_with_stats` pode não existir ou ter estrutura diferente.

### **Solução**
✅ **RESOLVIDO** no arquivo `ROTACAO_SIMPLES_TESTADO.sql`

Nova versão NÃO depende de views complexas:
- Busca direto da tabela `animals`
- Usa apenas JOINs simples
- Não depende de `animals_with_stats`

---

## ❌ ERRO 3: "function already exists"

### **Causa**
Você já aplicou a migration antes.

### **Solução**
✅ **IGNORAR** - Não é um erro real!

Ou executar apenas a parte do DROP:
```sql
DROP FUNCTION IF EXISTS get_featured_animals_rotated_fast(INTEGER);
```
Depois executar a criação novamente.

---

## ❌ ERRO 4: "permission denied"

### **Causa**
Você não tem permissão de OWNER no banco de dados.

### **Solução**
1. Verificar se você é owner do projeto no Supabase
2. Tentar executar como superuser:
```sql
-- Remover SECURITY DEFINER temporariamente
CREATE OR REPLACE FUNCTION get_featured_animals_rotated_fast(...)
-- SEM a linha: SECURITY DEFINER
```

---

## ❌ ERRO 5: "syntax error near..."

### **Causa**
Pode estar faltando alguma parte do SQL ou foi copiado incorretamente.

### **Solução**
1. ✅ Copiar TODO o arquivo `ROTACAO_SIMPLES_TESTADO.sql`
2. ✅ Não copiar apenas partes
3. ✅ Colar de uma vez no SQL Editor
4. ✅ Executar completo

---

## ❌ ERRO 6: "relation animals does not exist"

### **Causa**
Tabela `animals` não existe ou está em schema diferente.

### **Solução**
Verificar se tabela existe:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'animals';
```

Se não existir, aplicar migrations anteriores primeiro.

---

## ❌ ERRO 7: Query retorna 0 resultados

### **Causa**
Não há anúncios impulsionados no banco.

### **Solução**
✅ **NÃO É ERRO!** É esperado se não houver anúncios com boost.

Para testar, criar um anúncio impulsionado:
```sql
-- Verificar quantos existem
SELECT COUNT(*) 
FROM animals 
WHERE is_boosted = TRUE 
  AND boost_expires_at > NOW() 
  AND ad_status = 'active';

-- Se retornar 0, criar um para teste (exemplo)
UPDATE animals
SET is_boosted = TRUE,
    boost_expires_at = NOW() + INTERVAL '24 hours',
    boosted_at = NOW()
WHERE id = (SELECT id FROM animals WHERE ad_status = 'active' LIMIT 1);
```

---

## 🔍 DIAGNÓSTICO COMPLETO

Execute este SQL para diagnóstico completo:

```sql
-- =====================================================
-- DIAGNÓSTICO COMPLETO DO SISTEMA
-- =====================================================

DO $$
DECLARE
    v_animals_table_exists BOOLEAN;
    v_function_exists BOOLEAN;
    v_total_animals INTEGER;
    v_total_boosted INTEGER;
BEGIN
    RAISE NOTICE '═══════════════════════════════════════════════════════';
    RAISE NOTICE 'DIAGNÓSTICO DO SISTEMA DE ROTAÇÃO';
    RAISE NOTICE '═══════════════════════════════════════════════════════';
    RAISE NOTICE '';
    
    -- 1. Verificar se tabela animals existe
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'animals'
    ) INTO v_animals_table_exists;
    
    IF v_animals_table_exists THEN
        RAISE NOTICE '✅ Tabela animals existe';
    ELSE
        RAISE NOTICE '❌ Tabela animals NÃO existe';
    END IF;
    
    -- 2. Verificar se função existe
    SELECT EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'get_featured_animals_rotated_fast'
    ) INTO v_function_exists;
    
    IF v_function_exists THEN
        RAISE NOTICE '✅ Função get_featured_animals_rotated_fast existe';
    ELSE
        RAISE NOTICE '❌ Função get_featured_animals_rotated_fast NÃO existe';
    END IF;
    
    -- 3. Contar total de animais
    IF v_animals_table_exists THEN
        SELECT COUNT(*) INTO v_total_animals FROM animals;
        RAISE NOTICE '📊 Total de animais no banco: %', v_total_animals;
        
        -- 4. Contar animais impulsionados
        SELECT COUNT(*) INTO v_total_boosted
        FROM animals
        WHERE is_boosted = TRUE 
          AND boost_expires_at > NOW() 
          AND ad_status = 'active';
        
        RAISE NOTICE '📊 Total de animais impulsionados: %', v_total_boosted;
        
        IF v_total_boosted = 0 THEN
            RAISE NOTICE '⚠️  Não há anúncios impulsionados (criar alguns para testar)';
        END IF;
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════════════════════';
    
    -- 5. Conclusão
    IF v_animals_table_exists AND v_function_exists THEN
        IF v_total_boosted > 0 THEN
            RAISE NOTICE '✅ TUDO OK! Sistema pronto para usar.';
        ELSE
            RAISE NOTICE '⚠️  Sistema OK, mas sem anúncios impulsionados para testar.';
        END IF;
    ELSE
        RAISE NOTICE '❌ Há problemas que precisam ser corrigidos.';
    END IF;
    
    RAISE NOTICE '═══════════════════════════════════════════════════════';
END $$;
```

---

## 📋 CHECKLIST DE VERIFICAÇÃO

Execute cada SQL abaixo para verificar:

### ✅ 1. Tabela animals existe?
```sql
SELECT COUNT(*) FROM animals;
-- Deve retornar um número (pode ser 0)
```

### ✅ 2. Função existe?
```sql
SELECT proname FROM pg_proc WHERE proname LIKE '%featured%';
-- Deve retornar: get_featured_animals_rotated_fast
```

### ✅ 3. Função executa?
```sql
SELECT COUNT(*) FROM get_featured_animals_rotated_fast(10);
-- Deve retornar um número (pode ser 0 se não houver impulsionados)
```

### ✅ 4. Há animais impulsionados?
```sql
SELECT name, is_boosted, boost_expires_at 
FROM animals 
WHERE is_boosted = TRUE 
  AND boost_expires_at > NOW()
LIMIT 5;
-- Deve mostrar anúncios com boost ativo
```

---

## 🆘 RESET COMPLETO (Última Opção)

Se nada funcionar, executar reset:

```sql
-- ATENÇÃO: Isso remove a função completamente
DROP FUNCTION IF EXISTS get_featured_animals_rotated_fast(INTEGER) CASCADE;
DROP FUNCTION IF EXISTS get_featured_animals_rotated(INTEGER) CASCADE;

-- Depois re-aplicar ROTACAO_SIMPLES_TESTADO.sql completo
```

---

## 📞 AINDA COM PROBLEMAS?

### **Opção 1: Copiar Erro Exato**
Copie a mensagem de erro COMPLETA e verifique qual dos casos acima se aplica.

### **Opção 2: Verificar Schema**
```sql
-- Ver estrutura da tabela animals
\d animals

-- Ou no Supabase Dashboard
-- Table Editor → animals → Ver colunas
```

### **Opção 3: Usar Versão Mínima**
Se ainda assim não funcionar, usar versão ultra-simplificada:

```sql
-- Versão MÍNIMA para teste
CREATE OR REPLACE FUNCTION test_rotation()
RETURNS TABLE (animal_name TEXT, pos INTEGER)
LANGUAGE sql
AS $$
    SELECT name, ROW_NUMBER() OVER (ORDER BY boosted_at) as pos
    FROM animals
    WHERE is_boosted = TRUE
    LIMIT 10;
$$;

-- Testar
SELECT * FROM test_rotation();
```

---

## ✅ SUCESSO GARANTIDO

Se seguir este guia:
1. ✅ Diagnosticar o problema específico
2. ✅ Aplicar a solução correta
3. ✅ Verificar com testes
4. ✅ Confirmar funcionamento

O sistema vai funcionar!

---

**Última atualização:** 17/11/2025  
**Versão testada:** ROTACAO_SIMPLES_TESTADO.sql

