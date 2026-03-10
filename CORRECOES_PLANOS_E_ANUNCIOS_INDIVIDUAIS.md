# 🎯 Correções Aplicadas - Sistema de Planos e Anúncios Individuais

**Data:** 30 de Outubro de 2025  
**Status:** ✅ **CORREÇÕES APLICADAS COM SUCESSO**  
**Pendente:** Aplicar migration SQL no Supabase

---

## 📋 Resumo das Correções

### ✅ **PROBLEMAS RESOLVIDOS:**

1. ✅ IDs dos planos alinhados com o banco de dados
2. ✅ Limite do Plano Elite corrigido (30 → 25)
3. ✅ Textos clarificados: "por mês" → "ativos simultaneamente" (não cumulativo)
4. ✅ Sistema de anúncios individuais pagos implementado
5. ✅ Documentação completa do plano VIP
6. ✅ Constantes centralizadas criadas

---

## 🗄️ 1. MIGRATION SQL - **AÇÃO NECESSÁRIA**

### **Arquivo Criado:** `supabase_migrations/030_add_individual_paid_ads.sql`

**O QUE FAZ:**
- Adiciona campo `is_individual_paid` na tabela `animals`
- Adiciona campo `individual_paid_expires_at` para controle de expiração
- Cria função `pause_expired_individual_ads()` para pausar anúncios expirados
- Cria índice para otimização de queries

### **⚠️ COMO APLICAR:**

```bash
# Opção 1: Via Supabase Dashboard
1. Acesse: https://supabase.com/dashboard
2. Vá em: SQL Editor
3. Cole o conteúdo de: supabase_migrations/030_add_individual_paid_ads.sql
4. Execute a migration

# Opção 2: Via Supabase CLI (se configurado)
supabase db push
```

### **CONFIGURAR CRON JOB:**

Após aplicar a migration, configure execução diária da função:

```sql
-- Executar diariamente às 00:00 UTC
-- (Configure via Supabase Edge Function ou pg_cron)
SELECT pause_expired_individual_ads();
```

---

## 📝 2. ARQUIVOS CORRIGIDOS

### **Arquivo:** `src/hooks/usePlansData.ts`

#### **Alterações:**
```typescript
// ❌ ANTES:
{ id: 'starter', name: 'Plano Iniciante', ads: 10 }
{ id: 'professional', name: 'Plano Pro', ads: 15 }
{ id: 'enterprise', name: 'Plano Elite', ads: 25 }
'Publique até 10 anúncios por mês'
'Anúncios ILIMITADOS'

// ✅ DEPOIS:
{ id: 'basic', name: 'Plano Iniciante', ads: 10 }
{ id: 'pro', name: 'Plano Pro', ads: 15 }
{ id: 'ultra', name: 'Plano Elite', ads: 25 }
'Mantenha até 10 anúncios ativos simultaneamente'
'Mantenha até 25 anúncios ativos simultaneamente'
```

---

### **Arquivo:** `src/services/animalService.ts`

#### **Alterações:**

**1. Limite do Plano Elite:**
```typescript
// ❌ ANTES:
case 'ultra': return 30;

// ✅ DEPOIS:
case 'ultra': return 25;  // Elite: 25 anúncios ativos simultaneamente
```

**2. Contagem de Anúncios (EXCLUI individuais pagos):**
```typescript
// ✅ NOVO:
private async countActiveAnimals(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('animals')
    .select('*', { count: 'exact', head: true })
    .eq('owner_id', userId)
    .eq('ad_status', 'active')
    .eq('is_individual_paid', false) // ✅ NÃO conta anúncios individuais pagos
  if (error) throw handleSupabaseError(error)
  return count ?? 0
}
```

**3. Criar Anúncio Individual Pago:**
```typescript
// ✅ NOVO: Marca animal como individual_paid e define expiração
async createIndividualAdTransaction(userId: string, animalId: string, amount: number): Promise<void> {
  // 1. Criar transação
  const { error: txError } = await supabase.from('transactions').insert({...})
  
  // 2. Marcar animal como individual_paid (30 dias)
  const expires = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
  await supabase.from('animals').update({
    is_individual_paid: true,
    individual_paid_expires_at: expires.toISOString(),
    ad_status: 'active'
  })...
}
```

---

### **Arquivo:** `src/pages/dashboard/InstitutionInfoPage.tsx`

#### **Alteração:**
```typescript
// ❌ ANTES:
const [selectedPlan, setSelectedPlan] = useState<string | null>('professional');

// ✅ DEPOIS:
const [selectedPlan, setSelectedPlan] = useState<string | null>('pro');
```

---

### **Arquivo NOVO:** `src/constants/plans.ts`

Constantes centralizadas para limites e descrições:

```typescript
export const PLAN_LIMITS = {
  free: 0,      // Gratuito: sem anúncios incluídos
  basic: 10,    // Iniciante: 10 anúncios ativos simultaneamente
  pro: 15,      // Pro: 15 anúncios ativos simultaneamente
  ultra: 25,    // Elite: 25 anúncios ativos simultaneamente
  vip: 15       // VIP: igual Pro, concedido por admin
} as const;

export const PLAN_DESCRIPTIONS = {
  basic: 'Mantenha até 10 anúncios ativos simultaneamente durante todo o mês.',
  pro: 'Mantenha até 15 anúncios ativos simultaneamente durante todo o mês.',
  ultra: 'Mantenha até 25 anúncios ativos simultaneamente durante todo o mês.',
  vip: 'Plano cortesia com benefícios do Pro, concedido exclusivamente pelo administrador.'
}

export const INDIVIDUAL_AD_DURATION_DAYS = 30;
export const BOOST_DURATION_HOURS = 24;
```

---

## 📊 3. ESTRUTURA FINAL DOS PLANOS

| Plano | ID no Banco | Limite | Descrição | Concedido Por |
|-------|-------------|--------|-----------|---------------|
| **Gratuito** | `free` | 0 anúncios | Sem anúncios incluídos (apenas pagos individualmente) | Sistema (padrão) |
| **Iniciante** | `basic` | 10 anúncios ativos | 10 anúncios ativos simultaneamente | Compra pelo usuário |
| **Pro** | `pro` | 15 anúncios ativos | 15 anúncios ativos simultaneamente | Compra pelo usuário |
| **Elite** | `ultra` | 25 anúncios ativos | 25 anúncios ativos simultaneamente | Compra pelo usuário |
| **VIP** | `vip` | 15 anúncios ativos | Igual Pro, mas gratuito | **Apenas Admin** |

---

## 🎯 4. LÓGICA DE ANÚNCIOS INDIVIDUAIS PAGOS

### **Como Funciona:**

#### **Cenário 1: Usuário com Plano Pro (15 anúncios)**

```
1. Usuário cria 15 anúncios → ✅ TODOS do plano (contam no limite)
2. Usuário paga 1 anúncio individual (avulso) → ✅ ADICIONAL (NÃO conta no limite)
3. Total ativo: 16 anúncios (15 do plano + 1 individual pago)
4. Após 30 dias: Anúncio individual é PAUSADO automaticamente
5. Restam: 15 anúncios do plano (ainda ativos enquanto plano estiver ativo)
```

#### **Cenário 2: Usuário Free (sem plano)**

```
1. Usuário não pode criar anúncios do plano (limite = 0)
2. Usuário paga 1 anúncio individual → ✅ Ativo por 30 dias
3. Após 30 dias: Anúncio é PAUSADO
4. Para reativar: Pagar novamente ou assinar um plano
```

#### **Cenário 3: Usuário Elite com Limite Atingido**

```
1. Usuário tem 25 anúncios ativos (limite atingido)
2. Quer adicionar mais 1 anúncio
3. Opções:
   a) Pausar 1 anúncio existente e criar novo (ainda 25 ativos)
   b) Pagar 1 anúncio individual (totalizando 26: 25 do plano + 1 individual)
```

---

## 🔄 5. EXPIRAÇÃO AUTOMÁTICA

### **Anúncios do Plano:**
- ✅ Permanecem ativos enquanto o plano estiver ativo
- ❌ Se plano expirar/cancelar: TODOS são pausados
- 🔄 Se renovar plano: Usuário pode reativar os pausados

### **Anúncios Individuais Pagos:**
- ✅ Ativos por exatamente 30 dias após pagamento
- ❌ Após 30 dias: Pausados automaticamente (via função `pause_expired_individual_ads()`)
- 🔄 Para reativar: Pagar novamente (mais 30 dias)

---

## 📐 6. BANCO DE DADOS - NOVOS CAMPOS

### **Tabela: `animals`**

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `is_individual_paid` | BOOLEAN | `true` = Anúncio pago individualmente (NÃO conta no limite do plano) |
| `individual_paid_expires_at` | TIMESTAMPTZ | Data de expiração do anúncio individual (30 dias) |

### **Índice Criado:**
```sql
idx_animals_individual_paid_expires
-- Otimiza busca de anúncios individuais expirados
```

---

## ⚙️ 7. FUNÇÃO AUTOMÁTICA (Supabase)

### **Nome:** `pause_expired_individual_ads()`

**O que faz:**
1. Busca anúncios individuais pagos que expiraram
2. Altera `ad_status` para `'paused'`
3. Remove flags `is_individual_paid` e `individual_paid_expires_at`
4. Registra log em `system_logs`

**Quando executar:**
- 📅 Diariamente às 00:00 UTC (via cron job)
- 🔧 Ou manualmente quando necessário

---

## ✅ 8. VALIDAÇÕES IMPLEMENTADAS

### **Na Criação de Anúncios:**

```typescript
// 1. Contar anúncios do plano (exclui individuais pagos)
const planAnimalsCount = await countActiveAnimals(userId);

// 2. Verificar limite do plano
const planLimit = getAllowedAnimalsByPlan(user.plan);

// 3. Permitir criação se:
if (planAnimalsCount < planLimit) {
  // ✅ Criar anúncio do plano
  await createAnimal({ ...data, is_individual_paid: false });
} else {
  // ⚠️ Limite atingido! Opções:
  // a) Pausar anúncio existente
  // b) Pagar anúncio individual (avulso)
  // c) Fazer upgrade de plano
}
```

---

## 🧪 9. TESTES NECESSÁRIOS

### **Após Aplicar Migration:**

1. ✅ Criar anúncio do plano (verificar `is_individual_paid = false`)
2. ✅ Atingir limite do plano
3. ✅ Pagar anúncio individual (verificar `is_individual_paid = true` e `individual_paid_expires_at`)
4. ✅ Verificar contagem (deve excluir individuais pagos)
5. ✅ Simular expiração (executar `pause_expired_individual_ads()`)
6. ✅ Verificar que anúncio individual foi pausado após 30 dias

---

## 📞 10. PRÓXIMOS PASSOS

### **Imediato:**
- [ ] Aplicar migration `030_add_individual_paid_ads.sql` no Supabase
- [ ] Configurar cron job para `pause_expired_individual_ads()`
- [ ] Testar fluxo completo de anúncios individuais

### **Curto Prazo (Pendente - Conforme Auditoria Original):**
- [ ] Consolidar políticas RLS duplicadas (79 policies)
- [ ] Corrigir auth RLS initplan (8 policies)
- [ ] Remover índices não utilizados (60+ indexes)
- [ ] Adicionar índices em foreign keys (3 FKs)

### **Médio Prazo:**
- [ ] Implementar dashboard cache (materialized view)
- [ ] Adicionar skeletons de carregamento
- [ ] Wizard multi-step para cadastro de animais

---

## 📚 11. REFERÊNCIAS

- **Constantes:** `src/constants/plans.ts`
- **Lógica de Negócio:** `src/services/animalService.ts`
- **Interface de Planos:** `src/hooks/usePlansData.ts`
- **Migration SQL:** `supabase_migrations/030_add_individual_paid_ads.sql`

---

## ✨ CONCLUSÃO

Todas as correções foram aplicadas com sucesso no código front-end! 

**Para finalizar:**
1. Aplicar a migration SQL no Supabase
2. Configurar cron job para pausar anúncios expirados
3. Testar o fluxo completo

Após isso, o sistema estará 100% funcional com:
- ✅ Planos alinhados entre front-end e banco
- ✅ Limites corretos e claramente comunicados
- ✅ Sistema de anúncios individuais pagos funcionando
- ✅ Expiração automática implementada
- ✅ Plano VIP documentado

**Próxima etapa:** Otimizações de performance (RLS, cache, índices) conforme auditoria original.

---

**Documento gerado em:** 30/10/2025  
**Autor:** Sistema de Auditoria e Correções




















