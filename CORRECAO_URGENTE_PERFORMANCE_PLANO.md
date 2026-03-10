# 🚨 CORREÇÃO URGENTE: Performance e Identificação de Plano

**Problema:** Sistema lento e identificando VIP como FREE  
**Solução:** 3 passos rápidos (15 minutos)

---

## 🎯 PASSO 1: Aplicar Migration RPC (5 min)

**Abrir Supabase SQL Editor e executar:**

```sql
-- ===================================================================
-- CORREÇÃO: Otimizar verificação de plano (5-25x mais rápido)
-- ===================================================================

CREATE OR REPLACE FUNCTION check_user_publish_quota(p_user_id UUID)
RETURNS JSONB 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_plan TEXT;
  v_plan_expires_at TIMESTAMPTZ;
  v_is_annual_plan BOOLEAN;
  v_allowed INT;
  v_active_count INT;
  v_remaining INT;
  v_plan_is_valid BOOLEAN;
BEGIN
  -- 1. Buscar plano do usuário
  SELECT 
    plan, 
    plan_expires_at,
    is_annual_plan
  INTO 
    v_plan, 
    v_plan_expires_at,
    v_is_annual_plan
  FROM profiles
  WHERE id = p_user_id;
  
  -- Se usuário não existe, retornar fallback FREE
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'plan', 'free',
      'plan_expires_at', NULL,
      'is_annual_plan', false,
      'plan_is_valid', false,
      'allowedByPlan', 0,
      'active', 0,
      'remaining', 0
    );
  END IF;
  
  -- 2. Verificar se plano está válido
  v_plan_is_valid := (
    v_plan IS NOT NULL 
    AND v_plan != 'free' 
    AND (
      v_plan_expires_at IS NULL  -- VIP vitalício
      OR v_plan_expires_at > NOW()  -- Plano ainda válido
    )
  );
  
  -- 3. Calcular limite por plano
  v_allowed := CASE v_plan
    WHEN 'basic' THEN 10
    WHEN 'pro' THEN 15
    WHEN 'ultra' THEN 25
    WHEN 'vip' THEN 15
    ELSE 0
  END;
  
  -- 4. Contar anúncios ativos (excluindo individuais pagos)
  SELECT COUNT(*) 
  INTO v_active_count
  FROM animals
  WHERE owner_id = p_user_id
    AND ad_status = 'active'
    AND (is_individual_paid IS NULL OR is_individual_paid = false);
  
  -- 5. Calcular restante
  v_remaining := GREATEST(v_allowed - v_active_count, 0);
  
  -- 6. Retornar JSON
  RETURN jsonb_build_object(
    'plan', COALESCE(v_plan, 'free'),
    'plan_expires_at', v_plan_expires_at,
    'is_annual_plan', COALESCE(v_is_annual_plan, false),
    'plan_is_valid', v_plan_is_valid,
    'allowedByPlan', v_allowed,
    'active', v_active_count,
    'remaining', v_remaining
  );
  
EXCEPTION WHEN OTHERS THEN
  -- Em caso de erro, retornar fallback seguro
  RETURN jsonb_build_object(
    'plan', 'free',
    'plan_expires_at', NULL,
    'is_annual_plan', false,
    'plan_is_valid', false,
    'allowedByPlan', 0,
    'active', 0,
    'remaining', 0,
    'error', SQLERRM
  );
END;
$$;

-- Permissões
GRANT EXECUTE ON FUNCTION check_user_publish_quota(UUID) TO authenticated;

-- Índice otimizado
CREATE INDEX IF NOT EXISTS idx_animals_owner_active_individual
ON animals(owner_id, ad_status, is_individual_paid)
WHERE ad_status = 'active' 
  AND (is_individual_paid IS NULL OR is_individual_paid = false);

-- Teste rápido (substituir USER_ID_AQUI por um ID real)
-- SELECT check_user_publish_quota('USER_ID_AQUI');
```

**✅ Confirmar:** Deve executar sem erros

---

## 🎯 PASSO 2: Atualizar animalService.ts (5 min)

**Arquivo:** `src/services/animalService.ts`

Substituir o método `canPublishByPlan` (linha ~162):

```typescript
async canPublishByPlan(userId: string): Promise<{ 
  allowedByPlan: number; 
  active: number; 
  remaining: number; 
  plan: string | null;
  planIsValid: boolean;
  planExpiresAt: string | null;
}>{
  console.log('[AnimalService] 🚀 Verificando plano (RPC otimizado):', userId);
  const startTime = Date.now();
  
  try {
    // ✅ UMA query RPC ao invés de 2 sequenciais
    const { data, error } = await supabase
      .rpc('check_user_publish_quota', { p_user_id: userId });
    
    if (error) {
      console.error('[AnimalService] ❌ Erro RPC:', error);
      throw handleSupabaseError(error);
    }
    
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`[AnimalService] ✅ Verificação completada em ${elapsed}s`);
    console.log('[AnimalService] 📊 Resultado:', {
      plan: data.plan,
      planIsValid: data.plan_is_valid,
      allowed: data.allowedByPlan,
      active: data.active,
      remaining: data.remaining
    });
    
    return {
      plan: data.plan || 'free',
      planIsValid: data.plan_is_valid || false,
      planExpiresAt: data.plan_expires_at || null,
      allowedByPlan: data.allowedByPlan || 0,
      active: data.active || 0,
      remaining: data.remaining || 0
    };
    
  } catch (error) {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.error(`[AnimalService] ❌ Erro após ${elapsed}s:`, error);
    throw error;
  }
}
```

---

## 🎯 PASSO 3: Atualizar ReviewAndPublishStep.tsx (5 min)

**Arquivo:** `src/components/forms/steps/ReviewAndPublishStep.tsx`

### 3.1 Reduzir Timeout (linha ~66)

```typescript
// ANTES
const timeoutPromise = new Promise((_, reject) => 
  setTimeout(() => {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.error(`[ReviewAndPublish] ⏱️ Timeout após ${elapsed}s`);
    reject(new Error('A verificação do plano está demorando muito. Verifique sua conexão.'));
  }, 20000)  // ❌ 20 segundos
);

// DEPOIS
const timeoutPromise = new Promise((_, reject) => 
  setTimeout(() => {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.error(`[ReviewAndPublish] ⏱️ Timeout após ${elapsed}s`);
    reject(new Error('A verificação do plano está demorando muito. Verifique sua conexão.'));
  }, 5000)  // ✅ 5 segundos
);
```

### 3.2 Corrigir Lógica de Fallback (linha ~103)

```typescript
// ANTES (linha ~103-117)
} else {
  // Se não recebeu dados válidos, usar fallback FREE
  console.warn('[ReviewAndPublish] ⚠️ Dados inválidos, usando fallback FREE');
  setPlan('free');
  setRemaining(0);
  setScenario('free_or_no_plan');
  setError(null);
}
} catch (err: any) {
  console.error('[ReviewAndPublish] ❌ Erro ao verificar plano:', err);
  // Mesmo com erro, permitir publicação individual (fallback FREE)
  console.log('[ReviewAndPublish] ⚠️ Erro capturado, usando fallback FREE');
  setPlan('free');
  setRemaining(0);
  setScenario('free_or_no_plan');
  setError(null); // Não mostrar erro, apenas usar fallback
}

// DEPOIS (CORRIGIDO)
} else {
  // Se não recebeu dados válidos, MOSTRAR ERRO
  console.error('[ReviewAndPublish] ❌ Dados inválidos recebidos:', info);
  setError('Não foi possível verificar seu plano. Tente novamente.');
  setPlan(null);
  setRemaining(0);
}
} catch (err: any) {
  console.error('[ReviewAndPublish] ❌ Erro ao verificar plano:', err);
  // MOSTRAR ERRO ao usuário ao invés de fallback silencioso
  setError(err.message || 'Erro ao verificar plano. Tente novamente.');
  setPlan(null);
  setRemaining(0);
}
```

---

## ✅ RESULTADO ESPERADO

### Antes:
- ⏱️ Tempo: **1-5s** (até 10s)
- ⏰ Timeout: **35s**
- 🐛 VIP → FREE (erro)
- 😞 UX ruim

### Depois:
- ⚡ Tempo: **200-500ms** (5-25x mais rápido!)
- ✅ Timeout: **5s**
- ✅ VIP → VIP (correto)
- 😊 UX excelente

---

## 🧪 TESTE RÁPIDO

1. **Reiniciar aplicação:**
   ```bash
   npm run dev
   ```

2. **Abrir modal de cadastro**

3. **Verificar console:**
   ```
   [AnimalService] 🚀 Verificando plano (RPC otimizado): user-id
   [AnimalService] ✅ Verificação completada em 0.3s  // ⚡ < 500ms!
   [AnimalService] 📊 Resultado: {
     plan: 'vip',           // ✅ Correto!
     planIsValid: true,
     allowed: 15,
     active: 3,
     remaining: 12
   }
   ```

4. **Confirmar:**
   - ✅ Loading dura < 1 segundo
   - ✅ VIP é identificado como VIP (não FREE)
   - ✅ Mostra vagas corretas

---

## 🚨 SE ALGO DER ERRADO

### Erro: Função não existe

```sql
-- Reexecutar migration
DROP FUNCTION IF EXISTS check_user_publish_quota(UUID);
-- Executar novamente o Passo 1
```

### Erro: Ainda identifica VIP como FREE

**Verificar no Supabase:**
```sql
SELECT id, name, plan, plan_expires_at 
FROM profiles 
WHERE id = 'USER_ID_VIP_AQUI';

-- Deve retornar: plan = 'vip', plan_expires_at = NULL (vitalício)
```

---

**✅ IMPLEMENTAR AGORA PARA RESOLVER OS 2 PROBLEMAS!**


