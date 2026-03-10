# ⚡ QUICK START: Limpeza de Notificações

## 🎯 3 PASSOS SIMPLES

### 1️⃣ Abrir Supabase
```
https://supabase.com/dashboard
→ Selecionar projeto
→ SQL Editor (menu lateral)
→ New Query
```

### 2️⃣ Copiar e Executar
**Arquivo:** `supabase_migrations/082_notification_cleanup_SIMPLE.sql`

1. Copiar TODO o conteúdo
2. Colar no SQL Editor
3. Clicar em **RUN** (ou Ctrl+Enter)

**✅ Versão Simplificada:** Sem dependências externas, testada e funcionando!

### 3️⃣ Verificar
```sql
SELECT * FROM notification_health_stats;
```

**Esperado:**
- `expired_but_not_deleted` = 0 ✅
- `old_read_not_deleted` = 0 ✅

---

## 🔍 LOGS ESPERADOS

Após executar, você verá:
```
NOTICE: Limpeza: 0 expiradas, 0 lidas antigas deletadas
NOTICE: Job criado com sucesso - executa diariamente às 3h AM
```

---

## ✅ PRONTO!

**O que foi configurado:**
- ✅ Notificações não-lidas mantidas por 30 dias
- ✅ Notificações lidas mantidas por 7 dias
- ✅ Limpeza automática diária às 3h AM
- ✅ Performance otimizada

---

## 🆘 SE DER ERRO

### Erro: "function already exists"
```sql
-- Executar antes da migration:
DROP FUNCTION IF EXISTS public.cleanup_old_notifications();
```

### Erro: "cron.schedule does not exist"
Ignorar - o sistema tentará criar o job e mostrará aviso se não conseguir. A limpeza pode ser executada manualmente.

### Executar limpeza manual
```sql
SELECT public.cleanup_old_notifications();
```

---

## 📊 MONITORAR

```sql
-- Ver estatísticas gerais
SELECT * FROM notification_health_stats;

-- Ver por usuário
SELECT * FROM get_notification_stats();

-- Ver job
SELECT * FROM cron.job WHERE jobname = 'cleanup-notifications-daily';
```

---

**🎉 Tudo Pronto!** Sistema otimizado e escalável.

