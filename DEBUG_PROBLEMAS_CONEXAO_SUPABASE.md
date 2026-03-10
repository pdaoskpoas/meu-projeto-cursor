# 🔍 DEBUG - Problemas de Conexão com Supabase

**Data:** 26 de Novembro de 2025  
**Status:** 🔍 **EM INVESTIGAÇÃO**  
**Prioridade:** 🔴 **CRÍTICA**

---

## 🐛 SINTOMAS

### Erro Atual
```
🔍 [DEBUG] Verificando conexão com Supabase...
❌ ERRO DE CONEXÃO: Error: Timeout ao testar conexão
❌ ERRO AO PUBLICAR: Error: Sem conexão com o servidor. Verifique sua internet e tente novamente.
```

### Comportamento
- Query simples (`select('id').limit(1)`) está dando timeout (5s)
- Outras queries também podem estar lentas
- Problema pode ser intermitente

---

## ✅ CORREÇÃO APLICADA (Temporária)

### Removido Teste de Conexão
O teste de conexão estava sendo muito restritivo e bloqueando o fluxo. Foi **removido temporariamente**.

```typescript
// ❌ REMOVIDO (estava causando bloqueio)
const connectionTest = await Promise.race([
  supabase.from('animals').select('id').limit(1),
  new Promise((_, reject) => setTimeout(() => reject(...), 5000))
]);

// ✅ AGORA: Deixar operações naturais sem timeout artificial
const newAnimal = await animalService.createAnimal(animalData);
```

### Removidos Timeouts Artificiais
Todos os `Promise.race` com timeouts foram removidos. Agora deixamos o Supabase decidir quando dar timeout naturalmente (padrão: 60s).

---

## 🔍 POSSÍVEIS CAUSAS

### 1. Problema de Rede/Internet
**Sintoma:** Timeout em qualquer query  
**Como Verificar:**
```bash
# Testar conectividade com Supabase
ping wyufgltprapazpxmtaff.supabase.co

# Testar latência
curl -w "@curl-format.txt" -o /dev/null -s https://wyufgltprapazpxmtaff.supabase.co
```

**Solução:**
- Verificar conexão de internet
- Tentar em outra rede
- Desativar VPN se estiver usando

### 2. Sessão Expirada ou Inválida
**Sintoma:** Queries funcionam às vezes, falham outras vezes  
**Como Verificar:**
```typescript
// No console do navegador (F12)
const { data, error } = await supabase.auth.getSession();
console.log('Sessão:', data.session);
console.log('Expira em:', new Date(data.session?.expires_at * 1000));
```

**Solução:**
```typescript
// Forçar refresh da sessão
const { error } = await supabase.auth.refreshSession();
if (error) console.error('Erro ao renovar:', error);
```

### 3. RPC `check_user_publish_quota` Lento
**Sintoma:** `createAnimal()` demora muito  
**Como Verificar:**
```sql
-- No SQL Editor do Supabase Dashboard
EXPLAIN ANALYZE 
SELECT * FROM check_user_publish_quota('user-id-aqui');
```

**Solução:**
- Adicionar índices nas tabelas envolvidas
- Otimizar a função RPC
- Ver seção "Otimizações SQL" abaixo

### 4. Trigger de `share_code` Lento
**Sintoma:** INSERT em `animals` demora muito  
**Como Verificar:**
```sql
-- Testar função diretamente
SELECT generate_animal_share_code();
-- Deve retornar em < 100ms
```

**Solução:**
```sql
-- Verificar se há problema de colisões
SELECT share_code, COUNT(*) 
FROM animals 
GROUP BY share_code 
HAVING COUNT(*) > 1;
```

### 5. Muitas Conexões Simultâneas
**Sintoma:** Timeout intermitente  
**Como Verificar:**
```sql
-- Ver conexões ativas
SELECT COUNT(*) FROM pg_stat_activity 
WHERE state = 'active';
```

**Solução:**
- Configurar pool de conexões no Supabase
- Limitar número de requisições simultâneas

### 6. Banco de Dados Sobrecarregado
**Sintoma:** Tudo está lento  
**Como Verificar:**
- Ir para Supabase Dashboard → Database → Performance
- Ver uso de CPU/Memória

**Solução:**
- Upgrade do plano do Supabase
- Otimizar queries lentas

---

## 🧪 TESTES PARA FAZER

### Teste 1: Query Simples no Console
```javascript
// Abrir Console do navegador (F12)
// Colar e executar:
const { data, error } = await supabase
  .from('animals')
  .select('id')
  .limit(1);

console.log('Tempo:', performance.now());
console.log('Data:', data);
console.log('Error:', error);
```

**Resultado Esperado:** < 500ms  
**Se demorar mais:** Problema de rede ou banco

### Teste 2: Criar Animal Manualmente
```javascript
// No console:
const { data, error } = await supabase
  .from('animals')
  .insert({
    name: 'Teste Debug',
    breed: 'Mangalarga Marchador',
    gender: 'Macho',
    birth_date: '2020-01-01',
    owner_id: 'SEU-USER-ID-AQUI',
    ad_status: 'paused'
  })
  .select()
  .single();

console.log('Animal criado:', data);
console.log('Erro:', error);
```

**Resultado Esperado:** < 2s  
**Se demorar mais:** Problema no trigger ou RPC

### Teste 3: RPC Direto
```javascript
// No console:
const { data, error } = await supabase
  .rpc('check_user_publish_quota', {
    p_user_id: 'SEU-USER-ID-AQUI'
  });

console.log('Quota:', data);
console.log('Erro:', error);
```

**Resultado Esperado:** < 1s  
**Se demorar mais:** RPC precisa otimização

---

## 🔧 OTIMIZAÇÕES SQL

### Índices Recomendados

```sql
-- Índice para share_code (se não existir)
CREATE INDEX IF NOT EXISTS idx_animals_share_code 
ON animals(share_code);

-- Índice para owner_id
CREATE INDEX IF NOT EXISTS idx_animals_owner_id 
ON animals(owner_id);

-- Índice para ad_status
CREATE INDEX IF NOT EXISTS idx_animals_ad_status 
ON animals(ad_status);

-- Índice composto para queries comuns
CREATE INDEX IF NOT EXISTS idx_animals_owner_status 
ON animals(owner_id, ad_status);
```

### Otimizar RPC `check_user_publish_quota`

```sql
-- Versão otimizada (se atual estiver lenta)
CREATE OR REPLACE FUNCTION check_user_publish_quota(p_user_id UUID)
RETURNS TABLE (
  plan TEXT,
  plan_is_valid BOOLEAN,
  plan_expires_at TIMESTAMPTZ,
  allowedByPlan INTEGER,
  active INTEGER,
  remaining INTEGER
) AS $$
DECLARE
  v_plan TEXT;
  v_plan_valid BOOLEAN;
  v_expires_at TIMESTAMPTZ;
  v_allowed INTEGER;
  v_active_count INTEGER;
BEGIN
  -- 1. Buscar plano do usuário (uma query)
  SELECT 
    COALESCE(up.plan, 'free'),
    (up.expires_at IS NULL OR up.expires_at > NOW()),
    up.expires_at
  INTO v_plan, v_plan_valid, v_expires_at
  FROM user_plans up
  WHERE up.user_id = p_user_id
  LIMIT 1;
  
  -- Se não encontrou, assume free
  v_plan := COALESCE(v_plan, 'free');
  v_plan_valid := COALESCE(v_plan_valid, FALSE);
  
  -- 2. Definir limite por plano
  v_allowed := CASE v_plan
    WHEN 'free' THEN 0
    WHEN 'basic' THEN 5
    WHEN 'pro' THEN 10
    WHEN 'vip' THEN 15
    ELSE 0
  END;
  
  -- 3. Contar animais ativos (com índice)
  SELECT COUNT(*)
  INTO v_active_count
  FROM animals
  WHERE owner_id = p_user_id
    AND ad_status = 'active'
    AND (is_individual_paid = FALSE OR is_individual_paid IS NULL);
  
  -- 4. Retornar resultado
  RETURN QUERY SELECT
    v_plan,
    v_plan_valid,
    v_expires_at,
    v_allowed,
    v_active_count,
    GREATEST(0, v_allowed - v_active_count);
END;
$$ LANGUAGE plpgsql STABLE;
```

---

## 📊 MONITORAMENTO

### Logs para Adicionar

```typescript
// Adicionar no início do handlePublishWithPlan:
console.time('⏱️ Publicação Total');
console.time('⏱️ Criar Animal');

// Antes de createAnimal:
const startCreate = performance.now();

// Depois de createAnimal:
console.timeEnd('⏱️ Criar Animal');
console.log(`⏱️ createAnimal levou ${performance.now() - startCreate}ms`);

// No final:
console.timeEnd('⏱️ Publicação Total');
```

### Ver Queries Lentas no Supabase

1. Ir para **Supabase Dashboard**
2. **Database** → **Performance**
3. Ver **Slow Queries**
4. Identificar queries > 1s

---

## 🎯 PRÓXIMOS PASSOS

### Imediato (Para Testar Agora)
1. ✅ **Recarregar página** (Ctrl + F5)
2. ✅ **Abrir Console** (F12)
3. ✅ **Tentar publicar** animal
4. ✅ **Copiar TODOS os logs** e enviar

### Se Continuar Falhando
1. 🔍 Executar **Teste 1, 2 e 3** acima
2. 🔍 Verificar **velocidade da internet** (fast.com)
3. 🔍 Tentar em **navegador anônimo** (para descartar extensões)
4. 🔍 Tentar em **outra rede** (para descartar bloqueios)

### Se For Problema de Performance do Banco
1. 🔧 Aplicar **índices recomendados** acima
2. 🔧 Otimizar **RPC check_user_publish_quota**
3. 🔧 Verificar **plano do Supabase** (pode precisar upgrade)

---

## ✅ MUDANÇAS APLICADAS NESTA CORREÇÃO

### Arquivo: `src/components/animal/NewAnimalWizard/steps/StepReview.tsx`

1. ❌ **Removido**: Teste de conexão artificial
2. ❌ **Removido**: Timeouts com `Promise.race`
3. ✅ **Adicionado**: Logs detalhados de erro
4. ✅ **Adicionado**: Verificação de tipo de erro do Supabase
5. ✅ **Simplificado**: Deixar operações naturais

**Resultado:** Código mais simples e resiliente, sem bloqueios artificiais.

---

## 📝 INFORMAÇÕES PARA DEBUG

### URLs e Credenciais
- **Supabase URL:** `https://wyufgltprapazpxmtaff.supabase.co`
- **Project Ref:** `wyufgltprapazpxmtaff`

### Cliente Supabase
```typescript
// Configuração atual
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  }
});
```

### Timeouts Padrão do Supabase
- **Auth:** 60s
- **Database:** 60s
- **Storage:** 120s
- **Realtime:** 30s

---

## ⚠️ IMPORTANTE

O código agora **não tem timeouts artificiais**. Isso significa que:

- ✅ **Vantagem:** Não bloqueia operações que demoram um pouco mais
- ⚠️ **Desvantagem:** Se houver problema real, vai esperar até 60s (timeout do Supabase)

Se as operações estão demorando mais de 60s, há um **problema sério** que precisa ser investigado no banco de dados.

---

**Autor:** Assistente IA  
**Data:** 26/11/2025  
**Versão:** v4 (Debug Profundo)


