# 🚨 AÇÃO IMEDIATA NECESSÁRIA - Aplicar Migration SQL

## ⚠️ **STATUS ATUAL**

✅ **Código Front-End:** TODAS as correções aplicadas com sucesso!  
❌ **Banco de Dados:** Migration PENDENTE de aplicação

---

## 📋 **O QUE PRECISA SER FEITO AGORA**

### **Passo 1: Aplicar Migration no Supabase**

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto: **wyufgltprapazpxmtaff**
3. Vá em: **SQL Editor** (menu lateral esquerdo)
4. Clique em: **+ New Query**
5. Cole o conteúdo do arquivo: `supabase_migrations/030_add_individual_paid_ads.sql`
6. Clique em: **Run** (ou Ctrl+Enter)

### **Passo 2: Verificar Sucesso**

Após executar, você verá:
```
✅ Success. No rows returned.
```

### **Passo 3: Verificar Novos Campos**

Execute esta query para confirmar:

```sql
-- Verificar se campos foram criados
SELECT 
  column_name, 
  data_type, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'animals' 
  AND column_name IN ('is_individual_paid', 'individual_paid_expires_at')
ORDER BY column_name;
```

**Resultado esperado:**
```
is_individual_paid          | boolean    | false
individual_paid_expires_at  | timestamptz| NULL
```

---

## 🔄 **Passo 4: Configurar Cron Job (Opcional mas Recomendado)**

Para pausar automaticamente anúncios individuais expirados:

### **Opção A: Supabase Edge Function (Recomendado)**

Criar Edge Function que roda diariamente:

```typescript
// supabase/functions/pause-expired-ads/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  const { data, error } = await supabase.rpc('pause_expired_individual_ads')
  
  return new Response(
    JSON.stringify({ 
      success: !error, 
      affectedCount: data,
      executedAt: new Date().toISOString() 
    }),
    { headers: { "Content-Type": "application/json" } }
  )
})
```

Depois configure cron no Supabase Dashboard:
- Vá em: **Edge Functions** > **pause-expired-ads** > **Cron**
- Configurar: `0 0 * * *` (diariamente às 00:00 UTC)

### **Opção B: Execução Manual**

Execute manualmente sempre que necessário:

```sql
SELECT pause_expired_individual_ads();
```

---

## ✅ **RESULTADO FINAL**

Após aplicar a migration e configurar o cron, você terá:

### **✅ Sistema 100% Funcional:**

1. **Planos Alinhados:**
   - ✅ IDs corretos: `basic`, `pro`, `ultra`, `vip`
   - ✅ Limites corretos: 10, 15, 25, 15
   - ✅ Textos clarificados: "ativos simultaneamente"

2. **Anúncios Individuais:**
   - ✅ Usuário pode pagar anúncio avulso (30 dias)
   - ✅ NÃO conta no limite do plano
   - ✅ Expira automaticamente após 30 dias
   - ✅ Exemplo: Plano Pro (15) + 1 individual = 16 ativos

3. **Plano VIP:**
   - ✅ Documentado e funcional
   - ✅ 15 anúncios (igual Pro)
   - ✅ Concedido apenas por admin

---

## 🧪 **COMO TESTAR**

### **Teste 1: Criar Anúncio do Plano**

```sql
-- Inserir anúncio do plano
INSERT INTO animals (
  name, breed, gender, birth_date, owner_id, 
  ad_status, is_individual_paid
) VALUES (
  'Cavalo Teste', 'Mangalarga Marchador', 'Macho', '2020-01-01',
  'SEU_USER_ID',
  'active', false  -- ✅ Do plano
);

-- Verificar contagem (deve incluir este)
SELECT COUNT(*) FROM animals 
WHERE owner_id = 'SEU_USER_ID' 
  AND ad_status = 'active' 
  AND is_individual_paid = false;
```

### **Teste 2: Criar Anúncio Individual Pago**

```sql
-- Inserir anúncio individual (simular pagamento)
INSERT INTO animals (
  name, breed, gender, birth_date, owner_id, 
  ad_status, is_individual_paid, individual_paid_expires_at
) VALUES (
  'Cavalo Individual', 'Quarto de Milha', 'Fêmea', '2021-01-01',
  'SEU_USER_ID',
  'active', true, NOW() + INTERVAL '30 days'  -- ✅ Individual por 30 dias
);

-- Verificar contagem (NÃO deve incluir este)
SELECT COUNT(*) FROM animals 
WHERE owner_id = 'SEU_USER_ID' 
  AND ad_status = 'active' 
  AND is_individual_paid = false;
```

### **Teste 3: Pausar Anúncio Individual Expirado**

```sql
-- Simular anúncio individual expirado (data no passado)
UPDATE animals 
SET individual_paid_expires_at = NOW() - INTERVAL '1 day'
WHERE name = 'Cavalo Individual';

-- Executar função de expiração
SELECT pause_expired_individual_ads();
-- Deve retornar: 1 (1 anúncio pausado)

-- Verificar se foi pausado
SELECT ad_status, is_individual_paid 
FROM animals 
WHERE name = 'Cavalo Individual';
-- Deve retornar: ad_status = 'paused', is_individual_paid = false
```

---

## 🚨 **TROUBLESHOOTING**

### **Erro: "column already exists"**

Se aparecer erro dizendo que as colunas já existem:

```sql
-- Verificar se migration já foi aplicada anteriormente
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'animals' 
  AND column_name IN ('is_individual_paid', 'individual_paid_expires_at');
```

Se retornar resultados, a migration já foi aplicada! ✅

### **Erro: "function already exists"**

```sql
-- Verificar se função existe
SELECT routine_name FROM information_schema.routines 
WHERE routine_name = 'pause_expired_individual_ads';
```

Se existir, tudo certo! ✅

---

## 📞 **SUPORTE**

Se encontrar qualquer problema:

1. Verifique os logs no Supabase Dashboard
2. Execute queries de verificação acima
3. Confirme que os campos foram criados corretamente
4. Teste com dados de exemplo

---

## ✨ **APÓS APLICAR**

Você poderá:

1. ✅ Criar anúncios respeitando limites dos planos
2. ✅ Permitir usuários pagarem anúncios individuais (avulsos)
3. ✅ Sistema pausará automaticamente anúncios expirados
4. ✅ Admin pode conceder plano VIP gratuitamente
5. ✅ Diferenciação clara entre anúncios do plano vs individuais

---

**🎯 PRÓXIMO PASSO:** Aplicar a migration agora!

**Arquivo:** `supabase_migrations/030_add_individual_paid_ads.sql`




















