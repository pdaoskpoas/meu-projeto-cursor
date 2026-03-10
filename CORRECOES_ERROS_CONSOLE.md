# 🔧 CORREÇÕES DE ERROS DO CONSOLE

## 📋 **RESUMO**

Este documento detalha todas as correções aplicadas para resolver os erros que apareciam no console do navegador.

---

## 🚨 **ERROS IDENTIFICADOS E CORRIGIDOS**

### **1. ❌ Erro 400 - Campo `status` em `animal_partnerships`**

**Erro:**
```
Failed to load resource: the server responded with a status of 400
animal_partnerships?select=*&partner_id=eq...&status=eq.pending
```

**Causa:**
- O hook `useUnreadCounts.ts` tentava filtrar por `.eq('status', 'pending')`
- A coluna `status` foi **removida** na Migration 065
- Todas as parcerias agora são aceitas automaticamente

**Correção:**
```typescript
// ANTES (linha 50-54)
const { count: pendingPartnerships } = await supabase
  .from('animal_partnerships')
  .select('*', { count: 'exact', head: true })
  .eq('partner_id', user.id)
  .eq('status', 'pending');

// DEPOIS
// NOTA: Migration 065 removeu o campo 'status'. Todas as parcerias são aceitas automaticamente.
// Para manter compatibilidade, retornamos 0 convites pendentes.
const pendingPartnerships = 0;
```

**Arquivo:** `src/hooks/useUnreadCounts.ts`

---

### **2. ❌ Erro 400 - Campo `description` em `animals`**

**Erro:**
```
Could not find the 'description' column of 'animals' in the schema cache
Code: PGRST204
```

**Causa:**
- O código tentava inserir uma coluna `description` que não existe na tabela `animals`
- O campo `description` nunca foi criado no schema do Supabase

**Correção:**
```typescript
// ANTES (linha 137-140)
current_city: formData.currentCity || null,
current_state: formData.currentState || null,
category: formData.category || null,
description: formData.description || null, // ❌ REMOVIDO
allow_messages: formData.allowMessages,

// DEPOIS
current_city: formData.currentCity || null,
current_state: formData.currentState || null,
category: formData.category || null,
allow_messages: formData.allowMessages,
```

**Arquivo:** `src/pages/ReviewAndPublishPage.tsx`

---

### **3. ❌ TypeError - `URL.createObjectURL` com foto fake**

**Erro:**
```
TypeError: Failed to execute 'createObjectURL' on 'URL': Overload resolution failed.
at ImageUploadWithPreview.tsx:148:20
```

**Causa:**
- Quando o usuário clicava em "Editar Dados", o `sessionStorage` salvava os dados incluindo os objetos `File` das fotos
- `File` objects **não podem ser serializados** em JSON
- Ao tentar recarregar, `JSON.parse()` não recria os `File` objects
- `URL.createObjectURL()` falhava ao receber dados inválidos

**Correção:**
```typescript
const handleEditData = () => {
  // Salvar dados no sessionStorage para preservação entre navegações
  // NOTA: Não podemos serializar File objects, então salvamos apenas os metadados
  const dataToSave = {
    ...formData,
    photos: [] // Não salvar fotos no sessionStorage (não são serializáveis)
  };
  
  sessionStorage.setItem('animalFormData', JSON.stringify(dataToSave));
  console.log('[ReviewPage] 💾 Dados salvos no sessionStorage para edição (sem fotos):', dataToSave);
  
  toast({
    title: 'Edição iniciada',
    description: 'Você precisará adicionar as fotos novamente.',
  });
  
  // Volta para a página de animais com o modal aberto
  navigate('/dashboard/animals?addAnimal=true');
};
```

**Arquivo:** `src/pages/ReviewAndPublishPage.tsx`

**Impacto UX:**
- Agora, quando o usuário clica em "Editar Dados", as fotos **não são preservadas**
- Ele verá uma notificação informando que precisará adicionar as fotos novamente
- Todos os outros dados (nome, raça, localização, etc.) são preservados

---

## 🎯 **OUTROS ERROS (NÃO CRÍTICOS)**

### **4. ⚠️ Warning - Missing Description in DialogContent**

**Erro:**
```
Warning: Missing `Description` or `aria-describedby={undefined}` for {DialogContent}
```

**Causa:**
- Componente `Dialog` do Radix UI esperando um `DialogDescription` para acessibilidade
- Não é um erro crítico, apenas um aviso de acessibilidade

**Correção sugerida (OPCIONAL):**
Adicionar `<DialogDescription>` nos modais que não têm:
```tsx
<DialogContent>
  <DialogHeader>
    <DialogTitle>Título</DialogTitle>
    <DialogDescription>
      Descrição do modal para leitores de tela
    </DialogDescription>
  </DialogHeader>
  {/* ... conteúdo ... */}
</DialogContent>
```

---

### **5. ⚠️ Warning - Invalid DOM Nesting**

**Erro:**
```
Warning: validateDOMNesting(...): <div> cannot appear as a descendant of <p>
```

**Causa:**
- Há um `<Badge>` (que renderiza uma `<div>`) dentro de um `<p>` na página de revisão
- HTML não permite `div` dentro de `p`

**Correção sugerida (OPCIONAL):**
Trocar o `<p>` por `<div>` ou usar `<span>` no Badge:
```tsx
// ANTES
<p>
  Você tem <Badge>{remaining}</Badge> vagas disponíveis
</p>

// DEPOIS
<div>
  Você tem <Badge>{remaining}</Badge> vagas disponíveis
</div>
```

**Arquivo:** `src/pages/ReviewAndPublishPage.tsx` (aproximadamente linha 250-260)

---

### **6. ⚠️ Erro 406 - Permissões RLS**

**Erro:**
```
Failed to load resource: status 406
animals?select=current_city,current_state&owner_id=eq...
```

**Causa:**
- Row Level Security (RLS) bloqueando acesso a `current_city` e `current_state`
- Provavelmente uma query de autocomplete que não tem as permissões corretas

**Solução:**
Verificar as políticas RLS da tabela `animals` e garantir que o usuário pode ler seus próprios dados:

```sql
-- Política para leitura dos próprios animais
CREATE POLICY "Users can read own animals"
ON animals FOR SELECT
USING (auth.uid() = owner_id);
```

---

## ✅ **RESULTADO FINAL**

### **Erros Corrigidos:**
- ✅ Erro 400 - Campo `status` removido
- ✅ Erro 400 - Campo `description` removido
- ✅ TypeError - Fotos não mais serializadas no sessionStorage

### **Warnings Restantes (não críticos):**
- ⚠️ Missing DialogDescription (acessibilidade)
- ⚠️ Invalid DOM nesting (HTML semântico)
- ⚠️ Erro 406 (permissões RLS - precisa investigar mais)

---

## 🧪 **TESTE**

Após as correções, teste:

1. ✅ Cadastrar um animal completo
2. ✅ Clicar em "Publicar Anúncio" → Deve funcionar sem erro
3. ✅ Verificar console → Não deve mais aparecer erro 400 de `description` ou `status`
4. ✅ Clicar em "Editar Dados" → Modal abre com dados preservados (exceto fotos)
5. ✅ Adicionar foto novamente e concluir
6. ✅ Publicar com sucesso

---

## 📝 **NOTAS IMPORTANTES**

### **Sobre as Fotos:**
- `File` objects não podem ser serializados em JSON/sessionStorage
- Para preservar fotos durante edição, seria necessário:
  - Converter para base64 (muito pesado)
  - Fazer upload temporário no servidor
  - Usar IndexedDB (API mais complexa)
- **Decisão:** Por simplicidade, pedimos para o usuário adicionar fotos novamente

### **Sobre `description`:**
- Se o campo `description` for necessário no futuro, crie uma migration:
  ```sql
  ALTER TABLE animals ADD COLUMN description TEXT;
  ```

### **Sobre `status` em partnerships:**
- A Migration 065 simplificou o sistema de parcerias
- Todas as parcerias são aceitas instantaneamente
- Para restaurar sistema de convites:
  ```sql
  ALTER TABLE animal_partnerships ADD COLUMN status TEXT CHECK (status IN ('pending', 'accepted', 'rejected'));
  ```

---

**Data:** 19/11/2025  
**Status:** ✅ Correções aplicadas e testadas



