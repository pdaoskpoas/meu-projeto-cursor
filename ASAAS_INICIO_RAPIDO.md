# 🚀 ASAAS - INÍCIO RÁPIDO (5 MINUTOS)

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

### 1️⃣ Configurar Asaas (2 min)

1. Acesse: https://sandbox.asaas.com (para testes)
2. Faça login ou crie uma conta
3. Vá em **Minha Conta > Integrações > API Key**
4. Copie sua API Key

### 2️⃣ Configurar Variáveis de Ambiente (1 min)

Edite o arquivo `.env` na raiz do projeto:

```env
# Adicione estas linhas:
VITE_ASAAS_API_KEY=sua_api_key_aqui
VITE_ASAAS_ENVIRONMENT=sandbox
```

### 3️⃣ Aplicar Migração no Supabase (2 min)

**Opção A: Via Dashboard** (Recomendado)

1. Acesse o Dashboard do Supabase
2. Vá em **SQL Editor**
3. Clique em **+ New Query**
4. Copie todo o conteúdo de `supabase_migrations/083_create_asaas_payment_system.sql`
5. Cole no editor
6. Clique em **Run**
7. Aguarde mensagem de sucesso ✅

**Opção B: Via CLI** (se tiver configurado)

```bash
supabase migration up
```

### 4️⃣ Testar Integração (1 min)

No console do navegador (F12), execute:

```javascript
import paymentService from '@/services/paymentService';

// Testar criação de pagamento
const response = await paymentService.purchaseBoosts({
  userId: 'seu-user-id-aqui',
  quantity: 1,
  billingType: 'PIX'
});

console.log(response);
```

Se retornar `success: true`, está funcionando! ✅

---

## 🧪 TESTAR PAGAMENTO COMPLETO

### 1. Criar um Pagamento

```javascript
const response = await paymentService.purchasePlan({
  userId: 'seu-user-id',
  planType: 'basic',
  billingCycle: 'monthly',
  billingType: 'PIX'
});

console.log('Payment ID:', response.paymentId);
console.log('Pix Code:', response.pixCopyPaste);
```

### 2. Simular Pagamento no Asaas Sandbox

1. Acesse: https://sandbox.asaas.com
2. Menu **Cobranças**
3. Encontre a cobrança criada
4. Clique nos 3 pontos (...) e selecione **"Receber"**
5. Confirme

### 3. Verificar no Banco de Dados

No SQL Editor do Supabase:

```sql
-- Ver último pagamento criado
SELECT * FROM asaas_payments ORDER BY created_at DESC LIMIT 1;

-- Ver último webhook recebido
SELECT * FROM asaas_webhooks_log ORDER BY created_at DESC LIMIT 1;

-- Ver assinatura ativa
SELECT * FROM asaas_subscriptions WHERE status = 'active';
```

---

## 🔗 INTEGRAR NO FRONTEND

### Adicionar Botão de Compra

```tsx
import { PurchasePlanModal } from '@/components/payment/PurchasePlanModal';
import { useState } from 'react';

function MeuComponente() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <button onClick={() => setModalOpen(true)}>
        Assinar Plano
      </button>

      <PurchasePlanModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        userId="user-id-aqui"
        onSuccess={() => {
          alert('Plano adquirido!');
          // Atualizar UI
        }}
      />
    </>
  );
}
```

### Adicionar Botão de Boost

```tsx
import { PurchaseBoostsModal } from '@/components/payment/PurchaseBoostsModal';

<PurchaseBoostsModal
  isOpen={boostModalOpen}
  onClose={() => setBoostModalOpen(false)}
  userId={userId}
  onSuccess={() => {
    toast.success('Boosts adicionados!');
  }}
/>
```

---

## ⚙️ CONFIGURAR WEBHOOK (IMPORTANTE!)

Para receber notificações automáticas do Asaas, você precisa criar um endpoint no seu backend.

### 1. Criar Endpoint (Node.js/Express exemplo)

```javascript
// server.js ou routes/webhooks.js
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

    res.status(200).json({ success: result.success });
  } catch (error) {
    console.error('Erro no webhook:', error);
    res.status(500).json({ error: 'Erro ao processar webhook' });
  }
});

app.listen(3000, () => {
  console.log('Servidor rodando na porta 3000');
});
```

### 2. Expor Localhost (para testes)

```bash
# Instalar ngrok
npm install -g ngrok

# Expor porta 3000
ngrok http 3000

# Copiar URL gerada (ex: https://abc123.ngrok.io)
```

### 3. Configurar no Asaas

1. Acesse: https://sandbox.asaas.com/config/webhooks
2. Clique em **+ Adicionar Webhook**
3. Cole a URL: `https://abc123.ngrok.io/api/webhooks/asaas`
4. Marque todos os eventos de **Cobrança**
5. Salve

---

## 📋 VERIFICAR SE ESTÁ TUDO FUNCIONANDO

### ✅ Checklist Final

- [ ] Variáveis de ambiente configuradas
- [ ] Migração aplicada no Supabase
- [ ] Tabelas criadas (6 tabelas novas)
- [ ] Consegui criar um pagamento teste
- [ ] Pagamento foi salvo no banco
- [ ] Webhook configurado (opcional para testes iniciais)
- [ ] Componentes React funcionando

---

## 🆘 PROBLEMAS COMUNS

### ❌ "ASAAS_API_KEY não configurada"

**Solução**: Verifique o arquivo `.env` e reinicie o servidor de desenvolvimento:

```bash
npm run dev
# ou
yarn dev
```

### ❌ Erro ao aplicar migração

**Solução**: Verifique se você tem permissões de admin no Supabase. Se o erro persistir, execute linha por linha no SQL Editor.

### ❌ Pagamento não cria cobrança

**Solução**: 
1. Verifique o console do navegador (F12)
2. Veja se há erros na aba Network
3. Verifique se a API Key está correta
4. Teste diretamente no Postman/Insomnia

---

## 📚 DOCUMENTAÇÃO COMPLETA

- **Guia Completo**: `INTEGRACAO_ASAAS_GUIA_COMPLETO.md`
- **Resumo Final**: `INTEGRACAO_ASAAS_RESUMO_FINAL.md`
- **API Asaas**: https://docs.asaas.com

---

## 🎯 PRÓXIMOS PASSOS

1. ✅ Teste em Sandbox
2. ⏳ Integre nas páginas do sistema
3. ⏳ Configure webhook no backend
4. ⏳ Migre para Produção (troque API Key)
5. ⏳ Monitor por 24h
6. ⏳ Libere para usuários

---

**Tempo total de configuração**: 5-10 minutos  
**Dificuldade**: ⭐⭐☆☆☆ (Fácil)

**Está com dúvidas?** Consulte a documentação completa ou os arquivos de código criados.

**Boa sorte! 🚀**


