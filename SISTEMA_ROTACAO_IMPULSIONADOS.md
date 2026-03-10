# 🔄 SISTEMA DE ROTAÇÃO EQUITATIVA DE ANÚNCIOS IMPULSIONADOS

## 📋 VISÃO GERAL

Sistema implementado para garantir que **TODOS** os anúncios impulsionados sejam exibidos com a **mesma frequência** na página Home, independente de quantos existam.

---

## 🎯 OBJETIVO

Se existem **20 anúncios impulsionados**, mas a Home exibe apenas **10 por vez**:

- ❌ **ANTES:** Shuffle aleatório poderia deixar alguns anúncios sem aparecer
- ✅ **AGORA:** Sistema de rotação garante que todos apareçam igualmente

---

## 🔧 COMO FUNCIONA

### **Sistema de Rotação por Minuto**

```
┌────────────────────────────────────────────────────────────┐
│  EXEMPLO: 20 ANÚNCIOS IMPULSIONADOS (A1...A20)            │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Minuto 0:  A1  A2  A3  A4  A5  A6  A7  A8  A9  A10       │
│  Minuto 1:  A2  A3  A4  A5  A6  A7  A8  A9  A10 A11       │
│  Minuto 2:  A3  A4  A5  A6  A7  A8  A9  A10 A11 A12       │
│  Minuto 3:  A4  A5  A6  A7  A8  A9  A10 A11 A12 A13       │
│  ...                                                       │
│  Minuto 10: A11 A12 A13 A14 A15 A16 A17 A18 A19 A20       │
│  Minuto 11: A12 A13 A14 A15 A16 A17 A18 A19 A20 A1        │
│  ...                                                       │
│  Minuto 20: A1  A2  A3  A4  A5  A6  A7  A8  A9  A10       │
│             (volta ao início)                              │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### **Matemática da Rotação**

```javascript
// Cálculo do offset de rotação
minuteCounter = Math.floor(currentTime / 60)
rotationOffset = minuteCounter % totalBoosted

// Cada anúncio recebe uma posição
newPosition = ((originalPosition + rotationOffset) % totalBoosted) + 1

// Selecionar apenas os 10 primeiros da nova ordem
```

---

## 📊 GARANTIAS DO SISTEMA

### ✅ **1. Distribuição 100% Equitativa**

- Cada anúncio aparece **exatamente o mesmo número de vezes**
- Se há 20 anúncios, cada um será o **primeiro** durante 1 minuto
- Todos passam por todas as posições (1ª, 2ª, 3ª... 10ª)

### ✅ **2. Rotação Contínua**

- **A cada 1 minuto**, a ordem muda
- Usuário que visitar em momentos diferentes verá anúncios diferentes
- Em 20 minutos, todos os 20 anúncios terão aparecido

### ✅ **3. Performance Otimizada**

- Cálculo feito **no servidor** (PostgreSQL)
- Frontend apenas exibe a ordem retornada
- Não há processamento pesado no cliente

---

## 🗄️ IMPLEMENTAÇÃO NO BANCO DE DADOS

### **Função SQL: `get_featured_animals_rotated_fast`**

```sql
-- Buscar com rotação rápida (1 minuto)
SELECT * FROM get_featured_animals_rotated_fast(10);
```

**Parâmetros:**
- `p_limit`: Número de anúncios a retornar (padrão: 10)

**Retorno:**
- Lista ordenada de anúncios com `rotation_position`
- Ordem muda automaticamente a cada minuto

### **Função Alternativa: `get_featured_animals_rotated`**

```sql
-- Buscar com rotação lenta (30 minutos)
SELECT * FROM get_featured_animals_rotated(10);
```

**Diferença:**
- Rotaciona a cada **30 minutos** ao invés de 1 minuto
- Mais estável, muda menos frequentemente
- Útil se quiser menos mudanças na página

---

## 💻 CÓDIGO NO FRONTEND

### **animalService.ts**

```typescript
async getFeaturedAnimals(limit: number = 10): Promise<AnimalWithStats[]> {
  // Chama função SQL com rotação automática
  const { data } = await supabase
    .rpc('get_featured_animals_rotated_fast', { p_limit: limit })
  
  return data as AnimalWithStats[]
}
```

### **FeaturedCarousel.tsx**

```typescript
const fetchFeaturedAnimals = useCallback(async () => {
  // ✅ Busca 10 anúncios com rotação automática
  const boosted = await animalService.getFeaturedAnimals(10);
  
  // ✅ NÃO faz shuffle - ordem já vem correta do banco
  setFeaturedAnimals(boosted.map(mapAnimalRecordToCard));
}, []);
```

**Mudanças:**
- ❌ Removido `shuffleArray()` (não é mais necessário)
- ✅ Limite fixo de **10 anúncios**
- ✅ Ordem mantida como vem do banco

---

## 🧪 COMO TESTAR

### **1. Criar Múltiplos Anúncios Impulsionados**

```sql
-- Ver quantos anúncios impulsionados existem
SELECT COUNT(*) AS total_impulsionados
FROM animals
WHERE is_boosted = TRUE
  AND boost_expires_at > NOW()
  AND ad_status = 'active';
```

### **2. Testar Rotação Manual**

```sql
-- Ver ordem atual
SELECT 
    name,
    rotation_position,
    'Agora' AS momento
FROM get_featured_animals_rotated_fast(10)
ORDER BY rotation_position;

-- Aguardar 1 minuto e executar novamente
-- A ordem deve ter mudado!
```

### **3. Simular Passagem de Tempo**

```sql
-- Ver qual será a ordem em diferentes minutos
DO $$
DECLARE
    v_minute INTEGER;
    v_total INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_total
    FROM animals
    WHERE is_boosted = TRUE AND boost_expires_at > NOW();
    
    RAISE NOTICE 'Total de anúncios: %', v_total;
    RAISE NOTICE 'Minuto atual: %', FLOOR(EXTRACT(EPOCH FROM NOW()) / 60);
    RAISE NOTICE 'Offset atual: %', (FLOOR(EXTRACT(EPOCH FROM NOW()) / 60) % v_total);
END $$;
```

### **4. Verificar na Página Home**

1. Abrir a página Home
2. Anotar os 10 primeiros anúncios impulsionados
3. Aguardar **1 minuto**
4. Recarregar a página (F5)
5. Verificar que a ordem mudou

---

## 📈 CENÁRIOS DE EXEMPLO

### **Cenário 1: 20 Anúncios Impulsionados**

- **Limite:** 10 por página
- **Resultado:** 
  - Minuto 0-19: Cada anúncio é o primeiro uma vez
  - A cada minuto, todos "avançam 1 posição"
  - Em 20 minutos, todos apareceram no topo

### **Cenário 2: 5 Anúncios Impulsionados**

- **Limite:** 10 por página
- **Resultado:**
  - Todos os 5 aparecem sempre
  - Ordem rotaciona a cada minuto
  - Em 5 minutos, todos foram o primeiro

### **Cenário 3: 100 Anúncios Impulsionados**

- **Limite:** 10 por página
- **Resultado:**
  - A cada minuto, mostra 10 diferentes
  - Em 100 minutos (1h40), todos apareceram
  - Distribuição 100% equitativa

---

## 🔄 FALLBACK SYSTEM

Se a função SQL ainda não foi aplicada:

```typescript
// FALLBACK automático no código
try {
  // Tenta usar função de rotação
  const data = await supabase.rpc('get_featured_animals_rotated_fast', ...)
} catch {
  // Se falhar, usa método antigo (com limite)
  const data = await supabase
    .from('animals_with_stats')
    .select('*')
    .eq('is_boosted', true)
    .limit(10)
}
```

---

## 🚀 APLICAÇÃO

### **1. Executar Migration SQL**

```bash
# Via Supabase Dashboard
1. Ir em SQL Editor
2. Colar conteúdo de: supabase_migrations/062_featured_animals_rotation.sql
3. Executar

# Via CLI
supabase db execute -f supabase_migrations/062_featured_animals_rotation.sql
```

### **2. Deploy do Frontend**

O código já está atualizado em:
- ✅ `src/services/animalService.ts`
- ✅ `src/components/FeaturedCarousel.tsx`

Apenas fazer **build e deploy** normal.

### **3. Validar**

```sql
-- Confirmar que função existe
SELECT 
    proname AS function_name,
    pg_get_functiondef(oid) AS definition
FROM pg_proc
WHERE proname LIKE '%featured_animals_rotated%';

-- Testar execução
SELECT COUNT(*) FROM get_featured_animals_rotated_fast(10);
```

---

## ⚙️ CONFIGURAÇÕES

### **Alterar Velocidade de Rotação**

**Para rotacionar mais rápido (a cada 30 segundos):**

```sql
-- Na função, mudar:
v_time_slot := FLOOR(EXTRACT(EPOCH FROM NOW()) / 30)::INTEGER;
```

**Para rotacionar mais devagar (a cada 5 minutos):**

```sql
-- Na função, mudar:
v_time_slot := FLOOR(EXTRACT(EPOCH FROM NOW()) / 300)::INTEGER;
```

### **Alterar Limite de Anúncios**

**No componente:**

```typescript
// Mudar de 10 para 15
const boosted = await animalService.getFeaturedAnimals(15);
```

---

## 📊 VANTAGENS DO SISTEMA

| Aspecto | Antes | Depois |
|---------|-------|--------|
| **Distribuição** | ❌ Aleatória, desigual | ✅ 100% equitativa |
| **Previsibilidade** | ❌ Impossível prever | ✅ Rotação ordenada |
| **Performance** | ⚠️ Shuffle no cliente | ✅ Cálculo no servidor |
| **Escalabilidade** | ❌ Sem limite | ✅ Sempre 10 por vez |
| **Justiça** | ❌ Alguns viam mais | ✅ Todos veem igual |

---

## 🐛 TROUBLESHOOTING

### **Problema: Ordem não está mudando**

**Causa:** Função SQL não foi aplicada  
**Solução:** Executar migration 062

### **Problema: Aparecendo mais de 10 anúncios**

**Causa:** Limite não está sendo respeitado  
**Solução:** Verificar parâmetro `p_limit` na chamada da função

### **Problema: Sempre a mesma ordem**

**Causa:** Rotação muito lenta (30 min)  
**Solução:** Usar `get_featured_animals_rotated_fast` ao invés de `get_featured_animals_rotated`

---

## 📝 RESUMO

```
┌─────────────────────────────────────────────────────────┐
│  SISTEMA DE ROTAÇÃO IMPLEMENTADO                        │
├─────────────────────────────────────────────────────────┤
│  ✅ Limite de 10 anúncios por página                    │
│  ✅ Rotação a cada 1 minuto                             │
│  ✅ Distribuição 100% equitativa                        │
│  ✅ Performance otimizada (cálculo no servidor)         │
│  ✅ Fallback automático se função não existir           │
│  ✅ Código frontend atualizado                          │
│  ✅ Migration SQL pronta para aplicar                   │
└─────────────────────────────────────────────────────────┘
```

---

**Implementado em:** 17/11/2025  
**Versão:** 1.0  
**Status:** ✅ PRONTO PARA PRODUÇÃO

