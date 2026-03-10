# ✅ Resumo: Correção Nome do Proprietário por Tipo de Conta

**Data:** 18 de Novembro de 2025  
**Status:** ✅ Código Pronto | ⏳ Aguardando SQL

---

## 🎯 Problema

**Perfis institucionais mostrando nome pessoal em vez do nome da propriedade:**
- ❌ Aparecia: "Gustavo Monteiro"
- ✅ Deveria aparecer: "Haras Monteiro"

---

## 🔧 Solução Implementada

### 1. **SQL para Adicionar Campo** ⚠️ APLICAR NO BANCO

**Arquivo:** `CORRECAO_OWNER_PROPERTY_NAME.sql`

Adiciona `owner_property_name` à view `animals_with_stats`:

```sql
CREATE OR REPLACE VIEW animals_with_stats AS
SELECT 
    a.*,
    p.name as owner_name,
    p.property_name as owner_property_name,  -- ✅ NOVO
    p.public_code as owner_public_code,
    p.account_type as owner_account_type,
    -- ... resto da view
```

### 2. **Função Utility no Frontend** ✅

**Arquivo:** `src/utils/ownerDisplayName.ts` (criado)

```typescript
getOwnerDisplayName(accountType, personalName, propertyName)
```

**Lógica:**
- Se `account_type === 'institutional'` → Mostra `property_name`
- Se `account_type === 'personal'` → Mostra `name`

### 3. **AnimalPage.tsx Atualizada** ✅

```typescript
// Determina nome correto baseado no tipo de conta
const ownerAccountType = a.owner_account_type ?? 'personal';
const ownerDisplayName = ownerAccountType === 'institutional' 
  ? (a.owner_property_name || a.owner_name || '—')
  : (a.owner_name || '—');
```

---

## 📁 Arquivos Criados/Modificados

### Criados:
1. ✅ `src/utils/ownerDisplayName.ts` - Função helper
2. ✅ `CORRECAO_OWNER_PROPERTY_NAME.sql` - SQL para aplicar
3. ✅ `APLICAR_CORRECAO_OWNER_PROPERTY_NAME.md` - Instruções
4. ✅ Este resumo

### Modificados:
1. ✅ `src/pages/animal/AnimalPage.tsx` - Lógica de exibição do proprietário

---

## 🧪 Como Testar

### Após Aplicar SQL:

1. **Perfil Institucional:**
   - Acesse animal de um haras
   - Deve mostrar: "Haras Monteiro" (não "Gustavo Monteiro")
   
2. **Perfil Pessoal:**
   - Acesse animal de pessoa física
   - Deve mostrar: "João Silva" (nome da pessoa)

3. **Links:**
   - Clicar no nome deve ir para `/profile/{codigo}`
   - Perfil deve abrir corretamente

---

## ⚠️ IMPORTANTE

**O SQL precisa ser aplicado no Supabase primeiro!**

Sem o SQL:
- Campo `owner_property_name` não existe
- Sistema continua mostrando nome pessoal

Com o SQL:
- ✅ Campo disponível
- ✅ Frontend usa lógica correta
- ✅ Nomes corretos são exibidos

---

## 📊 Resultado

### Antes ❌:
```
Proprietário: Gustavo Monteiro
(Perfil institucional mostrando nome pessoal)
```

### Depois ✅:
```
Proprietário: Haras Monteiro
(Perfil institucional mostrando nome da propriedade)
```

### Também Correto ✅:
```
Proprietário: João Silva
(Perfil pessoal mostrando nome pessoal)
```

---

## 📝 Próximos Passos

1. ⏳ Aplicar SQL no Supabase (`CORRECAO_OWNER_PROPERTY_NAME.sql`)
2. ✅ Testar com perfil institucional
3. ✅ Testar com perfil pessoal
4. 📋 (Opcional) Atualizar componentes de card

---

## ✅ Status

- ✅ Código do frontend completo
- ✅ Função utility criada
- ✅ Lógica implementada
- ✅ Zero erros de lint
- ⏳ Aguardando aplicação do SQL

---

**Documentação Completa:** `APLICAR_CORRECAO_OWNER_PROPERTY_NAME.md`  
**SQL para Aplicar:** `CORRECAO_OWNER_PROPERTY_NAME.sql`

