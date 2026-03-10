# 🔍 RELATÓRIO DE AUDITORIA - SISTEMA DE MENSAGENS

**Data:** 4 de Novembro de 2025  
**Auditor:** IA Assistant  
**Status:** ⚠️ **CRÍTICO - MÚLTIPLOS PROBLEMAS IDENTIFICADOS**

---

## 📋 RESUMO EXECUTIVO

O sistema de mensagens foi auditado completamente e **7 problemas críticos** foram identificados que impedem o funcionamento correto do chat entre usuários. O sistema atual está usando dados mockados e não está integrado com o Supabase.

### ⚠️ Severidade dos Problemas

| Problema | Severidade | Impacto |
|----------|-----------|---------|
| Sistema usando dados mockados | 🔴 CRÍTICO | Mensagens não são salvas nem sincronizadas |
| Sem verificação de anúncio pausado | 🔴 CRÍTICO | Permite conversa em anúncios inativos |
| Sem sistema de soft delete | 🟡 ALTO | Usuários não podem excluir mensagens individualmente |
| Sem verificação de plano ativo | 🟡 ALTO | Permite mensagens mesmo com plano expirado |
| Sem realtime subscription | 🟡 ALTO | Mensagens não aparecem em tempo real |
| Admin sem acesso às conversas | 🟡 MÉDIO | Impossibilita auditoria de fraudes |
| Sem indicador de digitação | 🟢 BAIXO | UX inferior |

---

## 🔴 PROBLEMA 1: Sistema Usando Dados Mockados

### **Descrição**
O `ChatContext.tsx` e `MessagesPage.tsx` estão usando dados mockados ao invés de integração real com Supabase.

### **Evidências**

```typescript:26:27:src/contexts/ChatContext.tsx
const [allMessages, setAllMessages] = useState<ChatMessage[]>(mockChatMessages);
const [allConversations, setAllConversations] = useState<ChatConversation[]>(mockChatConversations);
```

### **Impacto**
- ❌ Mensagens não são salvas no banco de dados
- ❌ Mensagens não sincronizam entre usuários
- ❌ Dados são perdidos ao recarregar a página
- ❌ Cada usuário vê apenas dados locais

### **Solução Necessária**
Criar `messageService.ts` e integrar com Supabase para:
- Buscar conversas reais do banco
- Enviar mensagens para o banco
- Atualizar em tempo real

---

## 🔴 PROBLEMA 2: Sem Verificação de Anúncio Pausado

### **Descrição**
Não há verificação se o anúncio está pausado ou se o plano do usuário está ativo antes de permitir envio de mensagens.

### **Evidências**

```typescript:155:160:src/pages/dashboard/MessagesPage.tsx
const handleSendMessage = () => {
  if (newMessage.trim() && currentConversation) {
    sendMessage(newMessage.trim());
    setNewMessage('');
  }
};
```

**Nenhuma verificação é feita!**

### **Impacto**
- ❌ Usuários podem conversar mesmo com anúncio pausado
- ❌ Usuários podem conversar mesmo com plano expirado
- ❌ Não aparece mensagem "Anúncio Pausado"
- ❌ Não bloqueia input quando anúncio inativo

### **Comportamento Esperado**
```
┌─────────────────────────────────────────┐
│  ⚠️ ANÚNCIO PAUSADO                     │
│                                          │
│  Este anúncio está temporariamente       │
│  inativo. Aguarde o proprietário         │
│  reativar o anúncio ou renovar o plano.  │
│                                          │
│  [Input desabilitado]                    │
└─────────────────────────────────────────┘
```

### **Solução Necessária**
1. Verificar status do animal (`ad_status`) na conversa
2. Verificar plano do proprietário (`plan_status`, `plan_expires_at`)
3. Bloquear input se anúncio pausado ou plano expirado
4. Mostrar mensagem explicativa

---

## 🟡 PROBLEMA 3: Sem Sistema de Soft Delete

### **Descrição**
A tabela `messages` não tem colunas para controlar quando um usuário "apaga" uma mensagem do seu lado.

### **Schema Atual**

```sql:43:51:supabase_migrations/006_create_favorites_and_messaging.sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  type TEXT DEFAULT 'text',
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Faltam colunas:**
- `hidden_for_sender BOOLEAN DEFAULT FALSE`
- `hidden_for_receiver BOOLEAN DEFAULT FALSE`
- `deleted_at TIMESTAMP WITH TIME ZONE`

### **Impacto**
- ❌ Usuário não pode "apagar" mensagem do seu lado
- ❌ Se deletar, apaga para ambas as partes (comportamento incorreto)
- ❌ Não cumpre o requisito: "se um usuário apagar a mensagem, a mesma some apenas do chat dele"

### **Comportamento Esperado**

**Cenário 1: Usuário A envia mensagem e depois apaga**
```
┌────────────────────────────────────┐
│  Usuário A (remetente)             │
│  [mensagem deletada]               │ ← Aparece "Você deletou esta mensagem"
└────────────────────────────────────┘

┌────────────────────────────────────┐
│  Usuário B (destinatário)          │
│  "Olá, tudo bem?"                  │ ← Ainda vê a mensagem normalmente
└────────────────────────────────────┘
```

**Cenário 2: Usuário B recebe mensagem e apaga do seu lado**
```
┌────────────────────────────────────┐
│  Usuário B (destinatário)          │
│  [sem mensagens]                   │ ← Não vê mais a mensagem
└────────────────────────────────────┘

┌────────────────────────────────────┐
│  Usuário A (remetente)             │
│  "Olá, tudo bem?"                  │ ← Ainda vê sua própria mensagem
└────────────────────────────────────┘
```

### **Solução Necessária**
Criar migration para adicionar:

```sql
ALTER TABLE messages 
ADD COLUMN hidden_for_sender BOOLEAN DEFAULT FALSE,
ADD COLUMN hidden_for_receiver BOOLEAN DEFAULT FALSE,
ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;
```

Atualizar queries para filtrar:
```typescript
// Ao buscar mensagens
WHERE (
  (sender_id = $userId AND NOT hidden_for_sender) OR
  (sender_id != $userId AND NOT hidden_for_receiver)
)
```

---

## 🟡 PROBLEMA 4: Sem Verificação de Plano Ativo

### **Descrição**
Não há verificação se o plano do usuário proprietário do anúncio está ativo.

### **Verificações Necessárias**
```typescript
// Verificar na conversa:
1. Animal.ad_status === 'active' OU 'paused'
2. Owner.plan_status === 'active'
3. Owner.plan_expires_at > NOW()
4. Owner.is_suspended === FALSE
```

### **Impacto**
- ❌ Usuários com plano expirado continuam recebendo mensagens
- ❌ Sistema não bloqueia automaticamente conversas de anúncios inativos
- ❌ Possibilita negociações em anúncios sem validade

### **Solução Necessária**
Criar função helper:

```typescript
async function canSendMessage(conversationId: string): Promise<{
  canSend: boolean;
  reason?: string;
}> {
  const conversation = await getConversation(conversationId);
  const animal = await getAnimal(conversation.animal_id);
  const owner = await getProfile(conversation.animal_owner_id);
  
  // Verificar anúncio pausado
  if (animal.ad_status === 'paused') {
    return { 
      canSend: false, 
      reason: 'Anúncio pausado temporariamente' 
    };
  }
  
  // Verificar plano expirado
  if (owner.plan_status !== 'active' || new Date(owner.plan_expires_at) < new Date()) {
    return { 
      canSend: false, 
      reason: 'Plano do proprietário expirado' 
    };
  }
  
  // Verificar suspensão
  if (owner.is_suspended) {
    return { 
      canSend: false, 
      reason: 'Usuário suspenso' 
    };
  }
  
  return { canSend: true };
}
```

---

## 🟡 PROBLEMA 5: Sem Realtime Subscription

### **Descrição**
Embora exista subscription no `useUnreadCounts.ts`, não há subscription específica para atualizar as mensagens da conversa atual em tempo real.

### **Evidências**

```typescript:48:55:src/contexts/ChatContext.tsx
useEffect(() => {
  if (currentConversation) {
    const conversationMessages = getMessagesForConversation(currentConversation.id);
    setMessages(conversationMessages);
  } else {
    setMessages([]);
  }
}, [currentConversation, allMessages]);
```

**Usa dados locais**, não subscription!

### **Impacto**
- ❌ Mensagens não aparecem em tempo real para o destinatário
- ❌ Destinatário precisa recarregar a página para ver novas mensagens
- ❌ UX muito inferior

### **Comportamento Esperado**

**Cenário: Usuário A envia mensagem para Usuário B**

```
[Usuário A]                    [Supabase]                 [Usuário B]
    │                               │                          │
    │ INSERT message ───────────>   │                          │
    │                               │                          │
    │                               │ ──── Realtime Event ───> │
    │                               │                          │
    │                               │         ✓ Mensagem aparece
    │                               │           imediatamente!
```

### **Solução Necessária**

```typescript
useEffect(() => {
  if (!currentConversation) return;
  
  // Subscription para nova mensagem na conversa atual
  const subscription = supabase
    .channel(`conversation:${currentConversation.id}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${currentConversation.id}`
      },
      (payload) => {
        setMessages(prev => [...prev, payload.new as ChatMessage]);
      }
    )
    .subscribe();
    
  return () => {
    subscription.unsubscribe();
  };
}, [currentConversation?.id]);
```

---

## 🟡 PROBLEMA 6: Admin Sem Acesso às Conversas

### **Descrição**
As políticas RLS não permitem que admins visualizem todas as conversas para auditoria.

### **Política Atual**

```sql:297:300:supabase_migrations/009_create_rls_policies.sql
CREATE POLICY "Participants can view own conversations" ON conversations
    FOR SELECT USING (
        animal_owner_id = auth.uid() OR interested_user_id = auth.uid()
    );
```

**Admin não tem acesso!**

### **Impacto**
- ❌ Admin não pode auditar conversas
- ❌ Impossibilita verificar fraudes e golpes
- ❌ Não cumpre requisito: "auditoria do Administrador para verificar possíveis fraudes, golpes ou denúncias"

### **Solução Necessária**

```sql
-- Permitir admin ver todas as conversas
CREATE POLICY "Admins can view all conversations" ON conversations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Permitir admin ver todas as mensagens
CREATE POLICY "Admins can view all messages" ON messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );
```

---

## 🟢 PROBLEMA 7: Problemas Menores de UX

### **7.1. Sem Indicador de Digitação**

```typescript
// Não implementado: indicador "Fulano está digitando..."
```

### **7.2. Sem Scroll Automático Suave**

```typescript:21:23:src/components/chat/ChatWindow.tsx
useEffect(() => {
  messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
}, [messages]);
```

✅ Implementado corretamente!

### **7.3. Sem Debounce no Input**
Ao digitar, cada caractere poderia atualizar estado, causando re-renders desnecessários.

### **7.4. Sem Limitação de Tamanho de Mensagem**
Usuário pode enviar mensagem de 10.000 caracteres.

```typescript
// Adicionar validação:
if (newMessage.length > 1000) {
  toast.error('Mensagem muito longa (máximo 1000 caracteres)');
  return;
}
```

---

## 📊 ANÁLISE DETALHADA DO CÓDIGO

### **Arquivos Auditados**

1. ✅ `src/pages/dashboard/MessagesPage.tsx` (395 linhas)
2. ✅ `src/contexts/ChatContext.tsx` (247 linhas)
3. ✅ `src/components/chat/ChatWindow.tsx` (119 linhas)
4. ✅ `src/components/SendMessageButton.tsx` (66 linhas)
5. ✅ `src/components/AdminChat.tsx` (230 linhas)
6. ✅ `src/data/chatData.ts` (143 linhas)
7. ✅ `supabase_migrations/006_create_favorites_and_messaging.sql`
8. ✅ `supabase_migrations/009_create_rls_policies.sql`

### **Pontos Positivos Identificados**

✅ **Estrutura do banco de dados bem planejada**
- Tabelas `conversations` e `messages` corretamente relacionadas
- Índices adequados criados
- RLS habilitado em todas as tabelas

✅ **Interface de usuário bem desenhada**
- Layout limpo e moderno
- Scroll automático funciona
- Formatação de horário adequada

✅ **Sistema de denúncias preparado**
- Tabela `reports` permite denunciar conversas e mensagens
- Admin pode visualizar no `AdminChat.tsx`

✅ **Segurança básica implementada**
- RLS policies impedem acesso não autorizado
- Participantes só veem suas próprias conversas

### **Pontos Negativos Críticos**

❌ **Sistema completamente desconectado do Supabase**
- 100% dos dados são mockados
- Nenhuma integração real

❌ **Falta lógica de negócio crucial**
- Sem verificação de anúncio pausado
- Sem verificação de plano ativo
- Sem soft delete

❌ **Falta realtime**
- Mensagens não aparecem instantaneamente
- Experiência de chat inferior

---

## 🔧 PLANO DE CORREÇÃO

### **Fase 1: Correções Críticas (Prioridade Máxima)**

#### **1.1. Criar Migration para Soft Delete**
```sql
-- Migration: 039_add_message_soft_delete.sql
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS hidden_for_sender BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS hidden_for_receiver BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX idx_messages_hidden_for_sender ON messages(hidden_for_sender);
CREATE INDEX idx_messages_hidden_for_receiver ON messages(hidden_for_receiver);
```

#### **1.2. Atualizar Políticas RLS para Admin**
```sql
-- Migration: 040_add_admin_chat_policies.sql
CREATE POLICY "Admins can view all conversations" ON conversations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can view all messages" ON messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );
```

#### **1.3. Criar messageService.ts**
```typescript
// src/services/messageService.ts

export class MessageService {
  
  // Buscar conversas do usuário
  async getConversations(userId: string): Promise<Conversation[]> {
    const { data, error } = await supabase
      .from('conversations')
      .select(`
        *,
        animal:animals(*),
        owner:profiles!animal_owner_id(*),
        interested:profiles!interested_user_id(*)
      `)
      .or(`animal_owner_id.eq.${userId},interested_user_id.eq.${userId}`)
      .eq('is_active', true)
      .order('updated_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }
  
  // Buscar mensagens de uma conversa
  async getMessages(conversationId: string, userId: string): Promise<Message[]> {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .or(`and(sender_id.eq.${userId},hidden_for_sender.eq.false),and(sender_id.neq.${userId},hidden_for_receiver.eq.false)`)
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return data;
  }
  
  // Verificar se pode enviar mensagem
  async canSendMessage(conversationId: string): Promise<{
    canSend: boolean;
    reason?: string;
  }> {
    // Buscar conversa com animal e owner
    const { data: conversation, error } = await supabase
      .from('conversations')
      .select(`
        *,
        animal:animals(ad_status),
        owner:profiles!animal_owner_id(plan_status, plan_expires_at, is_suspended)
      `)
      .eq('id', conversationId)
      .single();
    
    if (error || !conversation) {
      return { canSend: false, reason: 'Conversa não encontrada' };
    }
    
    // Verificar anúncio pausado
    if (conversation.animal.ad_status === 'paused') {
      return { 
        canSend: false, 
        reason: 'Anúncio pausado. Aguarde o proprietário reativar.' 
      };
    }
    
    // Verificar anúncio expirado
    if (conversation.animal.ad_status === 'expired') {
      return { 
        canSend: false, 
        reason: 'Anúncio expirado. O proprietário precisa renovar o plano.' 
      };
    }
    
    // Verificar plano do proprietário
    if (conversation.owner.plan_status !== 'active') {
      return { 
        canSend: false, 
        reason: 'Plano do proprietário inativo. Aguarde renovação.' 
      };
    }
    
    // Verificar data de expiração do plano
    if (new Date(conversation.owner.plan_expires_at) < new Date()) {
      return { 
        canSend: false, 
        reason: 'Plano do proprietário expirado. Aguarde renovação.' 
      };
    }
    
    // Verificar suspensão
    if (conversation.owner.is_suspended) {
      return { 
        canSend: false, 
        reason: 'Usuário suspenso.' 
      };
    }
    
    return { canSend: true };
  }
  
  // Enviar mensagem
  async sendMessage(
    conversationId: string,
    content: string,
    senderId: string
  ): Promise<Message> {
    // Verificar se pode enviar
    const { canSend, reason } = await this.canSendMessage(conversationId);
    if (!canSend) {
      throw new Error(reason);
    }
    
    // Validar tamanho
    if (content.length > 1000) {
      throw new Error('Mensagem muito longa (máximo 1000 caracteres)');
    }
    
    // Inserir mensagem
    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: senderId,
        content: content.trim(),
        type: 'text'
      })
      .select()
      .single();
    
    if (error) throw error;
    
    // Atualizar conversa
    await supabase
      .from('conversations')
      .update({ 
        updated_at: new Date().toISOString(),
        is_temporary: false // Marcar como permanente após primeira mensagem
      })
      .eq('id', conversationId);
    
    return data;
  }
  
  // Ocultar mensagem para o usuário (soft delete)
  async hideMessage(messageId: string, userId: string): Promise<void> {
    // Verificar se é remetente ou destinatário
    const { data: message } = await supabase
      .from('messages')
      .select('sender_id')
      .eq('id', messageId)
      .single();
    
    if (!message) throw new Error('Mensagem não encontrada');
    
    const isSender = message.sender_id === userId;
    
    const { error } = await supabase
      .from('messages')
      .update({
        [isSender ? 'hidden_for_sender' : 'hidden_for_receiver']: true,
        deleted_at: new Date().toISOString()
      })
      .eq('id', messageId);
    
    if (error) throw error;
  }
  
  // Marcar mensagens como lidas
  async markAsRead(conversationId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .neq('sender_id', userId)
      .is('read_at', null);
    
    if (error) throw error;
  }
}

export const messageService = new MessageService();
```

#### **1.4. Atualizar ChatContext.tsx**
Substituir dados mockados por chamadas reais ao Supabase via `messageService`.

#### **1.5. Adicionar Realtime Subscription**
Implementar subscription para receber mensagens em tempo real.

### **Fase 2: Melhorias de UX (Prioridade Média)**

1. Adicionar indicador "digitando..."
2. Adicionar debounce no input
3. Adicionar limitação de caracteres
4. Melhorar feedback visual de mensagens enviando/enviadas/lidas

### **Fase 3: Admin e Segurança (Prioridade Alta)**

1. Implementar painel de auditoria completo
2. Adicionar filtros de busca por data, usuário, conteúdo
3. Adicionar ação de suspender conversa
4. Adicionar sistema de denúncias integrado

---

## ✅ CHECKLIST DE TESTES

Após implementar correções, testar:

### **Teste 1: Fluxo Básico de Mensagens**
- [ ] Usuário A envia mensagem para Usuário B
- [ ] Mensagem aparece instantaneamente para Usuário B
- [ ] Mensagem é salva no banco de dados
- [ ] Após reload, mensagem continua visível

### **Teste 2: Anúncio Pausado**
- [ ] Pausar anúncio do Usuário A
- [ ] Usuário B tenta enviar mensagem
- [ ] Aparece mensagem "Anúncio Pausado"
- [ ] Input está desabilitado
- [ ] Reativar anúncio
- [ ] Input volta a funcionar

### **Teste 3: Plano Expirado**
- [ ] Expirar plano do Usuário A
- [ ] Usuário B tenta enviar mensagem
- [ ] Aparece mensagem de plano expirado
- [ ] Input desabilitado

### **Teste 4: Soft Delete**
- [ ] Usuário A envia mensagem "Olá"
- [ ] Usuário A apaga a mensagem
- [ ] Para Usuário A, aparece "Você deletou esta mensagem"
- [ ] Para Usuário B, mensagem continua visível
- [ ] Usuário B apaga a mensagem
- [ ] Para Usuário B, mensagem some
- [ ] Para Usuário A, continua aparecendo "Você deletou esta mensagem"

### **Teste 5: Admin Auditoria**
- [ ] Login como admin
- [ ] Acessar painel de conversas
- [ ] Ver todas as conversas de todos os usuários
- [ ] Filtrar por usuário
- [ ] Ver mensagens completas de uma conversa

### **Teste 6: Realtime**
- [ ] Abrir duas abas do navegador (Usuário A e B)
- [ ] Usuário A envia mensagem
- [ ] Mensagem aparece instantaneamente na aba do Usuário B
- [ ] Sem necessidade de reload

### **Teste 7: Performance**
- [ ] Testar com 50+ mensagens em uma conversa
- [ ] Verificar scroll suave
- [ ] Verificar carregamento rápido

---

## 📈 ESTIMATIVA DE TEMPO

| Tarefa | Tempo Estimado |
|--------|----------------|
| Migration soft delete | 15 min |
| Migration admin policies | 10 min |
| Criar messageService.ts | 2 horas |
| Atualizar ChatContext.tsx | 1 hora |
| Adicionar realtime subscription | 30 min |
| Implementar verificação anúncio pausado | 45 min |
| Implementar soft delete UI | 1 hora |
| Testes completos | 2 horas |
| **TOTAL** | **≈ 8 horas** |

---

## 🎯 CONCLUSÃO

O sistema de mensagens possui uma **estrutura de banco de dados sólida** e uma **interface bem desenhada**, mas está **completamente desconectado do Supabase** e **falta lógica de negócio crucial**.

### **Prioridades Imediatas**

1. 🔴 **URGENTE:** Conectar sistema ao Supabase (criar messageService)
2. 🔴 **URGENTE:** Implementar verificação de anúncio pausado
3. 🟡 **ALTA:** Adicionar soft delete
4. 🟡 **ALTA:** Adicionar realtime subscription
5. 🟡 **ALTA:** Permitir admin auditar conversas

### **Recomendação Final**

Implementar as correções da **Fase 1** imediatamente antes de liberar o sistema para produção. Sem estas correções, o sistema de mensagens **não funcionará corretamente** e pode causar **frustração dos usuários** e **perda de negócios**.

---

**Auditoria realizada em:** 4 de Novembro de 2025  
**Próxima auditoria recomendada:** Após implementação das correções

