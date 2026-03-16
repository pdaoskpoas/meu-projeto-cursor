# 🚀 GUIA COMPLETO DE INTEGRAÇÃO ASAAS.COM

## 📋 ÍNDICE
1. [Visão Geral](#visão-geral)
2. [Configuração Inicial](#configuração-inicial)
3. [Estrutura do Sistema](#estrutura-do-sistema)
4. [Como Usar](#como-usar)
5. [Webhooks](#webhooks)
6. [Testes em Sandbox](#testes-em-sandbox)
7. [Conformidade LGPD + CDC](#conformidade-lgpd--cdc)
8. [Troubleshooting](#troubleshooting)

---

## 🎯 VISÃO GERAL

Este sistema implementa uma integração completa e profissional com a API do **Asaas.com** para processar:

✅ **Assinaturas Mensais** - Renovação automática via Pix ou cartão  
✅ **Planos Anuais** - Pagamento único (parcelável em até 12x)  
✅ **Boosts Avulsos** - Compra de destaques individuais  
✅ **Anúncios Individuais** - Pagamento por anúncio (R$ 14,90)  
✅ **Eventos Individuais** - Publicação de eventos (R$ 49,90)  
✅ **Reembolsos** - Processo manual dentro de 7 dias (CDC)  
✅ **Auditoria Completa** - Logs imutáveis para conformidade LGPD  

---

## ⚙️ CONFIGURAÇÃO INICIAL

### 1. Criar Conta no Asaas

1. Acesse: https://www.asaas.com
2. Crie uma conta (comece com **Sandbox** para testes)
3. Obtenha sua **API Key**:
   - Sandbox: https://sandbox.asaas.com/myAccount/apiKey
   - Produção: https://www.asaas.com/myAccount/apiKey

### 2. Configurar Variáveis de Ambiente

Crie/edite o arquivo `.env` na raiz do projeto:

```env
# ASAAS - Integração de Pagamentos
VITE_ASAAS_API_KEY=sua_api_key_aqui
VITE_ASAAS_ENVIRONMENT=sandbox  # ou 'production'

# Webhook (opcional - para receber notificações)
VITE_ASAAS_WEBHOOK_URL=https://seu-dominio.com/api/webhooks/asaas
```

### 3. Aplicar Migração no Supabase

Execute a migração SQL para criar as tabelas necessárias:

```bash
# Via Supabase CLI
supabase migration up

# Ou manualmente no Dashboard do Supabase
# Copie e execute: supabase_migrations/083_create_asaas_payment_system.sql
```

### 4. Configurar Webhook no Asaas

1. Acesse o painel do Asaas
2. Vá em **Configurações > Webhooks**
3. Adicione a URL do webhook: `https://seu-dominio.com/api/webhooks/asaas`
4. Marque todos os eventos de **Pagamento** e **Assinatura**
5. Salve e teste a conexão

---

## 🏗️ ESTRUTURA DO SISTEMA

### Arquivos Criados

```
📦 Sistema de Pagamentos Asaas
├── 📁 supabase_migrations/
│   └── 083_create_asaas_payment_system.sql  # Migração do banco
│
├── 📁 src/services/
│   ├── asaasService.ts                      # Comunicação com API Asaas
│   ├── asaasWebhookService.ts               # Processamento de webhooks
│   └── paymentService.ts                    # Orquestrador principal
│
└── 📄 INTEGRACAO_ASAAS_GUIA_COMPLETO.md     # Este arquivo
```

### Tabelas no Banco de Dados

| Tabela | Descrição |
|--------|-----------|
| `asaas_customers` | Clientes cadastrados no Asaas |
| `asaas_subscriptions` | Assinaturas ativas/canceladas |
| `asaas_payments` | Cobranças individuais |
| `asaas_webhooks_log` | Log de webhooks recebidos |
| `refunds` | Solicitações de reembolso |
| `payment_audit_log` | Auditoria imutável (LGPD) |

---

## 💻 COMO USAR

### 1. Comprar um Plano

```typescript
import paymentService from '@/services/paymentService';

// Plano Mensal (recorrente)
const response = await paymentService.purchasePlan({
  userId: 'user-uuid',
  planType: 'pro',
  billingCycle: 'monthly',
  billingType: 'PIX'
});

// Plano Anual (pagamento único, parcelável)
const response = await paymentService.purchasePlan({
  userId: 'user-uuid',
  planType: 'vip',
  billingCycle: 'annual',
  billingType: 'CREDIT_CARD',
  installments: 12  // 12x no cartão
});

if (response.success) {
  // Mostrar QR Code Pix ou link de pagamento
  console.log('Pix Copia e Cola:', response.pixCopyPaste);
  console.log('Link do Boleto:', response.bankSlipUrl);
  console.log('Invoice:', response.invoiceUrl);
}
```

### 2. Comprar Boosts Avulsos

```typescript
// Comprar 10 boosts
const response = await paymentService.purchaseBoosts({
  userId: 'user-uuid',
  quantity: 10,
  billingType: 'PIX'
});
```

### 3. Anúncio Individual

```typescript
const response = await paymentService.purchaseIndividualAd({
  userId: 'user-uuid',
  animalId: 'animal-uuid',
  billingType: 'CREDIT_CARD'
});
```

### 4. Evento Individual

```typescript
const response = await paymentService.purchaseIndividualEvent({
  userId: 'user-uuid',
  eventId: 'event-uuid',
  billingType: 'PIX'
});
```

### 5. Cancelar Assinatura

```typescript
const response = await paymentService.cancelSubscription(
  'subscription-uuid',
  'Não preciso mais'
);

// O usuário continua com benefícios até o fim do período pago
// Depois volta automaticamente para o plano Free
```

### 6. Solicitar Reembolso (7 dias - CDC)

```typescript
const response = await paymentService.requestRefund({
  userId: 'user-uuid',
  paymentId: 'payment-uuid',
  reason: 'Não gostei do serviço',
  userNotes: 'Preciso do reembolso urgente'
});

// Será analisado manualmente por um admin
```

---

## 🔔 WEBHOOKS

### Como Funciona

1. **Asaas envia webhook** quando status do pagamento muda
2. **Sistema processa automaticamente**:
   - Ativa assinatura quando pagamento é confirmado
   - Adiciona créditos de boost
   - Ativa anúncios/eventos pagos
   - Suspende por falta de pagamento
   - Processa reembolsos

### Criar Endpoint de Webhook (Backend)

Se você tem um backend Node.js/Express, crie o endpoint:

```typescript
import express from 'express';
import { asaasWebhookService } from './services/asaasWebhookService';

const app = express();
app.use(express.json());

app.post('/api/webhooks/asaas', async (req, res) => {
  try {
    const event = req.body;
    const signature = req.headers['asaas-signature'];
    const ipAddress = req.ip;

    const result = await asaasWebhookService.processWebhook(
      event,
      signature,
      ipAddress
    );

    if (result.success) {
      res.status(200).json({ message: 'Webhook processado' });
    } else {
      res.status(400).json({ error: result.message });
    }
  } catch (error) {
    console.error('Erro no webhook:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
});
```

### Eventos Mais Importantes

| Evento | Ação do Sistema |
|--------|----------------|
| `PAYMENT_CONFIRMED` | Ativa benefícios (plano, boost, anúncio) |
| `PAYMENT_RECEIVED` | Marca como recebido |
| `PAYMENT_OVERDUE` | Suspende assinatura |
| `PAYMENT_REFUNDED` | Reverte benefícios |

---

## 🧪 TESTES EM SANDBOX

### Cartões de Teste (Sandbox)

Use estes cartões para simular pagamentos:

```
# Aprovado
Número: 5162 3064 0879 4447
CVV: 318
Validade: qualquer data futura

# Negado
Número: 5352 9399 8792 6882
CVV: qualquer
Validade: qualquer data futura
```

### Simular Pagamento via Pix (Sandbox)

1. Crie uma cobrança Pix
2. Copie o `payment_id`
3. No painel do Asaas Sandbox, acesse **Pagamentos**
4. Encontre o pagamento e clique em **"Receber"**
5. O webhook será enviado automaticamente

### Testar Webhook Localmente

Use o **ngrok** para expor seu localhost:

```bash
# Instalar ngrok
npm install -g ngrok

# Expor porta 3000
ngrok http 3000

# Copiar URL gerada (ex: https://abc123.ngrok.io)
# Configurar no Asaas: https://abc123.ngrok.io/api/webhooks/asaas
```

---

## 🔒 CONFORMIDADE LGPD + CDC

### LGPD (Lei Geral de Proteção de Dados)

✅ **Base Legal**: Execução de contrato (Art. 7º, V)  
✅ **Dados Armazenados**: Apenas necessários para pagamento  
✅ **Segurança**: RLS ativo, logs imutáveis, sem dados sensíveis de cartão  
✅ **Auditoria**: Todas as operações registradas em `payment_audit_log`  
✅ **Direito ao Esquecimento**: Dados podem ser anonimizados via admin  

### CDC (Código de Defesa do Consumidor)

✅ **Direito de Arrependimento** (Art. 49): 7 dias para reembolso integral  
✅ **Processo de Reembolso**:
   1. Usuário solicita via sistema
   2. Admin analisa em até 48h
   3. Se aprovado, processa via Asaas
   4. Dinheiro estornado em 5-7 dias úteis

✅ **Transparência**: Preços claros, sem taxas ocultas  
✅ **Cancelamento**: Sem multas ou burocracias  

---

## 🔍 TROUBLESHOOTING

### ❌ Erro: "ASAAS_API_KEY não configurada"

**Solução**: Verifique se a variável está no `.env`:
```env
VITE_ASAAS_API_KEY=sua_chave_aqui
```

### ❌ Webhook não está sendo recebido

**Checklist**:
- [ ] URL do webhook está correta no painel Asaas?
- [ ] Servidor está acessível publicamente (não localhost)?
- [ ] Endpoint retorna status 200?
- [ ] Verifique logs no painel Asaas > Webhooks

### ❌ Pagamento não ativa o plano automaticamente

**Verificar**:
1. Webhook foi recebido? Consulte `asaas_webhooks_log`
2. Webhook foi processado? Veja coluna `processed`
3. Erro no processamento? Veja `processing_error`

```sql
-- Verificar últimos webhooks
SELECT * FROM asaas_webhooks_log 
ORDER BY created_at DESC 
LIMIT 10;
```

### ❌ Cliente não está sendo criado

**Verificar dados do usuário**:
```sql
SELECT id, name, email, cpf, phone 
FROM profiles 
WHERE id = 'user-uuid';
```

Se CPF estiver vazio, adicione:
```sql
UPDATE profiles 
SET cpf = 'sua_senha_segura_aqui900' 
WHERE id = 'user-uuid';
```

---

## 💰 PREÇOS CONFIGURADOS

| Item | Preço |
|------|-------|
| Plano Iniciante (Mensal) | R$ 97,00 |
| Plano Iniciante (Anual) | R$ 776,00 |
| Plano Pro (Mensal) | R$ 147,00 |
| Plano Pro (Anual) | R$ 882,00 |
| Plano Elite (Mensal) | R$ 247,00 |
| Plano Elite (Anual) | R$ 1.482,00 |
| Plano VIP (Mensal) | R$ 147,00 (mesmo do Pro) |
| Plano VIP (Anual) | R$ 882,00 (mesmo do Pro) |
| **Boost Individual** | **R$ 47,00** |
| **Pacote 5 Boosts** | **R$ 129,25 (R$ 25,85 cada - 45% OFF)** |
| **Pacote 10 Boosts** | **R$ 202,10 (R$ 20,21 cada - 57% OFF)** |
| **Anúncio Individual** | **R$ 47,00** |
| **Evento Individual** | **R$ 49,99** |

> **Nota**: Preços podem ser alterados em `src/services/paymentService.ts`

---

## 📞 SUPORTE

### Documentação Oficial Asaas
- API Docs: https://docs.asaas.com
- Status: https://status.asaas.com
- Suporte: suporte@asaas.com

### Contato da Equipe
- Para dúvidas sobre a integração, consulte este guia
- Para bugs, verifique os logs em `asaas_webhooks_log` e `payment_audit_log`

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

- [x] ✅ Migração do banco de dados aplicada
- [x] ✅ Serviços criados (asaasService, webhookService, paymentService)
- [x] ✅ Variáveis de ambiente configuradas
- [ ] ⏳ Endpoint de webhook implementado no backend
- [ ] ⏳ Interface de compra de planos criada
- [ ] ⏳ Interface de compra de boosts criada
- [ ] ⏳ Fluxo de cancelamento implementado
- [ ] ⏳ Página de admin para gerenciar reembolsos
- [ ] ⏳ Testes em sandbox realizados
- [ ] ⏳ Migração para produção

---

## 🎉 PARABÉNS!

Você agora tem um sistema de pagamentos **profissional**, **seguro** e **100% conforme a lei brasileira** (LGPD + CDC)!

**Próximos passos**:
1. Testar em Sandbox
2. Criar interfaces de usuário
3. Treinar equipe para gerenciar reembolsos
4. Migrar para Produção
5. Monitorar webhooks e pagamentos

**Boa sorte! 🚀**

