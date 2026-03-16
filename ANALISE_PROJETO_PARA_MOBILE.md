# 📱 ANÁLISE COMPLETA DO PROJETO - MIGRAÇÃO PARA APLICATIVO MOBILE

## 📋 SUMÁRIO EXECUTIVO

Este documento apresenta uma análise completa do projeto **Cavalaria Digital** para facilitar a migração de uma aplicação web (React) para aplicativos mobile (iOS e Android), mantendo todas as funcionalidades e utilizando o mesmo backend Supabase.

---

## 🎯 RESPOSTA RÁPIDA: iOS E ANDROID

### ✅ **UM ÚNICO APLICATIVO PARA AMBOS OS PLATAFORMAS**

**Recomendação:** Use **React Native** ou **Expo** para criar **um único aplicativo** que funciona nativamente em iOS e Android.

**Por quê?**
- ✅ **Código compartilhado**: ~90% do código é o mesmo para ambas plataformas
- ✅ **Manutenção simplificada**: Uma única base de código
- ✅ **Mesmo Supabase**: A mesma configuração funciona em ambas plataformas
- ✅ **Performance nativa**: React Native compila para código nativo
- ✅ **Acesso a APIs nativas**: Câmera, notificações push, geolocalização, etc.

**Alternativas:**
- **Flutter** (Dart) - Também funciona para iOS e Android, mas requer reescrever toda a lógica
- **Ionic/Capacitor** - WebView, menos performance nativa
- **Native (Swift + Kotlin)** - Dois projetos separados, muito mais trabalho

**Conclusão:** Com React Native/Expo, você terá **um projeto** que gera **dois aplicativos** (um .ipa para iOS e um .apk/.aab para Android).

---

## 🏗️ ARQUITETURA ATUAL DO PROJETO

### **Stack Tecnológica**

```
Frontend Web:
├── React 18.3.1
├── TypeScript 5.8.3
├── Vite 7.1.8 (Build tool)
├── React Router DOM 6.30.1 (Roteamento)
├── TanStack Query 5.83.0 (Gerenciamento de estado servidor)
├── Tailwind CSS 3.4.17 (Estilização)
├── shadcn/ui (Componentes UI baseados em Radix UI)
├── Framer Motion 12.23.24 (Animações)
└── Supabase JS 2.75.0 (Backend/BaaS)
```

### **Estrutura de Diretórios**

```
cavalaria-digital-showcase/
├── src/
│   ├── api/                    # APIs e uploads
│   ├── assets/                 # Imagens estáticas
│   ├── components/             # 251 componentes React
│   │   ├── admin/              # Componentes administrativos
│   │   ├── animal/             # Componentes de animais
│   │   ├── auth/               # Autenticação
│   │   ├── chat/               # Sistema de mensagens
│   │   ├── dashboard/          # Dashboard do usuário
│   │   ├── events/             # Eventos
│   │   ├── layout/             # Layouts (Header, Sidebar, etc.)
│   │   ├── payment/             # Pagamentos (Asaas)
│   │   └── ui/                  # Componentes UI reutilizáveis
│   ├── config/                 # Configurações
│   ├── constants/              # Constantes (planos, raças, cidades)
│   ├── contexts/               # Context API (Auth, Chat, Favorites)
│   ├── data/                   # Dados mockados (dev/test)
│   ├── hooks/                  # 48 custom hooks
│   ├── integrations/
│   │   └── supabase/           # Tipos TypeScript do Supabase
│   ├── lib/                    # Bibliotecas auxiliares
│   │   ├── supabase.ts         # Cliente Supabase configurado
│   │   └── utils.ts            # Funções utilitárias
│   ├── pages/                  # Páginas/rotas da aplicação
│   ├── services/               # 35 serviços (lógica de negócio)
│   ├── types/                  # Tipos TypeScript
│   └── utils/                  # Utilitários diversos
├── supabase/                   # Configuração Supabase local
├── supabase_migrations/        # Migrações SQL do banco
└── public/                     # Arquivos estáticos
```

---

## 🗺️ MAPEAMENTO COMPLETO DE ROTAS

### **Rotas Públicas (Sem Autenticação)**

| Rota | Componente | Descrição |
|------|------------|-----------|
| `/` | `Index.tsx` | Página inicial (homepage) |
| `/login` | `LoginPage.tsx` | Login de usuários |
| `/register` | `RegisterPage.tsx` | Cadastro de novos usuários |
| `/animal/:id` | `AnimalPage.tsx` | Detalhes de um animal específico |
| `/haras/:id` | `HarasPage.tsx` | Perfil público de um haras/fazenda |
| `/profile/:publicCode` | `ProfilePage.tsx` | Perfil público de usuário |
| `/buscar` | `RankingPage.tsx` | Busca de animais (sem filtro) |
| `/buscar/:breed` | `RankingPage.tsx` | Busca de animais por raça |
| `/ranking` | `RankingHistoryPage.tsx` | Histórico de rankings mensais |
| `/noticias` | `NewsPage.tsx` | Lista de notícias/artigos |
| `/noticias/:slug` | `ArticlePage.tsx` | Artigo individual |
| `/eventos` | `EventsPage.tsx` | Lista de eventos |
| `/eventos/:id` | `EventDetailsPage.tsx` | Detalhes de um evento |
| `/planos` | `PlansPage.tsx` | Página de planos de assinatura |
| `/terms` | `TermsPage.tsx` | Termos de uso |
| `/privacy` | `PrivacyPage.tsx` | Política de privacidade |
| `/contact` | `ContactPage.tsx` | Página de contato |
| `/:propertyName/:code` | `ShortHarasRedirect.tsx` | URL curta para haras |
| `/ajuda` | `HelpPage.tsx` | Página de ajuda (pública) |

### **Rotas Protegidas (Requer Autenticação)**

| Rota | Componente | Descrição |
|------|------------|-----------|
| `/dashboard` | `DashboardPage.tsx` | Dashboard principal do usuário |
| `/dashboard/animals` | `AnimalsPage.tsx` | Lista de animais do usuário |
| `/dashboard/edit-animal/:id` | `EditAnimalPage.tsx` | Editar animal existente |
| `/dashboard/events` | `DashboardEventsPage.tsx` | Eventos do usuário |
| `/dashboard/messages` | `MessagesPage.tsx` | Sistema de mensagens |
| `/dashboard/stats` | `StatsPage.tsx` | Estatísticas do usuário |
| `/dashboard/notifications` | `NotificationsPage.tsx` | Notificações |
| `/dashboard/settings` | `SettingsPage.tsx` | Configurações gerais |
| `/dashboard/settings/profile` | `UpdateProfilePage.tsx` | Editar perfil |
| `/dashboard/favoritos` | `FavoritosPage.tsx` | Animais favoritados |
| `/dashboard/help` | `HelpPage.tsx` | Ajuda (versão autenticada) |
| `/dashboard/society` | `SocietyPage.tsx` | Gerenciar sociedades/parcerias |
| `/dashboard/upgrade-institutional` | `UpgradeToInstitutionalPage.tsx` | Upgrade para conta institucional |
| `/publicar-animal` | `PublishAnimalPage.tsx` | Publicar novo animal |
| `/publicar/:draftId` | `PublishDraftPage.tsx` | Publicar rascunho salvo |
| `/checkout` | `CheckoutPage.tsx` | Checkout de pagamento |

### **Rotas Administrativas (Requer Role: admin)**

| Rota | Componente | Descrição |
|------|------------|-----------|
| `/admin` | `AdminPage.tsx` | Painel administrativo principal |

**Seções do Admin (via query params `?section=...`):**
- `dashboard` - Dashboard administrativo
- `users` - Gerenciamento de usuários
- `plans` - Gerenciamento de planos
- `news` - Gerenciamento de notícias
- `monetization` - Monetização
- `reports` - Relatórios e denúncias
- `stats` - Estatísticas gerais
- `tickets` - Tickets de suporte
- `financial` - Financeiro
- `messages` - Mensagens do sistema
- `haras` - Mapa de haras
- `chat` - Chat administrativo
- `sponsors` - Patrocinadores
- `society` - Sociedades
- `subscriptions` - Assinaturas

### **Rotas de Teste/Desenvolvimento**

| Rota | Componente | Descrição |
|------|------------|-----------|
| `/test-upload` | `TestUploadPage.tsx` | Teste de upload de imagens |

---

## 🔌 INTEGRAÇÃO COM SUPABASE

### **Configuração Atual**

**Arquivo:** `src/lib/supabase.ts`

```typescript
// Variáveis de ambiente necessárias:
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-key
```

**Cliente Supabase configurado com:**
- ✅ Auto-refresh de tokens
- ✅ Persistência de sessão
- ✅ PKCE flow para OAuth seguro
- ✅ Realtime habilitado (10 eventos/segundo)
- ✅ Headers customizados (`X-Client-Info: cavalaria-digital-web`)

### **Tabelas Principais do Banco de Dados**

#### **👥 Usuários e Autenticação**
- `profiles` - Perfis de usuários (estende `auth.users`)
- `suspensions` - Histórico de suspensões

#### **🐎 Animais e Conteúdo**
- `animals` - Animais cadastrados
- `animal_media` - Fotos e vídeos dos animais
- `animal_drafts` - Rascunhos de animais
- `animal_partnerships` - Sociedades entre usuários
- `animal_titles` - Títulos dos animais

#### **📰 Conteúdo Editorial**
- `articles` - Notícias e artigos
- `events` - Eventos

#### **💬 Comunicação**
- `conversations` - Conversas entre usuários
- `messages` - Mensagens das conversas
- `favorites` - Animais favoritados

#### **💰 Financeiro e Pagamentos**
- `transactions` - Transações financeiras
- `boost_history` - Histórico de impulsionamentos
- `asaas_customers` - Clientes no Asaas
- `asaas_subscriptions` - Assinaturas (mensal/anual)
- `asaas_payments` - Cobranças individuais
- `refunds` - Solicitações de reembolso
- `payment_audit_log` - Auditoria LGPD

#### **📊 Analytics e Métricas**
- `impressions` - Visualizações (quando aparece na tela)
- `clicks` - Cliques (quando usuário interage)
- `page_visits` - Visitas de páginas

#### **🎫 Suporte e Administração**
- `tickets` - Tickets de suporte
- `reports` - Denúncias de conteúdo
- `admin_audit_log` - Log de auditoria administrativa

#### **📦 Storage Buckets (Supabase Storage)**
- `animal-images` - Imagens de animais
- `event-images` - Imagens de eventos
- `avatars` - Avatares de usuários
- `institution-logos` - Logos de instituições

### **Row Level Security (RLS)**

Todas as tabelas têm **RLS habilitado** com políticas específicas:
- ✅ Usuários veem/editam apenas seus próprios dados
- ✅ Sócios compartilham acesso aos animais em parceria
- ✅ Admins têm acesso completo (exceto dados sensíveis)
- ✅ Visitantes veem apenas conteúdo público ativo

---

## 🔧 SERVIÇOS E FUNCIONALIDADES PRINCIPAIS

### **Serviços de Autenticação**
- `authService.ts` - Login, registro, logout, refresh de sessão

### **Serviços de Animais**
- `animalService.ts` - CRUD de animais, busca, filtros
- `animalImageService.ts` - Upload e gerenciamento de imagens
- `animalTitlesService.ts` - Gerenciamento de títulos
- `draftsService.ts` - Rascunhos de animais

### **Serviços de Pagamento**
- `paymentService.ts` - Orquestrador principal de pagamentos
- `asaasService.ts` - Comunicação direta com API Asaas
- `asaasWebhookService.ts` - Processamento de webhooks
- `checkoutService.ts` - Processamento de checkout
- `planService.ts` - Gerenciamento de planos

### **Serviços de Comunicação**
- `messageService.ts` - Sistema de mensagens
- `favoritesService.ts` - Favoritos

### **Serviços de Conteúdo**
- `newsService.ts` - Notícias e artigos
- `eventService.ts` - Eventos
- `eventLimitsService.ts` - Limites de eventos por plano

### **Serviços de Analytics**
- `analyticsService.ts` - Analytics geral
- `pageVisitService.ts` - Rastreamento de visitas

### **Serviços Administrativos**
- `adminAuditService.ts` - Auditoria administrativa
- `adminSecurityService.ts` - Segurança administrativa
- `reportService.ts` - Denúncias
- `ticketService.ts` - Tickets de suporte

### **Serviços de Storage**
- `StorageService.ts` - Upload de arquivos (versão antiga)
- `storageServiceV2.ts` - Upload de arquivos (versão atual)

### **Serviços Auxiliares**
- `cepService.ts` - Busca de CEP (ViaCEP)
- `ibgeService.ts` - Dados do IBGE
- `boostService.ts` - Sistema de boosts
- `monetizationService.ts` - Monetização
- `partnershipService.ts` - Parcerias
- `sponsorService.ts` - Patrocinadores
- `newsletterService.ts` - Newsletter
- `newsSchedulerService.ts` - Agendamento de notícias
- `rateLimitingService.ts` - Rate limiting
- `resilientRequestService.ts` - Requisições resilientes
- `sessionService.ts` - Gerenciamento de sessão

---

## 🌐 INTEGRAÇÕES EXTERNAS

### **1. Supabase (Backend Principal)**
- **URL:** Configurada via `VITE_SUPABASE_URL`
- **Uso:** Autenticação, banco de dados, storage, realtime
- **Status:** ✅ Totalmente integrado

### **2. Asaas.com (Pagamentos)**
- **API:** REST API do Asaas
- **Variáveis de ambiente:**
  - `VITE_ASAAS_API_KEY` - Chave da API
  - `VITE_ASAAS_ENVIRONMENT` - `sandbox` ou `production`
  - `VITE_ASAAS_WEBHOOK_URL` - URL do webhook (opcional)
- **Funcionalidades:**
  - ✅ Assinaturas mensais (recorrentes)
  - ✅ Planos anuais (pagamento único, parcelável)
  - ✅ Boosts avulsos
  - ✅ Anúncios individuais (R$ 14,90)
  - ✅ Eventos individuais (R$ 49,90)
  - ✅ Reembolsos (até 7 dias)
- **Status:** ✅ Totalmente integrado

### **3. Mapbox (Mapas)**
- **API:** Mapbox GL JS
- **Variável de ambiente:** `VITE_MAPBOX_ACCESS_TOKEN`
- **Uso:** Mapa da comunidade (exibe usuários no mapa mundial)
- **Status:** ✅ Integrado

### **4. ViaCEP (Busca de CEP)**
- **API:** https://viacep.com.br
- **Uso:** Busca automática de endereço por CEP
- **Status:** ✅ Integrado

### **5. IBGE (Dados Geográficos)**
- **API:** https://servicodados.ibge.gov.br
- **Uso:** Dados de cidades e estados brasileiros
- **Status:** ✅ Integrado

### **6. Vercel Analytics**
- **Uso:** Analytics de performance e visitas
- **Status:** ✅ Integrado

---

## 🎨 COMPONENTES PRINCIPAIS

### **Componentes de Layout**
- `AppLayout.tsx` - Layout principal da aplicação
- `Header.tsx` - Cabeçalho com navegação
- `DashboardSidebar.tsx` - Sidebar do dashboard
- `AdminSidebar.tsx` - Sidebar administrativa
- `ModernDashboardSidebar.tsx` - Sidebar moderna do dashboard

### **Componentes de Autenticação**
- `LoginForm.tsx` - Formulário de login
- `RegisterForm.tsx` - Formulário de registro
- `ProtectedRoute.tsx` - Rota protegida
- `AdminProtectedRoute.tsx` - Rota administrativa

### **Componentes de Animais**
- `AnimalCard.tsx` - Card de animal
- `AnimalFilters.tsx` - Filtros de busca
- `AnimalStats.tsx` - Estatísticas do animal
- `PhotoGallery.tsx` - Galeria de fotos
- `PedigreeChart.tsx` - Árvore genealógica
- `AddAnimalModal.tsx` - Modal para adicionar animal
- `EditAnimalModal.tsx` - Modal para editar animal

### **Componentes de Chat/Mensagens**
- `ChatProviderBoundary.tsx` - Provider de chat
- Componentes em `components/chat/` - Interface de chat completa

### **Componentes de Pagamento**
- Componentes em `components/payment/` - Modais e formulários de pagamento

### **Componentes Administrativos**
- `AdminDashboard.tsx` - Dashboard admin
- `AdminUsers.tsx` - Gerenciamento de usuários
- `AdminPlans.tsx` - Gerenciamento de planos
- `AdminNews.tsx` - Gerenciamento de notícias
- `AdminReports.tsx` - Relatórios
- `AdminStats.tsx` - Estatísticas
- `AdminTickets.tsx` - Tickets
- `AdminFinancial.tsx` - Financeiro
- `AdminMessages.tsx` - Mensagens
- `AdminHarasMap.tsx` - Mapa de haras
- `AdminChat.tsx` - Chat admin
- `AdminSponsors.tsx` - Patrocinadores
- `AdminSociety.tsx` - Sociedades
- `AdminSubscriptions.tsx` - Assinaturas

### **Componentes UI (shadcn/ui)**
- Todos os componentes em `components/ui/` - Botões, inputs, modais, etc.

---

## 🪝 HOOKS CUSTOMIZADOS

### **Hooks de Autenticação**
- `useLogin.ts` - Hook de login
- `useRegister.ts` - Hook de registro
- `useSessionTimeout.ts` - Timeout de sessão
- `useSuspensionCheck.ts` - Verificação de suspensão

### **Hooks de Animais**
- `useFeaturedAnimals.ts` - Animais em destaque
- `useRecentAnimals.ts` - Animais recentes
- `useMostViewedAnimals.ts` - Mais visualizados
- `useTopAnimalsByGender.ts` - Top por gênero
- `useMonthlyRankingHistory.ts` - Histórico de ranking

### **Hooks de Dashboard**
- `useDashboardStats.ts` - Estatísticas do dashboard
- `useStatsCharts.ts` - Gráficos de estatísticas
- `useUserStats.ts` - Estatísticas do usuário
- `usePlanQuota.ts` - Cotas do plano
- `usePlanVerification.v2.ts` - Verificação de plano

### **Hooks de Notificações**
- `useNotifications.ts` - Notificações (v1)
- `useNotifications.v2.ts` - Notificações (v2)
- `useUnreadCounts.ts` - Contadores de não lidos

### **Hooks de Boost**
- `useBoostManager.ts` - Gerenciamento de boosts
- `useUserBoosts.ts` - Boosts do usuário

### **Hooks Administrativos**
- `useAdminUsers.ts` - Admin: usuários
- `useAdminPlans.ts` - Admin: planos
- `useAdminArticles.ts` - Admin: artigos
- `useAdminStats.ts` - Admin: estatísticas
- `useAdminReports.ts` - Admin: relatórios
- `useAdminTickets.ts` - Admin: tickets
- `useAdminFinancial.ts` - Admin: financeiro
- `useAdminMessages.ts` - Admin: mensagens
- `useAdminHaras.ts` - Admin: haras
- `useAdminVisitMetrics.ts` - Admin: métricas de visita
- `useArticleMonthlyViews.ts` - Visualizações mensais de artigos
- `useAdminSubscriptionControl.ts` - Controle de assinaturas

### **Hooks de Conteúdo**
- `useArticles.ts` - Artigos
- `useScheduledPublishing.ts` - Publicação agendada

### **Hooks de Validação**
- `useFormValidation.ts` - Validação de formulários
- `useSecureAdminValidation.ts` - Validação admin segura

### **Hooks de UI/UX**
- `use-mobile.tsx` - Detecção de dispositivo mobile
- `use-toast.ts` - Sistema de toasts
- `useLazySection.ts` - Carregamento lazy
- `useImpressionTracker.ts` - Rastreamento de impressões
- `useViewPermissions.tsx` - Permissões de visualização
- `useAdSenseConfig.ts` - Configuração AdSense

---

## 📱 ESTRATÉGIA DE MIGRAÇÃO PARA MOBILE

### **1. Escolha da Tecnologia: React Native + Expo**

**Por que React Native?**
- ✅ **Mesma linguagem**: TypeScript/JavaScript (já usado no projeto)
- ✅ **Componentes similares**: React (apenas mudanças de `div` para `View`, `img` para `Image`)
- ✅ **Mesmo Supabase**: SDK do Supabase funciona perfeitamente no React Native
- ✅ **Comunidade grande**: Muitos recursos e bibliotecas
- ✅ **Hot Reload**: Desenvolvimento rápido

**Por que Expo?**
- ✅ **Build simplificado**: Não precisa configurar Xcode/Android Studio manualmente
- ✅ **APIs nativas**: Câmera, notificações push, geolocalização prontas
- ✅ **Over-the-air updates**: Atualizações sem passar pela loja
- ✅ **EAS Build**: Build na nuvem (não precisa de Mac para iOS)

### **2. Estrutura do Projeto Mobile**

```
cavalaria-digital-mobile/
├── app/                          # Expo Router (rotas)
│   ├── (auth)/                   # Rotas de autenticação
│   │   ├── login.tsx
│   │   └── register.tsx
│   ├── (tabs)/                   # Tabs principais
│   │   ├── index.tsx             # Home
│   │   ├── buscar.tsx            # Busca
│   │   ├── eventos.tsx           # Eventos
│   │   ├── noticias.tsx          # Notícias
│   │   └── dashboard.tsx         # Dashboard
│   ├── animal/[id].tsx           # Detalhes do animal
│   ├── haras/[id].tsx            # Perfil do haras
│   └── ...
├── src/
│   ├── lib/
│   │   └── supabase.ts           # MESMO arquivo do web (reutilizar!)
│   ├── services/                 # MESMOS serviços (reutilizar!)
│   ├── hooks/                    # MESMOS hooks (reutilizar!)
│   ├── contexts/                 # MESMOS contexts (reutilizar!)
│   ├── types/                    # MESMOS tipos (reutilizar!)
│   └── components/               # Adaptar componentes web para mobile
├── app.json                      # Configuração Expo
└── package.json
```

### **3. Reutilização de Código**

**✅ Pode reutilizar 100%:**
- `src/lib/supabase.ts` - Cliente Supabase
- `src/services/*` - Todos os serviços
- `src/hooks/*` - Todos os hooks
- `src/contexts/*` - Todos os contexts
- `src/types/*` - Todos os tipos
- `src/utils/*` - Utilitários
- `src/constants/*` - Constantes

**⚠️ Precisa adaptar:**
- Componentes UI (substituir `div` por `View`, `img` por `Image`)
- Navegação (React Router → Expo Router ou React Navigation)
- Estilização (Tailwind CSS → NativeWind ou StyleSheet)
- Upload de imagens (usar `expo-image-picker`)

### **4. Configuração do Supabase no Mobile**

**Arquivo:** `src/lib/supabase.ts` (mesmo do web)

```typescript
import { createClient } from '@supabase/supabase-js'
import * as SecureStore from 'expo-secure-store'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: SecureStore, // Armazenamento seguro no mobile
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: 'pkce',
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  },
  global: {
    headers: {
      'X-Client-Info': 'cavalaria-digital-mobile', // Identificar como mobile
    }
  }
})
```

**Variáveis de ambiente (`.env`):**
```env
EXPO_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-key
```

### **5. Mapeamento de Rotas Web → Mobile**

| Rota Web | Rota Mobile (Expo Router) | Observações |
|----------|---------------------------|-------------|
| `/` | `app/(tabs)/index.tsx` | Home |
| `/login` | `app/(auth)/login.tsx` | Login |
| `/register` | `app/(auth)/register.tsx` | Registro |
| `/animal/:id` | `app/animal/[id].tsx` | Detalhes do animal |
| `/haras/:id` | `app/haras/[id].tsx` | Perfil do haras |
| `/buscar` | `app/(tabs)/buscar.tsx` | Busca |
| `/eventos` | `app/(tabs)/eventos.tsx` | Eventos |
| `/noticias` | `app/(tabs)/noticias.tsx` | Notícias |
| `/dashboard` | `app/(tabs)/dashboard.tsx` | Dashboard |
| `/dashboard/animals` | `app/dashboard/animals.tsx` | Animais do usuário |
| `/dashboard/messages` | `app/dashboard/messages.tsx` | Mensagens |
| `/checkout` | `app/checkout.tsx` | Checkout |

### **6. Bibliotecas Necessárias para Mobile**

```json
{
  "dependencies": {
    "expo": "~51.0.0",
    "expo-router": "~3.5.0",
    "@supabase/supabase-js": "^2.75.0",
    "expo-secure-store": "~13.0.0",
    "expo-image-picker": "~15.0.0",
    "expo-camera": "~15.0.0",
    "expo-notifications": "~0.28.0",
    "expo-location": "~17.0.0",
    "@tanstack/react-query": "^5.83.0",
    "react-native-safe-area-context": "4.10.0",
    "react-native-screens": "~3.31.0",
    "nativewind": "^4.0.0", // Tailwind para React Native
    "react-native-reanimated": "~3.10.0",
    "react-native-gesture-handler": "~2.16.0"
  }
}
```

### **7. Funcionalidades Específicas do Mobile**

**Câmera para Upload de Fotos:**
```typescript
import * as ImagePicker from 'expo-image-picker'

const pickImage = async () => {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    quality: 0.8,
  })
  
  if (!result.canceled) {
    // Upload para Supabase Storage (mesmo código do web)
    await uploadImageToSupabase(result.assets[0].uri)
  }
}
```

**Notificações Push:**
```typescript
import * as Notifications from 'expo-notifications'

// Registrar token no Supabase
const token = await Notifications.getExpoPushTokenAsync()
await supabase
  .from('user_push_tokens')
  .upsert({ user_id: user.id, token: token.data })
```

**Geolocalização (para mapa):**
```typescript
import * as Location from 'expo-location'

const location = await Location.getCurrentPositionAsync()
// Usar no mapa do Mapbox
```

---

## 🔐 SEGURANÇA E CONFIGURAÇÃO

### **Variáveis de Ambiente Necessárias**

**Web (atual):**
```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-key
VITE_ASAAS_API_KEY=sua-chave-asaas
VITE_ASAAS_ENVIRONMENT=sandbox
VITE_MAPBOX_ACCESS_TOKEN=seu-token-mapbox
```

**Mobile (novo):**
```env
EXPO_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-key
EXPO_PUBLIC_ASAAS_API_KEY=sua-chave-asaas
EXPO_PUBLIC_ASAAS_ENVIRONMENT=sandbox
EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN=seu-token-mapbox
```

**⚠️ IMPORTANTE:** 
- No mobile, use `EXPO_PUBLIC_*` em vez de `VITE_*`
- A chave `anon_key` do Supabase é **segura** para usar no cliente (web e mobile)
- O Supabase RLS protege os dados mesmo com a chave pública

---

## 📊 PLANOS E FUNCIONALIDADES POR PLANO

### **Planos Disponíveis**

| Plano | Anúncios | Boosts/Mês | Preço Mensal | Preço Anual |
|-------|----------|------------|--------------|-------------|
| **Free** | 0 | 0 | R$ 0,00 | - |
| **Basic** | 10 | 0 | R$ 29,90 | R$ 299,00 |
| **Pro** | 15 | 3 | R$ 59,90 | R$ 599,00 |
| **Ultra** | 30 | 5 | R$ 99,90 | R$ 999,00 |
| **VIP** | Ilimitado | 10 | R$ 199,90 | R$ 1.999,00 |

### **Funcionalidades por Plano**

- ✅ **Todos os planos:** Buscar animais, ver perfis, favoritar
- ✅ **Basic+:** Publicar animais, criar eventos, mensagens
- ✅ **Pro+:** Boosts mensais, estatísticas avançadas
- ✅ **Ultra+:** Mais anúncios, mais boosts
- ✅ **VIP:** Ilimitado, logo personalizada, destaque no mapa

---

## 🚀 PRÓXIMOS PASSOS PARA IMPLEMENTAÇÃO

### **Fase 1: Setup Inicial**
1. ✅ Criar projeto Expo: `npx create-expo-app@latest cavalaria-digital-mobile`
2. ✅ Instalar dependências do Supabase e outras
3. ✅ Copiar `src/lib/supabase.ts` do projeto web
4. ✅ Configurar variáveis de ambiente

### **Fase 2: Autenticação**
1. ✅ Implementar telas de login/registro
2. ✅ Configurar `AuthContext` (reutilizar do web)
3. ✅ Testar autenticação com Supabase

### **Fase 3: Navegação e Rotas**
1. ✅ Configurar Expo Router
2. ✅ Criar estrutura de rotas baseada no web
3. ✅ Implementar navegação entre telas

### **Fase 4: Componentes Core**
1. ✅ Adaptar componentes principais (AnimalCard, etc.)
2. ✅ Implementar listagens (busca, ranking, etc.)
3. ✅ Implementar detalhes (animal, haras, etc.)

### **Fase 5: Dashboard**
1. ✅ Implementar dashboard do usuário
2. ✅ Implementar publicação de animais
3. ✅ Implementar gerenciamento de animais

### **Fase 6: Funcionalidades Avançadas**
1. ✅ Sistema de mensagens
2. ✅ Favoritos
3. ✅ Pagamentos (Asaas)
4. ✅ Notificações push

### **Fase 7: Polimento**
1. ✅ Animações e transições
2. ✅ Tratamento de erros
3. ✅ Loading states
4. ✅ Testes

### **Fase 8: Build e Deploy**
1. ✅ Configurar EAS Build
2. ✅ Build para iOS (requer conta Apple Developer)
3. ✅ Build para Android
4. ✅ Submeter para App Store e Google Play

---

## 📝 CONCLUSÃO

### **Resumo**

✅ **Um único projeto React Native/Expo** gera aplicativos para iOS e Android  
✅ **~90% do código pode ser reutilizado** (serviços, hooks, contexts, tipos)  
✅ **Mesmo Supabase** funciona perfeitamente no mobile  
✅ **Mesmas funcionalidades** podem ser mantidas  
✅ **Mesma experiência** para os usuários  

### **Vantagens da Migração**

1. **Código Compartilhado**: Lógica de negócio reutilizada
2. **Manutenção Simplificada**: Uma base de código
3. **Backend Único**: Mesmo Supabase para web e mobile
4. **Experiência Consistente**: Mesma funcionalidade em todas as plataformas
5. **Desenvolvimento Rápido**: Expo facilita builds e testes

### **Considerações Importantes**

⚠️ **Upload de Imagens**: No mobile, use `expo-image-picker` em vez de `input[type="file"]`  
⚠️ **Navegação**: Expo Router é diferente do React Router, mas conceito similar  
⚠️ **Estilização**: NativeWind permite usar Tailwind, mas alguns ajustes podem ser necessários  
⚠️ **APIs Nativas**: Aproveite câmera, notificações push, geolocalização no mobile  

---

## 📚 RECURSOS E DOCUMENTAÇÃO

- **Expo:** https://docs.expo.dev
- **React Native:** https://reactnative.dev
- **Supabase Mobile:** https://supabase.com/docs/guides/getting-started/tutorials/with-expo-react-native
- **Expo Router:** https://docs.expo.dev/router/introduction
- **NativeWind (Tailwind):** https://www.nativewind.dev

---

**Documento criado em:** 2025-01-27  
**Versão do Projeto Web:** React 18.3.1 + Vite 7.1.8 + Supabase 2.75.0  
**Recomendação Mobile:** React Native + Expo 51 + Supabase 2.75.0
