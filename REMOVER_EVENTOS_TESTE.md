# 🗑️ Remover Eventos de Teste

Este guia explica como remover todos os eventos de teste que foram publicados no sistema.

## 📋 O que será removido?

Todos os eventos que estão:
- Com `ad_status = 'active'` (publicados)
- OU com `published_at IS NOT NULL` (têm data de publicação)

## 🚀 Opção 1: Via Supabase Dashboard (Recomendado)

### Passo a Passo:

1. **Acesse o SQL Editor do Supabase:**
   ```
   https://supabase.com/dashboard/project/SEU_PROJETO/sql/new
   ```

2. **Abra o arquivo de migração:**
   ```
   supabase_migrations/095_remove_test_events.sql
   ```

3. **Copie TODO o conteúdo** do arquivo

4. **Cole no SQL Editor** do Supabase

5. **Clique em RUN** (▶️)

6. **Aguarde a confirmação:**
   - O script mostrará quantos eventos serão removidos
   - Listará os primeiros eventos
   - Confirmará a remoção ao final

### Resultado Esperado:

```
========================================
Removendo eventos de teste
Total de eventos a remover: X
Primeiros eventos: [lista de eventos]
========================================
========================================
✅ Eventos removidos: X
✅ Eventos publicados restantes: 0
========================================
```

---

## 🚀 Opção 2: Via Script Node.js

### Pré-requisitos:

1. Ter arquivo `.env.local` ou `.env` com:
   ```env
   VITE_SUPABASE_URL=sua_url_aqui
   VITE_SUPABASE_ANON_KEY=sua_chave_aqui
   # OU
   SUPABASE_SERVICE_ROLE_KEY=sua_service_key_aqui
   ```

### Execução:

```bash
node scripts/remove-test-events.mjs
```

### O que o script faz:

1. ✅ Busca todos os eventos no banco
2. ✅ Filtra eventos publicados (active ou com published_at)
3. ✅ Lista os eventos que serão removidos
4. ✅ Remove os eventos em lotes
5. ✅ Verifica o resultado final

---

## ⚠️ Importante

- **Backup:** Recomendado fazer backup antes (opcional, mas seguro)
- **Irreversível:** A remoção é permanente
- **Apenas eventos publicados:** Eventos em draft não serão removidos

---

## ✅ Verificação Pós-Remoção

Após executar, você pode verificar se funcionou:

```sql
-- Verificar quantos eventos publicados restam
SELECT COUNT(*) 
FROM events 
WHERE ad_status = 'active' OR published_at IS NOT NULL;

-- Deve retornar: 0
```

---

**Data de Criação:** 2025-01-XX  
**Arquivos Criados:**
- `supabase_migrations/095_remove_test_events.sql` (migração SQL)
- `scripts/remove-test-events.mjs` (script Node.js)
