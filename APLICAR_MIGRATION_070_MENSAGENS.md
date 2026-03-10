# 🚀 Aplicar Migration 070 - Sistema de Mensagens Completo

**Data:** 24 de Novembro de 2025  
**Status:** ⚠️ **AGUARDANDO APLICAÇÃO**

---

## 📝 O que foi implementado

### ✅ Funcionalidades Concluídas:

1. **Contador de Conversas Não Lidas**
   - O menu lateral agora mostra o número de CONVERSAS com mensagens não lidas
   - Se 3 pessoas diferentes enviarem mensagens, aparece "3" ao lado de "Mensagens"
   - Ao abrir uma conversa, o contador diminui automaticamente

2. **Marcação de Lida Automática**
   - Ao abrir qualquer conversa, todas as mensagens são marcadas como lidas
   - O contador é atualizado em tempo real

3. **Botão "Ver Perfil"**
   - Clicando no botão, o usuário é redirecionado para `/perfil/:userId`
   - Mostra o perfil da pessoa com quem está conversando

4. **Botão "Ver Animal"**
   - Clicando no botão, o usuário é redirecionado para `/animal/:animalId`
   - Mostra a página individual do animal sobre o qual estão conversando

5. **Sistema de Denúncias Completo**
   - **Denunciar Mensagens:** Botão no menu da conversa permite denunciar conversas/mensagens
   - **Denunciar Anúncios:** Botão "Denunciar anúncio" na página individual do animal
   - Todas as denúncias vão para a tabela `reports` no banco de dados
   - Visíveis no painel do administrador

6. **Exclusão de Conversa (Soft Delete)**
   - Botão "Excluir conversa" remove a conversa apenas para quem clicou
   - O outro usuário ainda tem acesso às mensagens
   - Para deletar completamente, ambos precisam clicar em excluir

---

## ⚙️ Migration Necessária

**Arquivo:** `supabase_migrations/070_add_soft_delete_conversations.sql`

### Como Aplicar:

1. Acesse: [Supabase Dashboard - SQL Editor](https://supabase.com/dashboard/project/YOUR_PROJECT/sql)

2. Copie e execute o SQL abaixo:

```sql
-- =====================================================
-- MIGRATION: Soft Delete para Conversas
-- Descrição: Adiciona suporte para exclusão suave de conversas
-- Data: 2025-11-24
-- =====================================================

-- Adicionar campo deleted_for_users à tabela conversations
ALTER TABLE public.conversations
ADD COLUMN IF NOT EXISTS deleted_for_users UUID[] DEFAULT '{}';

-- Comentário
COMMENT ON COLUMN public.conversations.deleted_for_users IS 'Array de IDs de usuários que excluíram esta conversa (soft delete)';

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_conversations_deleted_for_users ON public.conversations USING GIN (deleted_for_users);

-- =====================================================
-- ATUALIZAR VIEWS E FUNÇÕES
-- =====================================================

-- Criar função auxiliar para verificar se conversa foi deletada pelo usuário
CREATE OR REPLACE FUNCTION is_conversation_deleted_for_user(
  p_conversation_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_deleted_for UUID[];
BEGIN
  SELECT deleted_for_users INTO v_deleted_for
  FROM public.conversations
  WHERE id = p_conversation_id;
  
  IF v_deleted_for IS NULL THEN
    RETURN FALSE;
  END IF;
  
  RETURN p_user_id = ANY(v_deleted_for);
END;
$$;

-- Comentário
COMMENT ON FUNCTION is_conversation_deleted_for_user IS 'Verifica se uma conversa foi deletada (soft delete) por um usuário específico';
```

3. Clique em **"Run"** para executar a migration

---

## 🧪 Testando o Sistema

### Contas de Teste:

- **Administrador:** adm@gmail.com / 12345678
- **Haras Monteiro:** monteiro@gmail.com / 12345678
- **Haras Tonho:** tonho@gmail.com / 12345678

### Fluxo de Teste:

1. **Login com Haras Monteiro**
   - Navegar até um anúncio do Haras Tonho
   - Clicar em "Enviar Mensagem"
   - Enviar algumas mensagens

2. **Login com Haras Tonho**
   - Verificar contador de mensagens no menu lateral (deve mostrar "1")
   - Abrir a conversa com Monteiro
   - Contador deve diminuir para "0"
   - Responder as mensagens

3. **Testar Botões:**
   - **Ver Perfil:** Verificar se vai para `/perfil/:userId` correto
   - **Ver Animal:** Verificar se vai para `/animal/:animalId` correto
   - **Denunciar:** Preencher formulário e enviar
   - **Excluir Conversa:** Excluir e verificar se some da lista

4. **Login com Administrador**
   - Ir para o painel de denúncias
   - Verificar se as denúncias aparecem corretamente

---

## 📊 Estrutura Criada

### Novos Arquivos:

1. **`src/services/reportService.ts`**
   - Serviço completo de denúncias
   - Métodos: `reportAnimal()`, `reportMessage()`, `reportUser()`

2. **`src/components/ReportMessageDialog.tsx`**
   - Componente de diálogo para denunciar mensagens
   - Integrado com `reportService`

3. **`supabase_migrations/070_add_soft_delete_conversations.sql`**
   - Migration para soft delete de conversas

### Arquivos Modificados:

1. **`src/hooks/useUnreadCounts.ts`**
   - Agora conta CONVERSAS com mensagens não lidas
   - Não conta total de mensagens

2. **`src/pages/dashboard/MessagesPage.tsx`**
   - Implementados todos os botões
   - Marcação automática de lida
   - Integração com denúncias e exclusão

3. **`src/components/ReportDialog.tsx`**
   - Integrado com backend real
   - Usa `reportService` para enviar denúncias

4. **`src/services/messageService.ts`**
   - Filtra conversas deletadas pelo usuário
   - Suporta soft delete

---

## 🎯 Próximos Passos

1. ✅ Aplicar migration 070 no Supabase
2. ✅ Testar fluxo completo com as contas fornecidas
3. ✅ Verificar se denúncias aparecem no painel do admin
4. ✅ Testar exclusão de conversa (ambos os lados)

---

## ⚠️ Observações Importantes

- A exclusão de conversa é **soft delete** (não remove do banco)
- Denúncias vão direto para a tabela `reports` com status `pending`
- O contador mostra CONVERSAS não lidas, não mensagens individuais
- Todas as funcionalidades são em tempo real via Supabase subscriptions

---

## 🔧 Solução de Problemas

### Contador não atualiza:
- Verifique se a migration 070 foi aplicada
- Limpe o cache do navegador
- Verifique subscriptions do Supabase

### Denúncias não aparecem:
- Verifique se a tabela `reports` existe (migration 021)
- Verifique RLS policies da tabela
- Verifique se o admin tem role `admin` no perfil

### Exclusão não funciona:
- Aplique a migration 070 primeiro
- Verifique se o campo `deleted_for_users` existe

---

**Implementado por:** Claude Sonnet 4.5  
**Data:** 24 de Novembro de 2025

