# 🚀 Aplicar Migration: Sistema de Respostas de Tickets

## 📋 Instruções para aplicar a migration no Supabase

### 1. Acesse o Supabase Dashboard
- Vá para: [https://app.supabase.com](https://app.supabase.com)
- Faça login na sua conta
- Selecione o projeto **cavalaria-digital**

### 2. Acesse o SQL Editor
- No menu lateral esquerdo, clique em **SQL Editor**
- Clique em **+ New query** para criar uma nova query

### 3. Cole o SQL da Migration
- Abra o arquivo: `supabase_migrations/039_add_ticket_responses.sql`
- Copie TODO o conteúdo do arquivo
- Cole no editor SQL do Supabase

### 4. Execute a Migration
- Clique no botão **Run** (ou pressione `Ctrl+Enter` / `Cmd+Enter`)
- Aguarde a execução (deve levar alguns segundos)
- Verifique se não há erros na saída

### 5. Verifique se a migration foi aplicada com sucesso

Execute estas queries para verificar:

```sql
-- Verificar se a tabela ticket_responses foi criada
SELECT * FROM information_schema.tables 
WHERE table_name = 'ticket_responses';

-- Verificar se a função respond_to_ticket foi criada
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name = 'respond_to_ticket';

-- Verificar se o trigger foi criado
SELECT trigger_name 
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_set_ticket_priority';
```

### 6. O que foi criado?

Esta migration adiciona:

✅ **Tabela `ticket_responses`**: Armazena todas as respostas dos administradores aos tickets
- Suporta múltiplas respostas por ticket
- Registra qual admin respondeu e quando
- Permite alterar o status do ticket ao responder

✅ **Função `respond_to_ticket()`**: Função para responder tickets de forma consistente
- Cria a resposta no banco
- Atualiza o status do ticket (se fornecido)
- Cria notificação automática para o usuário
- Tudo em uma única transação

✅ **Trigger `trigger_set_ticket_priority`**: Define prioridade automática baseada no plano
- Usuários com planos pagos (não "free") = prioridade **ALTA**
- Usuários com plano "free" = prioridade **NORMAL**

✅ **Políticas RLS**: Controle de acesso
- Usuários podem ver respostas dos seus próprios tickets
- Admins podem ver e criar respostas em todos os tickets

✅ **Novo tipo de notificação**: `ticket_response`
- Usuários são notificados quando um admin responde
- Aparece no dashboard em "Atividade Recente"
- Aparece na página de "Notificações"

### 7. Teste após aplicar

1. Faça login como **Admin**: `adm@gmail.com` / `12345678`
2. Vá para **Sistema de Tickets**
3. Clique em **Responder** em algum ticket
4. Escreva uma resposta e escolha o status
5. Envie a resposta
6. Faça logout e login como usuário que criou o ticket
7. Vá para **Ajuda** e verifique se a resposta aparece
8. Verifique se a notificação apareceu em **Atividade Recente**

---

## 🎯 Funcionalidades Implementadas

### Para o Administrador:
- ✅ **Modal de Resposta**: Botão "Responder" em cada ticket
- ✅ **Múltiplas Respostas**: Pode enviar várias mensagens no mesmo ticket
- ✅ **Ver Histórico**: Visualiza todas as respostas anteriores ao responder
- ✅ **Escolher Status**: Ao responder, escolhe entre "Em Andamento" ou "Concluído"
- ✅ **Filtros**: Ver tickets Abertos + Em Andamento (padrão) ou Concluídos (opcional)

### Para o Usuário:
- ✅ **Meus Tickets**: Nova seção na página de Ajuda
- ✅ **Ver Status**: Visualiza status atual de cada ticket (Aberto, Em Andamento, Concluído)
- ✅ **Ver Respostas**: Lê todas as respostas da equipe de suporte
- ✅ **Notificações**: Recebe notificação quando há resposta
- ✅ **Link Direto**: Notificação leva direto para /ajuda

### Prioridade Automática:
- ✅ Usuários pagos (bronze, silver, gold, platinum) = **Prioridade ALTA**
- ✅ Usuários free = **Prioridade NORMAL**

---

## 🔄 Após Aplicar a Migration

Reinicie o servidor de desenvolvimento para garantir que tudo está sincronizado:

```bash
# Parar o servidor atual (Ctrl+C)
# Reiniciar:
npm run dev
```

---

## ⚠️ Problemas Comuns

### Erro: "relation ticket_responses already exists"
- Já foi aplicada anteriormente
- Não precisa aplicar novamente

### Erro: "function respond_to_ticket already exists"
- Use `CREATE OR REPLACE FUNCTION` ou delete a função antiga primeiro

### Erro: "constraint notifications_type_check already exists"
- A migration já possui tratamento para isso
- Se persistir, delete manualmente: `ALTER TABLE notifications DROP CONSTRAINT notifications_type_check;`

---

✅ **Migration pronta para uso!**

