# 🎯 Nova Etapa: "Revisar e Publicar"

**Data:** 24/11/2025  
**Feature:** Última etapa do modal de criação de eventos  
**Status:** ✅ **IMPLEMENTADO**

---

## 📋 VISÃO GERAL

Foi adicionada uma última etapa no modal de criação de eventos chamada **"Revisar e Publicar"**. Esta etapa permite que o usuário visualize:

1. ✅ **Resumo do evento** que será publicado
2. ✅ **Quantas publicações tem disponíveis** no plano atual
3. ✅ **Opções de publicação** (plano gratuito, individual ou upgrade)
4. ✅ **Informações importantes** sobre regras e limites

---

## 🎨 COMPONENTES CRIADOS/MODIFICADOS

### 1. **Novo Componente:** `EventReviewStep.tsx`

**Localização:** `src/components/events/steps/EventReviewStep.tsx`

**Funcionalidades:**
- Busca informações de cota do usuário via `eventLimitsService.checkEventLimit()`
- Exibe resumo completo do evento (título, data, local, participantes)
- Mostra status atual das publicações mensais
- Apresenta 3 opções de publicação:
  1. **Publicar com Plano** (se tiver cota disponível)
  2. **Publicação Individual** (R$ 49,99 por 30 dias)
  3. **Upgrade de Plano** (Pro ou Elite)

**Props:**
```typescript
interface EventReviewStepProps {
  formData: EventFormData;
  onPublish: (paymentType: 'plan' | 'individual') => void;
  onUpgradePlan: () => void;
  isSubmitting?: boolean;
}
```

**Visual:**
- Card azul com resumo do evento
- Card roxo com informações de publicação
- Cards verdes/azuis/roxos para cada opção de publicação
- Card âmbar com avisos importantes

---

### 2. **Modificado:** `CreateEventModal.tsx`

**Alterações principais:**

#### 2.1. Import adicionado:
```typescript
import EventReviewStep from '@/components/events/steps/EventReviewStep';
import { Calendar, MapPin, FileText, CheckCircle } from 'lucide-react';
```

#### 2.2. Novo state:
```typescript
const [publicationType, setPublicationType] = useState<'plan' | 'individual' | null>(null);
```

#### 2.3. Novo step adicionado ao array:
```typescript
{
  id: 'review',
  title: 'Revisar e Publicar',
  description: 'Escolha como deseja publicar',
  icon: CheckCircle,
  component: () => (
    <EventReviewStep 
      formData={formData}
      onPublish={handlePublishChoice}
      onUpgradePlan={handleUpgradePlan}
      isSubmitting={isSubmitting}
    />
  ),
  isValid: true,
  hideActions: true // Oculta botões padrão, componente tem os próprios
}
```

#### 2.4. Novos handlers:

**`handlePublishChoice`:**
```typescript
const handlePublishChoice = async (paymentType: 'plan' | 'individual') => {
  setPublicationType(paymentType);
  
  if (paymentType === 'plan') {
    // Publicar com cota do plano
    await handleComplete();
  } else {
    // Publicação individual - criar rascunho e processar pagamento
    await handleIndividualPublication();
  }
};
```

**`handleIndividualPublication`:**
```typescript
const handleIndividualPublication = async () => {
  setIsSubmitting(true);
  try {
    if (!user) throw new Error('Usuário não autenticado');

    // 1. Criar evento como rascunho
    const eventData = { /* ... */ };
    const { data: draftEvent, error: draftError } = await supabase
      .from('events')
      .insert(eventData)
      .select()
      .single();

    if (draftError) throw draftError;

    // 2. Processar pagamento individual (simulado)
    const result = await eventLimitsService.simulateIndividualPayment(user.id, draftEvent.id);

    if (result.success) {
      toast({ title: 'Evento publicado!', /* ... */ });
      resetForm();
      onSuccess();
    } else {
      throw new Error(result.message);
    }
  } catch (error) { /* ... */ }
  finally { setIsSubmitting(false); }
};
```

#### 2.5. `handleComplete` simplificado:
```typescript
const handleComplete = async () => {
  // Agora apenas cria o evento com o plano
  // Verificação já foi feita no ReviewStep
  setIsSubmitting(true);
  try {
    if (!user) throw new Error('Usuário não autenticado');
    
    await createEvent('active');
    
    toast({
      title: 'Evento publicado!',
      description: 'Seu evento está ativo. Você tem 24h para editá-lo.',
    });

    resetForm();
    onSuccess();
  } catch (error) { /* ... */ }
};
```

---

## 📊 FLUXO DE FUNCIONAMENTO

### Cenário 1: Usuário com cota disponível no plano

```
1. Usuário preenche formulário (3 etapas anteriores)
2. Chega na etapa "Revisar e Publicar"
3. Vê:
   ✅ Resumo do evento
   ✅ "Você tem X publicação(ões) disponível(is)"
   ✅ Botão verde "Publicar com Plano (Grátis)"
4. Clica em "Publicar com Plano"
5. Sistema cria evento com status 'active'
6. Contador de publicações mensais incrementado automaticamente (trigger SQL)
7. Evento publicado com sucesso!
```

### Cenário 2: Usuário SEM cota (VIP, Basic ou cota esgotada)

```
1. Usuário preenche formulário (3 etapas anteriores)
2. Chega na etapa "Revisar e Publicar"
3. Vê:
   ❌ "Seu plano não inclui publicações" OU "Você esgotou suas publicações"
   ✅ Opção 1: Pagar R$ 49,99 (individual)
   ✅ Opção 2: Fazer upgrade de plano
4A. Se clicar em "Pagar R$ 49,99":
    - Sistema cria evento como 'draft'
    - Processa pagamento individual (simulado)
    - Atualiza para 'active' + is_individual_paid = TRUE
    - Não conta na cota mensal
    - Evento publicado por 30 dias
4B. Se clicar em "Ver Planos Premium":
    - Fecha modal
    - Navega para /dashboard/institution-info
```

### Cenário 3: Usuário com cota mas quer pagar individual

```
1. Usuário preenche formulário
2. Chega na etapa "Revisar e Publicar"
3. Vê AMBAS as opções:
   ✅ Publicar com Plano (grátis)
   ✅ Pagar R$ 49,99 (individual)
4. Pode escolher qualquer uma das opções
```

---

## 🎯 INFORMAÇÕES EXIBIDAS

### Resumo do Evento (Card Azul)
- Título do evento
- Tipo (badge)
- Data e hora de início
- Local (cidade/estado)
- Número máximo de participantes (se informado)

### Status das Publicações (Card Roxo)
- **Plano atual** do usuário
- **Cota mensal** (quantas publicações/mês)
- **Publicações usadas** este mês
- **Publicações disponíveis** restantes
- **Próximo reset** (data do primeiro dia do próximo mês)

### Opção 1: Publicar com Plano (Card Verde)
- Exibido APENAS se `can_create = true`
- Mostra quantas publicações disponíveis
- Botão verde "Publicar com Plano (Grátis)"
- Indica: Grátis, 30 dias de duração, 24h para editar

### Opção 2: Publicação Individual (Card Azul)
- Sempre exibido
- Valor: R$ 49,99
- Duração: 30 dias
- Botão azul "Pagar R$ 49,99 e Publicar"
- Indica: Não conta na cota, 30 dias, 24h para editar

### Opção 3: Upgrade de Plano (Card Roxo)
- Exibido quando `can_create = false`
- Mostra benefícios do upgrade:
  - Plano Pro: 1 publicação/mês
  - Plano Elite: 2 publicações/mês
  - Mais animais e recursos premium
- Botão roxo "Ver Planos Premium"

### Avisos Importantes (Card Âmbar)
- ⚠️ 24 horas para editar após publicação
- ⚠️ Limite de 1 evento ativo por vez
- ⚠️ Publicações mensais não recuperáveis

---

## 🔄 INTEGRAÇÃO COM BACKEND

### RPC Functions Utilizadas:

1. **`eventLimitsService.checkEventLimit(user_id)`**
   - Chamado ao renderizar o `EventReviewStep`
   - Retorna todas as informações de cota e limites
   - Usado para decidir quais opções exibir

2. **`eventLimitsService.simulateIndividualPayment(user_id, event_id)`**
   - Chamado quando usuário escolhe "Pagar R$ 49,99"
   - Cria transação no banco
   - Ativa o evento como publicação individual
   - Define `is_individual_paid = TRUE`

### Triggers SQL Acionados:

1. **`trigger_increment_event_publication`**
   - Disparado automaticamente ao criar evento com `ad_status = 'active'`
   - Incrementa `event_publications_used_this_month` do usuário
   - Define `can_edit_until = NOW() + 24 hours`
   - **APENAS** para publicações do plano (não para individuais)

---

## 💡 BENEFÍCIOS DA NOVA ETAPA

### Para o Usuário:
1. ✅ **Transparência Total:** Vê exatamente quantas publicações tem
2. ✅ **Escolha Informada:** Decide a melhor opção antes de finalizar
3. ✅ **Sem Surpresas:** Não descobre limitações depois de preencher tudo
4. ✅ **Múltiplas Opções:** Pode pagar individual mesmo tendo cota
5. ✅ **Revisão Completa:** Confere todos os dados antes de publicar

### Para o Negócio:
1. 💰 **Mais Conversões:** Oferece upgrade na hora certa
2. 💰 **Publicações Individuais:** Monetização adicional
3. 📊 **Dados Claros:** Usuário entende o valor de cada plano
4. 🎯 **Upsell Estratégico:** Mostra benefícios do upgrade
5. ⭐ **Melhor UX:** Reduz frustração e abandono

---

## 🧪 TESTES RECOMENDADOS

### Teste 1: Usuário PRO com 1 publicação disponível
- ✅ Deve ver opção de publicar com plano
- ✅ Deve ver contador "1 publicação disponível"
- ✅ Ao publicar, contador vai para 0
- ✅ Próximo reset deve estar visível

### Teste 2: Usuário VIP (sem cota de eventos)
- ✅ NÃO deve ver opção de publicar com plano
- ✅ Deve ver "Seu plano não inclui publicações"
- ✅ Deve ver opção de pagar R$ 49,99
- ✅ Deve ver opção de upgrade

### Teste 3: Usuário com cota esgotada
- ✅ NÃO deve ver opção de publicar com plano
- ✅ Deve ver "Você esgotou suas publicações"
- ✅ Deve ver próximo reset
- ✅ Pode pagar individual ou fazer upgrade

### Teste 4: Pagamento Individual
- ✅ Criar evento como draft
- ✅ Processar pagamento
- ✅ Ativar evento
- ✅ NÃO incrementar contador mensal
- ✅ Definir `is_individual_paid = TRUE`

### Teste 5: Upgrade de Plano
- ✅ Clicar em "Ver Planos Premium"
- ✅ Deve navegar para /dashboard/institution-info
- ✅ Modal deve fechar

---

## 📁 ARQUIVOS CRIADOS/MODIFICADOS

### Novos Arquivos:
- ✅ `src/components/events/steps/EventReviewStep.tsx` (240 linhas)
- ✅ `NOVA_ETAPA_REVISAR_E_PUBLICAR.md` (este arquivo)

### Arquivos Modificados:
- ✅ `src/components/events/CreateEventModal.tsx`
  - Adicionado import `EventReviewStep`
  - Adicionado state `publicationType`
  - Adicionado step "review" no array de steps
  - Criado handler `handlePublishChoice`
  - Criado handler `handleIndividualPublication`
  - Simplificado `handleComplete`

---

## 🚀 PRÓXIMOS PASSOS

1. ✅ **Componente criado e integrado**
2. ⏳ **Testar no navegador com Playwright**
3. ⏳ **Aplicar SQL migration 073 no Supabase**
4. ⏳ **Testar fluxo completo com diferentes planos**
5. ⏳ **Configurar CRON job para reset mensal**

---

## 📊 ANÁLISE DE ESCALABILIDADE

### Pontos Fortes:
1. ✅ **Componentizado:** EventReviewStep é reutilizável
2. ✅ **Tipo-Seguro:** Interfaces TypeScript bem definidas
3. ✅ **Assíncrono:** Carrega dados sem bloquear UI
4. ✅ **Feedback Visual:** Loading states e toasts
5. ✅ **Extensível:** Fácil adicionar novas opções de publicação

### Possíveis Melhorias Futuras:
1. 📈 **Cache de Limites:** Evitar requisições repetidas
2. 🎨 **Animações:** Transições suaves entre opções
3. 💳 **Gateway Real:** Integrar Stripe/Mercado Pago
4. 📊 **Analytics:** Trackear conversões por opção
5. 🎁 **Cupons:** Sistema de desconto para individuais

---

## ✅ CONCLUSÃO

**A nova etapa "Revisar e Publicar" está 100% implementada!**

Todos os requisitos foram atendidos:
- ✅ Mostra quantas publicações o usuário tem
- ✅ Pergunta se quer publicar individual ou com plano
- ✅ Oferece opção de upgrade de plano
- ✅ Exibe resumo completo do evento
- ✅ Avisos importantes sobre regras
- ✅ Botões de ação para cada opção
- ✅ Integração com backend (RPC functions)
- ✅ Sem erros de lint
- ✅ TypeScript 100% tipado

**Status:** Pronto para testes no navegador! 🎊

---

**Desenvolvido com 💙 pela Cavalaria Digital**  
**Data:** 24/11/2025


