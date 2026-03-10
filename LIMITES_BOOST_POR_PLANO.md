# 🎯 LIMITES DE BOOST POR PLANO - ATUALIZAÇÃO

**Data:** 03/11/2025  
**Status:** ✅ Documentado

---

## 📊 NOVOS LIMITES

### Boosts Mensais Incluídos por Plano

| Plano | Boosts/Mês | Cumulativo? | Renovação |
|-------|------------|-------------|-----------|
| **Free** | 0 | - | - |
| **Iniciante (Basic)** | 0 | - | - |
| **Pro** | 1 | ✅ Sim | Mensal |
| **Elite (Ultra)** | 2 | ✅ Sim | Mensal |
| **VIP** | 0* | - | Admin apenas |

*VIP não recebe boosts gratuitos, mas pode comprar pacotes.

---

## 🔄 BOOSTS CUMULATIVOS

### Como Funciona

Os boosts do plano são **CUMULATIVOS**:

```
Mês 1: Usuário Pro recebe 1 boost
       Não usa → Saldo: 1 boost

Mês 2: Usuário recebe +1 boost
       Saldo total: 2 boosts

Mês 3: Usa 1 boost → Saldo: 1 boost
       Recebe +1 boost → Saldo: 2 boosts
```

**Regra:** Os boosts do plano se acumulam enquanto o plano estiver ativo!

---

## 💰 PREÇOS ATUALIZADOS

### Boost Individual

- **R$ 97,00** por boost (1x 24h de destaque)

### Pacotes de Recarga

| Pacote | Boosts | Preço | Preço/Boost | Economia |
|--------|--------|-------|-------------|----------|
| **Single** | 1 | R$ 97,00 | R$ 97,00 | 0% |
| **Popular** | 5 | R$ 437,65 | R$ 87,53 | 10% |
| **Prime** | 10 | R$ 776,00 | R$ 77,60 | 20% |

---

## ⚡ BOOST CUMULATIVO (TEMPO)

### Novo Comportamento

Agora é possível **somar tempo** de boost no mesmo anúncio:

```
1º Boost: Animal turbinado por 24h (expira em D1)
   ↓
2º Boost: +24h adicionadas (expira em D2)
   ↓
3º Boost: +24h adicionadas (expira em D3)
```

**Resultado:** Com 3 boosts no mesmo anúncio = **3 dias** de destaque!

### Mensagens

- ✅ "Animal está turbinado por **2 dia(s)**!"
- ✅ "Evento está turbinado por **3 dia(s)**!"

---

## 🔐 IMPLEMENTAÇÃO NO BANCO

### Configuração de Planos

**Arquivo:** Migrations ou Admin Panel

```sql
-- Free/VIP/Iniciante: 0 boosts
UPDATE profiles 
SET plan_boost_credits = 0 
WHERE plan IN ('free', 'vip', 'basic');

-- Pro: 1 boost/mês (cumulativo)
-- Adicionar 1 boost mensal via cron job

-- Elite: 2 boosts/mês (cumulativo)
-- Adicionar 2 boosts mensais via cron job
```

### Renovação Mensal (Edge Function)

```typescript
// Executar todo dia 1 do mês
export async function renewMonthlyBoosts() {
  // Pro: +1 boost
  await supabase
    .from('profiles')
    .update({ 
      plan_boost_credits: sql`plan_boost_credits + 1` 
    })
    .eq('plan', 'pro')
    .gte('plan_expires_at', 'now()');

  // Elite: +2 boosts
  await supabase
    .from('profiles')
    .update({ 
      plan_boost_credits: sql`plan_boost_credits + 2` 
    })
    .eq('plan', 'ultra')
    .gte('plan_expires_at', 'now()');
}
```

---

## 📝 OBSERVAÇÕES IMPORTANTES

### 1. Boosts do Plano vs Comprados

- **Plano:** Cumulativos, renovados mensalmente
- **Comprados:** Não expiram, válidos sempre

### 2. Prioridade de Uso

1. **Primeiro:** Boosts comprados
2. **Depois:** Boosts do plano

### 3. Pool Compartilhado

- ✅ Mesmo pool para animais e eventos
- ✅ Usar em animal reduz o total
- ✅ Usar em evento reduz o total

---

## 🎯 EXEMPLO PRÁTICO

### Usuário Pro (1 boost/mês)

```
Janeiro: Recebe 1 boost (total: 1)
         Não usa → Acumula

Fevereiro: Recebe +1 boost (total: 2)
           Usa 1 em animal → Sobra 1

Março: Recebe +1 boost (total: 2)
       Compra pacote de 5 → Total: 7
       Usa 3 boosts → Sobra 4 (3 comprados + 1 plano)

Abril: Recebe +1 boost (total: 5)
       Usa 5 boosts → Todos os comprados gastos
       Sobra: 2 boosts do plano
```

---

## 🚀 STATUS

✅ **Boosts cumulativos** - Implementado  
✅ **Preços atualizados** - R$ 97,00  
✅ **Pacotes recalculados** - 10-20% desconto  
📝 **Limites por plano** - Documentado  
⏳ **Edge Function mensal** - Pendente  
⏳ **Admin Panel** - Pendente  

---

*Documento atualizado - 03/11/2025*


