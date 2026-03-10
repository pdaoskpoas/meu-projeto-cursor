# 🔧 Instruções: Correção Nome do Proprietário

**Data:** 18 de Novembro de 2025  
**Problema:** Perfis institucionais mostrando nome pessoal em vez do nome da propriedade/haras  
**Exemplo:** "Gustavo Monteiro" aparece em vez de "Haras Monteiro"

---

## 📋 Passo a Passo

### 1. Aplicar SQL no Banco de Dados ⚠️ IMPORTANTE

**Arquivo:** `CORRECAO_OWNER_PROPERTY_NAME.sql`

**Ação:** Executar esse arquivo no Supabase SQL Editor

**O que faz:**
- Recria a view `animals_with_stats` incluindo o campo `owner_property_name`
- Adiciona `p.property_name` ao SELECT e ao GROUP BY
- Valida que o campo foi adicionado corretamente

**Resultado esperado:**
```sql
SELECT 
    id,
    name,
    owner_name,
    owner_property_name,  -- ✅ Novo campo
    owner_account_type
FROM animals_with_stats 
LIMIT 1;
```

---

### 2. Mudanças no Frontend (Já Aplicadas ✅)

#### A. Função Utility Criada:
**`src/utils/ownerDisplayName.ts`**

```typescript
getOwnerDisplayName(accountType, personalName, propertyName)
```

**Lógica:**
- `institutional` → Retorna `property_name` (ou `name` como fallback)
- `personal` → Retorna `name`

#### B. AnimalPage.tsx Atualizada:
```typescript
const ownerAccountType = a.owner_account_type ?? 'personal';
const ownerDisplayName = ownerAccountType === 'institutional' 
  ? (a.owner_property_name || a.owner_name || '—')
  : (a.owner_name || '—');
```

---

## 🧪 Testar Após Aplicar SQL

1. Acesse um animal de perfil institucional (ex: Haras Monteiro)
2. Verifique se mostra "Haras Monteiro" e não "Gustavo Monteiro"
3. Verifique se o link para o perfil funciona
4. Teste em cards da home (featured carousel)

---

## 📝 Próximos Passos (Opcional)

### Atualizar Componentes de Card

Os seguintes componentes podem ser atualizados para usar a nova lógica:

1. `FeaturedCarousel.tsx`
2. `MostViewedCarousel.tsx`
3. `RecentlyPublishedCarousel.tsx`
4. `TopMalesByMonthCarousel.tsx`
5. `TopFemalesByMonthCarousel.tsx`

**Mudança necessária:**

**Antes:**
```tsx
<span>{horse.harasName}</span>
```

**Depois:**
```typescript
import { getOwnerDisplayNameFromAnimal } from '@/utils/ownerDisplayName';

<span>
  {getOwnerDisplayNameFromAnimal({
    owner_account_type: horse.owner_account_type,
    owner_name: horse.owner_name,
    owner_property_name: horse.owner_property_name
  })}
</span>
```

---

## ⚠️ Importante

**A correção no banco (SQL) é OBRIGATÓRIA antes de usar no frontend!**

Sem aplicar o SQL:
- O campo `owner_property_name` não existirá
- O frontend receberá `null` ou `undefined`
- O nome pessoal continuará aparecendo

Com o SQL aplicado:
- ✅ View retorna `owner_property_name`
- ✅ Frontend usa a lógica correta
- ✅ Perfis institucionais mostram nome da propriedade

---

## 📊 Fluxo Completo

```
1. SQL cria campo owner_property_name na view
           ↓
2. RPC functions retornam esse campo
           ↓
3. Frontend recebe os dados completos
           ↓
4. Utility function decide qual nome exibir
           ↓
5. UI mostra nome correto baseado no account_type
```

---

## ✅ Checklist

- [ ] SQL aplicado no Supabase
- [ ] View animals_with_stats recriada
- [ ] Campo owner_property_name aparece em SELECT
- [ ] Testado com perfil institucional
- [ ] Nome da propriedade aparece no anúncio
- [ ] Link para perfil funciona
- [ ] Cards da home mostram nome correto

---

**Status Atual:**
- ✅ Código do frontend pronto
- ⏳ Aguardando aplicação do SQL no banco
- 📝 Documentação completa

**Após aplicar SQL:** Sistema funcionará corretamente! 🎉

