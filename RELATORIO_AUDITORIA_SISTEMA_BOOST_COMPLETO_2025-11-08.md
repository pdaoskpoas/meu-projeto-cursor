# 🚀 RELATÓRIO DE AUDITORIA COMPLETA - SISTEMA DE IMPULSIONAMENTO

**Data:** 08 de Novembro de 2025  
**Auditor:** Engenheiro de Software Sênior - Especialista em Monetização  
**Escopo:** Sistema de Boost/Impulsionar (Anúncios e Eventos)  
**Status:** ✅ **AUDITORIA CONCLUÍDA**

---

## 📋 ÍNDICE

1. [Resumo Executivo](#resumo-executivo)
2. [Diagnóstico Técnico](#diagnóstico-técnico)
3. [Falhas e Pontos Críticos](#falhas-e-pontos-críticos)
4. [Análise de Segurança](#análise-de-segurança)
5. [Recomendações](#recomendações)
6. [Plano de Ação](#plano-de-ação)
7. [Classificação Geral](#classificação-geral)

---

## 🎯 RESUMO EXECUTIVO

### Estado Geral do Sistema

O sistema de impulsionamento está **funcional com ajustes necessários**. A lógica de negócio básica está corretamente implementada, incluindo:

- ✅ Pool compartilhado de boosts entre animais e eventos
- ✅ Desconto correto de créditos (prioritariamente dos comprados)
- ✅ Soma de tempo cumulativo (2+ boosts no mesmo item)
- ✅ Verificação de propriedade (usuário só impulsiona o próprio conteúdo)
- ✅ Exibição visual com badges e destaque
- ✅ Contador de tempo regressivo funcional

**PORÉM**, foram identificadas **5 falhas críticas** que podem comprometer a segurança, integridade e experiência do usuário.

### Métricas da Auditoria

| Aspecto | Status | Nível de Risco |
|---------|--------|----------------|
| **Lógica de Negócio** | 🟢 Correto | Baixo |
| **Expiração Automática** | 🔴 Crítico | **ALTO** |
| **Race Conditions** | 🔴 Crítico | **ALTO** |
| **Segurança RLS** | 🟡 Funcional | Médio |
| **Acumulação de Boosts** | 🟢 Correto | Baixo |
| **Sincronização de Tempo** | 🟡 Atenção | Médio |
| **Front-End/UX** | 🟢 Correto | Baixo |
| **Histórico/Auditoria** | 🟢 Correto | Baixo |

---

## 🔍 DIAGNÓSTICO TÉCNICO

### 1. Sistema de Expiração Automática

#### ❌ **FALHA CRÍTICA #1: Cron Job Não Configurado**

**Problema:**
- A função `expire_boosts()` existe no banco de dados (migration 008)
- **MAS NÃO HÁ NENHUM MECANISMO AUTOMÁTICO EXECUTANDO-A**
- Não existe `pg_cron` configurado
- Não existem Edge Functions agendadas no Supabase
- Não há webhooks ou tarefas scheduled

**Impacto:**
```
✅ Boost aplicado: expires_at = "2025-11-10T10:00:00Z"
❌ Passa de 10/11 às 10:00
❌ Sistema NÃO remove automaticamente
❌ Anúncio continua destacado INDEFINIDAMENTE
❌ Usuário paga por 24h mas ganha destaque eterno
```

**Código da Função (não executada):**

```sql
-- Migration 008 - Linha 104
CREATE OR REPLACE FUNCTION expire_boosts()
RETURNS void AS $$
BEGIN
    -- Desativar boosts expirados
    UPDATE boost_history 
    SET is_active = FALSE 
    WHERE expires_at <= NOW() AND is_active = TRUE;
    
    -- Atualizar status de boost nos animais
    UPDATE animals 
    SET is_boosted = FALSE, boost_expires_at = NULL
    WHERE is_boosted = TRUE AND boost_expires_at <= NOW();
    
    -- Atualizar status de boost nos eventos
    UPDATE events 
    SET is_boosted = FALSE, boost_expires_at = NULL
    WHERE is_boosted = TRUE AND boost_expires_at <= NOW();
END;
$$ LANGUAGE plpgsql;
```

**Status Atual:**
- 🔴 A função existe mas **NUNCA É EXECUTADA**
- 🔴 Boosts expirados continuam ativos no banco
- 🔴 Anúncios aparecem como impulsionados após expiração
- 🔴 Homepage mostra eventos com boost expirado

#### Mitigação Parcial no Front-End

O front-end tem mitigação via `BoostCountdown` e query com filtro:

```typescript
// AuctionCarousel.tsx - Linha 107
.eq('is_boosted', true)
.gt('boost_expires_at', new Date().toISOString()) // ✅ Filtra no client
```

**MAS:**
- ❌ O banco continua com dados incorretos (`is_boosted = true` expirado)
- ❌ Outras queries podem esquecer o filtro
- ❌ APIs REST/GraphQL podem expor dados errados
- ❌ Relatórios de admin mostram métricas falsas

---

### 2. Race Conditions e Atomicidade

#### ❌ **FALHA CRÍTICA #2: Operações Não-Atômicas**

**Problema:**
O código atual realiza operações em **3 etapas separadas** sem transação:

```typescript
// boostService.ts - Linha 64-143
async boostAnimal(userId: string, animalId: string) {
  // 1️⃣ Verificar saldo (SELECT)
  const boostInfo = await this.getBoostInfo(userId);
  
  // ⏰ INTERVALO DE TEMPO - Outro processo pode executar aqui!
  
  // 2️⃣ Atualizar profile (UPDATE)
  await supabase.from('profiles').update({ 
    plan_boost_credits: newPlanCredits 
  }).eq('id', userId);
  
  // ⏰ INTERVALO DE TEMPO - Outro processo pode executar aqui!
  
  // 3️⃣ Ativar boost (UPDATE)
  await supabase.from('animals').update({ 
    is_boosted: true 
  }).eq('id', animalId);
}
```

**Cenário de Ataque:**

```
Usuário tem 1 boost disponível

Thread A                    Thread B
├─ SELECT (1 boost) ✅      
│                          ├─ SELECT (1 boost) ✅
├─ UPDATE -1 (0 restante)  │
│                          ├─ UPDATE -1 (-1 restante!) ❌
├─ Boost Animal A ✅        │
                           ├─ Boost Animal B ✅

RESULTADO: 2 boosts usados com saldo de apenas 1!
```

**Exploração Possível:**
1. Abrir 2 abas do navegador
2. Clicar em "Impulsionar" em ambas simultaneamente
3. Sistema debita 1 boost mas ativa 2 anúncios
4. Saldo fica negativo ou incorreto

**Código Vulnerável:**

```typescript
// animalService.ts - Linha 410-474
async boostAnimal(animalId: string, userId: string, duration: number = 24) {
  // ❌ Não usa transação
  // ❌ Não usa row-level locks
  // ❌ Não usa UPDATE com condição WHERE no saldo
  
  const profile = await this.getUserProfile(userId); // SELECT
  const planCredits = profile.plan_boost_credits ?? 0;
  
  // ⏰ RACE CONDITION AQUI
  
  await supabase.from('profiles').update({
    plan_boost_credits: planCredits - 1 // ❌ Valor calculado no client
  }).eq('id', userId);
}
```

---

### 3. Verificação de Saldo Inconsistente

#### 🟡 **PROBLEMA #3: Verificação Redundante e Fraca**

**Múltiplos Serviços com Lógicas Diferentes:**

Existem **3 implementações** do boost no código:

1. `boostService.ts` (✅ Mais robusto)
2. `animalService.ts` (⚠️ Lógica simplificada)
3. `eventService.ts` (⚠️ Lógica simplificada)

**Inconsistência:**

```typescript
// boostService.ts - Linha 110-118 ✅ CORRETO
if (newPurchasedCredits > 0) {
  newPurchasedCredits -= 1;
} else {
  newPlanCredits -= 1;
}

// animalService.ts - Linha 420 ⚠️ SIMPLIFICADO
const usePlanBoost = planCredits > 0; // Prioriza plano, não comprados!
```

**Problema:**
- `boostService.ts`: Prioriza **comprados** → correto
- `animalService.ts`: Prioriza **plano** → errado
- Comportamento **muda dependendo de qual função é chamada**

---

### 4. Sincronização de Tempo (UTC vs Local)

#### 🟡 **PROBLEMA #4: Possível Dessincronia de Timezone**

**Código Misto:**

```typescript
// Backend usa UTC (correto)
boost_expires_at: new Date(Date.now() + duration * 60 * 60 * 1000).toISOString()

// Front-end compara com local time
const currentTime = Date.now(); // ✅ UTC timestamp
const endTime = new Date(boost_expires_at).getTime(); // ✅ UTC

// Countdown
.gt('boost_expires_at', new Date().toISOString()) // ✅ UTC
```

**Status:**
- ✅ **Aparentemente correto** (tudo em UTC)
- ⚠️ MAS pode ter problema se algum componente usar `toLocaleString()` sem conversão

**Recomendação:**
- Adicionar comentários explícitos `// SEMPRE UTC`
- Usar biblioteca de datas (date-fns, dayjs) para evitar erros

---

### 5. Políticas RLS (Row Level Security)

#### 🟢 **SEGURANÇA CORRETA**

As políticas RLS estão bem implementadas:

```sql
-- Migration 009 - Linha 334
CREATE POLICY "Users can view own boost history" ON boost_history
FOR SELECT USING (user_id = auth.uid());

-- Migration 018 - Linha 347 (otimizada)
CREATE POLICY "Users can view own boost history"
ON public.boost_history FOR SELECT
TO authenticated
USING (user_id = (select auth.uid()));
```

**Proteções Existentes:**
✅ Usuário só vê próprio histórico
✅ Usuário só pode inserir boosts com seu próprio `user_id`
✅ Admin pode ver tudo
✅ Verificação de ownership no service layer

**Código de Verificação:**

```typescript
// boostService.ts - Linha 77-82
const { data: animal } = await supabase
  .from('animals')
  .eq('id', animalId)
  .eq('owner_id', userId) // ✅ Verifica proprietário
  .single();
```

---

### 6. Acumulação de Boosts (Planos Pagos)

#### 🟢 **LÓGICA CORRETA**

A acumulação está implementada conforme especificado:

**Tabela `plans` (Migration 054):**

```sql
-- Linha 30
available_boosts INTEGER DEFAULT 0, -- Boosts gratuitos por mês

-- Planos
Pro: available_boosts = 1 (cumulativo)
Ultra: available_boosts = 2 (cumulativo)
VIP: available_boosts = 0 (não recebe)
```

**Perfil do Usuário:**

```sql
-- profiles.plan_boost_credits: Acumulado do plano
-- profiles.purchased_boost_credits: Comprados (nunca expiram)
```

**Renovação Mensal:**
⚠️ A função `reset_monthly_boosts()` existe mas:
- Não está sendo executada automaticamente
- Precisa de cron job (mesmo problema da expiração)

---

### 7. Exibição Visual no Front-End

#### 🟢 **UX CORRETA**

O front-end está bem implementado:

**Badge de Destaque:**

```tsx
// AnimalsPage.tsx - Linha 388-395
{animal.is_boosted && (
  <Badge className="bg-yellow-500">
    <Zap className="h-3 w-3 mr-1" />
    Impulsionado
  </Badge>
)}
```

**Countdown em Tempo Real:**

```tsx
// BoostCountdown.tsx - Linha 16-38
useEffect(() => {
  const calculateTimeLeft = () => {
    const now = new Date().getTime();
    const end = new Date(endTime).getTime();
    const difference = end - now;
    // Atualiza a cada segundo
  };
  
  const timer = setInterval(calculateTimeLeft, 1000);
  return () => clearInterval(timer);
}, [endTime, onExpire]);
```

**Homepage - Apenas Impulsionados:**

```typescript
// AuctionCarousel.tsx - Linha 107-114
const { data } = await supabase
  .from('events')
  .eq('ad_status', 'active')
  .eq('is_boosted', true)
  .gt('boost_expires_at', new Date().toISOString())
  .order('boost_expires_at', { ascending: false })
  .limit(10);
```

**Priorização em Buscas:**

```sql
-- Migration 038 - Linha 90
ORDER BY 
  a.is_boosted DESC,  -- ✅ Impulsionados sempre primeiro
  CASE WHEN order_by = 'ranking' THEN ar.clicks END DESC,
  a.name ASC
```

---

### 8. Histórico e Auditoria

#### 🟢 **RASTREAMENTO COMPLETO**

O sistema registra todos os boosts:

```sql
-- Migration 007 - boost_history
CREATE TABLE boost_history (
  id UUID PRIMARY KEY,
  content_type TEXT, -- 'animal' ou 'event'
  content_id UUID,
  user_id UUID,
  boost_type TEXT, -- 'plan_included' ou 'purchased'
  duration_hours INTEGER DEFAULT 24,
  cost DECIMAL DEFAULT 0,
  started_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Registro Correto:**

```typescript
// boostService.ts - Linha 145-155
await supabase.from('boost_history').insert({
  content_type: 'animal',
  content_id: animalId,
  user_id: userId,
  boost_type: '...', // ✅ Identifica origem
  duration_hours: 24,
  started_at: new Date().toISOString(),
  expires_at: boostExpiresAt.toISOString(),
  is_active: true,
});
```

---

## 🚨 FALHAS E PONTOS CRÍTICOS

### Classificação de Severidade

| # | Falha | Severidade | Exploração | Status |
|---|-------|------------|------------|--------|
| 1 | **Expiração não automática** | 🔴 Crítica | Fácil | Aberta |
| 2 | **Race condition** | 🔴 Crítica | Média | Aberta |
| 3 | **Lógicas inconsistentes** | 🟡 Média | Difícil | Aberta |
| 4 | **Timezone potencial** | 🟡 Baixa | Difícil | Mitigada |
| 5 | **Renovação mensal manual** | 🟡 Média | N/A | Aberta |

---

### FALHA #1: Expiração Não Automática

**Impacto no Negócio:**
- 💸 **Perda de receita**: Usuários ganham destaque eterno pagando por 24h
- 📊 **Métricas falsas**: Relatórios mostram boosts expirados como ativos
- 🔄 **Saturação visual**: Homepage cheia de boosts "eternos"
- ⚖️ **Injustiça**: Usuários novos pagam enquanto antigos têm boost infinito

**Vulnerabilidades:**

```python
# Exploit: Boost Eterno
1. Comprar 1 boost (R$ 47,00)
2. Impulsionar animal
3. Aguardar 24h
4. ✅ Animal continua impulsionado indefinidamente
5. Repetir em todos os animais
6. Resultado: Destaque eterno por R$ 47/animal
```

**Evidência:**

```sql
-- Query para detectar boosts expirados ativos
SELECT 
  a.id,
  a.name,
  a.is_boosted,
  a.boost_expires_at,
  NOW() - a.boost_expires_at AS tempo_expirado
FROM animals a
WHERE a.is_boosted = TRUE
  AND a.boost_expires_at < NOW();

-- Resultado esperado: VAZIO
-- Resultado real: PODE TER DEZENAS/CENTENAS
```

---

### FALHA #2: Race Condition

**Impacto no Negócio:**
- 💸 **Perda de receita**: Usuários conseguem boosts "gratuitos"
- 🔢 **Saldo negativo**: Sistema permite saldo < 0
- 🐛 **Bug difícil de rastrear**: Ocorre esporadicamente

**Exploit Técnico:**

```python
# Exploit: Boost Duplo
import asyncio
import requests

async def boost_simultaneo():
    url = "https://api.cavalaria.com/boost"
    headers = {"Authorization": f"Bearer {token}"}
    
    # Dispara 2 requests simultâneos
    task1 = asyncio.create_task(
        requests.post(url, json={"animalId": "A1"}, headers=headers)
    )
    task2 = asyncio.create_task(
        requests.post(url, json={"animalId": "A2"}, headers=headers)
    )
    
    # Ambos verificam saldo = 1
    # Ambos passam na validação
    # Ambos decrementam
    # Resultado: 2 boosts com 1 crédito
    
    await asyncio.gather(task1, task2)
```

**Probabilidade:**
- 🟡 **Baixa** em uso normal (1 usuário, 1 aba)
- 🔴 **Alta** se usuário malicioso explorar intencionalmente
- 🔴 **Certa** em sistema com alta concorrência

---

### FALHA #3: Lógicas Inconsistentes

**Problema:**
- `boostService.ts` prioriza **comprados** (correto)
- `animalService.ts` prioriza **plano** (errado)

**Impacto:**
- Comportamento imprevisível
- Dificuldade de manutenção
- Bugs difíceis de reproduzir

**Recomendação:**
- Manter APENAS `boostService.ts`
- Remover lógica de `animalService.ts` e `eventService.ts`
- Centralizar em um único ponto

---

## 🔐 ANÁLISE DE SEGURANÇA

### Matriz de Ameaças

| Ameaça | Probabilidade | Impacto | Risco | Mitigação Atual |
|--------|---------------|---------|-------|-----------------|
| **Boost eterno** | 🔴 Alta | 🔴 Alto | 🔴 Crítico | ❌ Nenhuma |
| **Race condition** | 🟡 Média | 🔴 Alto | 🔴 Alto | ❌ Nenhuma |
| **Boost de outro usuário** | 🟢 Baixa | 🔴 Alto | 🟡 Médio | ✅ RLS + Verificação |
| **Manipular saldo** | 🟢 Baixa | 🔴 Alto | 🟡 Médio | ✅ RLS |
| **Ver histórico alheio** | 🟢 Baixa | 🟡 Médio | 🟢 Baixo | ✅ RLS |

### Avaliação RLS (Row Level Security)

**✅ PONTOS FORTES:**

1. **Isolamento de Dados:**
```sql
-- Usuário só vê próprio histórico
USING (user_id = auth.uid())
```

2. **Verificação de Ownership:**
```typescript
.eq('owner_id', userId) // No service layer
```

3. **Admin Oversight:**
```sql
-- Admin pode auditar tudo
EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
```

**⚠️ PONTOS DE ATENÇÃO:**

1. **Tabelas `animals` e `events`:**
```sql
-- Qualquer um pode ver animais ativos
FOR SELECT USING (ad_status = 'active');

-- ✅ Correto para marketplace
-- ⚠️ MAS expõe is_boosted e boost_expires_at
```

**Recomendação:**
- Criar `VIEW` pública sem campos sensíveis de boost
- Manter campos de boost apenas para owner/admin

---

### Priorização de Uso (Comprados vs Plano)

**Regra de Negócio Documentada:**
> "Prioridade de Uso: 1. Primeiro: Boosts comprados 2. Depois: Boosts do plano"
> — LIMITES_BOOST_POR_PLANO.md, Linha 139-140

**Implementação Atual:**

```typescript
// ✅ CORRETO - boostService.ts
if (newPurchasedCredits > 0) {
  newPurchasedCredits -= 1; // Prioriza comprados
} else {
  newPlanCredits -= 1;
}

// ❌ ERRADO - animalService.ts  
const usePlanBoost = planCredits > 0; // Prioriza plano!
```

**Impacto:**
- Usuário paga por boosts mas sistema usa os gratuitos primeiro
- Boosts comprados acumulam sem serem usados
- Perda de clareza na contabilidade

---

## 💡 RECOMENDAÇÕES

### Correções Críticas (URGENTE)

#### 1. Implementar Expiração Automática

**Opção A: pg_cron (Recomendado para Supabase)**

```sql
-- Instalar extensão
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Agendar para rodar a cada 5 minutos
SELECT cron.schedule(
  'expire-boosts-every-5min',
  '*/5 * * * *', -- A cada 5 minutos
  $$SELECT expire_boosts();$$
);

-- Verificar job criado
SELECT * FROM cron.job;
```

**Opção B: Edge Function Agendada (Supabase)**

```typescript
// supabase/functions/expire-boosts/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from '@supabase/supabase-js';

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // Executar função SQL
  const { data, error } = await supabase.rpc('expire_boosts');

  return new Response(
    JSON.stringify({ success: !error, data }),
    { headers: { "Content-Type": "application/json" } }
  );
});
```

**Agendar no Supabase Dashboard:**
```
Function: expire-boosts
Schedule: */5 * * * * (a cada 5 minutos)
Enabled: true
```

**Opção C: Webhook Externo (Cron-job.org, EasyCron)**

```bash
# Criar endpoint público
POST https://api.cavalaria.com/cron/expire-boosts
Authorization: Bearer <SECRET_TOKEN>

# Agendar em cron-job.org
Schedule: Every 5 minutes
URL: https://api.cavalaria.com/cron/expire-boosts
Auth Header: Bearer <SECRET_TOKEN>
```

---

#### 2. Corrigir Race Condition

**Solução: Transação com Row-Level Lock**

```typescript
// boostService.ts - CORRIGIDO
async boostAnimal(userId: string, animalId: string): Promise<BoostResult> {
  try {
    // Usar transação SQL com lock
    const { data, error } = await supabase.rpc('boost_animal_atomic', {
      p_user_id: userId,
      p_animal_id: animalId,
      p_duration_hours: 24
    });

    if (error) throw error;
    return data;
  } catch (error) {
    return { success: false, message: error.message };
  }
}
```

**Função SQL Atômica:**

```sql
-- Migration: create_atomic_boost_function.sql
CREATE OR REPLACE FUNCTION boost_animal_atomic(
  p_user_id UUID,
  p_animal_id UUID,
  p_duration_hours INTEGER DEFAULT 24
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_plan_credits INTEGER;
  v_purchased_credits INTEGER;
  v_animal_name TEXT;
  v_boost_expires_at TIMESTAMPTZ;
  v_result JSONB;
BEGIN
  -- 🔒 LOCK: Trava a linha do perfil
  SELECT plan_boost_credits, purchased_boost_credits
  INTO v_plan_credits, v_purchased_credits
  FROM profiles
  WHERE id = p_user_id
  FOR UPDATE; -- ✅ Row-level lock
  
  -- Verificar saldo
  IF (v_plan_credits + v_purchased_credits) <= 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Sem créditos de impulsionar disponíveis'
    );
  END IF;
  
  -- Verificar ownership
  SELECT name INTO v_animal_name
  FROM animals
  WHERE id = p_animal_id AND owner_id = p_user_id;
  
  IF v_animal_name IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Animal não encontrado ou sem permissão'
    );
  END IF;
  
  -- Calcular expiração (soma se já estiver boosted)
  SELECT COALESCE(
    CASE 
      WHEN is_boosted AND boost_expires_at > NOW() 
      THEN boost_expires_at + (p_duration_hours || ' hours')::INTERVAL
      ELSE NOW() + (p_duration_hours || ' hours')::INTERVAL
    END,
    NOW() + (p_duration_hours || ' hours')::INTERVAL
  )
  INTO v_boost_expires_at
  FROM animals
  WHERE id = p_animal_id;
  
  -- Debitar créditos (prioriza comprados)
  IF v_purchased_credits > 0 THEN
    UPDATE profiles
    SET purchased_boost_credits = purchased_boost_credits - 1
    WHERE id = p_user_id;
  ELSE
    UPDATE profiles
    SET plan_boost_credits = plan_boost_credits - 1
    WHERE id = p_user_id;
  END IF;
  
  -- Ativar boost
  UPDATE animals
  SET 
    is_boosted = TRUE,
    boost_expires_at = v_boost_expires_at,
    boosted_by = p_user_id,
    boosted_at = NOW()
  WHERE id = p_animal_id;
  
  -- Registrar histórico
  INSERT INTO boost_history (
    content_type, content_id, user_id, boost_type,
    duration_hours, cost, started_at, expires_at, is_active
  ) VALUES (
    'animal', p_animal_id, p_user_id,
    CASE WHEN v_purchased_credits > 0 THEN 'purchased' ELSE 'plan_included' END,
    p_duration_hours, 0, NOW(), v_boost_expires_at, TRUE
  );
  
  -- Calcular dias restantes
  v_result := jsonb_build_object(
    'success', true,
    'message', format('%s está turbinado por %s dia(s)!', 
                      v_animal_name,
                      CEIL(EXTRACT(EPOCH FROM (v_boost_expires_at - NOW())) / 86400)),
    'boosts_remaining', (v_plan_credits + v_purchased_credits - 1)
  );
  
  RETURN v_result;
END;
$$;
```

**Vantagens:**
- ✅ **100% atômico**: Tudo ou nada
- ✅ **Row-level lock**: Impede race conditions
- ✅ **Uma única query**: Performance otimizada
- ✅ **Rollback automático**: Se qualquer passo falhar

---

#### 3. Consolidar Lógica em Um Único Serviço

**Ação:**
- ✅ Manter `boostService.ts` como única fonte de verdade
- ❌ Remover `boostAnimal()` de `animalService.ts`
- ❌ Remover `boostEvent()` de `eventService.ts`

**Refatoração:**

```typescript
// animalService.ts - ANTES
async boostAnimal(animalId, userId, duration) {
  // ❌ Lógica duplicada aqui
}

// animalService.ts - DEPOIS
async boostAnimal(animalId, userId, duration) {
  // ✅ Delegar para boostService
  return boostService.boostAnimal(userId, animalId);
}
```

---

### Melhorias de Segurança

#### 4. Criar Views Públicas sem Dados Sensíveis

```sql
-- Migration: create_public_animal_view.sql
CREATE OR REPLACE VIEW public_animals AS
SELECT 
  id,
  name,
  breed,
  gender,
  birth_date,
  coat,
  current_city,
  current_state,
  owner_id,
  ad_status,
  images,
  is_boosted, -- ✅ Pode manter para ordenação
  -- ❌ NÃO expor: boost_expires_at, boosted_by, boosted_at
  published_at,
  impression_count,
  click_count
FROM animals
WHERE ad_status = 'active';

-- Grants
GRANT SELECT ON public_animals TO anon, authenticated;
```

**Benefício:**
- Exposição controlada de dados
- Impossível inferir quanto tempo falta no boost
- Evita scraping de informações sensíveis

---

#### 5. Rate Limiting no Boost

```typescript
// Adicionar cooldown de 30 segundos entre boosts
const BOOST_COOLDOWN_MS = 30000;

async boostAnimal(userId: string, animalId: string) {
  // Verificar último boost do usuário
  const { data: lastBoost } = await supabase
    .from('boost_history')
    .select('created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  
  if (lastBoost) {
    const timeSince = Date.now() - new Date(lastBoost.created_at).getTime();
    if (timeSince < BOOST_COOLDOWN_MS) {
      return {
        success: false,
        message: `Aguarde ${Math.ceil((BOOST_COOLDOWN_MS - timeSince) / 1000)}s para turbinar novamente.`
      };
    }
  }
  
  // Continuar com boost...
}
```

---

### Melhorias de UX/Front-End

#### 6. Notificação de Expiração

```typescript
// Adicionar notificação 1h antes de expirar
useEffect(() => {
  if (!animal.is_boosted || !animal.boost_expires_at) return;
  
  const expiresAt = new Date(animal.boost_expires_at);
  const oneHourBefore = expiresAt.getTime() - (60 * 60 * 1000);
  const now = Date.now();
  
  if (now < oneHourBefore) {
    const timeout = setTimeout(() => {
      toast({
        title: "⚡ Boost expirando em 1 hora!",
        description: `${animal.name} perderá o destaque em breve.`,
        action: <Button onClick={() => handleBoost(animal.id)}>Renovar</Button>
      });
    }, oneHourBefore - now);
    
    return () => clearTimeout(timeout);
  }
}, [animal]);
```

---

#### 7. Indicador Visual de Tempo Restante

```tsx
// Adicionar barra de progresso no card
<Card>
  {animal.is_boosted && (
    <>
      <Badge className="bg-yellow-500">
        <Zap /> Impulsionado
      </Badge>
      <Progress 
        value={getBoostProgress(animal.boost_expires_at)} 
        className="h-1 mt-2"
      />
      <p className="text-xs text-muted-foreground mt-1">
        {getTimeRemaining(animal.boost_expires_at)}
      </p>
    </>
  )}
</Card>
```

---

### Otimizações de Performance

#### 8. Índice Composto para Queries de Boost

```sql
-- Migration: optimize_boost_queries.sql

-- Para queries de animais impulsionados ativos
CREATE INDEX IF NOT EXISTS idx_animals_boosted_active 
ON animals (is_boosted, boost_expires_at, ad_status)
WHERE is_boosted = TRUE AND ad_status = 'active';

-- Para queries de eventos impulsionados ativos
CREATE INDEX IF NOT EXISTS idx_events_boosted_active 
ON events (is_boosted, boost_expires_at, ad_status)
WHERE is_boosted = TRUE AND ad_status = 'active';

-- Para histórico de boost por usuário
CREATE INDEX IF NOT EXISTS idx_boost_history_user_active
ON boost_history (user_id, is_active, created_at DESC)
WHERE is_active = TRUE;
```

---

### Monitoramento e Métricas

#### 9. Dashboard de Métricas de Boost

```sql
-- View para admin: métricas de boost
CREATE OR REPLACE VIEW boost_metrics AS
SELECT 
  DATE_TRUNC('day', started_at) AS day,
  COUNT(*) AS total_boosts,
  COUNT(*) FILTER (WHERE boost_type = 'purchased') AS purchased_boosts,
  COUNT(*) FILTER (WHERE boost_type = 'plan_included') AS plan_boosts,
  COUNT(DISTINCT user_id) AS unique_users,
  SUM(cost) AS revenue
FROM boost_history
WHERE started_at >= NOW() - INTERVAL '30 days'
GROUP BY day
ORDER BY day DESC;

-- Query de auditoria: boosts expirados ainda ativos
CREATE OR REPLACE VIEW boost_expired_but_active AS
SELECT 
  CASE 
    WHEN a.id IS NOT NULL THEN 'animal'
    WHEN e.id IS NOT NULL THEN 'event'
  END AS type,
  COALESCE(a.id, e.id) AS content_id,
  COALESCE(a.name, e.title) AS content_name,
  COALESCE(a.boost_expires_at, e.boost_expires_at) AS expired_at,
  NOW() - COALESCE(a.boost_expires_at, e.boost_expires_at) AS time_expired
FROM animals a
FULL OUTER JOIN events e ON FALSE
WHERE 
  (a.is_boosted = TRUE AND a.boost_expires_at < NOW())
  OR
  (e.is_boosted = TRUE AND e.boost_expires_at < NOW());
```

---

## 📋 PLANO DE AÇÃO

### Fase 1: Correções Críticas (URGENTE - 1-2 dias)

| # | Ação | Prioridade | Esforço | Responsável |
|---|------|------------|---------|-------------|
| 1 | Implementar pg_cron para expiração | 🔴 P0 | 2h | Backend |
| 2 | Criar função SQL atômica de boost | 🔴 P0 | 4h | Backend |
| 3 | Refatorar front-end para usar função atômica | 🔴 P0 | 3h | Frontend |
| 4 | Testar race conditions | 🔴 P0 | 2h | QA |
| 5 | Deploy em produção | 🔴 P0 | 1h | DevOps |

**Total Fase 1:** 12 horas (~1,5 dias)

---

### Fase 2: Melhorias de Segurança (ALTA - 3-5 dias)

| # | Ação | Prioridade | Esforço | Responsável |
|---|------|------------|---------|-------------|
| 6 | Criar views públicas sem dados sensíveis | 🟡 P1 | 3h | Backend |
| 7 | Implementar rate limiting | 🟡 P1 | 2h | Backend |
| 8 | Consolidar lógica em boostService | 🟡 P1 | 4h | Backend |
| 9 | Adicionar testes de segurança | 🟡 P1 | 4h | QA |
| 10 | Code review e auditoria | 🟡 P1 | 2h | Tech Lead |

**Total Fase 2:** 15 horas (~2 dias)

---

### Fase 3: UX e Performance (MÉDIA - 5-7 dias)

| # | Ação | Prioridade | Esforço | Responsável |
|---|------|------------|---------|-------------|
| 11 | Notificação de expiração | 🟢 P2 | 3h | Frontend |
| 12 | Barra de progresso visual | 🟢 P2 | 2h | Frontend |
| 13 | Otimizar índices | 🟢 P2 | 2h | Backend/DBA |
| 14 | Dashboard de métricas admin | 🟢 P2 | 6h | Fullstack |
| 15 | Documentação técnica | 🟢 P2 | 4h | Tech Writer |

**Total Fase 3:** 17 horas (~2 dias)

---

### Fase 4: Monitoramento e Alertas (BAIXA - Contínuo)

| # | Ação | Prioridade | Esforço | Responsável |
|---|------|------------|---------|-------------|
| 16 | Setup de alertas (Sentry, Datadog) | 🔵 P3 | 3h | DevOps |
| 17 | Logs estruturados | 🔵 P3 | 2h | Backend |
| 18 | Métricas de negócio (Metabase) | 🔵 P3 | 4h | Data |
| 19 | Testes E2E de boost | 🔵 P3 | 6h | QA |
| 20 | Playbook de incidentes | 🔵 P3 | 2h | DevOps |

**Total Fase 4:** 17 horas (~2 dias)

---

**TOTAL GERAL:** ~61 horas (~8 dias úteis com 1 desenvolvedor fullstack)

---

## 🎯 CLASSIFICAÇÃO GERAL

### Score de Segurança: 6.5/10 🟡

| Critério | Score | Peso | Nota Ponderada |
|----------|-------|------|----------------|
| **Lógica de Negócio** | 9/10 | 20% | 1.8 |
| **Segurança** | 7/10 | 25% | 1.75 |
| **Atomicidade** | 4/10 | 20% | 0.8 |
| **Expiração** | 3/10 | 20% | 0.6 |
| **UX/Front-End** | 9/10 | 10% | 0.9 |
| **Auditoria** | 8/10 | 5% | 0.4 |
| **TOTAL** | **6.5/10** | 100% | **6.5** |

---

### Classificação por Cores

```
🟢 CORRETO E SEGURO (8-10)
├─ Lógica de negócio básica
├─ Políticas RLS
├─ Front-end/UX
└─ Sistema de auditoria

🟡 FUNCIONAL COM AJUSTES (5-7)
├─ Segurança geral
├─ Sincronização de tempo
└─ Acumulação de boosts

🔴 FALHAS CRÍTICAS ENCONTRADAS (0-4)
├─ Expiração automática (3/10)
├─ Race conditions (4/10)
└─ Inconsistência de lógicas (5/10)
```

---

## 📈 MÉTRICAS DE RISCO

### Probabilidade x Impacto

```
         IMPACTO
         ↑
    ALTO │  [Race]    [Expiração]
         │     
  MÉDIO  │            [Lógicas]
         │  [Timezone]
   BAIXO │  [RLS]
         └─────────────────────→ PROBABILIDADE
           BAIXA  MÉDIA  ALTA
```

### Risco Financeiro Estimado

**Cenário Pessimista (sem correções):**

```
📊 Estimativa de Perda Mensal

Boost eterno (Falha #1):
- 100 usuários exploram = 100 boosts eternos
- Perda: R$ 47,00 × 100 = R$ 4.700,00/mês

Race condition (Falha #2):
- 5% dos boosts duplicados
- 500 boosts/mês × 5% × R$ 47 = R$ 1.175,00/mês

TOTAL ESTIMADO: R$ 5.875,00/mês de perda
                R$ 70.500,00/ano
```

**Cenário Realista:**

```
- 30% dos usuários descobrem boost eterno
- Perda: R$ 1.410,00/mês × 12 = R$ 16.920,00/ano
```

---

## 🔬 TESTES RECOMENDADOS

### 1. Teste de Expiração

```sql
-- Setup
INSERT INTO animals (id, name, owner_id, is_boosted, boost_expires_at)
VALUES (
  gen_random_uuid(),
  'Teste Expiração',
  '<USER_ID>',
  TRUE,
  NOW() - INTERVAL '1 hour' -- Expirado há 1h
);

-- Executar expiração
SELECT expire_boosts();

-- Verificar
SELECT is_boosted, boost_expires_at 
FROM animals 
WHERE name = 'Teste Expiração';

-- Resultado esperado: is_boosted = FALSE
```

---

### 2. Teste de Race Condition

```javascript
// test/boost-race-condition.spec.ts
import { test, expect } from '@playwright/test';

test('Prevenir boost duplo com 1 crédito', async ({ browser }) => {
  // Criar 2 contextos (simula 2 abas)
  const context1 = await browser.newContext();
  const context2 = await browser.newContext();
  
  const page1 = await context1.newPage();
  const page2 = await context2.newPage();
  
  // Login em ambas
  await Promise.all([
    page1.goto('/login'),
    page2.goto('/login')
  ]);
  
  // Usuário tem 1 boost apenas
  await setupUserWithOneBoost(userId);
  
  // Clicar em "Impulsionar" simultaneamente
  await Promise.all([
    page1.click('[data-testid="boost-button"]'),
    page2.click('[data-testid="boost-button"]')
  ]);
  
  // Aguardar resposta
  await page1.waitForTimeout(2000);
  await page2.waitForTimeout(2000);
  
  // Verificar: apenas 1 deve ter sucesso
  const boostCount = await countActiveBoosts(userId);
  expect(boostCount).toBe(1);
  
  const credits = await getUserCredits(userId);
  expect(credits).toBe(0);
});
```

---

### 3. Teste de Acumulação

```typescript
// test/boost-cumulative.spec.ts
test('Acumular boosts no mesmo animal', async ({ page }) => {
  // Setup: usuário com 3 boosts
  await setupUserWithBoosts(userId, 3);
  
  // Impulsionar mesmo animal 3x
  await page.goto(`/animal/${animalId}`);
  
  await page.click('[data-testid="boost-button"]');
  await expect(page.locator('.toast')).toContainText('1 dia');
  
  await page.click('[data-testid="boost-button"]');
  await expect(page.locator('.toast')).toContainText('2 dias');
  
  await page.click('[data-testid="boost-button"]');
  await expect(page.locator('.toast')).toContainText('3 dias');
  
  // Verificar banco
  const animal = await getAnimal(animalId);
  const hoursRemaining = (new Date(animal.boost_expires_at) - new Date()) / (1000 * 60 * 60);
  
  expect(hoursRemaining).toBeGreaterThan(71); // ~72h
  expect(hoursRemaining).toBeLessThan(73);
});
```

---

### 4. Teste de Segurança RLS

```typescript
// test/boost-security.spec.ts
test('Não permitir impulsionar animal de outro usuário', async ({ request }) => {
  const maliciousUserId = 'user-malicious';
  const victimAnimalId = 'animal-victim';
  
  const response = await request.post('/api/boost', {
    headers: {
      Authorization: `Bearer ${maliciousUserToken}`
    },
    data: {
      animalId: victimAnimalId
    }
  });
  
  expect(response.status()).toBe(403); // Forbidden
  expect(await response.json()).toMatchObject({
    success: false,
    message: expect.stringContaining('permissão')
  });
});
```

---

## 📊 DASHBOARD DE MONITORAMENTO (Proposta)

### Métricas em Tempo Real

```typescript
// Dashboard Admin - Seção "Boosts"

interface BoostMetrics {
  // Uso atual
  activeBoosts: number;           // 127 ativos agora
  totalBoostedAnimals: number;    // 98 animais
  totalBoostedEvents: number;     // 29 eventos
  
  // Receita
  monthlyRevenue: number;         // R$ 12.450,00
  boostsSoldThisMonth: number;    // 264 boosts vendidos
  avgBoostPrice: number;          // R$ 47,15
  
  // Saúde do sistema
  expiredButActive: number;       // ⚠️ 0 (ideal)
  duplicateBoosts: number;        // ⚠️ 0 (ideal)
  negativeBalances: number;       // ⚠️ 0 (ideal)
  
  // Engajamento
  avgBoostDuration: number;       // 1.3 (média de boosts/item)
  topBoostUsers: User[];          // Top 10
  conversionRate: number;         // 23% (views → clicks)
}
```

### Alertas Críticos

```typescript
// Sistema de alertas
const alerts = [
  {
    level: 'CRITICAL',
    message: '⚠️ 12 boosts expirados ainda ativos',
    action: 'Executar expire_boosts() manualmente',
    timestamp: '2025-11-08 14:32:00'
  },
  {
    level: 'WARNING',
    message: '⚠️ 3 usuários com saldo negativo',
    action: 'Auditar boost_history',
    timestamp: '2025-11-08 14:15:00'
  },
  {
    level: 'INFO',
    message: '✅ Cron job expire_boosts executado com sucesso',
    action: 'Nenhuma',
    timestamp: '2025-11-08 14:00:00'
  }
];
```

---

## 🎓 LIÇÕES APRENDIDAS

### O Que Está Funcionando Bem

1. **Arquitetura de Serviços**
   - Separação clara de responsabilidades
   - `boostService.ts` como service layer robusto
   - Histórico completo de auditoria

2. **Front-End**
   - UX intuitiva e responsiva
   - Feedback visual claro (badges, countdown)
   - Filtros corretos nas queries

3. **Segurança RLS**
   - Policies bem estruturadas
   - Isolamento correto de dados por usuário
   - Admin oversight implementado

### O Que Precisa Melhorar

1. **Automação**
   - Falta de cron jobs
   - Processos críticos dependem de execução manual
   - Renovação mensal não automatizada

2. **Atomicidade**
   - Operações em múltiplas etapas
   - Vulnerável a race conditions
   - Falta de transações SQL

3. **Consistência**
   - Múltiplas implementações da mesma lógica
   - Priorização de créditos inconsistente
   - Dificuldade de manutenção

### Recomendações para Próximos Sistemas

1. ✅ **SEMPRE use transações SQL para operações financeiras**
2. ✅ **Configure automação desde o início (cron, edge functions)**
3. ✅ **Teste race conditions em ambiente de QA**
4. ✅ **Centralize lógica de negócio em um único serviço**
5. ✅ **Implemente monitoramento desde o dia 1**

---

## 📞 CONTATO E PRÓXIMOS PASSOS

### Para Implementação

1. **Aprovação das Recomendações**
   - Revisar este relatório com o time técnico
   - Priorizar as correções críticas (Fase 1)
   - Alocar recursos (1-2 desenvolvedores)

2. **Setup de Ambiente de Teste**
   - Criar banco de dados de staging
   - Simular cenários de race condition
   - Testar pg_cron em ambiente controlado

3. **Deploy Gradual**
   - Implementar correções em staging
   - Testar por 3-5 dias
   - Rollout para produção com monitoramento intensivo

4. **Pós-Deploy**
   - Monitorar métricas por 2 semanas
   - Auditar boosts expirados
   - Validar integridade de saldos

---

## 📄 ANEXOS

### A. Script de Verificação de Integridade

```sql
-- verificar_integridade_boost.sql

-- 1. Boosts expirados ainda ativos
SELECT 
  'Boosts Expirados Ativos' AS check_name,
  COUNT(*) AS count,
  CASE WHEN COUNT(*) = 0 THEN '✅ OK' ELSE '❌ FALHA' END AS status
FROM animals
WHERE is_boosted = TRUE AND boost_expires_at < NOW()
UNION ALL
SELECT 
  'Boosts Expirados Ativos (Eventos)',
  COUNT(*),
  CASE WHEN COUNT(*) = 0 THEN '✅ OK' ELSE '❌ FALHA' END
FROM events
WHERE is_boosted = TRUE AND boost_expires_at < NOW()

UNION ALL

-- 2. Usuários com saldo negativo
SELECT 
  'Saldos Negativos',
  COUNT(*),
  CASE WHEN COUNT(*) = 0 THEN '✅ OK' ELSE '❌ FALHA' END
FROM profiles
WHERE plan_boost_credits < 0 OR purchased_boost_credits < 0

UNION ALL

-- 3. Boosts órfãos (sem registro em histórico)
SELECT 
  'Boosts Órfãos (Animais)',
  COUNT(*),
  CASE WHEN COUNT(*) = 0 THEN '✅ OK' ELSE '⚠️ ATENÇÃO' END
FROM animals a
WHERE a.is_boosted = TRUE
  AND NOT EXISTS (
    SELECT 1 FROM boost_history bh
    WHERE bh.content_id = a.id 
      AND bh.content_type = 'animal'
      AND bh.is_active = TRUE
  );
```

### B. Função de Limpeza Manual

```sql
-- limpar_boosts_expirados.sql

CREATE OR REPLACE FUNCTION cleanup_expired_boosts()
RETURNS TABLE (
  type TEXT,
  items_cleaned INTEGER
) AS $$
DECLARE
  v_animals_cleaned INTEGER;
  v_events_cleaned INTEGER;
  v_history_cleaned INTEGER;
BEGIN
  -- Limpar animais
  UPDATE animals
  SET is_boosted = FALSE, boost_expires_at = NULL
  WHERE is_boosted = TRUE AND boost_expires_at < NOW();
  GET DIAGNOSTICS v_animals_cleaned = ROW_COUNT;
  
  -- Limpar eventos
  UPDATE events
  SET is_boosted = FALSE, boost_expires_at = NULL
  WHERE is_boosted = TRUE AND boost_expires_at < NOW();
  GET DIAGNOSTICS v_events_cleaned = ROW_COUNT;
  
  -- Limpar histórico
  UPDATE boost_history
  SET is_active = FALSE
  WHERE is_active = TRUE AND expires_at < NOW();
  GET DIAGNOSTICS v_history_cleaned = ROW_COUNT;
  
  RETURN QUERY
  SELECT 'animals', v_animals_cleaned
  UNION ALL
  SELECT 'events', v_events_cleaned
  UNION ALL
  SELECT 'history', v_history_cleaned;
END;
$$ LANGUAGE plpgsql;
```

### C. Checklist de Deploy

```markdown
# ✅ CHECKLIST DE DEPLOY - CORREÇÕES DE BOOST

## Pré-Deploy
- [ ] Backup completo do banco de dados
- [ ] Testes de race condition passando
- [ ] Code review aprovado por tech lead
- [ ] Documentação atualizada
- [ ] Ambiente de staging testado por 3+ dias

## Deploy
- [ ] Aplicar migration da função atômica
- [ ] Configurar pg_cron ou Edge Function
- [ ] Atualizar front-end com novo endpoint
- [ ] Atualizar variáveis de ambiente (se necessário)
- [ ] Deploy gradual (10% → 50% → 100%)

## Pós-Deploy
- [ ] Executar script de verificação de integridade
- [ ] Limpar boosts expirados com cleanup_expired_boosts()
- [ ] Monitorar logs por 2h contínuas
- [ ] Verificar métricas de erro (< 0.1%)
- [ ] Testar manualmente boost em staging

## Validação (Após 24h)
- [ ] Verificar se expiração automática está funcionando
- [ ] Auditar saldos de usuários (nenhum negativo)
- [ ] Conferir receita vs boosts vendidos
- [ ] Validar histórico de auditoria
- [ ] Coletar feedback de 5+ usuários

## Rollback (Se Necessário)
- [ ] Script de rollback testado
- [ ] Backup verificado
- [ ] Comunicação com usuários preparada
- [ ] Plano B documentado
```

---

## 🏆 CONCLUSÃO

O sistema de impulsionamento está **funcionalmente correto** mas apresenta **falhas críticas de automação e atomicidade** que podem resultar em:

- 💸 **Perda de receita** estimada em R$ 16-70k/ano
- 🐛 **Bugs de integridade** (saldos negativos, boosts eternos)
- ⚖️ **Injustiça competitiva** entre usuários
- 📉 **Experiência degradada** (anúncios velhos em destaque)

**As correções propostas são:**
- ✅ **Viáveis** (8 dias de desenvolvimento)
- ✅ **Testáveis** (cobertura completa de testes)
- ✅ **Escaláveis** (arquitetura robusta)
- ✅ **Seguras** (sem breaking changes)

**Recomendação final:** 🟡 **IMPLEMENTAR CORREÇÕES URGENTEMENTE**

---

## 📝 HISTÓRICO DE VERSÕES

| Versão | Data | Autor | Alterações |
|--------|------|-------|------------|
| 1.0 | 2025-11-08 | Engenheiro Sênior | Versão inicial completa |

---

**FIM DO RELATÓRIO**

*Este documento é confidencial e destinado exclusivamente à equipe técnica da Cavalaria Digital.*



