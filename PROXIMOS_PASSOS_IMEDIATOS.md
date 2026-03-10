# 🚀 PRÓXIMOS PASSOS IMEDIATOS - INTEGRAÇÃO ASAAS

**Status Atual:** 85% completo ✅  
**Objetivo:** Completar integração e ir para produção

---

## 📋 ROTEIRO DE IMPLEMENTAÇÃO

### **ETAPA 1: BANCO DE DADOS** 🔴 **(URGENTE)**

#### 1.1. Aplicar Migração
```bash
# Abrir Supabase Studio
# Ir em: SQL Editor → New Query
# Copiar todo o conteúdo de: supabase_migrations/083_create_asaas_payment_system.sql
# Executar
```

✅ **Validação:**
```sql
-- Verificar se as tabelas foram criadas:
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('asaas_customers', 'asaas_subscriptions', 'asaas_payments');
```

---

### **ETAPA 2: CONFIGURAR ASAAS (SANDBOX)** 🔴 **(URGENTE)**

#### 2.1. Criar Conta Sandbox
1. Acessar: https://sandbox.asaas.com
2. Criar conta gratuita
3. Confirmar e-mail

#### 2.2. Obter Token API
1. Ir em: **Configurações → Integrações → API**
2. Copiar o **token da API**
3. Adicionar ao `.env.local`:

```env
# .env.local
ASAAS_API_KEY=seu_token_aqui
ASAAS_BASE_URL=https://sandbox.asaas.com/api/v3
NEXT_PUBLIC_SITE_URL=http://localhost:8081
```

#### 2.3. Configurar Webhook
1. No painel Asaas: **Configurações → Integrações → Webhooks**
2. Adicionar URL: `https://seudominio.com/api/webhooks/asaas`
3. **Eventos a habilitar:**
   - ✅ PAYMENT_CONFIRMED
   - ✅ PAYMENT_OVERDUE
   - ✅ PAYMENT_REFUNDED
   - ✅ SUBSCRIPTION_CREATED
   - ✅ SUBSCRIPTION_CANCELED

---

### **ETAPA 3: CRIAR ROTAS DE API** 🔴 **(URGENTE)**

#### 3.1. Criar: `src/pages/api/payments/create-charge.ts`

```typescript
import { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { paymentService } from '@/services/paymentService';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = createServerSupabaseClient({ req, res });
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { type, data } = req.body;

    let result;
    switch (type) {
      case 'plan':
        result = await paymentService.processPlanPurchase(
          user.id,
          data.planId,
          data.billingPeriod
        );
        break;
      case 'boost':
        result = await paymentService.processBoostPurchase(
          user.id,
          data.quantity
        );
        break;
      case 'individual_ad':
        result = await paymentService.processIndividualAdPurchase(
          user.id,
          data.adId
        );
        break;
      case 'individual_event':
        result = await paymentService.processIndividualEventPurchase(
          user.id,
          data.eventId
        );
        break;
      default:
        return res.status(400).json({ error: 'Invalid payment type' });
    }

    return res.status(200).json({ success: true, ...result });
  } catch (error: any) {
    console.error('Payment error:', error);
    return res.status(500).json({ error: error.message });
  }
}
```

#### 3.2. Criar: `src/pages/api/webhooks/asaas.ts`

```typescript
import { NextApiRequest, NextApiResponse } from 'next';
import { asaasWebhookService } from '@/services/asaasWebhookService';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const event = req.body;

    // Log webhook recebido
    console.log('🔔 Webhook Asaas recebido:', event.event, event.payment?.id);

    // Processar evento
    await asaasWebhookService.processWebhookEvent(event);

    return res.status(200).json({ received: true });
  } catch (error: any) {
    console.error('❌ Erro ao processar webhook:', error);
    // Retornar 200 mesmo com erro para não retransmitir
    return res.status(200).json({ error: error.message });
  }
}
```

---

### **ETAPA 4: CONECTAR MODAIS AO BACKEND** 🟡

#### 4.1. Atualizar: `src/components/payment/PurchasePlanModal.tsx`

Adicionar função de compra:

```typescript
const handlePurchase = async () => {
  setIsLoading(true);
  try {
    const response = await fetch('/api/payments/create-charge', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'plan',
        data: {
          planId: selectedPlan,
          billingPeriod: billingPeriod,
        },
      }),
    });

    const result = await response.json();

    if (result.success) {
      // Exibir dados de pagamento (PIX QR Code ou formulário de cartão)
      toast.success('Pedido criado! Complete o pagamento.');
      // TODO: Abrir modal com QR Code PIX ou formulário de cartão
    } else {
      toast.error('Erro ao processar pagamento.');
    }
  } catch (error) {
    console.error('Erro:', error);
    toast.error('Erro ao processar pagamento.');
  } finally {
    setIsLoading(false);
  }
};
```

#### 4.2. Atualizar: `src/components/payment/PurchaseBoostsModal.tsx`

Adicionar mesma lógica, mas com `type: 'boost'`:

```typescript
body: JSON.stringify({
  type: 'boost',
  data: {
    quantity: selectedBoost.quantity,
  },
}),
```

#### 4.3. Atualizar: `src/pages/PlansPage.tsx`

Conectar botões "Começar" à modal:

```typescript
import { PurchasePlanModal } from '@/components/payment/PurchasePlanModal';

// No componente:
const [showModal, setShowModal] = useState(false);
const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

const handleSelectPlan = (planId: string) => {
  setSelectedPlan(planId);
  setShowModal(true);
};

// No JSX dos planos:
<button onClick={() => handleSelectPlan(plan.id)}>
  Começar
</button>

<PurchasePlanModal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  initialPlan={selectedPlan}
  initialBillingPeriod={billingPeriod}
/>
```

#### 4.4. Atualizar: `src/pages/dashboard/SettingsPage.tsx` (aba Conta)

Conectar botão "Ver Planos":

```typescript
import { useRouter } from 'next/router';

const router = useRouter();

<button onClick={() => router.push('/planos')}>
  Ver Planos
</button>
```

---

### **ETAPA 5: TESTAR NO SANDBOX** 🟡

#### 5.1. Testar Compra de Plano
```bash
# 1. Iniciar aplicação
npm run dev

# 2. Fazer login com: testefz@gmail.com / 12345678
# 3. Ir em: Planos Premium
# 4. Clicar em "Começar" no plano Pro
# 5. Escolher "Mensal" ou "Anual"
# 6. Clicar em "Confirmar Compra"
# 7. Verificar se a cobrança foi criada no Asaas Sandbox
```

#### 5.2. Testar Compra de Boosts
```bash
# 1. No Dashboard, clicar em "Comprar Turbinar"
# 2. Escolher pacote (1, 5 ou 10)
# 3. Clicar em "Selecionar" ou "Receba X por R$ Y"
# 4. Verificar cobrança no Asaas
```

#### 5.3. Simular Pagamento (Sandbox)
No painel Asaas Sandbox:
1. Ir em: **Cobranças**
2. Localizar a cobrança criada
3. Clicar em **"Simular Pagamento"**
4. Aguardar webhook processar
5. Verificar no Supabase se o plano foi ativado

---

### **ETAPA 6: IMPLEMENTAR FORMULÁRIO DE PAGAMENTO** 🟢

#### Opção A: PIX (Recomendado)
```typescript
// Após criar cobrança, receber:
{
  paymentMethod: 'PIX',
  qrCode: 'base64_string',
  qrCodeText: '00020126...',
  expiresAt: '2024-11-28T10:00:00Z'
}

// Exibir QR Code + botão "Copiar código"
```

#### Opção B: Cartão de Crédito
```typescript
// Usar biblioteca de tokenização do Asaas
// https://docs.asaas.com/reference/tokenizar-cartao-de-credito
```

---

## 📊 CHECKLIST FINAL

### **Backend**
- [ ] Migração aplicada no Supabase
- [ ] Variáveis de ambiente configuradas
- [ ] Rota `/api/payments/create-charge` criada
- [ ] Rota `/api/webhooks/asaas` criada
- [ ] Webhook configurado no Asaas

### **Frontend**
- [x] ✅ Modal de Boosts funcionando
- [ ] Modal de Planos conectada ao backend
- [ ] Botões "Começar" conectados
- [ ] Formulário PIX/Cartão implementado
- [ ] Histórico de pagamentos funcionando

### **Testes**
- [ ] Compra de plano (mensal) via PIX
- [ ] Compra de plano (anual) via cartão
- [ ] Compra de boosts (1, 5, 10)
- [ ] Webhook confirmando pagamento
- [ ] Plano ativado no usuário
- [ ] Boosts creditados

---

## 🎯 ORDEM DE EXECUÇÃO RECOMENDADA

1. ✅ **ETAPA 1** → Aplicar migração do banco **(10 min)**
2. ✅ **ETAPA 2** → Configurar Asaas Sandbox **(15 min)**
3. ✅ **ETAPA 3** → Criar rotas de API **(30 min)**
4. ✅ **ETAPA 4** → Conectar modais **(45 min)**
5. ✅ **ETAPA 5** → Testar no Sandbox **(30 min)**
6. ⏳ **ETAPA 6** → Implementar formulário de pagamento **(1-2 horas)**

**Tempo total estimado:** 3-4 horas

---

## 💡 DICAS IMPORTANTES

### **Testando Webhooks Localmente**
Use **ngrok** para expor localhost:

```bash
# Instalar ngrok: https://ngrok.com/download
ngrok http 8081

# Copiar URL gerada (ex: https://abc123.ngrok.io)
# Configurar webhook no Asaas: https://abc123.ngrok.io/api/webhooks/asaas
```

### **Logs e Debugging**
```typescript
// Adicionar logs em todos os pontos críticos:
console.log('🔵 Criando cobrança no Asaas:', data);
console.log('🟢 Cobrança criada:', response);
console.log('🔔 Webhook recebido:', event);
console.log('✅ Plano ativado para usuário:', userId);
```

### **Validação de Segurança**
```typescript
// Sempre validar autenticação:
const { data: { user } } = await supabase.auth.getUser();
if (!user) throw new Error('Unauthorized');

// Validar webhook (adicionar token secreto):
const asaasToken = req.headers['asaas-access-token'];
if (asaasToken !== process.env.ASAAS_WEBHOOK_TOKEN) {
  throw new Error('Invalid webhook token');
}
```

---

## 🚨 ERROS COMUNS E SOLUÇÕES

### Erro: "asaas_customers table does not exist"
**Solução:** Aplicar migração `083_create_asaas_payment_system.sql`

### Erro: "Unauthorized" ao criar cobrança
**Solução:** Verificar se `ASAAS_API_KEY` está correto no `.env.local`

### Erro: Webhook não está sendo recebido
**Solução:** 
1. Verificar se ngrok está rodando
2. Verificar se URL do webhook no Asaas está correta
3. Verificar logs da rota `/api/webhooks/asaas`

### Erro: Plano não ativou após pagamento
**Solução:**
1. Verificar se webhook foi processado (checar `asaas_webhooks_log`)
2. Verificar logs do `asaasWebhookService`
3. Verificar se usuário existe em `user_subscriptions`

---

## 📞 SUPORTE

Se encontrar algum problema:
1. Verificar logs do console (browser e servidor)
2. Verificar tabela `asaas_webhooks_log` no Supabase
3. Verificar painel de cobranças no Asaas Sandbox
4. Revisar documentação: `INTEGRACAO_ASAAS_GUIA_COMPLETO.md`

---

**Boa sorte! 🚀**

O sistema está 85% pronto. Com essas etapas, você chega aos **100%** e pode ir para produção com segurança!


