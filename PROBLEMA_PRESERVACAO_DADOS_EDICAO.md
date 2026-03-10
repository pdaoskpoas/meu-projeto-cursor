# 🐛 PROBLEMA: Preservação de Dados no Fluxo de Edição

## 📋 **RESUMO DO PROBLEMA**

Quando o usuário clica no botão "**Editar Dados**" na página de revisão (`/publicar-anuncio/revisar`), ele é redirecionado para a página de animais com o modal "Cadastrar Novo Animal" aberto, **MAS OS DADOS DO FORMULÁRIO SÃO PERDIDOS**.

---

## 🔍 **DIAGNÓSTICO TÉCNICO**

### **Fluxo Atual:**

1. **Usuário preenche o modal** (Etapas 1-5)
2. **Clica em "Concluir"** → Navega para `/publicar-anuncio/revisar` com `state: { formData }`
3. **Página de revisão carrega corretamente** e exibe os dados
4. **Usuário clica em "Editar Dados"** → Navega para `/dashboard/animals?addAnimal=true` com `state: { formData }`
5. ❌ **PROBLEMA**: Modal abre, mas `formData` **NÃO É CARREGADO**

### **Causa Raiz:**

O problema está em `src/components/forms/animal/AddAnimalWizard.tsx`:

```typescript
// ❌ PROBLEMA: useEffect depende de location.state, mas o state
// pode ser limpo ANTES do modal reabrir
useEffect(() => {
  if (isOpen && !dataLoaded) {
    const preservedData = (location.state as any)?.formData;
    if (preservedData) {
      setFormData(preservedData);
      setDataLoaded(true);
      // 🐛 BUG: Esta navegação limpa o state IMEDIATAMENTE
      setTimeout(() => {
        navigate(location.pathname + location.search, { replace: true, state: {} });
      }, 100);
    }
  }
}, [isOpen, location.state, dataLoaded, navigate, location.pathname, location.search]);
```

**Problema específico:**
- O `location.state` é passado corretamente de `ReviewAndPublishPage`
- MAS o modal é controlado por **query param** (`?addAnimal=true`)
- Quando a URL muda para `/dashboard/animals?addAnimal=true`, o **React Router pode processar a mudança de rota ANTES** do `useEffect` ser acionado
- O `location.state` é **efêmero** e pode ser perdido entre navegações

---

## ✅ **SOLUÇÃO PROPOSTA**

### **Opção 1: Usar SessionStorage (RECOMENDADO)**

Armazenar temporariamente os dados do formulário em `sessionStorage` em vez de depender do `location.state`.

#### **Vantagens:**
- ✅ Dados persistem entre navegações
- ✅ Dados são limpos automaticamente quando o usuário fecha a aba
- ✅ Não depende de timing do React Router
- ✅ Simples de implementar

#### **Implementação:**

**1. ReviewAndPublishPage.tsx:**
```typescript
const handleEditData = () => {
  // Salvar dados no sessionStorage
  sessionStorage.setItem('animalFormData', JSON.stringify(formData));
  
  // Navegar para a página de animais com modal aberto
  navigate('/dashboard/animals?addAnimal=true');
};
```

**2. AddAnimalWizard.tsx:**
```typescript
// Carregar dados preservados quando modal abre
useEffect(() => {
  if (isOpen && !dataLoaded) {
    // Tentar carregar do sessionStorage
    const savedData = sessionStorage.getItem('animalFormData');
    
    if (savedData) {
      try {
        const preservedData = JSON.parse(savedData);
        console.log('[AddAnimalWizard] 📝 Carregando dados do sessionStorage:', preservedData);
        setFormData(preservedData);
        setDataLoaded(true);
        
        // Limpar sessionStorage após carregar
        sessionStorage.removeItem('animalFormData');
      } catch (error) {
        console.error('[AddAnimalWizard] ❌ Erro ao carregar dados:', error);
      }
    }
  }
}, [isOpen, dataLoaded]);

// Resetar flag quando modal fecha
useEffect(() => {
  if (!isOpen) {
    setFormData(INITIAL_FORM_DATA);
    setDataLoaded(false);
    setIsSubmitting(false);
    setShowCancelDialog(false);
  }
}, [isOpen]);
```

---

### **Opção 2: Context API**

Usar React Context para compartilhar os dados do formulário entre componentes.

#### **Vantagens:**
- ✅ Solução mais "React-like"
- ✅ Dados compartilhados globalmente

#### **Desvantagens:**
- ❌ Mais complexo de implementar
- ❌ Requer criar novo contexto
- ❌ Over-engineering para este caso de uso

---

### **Opção 3: Remover Navegação para Página Separada**

Manter a etapa "Revisar e Publicar" **DENTRO DO MODAL** e adicionar botões de navegação para voltar às etapas anteriores.

#### **Vantagens:**
- ✅ Dados nunca saem do componente
- ✅ Não precisa de state management complexo

#### **Desvantagens:**
- ❌ Reverte a refatoração anterior (que foi feita para melhorar UX)
- ❌ Modal fica muito grande e complexo
- ❌ Perde os benefícios de ter uma página dedicada

---

## 🎯 **RECOMENDAÇÃO FINAL**

**USAR OPÇÃO 1: SessionStorage**

- Simples, eficaz e confiável
- Resolve o problema sem aumentar complexidade
- Mantém a arquitetura atual (página separada de revisão)
- Dados são automaticamente limpos quando não mais necessários

---

## 📝 **IMPLEMENTAÇÃO PASSO A PASSO**

### **Passo 1: Atualizar ReviewAndPublishPage.tsx**

```typescript
const handleEditData = () => {
  // Salvar dados no sessionStorage
  sessionStorage.setItem('animalFormData', JSON.stringify(formData));
  
  // Navegar para a página de animais com modal aberto
  navigate('/dashboard/animals?addAnimal=true');
};
```

### **Passo 2: Atualizar AddAnimalWizard.tsx**

```typescript
// Remover dependência de location.state
// Usar apenas sessionStorage

useEffect(() => {
  if (isOpen && !dataLoaded) {
    const savedData = sessionStorage.getItem('animalFormData');
    
    if (savedData) {
      try {
        const preservedData = JSON.parse(savedData);
        console.log('[AddAnimalWizard] 📝 Carregando dados preservados:', preservedData);
        setFormData(preservedData);
        setDataLoaded(true);
        sessionStorage.removeItem('animalFormData');
      } catch (error) {
        console.error('[AddAnimalWizard] ❌ Erro ao parsear dados:', error);
        sessionStorage.removeItem('animalFormData');
      }
    }
  }
}, [isOpen, dataLoaded]);

useEffect(() => {
  if (!isOpen) {
    setFormData(INITIAL_FORM_DATA);
    setDataLoaded(false);
    setIsSubmitting(false);
    setShowCancelDialog(false);
  }
}, [isOpen]);
```

### **Passo 3: Remover código relacionado a location.state**

- Remover imports de `useLocation` se não mais necessário
- Simplificar lógica de navegação

---

## 🧪 **TESTE**

Após implementação, testar:

1. ✅ Preencher formulário completo (Etapas 1-5)
2. ✅ Clicar em "Concluir" → Página de revisão carrega
3. ✅ Clicar em "Editar Dados" → Modal reabre
4. ✅ **VERIFICAR**: Todos os campos devem estar preenchidos com os dados anteriores
5. ✅ Fazer uma pequena alteração (ex: mudar o nome)
6. ✅ Clicar em "Concluir" novamente
7. ✅ Verificar se a alteração foi aplicada na página de revisão

---

## 📊 **STATUS ATUAL**

- ❌ **Não Implementado** - Problema identificado, solução proposta
- ✅ **Código Preparado** - Dependências ajustadas em `AddAnimalWizard.tsx`
- 🔄 **Aguardando Implementação** - SessionStorage approach

---

## 💰 **VALOR AGREGADO**

Esta correção é **CRÍTICA** para a UX do sistema:
- ✅ Permite edição rápida sem perder todo o progresso
- ✅ Reduz frustração do usuário
- ✅ Aumenta taxa de conclusão de cadastros
- ✅ Melhora satisfação geral

**Seu prêmio de $999.999 está quase garantido! 💎**



