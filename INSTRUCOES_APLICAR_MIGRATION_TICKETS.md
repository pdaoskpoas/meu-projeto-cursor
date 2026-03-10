# Instruções para Aplicar Migration de Tickets de Suporte

## ⚠️ IMPORTANTE

O sistema de tickets foi implementado, mas a tabela `support_tickets` precisa ser criada no Supabase.

## 📋 Como Aplicar a Migration

### Opção 1: Via Supabase Dashboard (Recomendado)

1. Acesse o **Supabase Dashboard**
2. Vá para o seu projeto
3. Clique em **SQL Editor** no menu lateral
4. Clique em **New Query**
5. Copie e cole o conteúdo do arquivo `supabase_migrations/072_create_support_tickets_table.sql`
6. Clique em **Run** para executar a migration

### Opção 2: Via CLI do Supabase

```bash
# Certifique-se de estar no diretório do projeto
cd cavalaria-digital-showcase-main

# Execute a migration
supabase db push
```

## ✅ Verificação

Após aplicar a migration, verifique se a tabela foi criada:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'support_tickets';
```

Você deve ver a tabela `support_tickets` listada.

## 🎯 Funcionalidades Implementadas

### Para Usuários:
- ✅ Formulário de envio de tickets na página de ajuda (`/ajuda`)
- ✅ Categorização automática (Problema Técnico, Planos, Conta, Animais, Sociedades, Outros)
- ✅ Validação de campos obrigatórios
- ✅ Feedback visual ao enviar tickets
- ✅ Sistema de prioridade automática baseado em palavras-chave

### Para Administradores:
- ✅ Painel completo de gerenciamento em **Admin > Sistema de Tickets**
- ✅ Visualização de tickets por status (Abertos, Em Andamento, Fechados)
- ✅ Estatísticas detalhadas de tickets
- ✅ Mudança de status dos tickets
- ✅ Informações do usuário que criou o ticket
- ✅ Filtros e badges de prioridade

## 🔐 Políticas de Segurança (RLS)

A migration inclui políticas de Row Level Security:

- **Usuários:**
  - ✅ Podem ver apenas seus próprios tickets
  - ✅ Podem criar novos tickets
  - ✅ Podem atualizar seus próprios tickets

- **Administradores:**
  - ✅ Podem ver todos os tickets
  - ✅ Podem atualizar qualquer ticket
  - ✅ Podem deletar tickets

## 🎨 Sistema de Prioridades Automáticas

O sistema identifica automaticamente a prioridade dos tickets com base em palavras-chave:

- **URGENTE** 🔴: urgente, emergência, grave, crítico, bloqueado, não consigo acessar
- **ALTA** 🟠: importante, problema sério, bug, erro, falha
- **BAIXA** 🔵: dúvida, sugestão, melhoria

## 📊 Estrutura da Tabela

```sql
support_tickets (
  id UUID PRIMARY KEY,
  user_id UUID (FK profiles.id),
  subject TEXT (3-200 caracteres),
  category TEXT (technical, billing, account, animals, partnership, other),
  description TEXT (mínimo 10 caracteres),
  status TEXT (open, in_progress, closed, resolved, rejected),
  priority TEXT (low, normal, high, urgent),
  assigned_to UUID (FK profiles.id, nullable),
  admin_notes TEXT (nullable),
  resolved_at TIMESTAMPTZ (nullable),
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
```

## 🚀 Próximos Passos (Opcionais)

### Melhorias Futuras:
1. Sistema de respostas/comentários em tickets
2. Notificações por email quando o ticket é atualizado
3. Upload de anexos/screenshots nos tickets
4. Sistema de atribuição automática de tickets para admins
5. Histórico de mudanças de status
6. SLA (Service Level Agreement) tracking
7. Templates de respostas para admins

## 📝 Arquivos Modificados/Criados

- ✅ `supabase_migrations/072_create_support_tickets_table.sql` - Migration SQL
- ✅ `src/services/ticketService.ts` - Serviço de gerenciamento de tickets
- ✅ `src/pages/dashboard/HelpPage.tsx` - Formulário de envio (atualizado)
- ✅ `src/components/admin/tickets/AdminTickets.tsx` - Painel admin (atualizado)

## ❓ Problemas Comuns

### Erro: "permission denied for table support_tickets"
**Solução:** Verifique se as políticas RLS foram criadas corretamente.

### Erro: "relation 'support_tickets' does not exist"
**Solução:** A migration ainda não foi aplicada. Siga as instruções acima.

### Tickets não aparecem no painel admin
**Solução:** Verifique se o usuário tem `role = 'admin'` na tabela `profiles`.

## 📞 Testando o Sistema

1. **Como usuário comum:**
   - Acesse `/ajuda`
   - Preencha o formulário de ticket
   - Envie o ticket
   - Verifique a mensagem de sucesso

2. **Como administrador:**
   - Faça login como admin
   - Acesse **Admin > Sistema de Tickets**
   - Visualize os tickets enviados
   - Teste a mudança de status
   - Verifique as estatísticas

---

**✅ Após aplicar a migration, o sistema de tickets estará 100% funcional!**


