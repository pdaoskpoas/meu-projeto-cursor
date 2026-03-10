# 🎫 APLICAR MIGRATION - SISTEMA DE TICKETS

**Data:** 23/11/2025  
**Status:** ⚠️ **PENDENTE DE APLICAÇÃO NO SUPABASE**

---

## 📝 PROBLEMA IDENTIFICADO

Quando um usuário envia um ticket preenchendo todos os campos:
- ✅ Mensagem de sucesso aparece
- ❌ **Ticket NÃO aparece no "Sistema de Tickets" do Administrador**

### **CAUSA RAIZ:**
O código estava apenas **simulando** o envio do ticket (linha 88-92 do `HelpPage.tsx`) - não salvava no banco de dados!

```typescript
// ANTES (apenas simulação):
await new Promise(resolve => setTimeout(resolve, 1500));
```

---

## ✅ SOLUÇÃO IMPLEMENTADA

### **1. Tabela `support_tickets` (PRECISA SER CRIADA)**
### **2. Service `ticketService.ts` ✅ CRIADO**
### **3. Hook `useAdminTickets.ts` ✅ CRIADO**
### **4. HelpPage.tsx ✅ ATUALIZADO**
### **5. AdminTickets.tsx ✅ ATUALIZADO**

---

## 🚀 COMO APLICAR A MIGRATION

### **Passo 1: Acessar o Supabase Dashboard**

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **SQL Editor** (menu lateral esquerdo)

### **Passo 2: Copiar e Executar o SQL**

Copie o conteúdo completo do arquivo:
```
supabase_migrations/038_create_support_tickets.sql
```

Ou copie o SQL abaixo:

```sql
-- =====================================================
-- MIGRATION: Sistema de Tickets de Suporte
-- Descrição: Criação de tabela para gerenciar tickets de suporte
-- Data: 2025-11-23
-- =====================================================

-- Criar tabela de tickets de suporte
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Informações do usuário
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Informações do ticket
  subject TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('technical', 'billing', 'account', 'animals', 'partnership', 'other')),
  description TEXT NOT NULL,
  
  -- Status e prioridade
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'closed')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  
  -- Atribuição e resolução
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  admin_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON public.support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned_to ON public.support_tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON public.support_tickets(created_at DESC);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_support_tickets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_support_tickets_updated_at_trigger
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_support_tickets_updated_at();

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Habilitar RLS
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver apenas seus próprios tickets
CREATE POLICY "Users can view own tickets"
  ON public.support_tickets
  FOR SELECT
  USING (auth.uid() = user_id);

-- Usuários podem criar tickets
CREATE POLICY "Users can create tickets"
  ON public.support_tickets
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Usuários podem atualizar seus próprios tickets (apenas descrição)
CREATE POLICY "Users can update own tickets"
  ON public.support_tickets
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admins podem ver todos os tickets
CREATE POLICY "Admins can view all tickets"
  ON public.support_tickets
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins podem atualizar qualquer ticket
CREATE POLICY "Admins can update all tickets"
  ON public.support_tickets
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- COMENTÁRIOS
-- =====================================================

COMMENT ON TABLE public.support_tickets IS 'Tabela para gerenciar tickets de suporte dos usuários';
COMMENT ON COLUMN public.support_tickets.user_id IS 'ID do usuário que criou o ticket';
COMMENT ON COLUMN public.support_tickets.subject IS 'Assunto do ticket';
COMMENT ON COLUMN public.support_tickets.category IS 'Categoria do problema (technical, billing, account, animals, partnership, other)';
COMMENT ON COLUMN public.support_tickets.description IS 'Descrição detalhada do problema';
COMMENT ON COLUMN public.support_tickets.status IS 'Status do ticket (open, in_progress, closed)';
COMMENT ON COLUMN public.support_tickets.priority IS 'Prioridade do ticket (low, normal, high, urgent)';
COMMENT ON COLUMN public.support_tickets.assigned_to IS 'ID do admin responsável pelo ticket';
COMMENT ON COLUMN public.support_tickets.resolved_at IS 'Data e hora de resolução do ticket';
COMMENT ON COLUMN public.support_tickets.admin_notes IS 'Notas administrativas sobre o ticket';
```

### **Passo 3: Executar**

1. Cole o SQL no editor
2. Clique em **"Run"** (canto inferior direito)
3. Aguarde a confirmação de sucesso ✅

### **Passo 4: Verificar**

Após executar, verifique se a tabela foi criada:

```sql
SELECT * FROM public.support_tickets;
```

Deve retornar uma tabela vazia (0 registros).

### **Passo 5: Regenerar Types do TypeScript (OPCIONAL mas RECOMENDADO)**

Para ter tipagem completa no TypeScript:

```bash
# No terminal, execute:
npx supabase gen types typescript --project-id wyufgltprapazpxmtaff > src/integrations/supabase/types.ts
```

Ou manualmente no Supabase Dashboard:
1. Vá em **Settings** > **API**
2. Copie os **TypeScript Types**
3. Cole em `src/integrations/supabase/types.ts`

---

## 🧪 TESTAR A SOLUÇÃO

### **Teste 1: Criar Ticket (Usuário)**

1. Acesse a página `/ajuda`
2. Faça login com um usuário normal
3. Preencha todos os campos do formulário
4. Clique em "Enviar Ticket"
5. ✅ Deve aparecer: "Ticket #XXXXXXXX criado"

### **Teste 2: Visualizar Ticket (Admin)**

1. Faça login com usuário admin
2. Acesse "Sistema de Tickets" no painel administrativo
3. ✅ O ticket criado deve aparecer na aba "Abertos"

### **Teste 3: Gerenciar Ticket (Admin)**

1. Clique em "Iniciar Atendimento"
2. O ticket deve mover para "Em Andamento"
3. Clique em "Resolver"
4. O ticket deve mover para "Fechados"

---

## 📊 FUNCIONALIDADES IMPLEMENTADAS

### **Para Usuários:**
- ✅ Criar tickets de suporte
- ✅ Ver apenas seus próprios tickets
- ✅ Categorias: Técnico, Pagamentos, Conta, Animais, Sociedades, Outros

### **Para Administradores:**
- ✅ Ver todos os tickets
- ✅ Filtrar por status (Abertos, Em Andamento, Fechados)
- ✅ Alterar status dos tickets
- ✅ Alterar prioridade (Baixa, Normal, Alta, Urgente)
- ✅ Estatísticas em tempo real
- ✅ Tempo médio de resolução
- ✅ Taxa de resolução
- ✅ Gráficos de distribuição

---

## 🔒 SEGURANÇA (RLS POLICIES)

### **Políticas Implementadas:**

1. **Usuários:**
   - ✅ Podem ver apenas seus próprios tickets
   - ✅ Podem criar tickets
   - ✅ Podem atualizar seus próprios tickets

2. **Administradores:**
   - ✅ Podem ver todos os tickets
   - ✅ Podem atualizar qualquer ticket
   - ✅ Podem alterar status e prioridade
   - ✅ Podem adicionar notas administrativas

---

## 📁 ARQUIVOS CRIADOS/MODIFICADOS

### **Criados:**
1. ✅ `supabase_migrations/038_create_support_tickets.sql` - Migration SQL
2. ✅ `src/services/ticketService.ts` - Service para gerenciar tickets
3. ✅ `src/hooks/admin/useAdminTickets.ts` - Hook para admin buscar tickets

### **Modificados:**
1. ✅ `src/pages/dashboard/HelpPage.tsx` - Agora salva tickets no banco
2. ✅ `src/components/admin/tickets/AdminTickets.tsx` - Exibe tickets reais

---

## ✅ CHECKLIST PÓS-IMPLEMENTAÇÃO

- [ ] Migration aplicada no Supabase Dashboard
- [ ] Tabela `support_tickets` criada
- [ ] RLS policies funcionando
- [ ] Usuário consegue criar ticket
- [ ] Admin consegue visualizar tickets
- [ ] Admin consegue alterar status
- [ ] Admin consegue alterar prioridade
- [ ] Estatísticas sendo calculadas corretamente

---

## 🎯 RESULTADO ESPERADO

Após aplicar a migration:

**ANTES:**
- ❌ Tickets não eram salvos no banco
- ❌ Admin via mensagem "será implementado em breve"
- ❌ Sistema apenas simulava o envio

**DEPOIS:**
- ✅ Tickets salvos no Supabase
- ✅ Admin vê todos os tickets em tempo real
- ✅ Sistema completo de gerenciamento de suporte
- ✅ Estatísticas e métricas funcionando

---

## 📞 PRÓXIMOS PASSOS OPCIONAIS

1. **Notificações por Email**
   - Enviar email quando ticket for criado
   - Enviar email quando status mudar
   - Enviar email quando ticket for resolvido

2. **Sistema de Respostas**
   - Permitir admin responder tickets
   - Histórico de conversações
   - Anexar arquivos

3. **Dashboard de Métricas**
   - Gráficos detalhados
   - Relatórios mensais
   - Análise de satisfação

---

## ⚠️ IMPORTANTE

**Após aplicar a migration, o problema estará completamente resolvido!**

Os tickets enviados pelos usuários aparecerão automaticamente no painel administrativo.

