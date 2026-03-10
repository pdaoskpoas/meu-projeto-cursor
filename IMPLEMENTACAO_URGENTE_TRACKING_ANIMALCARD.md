# 🚨 IMPLEMENTAÇÃO URGENTE: Tracking no AnimalCard

**Prioridade:** 🔴 CRÍTICA  
**Tempo Estimado:** 2-3 horas  
**Impacto:** Alto - Métricas de animais não estão sendo registradas

---

## 📋 PROBLEMA IDENTIFICADO

O componente `AnimalCard.tsx` **NÃO possui tracking de impressões nem cliques**, diferente do `EventCard.tsx` que está correto. Isso significa que:

- ❌ Visualizações de animais não são registradas em listas
- ❌ Cliques em cards de animais não são contabilizados
- ❌ Dashboard de usuários mostra métricas incompletas
- ❌ Análises de engajamento ficam imprecisas

---

## ✅ SOLUÇÃO COMPLETA

### Arquivo: `src/components/AnimalCard.tsx`

```typescript
import React, { useEffect, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Eye, Edit3, Trash2, MapPin, Users } from 'lucide-react';
import { Animal } from '@/data/mockData';
import { analyticsService } from '@/services/analyticsService';
import { useAuth } from '@/contexts/AuthContext';

interface AnimalCardProps {
  animal: Animal;
  onView?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  showActions?: boolean;
  hasPartnership?: boolean;
}

export const AnimalCard: React.FC<AnimalCardProps> = ({
  animal,
  onView,
  onEdit,
  onDelete,
  showActions = true,
  hasPartnership = false
}) => {
  const { user } = useAuth();
  const cardRef = useRef<HTMLDivElement>(null);
  const hasTracked = useRef(false);

  // ✨ NOVO: Tracking de impressão quando card entra no viewport
  useEffect(() => {
    if (!cardRef.current || hasTracked.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasTracked.current) {
            // Registrar impressão
            analyticsService.recordImpression('animal', animal.id, user?.id, {
              pageUrl: window.location.href
            });
            hasTracked.current = true;
            // Parar de observar após registrar
            observer.disconnect();
          }
        });
      },
      {
        threshold: 0.5 // 50% do card visível
      }
    );

    observer.observe(cardRef.current);

    return () => observer.disconnect();
  }, [animal.id, user?.id]);

  // ✨ NOVO: Handler para cliques no card
  const handleCardClick = () => {
    analyticsService.recordClick('animal', animal.id, user?.id, {
      clickTarget: 'animal_card',
      pageUrl: window.location.href
    });
    
    if (onView) {
      onView(animal.id);
    }
  };

  // ✨ NOVO: Handler para cliques em botões específicos
  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Previne propagação para o card
    analyticsService.recordClick('animal', animal.id, user?.id, {
      clickTarget: 'edit_button',
      pageUrl: window.location.href
    });
    
    if (onEdit) {
      onEdit(animal.id);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Previne propagação para o card
    analyticsService.recordClick('animal', animal.id, user?.id, {
      clickTarget: 'delete_button',
      pageUrl: window.location.href
    });
    
    if (onDelete) {
      onDelete(animal.id);
    }
  };

  const getGenderIcon = (gender: string) => {
    return gender === 'Macho' ? '♂' : '♀';
  };

  const getGenderColor = (gender: string) => {
    return gender === 'Macho' ? 'text-blue-600' : 'text-pink-600';
  };

  return (
    <Card 
      ref={cardRef}
      onClick={handleCardClick}
      className="card-professional overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
    >
      <div className="aspect-video bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center relative">
        {hasPartnership && (
          <div className="absolute top-2 right-2 z-10">
            <Badge className="bg-blue-600 text-white flex items-center gap-1">
              <Users className="h-3 w-3" />
              Sociedade
            </Badge>
          </div>
        )}
        <div className="text-center">
          <div className={`text-4xl font-bold ${getGenderColor(animal.gender)}`}>
            {getGenderIcon(animal.gender)}
          </div>
        </div>
      </div>
      
      <div className="p-4 space-y-3">
        <div>
          <h3 className="text-lg font-semibold text-blue-dark">{animal.name}</h3>
          <div className="flex items-center space-x-2 text-sm text-gray-medium">
            <span>{animal.breed}</span>
            <span>•</span>
            <span className={getGenderColor(animal.gender)}>{animal.gender}</span>
            <span>•</span>
            <span>{animal.coat}</span>
          </div>
          <div className="flex items-center space-x-1 text-xs text-gray-medium mt-1">
            <MapPin className="h-3 w-3" />
            <span>{animal.currentLocation.city}, {animal.currentLocation.state}</span>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-1">
          <Badge variant="outline" className="text-xs">
            {animal.coat}
          </Badge>
          {animal.titles?.map((title, index) => (
            <Badge key={index} className="bg-accent/10 text-accent border-accent/20 text-xs">
              {title}
            </Badge>
          ))}
        </div>
        
        {showActions && (
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <div className="text-xs text-gray-medium">
              Localização: {animal.currentLocation.city}/{animal.currentLocation.state}
            </div>
            
            <div className="flex space-x-1">
              {onView && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0"
                  onClick={handleCardClick}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              )}
              {onEdit && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0"
                  onClick={handleEditClick}
                >
                  <Edit3 className="h-4 w-4" />
                </Button>
              )}
              {onDelete && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                  onClick={handleDeleteClick}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
```

---

## 🔍 MUDANÇAS PRINCIPAIS

### 1. **Imports Adicionados**
```typescript
import { analyticsService } from '@/services/analyticsService';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useRef } from 'react';
```

### 2. **Refs para Tracking**
```typescript
const { user } = useAuth();
const cardRef = useRef<HTMLDivElement>(null);
const hasTracked = useRef(false);
```

### 3. **IntersectionObserver para Impressões**
- Registra quando **50% do card** está visível
- Usa `hasTracked.current` para evitar duplicatas
- Desconecta observer após registrar
- Idêntico à implementação do EventCard

### 4. **Handlers de Clique**
- `handleCardClick`: Registra clique no card completo
- `handleEditClick`: Registra clique no botão de editar
- `handleDeleteClick`: Registra clique no botão de deletar
- Usa `e.stopPropagation()` para evitar duplo registro

### 5. **Ref no Card**
```typescript
<Card 
  ref={cardRef}
  onClick={handleCardClick}
  className="... cursor-pointer"
>
```

---

## ✅ TESTES PÓS-IMPLEMENTAÇÃO

### Teste 1: Verificar Impressões
```bash
# Abrir página com lista de animais
# Scroll até aparecer cards
# Verificar no Supabase:
```
```sql
SELECT 
  content_id,
  content_type,
  session_id,
  created_at
FROM impressions
WHERE content_type = 'animal'
ORDER BY created_at DESC
LIMIT 10;
```

**Esperado:** Novos registros de impressões ao visualizar cards

---

### Teste 2: Verificar Cliques
```bash
# Clicar em um card de animal
# Verificar no Supabase:
```
```sql
SELECT 
  content_id,
  content_type,
  click_target,
  created_at
FROM clicks
WHERE content_type = 'animal'
ORDER BY created_at DESC
LIMIT 10;
```

**Esperado:** Registro com `click_target = 'animal_card'`

---

### Teste 3: Verificar Duplicatas
```bash
# Scroll para fora do viewport do card
# Scroll de volta para visualizar novamente
# Verificar no banco
```

**Esperado:** Apenas 1 impressão (mesma sessão)

---

### Teste 4: Verificar Dashboard do Usuário
```bash
# Navegar para /dashboard
# Verificar contadores de "Visualizações" e "Cliques"
```

**Esperado:** Números atualizados refletindo as interações

---

## 📊 VALIDAÇÃO DE MÉTRICAS

### Query para Validar Contagens
```sql
-- Contagem de impressões por animal
SELECT 
  a.id,
  a.name,
  COUNT(DISTINCT i.id) as impression_count,
  COUNT(DISTINCT c.id) as click_count
FROM animals a
LEFT JOIN impressions i ON i.content_id = a.id AND i.content_type = 'animal'
LEFT JOIN clicks c ON c.content_id = a.id AND c.content_type = 'animal'
GROUP BY a.id, a.name
ORDER BY impression_count DESC
LIMIT 20;
```

---

## 🔄 ROLLBACK (Se Necessário)

Se houver algum problema, reverter para versão anterior:

```bash
git checkout HEAD~1 -- src/components/AnimalCard.tsx
```

---

## 📝 CHECKLIST DE IMPLEMENTAÇÃO

- [ ] Fazer backup do arquivo original
- [ ] Aplicar mudanças no `AnimalCard.tsx`
- [ ] Testar compilação (`npm run dev`)
- [ ] Testar impressões (Teste 1)
- [ ] Testar cliques (Teste 2)
- [ ] Testar prevenção de duplicatas (Teste 3)
- [ ] Verificar dashboard atualizado (Teste 4)
- [ ] Validar métricas no banco de dados
- [ ] Commit e push das mudanças

---

## 🎯 RESULTADO ESPERADO

Após implementação:
- ✅ AnimalCard registra impressões automaticamente
- ✅ AnimalCard registra cliques com target específico
- ✅ Dashboard mostra métricas corretas
- ✅ Relatórios administrativos incluem dados de animais
- ✅ Comportamento consistente entre AnimalCard e EventCard

---

**Data de Criação:** 08/11/2025  
**Responsável:** Sistema de Auditoria Técnica

