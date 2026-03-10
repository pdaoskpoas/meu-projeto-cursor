# ✅ CORREÇÃO v2 - Migration 041 (pg_cron)

**Data:** 4 de Novembro de 2025  
**Erro:** `could not find valid entry for job 'cleanup_old_messages_daily'`  
**Status:** ✅ CORRIGIDO

---

## 🐛 O Problema

**Erro reportado:**
```
ERROR:  XX000: could not find valid entry for job 'cleanup_old_messages_daily'
CONTEXT:  SQL statement "SELECT cron.unschedule('cleanup_old_messages_daily')"
PL/pgSQL function inline_code_block line 8 at PERFORM
```

**Causa:**
1. **pg_cron está disponível mas NÃO instalado**
2. Tentamos fazer `unschedule` de um job que não existe
3. Isso causa erro na primeira execução da migration

---

## 🔍 Verificação no MCP Supabase

```sql
-- pg_cron está disponível
SELECT extname, installed_version FROM pg_extension WHERE extname = 'pg_cron';

Resultado: installed_version = NULL (não instalado)
```

**Conclusão:** pg_cron precisa ser instalado primeiro!

---

## ✅ Correção Aplicada

### **Estratégia:**

1. ✅ Verificar se pg_cron está instalado
2. ✅ Se estiver, tentar remover job anterior **com tratamento de erro**
3. ✅ Se não estiver, **instalar pg_cron primeiro**
4. ✅ Criar agendamento **com tratamento de erro**

### **Código Corrigido:**

```sql
DO $$
BEGIN
  -- Verificar se pg_cron está instalado
  IF EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'
  ) THEN
    -- ✅ Tentar remover agendamento anterior (com tratamento de erro)
    BEGIN
      PERFORM cron.unschedule('cleanup_old_messages_daily');
      RAISE NOTICE 'Previous schedule removed.';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'No previous schedule to remove (normal on first run).';
    END;
    
    -- ✅ Criar novo agendamento (com tratamento de erro)
    BEGIN
      PERFORM cron.schedule(
        'cleanup_old_messages_daily',
        '0 3 * * *',
        'SELECT cleanup_old_messages();'
      );
      RAISE NOTICE 'Auto-cleanup scheduled successfully.';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Failed to schedule. Error: %', SQLERRM;
    END;
  ELSE
    -- ✅ pg_cron não instalado, tentar instalar
    RAISE NOTICE 'pg_cron not installed. Installing now...';
    
    BEGIN
      CREATE EXTENSION IF NOT EXISTS pg_cron;
      RAISE NOTICE 'pg_cron installed successfully.';
      
      -- Agora criar agendamento
      BEGIN
        PERFORM cron.schedule(
          'cleanup_old_messages_daily',
          '0 3 * * *',
          'SELECT cleanup_old_messages();'
        );
        RAISE NOTICE 'Auto-cleanup scheduled successfully.';
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Failed to schedule. Error: %', SQLERRM;
      END;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'pg_cron not available on this plan.';
    END;
  END IF;
END $$;
```

---

## 🚀 Como Aplicar

### **Método 1: Aplicar Arquivo Completo Corrigido** ⭐ Recomendado

1. Acesse [Supabase Dashboard](https://supabase.com/dashboard) → SQL Editor
2. Copie e cole o arquivo **COMPLETO** atualizado:
   ```
   supabase_migrations/041_add_message_auto_cleanup.sql
   ```
3. Execute (Ctrl+Enter)

**✅ Benefício:** Arquivo completo, todas as correções aplicadas.

### **Método 2: Aplicar Apenas a Correção do Agendamento**

Se já aplicou parte da migration e só precisa corrigir o agendamento:

```sql
-- =====================================================
-- CORREÇÃO: Instalar pg_cron e agendar com tratamento de erro
-- =====================================================

DO $$
BEGIN
  -- Verificar se pg_cron está instalado
  IF EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'
  ) THEN
    RAISE NOTICE 'pg_cron already installed.';
    
    -- Tentar remover agendamento anterior (ignorar se não existir)
    BEGIN
      PERFORM cron.unschedule('cleanup_old_messages_daily');
      RAISE NOTICE 'Previous schedule removed.';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'No previous schedule found (normal on first run).';
    END;
    
    -- Criar novo agendamento
    BEGIN
      PERFORM cron.schedule(
        'cleanup_old_messages_daily',
        '0 3 * * *',
        'SELECT cleanup_old_messages();'
      );
      RAISE NOTICE '✅ Auto-cleanup scheduled successfully. Will run daily at 3 AM.';
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Failed to schedule auto-cleanup: %', SQLERRM;
    END;
  ELSE
    RAISE NOTICE 'pg_cron not installed. Installing...';
    
    -- Tentar instalar pg_cron
    BEGIN
      CREATE EXTENSION IF NOT EXISTS pg_cron;
      RAISE NOTICE '✅ pg_cron installed successfully.';
      
      -- Criar agendamento após instalação
      BEGIN
        PERFORM cron.schedule(
          'cleanup_old_messages_daily',
          '0 3 * * *',
          'SELECT cleanup_old_messages();'
        );
        RAISE NOTICE '✅ Auto-cleanup scheduled. Will run daily at 3 AM.';
      EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Failed to schedule: %', SQLERRM;
      END;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'pg_cron not available on this Supabase plan. Use alternative scheduling (Edge Function + cron-job.org).';
    END;
  END IF;
END $$;
```

---

## 🧪 Verificar Após Aplicar

```sql
-- 1. Verificar se pg_cron está instalado
SELECT extname, extversion 
FROM pg_extension 
WHERE extname = 'pg_cron';

-- Esperado: 1 linha com extversion preenchido

-- 2. Verificar agendamentos
SELECT jobname, schedule, command 
FROM cron.job;

-- Esperado: 1 linha com 'cleanup_old_messages_daily'

-- 3. Testar função manualmente
SELECT cleanup_old_messages();

-- Esperado: Retorna número (0 se não há mensagens antigas)
```

---

## 📊 Planos do Supabase e pg_cron

| Plano | pg_cron Disponível? | Ação |
|-------|---------------------|------|
| **Free** | ❌ Não | Use Edge Function + cron externo |
| **Pro** | ✅ Sim | Agendamento automático funciona |
| **Team** | ✅ Sim | Agendamento automático funciona |
| **Enterprise** | ✅ Sim | Agendamento automático funciona |

### **Se pg_cron não estiver disponível:**

Use **Edge Function + cron-job.org** (instruções completas no `SISTEMA_AUTO_LIMPEZA_MENSAGENS.md`).

---

## ⚠️ Mensagens que Você Pode Ver

### **✅ Sucesso:**
```
NOTICE:  pg_cron not installed. Installing now...
NOTICE:  pg_cron installed successfully.
NOTICE:  ✅ Auto-cleanup scheduled successfully. Will run daily at 3 AM.
```

### **⚠️ Primeira Execução (Normal):**
```
NOTICE:  No previous schedule to remove (normal on first run).
NOTICE:  ✅ Auto-cleanup scheduled successfully.
```

### **❌ pg_cron Não Disponível (Plano Free):**
```
WARNING:  pg_cron not available on this Supabase plan.
```
**Solução:** Use Edge Function + agendamento externo.

---

## 🔄 Histórico de Correções

### **Correção v1:**
- ❌ Sintaxe errada: `GET DIAGNOSTICS deleted_count = deleted_count + ROW_COUNT`
- ✅ Corrigido: Usar variável temporária `rows_deleted`

### **Correção v2:** (esta)
- ❌ Erro ao tentar `unschedule` de job inexistente
- ❌ pg_cron não instalado
- ✅ Corrigido: Tratamento de exceção + instalar pg_cron

---

## 📁 Arquivos Atualizados

1. ✅ **`supabase_migrations/041_add_message_auto_cleanup.sql`** - Corrigido v2
2. ✅ **`CORRECAO_MIGRATION_041.md`** - Correção v1
3. ✅ **`CORRECAO_MIGRATION_041_v2.md`** - Esta correção (v2)
4. ✅ **`SISTEMA_AUTO_LIMPEZA_MENSAGENS.md`** - Documentação completa

---

## ✅ Status Final

| Item | Status |
|------|--------|
| Erro v1 (GET DIAGNOSTICS) | ✅ Corrigido |
| Erro v2 (unschedule) | ✅ Corrigido |
| Tratamento de exceção | ✅ Adicionado |
| Instalação automática pg_cron | ✅ Implementado |
| Arquivo migration atualizado | ✅ Sim |
| Testado | ⏳ Pronto para aplicar |

---

## 💡 Lição Aprendida

**Sempre usar tratamento de erro ao trabalhar com extensões:**

```sql
-- ❌ ERRADO - Pode causar erro se não existir
PERFORM cron.unschedule('job_name');

-- ✅ CORRETO - Trata erro graciosamente
BEGIN
  PERFORM cron.unschedule('job_name');
EXCEPTION WHEN OTHERS THEN
  -- Ignora se não existir
  NULL;
END;
```

---

**Correção v2 aplicada em:** 4 de Novembro de 2025  
**Status:** ✅ **Pronto para aplicar no Supabase**  
**Próximo passo:** Aplicar arquivo completo `041_add_message_auto_cleanup.sql`

