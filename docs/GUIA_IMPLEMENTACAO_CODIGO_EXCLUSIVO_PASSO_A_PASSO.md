# 🚀 GUIA DE IMPLEMENTAÇÃO - SISTEMA DE CÓDIGO EXCLUSIVO
## Transição do Modelo de Convites para Código Exclusivo por Animal

---

**Desenvolvedor:** Siga este guia passo a passo  
**Tempo Estimado:** 12-16 horas  
**Dificuldade:** MÉDIA-ALTA  
**Referência:** RELATORIO_AUDITORIA_SOCIEDADES_PROFISSIONAL_2025-11-17.md

---

## 📋 PRÉ-REQUISITOS

Antes de iniciar, certifique-se de que:

- [ ] Backup completo do banco de dados foi realizado
- [ ] Ambiente de desenvolvimento está funcionando
- [ ] Você tem acesso ao Supabase SQL Editor
- [ ] Código está versionado no Git (commit limpo)
- [ ] Nenhum deploy em produção está agendado para hoje
- [ ] Você leu o relatório de auditoria completo

---

## 🎯 FASE 1: BACKEND - BANCO DE DADOS (2-3 horas)

### Passo 1.1: Aplicar Migration 065

**Arquivo:** `supabase_migrations/065_animal_share_code_system.sql`

**Ação:**
```bash
# 1. Abrir Supabase Dashboard
# 2. Ir em SQL Editor
# 3. Nova Query
# 4. Copiar conteúdo de 065_animal_share_code_system.sql
# 5. Executar
```

**Validação:**
```sql
-- Verificar se campo foi criado
SELECT COUNT(*) FROM animals WHERE share_code IS NOT NULL;
-- Deve retornar o total de animais

-- Verificar se não há duplicações
SELECT share_code, COUNT(*) 
FROM animals 
WHERE share_code IS NOT NULL
GROUP BY share_code 
HAVING COUNT(*) > 1;
-- Deve retornar 0 linhas

-- Verificar função
SELECT generate_animal_share_code();
-- Deve retornar algo como: ANI-A3F8C9-25
```

**Troubleshooting:**
- Se der erro "coluna share_code já existe": OK, pode ignorar (ALTER IF NOT EXISTS)
- Se der erro "função create_notification não encontrada": Verificar se migration 042 foi aplicada
- Se travar na geração de códigos: Verificar se há muitos animais (>10k). Considere executar em lotes.

---

### Passo 1.2: Validar Integridade dos Dados

**SQL de Validação:**
```sql
-- CHECKLIST DE VALIDAÇÃO PÓS-MIGRATION

-- 1. Todos os animais têm código?
SELECT 
  (SELECT COUNT(*) FROM animals) as total_animals,
  (SELECT COUNT(*) FROM animals WHERE share_code IS NOT NULL) as with_code,
  CASE 
    WHEN (SELECT COUNT(*) FROM animals) = (SELECT COUNT(*) FROM animals WHERE share_code IS NOT NULL)
    THEN '✅ OK'
    ELSE '❌ ERRO'
  END as status;

-- 2. Códigos são únicos?
SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ OK - Sem duplicações'
    ELSE '❌ ERRO - ' || COUNT(*) || ' duplicações'
  END as duplicates_check
FROM (
  SELECT share_code 
  FROM animals 
  GROUP BY share_code 
  HAVING COUNT(*) > 1
) dupes;

-- 3. Formato dos códigos está correto?
SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ OK - Todos os formatos válidos'
    ELSE '❌ ERRO - ' || COUNT(*) || ' códigos com formato inválido'
  END as format_check
FROM animals 
WHERE share_code IS NOT NULL 
  AND share_code !~ '^ANI-[A-Z0-9]{6}-[0-9]{2}$';

-- 4. Tabela animal_partnerships foi simplificada?
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'animal_partnerships' 
      AND column_name = 'status'
    ) THEN '❌ ERRO - Coluna status ainda existe'
    ELSE '✅ OK - Coluna status removida'
  END as status_column_check;

-- 5. Novas colunas foram adicionadas?
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'animal_partnerships' 
      AND column_name = 'joined_at'
    ) THEN '✅ OK - Coluna joined_at existe'
    ELSE '❌ ERRO - Coluna joined_at não encontrada'
  END as joined_at_check;

-- 6. Funções foram atualizadas?
SELECT 
  routine_name,
  '✅ Existe' as status
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'generate_animal_share_code',
    'count_active_animals_with_partnerships',
    'should_animal_be_active',
    'get_profile_animals'
  )
ORDER BY routine_name;

-- 7. Trigger foi criado?
SELECT 
  trigger_name,
  event_manipulation,
  '✅ Configurado' as status
FROM information_schema.triggers
WHERE trigger_name = 'trigger_set_animal_share_code';

-- RELATÓRIO FINAL
SELECT 
  '═══════════════════════════════════' as separator
UNION ALL
SELECT '  VALIDAÇÃO FASE 1 - BANCO DE DADOS'
UNION ALL
SELECT '═══════════════════════════════════'
UNION ALL
SELECT '  ✅ Executar queries acima e validar'
UNION ALL
SELECT '  ✅ Todos os checks devem retornar OK'
UNION ALL
SELECT '  ✅ Se houver ERRO, revisar migration';
```

**Resultado Esperado:** Todos os checks retornam ✅ OK

---

## 🔧 FASE 2: SERVICE LAYER - TYPESCRIPT (4-5 horas)

### Passo 2.1: Refatorar `partnershipService.ts`

**Arquivo:** `src/services/partnershipService.ts`

**Mudanças Principais:**
1. **ADICIONAR** método `joinAnimalByCode()`
2. **REMOVER** métodos obsoletos: `sendPartnershipInvite()`, `acceptPartnership()`, `rejectPartnership()`, `getUserPartnerships()`
3. **ATUALIZAR** `removePartnership()` → `removePartner()`
4. **ADICIONAR** método `updatePartnerPercentage()`
5. **MANTER** `getAnimalPartners()`, `getUserAnimalsWithPartnerships()`

**Código Refatorado (salvar como backup):**

```typescript
// src/services/partnershipService.ts - VERSÃO REFATORADA

import { supabase } from '@/integrations/supabase/client'
import { handleSupabaseError, logSupabaseOperation } from '@/lib/supabase-helpers'

export interface Partnership {
  id: string
  animal_id: string
  animal_name?: string
  partner_id: string
  partner_name?: string
  partner_property_name?: string
  percentage: number
  joined_at: string
  added_by: string
  created_at: string
  updated_at: string
}

export interface AnimalPartner {
  partner_id: string
  partner_name: string
  partner_property_name: string
  partner_public_code: string
  partner_account_type: string
  percentage: number
  has_active_plan: boolean
  avatar_url?: string
  joined_at?: string
}

class PartnershipService {
  /**
   * ⭐ NOVO: Associar-se a um animal usando código exclusivo
   * @param shareCode Código exclusivo do animal (ex: ANI-R3L4MP4-25)
   * @param userId ID do usuário que está se associando
   */
  async joinAnimalByCode(shareCode: string, userId: string): Promise<Partnership> {
    try {
      logSupabaseOperation('Join animal by code', { shareCode, userId })

      // Validação básica
      if (!shareCode || !userId) {
        throw new Error('Código e ID do usuário são obrigatórios')
      }

      // Normalizar código (uppercase, remover espaços)
      const normalizedCode = shareCode.trim().toUpperCase()

      // 1. Buscar animal pelo código
      const { data: animal, error: animalError } = await supabase
        .from('animals')
        .select('id, name, owner_id')
        .eq('share_code', normalizedCode)
        .single()

      if (animalError || !animal) {
        throw new Error('Código inválido ou animal não encontrado')
      }

      // 2. Validação: Não pode se associar ao próprio animal
      if (animal.owner_id === userId) {
        throw new Error('Você não pode se associar ao seu próprio animal')
      }

      // 3. Validação: Verificar se já é sócio
      const { data: existing } = await supabase
        .from('animal_partnerships')
        .select('id')
        .eq('animal_id', animal.id)
        .eq('partner_id', userId)
        .maybeSingle()

      if (existing) {
        throw new Error('Você já é sócio deste animal')
      }

      // 4. Validação: Limite de 10 sócios
      const { count: partnersCount } = await supabase
        .from('animal_partnerships')
        .select('*', { count: 'exact', head: true })
        .eq('animal_id', animal.id)

      if (partnersCount && partnersCount >= 10) {
        throw new Error('Este animal já atingiu o limite de 10 sócios')
      }

      // 5. Validação: Verificar se usuário tem plano ativo
      const { data: profile } = await supabase
        .from('profiles')
        .select('plan, plan_expires_at, property_name, name')
        .eq('id', userId)
        .single()

      if (!profile) {
        throw new Error('Perfil de usuário não encontrado')
      }

      const hasActivePlan = profile.plan && 
                           profile.plan !== 'free' && 
                           (!profile.plan_expires_at || new Date(profile.plan_expires_at) > new Date())

      if (!hasActivePlan) {
        throw new Error('Você precisa de um plano ativo para se associar a animais')
      }

      // 6. Validação: Verificar limite do plano do usuário
      const { data: currentCount, error: countError } = await supabase
        .rpc('count_active_animals_with_partnerships', { user_id_param: userId })

      if (countError) {
        console.warn('Erro ao contar animais, assumindo 0:', countError)
      }

      const count = currentCount || 0
      const limit = this.getPlanLimit(profile.plan)

      if (count >= limit) {
        throw new Error(`Você atingiu o limite de ${limit} animais ativos do seu plano ${profile.plan}`)
      }

      // 7. Criar sociedade (percentual padrão: 0%, será definido pelo dono)
      const { data, error } = await supabase
        .from('animal_partnerships')
        .insert({
          animal_id: animal.id,
          partner_id: userId,
          partner_haras_name: profile.property_name || profile.name,
          percentage: 0, // Dono define depois
          joined_at: new Date().toISOString(),
          added_by: userId // Auto-adicionado via código
        })
        .select()
        .single()

      if (error) {
        throw handleSupabaseError(error)
      }

      logSupabaseOperation('Join animal by code success', { partnershipId: data.id })
      
      return {
        ...data,
        animal_name: animal.name
      } as Partnership

    } catch (error) {
      logSupabaseOperation('Join animal by code error', null, error)
      throw error
    }
  }

  /**
   * ATUALIZADO: Remover sócio (apenas o DONO pode fazer)
   * @param partnershipId ID da sociedade
   * @param ownerId ID do dono (validação)
   */
  async removePartner(partnershipId: string, ownerId: string): Promise<void> {
    try {
      logSupabaseOperation('Remove partner', { partnershipId, ownerId })

      // Verificar se usuário é o dono do animal
      const { data: partnership, error: checkError } = await supabase
        .from('animal_partnerships')
        .select(`
          id,
          animals!inner (
            id,
            owner_id
          )
        `)
        .eq('id', partnershipId)
        .single()

      if (checkError || !partnership) {
        throw new Error('Sociedade não encontrada')
      }

      // @ts-ignore
      if (partnership.animals.owner_id !== ownerId) {
        throw new Error('Apenas o proprietário do animal pode remover sócios')
      }

      // Deletar sociedade
      const { error } = await supabase
        .from('animal_partnerships')
        .delete()
        .eq('id', partnershipId)

      if (error) {
        throw handleSupabaseError(error)
      }

      logSupabaseOperation('Remove partner success', { partnershipId })

    } catch (error) {
      logSupabaseOperation('Remove partner error', null, error)
      throw error
    }
  }

  /**
   * ⭐ NOVO: Atualizar percentual de um sócio (apenas o DONO pode fazer)
   * @param partnershipId ID da sociedade
   * @param ownerId ID do dono (validação)
   * @param percentage Novo percentual (0-100)
   */
  async updatePartnerPercentage(
    partnershipId: string, 
    ownerId: string, 
    percentage: number
  ): Promise<void> {
    try {
      logSupabaseOperation('Update partner percentage', { partnershipId, ownerId, percentage })

      if (percentage < 0 || percentage > 100) {
        throw new Error('Percentual deve estar entre 0 e 100')
      }

      // Verificar se usuário é o dono
      const { data: partnership, error: checkError } = await supabase
        .from('animal_partnerships')
        .select(`
          id,
          animals!inner (owner_id)
        `)
        .eq('id', partnershipId)
        .single()

      if (checkError || !partnership) {
        throw new Error('Sociedade não encontrada')
      }

      // @ts-ignore
      if (partnership.animals.owner_id !== ownerId) {
        throw new Error('Apenas o proprietário pode atualizar percentuais')
      }

      // Atualizar percentual
      const { error } = await supabase
        .from('animal_partnerships')
        .update({ 
          percentage, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', partnershipId)

      if (error) {
        throw handleSupabaseError(error)
      }

      logSupabaseOperation('Update partner percentage success', { partnershipId, percentage })

    } catch (error) {
      logSupabaseOperation('Update partner percentage error', null, error)
      throw error
    }
  }

  /**
   * ATUALIZADO: Sair de uma sociedade (o próprio sócio se remove)
   * @param partnershipId ID da sociedade
   * @param userId ID do usuário (deve ser o partner_id)
   */
  async leavePartnership(partnershipId: string, userId: string): Promise<void> {
    try {
      logSupabaseOperation('Leave partnership', { partnershipId, userId })

      // Verificar se o usuário é o sócio
      const { data: partnership, error: checkError } = await supabase
        .from('animal_partnerships')
        .select('id, partner_id')
        .eq('id', partnershipId)
        .single()

      if (checkError || !partnership) {
        throw new Error('Sociedade não encontrada')
      }

      if (partnership.partner_id !== userId) {
        throw new Error('Você não é sócio deste animal')
      }

      // Deletar sociedade
      const { error } = await supabase
        .from('animal_partnerships')
        .delete()
        .eq('id', partnershipId)

      if (error) {
        throw handleSupabaseError(error)
      }

      logSupabaseOperation('Leave partnership success', { partnershipId })

    } catch (error) {
      logSupabaseOperation('Leave partnership error', null, error)
      throw error
    }
  }

  /**
   * MANTER: Buscar sócios de um animal (apenas ativos)
   * @param animalId ID do animal
   */
  async getAnimalPartners(animalId: string): Promise<AnimalPartner[]> {
    try {
      logSupabaseOperation('Get animal partners', { animalId })

      const { data, error } = await supabase
        .from('animal_partnerships')
        .select(`
          partner_id,
          percentage,
          joined_at,
          profiles:partner_id (
            name,
            property_name,
            public_code,
            account_type,
            avatar_url,
            plan,
            plan_expires_at
          )
        `)
        .eq('animal_id', animalId)

      if (error) {
        throw handleSupabaseError(error)
      }

      // Formatar e calcular plano ativo
      const partners = (data || []).map((p: any) => {
        const profile = p.profiles
        const hasActivePlan = profile.plan && 
                             profile.plan !== 'free' && 
                             (!profile.plan_expires_at || new Date(profile.plan_expires_at) > new Date())

        return {
          partner_id: p.partner_id,
          partner_name: profile.name,
          partner_property_name: profile.property_name || profile.name,
          partner_public_code: profile.public_code,
          partner_account_type: profile.account_type,
          percentage: p.percentage,
          has_active_plan: hasActivePlan,
          avatar_url: profile.avatar_url,
          joined_at: p.joined_at
        }
      })

      logSupabaseOperation('Get animal partners success', { count: partners.length })

      return partners

    } catch (error) {
      logSupabaseOperation('Get animal partners error', null, error)
      throw error
    }
  }

  /**
   * MANTER: Buscar animais do usuário considerando sociedades
   * @param userId ID do usuário
   */
  async getUserAnimalsWithPartnerships(userId: string): Promise<any[]> {
    try {
      logSupabaseOperation('Get user animals with partnerships', { userId })

      // Buscar animais próprios
      const { data: ownAnimals, error: ownError } = await supabase
        .from('animals_with_stats')
        .select('*')
        .eq('owner_id', userId)
        .order('created_at', { ascending: false })

      if (ownError) {
        throw handleSupabaseError(ownError)
      }

      // Buscar perfil do usuário
      const { data: profile } = await supabase
        .from('profiles')
        .select('plan, plan_expires_at')
        .eq('id', userId)
        .single()

      // Verificar se tem plano ativo
      const hasActivePlan = profile?.plan && 
                           profile.plan !== 'free' && 
                           (!profile.plan_expires_at || new Date(profile.plan_expires_at) > new Date())

      let partnerAnimals = []

      // Se tem plano ativo, buscar animais em sociedade
      if (hasActivePlan) {
        const { data: partnerships, error: partError } = await supabase
          .from('animal_partnerships')
          .select(`
            animal_id,
            percentage,
            animals_with_stats (*)
          `)
          .eq('partner_id', userId)

        if (!partError && partnerships) {
          partnerAnimals = partnerships
            .filter(p => p.animals_with_stats) // Filtrar animais que existem
            .map(p => ({
              ...p.animals_with_stats,
              is_partnership: true,
              my_percentage: p.percentage
            }))
        }
      }

      // Para animais próprios, verificar se eles têm sócios ativos
      const ownAnimalsWithPartnershipFlag = await Promise.all(
        (ownAnimals || []).map(async (animal) => {
          const { data: partners } = await supabase
            .from('animal_partnerships')
            .select('id')
            .eq('animal_id', animal.id)
            .limit(1)

          return {
            ...animal,
            is_partnership: false,
            has_active_partnerships: (partners && partners.length > 0)
          }
        })
      )

      const allAnimals = [
        ...ownAnimalsWithPartnershipFlag,
        ...partnerAnimals.map(a => ({ ...a, has_active_partnerships: true }))
      ]

      logSupabaseOperation('Get user animals with partnerships success', {
        ownCount: ownAnimals?.length || 0,
        partnerCount: partnerAnimals.length,
        total: allAnimals.length
      })

      return allAnimals

    } catch (error) {
      logSupabaseOperation('Get user animals with partnerships error', null, error)
      throw error
    }
  }

  /**
   * MANTER: Verificar se um animal tem sociedades ativas
   * @param animalId ID do animal
   */
  async hasActivePartnerships(animalId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('animal_partnerships')
        .select('id')
        .eq('animal_id', animalId)
        .limit(1)

      if (error) {
        console.error('Erro ao verificar sociedades:', error)
        return false
      }

      return data && data.length > 0
    } catch (error) {
      console.error('Erro ao verificar sociedades:', error)
      return false
    }
  }

  /**
   * ⭐ NOVO: Buscar minhas sociedades (onde sou sócio)
   * @param userId ID do usuário
   */
  async getMyPartnerships(userId: string): Promise<Partnership[]> {
    try {
      const { data, error } = await supabase
        .from('animal_partnerships')
        .select(`
          *,
          animals (
            id,
            name,
            share_code,
            owner_id,
            profiles:owner_id (
              name,
              property_name
            )
          )
        `)
        .eq('partner_id', userId)
        .order('joined_at', { ascending: false })

      if (error) {
        throw handleSupabaseError(error)
      }

      return (data || []).map((p: any) => ({
        ...p,
        animal_name: p.animals?.name,
        owner_name: p.animals?.profiles?.property_name || p.animals?.profiles?.name
      }))

    } catch (error) {
      console.error('Erro ao buscar minhas sociedades:', error)
      throw error
    }
  }

  /**
   * HELPER: Obter limite de animais por plano
   */
  private getPlanLimit(plan: string): number {
    switch (plan) {
      case 'basic': return 10
      case 'pro': return 15
      case 'ultra': return 25
      case 'vip': return 15
      default: return 0
    }
  }
}

export const partnershipService = new PartnershipService()
```

**Ação:**
1. Fazer backup do arquivo original: `cp src/services/partnershipService.ts src/services/partnershipService.ts.backup`
2. Substituir conteúdo com código acima
3. Salvar arquivo

**Validação:**
```bash
# Verificar se não há erros de TypeScript
npm run type-check

# Ou se usar yarn
yarn type-check
```

---

### Passo 2.2: Atualizar Interfaces TypeScript

**Arquivo:** `src/types/supabase.ts` (se existir) ou verificar em `partnershipService.ts`

**Adicionar/Atualizar:**
```typescript
export interface Animal {
  // ... campos existentes ...
  share_code: string  // ⭐ ADICIONAR
}

export interface Partnership {
  // ... campos existentes ...
  joined_at: string  // ⭐ ADICIONAR
  added_by: string   // ⭐ ADICIONAR
  // REMOVER: status
}
```

---

## 🎨 FASE 3: FRONTEND - REACT (4-5 horas)

### Passo 3.1: Refatorar `SocietyPage.tsx`

**Arquivo:** `src/pages/dashboard/SocietyPage.tsx`

**Mudanças:**
1. Remover lógica de convites pendentes/enviados
2. Adicionar campo de input para código
3. Adicionar seção "Meus Animais" com botão "Copiar Código"
4. Adicionar seção "Sociedades Ativas" (onde sou sócio)

**Arquivo Refatorado Completo:**

```typescript
// src/pages/dashboard/SocietyPage.tsx - VERSÃO REFATORADA

import React, { useState, useEffect } from 'react';
import { Users, Copy, Check, Loader2, Share2, AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import DashboardPageWrapper from '@/components/layout/DashboardPageWrapper';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { partnershipService } from '@/services/partnershipService';
import { animalService } from '@/services/animalService';

const SocietyPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Estados
  const [shareCode, setShareCode] = useState('');
  const [myAnimals, setMyAnimals] = useState([]);
  const [myPartnerships, setMyPartnerships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [copiedCode, setCopiedCode] = useState('');

  // Carregar dados
  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [user?.id]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Buscar meus animais (para compartilhar código)
      const animals = await animalService.getUserAnimals(user.id);
      setMyAnimals(animals);

      // Buscar sociedades onde sou sócio
      const partnerships = await partnershipService.getMyPartnerships(user.id);
      setMyPartnerships(partnerships);

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: 'Erro ao carregar dados',
        description: error.message || 'Não foi possível carregar suas sociedades',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleJoinAnimal = async () => {
    if (!shareCode.trim()) {
      toast({
        title: 'Código obrigatório',
        description: 'Por favor, insira o código do animal',
        variant: 'destructive'
      });
      return;
    }

    try {
      setJoining(true);
      
      await partnershipService.joinAnimalByCode(shareCode, user.id);
      
      toast({
        title: 'Sucesso!',
        description: 'Você agora é sócio deste animal. Ele já aparece em "Meus Animais".',
      });
      
      setShareCode(''); // Limpar campo
      loadData(); // Recarregar dados
      
    } catch (error) {
      toast({
        title: 'Erro ao se associar',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setJoining(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    
    toast({
      title: 'Código copiado!',
      description: 'Compartilhe este código com outras pessoas para que se tornem sócias.',
    });

    // Resetar ícone após 2s
    setTimeout(() => setCopiedCode(''), 2000);
  };

  const handleLeavePartnership = async (partnershipId: string, animalName: string) => {
    if (!confirm(`Tem certeza que deseja sair da sociedade do animal "${animalName}"?`)) {
      return;
    }

    try {
      await partnershipService.leavePartnership(partnershipId, user.id);
      
      toast({
        title: 'Você saiu da sociedade',
        description: `Animal "${animalName}" removido de seus animais.`,
      });
      
      loadData();
      
    } catch (error) {
      toast({
        title: 'Erro ao sair',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return (
      <DashboardPageWrapper title="Sociedades">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </DashboardPageWrapper>
    );
  }

  return (
    <ProtectedRoute>
      <DashboardPageWrapper title="Sociedades">
        {/* Seção 1: Associar-se a um Animal */}
        <Card className="p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold">Associar-se a um Animal</h3>
          </div>
          
          <p className="text-sm text-gray-600 mb-4">
            Insira o código exclusivo do animal para se tornar sócio instantaneamente.
          </p>
          
          <div className="flex gap-2">
            <Input
              placeholder="Ex: ANI-R3L4MP-25"
              value={shareCode}
              onChange={(e) => setShareCode(e.target.value.toUpperCase())}
              className="flex-1 font-mono"
              disabled={joining}
            />
            <Button 
              onClick={handleJoinAnimal}
              disabled={joining || !shareCode.trim()}
            >
              {joining ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Associando...
                </>
              ) : (
                <>
                  <Users className="h-4 w-4 mr-2" />
                  Associar
                </>
              )}
            </Button>
          </div>

          <Alert className="mt-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Importante:</strong> Ao se associar, o animal contará no limite do seu plano. 
              Você precisa de um plano ativo para se associar.
            </AlertDescription>
          </Alert>
        </Card>

        {/* Seção 2: Meus Animais - Compartilhar Código */}
        <Card className="p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Share2 className="h-5 w-5 text-green-600" />
            <h3 className="text-lg font-semibold">Meus Animais - Compartilhar Código</h3>
          </div>
          
          <p className="text-sm text-gray-600 mb-4">
            Compartilhe o código dos seus animais para adicionar sócios.
          </p>

          {myAnimals.length === 0 ? (
            <p className="text-sm text-gray-500 italic">
              Você ainda não possui animais cadastrados.
            </p>
          ) : (
            <div className="space-y-3">
              {myAnimals.map(animal => (
                <div 
                  key={animal.id} 
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition"
                >
                  <div className="flex-1">
                    <p className="font-medium">{animal.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500">Código:</span>
                      <code className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs font-mono">
                        {animal.share_code}
                      </code>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCopyCode(animal.share_code)}
                  >
                    {copiedCode === animal.share_code ? (
                      <>
                        <Check className="h-4 w-4 mr-1 text-green-600" />
                        Copiado
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-1" />
                        Copiar
                      </>
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Seção 3: Sociedades Ativas (onde sou sócio) */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-5 w-5 text-purple-600" />
            <h3 className="text-lg font-semibold">Sociedades Ativas</h3>
            <Badge variant="secondary">{myPartnerships.length}</Badge>
          </div>
          
          <p className="text-sm text-gray-600 mb-4">
            Animais em que você é sócio.
          </p>

          {myPartnerships.length === 0 ? (
            <p className="text-sm text-gray-500 italic">
              Você ainda não é sócio de nenhum animal.
            </p>
          ) : (
            <div className="space-y-3">
              {myPartnerships.map(partnership => (
                <div 
                  key={partnership.id} 
                  className="p-4 border rounded-lg"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-medium text-lg">{partnership.animal_name}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        Proprietário: {partnership.owner_name}
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        <Badge variant="secondary">
                          {partnership.percentage}% de participação
                        </Badge>
                        <span className="text-xs text-gray-500">
                          Desde {new Date(partnership.joined_at).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleLeavePartnership(partnership.id, partnership.animal_name)}
                    >
                      Sair
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </DashboardPageWrapper>
    </ProtectedRoute>
  );
};

export default SocietyPage;
```

**Ação:**
1. Backup: `cp src/pages/dashboard/SocietyPage.tsx src/pages/dashboard/SocietyPage.tsx.backup`
2. Substituir conteúdo
3. Salvar

---

### Passo 3.2: Atualizar `AnimalPage.tsx` (Adicionar Seção de Código)

**Arquivo:** `src/pages/animal/AnimalPage.tsx`

**Localizar seção onde exibe informações do animal e ADICIONAR antes do Quadro Societário:**

```typescript
{/* ⭐ NOVO: Seção de Código para Compartilhar (apenas dono) */}
{isOwner && (
  <Card className="p-4 bg-blue-50 border-blue-200 mb-6">
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <Share2 className="h-4 w-4 text-blue-700" />
          <p className="text-sm font-semibold text-blue-900">
            Código para Compartilhar
          </p>
        </div>
        <p className="text-xs text-blue-700">
          Compartilhe este código para adicionar sócios ao animal
        </p>
      </div>
      <div className="flex items-center gap-2">
        <code className="px-3 py-2 bg-white border border-blue-300 rounded font-mono text-sm font-bold">
          {horse.share_code || 'Carregando...'}
        </code>
        <Button 
          size="sm" 
          variant="outline"
          className="border-blue-300 hover:bg-blue-100"
          onClick={() => {
            navigator.clipboard.writeText(horse.share_code);
            toast({
              title: 'Código copiado!',
              description: 'Compartilhe com outras pessoas para adicionar como sócios.',
            });
          }}
        >
          <Copy className="h-4 w-4" />
        </Button>
      </div>
    </div>
  </Card>
)}
```

**Importar:**
```typescript
import { Share2, Copy } from 'lucide-react'; // Adicionar Share2 e Copy
```

---

### Passo 3.3: Validar Componentes

**Checklist:**
- [ ] `SocietyPage.tsx` compilando sem erros
- [ ] `AnimalPage.tsx` compilando sem erros
- [ ] Imports corretos
- [ ] Não há erros de TypeScript

**Comando:**
```bash
npm run dev
# Ou
yarn dev
```

Abrir `http://localhost:5173` (ou porta configurada) e verificar:
- Dashboard → Sociedades carrega sem erros
- Página de Animal carrega e exibe código (se for dono)

---

## ✅ FASE 4: TESTES E VALIDAÇÃO (2-3 horas)

### Teste 1: Associar-se a um Animal

**Cenário:**
1. Abrir Dashboard → Sociedades
2. Inserir código de um animal (pegar de "Meus Animais")
3. Clicar "Associar"

**Resultado Esperado:**
- ✅ Mensagem "Sucesso! Você agora é sócio..."
- ✅ Animal aparece em "Sociedades Ativas"
- ✅ Animal aparece em "Dashboard → Meus Animais" com badge "Sócio"

---

### Teste 2: Copiar Código do Animal

**Cenário:**
1. Ir em "Meus Animais - Compartilhar Código"
2. Clicar "Copiar Código"

**Resultado Esperado:**
- ✅ Toast "Código copiado!"
- ✅ Botão muda para "Copiado" com ícone de check
- ✅ Código está na área de transferência (Ctrl+V para testar)

---

### Teste 3: Sair de Sociedade

**Cenário:**
1. Ir em "Sociedades Ativas"
2. Clicar "Sair" em uma sociedade
3. Confirmar popup

**Resultado Esperado:**
- ✅ Sociedade removida da lista
- ✅ Animal desaparece de "Meus Animais"
- ✅ Toast "Você saiu da sociedade"

---

### Teste 4: Validações

**Cenário A: Código Inválido**
- Inserir código "ABC-123-45" (inexistente)
- Resultado: ❌ "Código inválido ou animal não encontrado"

**Cenário B: Já é Sócio**
- Inserir código de animal que já sou sócio
- Resultado: ❌ "Você já é sócio deste animal"

**Cenário C: Auto-Associação**
- Inserir código do próprio animal
- Resultado: ❌ "Você não pode se associar ao seu próprio animal"

**Cenário D: Limite de Sócios**
- Animal com 10 sócios, tentar associar 11º
- Resultado: ❌ "Este animal já atingiu o limite de 10 sócios"

**Cenário E: Sem Plano Ativo**
- Usuário FREE tenta se associar
- Resultado: ❌ "Você precisa de um plano ativo para se associar a animais"

---

## 📊 FASE 5: MONITORAMENTO E AJUSTES (1 hora)

### Checklist Final

#### Backend
- [ ] Migration 065 aplicada com sucesso
- [ ] Todos os animais têm `share_code`
- [ ] Nenhum código duplicado
- [ ] Coluna `status` removida de `animal_partnerships`
- [ ] Funções SQL atualizadas
- [ ] Trigger funcionando (criar animal gera código automaticamente)

#### Service Layer
- [ ] `partnershipService.ts` refatorado
- [ ] Método `joinAnimalByCode()` implementado
- [ ] Métodos obsoletos removidos
- [ ] Sem erros de TypeScript

#### Frontend
- [ ] `SocietyPage.tsx` refatorada
- [ ] `AnimalPage.tsx` exibindo código
- [ ] Interface limpa e intuitiva
- [ ] Todos os testes passando

#### Documentação
- [ ] Relatório de auditoria lido
- [ ] Este guia seguido completamente
- [ ] Código commitado no Git
- [ ] README atualizado (se necessário)

---

## 🚨 TROUBLESHOOTING

### Problema: Migration 065 falha com "função create_notification não encontrada"

**Solução:**
```sql
-- Verificar se migration 042 (notificações) foi aplicada
SELECT routine_name 
FROM information_schema.routines
WHERE routine_name = 'create_notification';

-- Se não retornar nada, aplicar migration 042 primeiro
```

---

### Problema: Códigos duplicados gerados

**Solução:**
```sql
-- Listar duplicações
SELECT share_code, COUNT(*) as count
FROM animals
GROUP BY share_code
HAVING COUNT(*) > 1;

-- Regenerar códigos duplicados
UPDATE animals
SET share_code = generate_animal_share_code()
WHERE id IN (
  SELECT id FROM animals
  WHERE share_code IN (
    SELECT share_code FROM animals
    GROUP BY share_code HAVING COUNT(*) > 1
  )
);
```

---

### Problema: Frontend não compila após mudanças

**Solução:**
```bash
# Limpar cache
rm -rf node_modules/.cache
rm -rf dist

# Reinstalar dependências
npm install

# Tentar novamente
npm run dev
```

---

### Problema: Animal não aparece após associação

**Verificações:**
1. Usuário tem plano ativo?
2. Sociedade foi criada no banco?
```sql
SELECT * FROM animal_partnerships 
WHERE partner_id = 'USER_ID_AQUI'
ORDER BY created_at DESC
LIMIT 5;
```
3. Função `get_profile_animals()` está retornando?
```sql
SELECT * FROM get_profile_animals('USER_ID_AQUI');
```

---

## 🎉 CONCLUSÃO

Se você chegou até aqui e todos os checks estão ✅, **PARABÉNS!**

Você implementou com sucesso o **Sistema de Código Exclusivo por Animal**, substituindo o antigo modelo de convites.

### Próximos Passos Sugeridos:

1. **Deploy em Staging:** Testar em ambiente de staging antes de produção
2. **Comunicar Usuários:** Avisar sobre a mudança no sistema
3. **Monitorar Logs:** Acompanhar erros nas primeiras 48h
4. **Coletar Feedback:** Perguntar aos usuários se o novo fluxo é mais intuitivo
5. **Otimizações Futuras:**
   - Regenerar código (se comprometido)
   - QR Code para compartilhamento
   - Analytics de uso de códigos

---

**Desenvolvido por:** Engenheiro Sênior  
**Data:** 17/11/2025  
**Versão:** 1.0  
**Referência:** RELATORIO_AUDITORIA_SOCIEDADES_PROFISSIONAL_2025-11-17.md

---

**FIM DO GUIA**

