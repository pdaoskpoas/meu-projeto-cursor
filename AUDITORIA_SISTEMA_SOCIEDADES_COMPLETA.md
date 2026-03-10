# 🔍 AUDITORIA COMPLETA - SISTEMA DE SOCIEDADES
## Data: 04/11/2025
## Status: PROBLEMAS CRÍTICOS IDENTIFICADOS

---

## 📊 RESUMO EXECUTIVO

O sistema de sociedades (partnerships) está **parcialmente implementado** mas com **problemas críticos** que impedem seu funcionamento correto:

### ✅ O QUE ESTÁ FUNCIONANDO
1. **Tabela `animal_partnerships` existe** no banco de dados
2. **Notificações de convites** estão configuradas (migration 042)
3. **Badges de contadores** funcionam (useUnreadCounts)
4. **RLS Policies** básicas estão implementadas

### ❌ PROBLEMAS CRÍTICOS ENCONTRADOS

#### 1. **PÁGINA DE SOCIEDADES USA DADOS MOCK** 🚨
**Arquivo:** `src/pages/dashboard/SocietyPage.tsx`
- Usa dados hardcoded (linhas 36-55)
- Não conecta com o banco de dados real
- Não permite enviar/aceitar convites reais
- Não exibe sociedades reais do usuário

#### 2. **NÃO HÁ SERVIÇO DEDICADO** 🚨
- Não existe `partnershipService.ts`
- Todas as operações precisam ser feitas manualmente via Supabase
- Falta lógica de negócio centralizada

#### 3. **CONTAGEM DE LIMITES NÃO CONSIDERA SOCIEDADES** 🚨
**Arquivo:** `src/services/animalService.ts` (linha 49-58)
```typescript
private async countActiveAnimals(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('animals')
    .select('*', { count: 'exact', head: true })
    .eq('owner_id', userId)  // ❌ SÓ CONTA ANIMAIS PRÓPRIOS
    .eq('ad_status', 'active')
    .eq('is_individual_paid', false)
  return count ?? 0
}
```
**Problema:** Não conta animais em sociedade aceitos (status='accepted')

#### 4. **NÃO EXIBE SÓCIOS NOS ANÚNCIOS** 🚨
**Arquivos:** `src/pages/animal/AnimalPage.tsx`, `src/components/AnimalCard.tsx`
- Anúncios não mostram os sócios com plano ativo
- Não há seção "Quadro Societário"
- Usuários não sabem quem são os parceiros

#### 5. **LÓGICA DE MENSAGENS NÃO CONSIDERA SOCIEDADES** 🚨
**Arquivo:** `src/services/messageService.ts`
- Conversas são criadas sempre com `animal_owner_id`
- Sócios não recebem mensagens sobre o animal
- Falta definir: mensagem vai para o dono original ou todos os sócios?

#### 6. **EXIBIÇÃO NO PERFIL NÃO FILTRA POR PLANO ATIVO** 🚨
**Arquivo:** `src/pages/HarasPage.tsx` (linha 93-98)
```typescript
const { data: animalsData, error: animalsError } = await supabase
  .from('animals_with_stats')
  .select('*')
  .eq('owner_id', id)  // ❌ SÓ BUSCA ANIMAIS PRÓPRIOS
  .eq('ad_status', 'active')
```
**Problema:** Não busca animais onde o usuário é sócio com plano ativo

#### 7. **FALTA VIEW/FUNÇÃO PARA QUERIES COMPLEXAS** 🚨
Não há view SQL que:
- Retorne animais considerando sociedades aceitas
- Filtre por plano ativo dos sócios
- Facilite queries complexas

---

## 🎯 REQUISITOS DE NEGÓCIO (ESPECIFICAÇÃO)

### 1. **Enviar Convite de Sociedade**
- Proprietário do animal pode convidar outro usuário via código público
- Pode definir percentual de participação (0-100%)
- Sistema envia notificação para o convidado
- Status inicial: `pending`

### 2. **Receber e Aceitar Convite**
- Usuário recebe notificação
- Pode aceitar ou rejeitar
- Ao aceitar: status muda para `accepted`
- Ao rejeitar: status muda para `rejected`

### 3. **Contagem de Limite de Animais**
**REGRA CRÍTICA:**
- Se usuário tem limite de 10 animais ativos
- Aceita 1 convite de sociedade
- Agora tem 9 slots disponíveis (10 - 1 = 9)
- Sociedade aceita **CONTA COMO ANÚNCIO ATIVO**

### 4. **Exibição no Perfil do Haras**
**REGRAS:**
- Animal aparece no perfil de **TODOS** os sócios
- **MAS APENAS** se o sócio tiver **plano ativo**
- Se sócio voltar a ser FREE: animal **NÃO APARECE** no perfil dele
- Dono original (owner_id) sempre vê, independente de plano

### 5. **Exibição no Anúncio (AnimalPage)**
**REGRAS:**
- Mostrar seção "Quadro Societário"
- Listar **APENAS** sócios com **plano ativo** (status='accepted')
- Mostrar: foto, nome do haras, percentual
- Se sócio voltar a FREE: **SAI DA LISTA**

### 6. **Sistema de Mensagens**
**DECISÃO NECESSÁRIA:**
Opção A: Mensagens vão apenas para o dono original (owner_id)
Opção B: Todos os sócios com plano ativo recebem (múltiplas conversas)
Opção C: Criar conversa em grupo (mais complexo)

**RECOMENDAÇÃO:** Opção A (mais simples, menos complexo)

### 7. **Plano Ativo vs Free**
**REGRAS:**
```
Cenário 1: Dono e Sócio ambos com plano ativo
- Animal aparece nos 2 perfis ✅
- Ambos aparecem no quadro societário ✅
- Ambos contam no limite ✅

Cenário 2: Dono com plano, Sócio FREE
- Animal aparece só no perfil do dono ✅
- Só o dono aparece no quadro societário ✅
- Só o dono conta no limite ✅

Cenário 3: Dono FREE, Sócio com plano
- Animal NÃO aparece em lugar nenhum ❌
- Motivo: owner_id (dono) precisa ter plano para manter anúncio ativo

Cenário 4: Ambos FREE
- Animal fica pausado/expirado ❌
```

---

## 🔧 CORREÇÕES NECESSÁRIAS

### **FASE 1: BACKEND E LÓGICA DE NEGÓCIO**

#### 1.1. Criar Serviço de Sociedades
**Arquivo:** `src/services/partnershipService.ts`

Funcionalidades:
- `sendPartnershipInvite(animalId, partnerCode, percentage)`
- `acceptPartnership(partnershipId)`
- `rejectPartnership(partnershipId)`
- `getUserPartnerships(userId)` - retorna convites e sociedades ativas
- `getAnimalPartnerships(animalId)` - retorna sócios do animal
- `removePartnership(partnershipId)` - remover sócio

#### 1.2. Criar View SQL: `animals_with_partnerships`
**Migration:** `046_create_partnerships_views.sql`

```sql
CREATE VIEW animals_with_partnerships AS
SELECT 
    a.*,
    -- Array de sócios com plano ativo
    COALESCE(
        json_agg(
            json_build_object(
                'partner_id', ap.partner_id,
                'partner_name', p.name,
                'partner_haras_name', p.haras_name,
                'partner_public_code', p.public_code,
                'percentage', ap.percentage,
                'has_active_plan', (p.plan IS NOT NULL 
                    AND p.plan != 'free' 
                    AND (p.plan_expires_at IS NULL OR p.plan_expires_at > NOW()))
            )
        ) FILTER (WHERE ap.status = 'accepted'),
        '[]'::json
    ) as partners
FROM animals a
LEFT JOIN animal_partnerships ap ON a.id = ap.animal_id
LEFT JOIN profiles p ON ap.partner_id = p.id
GROUP BY a.id;
```

#### 1.3. Criar Função SQL: Contar Animais com Sociedades
**Migration:** `046_create_partnerships_views.sql`

```sql
CREATE OR REPLACE FUNCTION count_active_animals_with_partnerships(user_id_param UUID)
RETURNS INTEGER AS $$
DECLARE
    total_count INTEGER;
BEGIN
    -- Contar animais próprios + sociedades aceitas
    SELECT COUNT(DISTINCT animal_id)::INTEGER INTO total_count
    FROM (
        -- Animais próprios ativos
        SELECT id as animal_id
        FROM animals
        WHERE owner_id = user_id_param
          AND ad_status = 'active'
          AND is_individual_paid = false
        
        UNION
        
        -- Animais em sociedade aceitos
        SELECT animal_id
        FROM animal_partnerships
        WHERE partner_id = user_id_param
          AND status = 'accepted'
          AND EXISTS (
              SELECT 1 FROM animals
              WHERE id = animal_partnerships.animal_id
                AND ad_status = 'active'
          )
    ) combined;
    
    RETURN COALESCE(total_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### 1.4. Atualizar `animalService.ts`
Modificar `countActiveAnimals()` para usar a nova função:

```typescript
private async countActiveAnimals(userId: string): Promise<number> {
  const { data, error } = await supabase
    .rpc('count_active_animals_with_partnerships', { user_id_param: userId })
  
  if (error) throw handleSupabaseError(error)
  return data ?? 0
}
```

#### 1.5. Criar RLS Policies para Exibição Condicional
**Migration:** `046_create_partnerships_views.sql`

```sql
-- Policy: Sócios podem ver animais onde são parceiros APENAS se tiverem plano ativo
CREATE POLICY "Partners with active plan can view animals" ON animals
    FOR SELECT USING (
        auth.uid() IN (
            SELECT ap.partner_id
            FROM animal_partnerships ap
            JOIN profiles p ON ap.partner_id = p.id
            WHERE ap.animal_id = animals.id
              AND ap.status = 'accepted'
              AND p.plan IS NOT NULL
              AND p.plan != 'free'
              AND (p.plan_expires_at IS NULL OR p.plan_expires_at > NOW())
        )
    );
```

### **FASE 2: FRONTEND E UX**

#### 2.1. Refatorar `SocietyPage.tsx`
- Remover dados mock
- Conectar com `partnershipService`
- Buscar dados reais do Supabase
- Implementar envio/aceitação de convites

#### 2.2. Adicionar Seção "Quadro Societário" em `AnimalPage.tsx`
```tsx
{/* Quadro Societário */}
{partners.filter(p => p.has_active_plan).length > 0 && (
  <Card className="p-6">
    <h3 className="text-lg font-semibold mb-4">Quadro Societário</h3>
    <div className="space-y-3">
      {partners.filter(p => p.has_active_plan).map(partner => (
        <div key={partner.partner_id} className="flex items-center gap-3">
          <Avatar />
          <div className="flex-1">
            <p className="font-medium">{partner.partner_haras_name}</p>
            <p className="text-sm text-gray-600">{partner.percentage}% de participação</p>
          </div>
          <Badge>{partner.partner_public_code}</Badge>
        </div>
      ))}
    </div>
  </Card>
)}
```

#### 2.3. Atualizar `HarasPage.tsx`
Buscar animais considerando sociedades:

```typescript
// Buscar animais próprios
const { data: ownAnimals } = await supabase
  .from('animals_with_stats')
  .select('*')
  .eq('owner_id', id)
  .eq('ad_status', 'active');

// Buscar animais em sociedade (se usuário tem plano ativo)
const { data: profile } = await supabase
  .from('profiles')
  .select('plan, plan_expires_at')
  .eq('id', id)
  .single();

let partnerAnimals = [];
if (profile?.plan && profile.plan !== 'free' && 
    (!profile.plan_expires_at || new Date(profile.plan_expires_at) > new Date())) {
  const { data } = await supabase
    .from('animal_partnerships')
    .select('animal_id, animals_with_stats(*)')
    .eq('partner_id', id)
    .eq('status', 'accepted');
  
  partnerAnimals = data?.map(p => p.animals_with_stats) || [];
}

const allAnimals = [...(ownAnimals || []), ...partnerAnimals];
```

#### 2.4. Adicionar Badge Visual nos Cards
```tsx
{animal.is_partnership && (
  <Badge variant="secondary" className="absolute top-2 right-2">
    <Users className="h-3 w-3 mr-1" />
    Sociedade
  </Badge>
)}
```

### **FASE 3: TESTES E VALIDAÇÃO**

#### 3.1. Cenários de Teste
1. **Teste 1:** Usuário A (plano PRO, 15 animais) convida Usuário B
2. **Teste 2:** Usuário B aceita - verificar contagem (A: 14/15, B: 1/10)
3. **Teste 3:** Usuário B vira FREE - animal deve sumir do perfil de B
4. **Teste 4:** Verificar quadro societário exibe apenas sócios com plano
5. **Teste 5:** Testar mensagens - verificar quem recebe

#### 3.2. Checklist de Validação
- [ ] Convites são enviados e notificações aparecem
- [ ] Aceitação/rejeição funciona
- [ ] Contagem de limites está correta
- [ ] Perfil exibe animais em sociedade (se plano ativo)
- [ ] Anúncio mostra quadro societário
- [ ] Sócio FREE não aparece em lugar nenhum
- [ ] Badges e contadores estão corretos

---

## 🎨 MELHORIAS DE UX (SUGESTÕES)

### 1. **Visualização Clara de Status**
```tsx
<Badge variant={partnership.status === 'accepted' ? 'success' : 'warning'}>
  {partnership.status === 'accepted' ? '✓ Ativa' : '⏳ Pendente'}
</Badge>
```

### 2. **Alertas de Limite**
```tsx
{remainingSlots === 1 && (
  <Alert>
    <AlertTriangle />
    <AlertDescription>
      Você tem apenas 1 slot disponível. Aceitar este convite 
      ocupará seu último espaço.
    </AlertDescription>
  </Alert>
)}
```

### 3. **Tooltip Explicativo**
```tsx
<Tooltip content="Este animal está em sociedade. Aparecerá em múltiplos perfis.">
  <Users className="h-4 w-4" />
</Tooltip>
```

### 4. **Histórico de Sociedades**
- Mostrar quando foi criada
- Mostrar histórico de mudanças de percentual
- Mostrar quando sócios entraram/saíram

---

## 📋 ORDEM DE IMPLEMENTAÇÃO RECOMENDADA

### Prioridade ALTA (Crítico)
1. ✅ Criar `partnershipService.ts`
2. ✅ Criar migration `046_create_partnerships_views.sql`
3. ✅ Atualizar `animalService.countActiveAnimals()`
4. ✅ Refatorar `SocietyPage.tsx` (remover mock data)
5. ✅ Atualizar `HarasPage.tsx` (buscar animais em sociedade)

### Prioridade MÉDIA (Importante)
6. ✅ Adicionar quadro societário em `AnimalPage.tsx`
7. ✅ Adicionar badges visuais nos cards
8. ✅ Implementar RLS policies condicionais
9. ✅ Atualizar contadores e badges

### Prioridade BAIXA (Melhorias)
10. ⚪ Definir lógica de mensagens para sociedades
11. ⚪ Adicionar histórico de sociedades
12. ⚪ Implementar edição de percentuais
13. ⚪ Adicionar tooltips e alertas de UX

---

## 🚨 DECISÕES PENDENTES

### 1. **Mensagens em Sociedades**
**Pergunta:** Quando alguém envia mensagem sobre um animal em sociedade, quem recebe?

**Opções:**
- A) Apenas o dono original (owner_id) ✅ RECOMENDADO
- B) Todos os sócios com plano ativo
- C) Sistema de chat em grupo

**Justificativa A:** Mais simples, menos complexo, owner_id é o responsável principal

### 2. **Dono FREE com Sócio Ativo**
**Pergunta:** Se o dono (owner_id) virar FREE mas tem sócio com plano ativo, o que acontece?

**Opções:**
- A) Animal fica pausado (owner_id precisa ter plano) ✅ RECOMENDADO
- B) Animal continua ativo (sócio mantém)

**Justificativa A:** Owner_id é o responsável principal, sócio é secundário

### 3. **Limite de Sócios por Animal**
**Pergunta:** Quantos sócios um animal pode ter?

**Opções:**
- A) Ilimitado
- B) Máximo 5 sócios ✅ RECOMENDADO
- C) Máximo 2 sócios

**Justificativa B:** Evita problemas de governança e UI complexa

---

## 📊 IMPACTO ESTIMADO

### Tempo de Implementação
- **Fase 1 (Backend):** ~4-6 horas
- **Fase 2 (Frontend):** ~6-8 horas
- **Fase 3 (Testes):** ~2-3 horas
- **Total:** ~12-17 horas

### Arquivos Afetados
- **Novos:** 2 (partnershipService.ts, migration 046)
- **Modificados:** 5 (SocietyPage, HarasPage, AnimalPage, animalService, AnimalCard)
- **Total:** 7 arquivos

### Complexidade
- **Backend:** MÉDIA (queries SQL complexas, RLS policies)
- **Frontend:** BAIXA (principalmente UI e fetch data)
- **Testes:** MÉDIA (múltiplos cenários de planos)

---

## ✅ CONCLUSÃO

O sistema de sociedades tem uma **boa fundação** (tabelas, migrations básicas) mas precisa de **implementação completa** do backend e frontend. Os problemas principais são:

1. Página usa dados mock
2. Não há serviço dedicado
3. Contagem de limites está incorreta
4. Exibição não considera planos ativos

**Todas as correções são viáveis** e podem ser implementadas de forma estruturada seguindo as fases propostas.

**Decisões pendentes** precisam ser respondidas antes da implementação final do sistema de mensagens.

---

**Preparado por:** Sistema de Auditoria
**Data:** 04/11/2025
**Versão:** 1.0

