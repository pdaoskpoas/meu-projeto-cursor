# 🚀 Como Aplicar a Migration de Eventos

## Passo 1: Abrir SQL Editor

1. Acesse: **Supabase Dashboard**
2. Vá em: **SQL Editor** (menu lateral esquerdo)
3. Clique em: **New query**

## Passo 2: Copiar e Colar

1. Abra o arquivo: `supabase_migrations/073_APLICAR_AGORA.sql`
2. **Copie TODO o conteúdo** (Ctrl+A, Ctrl+C)
3. Cole no SQL Editor do Supabase
4. Clique em **Run** (ou Ctrl+Enter)

## Passo 3: Verificar Sucesso

Se tudo deu certo, você verá no console:
```
✅ Migration 073 aplicada com sucesso!
   - Pro: 1 publicação/mês
   - Elite: 2 publicações/mês
   - Limite: 1 evento ativo
   - Edição: 24h após publicação
```

## Passo 4: Configurar CRON Job (Opcional, mas Recomendado)

Execute este SQL separadamente:

```sql
SELECT cron.schedule(
  'reset-monthly-event-publications',
  '5 0 1 * *',
  'SELECT reset_monthly_event_publications();'
);
```

**OU** Configure manualmente:
- Database > Cron Jobs > New Cron Job
- Nome: `reset-monthly-event-publications`
- Schedule: `5 0 1 * *` (dia 1 às 00:05)
- Command: `SELECT reset_monthly_event_publications();`

## ✅ Pronto!

Após aplicar a migration, o sistema de cotas mensais estará funcionando:

- **Pro**: 1 evento/mês (não-recuperável)
- **Elite**: 2 eventos/mês (não-recuperável)  
- **Limite**: 1 evento ativo por vez
- **Edição**: 24h após publicação
- **Pagamento individual**: R$ 49,99/30 dias

---

## 🔍 Verificar se Funcionou

Execute no SQL Editor:

```sql
-- Ver estrutura da tabela profiles
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name LIKE '%event%';

-- Ver estrutura da tabela events
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'events' 
AND column_name = 'can_edit_until';

-- Testar função
SELECT can_create_event('SEU_USER_ID_AQUI');
```

---

## ❌ Se Der Erro

1. **Copie a mensagem de erro completa**
2. Verifique se copiou TODO o conteúdo do arquivo
3. Certifique-se de estar no projeto correto
4. Tente executar em partes menores (seção por seção)

---

**Desenvolvido com 💙 pela Cavalaria Digital**


