# 🧹 SISTEMA DE AUTO-LIMPEZA DE MENSAGENS

**Data:** 4 de Novembro de 2025  
**Migration:** 041  
**Status:** ✅ Implementado

---

## 📋 RESUMO

Sistema automático que **delete mensagens e conversas** após **30 dias** da última mensagem enviada na conversa.

### **Regra:**
```
Última mensagem enviada: 01/01/2025
Data de limpeza: 31/01/2025 (30 dias depois)
Ação: Deletar todas as mensagens da conversa + conversa vazia
```

---

## ⚙️ COMO FUNCIONA

### **Função Principal: `cleanup_old_messages()`**

Esta função:
1. ✅ Itera sobre todas as conversas
2. ✅ Verifica data da última mensagem de cada conversa
3. ✅ Se passou 30 dias → Delete todas as mensagens
4. ✅ Delete também a conversa (agora vazia)
5. ✅ Registra no log do sistema

**Exemplo:**

```sql
-- Executar limpeza manualmente
SELECT cleanup_old_messages();

-- Resultado: Número de mensagens deletadas
```

---

## 🤖 AGENDAMENTO AUTOMÁTICO

### **Opção 1: pg_cron (Supabase Pro)** ⭐ Recomendado

Se você tem **Supabase Pro**, a migration já configura automaticamente:

✅ **Agendamento:** Todos os dias às **3h da manhã**  
✅ **Comando:** `SELECT cleanup_old_messages();`  
✅ **Status:** Verificar com:

```sql
-- Ver agendamentos do pg_cron
SELECT * FROM cron.job;
```

### **Opção 2: Edge Function + Cron Externo** (Supabase Free)

Se você tem **Supabase Free**, você precisa agendar externamente:

#### **Passo 1: Criar Edge Function**

```typescript
// supabase/functions/cleanup-messages/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
  
  // Executar limpeza
  const { data, error } = await supabase
    .rpc('cleanup_old_messages');
  
  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500 }
    );
  }
  
  return new Response(
    JSON.stringify({ 
      success: true, 
      deleted_count: data 
    }),
    { status: 200 }
  );
});
```

#### **Passo 2: Agendar com Serviço Externo**

**Opção A - cron-job.org (Grátis):**
1. Acesse [https://cron-job.org](https://cron-job.org)
2. Crie conta gratuita
3. Adicione novo job:
   - **URL:** `https://seu-projeto.supabase.co/functions/v1/cleanup-messages`
   - **Schedule:** Diário às 3h
   - **Headers:** `Authorization: Bearer YOUR_ANON_KEY`

**Opção B - GitHub Actions:**

```yaml
# .github/workflows/cleanup-messages.yml
name: Cleanup Old Messages

on:
  schedule:
    - cron: '0 3 * * *'  # Diário às 3h UTC

jobs:
  cleanup:
    runs-on: ubuntu-latest
    steps:
      - name: Call Supabase Function
        run: |
          curl -X POST \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_ANON_KEY }}" \
            https://seu-projeto.supabase.co/functions/v1/cleanup-messages
```

### **Opção 3: Manual** (Não Recomendado)

Executar periodicamente via SQL Editor:

```sql
SELECT cleanup_old_messages();
```

---

## 📊 MONITORAMENTO

### **Ver Conversas que Serão Limpas**

```sql
-- Ver todas as conversas e status de limpeza
SELECT * FROM conversations_to_cleanup;

-- Ver apenas as que já devem ser limpas
SELECT * FROM conversations_to_cleanup 
WHERE should_cleanup = true;
```

**Colunas:**
- `conversation_id` - ID da conversa
- `animal_name` - Nome do animal
- `last_message_date` - Data da última mensagem
- `days_since_last_message` - Quantos dias desde última mensagem
- `message_count` - Quantidade de mensagens na conversa
- `should_cleanup` - Se já deve ser limpa (true/false)
- `cleanup_date` - Data prevista para limpeza

### **Ver Estatísticas Gerais**

```sql
SELECT * FROM get_cleanup_stats();
```

**Retorna:**
- `total_conversations` - Total de conversas
- `conversations_to_cleanup` - Conversas que já devem ser limpas
- `total_messages` - Total de mensagens
- `messages_to_cleanup` - Mensagens que serão deletadas
- `oldest_message_date` - Mensagem mais antiga do sistema
- `estimated_cleanup_date` - Próxima data de limpeza

### **Ver Logs de Limpeza**

```sql
-- Ver últimos 10 logs de limpeza
SELECT * 
FROM system_logs 
WHERE operation IN ('cleanup_old_messages', 'auto_cleanup_on_insert')
ORDER BY created_at DESC 
LIMIT 10;
```

---

## 🛠️ LIMPEZA MANUAL (Admin)

Apenas administradores podem executar limpeza manual:

### **Passo 1: Visualizar o que será deletado**

```sql
SELECT * FROM manual_cleanup_messages(false);
```

**Retorna:**
```
conversations_affected | messages_deleted | success | message
-----------------------|------------------|---------|--------
5                      | 127              | false   | Para confirmar...
```

### **Passo 2: Confirmar e executar**

```sql
SELECT * FROM manual_cleanup_messages(true);
```

**Retorna:**
```
conversations_affected | messages_deleted | success | message
-----------------------|------------------|---------|--------
5                      | 127              | true    | Limpeza executada com sucesso...
```

---

## 🧪 TESTES

### **Teste 1: Criar Conversa Antiga**

```sql
-- Criar conversa de teste
INSERT INTO conversations (animal_id, animal_owner_id, interested_user_id, created_at)
VALUES (
  'animal-id-aqui',
  'owner-id-aqui',
  'user-id-aqui',
  NOW() - INTERVAL '31 days'  -- 31 dias atrás
);

-- Adicionar mensagem antiga
INSERT INTO messages (conversation_id, sender_id, content, created_at)
VALUES (
  'conversation-id-gerado',
  'user-id-aqui',
  'Mensagem de teste antiga',
  NOW() - INTERVAL '31 days'
);
```

### **Teste 2: Verificar na View**

```sql
-- Deve aparecer com should_cleanup = true
SELECT * FROM conversations_to_cleanup
WHERE conversation_id = 'conversation-id-gerado';
```

### **Teste 3: Executar Limpeza**

```sql
-- Executar
SELECT cleanup_old_messages();

-- Verificar se foi deletada
SELECT * FROM messages WHERE conversation_id = 'conversation-id-gerado';
-- Deve retornar 0 linhas
```

---

## ⚠️ AVISOS IMPORTANTES

### **1. Não Há Recuperação**

⚠️ **ATENÇÃO:** Mensagens deletadas **NÃO PODEM SER RECUPERADAS!**

- Não há backup automático
- Não há "lixeira"
- Delete é permanente

**Recomendação:** Configure backup do banco de dados antes de ativar.

### **2. Soft Delete vs Hard Delete**

Esta limpeza faz **HARD DELETE** (delete físico do banco).

Se você implementou **Soft Delete** (migration 039), as mensagens "ocultas" também serão deletadas após 30 dias.

### **3. Conversas Sem Mensagens**

Conversas que nunca tiveram mensagens **NÃO SÃO DELETADAS**.

Apenas conversas com mensagens antigas são afetadas.

### **4. Performance**

A função itera sobre todas as conversas. Em sistemas com muitas conversas (10.000+), pode demorar.

**Otimização possível:**
```sql
-- Limitar processamento por execução
CREATE OR REPLACE FUNCTION cleanup_old_messages(batch_size INTEGER DEFAULT 100)
...
```

---

## 📁 ARQUIVOS CRIADOS

1. **`supabase_migrations/041_add_message_auto_cleanup.sql`**
   - Função `cleanup_old_messages()`
   - Agendamento pg_cron (se disponível)
   - View `conversations_to_cleanup`
   - Função `get_cleanup_stats()`
   - Função `manual_cleanup_messages()`

2. **`SISTEMA_AUTO_LIMPEZA_MENSAGENS.md`** (este arquivo)
   - Documentação completa
   - Guias de uso
   - Exemplos

---

## 🔄 APLICAÇÃO

### **Passo 1: Executar Migration**

No Supabase Dashboard → SQL Editor:

```sql
-- Copiar e colar o conteúdo de:
-- supabase_migrations/041_add_message_auto_cleanup.sql
```

### **Passo 2: Verificar Agendamento**

```sql
-- Se pg_cron disponível:
SELECT * FROM cron.job;

-- Deve aparecer: cleanup_old_messages_daily
```

### **Passo 3: Monitorar**

```sql
-- Ver status
SELECT * FROM get_cleanup_stats();

-- Ver conversas a serem limpas
SELECT * FROM conversations_to_cleanup WHERE should_cleanup = true;
```

---

## 🎯 CASOS DE USO

### **Caso 1: Conversa Abandonada**

```
01/01/2025 - Última mensagem
31/01/2025 - Sistema deleta automaticamente
```

### **Caso 2: Conversa Ativa**

```
01/01/2025 - Mensagem 1
15/01/2025 - Mensagem 2
20/01/2025 - Mensagem 3
→ Contador sempre reseta
→ Nunca é deletada enquanto houver atividade
```

### **Caso 3: Usuário Apagou Mensagem**

```
Usuário A oculta mensagem (soft delete)
→ Mensagem continua no banco com hidden_for_sender = true
→ Após 30 dias, limpeza automática deleta fisicamente
```

---

## 🔧 CUSTOMIZAÇÃO

### **Alterar Período de 30 Dias**

Editar na migration:

```sql
-- Trocar INTERVAL '30 days' por outro período
-- Exemplo: 60 dias
cutoff_date := last_message_date + INTERVAL '60 days';
```

### **Manter Conversas, Deletar Apenas Mensagens**

Comentar linha de delete da conversa:

```sql
-- DELETE FROM conversations
-- WHERE id = conversation_record.id;
```

### **Deletar Apenas Mensagens Antigas de uma Conversa**

Modificar para manter mensagens recentes:

```sql
-- Deletar apenas mensagens com mais de 30 dias
-- (ao invés de deletar todas quando passa 30 dias)
DELETE FROM messages
WHERE conversation_id = conversation_record.id
  AND created_at < NOW() - INTERVAL '30 days';
```

---

## ✅ CHECKLIST DE VALIDAÇÃO

Após aplicar a migration:

- [ ] Migration 041 executada sem erros
- [ ] Função `cleanup_old_messages()` existe
- [ ] View `conversations_to_cleanup` funciona
- [ ] Função `get_cleanup_stats()` retorna dados
- [ ] Agendamento pg_cron criado (ou configurar alternativa)
- [ ] Testar limpeza manual com conversa antiga
- [ ] Verificar logs após limpeza

---

## 📚 Referências

- **Migration:** `supabase_migrations/041_add_message_auto_cleanup.sql`
- **pg_cron Docs:** [https://supabase.com/docs/guides/database/extensions/pg_cron](https://supabase.com/docs/guides/database/extensions/pg_cron)
- **Edge Functions:** [https://supabase.com/docs/guides/functions](https://supabase.com/docs/guides/functions)

---

**Sistema criado em:** 4 de Novembro de 2025  
**Status:** ✅ Pronto para uso  
**Período de Limpeza:** 30 dias após última mensagem

