# 🔧 PRÓXIMOS PASSOS: Correção owner_property_name

**Status:** ✅ SQL Aplicado | ⏳ Front-end Pendente

---

## ✅ Passo 1: Verificar Aplicação no Supabase

Execute este SQL no **Supabase SQL Editor** para confirmar:

```sql
-- Arquivo: VERIFICAR_CORRECAO_OWNER_PROPERTY.sql

-- 1. Verificar se as views existem
SELECT 
    table_name,
    view_definition IS NOT NULL as exists
FROM information_schema.views
WHERE table_schema = 'public'
  AND table_name IN ('animals_with_stats', 'animals_with_partnerships')
ORDER BY table_name;

-- 2. Verificar novos campos
SELECT 
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'animals_with_stats'
  AND column_name IN ('owner_property_name', 'owner_property_type', 'owner_name', 'owner_account_type')
ORDER BY column_name;

-- 3. Testar com dados reais
SELECT 
    a.name as animal_name,
    a.owner_name,
    a.owner_property_name,
    a.owner_account_type,
    a.owner_property_type,
    CASE 
        WHEN a.owner_account_type = 'institutional' 
        THEN COALESCE(a.owner_property_name, a.owner_name)
        ELSE a.owner_name
    END as display_name
FROM animals_with_stats a
LIMIT 5;
```

**✅ Resultado Esperado:**
- 2 views existem (animals_with_stats, animals_with_partnerships)
- 4 colunas retornadas (owner_name, owner_property_name, owner_account_type, owner_property_type)
- Dados exibidos corretamente com `display_name`

---

## 📝 Passo 2: Atualizar Tipos TypeScript (5 min)

### 2.1 Atualizar `src/types/supabase.ts`

**Localizar linha 68-75:**

```typescript
export interface AnimalWithStats extends Animal {
  impression_count: number
  click_count: number
  click_rate: number
  owner_name: string
  owner_public_code: string
  owner_account_type: string
}
```

**Atualizar para:**

```typescript
export interface AnimalWithStats extends Animal {
  impression_count: number
  click_count: number
  click_rate: number
  owner_name: string
  owner_public_code: string
  owner_account_type: string
  owner_property_name: string | null  // ✅ NOVO
  owner_property_type: string | null  // ✅ NOVO
}
```

### 2.2 Adicionar Interface SearchAnimalsResult (se não existir)

**Arquivo:** `src/types/supabase.ts` (após AnimalWithStats)

```typescript
export interface SearchAnimalsResult {
  id: string
  name: string
  breed: string
  gender: string
  birth_date: string
  coat: string
  current_city: string
  current_state: string
  owner_name: string
  property_name: string | null  // ✅ owner_property_name mapeado
  owner_account_type: string
  owner_property_type: string | null  // ✅ NOVO
  is_boosted: boolean
  impression_count: number
  click_count: number
  click_rate: number
  published_at: string
  images: string[]
}
```

---

## ✅ Passo 3: Função Utilitária JÁ EXISTE! (Pular)

**✅ DESCOBERTA:** O arquivo `src/utils/ownerDisplayName.ts` **JÁ EXISTE** e contém a função necessária!

**✅ DESCOBERTA:** O arquivo `src/utils/animalCard.ts` **JÁ USA** a função `getOwnerDisplayName`!

**Nenhuma ação necessária neste passo.** 🎉

---

## 🎨 Passo 4: Atualizar Componentes (Não Necessário!)

**❗ IMPORTANTE:** Os componentes já estão usando `horse.harasName`, que vem do backend. 

**Verificar se o campo `haras_name` na tabela `animals` está sendo populado corretamente.**

### Opção A: Manter haras_name (Recomendado)

Se a coluna `haras_name` na tabela `animals` já existe e está sendo usada, **não precisa alterar os componentes**.

Apenas garantir que ao criar/atualizar animais, o campo seja preenchido:

```typescript
// src/services/animalService.ts
await supabase
  .from('animals')
  .insert({
    name: data.name,
    // ... outros campos
    haras_name: profile.account_type === 'institutional' 
      ? (profile.property_name || profile.name)
      : profile.name
  });
```

### Opção B: Usar owner_property_name das Views

Se quiser usar os novos campos das views, atualizar os componentes para usar `owner_property_name`:

**Arquivo:** `src/components/MostViewedCarousel.tsx` (linha 216)

```typescript
// ANTES
<span className="break-words line-clamp-2" title={horse.harasName}>
  {horse.harasName}
</span>

// DEPOIS
<span className="break-words line-clamp-2" title={
  getOwnerDisplayName(
    horse.owner_name, 
    horse.owner_property_name, 
    horse.owner_account_type
  )
}>
  {getOwnerDisplayName(
    horse.owner_name, 
    horse.owner_property_name, 
    horse.owner_account_type
  )}
</span>
```

**Repetir para:**
- `src/components/FeaturedCarousel.tsx`
- `src/components/RecentlyPublishedCarousel.tsx`
- `src/components/MostViewedThisMonthCarousel.tsx`
- `src/components/TopFemalesByMonthCarousel.tsx`
- `src/components/TopMalesByMonthCarousel.tsx`

---

## 🔍 Passo 5: Verificar Função search_animals (Crítico!)

A função RPC `search_animals` precisa retornar os novos campos.

**Arquivo:** `supabase_migrations/XXX_update_search_animals_function.sql`

```sql
-- ===================================================================
-- ATUALIZAR: Função search_animals para incluir owner_property_name
-- ===================================================================

CREATE OR REPLACE FUNCTION search_animals(
  search_term TEXT DEFAULT NULL,
  breed_filter TEXT DEFAULT NULL,
  state_filter TEXT DEFAULT NULL,
  city_filter TEXT DEFAULT NULL,
  gender_filter TEXT DEFAULT NULL,
  property_type_filter TEXT DEFAULT NULL,
  category_filter TEXT DEFAULT NULL,
  order_by TEXT DEFAULT 'ranking',
  limit_count INT DEFAULT 20,
  offset_count INT DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  breed TEXT,
  gender TEXT,
  birth_date DATE,
  coat TEXT,
  current_city TEXT,
  current_state TEXT,
  owner_name TEXT,
  property_name TEXT,  -- Este campo mapeia owner_property_name
  owner_account_type TEXT,  -- ✅ NOVO
  owner_property_type TEXT,  -- ✅ NOVO
  is_boosted BOOLEAN,
  boost_expires_at TIMESTAMPTZ,
  impression_count BIGINT,
  click_count BIGINT,
  click_rate NUMERIC,
  published_at TIMESTAMPTZ,
  images TEXT[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.name,
    a.breed,
    a.gender,
    a.birth_date,
    a.coat,
    a.current_city,
    a.current_state,
    p.name as owner_name,
    p.property_name,  -- ✅ Mapeia para owner_property_name
    p.account_type as owner_account_type,  -- ✅ NOVO
    p.property_type as owner_property_type,  -- ✅ NOVO
    a.is_boosted,
    a.boost_expires_at,
    COALESCE(imp.impression_count, 0) as impression_count,
    COALESCE(cl.click_count, 0) as click_count,
    CASE 
      WHEN COALESCE(imp.impression_count, 0) > 0 
      THEN ROUND((COALESCE(cl.click_count, 0)::DECIMAL / imp.impression_count) * 100, 2)
      ELSE 0 
    END as click_rate,
    a.published_at,
    a.images
  FROM animals a
  LEFT JOIN profiles p ON a.owner_id = p.id
  LEFT JOIN (
    SELECT content_id, COUNT(*) as impression_count
    FROM impressions 
    WHERE content_type = 'animal'
    GROUP BY content_id
  ) imp ON a.id = imp.content_id
  LEFT JOIN (
    SELECT content_id, COUNT(*) as click_count
    FROM clicks 
    WHERE content_type = 'animal'
    GROUP BY content_id
  ) cl ON a.id = cl.content_id
  WHERE a.ad_status = 'active'
    AND (search_term IS NULL OR 
         a.name ILIKE '%' || search_term || '%' OR
         a.breed ILIKE '%' || search_term || '%' OR
         p.name ILIKE '%' || search_term || '%' OR
         p.property_name ILIKE '%' || search_term || '%')  -- ✅ Buscar por property_name também
    AND (breed_filter IS NULL OR a.breed = breed_filter)
    AND (state_filter IS NULL OR a.current_state = state_filter)
    AND (city_filter IS NULL OR a.current_city = city_filter)
    AND (gender_filter IS NULL OR a.gender = gender_filter)
    AND (property_type_filter IS NULL OR p.property_type = property_type_filter)
    AND (category_filter IS NULL OR a.category = category_filter)
  ORDER BY
    CASE 
      WHEN order_by = 'ranking' THEN 
        (CASE WHEN a.is_boosted AND a.boost_expires_at > NOW() THEN 1000 ELSE 0 END + 
         COALESCE(imp.impression_count, 0) * 0.5 + 
         COALESCE(cl.click_count, 0) * 2)
      WHEN order_by = 'recent' THEN EXTRACT(EPOCH FROM a.published_at)
      WHEN order_by = 'most_viewed' THEN COALESCE(imp.impression_count, 0)
      ELSE 0
    END DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$;

-- Comentário
COMMENT ON FUNCTION search_animals IS 
  'Busca animais com filtros avançados, incluindo owner_property_name e owner_property_type';
```

**Execute este SQL no Supabase SQL Editor!**

---

## 🧪 Passo 6: Testar (15 min)

### Teste 1: Verificar Dados no Browser Console

```javascript
// No console do navegador, na página Home
console.log('Testando owner_property_name:');

// Buscar um animal da API
fetch('/api/animals/search?limit=1')
  .then(r => r.json())
  .then(data => {
    console.log('Animal:', data[0]);
    console.log('owner_name:', data[0].owner_name);
    console.log('property_name:', data[0].property_name);
    console.log('owner_account_type:', data[0].owner_account_type);
    console.log('owner_property_type:', data[0].owner_property_type);
  });
```

### Teste 2: Verificar Cards de Animais

1. Abrir página Home
2. Verificar carrosséis:
   - ✅ Animais em Destaque
   - ✅ Mais Visitados
   - ✅ Recém-Publicados

3. **Para contas institucionais:**
   - Deve mostrar: "Haras Santa Maria" (property_name)
   - NÃO deve mostrar: "João Silva" (owner_name)

4. **Para contas pessoais:**
   - Deve mostrar: "João Silva" (owner_name)

### Teste 3: Página de Busca

1. Ir para `/search`
2. Buscar por animais
3. Verificar cards exibem proprietário corretamente

### Teste 4: Página Individual do Animal

1. Clicar em um animal
2. Verificar informações do proprietário
3. Confirmar que mostra nome correto

---

## 📊 Checklist Final

Antes de considerar concluído:

- [ ] ✅ SQL executado no Supabase
- [ ] ✅ Verificação retorna 2 views e 4 colunas
- [ ] ✅ Tipos TypeScript atualizados (`AnimalWithStats`)
- [ ] ✅ Função utilitária `getOwnerDisplayName` criada
- [ ] ✅ Função `search_animals` atualizada (se aplicável)
- [ ] ✅ Testes manuais passando:
  - [ ] Home exibe nomes corretos
  - [ ] Busca exibe nomes corretos
  - [ ] Página individual exibe nome correto
  - [ ] Contas institucionais mostram property_name
  - [ ] Contas pessoais mostram owner_name

---

## 🚨 Se Algo Não Funcionar

### Problema 1: Campos não aparecem nas queries

**Solução:**
```sql
-- Verificar se as views foram recriadas
SELECT * FROM animals_with_stats LIMIT 1;

-- Se não retornar owner_property_name, reexecutar:
-- CORRECAO_OWNER_PROPERTY_NAME.sql
```

### Problema 2: Front-end não mostra nomes corretos

**Verificar:**
1. Tipos TypeScript foram atualizados?
2. Função `getOwnerDisplayName` foi importada?
3. Componentes estão usando a função?

### Problema 3: Busca não funciona

**Solução:**
```sql
-- Atualizar função search_animals
-- Executar o SQL do Passo 5
```

---

## 📚 Arquivos Relacionados

- ✅ **Aplicado:** `CORRECAO_OWNER_PROPERTY_NAME.sql`
- 📝 **Criar:** `src/utils/displayName.ts`
- 🔧 **Atualizar:** `src/types/supabase.ts`
- 🔧 **Atualizar (Opcional):** Componentes de carrossel
- 🔍 **Verificar:** `supabase_migrations/XXX_update_search_animals_function.sql`

---

## 🎯 Próximos Passos Após Finalização

1. **Commit das alterações:**
   ```bash
   git add .
   git commit -m "feat: adicionar owner_property_name para exibição de propriedades institucionais"
   ```

2. **Testar em produção**
3. **Monitorar logs**
4. **Verificar feedback de usuários**

---

**✅ Correção aplicada! Agora siga os passos acima para completar a integração.**

