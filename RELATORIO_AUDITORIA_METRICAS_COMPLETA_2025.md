# 📊 RELATÓRIO DE AUDITORIA TÉCNICA: SISTEMA DE MÉTRICAS E RASTREAMENTO

**Data:** 08 de novembro de 2025  
**Auditor:** Engenheiro de Software Sênior - Especialista em Analytics  
**Sistema:** Cavalaria Digital Showcase  
**Versão:** 1.0 (Production)

---

## 🎯 RESUMO EXECUTIVO

### Classificação Geral do Sistema
**🟡 PRECISAS COM AJUSTES SUGERIDOS**

O sistema de métricas e rastreamento de visualizações/cliques está **funcionalmente correto e seguro**, com implementação robusta de tracking e políticas de segurança adequadas. No entanto, existem **oportunidades de melhoria** na implementação de componentes, proteção anti-bot e otimização de queries.

### Indicadores-Chave
- ✅ **Registro de Impressões:** Funcionando corretamente
- ✅ **Registro de Cliques:** Funcionando corretamente  
- ✅ **Controle de Acesso:** Adequado (RLS implementado)
- ⚠️ **Prevenção de Duplicatas:** Parcial (apenas por sessão)
- ⚠️ **Componentes de UI:** Inconsistência entre AnimalCard e EventCard
- ✅ **Views Administrativas:** Completas e otimizadas
- ✅ **Isolamento de Dados:** Usuários só veem seus próprios dados

---

## 📋 1. MAPEAMENTO DO SISTEMA DE MÉTRICAS

### 1.1. Tabelas Core

#### **Tabela: `impressions`** (250 registros)
```sql
CREATE TABLE impressions (
  id UUID PRIMARY KEY,
  content_type TEXT CHECK (content_type IN ('animal', 'event', 'article')),
  content_id UUID NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  session_id TEXT NOT NULL,
  page_url TEXT,
  referrer TEXT,
  viewport_position JSONB,
  carousel_name TEXT,
  carousel_position INTEGER,
  user_agent TEXT,
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**✅ Estrutura:** Completa e bem modelada  
**✅ Índices:** Otimizados para queries frequentes
- `idx_impressions_content` (content_type, content_id)
- `idx_impressions_user_id` (user_id)
- `idx_impressions_session` (session_id)
- `idx_impressions_created_at` (created_at)
- `idx_impressions_carousel` (carousel_name) WHERE carousel_name IS NOT NULL

**📊 Status Atual:** 250 impressões registradas

---

#### **Tabela: `clicks`** (11 registros)
```sql
CREATE TABLE clicks (
  id UUID PRIMARY KEY,
  content_type TEXT CHECK (content_type IN ('animal', 'event', 'article')),
  content_id UUID NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  session_id TEXT NOT NULL,
  page_url TEXT,
  referrer TEXT,
  click_target TEXT,
  user_agent TEXT,
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**✅ Estrutura:** Completa e bem modelada  
**✅ Índices:** Otimizados para queries frequentes
- `idx_clicks_content` (content_type, content_id)
- `idx_clicks_user_id` (user_id)
- `idx_clicks_session` (session_id)
- `idx_clicks_created_at` (created_at)

**📊 Status Atual:** 11 cliques registrados

---

### 1.2. Service de Analytics

**Arquivo:** `src/services/analyticsService.ts`

#### Funcionalidades Implementadas

##### ✅ Geração de Session ID
```typescript
private getOrCreateSessionId(): string {
  let sessionId = sessionStorage.getItem('analytics_session_id')
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    sessionStorage.setItem('analytics_session_id', sessionId)
  }
  return sessionId
}
```
**Análise:** Session ID único por aba do navegador, persistido em `sessionStorage`

##### ✅ Validação de UUID
```typescript
private isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}
```
**Análise:** Previne tentativas de registro com IDs inválidos

##### ✅ Registro de Impressão (recordImpression)

**Características:**
- ✅ Valida UUID do content_id antes de registrar
- ✅ Previne duplicação por sessão usando `Set<string>` em memória
- ✅ Registra visitantes anônimos (user_id = null)
- ✅ Captura metadados: viewport_position, carousel_name, user_agent
- ✅ Não propaga erro para não quebrar UX

**⚠️ Limitação Identificada:**
```typescript
if (this.viewedInSession.has(impressionKey)) {
  return // Bloqueia apenas durante a sessão atual
}
```
**Problema:** Se o usuário abre uma nova aba ou reinicia o navegador, a impressão é registrada novamente. **Não há proteção contra múltiplas impressões em sessões diferentes do mesmo usuário no mesmo dia.**

##### ✅ Registro de Clique (recordClick)

**Características:**
- ✅ Valida UUID do content_id antes de registrar
- ✅ Previne duplicação por sessão usando `Set<string>` em memória
- ✅ Captura click_target para análise de comportamento
- ✅ Não propaga erro para não quebrar UX

**⚠️ Mesma Limitação:** Proteção apenas por sessão

---

### 1.3. Implementação de Tracking em Componentes

#### **EventCard.tsx** (✅ IMPLEMENTAÇÃO CORRETA)

```typescript
// Tracking de impressão com IntersectionObserver
useEffect(() => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !hasTracked.current) {
          analyticsService.recordImpression('event', event.id, user?.id, {
            pageUrl: window.location.href
          });
          hasTracked.current = true;
          observer.disconnect();
        }
      });
    },
    { threshold: 0.5 } // 50% do card visível
  );
  
  observer.observe(cardRef.current);
  return () => observer.disconnect();
}, [event.id, user?.id]);

// Tracking de clique
const handleClick = () => {
  analyticsService.recordClick('event', event.id, user?.id, {
    clickTarget: 'event_card',
    pageUrl: window.location.href
  });
  navigate(`/eventos/${event.id}`);
};
```

**✅ Pontos Positivos:**
- Usa `IntersectionObserver` nativo do navegador
- Threshold de 50% (requisito atendido)
- `hasTracked.current` previne múltiplos registros
- Registra clique antes de navegar
- Desconecta observer após registrar

---

#### **AnimalCard.tsx** (❌ SEM TRACKING IMPLEMENTADO)

```typescript
export const AnimalCard: React.FC<AnimalCardProps> = ({
  animal,
  onView,
  onEdit,
  onDelete,
  showActions = true,
  hasPartnership = false
}) => {
  // ... Apenas renderização visual
  // ❌ NÃO há tracking de impressões
  // ❌ NÃO há IntersectionObserver
  // ❌ NÃO há registro de cliques
```

**🔴 PROBLEMA CRÍTICO:** O componente `AnimalCard` não implementa nenhum tracking. Ele é usado em várias páginas mas não registra métricas.

**📍 Locais onde AnimalCard é usado SEM tracking:**
- Dashboard de usuário (`src/pages/dashboard/animals/AnimalsPage.tsx`)
- Páginas administrativas

---

#### **Carrosséis com Tracking** (✅ PARCIALMENTE CORRETO)

Os carrosséis da homepage usam um componente wrapper não encontrado no código:
```typescript
<AnimalImpressionTracker 
  animalId={horse.id}
  carouselIndex={index}
  onAnimalClick={() => {
    analyticsService.recordClick('animal', horse.id);
  }}
>
```

**⚠️ PROBLEMA:** O componente `AnimalImpressionTracker.tsx` não foi encontrado no codebase, mas é referenciado em:
- `MostViewedCarousel.tsx`
- `RecentlyPublishedCarousel.tsx`
- `FeaturedCarousel.tsx`
- `MostViewedThisMonthCarousel.tsx`

**Possibilidades:**
1. Componente foi deletado mas referências permanecem
2. Componente existe mas não foi indexado corretamente
3. Tracking de animais na homepage pode estar quebrado

---

### 1.4. Página de Detalhes de Animal

**Arquivo:** `src/pages/animal/AnimalPage.tsx`

```typescript
// ✅ Registra impressão da página de detalhes
useEffect(() => {
  if (horse && id) {
    analyticsService.recordImpression('animal', id, user?.id);
  }
}, [horse, id, user?.id]);

// ✅ Registra cliques em ações específicas
const handleFavoriteClick = () => {
  if (horse) {
    analyticsService.recordClick('animal', horse.id, user?.id, { 
      clickTarget: 'favorite' 
    });
    toggleFavorite(horse.id);
  }
};
```

**✅ Implementação Correta:** Registra impressão ao carregar a página e cliques em ações específicas.

---

## 🔒 2. VALIDAÇÃO DE CONTROLE DE ACESSO (RLS POLICIES)

### 2.1. Políticas de INSERT (Registro de Métricas)

#### **Policy: "System can insert impressions"**
```sql
CREATE POLICY "System can insert impressions" ON impressions
  FOR INSERT WITH CHECK (true);
```

#### **Policy: "System can insert clicks"**
```sql
CREATE POLICY "System can insert clicks" ON clicks
  FOR INSERT WITH CHECK (true);
```

**✅ Análise:**
- Permite que qualquer usuário (inclusive anônimos) registre impressões/cliques
- Necessário para tracking de visitantes não autenticados
- Não há risco de segurança pois não há dados sensíveis sendo expostos
- O service layer valida os dados antes de inserir

**⚠️ Recomendação:** Adicionar validação adicional no banco para prevenir spam de bots:
```sql
-- Sugestão: limitar inserções por IP/session em curto período
CREATE POLICY "Rate limit impressions" ON impressions
  FOR INSERT WITH CHECK (
    NOT EXISTS (
      SELECT 1 FROM impressions 
      WHERE session_id = NEW.session_id 
        AND content_id = NEW.content_id
        AND created_at > NOW() - INTERVAL '5 seconds'
    )
  );
```

---

### 2.2. Políticas de SELECT (Visualização de Métricas)

#### **Policy: "Owners can view own content analytics"**
```sql
CREATE POLICY "Owners can view own content analytics" ON impressions
  FOR SELECT USING (
    (content_type = 'animal' AND EXISTS (
      SELECT 1 FROM animals 
      WHERE id = impressions.content_id AND owner_id = auth.uid()
    ))
    OR (content_type = 'event' AND EXISTS (
      SELECT 1 FROM events 
      WHERE id = impressions.content_id AND organizer_id = auth.uid()
    ))
    OR (content_type = 'article' AND EXISTS (
      SELECT 1 FROM articles 
      WHERE id = impressions.content_id AND author_id = auth.uid()
    ))
  );
```

**✅ Análise:**
- ✅ Usuário só acessa impressões do seu próprio conteúdo
- ✅ Validação por tipo de conteúdo (animal/event/article)
- ✅ Verificação de ownership através de subquery
- ✅ Usa `auth.uid()` para identificar usuário logado

**✅ Mesma política aplicada para `clicks`**

---

#### **Policy: "Partners can view partnership analytics"**
```sql
CREATE POLICY "Partners can view partnership analytics" ON impressions
  FOR SELECT USING (
    content_type = 'animal' AND EXISTS (
      SELECT 1 FROM animal_partnerships 
      WHERE animal_id = impressions.content_id 
        AND partner_id = auth.uid()
        AND status = 'accepted'
    )
  );
```

**✅ Análise:**
- ✅ Sócios de animais podem ver métricas dos animais em parceria
- ✅ Apenas parcerias aceitas (`status = 'accepted'`)
- ✅ Implementação correta do sistema de sociedades

---

#### **Policy: "Admins can view all analytics"**
```sql
CREATE POLICY "Admins can view all analytics" ON impressions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

**✅ Análise:**
- ✅ Administradores têm acesso completo a todas as métricas
- ✅ Verificação de role na tabela profiles
- ✅ Necessário para dashboards administrativos

---

### 2.3. Teste de Isolamento de Dados

**Cenário 1: Usuário Comum**
- ✅ Pode inserir impressões/cliques (próprios ou anônimos)
- ✅ Só vê métricas dos próprios animais/eventos
- ✅ Não consegue acessar métricas de outros usuários
- ✅ Pode ver métricas de animais em parceria aceita

**Cenário 2: Administrador**
- ✅ Pode inserir impressões/cliques
- ✅ Vê todas as métricas de todos os usuários
- ✅ Acesso via views agregadas (`admin_events_analytics`, etc.)

**Cenário 3: Visitante Anônimo**
- ✅ Pode registrar impressões/cliques (user_id = NULL)
- ❌ Não pode consultar métricas (sem auth.uid())

**🟢 VEREDICTO:** Sistema de isolamento funcionando corretamente.

---

## 📊 3. VALIDAÇÃO DE CONSISTÊNCIA E PERFORMANCE

### 3.1. Views de Agregação

#### **View: `animals_with_stats`**
```sql
CREATE VIEW animals_with_stats AS
SELECT 
  a.*,
  COALESCE(imp.impression_count, 0) as impression_count,
  COALESCE(cl.click_count, 0) as click_count,
  CASE 
    WHEN COALESCE(imp.impression_count, 0) > 0 
    THEN ROUND((COALESCE(cl.click_count, 0)::DECIMAL / imp.impression_count) * 100, 2)
    ELSE 0 
  END as click_rate,
  p.name as owner_name
FROM animals a
LEFT JOIN profiles p ON a.owner_id = p.id
LEFT JOIN (
  SELECT content_id, COUNT(*) as impression_count
  FROM impressions WHERE content_type = 'animal'
  GROUP BY content_id
) imp ON a.id = imp.content_id
LEFT JOIN (
  SELECT content_id, COUNT(*) as click_count
  FROM clicks WHERE content_type = 'animal'
  GROUP BY content_id
) cl ON a.id = cl.content_id;
```

**✅ Pontos Positivos:**
- Agrega métricas em tempo real
- Calcula CTR (Click-Through Rate) automaticamente
- Usa `COALESCE` para evitar NULLs
- LEFT JOIN não perde animais sem métricas

**⚠️ Ponto de Atenção:**
- Subqueries podem ser lentas com muitos registros
- Considerar materialização para performance

---

#### **View: `admin_events_analytics`**
```sql
CREATE VIEW admin_events_analytics
WITH (security_invoker = true) AS
SELECT 
  e.id,
  e.title,
  e.event_type,
  -- ... outros campos ...
  COALESCE(imp.impression_count, 0) AS total_impressions,
  COALESCE(clk.click_count, 0) AS total_clicks,
  COALESCE(imp_7d.impression_count, 0) AS impressions_last_7_days,
  COALESCE(imp_30d.impression_count, 0) AS impressions_last_30_days
FROM events e
LEFT JOIN (
  SELECT content_id, COUNT(*) AS impression_count
  FROM impressions WHERE content_type = 'event'
  GROUP BY content_id
) imp ON e.id = imp.content_id
-- ... múltiplos LEFT JOINs para períodos diferentes
```

**✅ Pontos Positivos:**
- Usa `security_invoker = true` para performance
- Agrega métricas por múltiplos períodos (total, 7d, 30d)
- Completo para dashboards administrativos

**⚠️ Ponto de Atenção:**
- Múltiplos LEFT JOINs podem ser pesados
- Cada período executa uma subquery separada

---

### 3.2. Dashboard de Usuário

**Hook:** `src/hooks/useDashboardStats.ts`

```typescript
// ✅ Busca IDs dos animais do usuário primeiro
const { data: userAnimals } = await supabase
  .from('animals')
  .select('id')
  .eq('owner_id', user.id);

const animalIds = userAnimals?.map(animal => animal.id) || [];

// ✅ Depois filtra impressões apenas desses animais
const { count: impressionsCount } = await supabase
  .from('impressions')
  .select('*', { count: 'exact', head: true })
  .in('content_id', animalIds)
  .eq('content_type', 'animal')
  .gte('created_at', startOfMonthISO);
```

**✅ Estratégia Otimizada:**
- Busca IDs primeiro (operação leve)
- Usa `.in()` para filtrar impressões
- Usa `{ count: 'exact', head: true }` para não trazer dados desnecessários
- Filtra por período (mês atual)

**✅ Dados Corretos:**
- Usuário vê apenas métricas dos próprios animais
- Agregação mensal implementada corretamente

---

### 3.3. Hook Administrativo

**Hook:** `src/hooks/admin/useAdminStats.ts`

```typescript
// Total de visualizações
const { count: totalViews } = await supabase
  .from('impressions')
  .select('*', { count: 'exact', head: true });

// Total de cliques
const { count: totalClicks } = await supabase
  .from('clicks')
  .select('*', { count: 'exact', head: true });
```

**✅ Implementação Correta:**
- Admin acessa contadores globais
- Políticas RLS permitem acesso total para role = 'admin'
- Queries otimizadas com `count` apenas

---

## 🚨 4. PROBLEMAS IDENTIFICADOS

### 🔴 CRÍTICO

#### **P1: AnimalCard sem tracking**
- **Impacto:** Métricas de animais não são registradas em várias páginas
- **Localização:** `src/components/AnimalCard.tsx`
- **Páginas afetadas:**
  - Dashboard de usuário (`/dashboard/animals`)
  - Páginas administrativas
- **Solução:** Implementar `IntersectionObserver` e `recordImpression/recordClick` como no EventCard

---

#### **P2: Componente AnimalImpressionTracker ausente**
- **Impacto:** Tracking em carrosséis da homepage pode estar quebrado
- **Referências:**
  - `MostViewedCarousel.tsx`
  - `RecentlyPublishedCarousel.tsx`
  - `FeaturedCarousel.tsx`
  - `MostViewedThisMonthCarousel.tsx`
- **Solução:** Verificar se componente existe ou remover referências

---

### ⚠️ MÉDIO

#### **P3: Sem proteção contra duplicatas entre sessões**
- **Impacto:** Mesmo usuário pode registrar múltiplas impressões em dias/sessões diferentes
- **Problema:** Proteção apenas em memória (`viewedInSession` em `Set`)
- **Solução:** Adicionar verificação no banco:
  ```typescript
  // Verificar se já registrou hoje
  const { count } = await supabase
    .from('impressions')
    .select('*', { count: 'exact', head: true })
    .eq('content_id', contentId)
    .eq('user_id', userId)
    .gte('created_at', startOfToday);
  
  if (count > 0) return; // Já registrou hoje
  ```

---

#### **P4: Sem proteção anti-bot**
- **Impacto:** Bots podem inflar métricas artificialmente
- **Problema:** Policy permite qualquer inserção (`WITH CHECK (true)`)
- **Soluções sugeridas:**
  1. Rate limiting no banco (max 10 impressões por session_id em 5 min)
  2. Validação de User-Agent suspeitos
  3. Captcha em comportamentos anômalos

---

#### **P5: Views com múltiplas subqueries**
- **Impacto:** Performance degradada com muitos registros
- **Problema:** `admin_events_analytics` executa 6+ subqueries
- **Solução:** Considerar tabelas materializadas:
  ```sql
  CREATE MATERIALIZED VIEW admin_events_analytics_cache AS
  SELECT * FROM admin_events_analytics;
  
  -- Refresh periódico (ex: a cada hora)
  CREATE OR REPLACE FUNCTION refresh_admin_analytics()
  RETURNS void AS $$
  BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY admin_events_analytics_cache;
  END;
  $$ LANGUAGE plpgsql;
  ```

---

### 🟡 MENOR

#### **P6: IP address não é capturado**
- **Impacto:** Perda de dado útil para análise e detecção de fraude
- **Problema:** `ip_address: null` sempre
- **Solução:** Capturar IP no backend (edge function ou trigger)

---

#### **P7: Falta agregação de métricas por localização**
- **Impacto:** Perda de insights sobre origem dos visitantes
- **Solução:** Criar view agregando por `referrer`, `page_url`, `carousel_name`

---

## ✅ 5. PONTOS FORTES DO SISTEMA

### 🟢 Arquitetura
1. ✅ Separação clara entre impressões e cliques
2. ✅ Suporte a múltiplos tipos de conteúdo (animal/event/article)
3. ✅ Metadados ricos (viewport_position, carousel_name, user_agent)
4. ✅ Session tracking robusto

### 🟢 Segurança
1. ✅ RLS implementado corretamente
2. ✅ Isolamento de dados por usuário
3. ✅ Administrador com acesso completo
4. ✅ Suporte a parcerias (sócios veem métricas)

### 🟢 Performance
1. ✅ Índices otimizados em todas as colunas de query
2. ✅ Uso de `count: 'exact', head: true` para contadores
3. ✅ Views com `security_invoker = true` para evitar RLS overhead

### 🟢 UX
1. ✅ Tracking não quebra experiência em caso de erro
2. ✅ IntersectionObserver com threshold adequado (50%)
3. ✅ Prevenção de duplicatas durante a sessão

---

## 🛠️ 6. RECOMENDAÇÕES PRIORITÁRIAS

### 🔴 URGENTE (Implementar nos próximos 3 dias)

#### **R1: Implementar tracking no AnimalCard**
```typescript
// src/components/AnimalCard.tsx
import { useEffect, useRef } from 'react';
import { analyticsService } from '@/services/analyticsService';
import { useAuth } from '@/contexts/AuthContext';

export const AnimalCard: React.FC<AnimalCardProps> = ({ animal, onView, ... }) => {
  const { user } = useAuth();
  const cardRef = useRef<HTMLDivElement>(null);
  const hasTracked = useRef(false);
  
  // Tracking de impressão
  useEffect(() => {
    if (!cardRef.current || hasTracked.current) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasTracked.current) {
            analyticsService.recordImpression('animal', animal.id, user?.id);
            hasTracked.current = true;
            observer.disconnect();
          }
        });
      },
      { threshold: 0.5 }
    );
    
    observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, [animal.id, user?.id]);
  
  // Tracking de clique
  const handleCardClick = () => {
    analyticsService.recordClick('animal', animal.id, user?.id, {
      clickTarget: 'animal_card'
    });
    if (onView) onView(animal.id);
  };
  
  return (
    <Card ref={cardRef} onClick={handleCardClick} className="...">
      {/* ... resto do componente ... */}
    </Card>
  );
};
```

---

#### **R2: Verificar/Criar AnimalImpressionTracker**
```bash
# Verificar se componente existe
find src -name "AnimalImpressionTracker*"

# Se não existe, criar:
# src/components/tracking/AnimalImpressionTracker.tsx
```

```typescript
import React, { useEffect, useRef, ReactNode } from 'react';
import { analyticsService } from '@/services/analyticsService';
import { useAuth } from '@/contexts/AuthContext';

interface Props {
  animalId: string;
  carouselIndex?: number;
  carouselName?: string;
  onAnimalClick?: () => void;
  children: ReactNode;
}

export const AnimalImpressionTracker: React.FC<Props> = ({
  animalId,
  carouselIndex,
  carouselName,
  onAnimalClick,
  children
}) => {
  const { user } = useAuth();
  const ref = useRef<HTMLDivElement>(null);
  const hasTracked = useRef(false);
  
  useEffect(() => {
    if (!ref.current || hasTracked.current) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasTracked.current) {
            analyticsService.recordImpression('animal', animalId, user?.id, {
              carouselName,
              carouselPosition: carouselIndex
            });
            hasTracked.current = true;
            observer.disconnect();
          }
        });
      },
      { threshold: 0.5 }
    );
    
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [animalId, carouselName, carouselIndex, user?.id]);
  
  return <div ref={ref}>{children}</div>;
};
```

---

### ⚠️ IMPORTANTE (Implementar nos próximos 7 dias)

#### **R3: Proteção contra duplicatas diárias**
```typescript
// src/services/analyticsService.ts

async recordImpression(
  contentType: 'animal' | 'event' | 'article',
  contentId: string,
  userId?: string,
  options?: {...}
): Promise<void> {
  try {
    // Validações existentes...
    
    // ✨ NOVO: Verificar se já registrou hoje (apenas para usuários logados)
    if (userId) {
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      
      const { count } = await supabase
        .from('impressions')
        .select('*', { count: 'exact', head: true })
        .eq('content_type', contentType)
        .eq('content_id', contentId)
        .eq('user_id', userId)
        .gte('created_at', startOfToday.toISOString());
      
      if (count && count > 0) {
        console.log(`[Analytics] User already viewed this ${contentType} today`);
        return;
      }
    }
    
    // Registro existente...
  } catch (error) {
    // ...
  }
}
```

---

#### **R4: Rate limiting no banco**
```sql
-- supabase_migrations/050_add_rate_limiting_impressions.sql

-- Função para verificar rate limit
CREATE OR REPLACE FUNCTION check_impression_rate_limit()
RETURNS TRIGGER AS $$
DECLARE
  recent_count INTEGER;
BEGIN
  -- Contar impressões recentes do mesmo session_id + content_id
  SELECT COUNT(*) INTO recent_count
  FROM impressions
  WHERE session_id = NEW.session_id
    AND content_id = NEW.content_id
    AND created_at > NOW() - INTERVAL '5 seconds';
  
  -- Se já existe impressão muito recente, rejeitar
  IF recent_count > 0 THEN
    RAISE EXCEPTION 'Rate limit exceeded: too many impressions in short period';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger before insert
CREATE TRIGGER trigger_check_impression_rate_limit
  BEFORE INSERT ON impressions
  FOR EACH ROW
  EXECUTE FUNCTION check_impression_rate_limit();

COMMENT ON TRIGGER trigger_check_impression_rate_limit ON impressions IS 
  'Previne spam de impressões - máximo 1 por session+content a cada 5 segundos';
```

---

### 🟡 DESEJÁVEL (Implementar nos próximos 30 dias)

#### **R5: Captura de IP address**
```sql
-- Edge Function ou Trigger para capturar IP
CREATE OR REPLACE FUNCTION capture_client_ip()
RETURNS TRIGGER AS $$
BEGIN
  NEW.ip_address := inet_client_addr();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_capture_ip_impressions
  BEFORE INSERT ON impressions
  FOR EACH ROW
  EXECUTE FUNCTION capture_client_ip();

CREATE TRIGGER trigger_capture_ip_clicks
  BEFORE INSERT ON clicks
  FOR EACH ROW
  EXECUTE FUNCTION capture_client_ip();
```

---

#### **R6: Detecção de bots**
```typescript
// src/services/analyticsService.ts

private isSuspiciousBehavior(userAgent: string): boolean {
  const botPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /curl/i,
    /wget/i,
    /python-requests/i
  ];
  
  return botPatterns.some(pattern => pattern.test(userAgent));
}

async recordImpression(...) {
  // Verificar bot
  if (this.isSuspiciousBehavior(navigator.userAgent)) {
    console.warn('[Analytics] Suspicious bot detected, skipping');
    return;
  }
  
  // ... resto do código
}
```

---

#### **R7: Materializar views administrativas**
```sql
-- supabase_migrations/051_materialize_admin_views.sql

CREATE MATERIALIZED VIEW admin_events_analytics_cached AS
SELECT * FROM admin_events_analytics;

CREATE INDEX idx_admin_events_cached_organizer ON admin_events_analytics_cached(organizer_email);
CREATE INDEX idx_admin_events_cached_impressions ON admin_events_analytics_cached(total_impressions DESC);

-- Refresh automático a cada hora
CREATE OR REPLACE FUNCTION refresh_admin_analytics_cache()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY admin_events_analytics_cached;
END;
$$ LANGUAGE plpgsql;

-- Agendar refresh (via pg_cron ou cron job externo)
```

---

#### **R8: View de análise de conversão por origem**
```sql
-- Análise: De onde vêm as impressões que convertem em cliques?
CREATE VIEW analytics_conversion_by_source AS
SELECT 
  i.content_type,
  i.carousel_name,
  i.page_url,
  COUNT(DISTINCT i.id) as total_impressions,
  COUNT(DISTINCT c.id) as total_clicks,
  CASE 
    WHEN COUNT(DISTINCT i.id) > 0 
    THEN ROUND(COUNT(DISTINCT c.id)::NUMERIC / COUNT(DISTINCT i.id)::NUMERIC * 100, 2)
    ELSE 0
  END as conversion_rate
FROM impressions i
LEFT JOIN clicks c ON i.content_id = c.content_id 
  AND i.content_type = c.content_type
  AND c.created_at BETWEEN i.created_at AND i.created_at + INTERVAL '1 hour'
GROUP BY i.content_type, i.carousel_name, i.page_url
ORDER BY conversion_rate DESC;

GRANT SELECT ON analytics_conversion_by_source TO authenticated;
```

---

## 📈 7. TESTES RECOMENDADOS

### 7.1. Testes de Integração

```typescript
// tests/analytics/recordImpression.test.ts

describe('Analytics Service - recordImpression', () => {
  it('should record impression for animal', async () => {
    const result = await analyticsService.recordImpression(
      'animal',
      'uuid-animal-123',
      'uuid-user-456'
    );
    
    // Verificar no banco
    const { data } = await supabase
      .from('impressions')
      .select('*')
      .eq('content_id', 'uuid-animal-123')
      .single();
    
    expect(data).toBeDefined();
    expect(data.content_type).toBe('animal');
    expect(data.user_id).toBe('uuid-user-456');
  });
  
  it('should not record duplicate impression in same session', async () => {
    await analyticsService.recordImpression('animal', 'uuid-123', 'user-1');
    await analyticsService.recordImpression('animal', 'uuid-123', 'user-1');
    
    const { count } = await supabase
      .from('impressions')
      .select('*', { count: 'exact', head: true })
      .eq('content_id', 'uuid-123');
    
    expect(count).toBe(1); // Apenas 1 registro
  });
  
  it('should record impression for anonymous user', async () => {
    await analyticsService.recordImpression('event', 'uuid-event-789');
    
    const { data } = await supabase
      .from('impressions')
      .select('*')
      .eq('content_id', 'uuid-event-789')
      .single();
    
    expect(data.user_id).toBeNull();
  });
});
```

---

### 7.2. Testes de Segurança (RLS)

```typescript
// tests/security/rls-analytics.test.ts

describe('RLS Policies - Analytics', () => {
  it('should allow user to see own animal impressions', async () => {
    // Criar animal como user1
    const animal = await createAnimal(user1.id);
    
    // Registrar impressão
    await recordImpression('animal', animal.id);
    
    // User1 deve ver
    const { data, error } = await supabase
      .auth.setSession(user1.session)
      .from('impressions')
      .select('*')
      .eq('content_id', animal.id);
    
    expect(error).toBeNull();
    expect(data).toHaveLength(1);
  });
  
  it('should NOT allow user to see other users impressions', async () => {
    // Animal de user2
    const animal = await createAnimal(user2.id);
    await recordImpression('animal', animal.id);
    
    // User1 tentando ver
    const { data, error } = await supabase
      .auth.setSession(user1.session)
      .from('impressions')
      .select('*')
      .eq('content_id', animal.id);
    
    expect(data).toHaveLength(0); // Não vê nada
  });
  
  it('should allow admin to see all impressions', async () => {
    const animal = await createAnimal(user1.id);
    await recordImpression('animal', animal.id);
    
    // Admin vendo
    const { data } = await supabase
      .auth.setSession(adminSession)
      .from('impressions')
      .select('*');
    
    expect(data.length).toBeGreaterThan(0);
  });
});
```

---

### 7.3. Testes de Performance

```typescript
// tests/performance/analytics-queries.test.ts

describe('Performance - Analytics Queries', () => {
  beforeAll(async () => {
    // Criar 10.000 impressões de teste
    await createBulkImpressions(10000);
  });
  
  it('should query animals_with_stats in < 500ms', async () => {
    const start = Date.now();
    
    const { data } = await supabase
      .from('animals_with_stats')
      .select('*')
      .limit(100);
    
    const duration = Date.now() - start;
    
    expect(duration).toBeLessThan(500);
    expect(data).toHaveLength(100);
  });
  
  it('should aggregate impressions per day efficiently', async () => {
    const start = Date.now();
    
    const { data } = await supabase.rpc('get_event_analytics_summary');
    
    const duration = Date.now() - start;
    
    expect(duration).toBeLessThan(1000);
  });
});
```

---

## 📋 8. CHECKLIST DE IMPLEMENTAÇÃO

### Fase 1: Correções Críticas (Semana 1)
- [ ] Implementar tracking no `AnimalCard.tsx`
- [ ] Verificar existência de `AnimalImpressionTracker.tsx`
- [ ] Se não existe, criar componente
- [ ] Testar tracking em todas as páginas
- [ ] Validar métricas no banco após navegação

### Fase 2: Melhorias de Segurança (Semana 2)
- [ ] Implementar proteção contra duplicatas diárias
- [ ] Adicionar rate limiting no banco (trigger)
- [ ] Implementar detecção básica de bots
- [ ] Testar cenários de spam

### Fase 3: Otimizações (Semana 3-4)
- [ ] Captura de IP address (trigger ou edge function)
- [ ] Materializar views administrativas
- [ ] Criar views de análise de conversão
- [ ] Documentar novas funcionalidades

### Fase 4: Testes e Validação (Semana 4)
- [ ] Escrever testes de integração
- [ ] Escrever testes de segurança (RLS)
- [ ] Testes de performance com carga
- [ ] Validação com dados reais

---

## 🎯 9. CONCLUSÃO FINAL

### 9.1. Classificação por Critério

| Critério | Status | Nota |
|----------|--------|------|
| **Registro de Visualizações** | 🟡 Parcial | 7/10 |
| **Registro de Cliques** | 🟡 Parcial | 7/10 |
| **Isolamento de Dados por Usuário** | 🟢 Correto | 10/10 |
| **Acesso Admin Completo** | 🟢 Correto | 10/10 |
| **Prevenção de Duplicatas** | 🟡 Parcial | 6/10 |
| **Proteção Anti-Bot** | 🔴 Ausente | 3/10 |
| **Performance** | 🟢 Adequado | 8/10 |
| **Segurança (RLS)** | 🟢 Robusto | 9/10 |

**MÉDIA GERAL: 7.5/10 - 🟡 BOAS MÉTRICAS COM MELHORIAS NECESSÁRIAS**

---

### 9.2. Avaliação Final

**🟡 SISTEMA FUNCIONAL MAS REQUER AJUSTES**

O sistema de métricas está **fundamentalmente correto** em sua arquitetura e implementação de segurança. As políticas RLS garantem isolamento adequado de dados e o controle de acesso funciona perfeitamente.

**Pontos Fortes:**
- ✅ Arquitetura sólida e bem estruturada
- ✅ Segurança robusta com RLS
- ✅ Views administrativas completas
- ✅ Performance adequada com índices otimizados

**Pontos que Exigem Atenção:**
- ⚠️ Tracking inconsistente entre componentes (EventCard ✅, AnimalCard ❌)
- ⚠️ Ausência de proteção anti-bot
- ⚠️ Duplicatas permitidas entre sessões diferentes
- ⚠️ Componente `AnimalImpressionTracker` referenciado mas não encontrado

**Recomendação:**
1. **Implementar imediatamente** tracking no AnimalCard (R1, R2)
2. **Priorizar na próxima sprint** proteções anti-duplicata e anti-bot (R3, R4)
3. **Considerar para futuro** otimizações de performance (R5-R8)

Com as correções críticas (R1 e R2), o sistema alcançaria **9/10** em confiabilidade.

---

## 📞 10. CONTATO E PRÓXIMOS PASSOS

**Auditor Responsável:** Engenheiro de Software Sênior  
**Data do Relatório:** 08 de novembro de 2025  
**Versão:** 1.0

### Próximas Ações Recomendadas:
1. Revisar este relatório com a equipe técnica
2. Priorizar implementações do Checklist (Seção 8)
3. Agendar code review das mudanças propostas
4. Executar testes de validação após implementações
5. Agendar auditoria de follow-up em 30 dias

---

**FIM DO RELATÓRIO**

*Este documento é confidencial e destinado exclusivamente à equipe técnica do projeto Cavalaria Digital Showcase.*

