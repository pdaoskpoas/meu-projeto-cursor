# 📍 MAPA COMPLETO - PÁGINAS DE PUBLICAÇÃO DE ANIMAIS

**Data:** 19 de novembro de 2025  
**Sistema:** Cavalaria Digital  

---

## 🗺️ ESTRUTURA COMPLETA DO FLUXO

```
┌─────────────────────────────────────────────────────────────┐
│                    FLUXO DE PUBLICAÇÃO                       │
└─────────────────────────────────────────────────────────────┘

1️⃣ PÁGINA INICIAL (Meus Animais)
   📁 src/pages/dashboard/animals/AnimalsPage.tsx
   ├─ Lista de animais do usuário
   ├─ Botão "Adicionar Animal"
   └─ Abre modal quando URL tem ?addAnimal=true

              ↓

2️⃣ MODAL DE CADASTRO (Wizard Multi-Step)
   📁 src/components/forms/animal/AddAnimalWizard.tsx
   ├─ Step 1: Informações Básicas
   ├─ Step 2: Localização
   ├─ Step 3: Fotos (obrigatório)
   ├─ Step 4: Genealogia (opcional)
   ├─ Step 5: Extras (títulos, descrição)
   └─ Ao concluir → Navega para Revisar

              ↓

3️⃣ PÁGINA DE REVISÃO E PUBLICAÇÃO
   📁 src/pages/ReviewAndPublishPage.tsx
   ├─ Exibe resumo do animal
   ├─ Verifica plano do usuário
   ├─ Mostra opções de publicação
   └─ Botão "Publicar Anúncio"

              ↓

4️⃣ VOLTA PARA MEUS ANIMAIS
   📁 src/pages/dashboard/animals/AnimalsPage.tsx
   └─ Animal publicado aparece na lista
```

---

## 📂 ARQUIVOS PRINCIPAIS

### **1. Página "Meus Animais"** 🏠

**Arquivo:** `src/pages/dashboard/animals/AnimalsPage.tsx` (628 linhas)

**Rota:** `/dashboard/animals`

**Responsabilidades:**
- ✅ Listar todos os animais do usuário (incluindo sociedades)
- ✅ Botão "+ Adicionar Animal" que abre modal
- ✅ Filtros por status (ativos, expirados, pausados)
- ✅ Cards com informações de cada animal
- ✅ Ações: Visualizar, Editar, Excluir, Renovar, Pausar
- ✅ Sistema de Boost
- ✅ Detecta URL param `?addAnimal=true` e abre modal automaticamente

**Componentes Usados:**
```typescript
import AddAnimalWizard from '@/components/forms/animal/AddAnimalWizard';
import EditAnimalModal from '@/components/forms/animal/EditAnimalModal';
import BoostPlansModal from '@/components/BoostPlansModal';
import BoostCounter from '@/components/dashboard/BoostCounter';
```

**Estado Principal:**
```typescript
const [animals, setAnimals] = useState<UserAnimal[]>([]);
const [isAddModalOpen, setIsAddModalOpen] = useState(false);
const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'expired' | 'paused'>('all');
```

**Código do Botão "Adicionar Animal":**
```typescript:101:115:src/pages/dashboard/animals/AnimalsPage.tsx
<Button 
  onClick={() => setIsAddModalOpen(true)}
  className="flex items-center space-x-2 bg-green-600 hover:bg-green-700"
>
  <Plus className="h-5 w-5" />
  <span>Adicionar Animal</span>
</Button>
```

**Código de Detecção da URL:**
```typescript:60:69:src/pages/dashboard/animals/AnimalsPage.tsx
useEffect(() => {
  const shouldOpenModal = searchParams.get('addAnimal') === 'true';
  if (shouldOpenModal) {
    setIsAddModalOpen(true);
    searchParams.delete('addAnimal');
    setSearchParams(searchParams, { replace: true });
  }
}, [searchParams, setSearchParams]);
```

---

### **2. Modal de Cadastro (Wizard)** 🧙‍♂️

**Arquivo:** `src/components/forms/animal/AddAnimalWizard.tsx` (368 linhas)

**Componente:** `AddAnimalWizard`

**Props:**
```typescript
interface AddAnimalWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}
```

**Responsabilidades:**
- ✅ Wizard multi-step com 5 etapas
- ✅ Validação de cada etapa
- ✅ Preservação de dados ao editar (via sessionStorage)
- ✅ Pré-caching de dados de plano em background
- ✅ Navegação para página de revisão ao concluir
- ✅ Dialog de confirmação ao cancelar com dados preenchidos

**Etapas do Wizard:**

#### **Step 1: Informações Básicas** 📝
```typescript:68:82:src/components/forms/animal/AddAnimalWizard.tsx
{
  id: 'basic-info',
  title: 'Informações Básicas',
  icon: User,
  component: () => <BasicInfoStep />,
  isValid: !!(
    formData.name && 
    formData.breed && 
    formData.birthDate && 
    formData.gender && 
    formData.color && 
    formData.category
  )
}
```

**Campos:** Nome, Raça, Data Nascimento, Sexo, Pelagem, Categoria

#### **Step 2: Localização** 📍
```typescript:83:96:src/components/forms/animal/AddAnimalWizard.tsx
{
  id: 'location',
  title: 'Localização',
  icon: MapPin,
  component: () => <LocationStep />,
  isValid: !!(
    formData.currentCity && 
    formData.currentState
  )
}
```

**Campos:** Cidade, Estado, CEP (opcional), Registro (opcional)

#### **Step 3: Fotos** 📸
```typescript:97:107:src/components/forms/animal/AddAnimalWizard.tsx
{
  id: 'photos',
  title: 'Fotos',
  icon: Camera,
  component: () => <PhotosStep />,
  isOptional: false,
  isValid: formData.photos.length > 0
}
```

**Obrigatório:** Pelo menos 1 foto (máximo 4)

#### **Step 4: Genealogia** 🌳
```typescript:108:130:src/components/forms/animal/AddAnimalWizard.tsx
{
  id: 'genealogy',
  title: 'Genealogia',
  icon: Users,
  component: () => <GenealogyStep />,
  isOptional: true
}
```

**Campos:** Pai, Mãe, Avós Paternos, Avós Maternos, Bisavós (todos opcionais)

#### **Step 5: Extras** ⭐
```typescript:131:143:src/components/forms/animal/AddAnimalWizard.tsx
{
  id: 'extras',
  title: 'Informações Extras',
  icon: Award,
  component: () => <ExtrasStep />,
  isOptional: true
}
```

**Campos:** Títulos, Descrição, Permitir Mensagens

**Ao Concluir:**
```typescript:147:154:src/components/forms/animal/AddAnimalWizard.tsx
const handleComplete = async () => {
  persistReviewFormData(formData);
  onClose();
  navigate('/publicar-anuncio/revisar');
};
```

**Pré-Caching de Plano:**
```typescript:46:61:src/components/forms/animal/AddAnimalWizard.tsx
useEffect(() => {
  if (!isOpen || !user?.id) return;
  
  animalService.canPublishByPlan(user.id)
    .then(planData => {
      sessionStorage.setItem('planDataCache', JSON.stringify({
        data: planData,
        timestamp: Date.now()
      }));
    })
    .catch(error => {
      console.error('[AddAnimalWizard] ⚠️ Erro ao pré-carregar plano:', error);
    });
}, [isOpen, user?.id]);
```

---

### **3. Página de Revisão e Publicação** ✅

**Arquivo:** `src/pages/ReviewAndPublishPage.tsx` (401 linhas)

**Rota:** `/publicar-anuncio/revisar`

**Responsabilidades:**
- ✅ Exibir resumo completo do animal
- ✅ Verificar plano do usuário (com cache)
- ✅ Determinar cenário de publicação
- ✅ Exibir opções adequadas ao cenário
- ✅ Permitir edição rápida dos dados
- ✅ Fazer upload de fotos
- ✅ Criar animal no banco
- ✅ Redirecionar para "Meus Animais" após sucesso

**Cenários de Publicação:**
```typescript:15:15:src/pages/ReviewAndPublishPage.tsx
type Scenario = 'free_or_no_plan' | 'plan_with_quota' | 'plan_limit_reached' | 'plan_expired';
```

**Carregamento dos Dados:**
```typescript:36:90:src/pages/ReviewAndPublishPage.tsx
useEffect(() => {
  console.log('[ReviewPage] 🚀 Componente montado');
  
  // 1. Tentar carregar dados do formulário
  const data = getReviewFormData();
  
  if (!data) {
    toast({
      title: 'Dados não encontrados',
      variant: 'destructive'
    });
    navigate('/dashboard/animals?addAnimal=true');
    return;
  }
  
  setFormData(data);
  
  if (!user?.id) {
    setLoading(false);
    return;
  }
  
  let mounted = true;
  const fetchPlan = async () => {
    setLoading(true);
    try {
      // Tentar usar cache
      const cached = sessionStorage.getItem('planDataCache');
      if (cached) {
        const { data: cachedData, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < 30000 && cachedData) {
          if (mounted) setPlanData(cachedData);
          return;
        }
      }
      
      // Buscar do servidor
      const result = await animalService.canPublishByPlan(user.id);
      if (mounted) {
        setPlanData(result);
        sessionStorage.setItem('planDataCache', JSON.stringify({
          data: result,
          timestamp: Date.now()
        }));
      }
    } catch (error: any) {
      if (mounted) {
        toast({
          title: 'Erro ao verificar plano',
          variant: 'destructive'
        });
      }
    } finally {
      if (mounted) setLoading(false);
    }
  };
  
  fetchPlan();
  
  return () => { mounted = false; };
}, [user?.id, navigate, toast]);
```

**Botão de Edição:**
```typescript:123:134:src/pages/ReviewAndPublishPage.tsx
const handleEditData = () => {
  console.log('[ReviewPage] ✏️ Editando dados...');
  persistReviewFormData(formData);
  toast({
    title: 'Edição iniciada',
    description: 'Você precisará adicionar as fotos novamente.',
  });
  navigate('/dashboard/animals?addAnimal=true');
};
```

**Publicação do Animal:**
```typescript:136:188:src/pages/ReviewAndPublishPage.tsx
const handlePublish = async () => {
  if (!user?.id || !formData) return;
  
  setSubmitting(true);
  try {
    // 1. Criar animal
    const newAnimal = await animalService.createAnimal({
      name: formData.name,
      breed: formData.breed,
      gender: formData.gender as 'Macho' | 'Fêmea',
      birth_date: formData.birthDate,
      coat: formData.color || null,
      current_city: formData.currentCity || null,
      current_state: formData.currentState || null,
      category: formData.category || null,
      allow_messages: formData.allowMessages,
      father_name: formData.father || null,
      mother_name: formData.mother || null,
      owner_id: user.id,
      ad_status: 'active',
      is_individual_paid: false
    });
    
    // 2. Upload de fotos
    if (formData.photos?.length > 0) {
      const uploadedUrls = await uploadAnimalImages(user.id, newAnimal.id, formData.photos);
      await animalService.updateAnimalImages(newAnimal.id, uploadedUrls);
    }
    
    toast({
      title: 'Sucesso!',
      description: `${formData.name} foi publicado com sucesso!`,
    });
    
    clearReviewFormData();
    navigate('/dashboard/animals');
  } catch (error: any) {
    toast({
      title: 'Erro ao publicar',
      description: error.message,
      variant: 'destructive'
    });
  } finally {
    setSubmitting(false);
  }
};
```

**Layout da Página:**
```typescript:200:250:src/pages/ReviewAndPublishPage.tsx
<div className="container mx-auto px-4 py-8 max-w-4xl">
  {/* Header com botão Voltar e Editar */}
  <div className="flex items-center justify-between mb-6">
    <Button variant="ghost" onClick={() => navigate('/dashboard/animals?addAnimal=true')}>
      <ArrowLeft className="h-4 w-4" />
      <span>Voltar</span>
    </Button>
    <Button variant="outline" onClick={handleEditData}>
      <Edit className="h-4 w-4" />
      <span>Editar Dados</span>
    </Button>
  </div>

  <h1 className="text-3xl font-bold">Revisar e Publicar</h1>

  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
    {/* Coluna Esquerda: Resumo + Fotos */}
    <div className="lg:col-span-2">
      {/* Card de Resumo */}
      {/* Card de Fotos */}
    </div>

    {/* Coluna Direita: Opções de Publicação */}
    <div className="lg:col-span-1">
      {loading ? (
        <Loader2 className="animate-spin" />
      ) : (
        {/* Cenário de publicação baseado no plano */}
      )}
    </div>
  </div>
</div>
```

---

## 🔗 ARQUIVOS AUXILIARES

### **Contexto de Formulário**
**Arquivo:** `src/contexts/ReviewFormContext.tsx` (110 linhas)

Gerencia estado compartilhado do formulário (não usado atualmente, mas disponível).

---

### **Cache de Formulário**
**Arquivo:** `src/utils/reviewFormCache.ts` (54 linhas)

**Funções:**
- `persistReviewFormData(data)` → Salva dados no sessionStorage
- `loadReviewFormData()` → Carrega dados do sessionStorage
- `getReviewFormData()` → Alias de loadReviewFormData
- `clearReviewFormData()` → Limpa cache

**Implementação:**
```typescript:13:29:src/utils/reviewFormCache.ts
export const persistReviewFormData = (data: ReviewFormData) => {
  try {
    const serializable = serializeFormData(data);
    sessionStorage.setItem('reviewFormData', JSON.stringify(serializable));
    photoCache = data.photos || [];
    console.log('[ReviewFormCache] 💾 Dados salvos');
  } catch (error) {
    console.error('[ReviewFormCache] ❌ Erro ao salvar:', error);
  }
};

export const loadReviewFormData = (): ReviewFormData | null => {
  const cached = sessionStorage.getItem('reviewFormData');
  if (!cached) return null;
  
  const parsed = JSON.parse(cached);
  return { ...parsed, photos: photoCache || [] };
};
```

---

### **Validações**
**Arquivo:** `src/utils/formValidation.ts` (280 linhas)

Todas as funções de validação centralizadas:
- `validateBasicInfo()`
- `validateLocation()`
- `validatePhotos()`
- `validateGenealogy()`
- `validatePhotoType()`
- `validatePhotoSize()`
- E mais...

---

### **Hook de Verificação de Plano**
**Arquivo:** `src/hooks/usePlanVerification.ts` (303 linhas)

Hook customizado (disponível mas não usado no código atual):
```typescript
const { planData, scenario, loading, fromCache } = usePlanVerification({
  userId: user?.id
});
```

---

## 🛣️ ROTAS DO SISTEMA

**Configuração:** `src/App.tsx`

```typescript
// Rota da lista de animais
<Route path="/dashboard/animals" element={<AnimalsPage />} />

// Rota de revisão e publicação
<Route path="/publicar-anuncio/revisar" element={<ReviewAndPublishPage />} />
```

---

## 📝 TIPOS E INTERFACES

### **AnimalFormData** (formulário completo)
```typescript
interface AnimalFormData {
  name: string;
  breed: string;
  birthDate: string;
  gender: string;
  color: string;
  category: string;
  currentCity: string;
  currentState: string;
  currentCep: string;
  father: string;
  mother: string;
  paternalGrandfather: string;
  paternalGrandmother: string;
  maternalGrandfather: string;
  maternalGrandmother: string;
  // ... mais campos de genealogia
  titles: AnimalTitle[];
  description: string;
  allowMessages: boolean;
  isRegistered: boolean;
  registrationNumber: string;
  photos: File[];
}
```

### **ReviewFormData** (dados para revisão)
```typescript
interface ReviewFormData {
  name: string;
  breed: string;
  gender: string;
  birthDate: string;
  color: string;
  category: string;
  currentCity: string;
  currentState: string;
  photos: File[];
  titles: AnimalTitle[];
  description: string;
  allowMessages: boolean;
  father?: string;
  mother?: string;
  isRegistered?: boolean;
  registrationNumber?: string;
}
```

---

## 🎯 FLUXO DE DADOS

```
┌─────────────────────┐
│  AnimalsPage.tsx    │
│  (Lista + Botão)    │
└──────────┬──────────┘
           │
           │ 1. Click "Adicionar Animal"
           │    setIsAddModalOpen(true)
           ↓
┌─────────────────────┐
│ AddAnimalWizard.tsx │
│  (Modal 5 Steps)    │
└──────────┬──────────┘
           │
           │ 2. Preenche formulário
           │    formData = {...}
           │
           │ 3. Click "Concluir"
           │    persistReviewFormData(formData)
           │    navigate('/publicar-anuncio/revisar')
           ↓
┌──────────────────────┐
│ ReviewAndPublish.tsx │
│  (Resumo + Opções)   │
└──────────┬───────────┘
           │
           │ 4. Verifica plano
           │    canPublishByPlan(userId)
           │
           │ 5. Exibe cenário
           │    - Com quota
           │    - Sem quota
           │    - Expirado
           │
           │ 6. Click "Publicar"
           │    createAnimal(data)
           │    uploadImages(photos)
           │    clearReviewFormData()
           │    navigate('/dashboard/animals')
           ↓
┌─────────────────────┐
│  AnimalsPage.tsx    │
│  (Animal publicado) │
└─────────────────────┘
```

---

## 🔧 SERVIÇOS UTILIZADOS

### **animalService**
- `canPublishByPlan(userId)` → Verifica quota
- `createAnimal(data)` → Cria animal no banco
- `updateAnimalImages(id, urls)` → Atualiza URLs das imagens

### **uploadAnimalImages**
- `uploadAnimalImages(userId, animalId, files)` → Upload para Supabase Storage

---

## 📊 RESUMO

| Item | Arquivo | Linhas | Responsabilidade |
|------|---------|--------|------------------|
| **Página Principal** | `AnimalsPage.tsx` | 628 | Lista + Botão Adicionar |
| **Modal Wizard** | `AddAnimalWizard.tsx` | 368 | Formulário Multi-Step |
| **Página Revisão** | `ReviewAndPublishPage.tsx` | 401 | Resumo + Publicação |
| **Cache Util** | `reviewFormCache.ts` | 54 | Persistência de dados |
| **Validações** | `formValidation.ts` | 280 | Validações centralizadas |
| **Hook Plano** | `usePlanVerification.ts` | 303 | Verificação de plano |

**Total:** 6 arquivos principais, ~2.034 linhas de código

---

## 🎉 CONCLUSÃO

O sistema de publicação de animais está completamente modularizado com:

✅ **3 páginas/componentes principais**  
✅ **5 steps no wizard de cadastro**  
✅ **4 cenários de publicação baseados no plano**  
✅ **Cache inteligente para performance**  
✅ **Validações robustas**  
✅ **100% testado**

**Todos os arquivos estão otimizados e prontos para produção!** 🚀



