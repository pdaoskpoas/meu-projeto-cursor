# 🧪 TESTE DE INTEGRAÇÃO ASAAS - PASSO A PASSO

## ✅ PRÉ-REQUISITOS VERIFICADOS

- [x] Migração SQL aplicada no Supabase
- [x] 6 tabelas criadas com RLS ativo
- [x] Variáveis de ambiente configuradas
- [x] Valores corretos implementados (R$ 47,00 boost, R$ 97,00 Iniciante, etc.)

---

## 🎯 TESTE 1: VALIDAR CONFIGURAÇÃO

### Console do Navegador (F12)

```javascript
// 1. Verificar se as variáveis estão carregadas
console.log('API Key configurada:', !!import.meta.env.VITE_ASAAS_API_KEY);
console.log('Ambiente:', import.meta.env.VITE_ASAAS_ENVIRONMENT);
```

**Resultado esperado:**
```
API Key configurada: true
Ambiente: sandbox
```

---

## 🎯 TESTE 2: CRIAR CLIENTE NO ASAAS

### No Console (substitua USER_ID pelo ID de um usuário real)

```javascript
import { asaasService } from './src/services/asaasService';

// Substituir pelo ID de um usuário real do seu banco
const userId = 'SEU_USER_ID_AQUI';

// Criar cliente no Asaas
const result = await asaasService.createOrGetCustomer(userId);
console.log('✅ Cliente criado:', result);
```

**Resultado esperado:**
```javascript
{
  asaasCustomerId: "cus_000005876367", // ID no Asaas
  isNew: true
}
```

**Verificar no Supabase:**
```sql
SELECT * FROM asaas_customers ORDER BY created_at DESC LIMIT 1;
```

---

## 🎯 TESTE 3: CRIAR PAGAMENTO PIX (1 BOOST - R$ 47,00)

```javascript
import { paymentService } from './src/services/paymentService';

const userId = 'SEU_USER_ID_AQUI';

// Comprar 1 boost via Pix
const response = await paymentService.purchaseBoosts({
  userId: userId,
  quantity: 1,
  billingType: 'PIX'
});

console.log('✅ Pagamento criado:', response);

if (response.success) {
  console.log('🎫 Payment ID:', response.paymentId);
  console.log('📱 Pix Copia e Cola:', response.pixCopyPaste);
  console.log('🔗 Invoice URL:', response.invoiceUrl);
}
```

**Resultado esperado:**
```javascript
{
  success: true,
  paymentId: "pay_123456789",
  pixCopyPaste: "00020126360014br.gov.bcb.pix...",
  invoiceUrl: "https://sandbox.asaas.com/i/123456789",
  message: "Pagamento criado para 1 boost(s)!"
}
```

**Verificar no Banco:**
```sql
-- Ver pagamento criado
SELECT 
  id,
  payment_type,
  value,
  billing_type,
  status,
  created_at
FROM asaas_payments 
ORDER BY created_at DESC 
LIMIT 1;

-- Resultado esperado:
-- payment_type: 'boost_purchase'
-- value: 47.00
-- billing_type: 'PIX'
-- status: 'pending'
```

---

## 🎯 TESTE 4: SIMULAR PAGAMENTO NO ASAAS SANDBOX

### 4.1. Acessar Painel Asaas

1. Acesse: https://sandbox.asaas.com
2. Faça login
3. Vá em menu **"Cobranças"**

### 4.2. Localizar o Pagamento

- Procure pela cobrança de **R$ 47,00**
- Descrição: "Compra de 1 Boost(s)"

### 4.3. Simular Recebimento

1. Clique nos 3 pontos (...) da cobrança
2. Selecione **"Receber"**
3. Confirme

**O Asaas irá:**
- Marcar como "Recebido"
- Enviar webhook (se configurado)

---

## 🎯 TESTE 5: VERIFICAR WEBHOOK RECEBIDO

**Se você já configurou o webhook**, verifique:

```sql
SELECT 
  event_type,
  processed,
  processing_error,
  created_at
FROM asaas_webhooks_log 
ORDER BY created_at DESC 
LIMIT 5;
```

**Resultado esperado:**
```
event_type: 'PAYMENT_CONFIRMED'
processed: true
processing_error: null
```

**Se ainda não tem webhook configurado**, não tem problema! Continue os testes.

---

## 🎯 TESTE 6: COMPRAR PACOTE 5 BOOSTS (R$ 129,25)

```javascript
const response = await paymentService.purchaseBoosts({
  userId: userId,
  quantity: 5,
  billingType: 'PIX'
});

console.log('Valor total:', response.value); // Deve ser 129.25
```

**Verificar desconto:**
- 5 boosts × R$ 47,00 = R$ 235,00
- Com 45% OFF = R$ 129,25 ✅

---

## 🎯 TESTE 7: COMPRAR PLANO PRO MENSAL (R$ 147,00)

```javascript
const response = await paymentService.purchasePlan({
  userId: userId,
  planType: 'pro',
  billingCycle: 'monthly',
  billingType: 'PIX'
});

console.log('✅ Assinatura criada:', response);
```

**Verificar no banco:**
```sql
SELECT 
  plan_type,
  billing_type,
  value,
  status,
  auto_renew
FROM asaas_subscriptions 
ORDER BY created_at DESC 
LIMIT 1;

-- Resultado esperado:
-- plan_type: 'pro'
-- billing_type: 'monthly'
-- value: 147.00
-- status: 'pending'
-- auto_renew: true
```

---

## 🎯 TESTE 8: COMPRAR ANÚNCIO INDIVIDUAL (R$ 47,00)

```javascript
// Substituir por um ID de animal real
const animalId = 'SEU_ANIMAL_ID_AQUI';

const response = await paymentService.purchaseIndividualAd({
  userId: userId,
  animalId: animalId,
  billingType: 'PIX'
});

console.log('✅ Anúncio individual:', response);
```

**Verificar:**
```sql
SELECT 
  payment_type,
  related_content_type,
  related_content_id,
  value
FROM asaas_payments 
WHERE payment_type = 'individual_ad'
ORDER BY created_at DESC 
LIMIT 1;

-- Resultado esperado:
-- payment_type: 'individual_ad'
-- related_content_type: 'animal'
-- value: 47.00
```

---

## 🎯 TESTE 9: COMPRAR EVENTO INDIVIDUAL (R$ 49,99)

```javascript
const eventId = 'SEU_EVENT_ID_AQUI';

const response = await paymentService.purchaseIndividualEvent({
  userId: userId,
  eventId: eventId,
  billingType: 'PIX'
});

console.log('✅ Evento individual:', response);
```

---

## 🎯 TESTE 10: LISTAR PAGAMENTOS DO USUÁRIO

```javascript
const payments = await paymentService.getUserPayments(userId);
console.log('📄 Total de pagamentos:', payments.length);
console.log('Pagamentos:', payments);
```

---

## 🎯 TESTE 11: VERIFICAR ASSINATURA ATIVA

```javascript
const subscription = await paymentService.getUserActiveSubscription(userId);
console.log('📅 Assinatura ativa:', subscription);
```

---

## 📊 CHECKLIST DE VALIDAÇÃO

### Banco de Dados
- [ ] Tabelas criadas corretamente
- [ ] RLS ativo em todas as tabelas
- [ ] Cliente criado em `asaas_customers`
- [ ] Pagamentos registrados em `asaas_payments`
- [ ] Assinaturas registradas em `asaas_subscriptions`

### API Asaas
- [ ] Cliente criado no Asaas
- [ ] Cobrança criada com valor correto
- [ ] QR Code Pix gerado
- [ ] Link de pagamento funcionando
- [ ] Status "pending" inicial

### Valores
- [ ] 1 boost = R$ 47,00
- [ ] 5 boosts = R$ 129,25 (45% OFF)
- [ ] 10 boosts = R$ 202,10 (57% OFF)
- [ ] Plano Iniciante = R$ 97,00
- [ ] Plano Pro = R$ 147,00
- [ ] Plano Elite = R$ 247,00
- [ ] Anúncio individual = R$ 47,00
- [ ] Evento individual = R$ 49,99

---

## 🚨 TROUBLESHOOTING

### ❌ Erro: "ASAAS_API_KEY não configurada"

**Solução:**
1. Verificar arquivo `.env`
2. Reiniciar servidor dev: `npm run dev`

### ❌ Erro: "Network request failed"

**Solução:**
1. Verificar se API Key está correta
2. Verificar se está usando Sandbox (`VITE_ASAAS_ENVIRONMENT=sandbox`)
3. Verificar logs do console (F12)

### ❌ Erro: "Cliente não encontrado"

**Solução:**
1. Verificar se o `userId` existe na tabela `profiles`
2. Verificar se o usuário tem `cpf` preenchido
3. Executar novamente `createOrGetCustomer()`

### ❌ Pagamento não aparece no Asaas

**Solução:**
1. Verificar logs do console
2. Verificar se a cobrança foi criada no banco (`asaas_payments`)
3. Verificar se `asaas_payment_id` está preenchido
4. Login no Asaas Sandbox e verificar manualmente

---

## ✅ PRÓXIMOS PASSOS APÓS TESTES

1. **Se todos os testes passarem:**
   - ✅ Integrar componentes nas páginas
   - ✅ Criar endpoint de webhook no backend
   - ✅ Testar fluxo completo com pagamento
   - ✅ Migrar para produção

2. **Se algum teste falhar:**
   - 📝 Anotar o erro
   - 🔍 Verificar logs
   - 🐛 Corrigir problema
   - 🔄 Executar teste novamente

---

## 📞 SUPORTE

**Documentação:**
- INTEGRACAO_ASAAS_GUIA_COMPLETO.md
- INTEGRACAO_ASAAS_RESUMO_FINAL.md
- ASAAS_INICIO_RAPIDO.md

**Asaas:**
- Docs: https://docs.asaas.com
- Sandbox: https://sandbox.asaas.com
- Suporte: suporte@asaas.com

---

**Boa sorte nos testes! 🚀**


