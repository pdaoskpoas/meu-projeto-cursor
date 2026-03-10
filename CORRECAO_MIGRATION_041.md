# ✅ CORREÇÃO - Migration 041

**Data:** 4 de Novembro de 2025  
**Erro:** Sintaxe incorreta no `GET DIAGNOSTICS`  
**Status:** ✅ CORRIGIDO

---

## 🐛 O Problema

**Erro reportado:**
```
ERROR: 42601: unrecognized GET DIAGNOSTICS item at or near "deleted_count"
LINE 47: GET DIAGNOSTICS deleted_count = deleted_count + ROW_COUNT;
```

**Causa:**
No PostgreSQL, você **não pode fazer operações aritméticas diretamente** no `GET DIAGNOSTICS`.

**Código incorreto:**
```sql
GET DIAGNOSTICS deleted_count = deleted_count + ROW_COUNT;  -- ❌ ERRADO
```

**Código correto:**
```sql
-- Primeiro obter ROW_COUNT em uma variável temporária
GET DIAGNOSTICS rows_deleted = ROW_COUNT;  -- ✅ CORRETO

-- Depois fazer a operação
deleted_count := deleted_count + rows_deleted;  -- ✅ CORRETO
```

---

## ✅ Correção Aplicada

### **Função `cleanup_old_messages()`**

**Antes:**
```sql
DECLARE
  deleted_count INTEGER := 0;
  conversation_record RECORD;
  ...
BEGIN
  ...
  DELETE FROM messages WHERE conversation_id = conversation_record.id;
  GET DIAGNOSTICS deleted_count = deleted_count + ROW_COUNT;  -- ❌ ERRO
  ...
END;
```

**Depois:**
```sql
DECLARE
  deleted_count INTEGER := 0;
  rows_deleted INTEGER;  -- ✅ Nova variável
  conversation_record RECORD;
  ...
BEGIN
  ...
  DELETE FROM messages WHERE conversation_id = conversation_record.id;
  
  -- ✅ Primeiro obter ROW_COUNT
  GET DIAGNOSTICS rows_deleted = ROW_COUNT;
  
  -- ✅ Depois somar
  deleted_count := deleted_count + rows_deleted;
  ...
END;
```

### **Função `check_old_messages_on_insert()`**

Mesma correção aplicada + adicionado `rows_deleted` no log.

---

## 🚀 Como Aplicar

### **Opção 1: Aplicar Arquivo Corrigido (Recomendado)**

1. Acesse [Supabase Dashboard](https://supabase.com/dashboard) → SQL Editor
2. Copie e cole o arquivo **COMPLETO** corrigido:
   ```
   supabase_migrations/041_add_message_auto_cleanup.sql
   ```
3. Execute (Ctrl+Enter)

**✅ Benefício:** Arquivo completo e atualizado.

### **Opção 2: Aplicar Apenas a Correção**

Se já tentou aplicar a migration 041 e deu erro, execute este SQL para corrigir:

```sql
-- =====================================================
-- CORREÇÃO: Recriar função cleanup_old_messages()
-- =====================================================

CREATE OR REPLACE FUNCTION cleanup_old_messages()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER := 0;
  rows_deleted INTEGER;  -- ✅ Variável temporária
  conversation_record RECORD;
  last_message_date TIMESTAMP WITH TIME ZONE;
  cutoff_date TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Iterar sobre todas as conversas
  FOR conversation_record IN 
    SELECT id FROM conversations
  LOOP
    -- Buscar data da última mensagem desta conversa
    SELECT MAX(created_at) INTO last_message_date
    FROM messages
    WHERE conversation_id = conversation_record.id;
    
    -- Se não há mensagens, pular
    IF last_message_date IS NULL THEN
      CONTINUE;
    END IF;
    
    -- Calcular data de corte (30 dias após última mensagem)
    cutoff_date := last_message_date + INTERVAL '30 days';
    
    -- Se já passou o período de 30 dias, deletar todas as mensagens
    IF NOW() >= cutoff_date THEN
      -- Deletar mensagens desta conversa
      DELETE FROM messages
      WHERE conversation_id = conversation_record.id;
      
      -- ✅ Obter número de linhas deletadas
      GET DIAGNOSTICS rows_deleted = ROW_COUNT;
      
      -- ✅ Somar ao total
      deleted_count := deleted_count + rows_deleted;
      
      -- Deletar também a conversa vazia
      DELETE FROM conversations
      WHERE id = conversation_record.id;
    END IF;
  END LOOP;
  
  -- Registrar no log do sistema
  IF deleted_count > 0 THEN
    INSERT INTO system_logs (operation, details, created_at)
    VALUES (
      'cleanup_old_messages',
      jsonb_build_object(
        'deleted_count', deleted_count,
        'executed_at', NOW()
      ),
      NOW()
    );
  END IF;
  
  RETURN deleted_count;
END;
$$;

-- =====================================================
-- CORREÇÃO: Recriar função check_old_messages_on_insert()
-- =====================================================

CREATE OR REPLACE FUNCTION check_old_messages_on_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  last_msg_date TIMESTAMP WITH TIME ZONE;
  cutoff_date TIMESTAMP WITH TIME ZONE;
  rows_deleted INTEGER;  -- ✅ Variável temporária
BEGIN
  -- Buscar a última mensagem ANTES desta
  SELECT MAX(created_at) INTO last_msg_date
  FROM messages
  WHERE conversation_id = NEW.conversation_id
    AND id != NEW.id;
  
  -- Se há mensagem anterior
  IF last_msg_date IS NOT NULL THEN
    cutoff_date := last_msg_date + INTERVAL '30 days';
    
    -- Se passou mais de 30 dias, limpar mensagens antigas
    IF NOW() >= cutoff_date THEN
      -- Deletar mensagens antigas (exceto a nova)
      DELETE FROM messages
      WHERE conversation_id = NEW.conversation_id
        AND id != NEW.id;
      
      -- ✅ Obter número de linhas deletadas
      GET DIAGNOSTICS rows_deleted = ROW_COUNT;
      
      -- Log
      INSERT INTO system_logs (operation, details, created_at)
      VALUES (
        'auto_cleanup_on_insert',
        jsonb_build_object(
          'conversation_id', NEW.conversation_id,
          'last_message_date', last_msg_date,
          'triggered_by_message', NEW.id,
          'rows_deleted', rows_deleted
        ),
        NOW()
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;
```

---

## 🧪 Testar Após Correção

```sql
-- Teste 1: Verificar se a função existe
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name = 'cleanup_old_messages';

-- Esperado: 1 linha com type = 'FUNCTION'

-- Teste 2: Executar a função (deve retornar sem erro)
SELECT cleanup_old_messages();

-- Esperado: Retorna número (pode ser 0 se não há mensagens antigas)

-- Teste 3: Ver estatísticas
SELECT * FROM get_cleanup_stats();

-- Esperado: Retorna estatísticas do sistema
```

---

## ✅ Status

| Item | Status |
|------|--------|
| Erro identificado | ✅ Sim |
| Correção aplicada | ✅ Sim |
| Arquivo atualizado | ✅ `041_add_message_auto_cleanup.sql` |
| Testado | ⏳ Aguardando aplicação |

---

## 📚 Lição Aprendida

**PostgreSQL GET DIAGNOSTICS:**

```sql
-- ❌ ERRADO - Operação aritmética direta
GET DIAGNOSTICS var = var + ROW_COUNT;

-- ✅ CORRETO - Usar variável temporária
DECLARE temp_var INTEGER;
BEGIN
  GET DIAGNOSTICS temp_var = ROW_COUNT;
  var := var + temp_var;
END;
```

**Outros itens válidos para GET DIAGNOSTICS:**
- `ROW_COUNT` - Número de linhas afetadas
- `RESULT_OID` - OID do resultado
- `PG_CONTEXT` - Contexto da execução

---

**Correção aplicada em:** 4 de Novembro de 2025  
**Status:** ✅ Pronto para aplicar

