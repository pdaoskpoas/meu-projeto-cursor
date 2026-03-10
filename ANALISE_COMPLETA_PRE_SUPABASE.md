# 📋 ANÁLISE COMPLETA DO SISTEMA - PREPARAÇÃO PRÉ-SUPABASE

**Data da Análise:** 30 de Setembro de 2025  
**Versão do Sistema:** 0.0.0  
**Status:** Em Desenvolvimento - Dados Mock

---

## 📊 SUMÁRIO EXECUTIVO

Esta análise completa identifica **TODAS** as áreas que precisam de atenção antes da integração com o Supabase. O sistema possui uma base sólida, mas requer refatorações significativas, remoção de código duplicado e correções de erros para garantir uma transição suave para o backend real.

### 🎯 Principais Achados

- ✅ **22 Rotas** mapeadas e funcionais
- ⚠️ **20 Componentes** com mais de 400 linhas (necessitam refatoração)
- ❌ **7 Arquivos duplicados** para remoção
- ⚠️ **27 Erros de Lint** (uso de `any`)
- ⚠️ **14 Warnings** de React Hooks e Fast Refresh
- ✅ **3 Contextos** funcionais (Auth, Chat, Favorites)
- ✅ **17 Hooks customizados** implementados
- ✅ **Responsividade** implementada (breakpoint 768px)

---

## 🗺️ MAPA DE ROTAS E PÁGINAS

### Rotas Públicas (9)
| Rota | Arquivo | Status | Responsividade | Observações |
|------|---------|--------|----------------|-------------|
| `/` | `Index.tsx` | ✅ | ✅ | Página inicial - OK |
| `/animal/:id` | `AnimalPage.tsx` | ✅ | ⚠️ | 461 linhas - refatorar |
| `/haras/:id` | `HarasPage.tsx` | ✅ | ⚠️ | 346 linhas - revisar |
| `/buscar` | `RankingPage.tsx` | ✅ | ⚠️ | 536 linhas - refatorar |
| `/buscar/:breed` | `RankingPage.tsx` | ✅ | ⚠️ | 536 linhas - refatorar |
| `/mapa` | `MapPage.tsx` | ✅ | ✅ | 280 linhas - OK |
| `/noticias` | `NewsPage.tsx` | ✅ | ✅ | 295 linhas - OK |
| `/noticias/:id` | `ArticlePage.tsx` | ✅ | ✅ | 274 linhas - OK |
| `/eventos` | `EventsPage.tsx` | ✅ | ⚠️ | 445 linhas - refatorar |

### Rotas de Autenticação (2)
| Rota | Arquivo | Status | Responsividade | Observações |
|------|---------|--------|----------------|-------------|
| `/login` | `LoginPage.tsx` | ✅ | ✅ | OK |
| `/register` | `RegisterPage.tsx` | ✅ | ⚠️ | RegisterForm.tsx 490 linhas |

### Rotas do Dashboard (10)
| Rota | Arquivo | Status | Responsividade | Observações |
|------|---------|--------|----------------|-------------|
| `/dashboard` | `DashboardPage.tsx` | ✅ | ⚠️ | 410 linhas - refatorar |
| `/dashboard/animals` | `AnimalsPage.tsx` | ✅ | ⚠️ | 455 linhas - refatorar |
| `/dashboard/add-animal` | `AddAnimalPage.tsx` | ✅ | ✅ | 229 linhas - OK |
| `/dashboard/edit-animal/:id` | `EditAnimalPage.tsx` | ✅ | ✅ | 329 linhas - OK |
| `/dashboard/events` | `EventsPage.tsx` | ✅ | ⚠️ | 593 linhas - refatorar |
| `/dashboard/messages` | `MessagesPage.tsx` | ✅ | ⚠️ | 383 linhas - revisar |
| `/dashboard/stats` | `StatsPage.tsx` | ✅ | ❌ | 728 linhas - CRÍTICO |
| `/dashboard/notifications` | `NotificationsPage.tsx` | ✅ | ❌ | 648 linhas - CRÍTICO |
| `/dashboard/settings` | `SettingsPage.tsx` | ✅ | ⚠️ | 379 linhas - revisar |
| `/dashboard/favoritos` | `FavoritosPage.tsx` | ✅ | ✅ | 317 linhas - OK |

### Rota Admin (1)
| Rota | Arquivo | Status | Responsividade | Observações |
|------|---------|--------|----------------|-------------|
| `/admin` | `AdminPage.tsx` | ✅ | ❌ | Múltiplos componentes gigantes |

### Outras Rotas
| Rota | Arquivo | Status | Observações |
|------|---------|--------|-------------|
| `/planos` | `PlansPage.tsx` | ✅ | OK |
| `/eventos/:id` | `EventPage.tsx` | ✅ | 243 linhas - OK |
| `*` | `NotFound.tsx` | ✅ | OK |

---

## 🚨 COMPONENTES CRÍTICOS - REFATORAÇÃO URGENTE

### Componentes CRÍTICOS (>800 linhas) - PRIORIDADE MÁXIMA

#### 1. AdminStats.tsx - **2176 LINHAS** 🔴
**Localização:** `src/components/AdminStats.tsx`  
**Problema:** Componente gigantesco com múltiplas responsabilidades  
**Erros de Lint:** 3 erros (`any` types)

**Refatoração Necessária:**
- Separar em pelo menos 10 componentes menores:
  - `UserStatsCard.tsx`
  - `AnimalStatsCard.tsx`
  - `FinancialStatsCard.tsx`
  - `GrowthChart.tsx`
  - `RevenueChart.tsx`
  - `UserActivityChart.tsx`
  - `TopPerformersTable.tsx`
  - `RecentActivityList.tsx`
  - `StatsFilters.tsx`
  - `StatsExport.tsx`

**Estimativa:** 8-12 horas de trabalho

---

#### 2. AddAnimalModal.tsx - **1261 LINHAS** 🔴
**Localização:** `src/components/AddAnimalModal.tsx`  
**Problema:** Modal com formulário complexo demais  
**Erros de Lint:** 4 erros (`any` types)

**Refatoração Necessária:**
- Converter em componente de página com wizard steps
- Separar validações em hook customizado
- Criar componentes para cada seção do formulário
- Implementar salvamento em draft (localStorage)

**Componentes a criar:**
- `AnimalFormWizard.tsx`
- `useAnimalFormValidation.ts`
- Reutilizar steps já existentes em `forms/steps/`

**Estimativa:** 6-8 horas de trabalho

---

#### 3. AddEventModal.tsx - **1148 LINHAS** 🔴
**Localização:** `src/components/AddEventModal.tsx`  
**Problema:** Modal muito grande com lógica complexa  
**Erros de Lint:** 1 erro (`no-case-declarations`)

**Refatoração Necessária:**
- Converter em página dedicada com wizard
- Separar upload de imagens em componente
- Extrair validações de formulário
- Criar componentes para cada tipo de campo

**Componentes a criar:**
- `EventFormWizard.tsx`
- `EventBasicInfoStep.tsx`
- `EventLocationStep.tsx`
- `EventDetailsStep.tsx`
- `useEventFormValidation.ts`

**Estimativa:** 6-8 horas de trabalho

---

#### 4. AdminNews.tsx - **1008 LINHAS** 🔴
**Localização:** `src/components/AdminNews.tsx`  
**Problema:** Gerenciamento de notícias muito extenso  
**Erros de Lint:** 4 erros (1 `prefer-const`, 3 `no-case-declarations`)

**Refatoração Necessária:**
- Separar em múltiplos componentes
- Extrair lógica de filtros
- Criar componente de tabela reutilizável
- Separar modal de edição

**Componentes a criar:**
- `NewsTable.tsx`
- `NewsFilters.tsx`
- `NewsActions.tsx`
- `EditNewsModal.tsx`
- `NewsPreview.tsx`
- `useNewsManagement.ts`

**Estimativa:** 6-8 horas de trabalho

---

#### 5. AdminHarasMap.tsx - **989 LINHAS** 🔴
**Localização:** `src/components/AdminHarasMap.tsx`  
**Refatoração:** Separar mapa, filtros, listagem e detalhes

**Estimativa:** 4-6 horas

---

#### 6. AdminReports.tsx - **929 LINHAS** 🔴
**Localização:** `src/components/AdminReports.tsx`  
**Refatoração:** Separar relatórios, exportação e visualizações

**Estimativa:** 4-6 horas

---

#### 7. AdminFinancial.tsx - **880 LINHAS** 🔴
**Localização:** `src/components/AdminFinancial.tsx`  
**Refatoração:** Separar dashboard financeiro, gráficos e transações

**Estimativa:** 4-6 horas

---

#### 8. AdminTickets.tsx - **856 LINHAS** 🔴
**Localização:** `src/components/AdminTickets.tsx`  
**Erros de Lint:** 4 erros (`any` types)  
**Refatoração:** Separar lista, detalhes e respostas

**Estimativa:** 4-6 horas

---

### Componentes ALTOS (400-800 linhas) - PRIORIDADE ALTA

| Componente | Linhas | Prioridade | Estimativa |
|------------|--------|------------|------------|
| `StatsPage.tsx` | 728 | 🔴 Alta | 6h |
| `AdminDashboard.tsx` | 678 | 🔴 Alta | 4h |
| `AdminMessages.tsx` | 660 | 🔴 Alta | 4h |
| `NotificationsPage.tsx` | 648 | 🔴 Alta | 4h |
| `EventsPage.tsx` (dashboard) | 593 | 🟡 Média | 4h |
| `sidebar.tsx` (ui) | 584 | 🟢 Baixa | - |
| `RankingPage.tsx` | 536 | 🟡 Média | 4h |
| `RegisterForm.tsx` | 490 | 🟡 Média | 3h |
| `EditAnimalModal.tsx` | 488 | 🟡 Média | 3h |
| `AnimalPage.tsx` | 461 | 🟡 Média | 3h |
| `AnimalsPage.tsx` | 455 | 🟡 Média | 3h |
| `EventsPage.tsx` | 445 | 🟡 Média | 3h |
| `DashboardPage.tsx` | 410 | 🟡 Média | 3h |

**Total de Horas Estimadas para Refatoração:** **70-100 horas**

---

## 🗑️ ARQUIVOS DUPLICADOS - REMOÇÃO IMEDIATA

### Arquivos para Deletar

#### Dashboard Pages Duplicadas
1. ❌ `src/pages/dashboard/AddAnimalPageClean.tsx` (229 linhas)
2. ❌ `src/pages/dashboard/AddAnimalPageNew.tsx` (244 linhas)
3. ❌ `src/pages/dashboard/AddAnimalPageOld.tsx` (786 linhas)
4. ❌ `src/pages/dashboard/AddAnimalPageOld2.tsx` (244 linhas)
5. ❌ `src/pages/dashboard/AnimalsPageFixed.tsx` (448 linhas)

**Arquivo Correto a Manter:** `src/pages/dashboard/AddAnimalPage.tsx`

#### Layout Duplicados
6. ❌ `src/components/layout/AppLayoutOld.tsx`
7. ❌ `src/components/layout/CleanAppLayout.tsx`

**Arquivo Correto a Manter:** `src/components/layout/AppLayout.tsx`

### Ação Imediata
```bash
# Remover arquivos duplicados
rm src/pages/dashboard/AddAnimalPageClean.tsx
rm src/pages/dashboard/AddAnimalPageNew.tsx
rm src/pages/dashboard/AddAnimalPageOld.tsx
rm src/pages/dashboard/AddAnimalPageOld2.tsx
rm src/pages/dashboard/AnimalsPageFixed.tsx
rm src/components/layout/AppLayoutOld.tsx
rm src/components/layout/CleanAppLayout.tsx
```

**Economia:** ~2,700 linhas de código duplicado removidas

---

## 🐛 ERROS DE LINT E TYPESCRIPT

### Erros Críticos (27)

#### 1. Uso de `any` Type (23 erros)
**Problema:** Tipo `any` remove a segurança de tipos do TypeScript

**Arquivos Afetados:**
- `AddAnimalModal.tsx` (4 erros)
- `AdminStats.tsx` (3 erros)
- `AdminTickets.tsx` (4 erros)
- `EditUserModal.tsx` (2 erros)
- `NewsSection.tsx` (1 erro)
- `PlanCard.tsx` (1 erro)
- `QuickStatsBar.tsx` (1 erro)
- `StepWizard.tsx` (2 erros)
- `ModernDashboardSidebar.tsx` (2 erros)
- `ModernDashboardWrapper.tsx` (2 erros)
- `breadcrumb.tsx` (1 erro)

**Solução:**
```typescript
// ❌ Errado
const handleChange = (e: any) => {
  setValue(e.target.value);
};

// ✅ Correto
const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  setValue(e.target.value);
};

// ❌ Errado
const data: any = response.data;

// ✅ Correto
interface ResponseData {
  id: string;
  name: string;
  // ...
}
const data: ResponseData = response.data;
```

---

#### 2. Declarações Lexicais em Case Blocks (4 erros)

**Arquivos:**
- `AddEventModal.tsx` (1 erro)
- `AdminNews.tsx` (3 erros)

**Problema:**
```typescript
// ❌ Errado
switch(type) {
  case 'add':
    const newItem = { ...data };
    break;
}

// ✅ Correto
switch(type) {
  case 'add': {
    const newItem = { ...data };
    break;
  }
}
```

---

#### 3. Prefer Const (1 erro)
**Arquivo:** `AdminNews.tsx` (linha 91)

```typescript
// ❌ Errado
let filtered = articles.filter(...);

// ✅ Correto
const filtered = articles.filter(...);
```

---

### Warnings (14)

#### React Hooks - Exhaustive Deps (6 warnings)
**Arquivos:**
- `FeaturedCarousel.tsx`
- `MostViewedCarousel.tsx`
- `MostViewedThisMonthCarousel.tsx` (2 warnings)
- `RecentlyPublishedCarousel.tsx`
- `LazyImage.tsx`

**Solução:**
```typescript
// Adicionar dependências faltantes ou usar useCallback
useEffect(() => {
  // código
}, [/* adicionar todas as dependências */]);
```

---

#### Fast Refresh - Only Export Components (8 warnings)
**Arquivos:**
- `DashboardSidebar.tsx`
- `form.tsx`
- `navigation-menu.tsx`
- `sidebar.tsx`
- `sonner.tsx`
- `AuthContext.tsx`
- `ChatContext.tsx`
- `FavoritesContext.tsx`

**Solução:** Mover constantes e funções para arquivos separados

---

## 🎨 ANÁLISE DE RESPONSIVIDADE

### Breakpoints Implementados
```typescript
// Mobile: < 768px
const MOBILE_BREAKPOINT = 768;

// Tablet: 768px - 1024px
// Desktop: > 1024px
```

### Status de Responsividade por Página

#### ✅ Páginas Totalmente Responsivas
- Index (Homepage)
- Login
- MapPage
- NewsPage
- ArticlePage
- AddAnimalPage
- FavoritosPage
- PlansPage

#### ⚠️ Páginas com Problemas Menores
- AnimalPage (tabelas não responsivas)
- HarasPage (sidebar fixa em mobile)
- RankingPage (filtros ocupam muito espaço)
- DashboardPage (cards muito grandes)
- MessagesPage (chat não otimizado para mobile)
- SettingsPage (formulários longos)

#### ❌ Páginas com Problemas Críticos
- **AdminPage** - Dashboard não funciona bem em mobile
- **StatsPage** - Gráficos quebram em telas pequenas
- **NotificationsPage** - Lista muito densa
- **EventsPage** (dashboard) - Tabela não adaptável
- **AnimalsPage** - Grid não se ajusta corretamente

### Melhorias Necessárias

#### 1. Tabelas Responsivas
```typescript
// Converter tabelas em cards em mobile
<div className="hidden md:block">
  <Table>...</Table>
</div>
<div className="block md:hidden">
  <CardList>...</CardList>
</div>
```

#### 2. Sidebar Mobile
```typescript
// Implementar sidebar mobile colapsável
const [sidebarOpen, setSidebarOpen] = useState(false);

// Mobile: drawer overlay
// Desktop: sidebar fixa
```

#### 3. Touch Targets
```css
/* Todos os botões devem ter min 44px */
.button {
  min-height: 44px;
  min-width: 44px;
}
```

---

## 🔐 ANÁLISE DO SISTEMA DE AUTENTICAÇÃO

### Contextos

#### AuthContext.tsx (✅ Funcionando)
**Localização:** `src/contexts/AuthContext.tsx`  
**Linhas:** 250  
**Status:** OK - mas usando dados mock

**Funcionalidades:**
- ✅ Login
- ✅ Logout
- ✅ Registro
- ✅ Verificação de suspensão
- ✅ Persistência (localStorage)
- ✅ Tipos de conta (personal/institutional)
- ✅ Planos (basic/pro/ultra)
- ✅ Role de admin

**Preparação para Supabase:**
```typescript
// Atual: Mock
const mockUsers = [ /* ... */ ];

// Futuro: Supabase
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(url, key);

const login = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  // ...
};
```

**Migrations Necessárias:**
- Tabela `users`
- Tabela `profiles`
- Tabela `suspensions`
- RLS (Row Level Security) policies

---

#### ChatContext.tsx (✅ Funcionando)
**Localização:** `src/contexts/ChatContext.tsx`  
**Linhas:** 247  
**Status:** OK - mas usando dados mock

**Funcionalidades:**
- ✅ Conversas por animal
- ✅ Conversas por haras
- ✅ Conversas temporárias
- ✅ Mensagens em tempo real (simulado)
- ✅ Contagem de não lidas
- ✅ Marcar como lido

**Preparação para Supabase:**
- Usar Supabase Realtime para mensagens
- Tabelas: `conversations`, `messages`
- Subscriptions para atualizações em tempo real

---

#### FavoritesContext.tsx (✅ Funcionando)
**Localização:** `src/contexts/FavoritesContext.tsx`  
**Linhas:** 188  
**Status:** OK

**Funcionalidades:**
- ✅ Adicionar favoritos
- ✅ Remover favoritos
- ✅ Toggle favorito
- ✅ Verificar se é favorito
- ✅ Toast notifications

**Preparação para Supabase:**
- Tabela `favorites` com user_id e animal_id
- RLS policies por usuário

---

### Hooks Customizados

#### Hooks de Autenticação
- ✅ `useLogin.ts` - Lógica de login
- ✅ `useRegister.ts` - Lógica de registro
- ✅ `useSuspensionCheck.ts` - Verificação de suspensão
- ✅ `useViewPermissions.tsx` - Permissões de visualização

#### Hooks de Dados
- ✅ `useAnimalViews.ts` - Visualizações de animais
- ✅ `useArticleViews.ts` - Visualizações de artigos
- ✅ `useArticleInteractions.ts` - Interações com artigos
- ✅ `useMonthlyStats.ts` - Estatísticas mensais
- ✅ `useUserStats.ts` - Estatísticas de usuário

#### Hooks de UI
- ✅ `use-toast.ts` - Sistema de toast
- ✅ `use-mobile.tsx` - Detecção mobile
- ✅ `useLazySection.ts` - Lazy loading de seções

#### Hooks de Formulários
- ✅ `useFormValidation.ts` - Validação de formulários

#### Hooks de Funcionalidades
- ✅ `useBoostManager.ts` - Gerenciamento de boosts
- ✅ `usePlansData.ts` - Dados de planos
- ✅ `useScheduledPublishing.ts` - Publicação agendada

**Status Geral:** Todos funcionando, mas dependem de dados mock

---

## 📊 ESTRUTURA DE DADOS MOCK

### Arquivos de Dados

#### 1. mockData.ts
**Localização:** `src/data/mockData.ts`  
**Conteúdo:**
- `mockHorses` - Array de cavalos
- `mockHaras` - Array de haras
- Estrutura completa de dados de animais

**Campos Importantes para Migration:**
```typescript
interface Horse {
  id: string;
  name: string;
  breed: string;
  gender: string;
  birthDate: string;
  coat: string;
  height: number;
  weight: number;
  pedigree: {
    father: string;
    mother: string;
    paternalGrandfather: string;
    // ...
  };
  currentLocation: {
    harasId: string;
    city: string;
    state: string;
  };
  owner: {
    id: string;
    name: string;
  };
  media: {
    photos: string[];
    videos: string[];
  };
  // ...
}
```

#### 2. adminData.ts
**Conteúdo:**
- Dados de usuários para admin
- Dados financeiros
- Estatísticas do sistema
- Tickets de suporte

#### 3. articlesData.ts
**Conteúdo:**
- Artigos/Notícias
- Categorias
- Tags
- Autores

#### 4. eventsData.ts
**Conteúdo:**
- Eventos
- Tipos de eventos
- Localizações
- Participantes

#### 5. chatData.ts
**Conteúdo:**
- Conversas
- Mensagens
- Status de leitura

---

## 🗄️ SCHEMA DO BANCO DE DADOS SUPABASE (PREPARAÇÃO)

### Tabelas Principais

```sql
-- Users / Profiles
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  account_type TEXT CHECK (account_type IN ('personal', 'institutional')),
  property_name TEXT,
  property_type TEXT,
  property_id TEXT,
  public_code TEXT UNIQUE,
  plan TEXT CHECK (plan IN ('basic', 'pro', 'ultra')),
  role TEXT CHECK (role IN ('user', 'admin')),
  avatar_url TEXT,
  institution_logo_url TEXT,
  cpf TEXT UNIQUE,
  phone TEXT,
  available_boosts INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Suspensions
CREATE TABLE suspensions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  email TEXT,
  cpf TEXT,
  reason TEXT NOT NULL,
  suspended_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  suspended_until TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE
);

-- Animals
CREATE TABLE animals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  breed TEXT NOT NULL,
  gender TEXT NOT NULL,
  birth_date DATE NOT NULL,
  coat TEXT,
  height DECIMAL,
  weight DECIMAL,
  registration_number TEXT UNIQUE,
  owner_id UUID REFERENCES profiles(id),
  haras_id UUID REFERENCES haras(id),
  status TEXT DEFAULT 'active',
  featured BOOLEAN DEFAULT FALSE,
  boost_until TIMESTAMP WITH TIME ZONE,
  views_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pedigree
CREATE TABLE pedigrees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  animal_id UUID REFERENCES animals(id) UNIQUE,
  father_id UUID REFERENCES animals(id),
  mother_id UUID REFERENCES animals(id),
  paternal_grandfather_id UUID REFERENCES animals(id),
  paternal_grandmother_id UUID REFERENCES animals(id),
  maternal_grandfather_id UUID REFERENCES animals(id),
  maternal_grandmother_id UUID REFERENCES animals(id)
);

-- Animal Media
CREATE TABLE animal_media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  animal_id UUID REFERENCES animals(id),
  type TEXT CHECK (type IN ('photo', 'video')),
  url TEXT NOT NULL,
  order_index INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Haras
CREATE TABLE haras (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  owner_id UUID REFERENCES profiles(id),
  description TEXT,
  city TEXT,
  state TEXT,
  latitude DECIMAL,
  longitude DECIMAL,
  verified BOOLEAN DEFAULT FALSE,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Favorites
CREATE TABLE favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  animal_id UUID REFERENCES animals(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, animal_id)
);

-- Conversations
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  animal_id UUID REFERENCES animals(id),
  animal_owner_id UUID REFERENCES profiles(id),
  interested_user_id UUID REFERENCES profiles(id),
  is_temporary BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id),
  sender_id UUID REFERENCES profiles(id),
  content TEXT NOT NULL,
  type TEXT DEFAULT 'text',
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Articles / News
CREATE TABLE articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  author_id UUID REFERENCES profiles(id),
  category TEXT,
  tags TEXT[],
  cover_image_url TEXT,
  published_at TIMESTAMP WITH TIME ZONE,
  views_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Events
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE,
  location TEXT,
  city TEXT,
  state TEXT,
  organizer_id UUID REFERENCES profiles(id),
  cover_image_url TEXT,
  max_participants INTEGER,
  registration_deadline TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Views (para analytics)
CREATE TABLE animal_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  animal_id UUID REFERENCES animals(id),
  user_id UUID REFERENCES profiles(id),
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE article_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  article_id UUID REFERENCES articles(id),
  user_id UUID REFERENCES profiles(id),
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 📋 FASES DE IMPLEMENTAÇÃO PRÉ-SUPABASE

### **FASE 1: LIMPEZA E ORGANIZAÇÃO (1-2 dias)**
**Prioridade:** 🔴 CRÍTICA

#### 1.1 Remover Arquivos Duplicados
- [ ] Deletar 7 arquivos duplicados identificados
- [ ] Verificar imports e corrigir referências quebradas
- [ ] Executar build para confirmar

#### 1.2 Corrigir Erros de Lint
- [ ] Substituir todos os tipos `any` por tipos adequados (27 erros)
- [ ] Corrigir declarações lexicais em case blocks (4 erros)
- [ ] Corrigir `prefer-const` (1 erro)
- [ ] Executar `npm run lint` até 0 erros

#### 1.3 Resolver Warnings
- [ ] Corrigir dependências de useEffect (6 warnings)
- [ ] Mover constantes para arquivos separados (8 warnings)

**Resultado Esperado:** Código limpo, sem erros, sem duplicação

---

### **FASE 2: REFATORAÇÃO DE COMPONENTES GIGANTES (1-2 semanas)**
**Prioridade:** 🔴 ALTA

#### 2.1 Refatorar Componentes Admin (Prioridade 1)
- [ ] AdminStats.tsx (2176 → ~200 linhas cada)
- [ ] AdminNews.tsx (1008 → ~200 linhas cada)
- [ ] AdminHarasMap.tsx (989 → ~200 linhas cada)
- [ ] AdminReports.tsx (929 → ~200 linhas cada)
- [ ] AdminFinancial.tsx (880 → ~200 linhas cada)
- [ ] AdminTickets.tsx (856 → ~200 linhas cada)
- [ ] AdminDashboard.tsx (678 → ~200 linhas cada)
- [ ] AdminMessages.tsx (660 → ~200 linhas cada)

#### 2.2 Refatorar Modais (Prioridade 1)
- [ ] AddAnimalModal.tsx (1261 → converter em wizard)
- [ ] AddEventModal.tsx (1148 → converter em wizard)
- [ ] EditAnimalModal.tsx (488 → separar seções)

#### 2.3 Refatorar Páginas (Prioridade 2)
- [ ] StatsPage.tsx (728 linhas)
- [ ] NotificationsPage.tsx (648 linhas)
- [ ] EventsPage.tsx (593 linhas)
- [ ] RankingPage.tsx (536 linhas)
- [ ] RegisterForm.tsx (490 linhas)
- [ ] AnimalPage.tsx (461 linhas)
- [ ] AnimalsPage.tsx (455 linhas)

**Resultado Esperado:** Componentes com máximo de 300 linhas

---

### **FASE 3: MELHORIAS DE RESPONSIVIDADE (3-5 dias)**
**Prioridade:** 🟡 MÉDIA

#### 3.1 Páginas Admin
- [ ] AdminPage - criar versão mobile
- [ ] StatsPage - gráficos responsivos
- [ ] NotificationsPage - cards mobile

#### 3.2 Páginas Dashboard
- [ ] DashboardPage - grid responsivo
- [ ] AnimalsPage - cards em mobile
- [ ] EventsPage - lista mobile

#### 3.3 Componentes Gerais
- [ ] Tabelas → Cards em mobile
- [ ] Sidebar → Drawer em mobile
- [ ] Filtros → Bottom sheet em mobile
- [ ] Touch targets de 44px mínimo

**Resultado Esperado:** 100% responsivo em todas as telas

---

### **FASE 4: PREPARAÇÃO DE ESTRUTURAS DE DADOS (2-3 dias)**
**Prioridade:** 🟡 MÉDIA

#### 4.1 Criar Interfaces TypeScript
- [ ] Criar `src/types/database.types.ts`
- [ ] Definir interfaces para todas as tabelas
- [ ] Criar tipos de retorno de API
- [ ] Documentar estruturas

#### 4.2 Criar Migrations SQL
- [ ] Criar pasta `supabase/migrations/`
- [ ] Escrever migrations para todas as tabelas
- [ ] Definir índices e foreign keys
- [ ] Criar triggers para updated_at

#### 4.3 Definir Row Level Security (RLS)
- [ ] Policies para `profiles`
- [ ] Policies para `animals`
- [ ] Policies para `favorites`
- [ ] Policies para `messages`
- [ ] Policies para admin

**Resultado Esperado:** Schema completo e seguro

---

### **FASE 5: CRIAR CAMADA DE SERVIÇOS (3-4 dias)**
**Prioridade:** 🟡 MÉDIA

#### 5.1 Criar Estrutura de Serviços
```
src/services/
  ├── supabase/
  │   ├── client.ts
  │   └── config.ts
  ├── auth/
  │   ├── authService.ts
  │   └── types.ts
  ├── animals/
  │   ├── animalService.ts
  │   └── types.ts
  ├── chat/
  │   ├── chatService.ts
  │   └── types.ts
  ├── favorites/
  │   ├── favoritesService.ts
  │   └── types.ts
  └── ...
```

#### 5.2 Implementar Serviços
- [ ] Auth Service
- [ ] Animal Service
- [ ] Haras Service
- [ ] Chat Service
- [ ] Favorites Service
- [ ] Events Service
- [ ] Articles Service

#### 5.3 Criar Hooks de Integração
- [ ] `useSupabaseAuth.ts`
- [ ] `useAnimals.ts`
- [ ] `useChat.ts`
- [ ] `useFavorites.ts`

**Resultado Esperado:** Camada de abstração pronta

---

### **FASE 6: TESTES E VALIDAÇÃO (2-3 dias)**
**Prioridade:** 🟢 BAIXA (mas importante)

#### 6.1 Testes Unitários
- [ ] Testar serviços
- [ ] Testar hooks customizados
- [ ] Testar utils

#### 6.2 Testes de Integração
- [ ] Testar fluxo de autenticação
- [ ] Testar CRUD de animais
- [ ] Testar chat
- [ ] Testar favoritos

#### 6.3 Testes E2E
- [ ] Fluxo completo de registro
- [ ] Fluxo completo de criação de animal
- [ ] Fluxo completo de mensagens

**Resultado Esperado:** Cobertura de testes >70%

---

### **FASE 7: DOCUMENTAÇÃO (1-2 dias)**
**Prioridade:** 🟢 BAIXA

#### 7.1 Documentar Estrutura
- [ ] README atualizado
- [ ] Guia de setup do Supabase
- [ ] Documentação de serviços
- [ ] Exemplos de uso

#### 7.2 Documentar APIs
- [ ] Endpoints do Supabase
- [ ] Queries e mutations
- [ ] Tipos de dados

**Resultado Esperado:** Documentação completa

---

## ⏱️ CRONOGRAMA TOTAL

| Fase | Duração | Prioridade | Status |
|------|---------|------------|--------|
| Fase 1: Limpeza | 1-2 dias | 🔴 Crítica | ⏳ Pendente |
| Fase 2: Refatoração | 1-2 semanas | 🔴 Alta | ⏳ Pendente |
| Fase 3: Responsividade | 3-5 dias | 🟡 Média | ⏳ Pendente |
| Fase 4: Estruturas de Dados | 2-3 dias | 🟡 Média | ⏳ Pendente |
| Fase 5: Camada de Serviços | 3-4 dias | 🟡 Média | ⏳ Pendente |
| Fase 6: Testes | 2-3 dias | 🟢 Baixa | ⏳ Pendente |
| Fase 7: Documentação | 1-2 dias | 🟢 Baixa | ⏳ Pendente |

**TOTAL ESTIMADO:** 3-4 semanas de trabalho

---

## 🎯 PRÓXIMOS PASSOS IMEDIATOS

### Ação Imediata (Hoje)
1. ✅ Revisar esta análise completa
2. ❌ Aprovar o plano de ação
3. ❌ Começar Fase 1: Limpeza
   - Deletar arquivos duplicados
   - Corrigir erros de lint

### Esta Semana
1. ❌ Completar Fase 1
2. ❌ Iniciar Fase 2 (refatoração dos componentes maiores)

### Próximas 2 Semanas
1. ❌ Completar Fase 2
2. ❌ Completar Fase 3 (responsividade)

### Próximo Mês
1. ❌ Completar Fases 4-7
2. ❌ Iniciar integração com Supabase

---

## 📊 MÉTRICAS DO SISTEMA

### Tamanho do Código
- **Total de Arquivos TypeScript:** ~139 arquivos .tsx
- **Total de Linhas (estimado):** ~35,000 linhas
- **Linhas Duplicadas:** ~2,700 linhas (para remover)
- **Componentes Grandes (>400 linhas):** 20 componentes
- **Componentes OK (<300 linhas):** ~119 componentes

### Qualidade do Código
- **Erros de Lint:** 27 erros
- **Warnings:** 14 warnings
- **Uso de TypeScript:** ✅ Sim (mas com `any`)
- **Cobertura de Testes:** ❌ Mínima
- **Documentação:** ⚠️ Parcial

### Performance
- **Bundle Size:** Não otimizado
- **Lazy Loading:** ✅ Implementado parcialmente
- **Code Splitting:** ⚠️ Pode melhorar
- **Imagens:** ✅ Lazy loading implementado

### Responsividade
- **Mobile:** ⚠️ 60% responsivo
- **Tablet:** ⚠️ 70% responsivo
- **Desktop:** ✅ 100% funcional

---

## 🔧 FERRAMENTAS E DEPENDÊNCIAS

### Principais Dependências
```json
{
  "react": "^18.3.1",
  "react-router-dom": "^6.30.1",
  "@tanstack/react-query": "^5.83.0",
  "zod": "^3.25.76",
  "react-hook-form": "^7.61.1",
  "tailwindcss": "^3.4.17"
}
```

### Dependências Necessárias para Supabase
```bash
npm install @supabase/supabase-js
npm install @supabase/auth-helpers-react  # opcional
```

### Scripts Úteis
```json
{
  "dev": "vite",
  "build": "vite build",
  "lint": "eslint .",
  "test": "vitest",
  "test:ui": "vitest --ui"
}
```

---

## 📝 NOTAS FINAIS

### Pontos Fortes do Sistema Atual
✅ Estrutura bem organizada (páginas, componentes, hooks, contextos)  
✅ Uso de TypeScript  
✅ Componentes reutilizáveis (shadcn/ui)  
✅ Sistema de roteamento completo  
✅ Contextos funcionais  
✅ Hooks customizados úteis  
✅ Design system consistente  
✅ Lazy loading implementado  

### Áreas de Melhoria
⚠️ Componentes muito grandes (precisa refatoração)  
⚠️ Código duplicado (precisa limpeza)  
⚠️ Erros de lint (precisa correção)  
⚠️ Responsividade incompleta (precisa melhorias)  
⚠️ Falta de testes (precisa implementação)  
⚠️ Performance não otimizada (precisa otimização)  
⚠️ Documentação incompleta (precisa expansão)  

### Recomendações Gerais

1. **PRIORIZE A FASE 1** - Limpeza é essencial antes de qualquer refatoração
2. **REFATORE GRADUALMENTE** - Não tente refatorar tudo de uma vez
3. **TESTE CONTINUAMENTE** - Cada refatoração deve ser testada
4. **DOCUMENTE ENQUANTO CODIFICA** - Não deixe para depois
5. **USE BRANCHES** - Crie branches para cada fase
6. **FAÇA COMMITS PEQUENOS** - Facilita rollback se necessário
7. **REVISE O CÓDIGO** - Peça para alguém revisar as refatorações grandes

---

## 🎓 CONCLUSÃO

O sistema está em **BOM ESTADO** para um projeto em desenvolvimento. A estrutura é sólida e bem organizada. Porém, **É ESSENCIAL** realizar as refatorações identificadas antes de integrar com o Supabase.

**A integração com Supabase será MUITO MAIS FÁCIL** após:
- Componentes menores e focados
- Código limpo e sem duplicações
- Erros de lint corrigidos
- Responsividade completa
- Camada de serviços bem definida

**TEMPO TOTAL ESTIMADO:** 3-4 semanas de trabalho focado.

**GANHO:** Sistema robusto, escalável, manutenível e pronto para produção.

---

**Documento Criado em:** 30 de Setembro de 2025  
**Autor:** Análise Automatizada do Sistema  
**Versão:** 1.0  
**Última Atualização:** 30/09/2025

---

