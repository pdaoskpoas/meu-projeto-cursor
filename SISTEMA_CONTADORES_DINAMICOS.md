# Sistema de Contadores Dinâmicos

**Data:** 29/10/2025  
**Objetivo:** Implementar contadores dinâmicos no menu lateral baseados em dados reais do banco

---

## ✅ Implementação Concluída

### **1. Hook `useUnreadCounts`**
**Localização:** `src/hooks/useUnreadCounts.ts`

**Funcionalidades:**
- ✅ Busca contagem de mensagens não lidas em tempo real
- ✅ Busca convites de sociedade pendentes
- ✅ Atualização automática a cada 30 segundos
- ✅ Subscriptions em tempo real do Supabase
- ✅ Recarrega automaticamente quando há mudanças

**Retorno:**
```typescript
{
  counts: {
    messages: number,      // Mensagens não lidas
    notifications: number, // Placeholder (0 por enquanto)
    partnerships: number   // Convites pendentes
  },
  loading: boolean,
  refetch: () => void      // Função para forçar atualização
}
```

---

### **2. Menu Lateral Atualizado**
**Localização:** `src/components/layout/ModernDashboardSidebar.tsx`

**Mudanças:**
- ✅ Importa e usa `useUnreadCounts()`
- ✅ Remove badges hardcoded (3 e 2)
- ✅ Badges só aparecem quando count > 0
- ✅ Atualização automática em tempo real

**Badges Dinâmicos:**
```typescript
// Mensagens: só mostra se tiver mensagens não lidas
badge: counts.messages > 0 ? { 
  count: counts.messages, 
  variant: 'destructive' 
} : undefined

// Notificações: só mostra se tiver notificações
badge: counts.notifications > 0 ? { 
  count: counts.notifications, 
  variant: 'destructive' 
} : undefined

// Sociedades: só mostra se tiver convites pendentes
badge: counts.partnerships > 0 ? { 
  count: counts.partnerships, 
  variant: 'destructive' 
} : undefined
```

---

### **3. Funções Helper**
**Localização:** `src/lib/unreadHelpers.ts`

**Funções Disponíveis:**

#### `markConversationAsRead(conversationId, userId)`
Marca todas as mensagens de uma conversa como lidas
```typescript
await markConversationAsRead(conversationId, user.id);
```

#### `markMessageAsRead(messageId)`
Marca uma mensagem específica como lida
```typescript
await markMessageAsRead(messageId);
```

#### `markAllMessagesAsRead(userId)`
Marca TODAS as mensagens do usuário como lidas (usar ao entrar na página de mensagens)
```typescript
await markAllMessagesAsRead(user.id);
```

#### `getUnreadMessagesCount(conversationId, userId)`
Retorna a contagem de mensagens não lidas de uma conversa
```typescript
const count = await getUnreadMessagesCount(conversationId, user.id);
```

---

## 🎯 Como Funciona

### **Lógica de Mensagens**
```
1. Usuário recebe mensagem → read_at = NULL
2. Badge no menu lateral aparece com count +1
3. Usuário abre a conversa → chamar markConversationAsRead()
4. read_at = timestamp atual
5. Badge atualiza automaticamente (count -1)
```

### **Lógica de Sociedades/Convites**
```
1. Usuário recebe convite → status = 'pending'
2. Badge aparece no "Sociedades" com count +1
3. Usuário acessa página de sociedades
4. Usuário aceita/rejeita → status = 'accepted' ou 'rejected'
5. Badge atualiza automaticamente (count -1)
```

### **Lógica de Notificações**
```
(Aguardando implementação da tabela de notificações)
Quando implementada, seguirá lógica similar:
- has_viewed = false → conta
- Usuário visualiza → has_viewed = true → não conta mais
```

---

## 📋 TODO: Integrações Necessárias

### **1. Página de Mensagens** 
**Arquivo:** `src/pages/dashboard/MessagesPage.tsx`

**Ação Necessária:**
```typescript
import { markAllMessagesAsRead } from '@/lib/unreadHelpers';
import { useAuth } from '@/contexts/AuthContext';

// Ao montar o componente
useEffect(() => {
  if (user?.id) {
    markAllMessagesAsRead(user.id);
  }
}, [user?.id]);
```

### **2. Componente de Conversa Individual**
**Arquivo:** Onde exibe a conversa específica

**Ação Necessária:**
```typescript
import { markConversationAsRead } from '@/lib/unreadHelpers';

// Quando o usuário abre uma conversa
useEffect(() => {
  if (conversationId && user?.id) {
    markConversationAsRead(conversationId, user.id);
  }
}, [conversationId, user?.id]);
```

### **3. Página de Notificações**
**Arquivo:** `src/pages/dashboard/NotificationsPage.tsx`

**Ação Necessária:**
```typescript
// Marcar todas como visualizadas ao entrar na página
// (aguardando tabela de notificações)
```

### **4. Página de Sociedades**
**Arquivo:** `src/pages/dashboard/SocietyPage.tsx` ou similar

**Observação:** 
- Os convites já são gerenciados pela tabela `animal_partnerships`
- Quando o usuário aceitar/rejeitar, o status muda automaticamente
- O contador zerou automaticamente via subscription

---

## 🗄️ Estrutura do Banco de Dados

### **Tabela: messages**
```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id),
  sender_id UUID REFERENCES profiles(id),
  content TEXT NOT NULL,
  type TEXT DEFAULT 'text',
  read_at TIMESTAMP WITH TIME ZONE,  -- NULL = não lida
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **Tabela: animal_partnerships**
```sql
CREATE TABLE animal_partnerships (
  id UUID PRIMARY KEY,
  animal_id UUID REFERENCES animals(id),
  partner_id UUID REFERENCES profiles(id),
  status TEXT CHECK (status IN ('pending', 'accepted', 'rejected')),
  -- pending = conta no badge
  -- accepted/rejected = não conta
  ...
);
```

### **Tabela: conversations**
```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY,
  animal_id UUID REFERENCES animals(id),
  animal_owner_id UUID REFERENCES profiles(id),  -- Um participante
  interested_user_id UUID REFERENCES profiles(id),  -- Outro participante
  ...
);
```

---

## 🔄 Atualização em Tempo Real

### **Subscriptions Implementadas:**

1. **Mensagens:**
```typescript
supabase.channel('messages_changes')
  .on('postgres_changes', { table: 'messages' }, () => {
    fetchUnreadCounts(); // Recarrega contagens
  })
```

2. **Parcerias:**
```typescript
supabase.channel('partnerships_changes')
  .on('postgres_changes', { table: 'animal_partnerships' }, () => {
    fetchUnreadCounts(); // Recarrega contagens
  })
```

### **Intervalo de Atualização:**
- A cada 30 segundos as contagens são atualizadas automaticamente
- Quando há mudanças no banco, atualiza imediatamente via subscriptions

---

## 🎨 Exemplos de Uso

### **Exemplo 1: Marcar mensagem como lida ao abrir chat**
```typescript
const ChatComponent = () => {
  const { user } = useAuth();
  const { conversationId } = useParams();
  
  useEffect(() => {
    if (conversationId && user?.id) {
      markConversationAsRead(conversationId, user.id);
    }
  }, [conversationId, user?.id]);
  
  return <div>Chat...</div>;
};
```

### **Exemplo 2: Mostrar contagem na lista de conversas**
```typescript
const ConversationList = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  
  useEffect(() => {
    conversations.forEach(async (conv) => {
      const count = await getUnreadMessagesCount(conv.id, user.id);
      // Mostrar badge com count
    });
  }, [conversations]);
  
  return <div>Lista...</div>;
};
```

### **Exemplo 3: Atualizar após aceitar convite**
```typescript
const handleAcceptInvite = async (partnershipId) => {
  await supabase
    .from('animal_partnerships')
    .update({ status: 'accepted' })
    .eq('id', partnershipId);
  
  // O badge atualizará automaticamente via subscription!
};
```

---

## ✅ Benefícios

1. **Tempo Real:** Atualizações automáticas sem refresh
2. **Performance:** Queries otimizadas com count
3. **Escalável:** Funciona para qualquer número de usuários
4. **Individual:** Cada usuário vê apenas suas contagens
5. **Limpo:** Badges só aparecem quando necessário (count > 0)

---

## 🚀 Status Atual

- ✅ Hook criado e funcionando
- ✅ Menu lateral integrado
- ✅ Funções helper criadas
- ✅ Subscriptions em tempo real
- ⏳ **Pendente:** Integração nas páginas de mensagens/conversas
- ⏳ **Pendente:** Criar tabela de notificações

---

## 📝 Próximos Passos

1. Integrar `markConversationAsRead()` na página de chat
2. Integrar `markAllMessagesAsRead()` na página de mensagens
3. Criar tabela de notificações no banco
4. Implementar sistema de notificações completo
5. Testar em produção

---

**Implementado por:** IA Assistant  
**Última atualização:** 29/10/2025



