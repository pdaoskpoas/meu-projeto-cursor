# Resumo da Correção: Exibição de Nome do Proprietário

**Data:** 18/11/2025  
**Status:** Pronto para aplicação  
**Tipo:** Correção de exibição de dados + Atualização de views do banco

---

## 🎯 Objetivo

Corrigir a exibição do nome do proprietário na página individual do animal para que:

- **Perfis Institucionais** (haras, fazenda, CTE, central de reprodução, etc.) exibam o `property_name`
- **Perfis Pessoais** exibam apenas o `name` da pessoa
- A solução seja **genérica** para TODOS os tipos de propriedades institucionais

---

## 🔍 Problema Identificado

Na página individual do animal, estava sendo exibido "Gustavo Monteiro" (nome pessoal) quando deveria exibir "Haras Monteiro" (nome da propriedade), pois o perfil é institucional.

### Causa Raiz

As views do banco de dados (`animals_with_stats` e `animals_with_partnerships`) não estavam retornando o campo `property_name` do proprietário, apenas o campo `name`.

---

## ✅ Solução Implementada

### 1. **SQL: Atualização das Views do Banco de Dados**

**Arquivo:** `CORRECAO_OWNER_PROPERTY_NAME.sql`

**Alterações:**
- ✅ Adiciona `p.property_name as owner_property_name` em `animals_with_stats`
- ✅ Adiciona `p.property_name as owner_property_name` em `animals_with_partnerships`
- ✅ Adiciona `p.property_type as owner_property_type` (tipo: haras/fazenda/cte/central-reproducao)
- ✅ Atualiza o `GROUP BY` em `animals_with_partnerships` para incluir os novos campos
- ✅ Mantém compatibilidade com código existente (não quebra nada)

**Características da Correção SQL:**
```sql
-- ✅ Genérica - suporta TODOS os tipos de propriedades
p.property_name as owner_property_name,
p.property_type as owner_property_type
```

**Views Atualizadas:**
1. `animals_with_stats` - usada por `animalService.ts` e `partnershipService.ts`
2. `animals_with_partnerships` - view estendida com informações de sociedades

---

### 2. **Frontend: Utilitário de Exibição de Nome**

**Arquivo:** `src/utils/ownerDisplayName.ts` (CRIADO)

**Funções:**
```typescript
getOwnerDisplayName(accountType, personalName, propertyName)
getOwnerDisplayNameFromAnimal(animal)
```

**Lógica:**
```typescript
if (accountType === 'institutional') {
  return propertyName || personalName || 'Proprietário não informado';
}
return personalName || 'Proprietário não informado';
```

**Características:**
- ✅ **Genérico:** Não menciona tipos específicos de propriedade
- ✅ **Seguro:** Fallbacks para evitar valores nulos
- ✅ **Reutilizável:** Pode ser usado em qualquer parte do sistema
- ✅ **Tipado:** TypeScript com tipos corretos

---

### 3. **Frontend: Página Individual do Animal**

**Arquivo:** `src/pages/animal/AnimalPage.tsx`

**Alterações Implementadas:**

#### 3.1. Busca de Dados do Proprietário
```typescript
const ownerAccountType = a.owner_account_type ?? 'personal';
const ownerDisplayName = ownerAccountType === 'institutional' 
  ? (a.owner_property_name || a.owner_name || '—')
  : (a.owner_name || '—');

setHorseDb({
  // ...
  ownerName: ownerDisplayName,
  ownerPersonalName: a.owner_name ?? null,
  ownerPropertyName: a.owner_property_name ?? null,
  ownerPublicCode: a.owner_public_code ?? null,
  ownerAccountType: ownerAccountType,
  // ...
});
```

#### 3.2. Exibição do Proprietário (já implementado anteriormente)
```tsx
<div className="flex items-center gap-2">
  <Users className="h-4 w-4 text-gray-500" />
  <span className="text-sm text-gray-600">Proprietário:</span>
  {horse.ownerPublicCode ? (
    <Link to={`/profile/${horse.ownerPublicCode}`}>
      {horse.ownerName}
    </Link>
  ) : (
    <span className="font-medium">{horse.ownerName}</span>
  )}
</div>
```

#### 3.3. Outras Informações Adicionadas
- ✅ **Categoria** do animal
- ✅ **Descrição** do animal ("Sobre o Animal")
- ✅ **Genealogia** completa (pai, mãe, avós paternos, avós maternos)
- ✅ **Sócios** com links corrigidos e exibição de nome correto

---

## 📋 Tipos de Propriedades Suportados

A solução é genérica e suporta **TODOS** os tipos de propriedades institucionais:

| Tipo                       | `property_type` | Exibição               |
|---------------------------|-----------------|------------------------|
| Haras                     | `'haras'`       | `property_name`       |
| Fazenda                   | `'fazenda'`     | `property_name`       |
| CTE (Centro de Treinamento)| `'cte'`        | `property_name`       |
| Central de Reprodução     | `'central-reproducao'` | `property_name` |
| Usuário Pessoal           | `null` (personal) | `name`             |

---

## 🔄 Fluxo de Dados Completo

1. **Banco de Dados (Supabase)**
   - View `animals_with_stats` ou `animals_with_partnerships`
   - Retorna: `owner_name`, `owner_property_name`, `owner_account_type`, `owner_property_type`

2. **Service Layer (`animalService.ts`)**
   - `getAnimalById(id)` busca dados da view
   - Retorna objeto com todos os campos do proprietário

3. **Página (`AnimalPage.tsx`)**
   - Determina `ownerDisplayName` baseado em `owner_account_type`
   - Se `institutional`: usa `owner_property_name`
   - Se `personal`: usa `owner_name`

4. **UI (Renderização)**
   - Exibe `horse.ownerName` (que já contém o nome correto)
   - Link para perfil: `/profile/${horse.ownerPublicCode}`

---

## 🧪 Testes Necessários

### Antes de Aplicar o SQL:
- ✅ Verificar estrutura da tabela `profiles` - **VERIFICADO**
- ✅ Verificar views existentes - **VERIFICADO**
- ✅ Confirmar que código é genérico - **CONFIRMADO**

### Após Aplicar o SQL:
1. ✅ Verificar se views foram recriadas com sucesso
2. ✅ Testar com perfil **institucional** (haras, fazenda, CTE, central de reprodução)
3. ✅ Testar com perfil **pessoal**
4. ✅ Verificar link para perfil do proprietário
5. ✅ Verificar informações adicionais (categoria, descrição, genealogia)

---

## 📦 Arquivos Criados/Modificados

### Criados:
- ✅ `CORRECAO_OWNER_PROPERTY_NAME.sql` - SQL para atualizar views
- ✅ `src/utils/ownerDisplayName.ts` - Utilitário genérico
- ✅ `RESUMO_CORRECAO_OWNER_DISPLAY_NAME.md` - Este documento

### Modificados:
- ✅ `src/pages/animal/AnimalPage.tsx` - Busca e exibe dados do proprietário corretamente

---

## ⚠️ Observações Importantes

### 1. Código Legado
O arquivo `AnimalPage.tsx` ainda contém uma seção "Haras Info" (linhas 586-609) que usa dados mock antigos (`mockHaras`). Essa seção **nunca será exibida** com dados reais do banco, pois:
- Só é renderizada se `haras` existir
- `haras` é baseado em `mockHaras.find(h => h.id === horse.harasId)`
- Com dados reais do banco (`horseDb`), `mockHaras` não encontra nada

**Recomendação:** Remover essa seção em uma refatoração futura para evitar confusão.

### 2. Compatibilidade
A correção SQL:
- ✅ Não quebra código existente
- ✅ Apenas adiciona novos campos
- ✅ Mantém todos os campos anteriores
- ✅ Compatível com todas as queries existentes

### 3. Performance
- ✅ Não adiciona JOINs extras (já existentes)
- ✅ Não adiciona subqueries complexas
- ✅ Campos adicionados são simplesmente selecionados da tabela `profiles`

---

## 🚀 Próximos Passos

1. **Aplicar SQL no Supabase:**
   ```bash
   # Executar CORRECAO_OWNER_PROPERTY_NAME.sql no SQL Editor do Supabase
   ```

2. **Verificar Aplicação:**
   - Checar mensagens de sucesso no console do SQL Editor
   - Confirmar que as views foram recriadas

3. **Testar no Frontend:**
   - Acessar página individual de um animal com proprietário institucional
   - Verificar se o nome da propriedade é exibido corretamente
   - Testar com diferentes tipos de propriedades

4. **Validar Links:**
   - Clicar no link do proprietário
   - Confirmar que leva ao perfil correto

---

## ✨ Resultado Esperado

### Antes:
```
Proprietário: Gustavo Monteiro (❌ nome pessoal)
```

### Depois:
```
Proprietário: Haras Monteiro (✅ nome da propriedade institucional)
```

**Para perfis pessoais, continua exibindo o nome da pessoa normalmente.**

---

## 📞 Suporte

Se houver qualquer problema após a aplicação:

1. Verificar logs do SQL Editor do Supabase
2. Verificar console do navegador (F12)
3. Confirmar que a migration foi aplicada com sucesso
4. Verificar se o `owner_property_name` está sendo retornado nas queries

---

**Correção revisada e pronta para aplicação! ✅**

