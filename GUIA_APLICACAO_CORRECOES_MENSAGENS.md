# 🚀 GUIA DE APLICAÇÃO - CORREÇÕES DO SISTEMA DE MENSAGENS

**Data:** 4 de Novembro de 2025  
**Tempo Estimado:** 30 minutos  
**Status:** ✅ Pronto para Aplicação

---

## 📋 RESUMO DAS CORREÇÕES

Este guia contém as instruções para aplicar todas as correções identificadas na auditoria do sistema de mensagens:

✅ **Implementado:**
- Migration 039: Sistema de soft delete para mensagens
- Migration 040: Políticas RLS para admin auditar chat
- Serviço `messageService.ts`: Integração completa com Supabase
- `ChatContext.tsx`: Conectado ao Supabase (sem dados mockados)
- Verificação de anúncio pausado/expirado
- Verificação de plano ativo do usuário
- Realtime subscriptions para mensagens
- Interface de bloqueio quando anúncio pausado

---

## 🗄️ PASSO 1: Aplicar Migrations no Supabase (10 min)

### **Migration 039: Soft Delete**

1. Acesse o Supabase Dashboard: [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Vá em **SQL Editor** (ícone de código na sidebar)
4. Clique em **New Query**
5. Copie e cole o conteúdo do arquivo: `supabase_migrations/039_add_message_soft_delete.sql`
6. Clique em **Run** (ou pressione `Ctrl+Enter`)
7. Aguarde a mensagem: `Success. No rows returned`

**O que foi criado:**
- ✅ Colunas `hidden_for_sender`, `hidden_for_receiver`, `deleted_at` na tabela `messages`
- ✅ Índices de performance
- ✅ Função `hide_message_for_user()`
- ✅ View `user_visible_messages`

### **Migration 040: Admin Policies**

1. No SQL Editor, crie uma **Nova Query**
2. Copie e cole o conteúdo do arquivo: `supabase_migrations/040_add_admin_chat_policies.sql`
3. Clique em **Run**
4. Aguarde a mensagem: `Success. No rows returned`

**O que foi criado:**
- ✅ Políticas RLS para admin visualizar todas as conversas
- ✅ Função `admin_search_conversations()`
- ✅ Função `admin_get_conversation_messages()`
- ✅ Função `admin_suspend_conversation()`
- ✅ View `admin_chat_stats`

---

## ⚡ PASSO 2: Verificar Habilitar Realtime (5 min)

### **Habilitar Realtime nas Tabelas**

1. No Supabase Dashboard, vá em **Database** → **Replication**
2. Encontre a tabela **`messages`** e habilite **Realtime**
3. Encontre a tabela **`conversations`** e habilite **Realtime**

**Ou via SQL:**

```sql
-- Habilitar Realtime para messages
ALTER publication supabase_realtime ADD TABLE messages;

-- Habilitar Realtime para conversations
ALTER publication supabase_realtime ADD TABLE conversations;
```

---

## 🔧 PASSO 3: Verificar Arquivos Criados/Atualizados (✅ Já Feito)

Os seguintes arquivos já foram criados/atualizados:

### **Arquivos Criados:**
- ✅ `supabase_migrations/039_add_message_soft_delete.sql`
- ✅ `supabase_migrations/040_add_admin_chat_policies.sql`
- ✅ `src/services/messageService.ts`
- ✅ `RELATORIO_AUDITORIA_SISTEMA_MENSAGENS.md`
- ✅ `GUIA_APLICACAO_CORRECOES_MENSAGENS.md` (este arquivo)

### **Arquivos Atualizados:**
- ✅ `src/contexts/ChatContext.tsx`
- ✅ `src/pages/dashboard/MessagesPage.tsx`
- ✅ `src/components/SendMessageButton.tsx`

---

## 🧪 PASSO 4: Testar o Sistema (15 min)

### **Teste 1: Envio Básico de Mensagem**

1. Faça login como **Usuário A**
2. Navegue para um anúncio de outro usuário
3. Clique em **"Enviar Mensagem"**
4. Digite uma mensagem e envie
5. **Esperado:** 
   - ✅ Mensagem aparece instantaneamente
   - ✅ Redireciona para página de mensagens
   - ✅ Conversa criada com sucesso

### **Teste 2: Recebimento em Tempo Real**

1. Abra duas abas do navegador
2. **Aba 1:** Login como **Usuário A**
3. **Aba 2:** Login como **Usuário B** (proprietário do anúncio)
4. Na **Aba 1**, envie uma mensagem para Usuário B
5. **Esperado:**
   - ✅ Na **Aba 2**, mensagem aparece **instantaneamente** sem reload
   - ✅ Contador de não lidas aumenta
   - ✅ Conversa atualiza na lista

### **Teste 3: Anúncio Pausado**

1. Como **Usuário B** (proprietário), vá em **Meus Animais**
2. Pause um anúncio que tem conversa ativa
3. Como **Usuário A**, tente enviar mensagem nessa conversa
4. **Esperado:**
   - ✅ Input de mensagem desabilitado
   - ✅ Aparece banner amarelo:
     ```
     ⚠️ Anúncio Pausado
     Anúncio pausado. Aguarde o proprietário reativar o anúncio.
     ```
   - ✅ Não é possível enviar mensagem

### **Teste 4: Plano Expirado**

1. Como admin, expire o plano do **Usuário B**
   ```sql
   UPDATE profiles
   SET plan_status = 'expired'
   WHERE id = 'user-b-id';
   ```
2. Como **Usuário A**, tente enviar mensagem
3. **Esperado:**
   - ✅ Banner amarelo de "Plano Expirado"
   - ✅ Input desabilitado

### **Teste 5: Soft Delete de Mensagem**

**⚠️ NOTA:** A UI para deletar mensagem ainda não foi implementada.  
Para testar via SQL:

```sql
-- Ocultar mensagem para o remetente
SELECT hide_message_for_user('message-id-aqui', 'user-id-aqui');
```

**Comportamento esperado:**
- ✅ Mensagem some para quem deletou
- ✅ Mensagem continua visível para a outra parte

### **Teste 6: Admin Ver Conversas**

1. Login como **Admin**
2. Vá em **Admin** → **Chat** (ou acesse `AdminChat.tsx`)
3. **Esperado:**
   - ✅ Admin vê **todas as conversas**
   - ✅ Pode filtrar por usuário/animal
   - ✅ Pode visualizar mensagens completas
   - ✅ Pode suspender conversa

**Testar via SQL:**

```sql
-- Ver todas as conversas (como admin)
SELECT * FROM admin_search_conversations(
  p_search_term := NULL,
  p_limit := 50
);

-- Ver mensagens de uma conversa
SELECT * FROM admin_get_conversation_messages('conversation-id-aqui');

-- Estatísticas
SELECT * FROM admin_chat_stats;
```

---

## 🐛 TROUBLESHOOTING

### **Problema: Mensagens não aparecem**

**Possíveis causas:**

1. **Realtime não habilitado**
   ```sql
   -- Verificar se está habilitado
   SELECT * FROM pg_publication_tables 
   WHERE pubname = 'supabase_realtime' 
   AND tablename IN ('messages', 'conversations');
   
   -- Se vazio, habilitar
   ALTER publication supabase_realtime ADD TABLE messages;
   ALTER publication supabase_realtime ADD TABLE conversations;
   ```

2. **RLS bloqueando**
   ```sql
   -- Testar inserção manual
   INSERT INTO messages (conversation_id, sender_id, content)
   VALUES ('conv-id', 'user-id', 'Teste');
   ```

3. **Erro no console do navegador**
   - Abra DevTools (F12)
   - Verifique aba **Console**
   - Procure por erros em vermelho

### **Problema: "Anúncio pausado" não aparece**

**Verificar:**

1. Animal realmente está pausado?
   ```sql
   SELECT id, name, ad_status FROM animals WHERE id = 'animal-id';
   ```

2. `sendStatus` está sendo populado?
   - Abra React DevTools
   - Procure por `ChatContext`
   - Verifique se `sendStatus.canSend === false`

### **Problema: Admin não vê conversas**

**Verificar:**

1. Usuário tem role 'admin'?
   ```sql
   SELECT id, name, role FROM profiles WHERE id = auth.uid();
   ```

2. Políticas criadas corretamente?
   ```sql
   SELECT * FROM pg_policies 
   WHERE tablename IN ('conversations', 'messages')
   AND policyname LIKE '%admin%';
   ```

---

## ✅ CHECKLIST FINAL

Antes de marcar como concluído, verifique:

### **Banco de Dados**
- [ ] Migration 039 aplicada com sucesso
- [ ] Migration 040 aplicada com sucesso
- [ ] Realtime habilitado em `messages` e `conversations`
- [ ] Função `hide_message_for_user()` existe
- [ ] Policies para admin criadas

### **Código**
- [ ] `messageService.ts` sem erros de lint
- [ ] `ChatContext.tsx` sem erros de lint
- [ ] `MessagesPage.tsx` sem erros de lint
- [ ] Realtime subscription funcionando

### **Testes**
- [ ] Envio de mensagem funciona
- [ ] Recebimento em tempo real funciona
- [ ] Banner de anúncio pausado aparece
- [ ] Banner de plano expirado aparece
- [ ] Admin consegue ver todas as conversas
- [ ] Soft delete funciona (testado via SQL)

---

## 🎯 PRÓXIMOS PASSOS (Futuras Melhorias)

### **Prioridade Média:**

1. **UI para Deletar Mensagem**
   - Adicionar menu dropdown em cada mensagem
   - Opção "Excluir mensagem"
   - Confirmar ação

2. **Indicador de Digitação**
   ```typescript
   // Broadcast quando usuário está digitando
   supabase.channel('typing')
     .send({
       type: 'broadcast',
       event: 'typing',
       payload: { userId, conversationId }
     });
   ```

3. **Upload de Imagens**
   - Permitir enviar fotos
   - Upload para Supabase Storage
   - Exibir preview

4. **Notificações Push**
   - Integrar com serviço de push notifications
   - Notificar quando mensagem nova chega

### **Prioridade Baixa:**

- Áudio/Vídeo chamadas
- Reações em mensagens (👍, ❤️, etc)
- Mensagens agendadas
- Arquivar conversas

---

## 📊 MÉTRICAS DE SUCESSO

Após aplicar as correções, o sistema deve apresentar:

| Métrica | Antes | Depois |
|---------|-------|--------|
| Mensagens salvas no DB | ❌ 0% | ✅ 100% |
| Tempo de aparecimento | ❌ ∞ (nunca) | ✅ < 1s |
| Anúncios pausados bloqueados | ❌ 0% | ✅ 100% |
| Admin vê conversas | ❌ 0% | ✅ 100% |
| Soft delete funciona | ❌ Não | ✅ Sim |

---

## 🆘 SUPORTE

Se encontrar problemas durante a aplicação:

1. **Consulte a documentação do Supabase:** [https://supabase.com/docs](https://supabase.com/docs)
2. **Revise o relatório de auditoria:** `RELATORIO_AUDITORIA_SISTEMA_MENSAGENS.md`
3. **Verifique logs do Supabase:** Dashboard → Logs → Realtime
4. **Verifique console do navegador:** DevTools (F12) → Console

---

**Aplicação criada em:** 4 de Novembro de 2025  
**Próxima revisão:** Após testes em produção

