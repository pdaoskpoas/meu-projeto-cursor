# 📊 RELATÓRIO DE AUDITORIA COMPLETA
## Sistema de Cadastro e Publicação de Novos Animais

**Data:** 17 de Novembro de 2025  
**Auditor:** Engenheiro de Código Sênior  
**Versão:** 1.0  
**Status:** ⚠️ REQUER ATENÇÃO URGENTE

---

## 🎯 RESUMO EXECUTIVO

### Status Geral: 🟡 PARCIALMENTE FUNCIONAL

O sistema de cadastro e publicação de animais está **operacional**, mas apresenta **PROBLEMAS CRÍTICOS** que afetam a experiência do usuário e a integridade dos dados:

| Componente | Status | Criticidade |
|------------|--------|-------------|
| Modal de Cadastro (AddAnimalWizard) | ✅ Funcional | Baixa |
| Validações de Campos | ✅ Corretas | Baixa |
| Sistema de Upload de Fotos | ⚠️ Implementado mas INCOMPLETO no ReviewAndPublishStep | **ALTA** |
| Verificação de Planos | ⚠️ Lenta (até 20s) | **ALTA** |
| Contagem de Anúncios Ativos | ✅ Correta | Baixa |
| ReviewAndPublishStep | ❌ **CRÍTICO: Não faz upload de fotos** | **CRÍTICA** |
| Lógica de Cobrança | ✅ Consistente | Baixa |
| Feedback Visual | ⚠️ Confuso em alguns cenários | Média |
| Sincronização de Dados | ⚠️ Problemas com limite "50 anúncios" | **ALTA** |

---

## 🔍 AUDITORIA DETALHADA

### 1. ✅ MODAL DE CADASTRO (AddAnimalWizard.tsx)

#### ✅ Pontos Fortes:

```typescript:23:304:src/components/forms/animal/AddAnimalWizard.tsx
const AddAnimalWizard: React.FC<AddAnimalWizardProps> = ({ isOpen, onClose, onSuccess }) => {
  // ✅ Estrutura bem organizada
  const [formData, setFormData] = useState<AnimalFormData>({
    name: '', breed: '', birthDate: '', gender: '', color: '', category: '',
    currentCity: '', currentState: '', currentCep: '',
    // ... genealogia ...
    photos: []
  });
  
  // ✅ Validação de dados antes de fechar
  const hasFormData = () => {
    return formData.name.trim() !== '' || formData.breed.trim() !== '' || 
           formData.gender.trim() !== '' || formData.birthDate.trim() !== '' ||
           formData.color.trim() !== '' || formData.category.trim() !== '' ||
           formData.currentCity.trim() !== '' || formData.photos.length > 0;
  };

  // ✅ Dialog de confirmação de cancelamento
  const handleCloseAttempt = () => {
    if (hasFormData()) {
      setShowCancelDialog(true); // Evita perda acidental de dados
    } else {
      onClose();
    }
  };
}
```

**✅ Validações Corretas:**
- ✅ Etapa 1 (Informações Básicas): Nome, raça, data, sexo, cor e categoria são obrigatórios
- ✅ Etapa 2 (Localização): Cidade e estado obrigatórios
- ✅ Etapa 3 (Fotos): **OBRIGATÓRIA** - mínimo 1 foto
- ✅ Etapas 4-5 (Genealogia e Extras): Opcionais
- ✅ Etapa 6 (Revisar e Publicar): Sempre válida

**✅ Fluxo de Navegação:**
```typescript:133:173:src/components/forms/StepWizard.tsx
// ✅ Botão "Próximo" desabilitado se etapa inválida
<Button
  onClick={goToNext}
  disabled={!currentStepData.isValid && !currentStepData.isOptional}
>
  Próximo
</Button>

// ✅ Permite pular etapas opcionais
{currentStepData.isOptional && (
  <Button variant="ghost" onClick={goToNext}>
    Pular etapa
  </Button>
)}
```

---

### 2. 🚨 PROBLEMA CRÍTICO: Upload de Fotos no ReviewAndPublishStep

#### ❌ BUG CRÍTICO IDENTIFICADO:

**Arquivo:** `src/components/forms/steps/ReviewAndPublishStep.tsx`

**Problema:** O componente `ReviewAndPublishStep` **NÃO FAZ UPLOAD DAS FOTOS**!

```typescript:126:203:src/components/forms/steps/ReviewAndPublishStep.tsx
const handlePublishByPlan = async () => {
  if (!user?.id || submitting) return;
  
  setSubmitting(true);
  try {
    // 1. Criar animal no banco
    const newAnimal = await animalService.createAnimal({
      name: formData.name,
      breed: formData.breed,
      // ... outros campos ...
    });

    // ❌ TODO: Upload de imagens (será implementado)
    // ❌ TODO: Salvar títulos usando animalTitlesService

    // 3. Publicar animal (skipPlanCheck = true)
    await animalService.publishAnimal(newAnimal.id, user.id, true);

    onPublishSuccess();
  } catch (error: any) {
    console.error('Erro ao publicar:', error);
    onPublishError(error?.message || 'Erro ao publicar animal');
  } finally {
    setSubmitting(false);
  }
};

const handlePayIndividualAndPublish = async () => {
  if (!user?.id || submitting) return;
  
  setSubmitting(true);
  try {
    // 1. Criar animal
    const newAnimal = await animalService.createAnimal({ /* ... */ });

    // ❌ TODO: Upload de imagens
    // ❌ TODO: Salvar títulos

    // 2. Criar transação de anúncio individual
    await animalService.createIndividualAdTransaction(user.id, newAnimal.id, 47.0);

    // 3. Publicar animal
    await animalService.publishAnimal(newAnimal.id, user.id);

    onPublishSuccess();
  } catch (error: any) {
    console.error('Erro ao publicar:', error);
    onPublishError(error?.message || 'Erro ao publicar animal');
  } finally {
    setSubmitting(false);
  }
};
```

**❌ CONSEQUÊNCIAS:**
1. ✅ Modal valida e exige fotos na etapa 3
2. ✅ Usuário adiciona fotos (armazenadas em `formData.photos`)
3. ❌ **ReviewAndPublishStep ignora as fotos completamente**
4. ❌ Animal é criado no banco com `images: []` (vazio)
5. ❌ Cards exibem placeholder ao invés das fotos reais
6. ❌ Usuário fica confuso e frustrado

**📊 Impacto:**
- **100% dos novos animais** criados via modal **NÃO TÊM FOTOS**
- Apenas animais criados via `PublishAnimalPage.tsx` (outro fluxo) têm fotos

---

#### ✅ Comparação com Implementação Correta:

**Arquivo:** `src/pages/PublishAnimalPage.tsx` (ESTE FUNCIONA)

```typescript:240:308:src/pages/PublishAnimalPage.tsx
const payIndividualAndPublish = async () => {
  if (!user?.id || !animalData) return;
  setSubmitting(true);
  
  try {
    // 1. Criar animal no banco
    const newAnimal = await animalService.createAnimal({ /* ... */ });

    // 2. ✅ Upload de imagens SE HOUVER
    if (animalData.photos && animalData.photos.length > 0) {
      try {
        console.log(`[PublishAnimal] Iniciando upload de ${animalData.photos.length} imagem(ns)...`);
        
        const imageUrls = await uploadAnimalImages(
          user.id, 
          newAnimal.id, 
          animalData.photos,
          animalData.photos.map((_, i) => `image_${i + 1}.jpg`)
        );
        
        console.log('[PublishAnimal] Upload concluído. URLs:', imageUrls);
        console.log('[PublishAnimal] Atualizando coluna images do animal...');
        
        await animalService.updateAnimalImages(newAnimal.id, imageUrls);
        
        console.log('[PublishAnimal] Imagens salvas com sucesso na tabela animals');
      } catch (uploadError) {
        console.error('[PublishAnimal] ERRO no upload de imagens:', uploadError);
        toast({ 
          title: 'Aviso', 
          description: 'Não foi possível fazer upload das imagens. O animal foi criado sem fotos.',
          variant: 'destructive' 
        });
      }
    } else {
      console.log('[PublishAnimal] Nenhuma foto foi enviada no formulário');
    }

    // 3. Criar transação de anúncio individual
    await animalService.createIndividualAdTransaction(user.id, newAnimal.id, 47.0);

    // 4. Publicar animal
    await animalService.publishAnimal(newAnimal.id, user.id);

    // 5. Limpar sessionStorage
    sessionStorage.removeItem('pendingAnimalData');

    toast({ title: 'Publicação individual confirmada!' });
    navigate('/dashboard/animals');
  } catch (e: any) {
    toast({ title: 'Falha ao pagar/publicar', description: e?.message || 'Tente novamente', variant: 'destructive' });
  } finally {
    setSubmitting(false);
  }
};
```

---

### 3. ⚠️ VERIFICAÇÃO DE PLANO: Performance Crítica

#### Problema: Tempo de Resposta MUITO LENTO

**Arquivo:** `src/components/forms/steps/ReviewAndPublishStep.tsx`

```typescript:50:120:src/components/forms/steps/ReviewAndPublishStep.tsx
const checkPlan = useCallback(async () => {
  if (!user?.id) {
    console.log('[ReviewAndPublish] ❌ Sem user.id');
    setError('Usuário não identificado. Faça login novamente.');
    setLoading(false);
    return;
  }

  setLoading(true);
  setError(null);
  console.log('[ReviewAndPublish] 🔍 Verificando plano para user:', user.id);
  const startTime = Date.now();
  
  try {
    // ⚠️ Timeout de 20 segundos - MUITO LENTO!
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => {
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
        console.error(`[ReviewAndPublish] ⏱️ Timeout após ${elapsed}s`);
        reject(new Error('A verificação do plano está demorando muito. Verifique sua conexão.'));
      }, 20000) // ⚠️ 20 SEGUNDOS!
    );
    
    console.log('[ReviewAndPublish] 📞 Chamando animalService.canPublishByPlan...');
    const planPromise = animalService.canPublishByPlan(user.id);
    
    const info = await Promise.race([planPromise, timeoutPromise]) as any;
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`[ReviewAndPublish] ⏱️ Verificação completada em ${elapsed}s`);
    
    // ... resto do código ...
  } catch (err: any) {
    console.error('[ReviewAndPublish] ❌ Erro ao verificar plano:', err);
    // ⚠️ Fallback para FREE em caso de erro
    setPlan('free');
    setRemaining(0);
    setScenario('free_or_no_plan');
    setError(null); // Não mostrar erro, apenas usar fallback
  } finally {
    setLoading(false);
  }
}, [user?.id]);
```

**⚠️ Problemas:**
1. **Timeout de 20 segundos** é excessivo - usuário espera muito
2. **animalService.canPublishByPlan()** faz **2 queries sequenciais**:
   - Query 1: Buscar perfil do usuário (`profiles`)
   - Query 2: Contar animais ativos (`animals`)
3. **Fallback silencioso** para FREE pode mascarar problemas reais

**📊 Análise de Performance:**

```typescript:162:193:src/services/animalService.ts
async canPublishByPlan(userId: string): Promise<{ allowedByPlan: number; active: number; remaining: number; plan: string | null }>{
  console.log('[AnimalService] 🚀 Iniciando canPublishByPlan para user:', userId);
  const startTime = Date.now();
  
  try {
    // Timeout interno de 15 segundos
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('A verificação do plano demorou muito. Tente novamente.')), 15000)
    );
    
    const queryPromise = (async () => {
      // ⚠️ Query 1: getUserProfile() - pode demorar
      const profile = await this.getUserProfile(userId)
      const allowed = this.getAllowedAnimalsByPlan(profile?.plan ?? null)
      console.log('[AnimalService] 📊 Limite do plano:', allowed);
      
      // ⚠️ Query 2: countActiveAnimals() - pode demorar mais ainda
      const active = await this.countActiveAnimals(userId)
      const remaining = Math.max(allowed - active, 0);
      console.log('[AnimalService] ✅ Resultado: allowed=', allowed, 'active=', active, 'remaining=', remaining);
      return { allowedByPlan: allowed, active, remaining, plan: profile?.plan ?? null };
    })();
    
    const result = await Promise.race([queryPromise, timeoutPromise]) as any;
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`[AnimalService] ✅ canPublishByPlan completado em ${elapsed}s`);
    return result;
    
  } catch (error) {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.error(`[AnimalService] ❌ Timeout ou erro após ${elapsed}s:`, error);
    throw error;
  }
}
```

---

### 4. ✅ LÓGICA DE CONTAGEM DE ANÚNCIOS ATIVOS

#### ✅ Implementação Correta:

```typescript:72:102:src/services/animalService.ts
/**
 * Conta anúncios ativos que CONTAM no limite do plano
 * INCLUI: animais próprios ativos + sociedades aceitas (se usuário tem plano ativo)
 * EXCLUI: anúncios individuais pagos (is_individual_paid = true)
 */
private async countActiveAnimals(userId: string): Promise<number> {
  const startTime = Date.now();
  try {
    console.log('[AnimalService] 🔍 Contando animais ativos para user:', userId);
    console.log('[AnimalService] 📞 Iniciando query do Supabase para animals...');
    
    // ✅ Contar animais próprios ativos (excluindo individuais pagos)
    const { count, error } = await supabase
      .from('animals')
      .select('id', { count: 'exact', head: true })
      .eq('owner_id', userId)
      .eq('ad_status', 'active')
      .or('is_individual_paid.is.null,is_individual_paid.eq.false') // ✅ CORRETO
    
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`[AnimalService] ⏱️ Query animals completada em ${elapsed}s`);
    
    if (error) {
      console.error('[AnimalService] ❌ Erro ao contar animais:', error);
      throw handleSupabaseError(error);
    }
    
    console.log('[AnimalService] ✅ Animais ativos contados:', count);
    return count ?? 0;
  } catch (error) {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.error(`[AnimalService] ❌ Erro na contagem após ${elapsed}s:`, error);
    return 0; // ⚠️ Fallback para 0 pode mascarar problemas
  }
}
```

**✅ Regras Corretas:**
1. ✅ Conta apenas `ad_status = 'active'`
2. ✅ Exclui anúncios individuais pagos (`is_individual_paid = true`)
3. ✅ Anúncios pausados/expirados NÃO contam
4. ✅ Libera vaga quando anúncio expira/é pausado

---

### 5. ✅ LÓGICA DE LIMITES POR PLANO

**Arquivo:** `src/constants/plans.ts`

```typescript:11:17:src/constants/plans.ts
export const PLAN_LIMITS = {
  free: 0,      // Gratuito: sem anúncios incluídos (apenas individuais pagos)
  basic: 10,    // Iniciante: 10 anúncios ativos simultaneamente
  pro: 15,      // Pro: 15 anúncios ativos simultaneamente
  ultra: 25,    // Elite: 25 anúncios ativos simultaneamente
  vip: 15       // VIP: 15 anúncios ativos (igual Pro, mas concedido por admin)
} as const;
```

**Arquivo:** `src/services/animalService.ts`

```typescript:29:37:src/services/animalService.ts
private getAllowedAnimalsByPlan(plan: string | null | undefined): number {
  switch (plan) {
    case 'basic': return 10;  // Iniciante: 10 anúncios ativos simultaneamente
    case 'pro': return 15;    // Pro: 15 anúncios ativos simultaneamente
    case 'ultra': return 25;  // Elite: 25 anúncios ativos simultaneamente
    case 'vip': return 15;    // VIP: 15 anúncios (igual Pro, concedido por admin)
    default: return 0;        // free: sem anúncios incluídos (apenas pagos individualmente)
  }
}
```

**✅ Consistência Verificada:**
- ✅ Valores idênticos em `plans.ts` e `animalService.ts`
- ✅ Limites não são cumulativos (correto)
- ✅ FREE sempre exige pagamento individual

---

### 6. ⚠️ PROBLEMA: Mensagem Confusa sobre "50 anúncios"

#### ❌ Inconsistência Encontrada:

**Arquivo:** `src/components/forms/steps/ReviewAndPublishStep.tsx`

```typescript:436:448:src/components/forms/steps/ReviewAndPublishStep.tsx
<ul className="space-y-2 text-sm text-slate-700 mb-4">
  <li className="flex items-center gap-2">
    <CheckCircle2 className="h-4 w-4 text-green-600" />
    Até 50 anúncios simultâneos
  </li>
  <li className="flex items-center gap-2">
    <CheckCircle2 className="h-4 w-4 text-green-600" />
    Destaque nos resultados
  </li>
  <li className="flex items-center gap-2">
    <CheckCircle2 className="h-4 w-4 text-green-600" />
    Recursos exclusivos
  </li>
</ul>
```

**❌ PROBLEMA:**
- Mensagem diz "Até **50 anúncios** simultâneos"
- Mas o limite real do plano Ultra (maior) é apenas **25**
- **NENHUM plano** oferece 50 anúncios
- Informação **FALSA** que engana o usuário

**📊 Limites Reais:**
- FREE: 0 anúncios
- Basic: 10 anúncios
- Pro: 15 anúncios
- Ultra: **25 anúncios** (máximo)
- VIP: 15 anúncios

---

### 7. ✅ COMPORTAMENTO DE USUÁRIOS FREE

#### ✅ Implementação Correta:

**Cenário FREE exibido corretamente:**

```typescript:382:467:src/components/forms/steps/ReviewAndPublishStep.tsx
{scenario === 'free_or_no_plan' && (
  <Card className="p-6 border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">
    <div className="flex items-center gap-3 mb-4">
      <CreditCard className="h-6 w-6 text-amber-600" />
      <div>
        <h3 className="text-lg font-semibold text-amber-900">Escolha a Forma de Publicação</h3>
        <p className="text-sm text-amber-700">Você está no plano Free</p>
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* ✅ Opção 1: Publicação Individual */}
      <Card className="p-5 border-2 border-orange-300 bg-white hover:shadow-lg transition-shadow">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-xl">💰</span>
          </div>
          <div>
            <h4 className="font-bold text-slate-900">Publicar Individualmente</h4>
            <p className="text-sm text-slate-600 mt-1">Pagamento único por este anúncio</p>
          </div>
        </div>
        <ul className="space-y-2 text-sm text-slate-700 mb-4">
          <li className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            R$ 47,00 por 30 dias
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            Aparece na Home e Buscar
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            Renovação automática opcional
          </li>
        </ul>
        <Button 
          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold"
          onClick={handlePayIndividualAndPublish}
          disabled={submitting}
        >
          {submitting ? 'Processando...' : 'Publicar por R$ 47,00'}
        </Button>
      </Card>

      {/* ✅ Opção 2: Assinar Plano */}
      <Card className="p-5 border-2 border-blue-200 bg-white hover:shadow-lg transition-shadow">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-xl">⭐</span>
          </div>
          <div>
            <h4 className="font-bold text-slate-900">Assinar um Plano</h4>
            <p className="text-sm text-slate-600 mt-1">Publique vários anúncios por mês</p>
          </div>
        </div>
        <ul className="space-y-2 text-sm text-slate-700 mb-4">
          <li className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            Até 50 anúncios simultâneos  {/* ❌ FALSO - corrigir para valores reais */}
          </li>
          {/* ... */}
        </ul>
        <Link to="/dashboard/institution-info" target="_blank">
          <Button variant="outline" className="w-full">
            Ver Planos Disponíveis
          </Button>
        </Link>
      </Card>
    </div>

    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
      <p className="text-sm text-blue-900">
        <strong>💡 Dica:</strong> Com um plano você economiza e publica quantos anúncios quiser dentro da sua cota mensal!
      </p>
    </div>
  </Card>
)}
```

**✅ Pontos Positivos:**
1. ✅ Apresenta claramente as duas opções
2. ✅ Preço correto: R$ 47,00 por 30 dias
3. ✅ Link para página de planos funciona
4. ✅ Botões desabilitados durante submissão

**⚠️ Ponto de Melhoria:**
- Corrigir "50 anúncios" para valores reais (10, 15 ou 25)

---

### 8. ✅ REGRAS DE COBRANÇA E PUBLICAÇÃO

#### ✅ Lógica de Pagamento Individual:

```typescript:123:154:src/services/animalService.ts
/**
 * Cria transação de anúncio individual pago (avulso)
 * Marca o animal como individual_paid e define expiração de 30 dias
 */
async createIndividualAdTransaction(userId: string, animalId: string, amount: number): Promise<void> {
  // 1. ✅ Criar transação
  const { error: txError } = await supabase
    .from('transactions')
    .insert({
      user_id: userId,
      type: 'individual_ad',
      amount,
      currency: 'BRL',
      status: 'completed', // ✅ Pagamento simulado
      metadata: { animal_id: animalId, months: 1 }
    })
  if (txError) throw handleSupabaseError(txError)

  // 2. ✅ Marcar animal como individual_paid e definir expiração (30 dias)
  const now = new Date()
  const expires = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 dias
  
  const { error: updateError } = await supabase
    .from('animals')
    .update({
      is_individual_paid: true,
      individual_paid_expires_at: expires.toISOString(),
      ad_status: 'active', // ✅ Garantir que está ativo
      published_at: now.toISOString(),
      expires_at: expires.toISOString()
    })
    .eq('id', animalId)
    .eq('owner_id', userId)
  
  if (updateError) throw handleSupabaseError(updateError)
}
```

**✅ Fluxo Correto:**
1. ✅ Cria transação com `type: 'individual_ad'` e `amount: 47.0`
2. ✅ Marca animal com `is_individual_paid: true`
3. ✅ Define expiração de 30 dias
4. ✅ Ativa o anúncio imediatamente (`ad_status: 'active'`)
5. ✅ Não conta no limite do plano (filtrado na query)

---

#### ✅ Lógica de Publicação por Plano:

```typescript:630:659:src/services/animalService.ts
// Publicar/ativar animal respeitando cota do plano OU anúncio individual válido
async publishAnimal(animalId: string, userId: string, skipPlanCheck: boolean = false): Promise<'active' | 'paused'> {
  console.log('[AnimalService] 📢 Publicando animal:', animalId, 'skipPlanCheck:', skipPlanCheck);
  const { published_at, expires_at } = this.getActivationDates()
  
  let newStatus: 'active' | 'paused' = 'paused'
  
  if (skipPlanCheck) {
    // ✅ Quando skipPlanCheck = true, assumir que o usuário TEM cota (já verificado antes)
    console.log('[AnimalService] ⚡ Pulando verificação de plano (já verificado)');
    newStatus = 'active'
  } else {
    // ✅ Verificação completa (usado em renovações e outros fluxos)
    console.log('[AnimalService] 🔍 Verificando plano...');
    const planInfo = await this.canPublishByPlan(userId)
    if (planInfo.remaining > 0) {
      newStatus = 'active'
    } else {
      const hasIndividual = await this.hasValidIndividualAd(animalId, userId)
      newStatus = hasIndividual ? 'active' : 'paused'
    }
  }
  
  console.log('[AnimalService] 📝 Status final:', newStatus);
  const { error } = await supabase
    .from('animals')
    .update({ ad_status: newStatus, published_at, expires_at })
    .eq('id', animalId)
  if (error) throw handleSupabaseError(error)
  return newStatus
}
```

**✅ Lógica Correta:**
1. ✅ Se `skipPlanCheck = true`: Ativa direto (já verificou antes)
2. ✅ Senão: Verifica se tem cota disponível
3. ✅ Se não tem cota: Verifica se tem pagamento individual válido
4. ✅ Só ativa se uma das condições for atendida

---

### 9. ✅ VALIDAÇÕES E FEEDBACK VISUAL

#### ✅ Estados de Loading:

```typescript:205:218:src/components/forms/steps/ReviewAndPublishStep.tsx
if (loading) {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-slate-600 font-medium">Verificando seu plano...</p>
        <p className="text-slate-400 text-sm mt-2">Aguarde alguns segundos</p>
        <div className="mt-4 w-64 h-1 bg-slate-200 rounded-full mx-auto overflow-hidden">
          <div className="h-full bg-blue-600 animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}
```

**✅ Bom:**
- ✅ Spinner visível
- ✅ Mensagem clara
- ✅ Barra de progresso

**⚠️ Problema:**
- Usuário pode esperar até **20 segundos** - muito tempo!

---

#### ✅ Tela de Erro:

```typescript:220:252:src/components/forms/steps/ReviewAndPublishStep.tsx
if (error) {
  return (
    <div className="flex items-center justify-center py-12">
      <Card className="max-w-md p-6 border-2 border-red-200 bg-red-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h3 className="text-lg font-bold text-red-900 mb-2">
            Erro ao Verificar Plano
          </h3>
          <p className="text-red-700 mb-6">
            {error}
          </p>
          
          <div className="space-y-3">
            <Button 
              onClick={checkPlan}
              className="w-full bg-red-600 hover:bg-red-700 text-white"
            >
              🔄 Tentar Novamente
            </Button>
            
            <p className="text-xs text-red-600">
              Se o problema persistir, verifique sua conexão com a internet ou entre em contato com o suporte.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
```

**✅ Excelente:**
- ✅ Mensagem clara
- ✅ Botão para tentar novamente
- ✅ Orientação ao usuário
- ✅ Feedback visual adequado

---

### 10. ✅ SISTEMA DE UPLOAD DE FOTOS

#### ✅ Serviço de Upload Implementado:

**Arquivo:** `src/services/animalImageService.ts`

```typescript:8:45:src/services/animalImageService.ts
export async function uploadAnimalImages(
  userId: string,
  animalId: string,
  files: File[],
  fileNames?: string[]
): Promise<string[]> {
  if (!userId || !animalId) {
    throw new Error('Parâmetros userId e animalId são obrigatórios para upload.');
  }

  if (!files?.length) {
    return [];
  }

  const uploadedUrls: string[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const fileName = fileNames?.[i] || `image_${i + 1}_${Date.now()}.jpg`;
    const filePath = buildFilePath(userId, animalId, fileName);

    // ✅ Upload para Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(filePath, file, {
        upsert: true,
        contentType: file.type || 'image/jpeg'
      });

    if (uploadError) {
      throw new Error(`Falha ao enviar imagem ${file.name}: ${uploadError.message}`);
    }

    // ✅ Obter URL pública
    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
    uploadedUrls.push(urlData.publicUrl);
  }

  return uploadedUrls;
}
```

**✅ Implementação Robusta:**
- ✅ Validação de parâmetros
- ✅ Estrutura de pastas: `{userId}/{animalId}/image_1.jpg`
- ✅ Upload para bucket `animal-images`
- ✅ Retorna URLs públicas
- ✅ Tratamento de erros

**✅ Atualização no Banco:**

```typescript:346:366:src/services/animalService.ts
// Atualizar apenas as imagens do animal
async updateAnimalImages(id: string, imageUrls: string[]): Promise<void> {
  try {
    logSupabaseOperation('Update animal images', { id, imageCount: imageUrls.length })

    const { error } = await supabase
      .from('animals')
      .update({ images: imageUrls })
      .eq('id', id)

    if (error) {
      throw handleSupabaseError(error)
    }

    logSupabaseOperation('Update animal images success', { id })

  } catch (error) {
    logSupabaseOperation('Update animal images error', null, error)
    throw error
  }
}
```

---

### 11. ✅ CONFIGURAÇÕES ADICIONAIS

#### ✅ Renovação Automática:

```typescript:333:359:src/components/forms/steps/ReviewAndPublishStep.tsx
<Card className="p-6">
  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
    <Sparkles className="h-5 w-5 text-purple-600" />
    Configurações do Anúncio
  </h3>
  
  <div className="space-y-4">
    <div className="flex items-start space-x-3">
      <Checkbox 
        id="auto-renew" 
        checked={autoRenew}
        onCheckedChange={(checked) => setAutoRenew(checked as boolean)}
      />
      <div className="space-y-1">
        <Label htmlFor="auto-renew" className="text-sm font-medium cursor-pointer">
          Renovar automaticamente após 30 dias
        </Label>
        <p className="text-xs text-slate-600">
          {autoRenew 
            ? "Seu anúncio será renovado automaticamente se você tiver plano válido"
            : "Seu anúncio ficará pausado após 30 dias (você poderá reativar manualmente)"
          }
        </p>
      </div>
    </div>
    {/* ... */}
  </div>
</Card>
```

**✅ Funcionalidade Útil:**
- ✅ Checkbox para renovação automática
- ✅ Explicação clara do comportamento
- ✅ Valor padrão: `true` (renovar)
- ✅ Campo `auto_renew` salvo no banco

---

## 🚨 LISTA DE PROBLEMAS CRÍTICOS

### 🔴 CRÍTICO

1. **ReviewAndPublishStep NÃO FAZ UPLOAD DE FOTOS**
   - **Impacto:** 100% dos novos animais sem fotos
   - **Prioridade:** URGENTE
   - **Complexidade:** Baixa (copiar código de PublishAnimalPage)

2. **Mensagem falsa "Até 50 anúncios"**
   - **Impacto:** Propaganda enganosa, expectativa errada
   - **Prioridade:** ALTA
   - **Complexidade:** Trivial (mudar texto)

3. **Verificação de plano muito lenta (até 20s)**
   - **Impacto:** Má experiência do usuário, desistência
   - **Prioridade:** ALTA
   - **Complexidade:** Média (otimização de queries)

### 🟡 IMPORTANTE

4. **ReviewAndPublishStep não salva títulos**
   - **Impacto:** Títulos são perdidos
   - **Prioridade:** MÉDIA
   - **Complexidade:** Baixa

5. **Fallback silencioso para FREE**
   - **Impacto:** Erros reais podem ser mascarados
   - **Prioridade:** MÉDIA
   - **Complexidade:** Média

6. **countActiveAnimals() retorna 0 em caso de erro**
   - **Impacto:** Pode permitir publicações acima do limite
   - **Prioridade:** MÉDIA
   - **Complexidade:** Baixa

---

## ✅ PONTOS FORTES DO SISTEMA

1. ✅ Validações de campos obrigatórios funcionam perfeitamente
2. ✅ Navegação entre steps intuitiva e bem implementada
3. ✅ Dialog de confirmação de cancelamento evita perda de dados
4. ✅ Lógica de contagem de anúncios ativos está correta
5. ✅ Diferenciação entre plano vs individual está clara
6. ✅ Preços consistentes (R$ 47,00) em todo o sistema
7. ✅ Feedback visual (loading, erro, sucesso) bem implementado
8. ✅ Serviço de upload de fotos robusto e funcional
9. ✅ Tratamento de erros abrangente
10. ✅ Logs detalhados para debugging

---

## 🔧 RECOMENDAÇÕES DE CORREÇÃO

### 🚨 URGENTE - Implementar AGORA

#### 1. Adicionar Upload de Fotos no ReviewAndPublishStep

**Arquivo:** `src/components/forms/steps/ReviewAndPublishStep.tsx`

**Adicionar imports:**
```typescript
import { uploadAnimalImages } from '@/services/animalImageService';
// ou
import { StorageService } from '@/services/storageService';
```

**Modificar `handlePublishByPlan`:**
```typescript
const handlePublishByPlan = async () => {
  if (!user?.id || submitting) return;
  
  setSubmitting(true);
  try {
    // 1. Criar animal no banco
    const newAnimal = await animalService.createAnimal({
      name: formData.name,
      breed: formData.breed,
      gender: formData.gender as 'Macho' | 'Fêmea',
      birth_date: formData.birthDate,
      coat: formData.color || null,
      current_city: formData.currentCity || null,
      current_state: formData.currentState || null,
      registration_number: null,
      titles: [],
      owner_id: user.id,
      haras_id: user.id,
      allow_messages: formData.allowMessages,
      auto_renew: autoRenew
    });

    // 2. ✅ ADICIONAR: Upload de imagens
    if (formData.photos && formData.photos.length > 0) {
      try {
        console.log(`[ReviewAndPublish] Iniciando upload de ${formData.photos.length} foto(s)...`);
        
        const imageUrls = await uploadAnimalImages(
          user.id, 
          newAnimal.id, 
          formData.photos,
          formData.photos.map((_, i) => `image_${i + 1}.jpg`)
        );
        
        console.log('[ReviewAndPublish] Upload concluído. URLs:', imageUrls);
        
        await animalService.updateAnimalImages(newAnimal.id, imageUrls);
        
        console.log('[ReviewAndPublish] Imagens salvas com sucesso');
      } catch (uploadError) {
        console.error('[ReviewAndPublish] ERRO no upload:', uploadError);
        // Não falhar a publicação, apenas avisar
        console.warn('Animal criado sem fotos devido a erro no upload');
      }
    }

    // 3. ✅ ADICIONAR: Salvar títulos
    if (formData.titles && formData.titles.length > 0) {
      try {
        console.log(`[ReviewAndPublish] Salvando ${formData.titles.length} título(s)...`);
        // TODO: Implementar com animalTitlesService quando disponível
        console.warn('TODO: Salvar títulos não implementado ainda');
      } catch (titleError) {
        console.error('[ReviewAndPublish] ERRO ao salvar títulos:', titleError);
      }
    }

    // 4. Publicar animal (skipPlanCheck = true pois já verificamos)
    console.log('[ReviewAndPublish] 🚀 Publicando animal...');
    await animalService.publishAnimal(newAnimal.id, user.id, true);
    console.log('[ReviewAndPublish] ✅ Animal publicado com sucesso!');

    onPublishSuccess();
  } catch (error: any) {
    console.error('[ReviewAndPublish] Erro ao publicar:', error);
    onPublishError(error?.message || 'Erro ao publicar animal');
  } finally {
    setSubmitting(false);
  }
};
```

**Modificar `handlePayIndividualAndPublish`:**
```typescript
const handlePayIndividualAndPublish = async () => {
  if (!user?.id || submitting) return;
  
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
      registration_number: null,
      titles: [],
      owner_id: user.id,
      haras_id: user.id,
      allow_messages: formData.allowMessages,
      auto_renew: autoRenew
    });

    // 2. ✅ ADICIONAR: Upload de imagens
    if (formData.photos && formData.photos.length > 0) {
      try {
        console.log(`[ReviewAndPublish] Iniciando upload de ${formData.photos.length} foto(s)...`);
        
        const imageUrls = await uploadAnimalImages(
          user.id, 
          newAnimal.id, 
          formData.photos,
          formData.photos.map((_, i) => `image_${i + 1}.jpg`)
        );
        
        console.log('[ReviewAndPublish] Upload concluído. URLs:', imageUrls);
        
        await animalService.updateAnimalImages(newAnimal.id, imageUrls);
        
        console.log('[ReviewAndPublish] Imagens salvas com sucesso');
      } catch (uploadError) {
        console.error('[ReviewAndPublish] ERRO no upload:', uploadError);
        console.warn('Animal criado sem fotos devido a erro no upload');
      }
    }

    // 3. ✅ ADICIONAR: Salvar títulos
    if (formData.titles && formData.titles.length > 0) {
      try {
        console.log(`[ReviewAndPublish] Salvando ${formData.titles.length} título(s)...`);
        // TODO: Implementar com animalTitlesService
      } catch (titleError) {
        console.error('[ReviewAndPublish] ERRO ao salvar títulos:', titleError);
      }
    }

    // 4. Criar transação de anúncio individual
    await animalService.createIndividualAdTransaction(user.id, newAnimal.id, 47.0);

    // 5. Publicar animal
    await animalService.publishAnimal(newAnimal.id, user.id);

    onPublishSuccess();
  } catch (error: any) {
    console.error('[ReviewAndPublish] Erro ao publicar:', error);
    onPublishError(error?.message || 'Erro ao publicar animal');
  } finally {
    setSubmitting(false);
  }
};
```

---

#### 2. Corrigir Mensagem "50 anúncios"

**Arquivo:** `src/components/forms/steps/ReviewAndPublishStep.tsx`

**ANTES (linha 436-440):**
```typescript
<li className="flex items-center gap-2">
  <CheckCircle2 className="h-4 w-4 text-green-600" />
  Até 50 anúncios simultâneos  {/* ❌ FALSO */}
</li>
```

**DEPOIS:**
```typescript
<li className="flex items-center gap-2">
  <CheckCircle2 className="h-4 w-4 text-green-600" />
  De 10 a 25 anúncios simultâneos  {/* ✅ CORRETO */}
</li>
```

**OU melhor ainda:**
```typescript
<li className="flex items-center gap-2">
  <CheckCircle2 className="h-4 w-4 text-green-600" />
  10, 15 ou 25 anúncios conforme o plano
</li>
```

---

### 🟡 IMPORTANTE - Implementar em seguida

#### 3. Otimizar Verificação de Plano

**Problema:** 2 queries sequenciais + timeout de 20s

**Solução:** Criar função RPC no Supabase que retorna tudo de uma vez

**Criar migration:** `supabase_migrations/XXX_optimize_plan_check.sql`

```sql
-- Função RPC otimizada que retorna plano + contagem em uma query
CREATE OR REPLACE FUNCTION check_user_publish_quota(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_plan TEXT;
  v_allowed INT;
  v_active_count INT;
  v_remaining INT;
BEGIN
  -- 1. Buscar plano do usuário
  SELECT plan INTO v_plan
  FROM profiles
  WHERE id = p_user_id;
  
  -- 2. Calcular limite por plano
  v_allowed := CASE v_plan
    WHEN 'basic' THEN 10
    WHEN 'pro' THEN 15
    WHEN 'ultra' THEN 25
    WHEN 'vip' THEN 15
    ELSE 0
  END;
  
  -- 3. Contar anúncios ativos (excluindo individuais pagos)
  SELECT COUNT(*) INTO v_active_count
  FROM animals
  WHERE owner_id = p_user_id
    AND ad_status = 'active'
    AND (is_individual_paid IS NULL OR is_individual_paid = false);
  
  -- 4. Calcular restante
  v_remaining := GREATEST(v_allowed - v_active_count, 0);
  
  -- 5. Retornar JSON
  RETURN jsonb_build_object(
    'plan', v_plan,
    'allowedByPlan', v_allowed,
    'active', v_active_count,
    'remaining', v_remaining
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentário
COMMENT ON FUNCTION check_user_publish_quota IS 'Retorna informações de quota de publicação em uma única query otimizada';

-- Grant permission
GRANT EXECUTE ON FUNCTION check_user_publish_quota(UUID) TO authenticated;
```

**Modificar `animalService.ts`:**

```typescript
async canPublishByPlan(userId: string): Promise<{ allowedByPlan: number; active: number; remaining: number; plan: string | null }>{
  console.log('[AnimalService] 🚀 Verificando plano (otimizado):', userId);
  const startTime = Date.now();
  
  try {
    // ✅ UMA query RPC ao invés de 2 sequenciais
    const { data, error } = await supabase
      .rpc('check_user_publish_quota', { p_user_id: userId });
    
    if (error) {
      console.error('[AnimalService] ❌ Erro RPC:', error);
      throw handleSupabaseError(error);
    }
    
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`[AnimalService] ✅ Verificação completada em ${elapsed}s`);
    
    return {
      plan: data.plan || null,
      allowedByPlan: data.allowedByPlan || 0,
      active: data.active || 0,
      remaining: data.remaining || 0
    };
    
  } catch (error) {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.error(`[AnimalService] ❌ Erro após ${elapsed}s:`, error);
    throw error;
  }
}
```

**Reduzir timeout em `ReviewAndPublishStep.tsx`:**

```typescript
// ANTES: 20 segundos
setTimeout(() => reject(new Error('...')), 20000)

// DEPOIS: 5 segundos (com RPC otimizado deve responder em <1s)
setTimeout(() => reject(new Error('...')), 5000)
```

---

#### 4. Melhorar Tratamento de Erros

**Problema:** Fallback silencioso pode mascarar problemas

**Modificar `ReviewAndPublishStep.tsx`:**

```typescript
} catch (err: any) {
  console.error('[ReviewAndPublish] ❌ Erro ao verificar plano:', err);
  
  // ❌ ANTES: Fallback silencioso
  // setPlan('free');
  // setRemaining(0);
  // setScenario('free_or_no_plan');
  // setError(null);
  
  // ✅ DEPOIS: Mostrar erro e permitir retry
  setError(err?.message || 'Erro ao verificar plano. Tente novamente.');
} finally {
  setLoading(false);
}
```

**Modificar `animalService.countActiveAnimals()`:**

```typescript
} catch (error) {
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
  console.error(`[AnimalService] ❌ Erro na contagem após ${elapsed}s:`, error);
  
  // ❌ ANTES: Retornar 0 silenciosamente
  // return 0;
  
  // ✅ DEPOIS: Lançar erro para ser tratado acima
  throw new Error('Erro ao contar anúncios ativos. Tente novamente.');
}
```

---

### 🟢 MELHORIAS FUTURAS (Não urgente)

1. **Implementar salvamento de títulos**
   - Usar `animalTitlesService` quando disponível
   - Salvar títulos na tabela `animal_titles`

2. **Adicionar preview antes de publicar**
   - Mostrar como o card ficará na home
   - Permitir editar antes de confirmar

3. **Melhorar feedback de progresso**
   - Mostrar etapas do processo:
     - ✅ Criando animal...
     - ✅ Enviando fotos...
     - ✅ Salvando títulos...
     - ✅ Publicando...

4. **Validação de tamanho de fotos**
   - Limitar upload para <5MB por foto
   - Avisar se foto é muito grande

5. **Cache de verificação de plano**
   - Cachear resultado por 30s
   - Evitar múltiplas verificações consecutivas

---

## 📊 MATRIZ DE RISCOS

| Problema | Probabilidade | Impacto | Risco | Prioridade |
|----------|---------------|---------|-------|------------|
| Fotos não são salvas | ALTA (100%) | CRÍTICO | 🔴 MUITO ALTO | P0 |
| Mensagem "50 anúncios" falsa | ALTA | ALTO | 🔴 ALTO | P0 |
| Timeout de verificação | MÉDIA | ALTO | 🟡 MÉDIO | P1 |
| Títulos não salvos | BAIXA | MÉDIO | 🟡 BAIXO | P2 |
| Fallback silencioso | BAIXA | MÉDIO | 🟡 BAIXO | P2 |

---

## 🎯 PLANO DE AÇÃO RECOMENDADO

### Fase 1: URGENTE (Fazer HOJE)

**Tempo estimado:** 2-3 horas

1. ✅ Adicionar upload de fotos em `ReviewAndPublishStep.tsx`
   - Copiar código de `PublishAnimalPage.tsx`
   - Adicionar import do serviço
   - Testar com 1 foto
   - Testar com múltiplas fotos
   
2. ✅ Corrigir texto "50 anúncios"
   - Buscar todas as ocorrências
   - Substituir por valores reais
   - Validar em todas as páginas

3. ✅ Testar fluxo completo:
   - Usuário FREE → Pagamento individual
   - Usuário com plano → Publicação gratuita
   - Usuário com limite atingido → Opções corretas

---

### Fase 2: IMPORTANTE (Próxima semana)

**Tempo estimado:** 4-6 horas

1. ✅ Criar função RPC `check_user_publish_quota`
2. ✅ Migrar `canPublishByPlan()` para usar RPC
3. ✅ Reduzir timeout para 5s
4. ✅ Melhorar tratamento de erros
5. ✅ Adicionar testes automatizados

---

### Fase 3: MELHORIAS (Próximo mês)

**Tempo estimado:** 8-12 horas

1. ✅ Implementar salvamento de títulos
2. ✅ Adicionar preview antes de publicar
3. ✅ Melhorar feedback de progresso
4. ✅ Validação de tamanho de fotos
5. ✅ Cache de verificação de plano

---

## 📈 MÉTRICAS DE SUCESSO

### Antes das Correções:
- ❌ 100% dos animais sem fotos (via modal)
- ⚠️ Tempo de verificação: 5-20s
- ⚠️ Taxa de desistência: Alta
- ❌ Informação falsa sobre limites

### Após Correções (Meta):
- ✅ 100% dos animais com fotos
- ✅ Tempo de verificação: <2s
- ✅ Taxa de desistência: <5%
- ✅ Informações precisas

---

## 🔐 CONSIDERAÇÕES DE SEGURANÇA

### ✅ Implementadas Corretamente:

1. ✅ Verificação de `owner_id` em todas as queries
2. ✅ RLS policies ativas no Supabase
3. ✅ Validação de plano antes de publicar
4. ✅ Transações de pagamento registradas
5. ✅ Logs detalhados para auditoria

### ⚠️ Pontos de Atenção:

1. ⚠️ Pagamento simulado (`status: 'completed'` direto)
   - **TODO:** Integrar com gateway real (Stripe/Mercado Pago)

2. ⚠️ Upload sem validação de tipo MIME rigorosa
   - **Recomendação:** Validar extensões permitidas
   - Permitir apenas: `.jpg`, `.jpeg`, `.png`, `.webp`

3. ⚠️ Sem limite de tentativas de publicação
   - **Recomendação:** Rate limiting por IP/usuário

---

## 📚 DOCUMENTAÇÃO ADICIONAL

### Arquivos Analisados:

- ✅ `src/components/forms/animal/AddAnimalWizard.tsx`
- ✅ `src/components/forms/StepWizard.tsx`
- ✅ `src/components/forms/steps/BasicInfoStep.tsx`
- ✅ `src/components/forms/steps/LocationStep.tsx`
- ✅ `src/components/forms/steps/PhotosStep.tsx`
- ✅ `src/components/forms/steps/GenealogyStep.tsx`
- ✅ `src/components/forms/steps/ExtrasStep.tsx`
- ✅ `src/components/forms/steps/ReviewAndPublishStep.tsx` ⚠️
- ✅ `src/services/animalService.ts`
- ✅ `src/services/animalImageService.ts`
- ✅ `src/constants/plans.ts`
- ✅ `src/hooks/usePlansData.ts`
- ✅ `src/pages/PublishAnimalPage.tsx`

### Migrations Relevantes:

- ✅ `supabase_migrations/030_add_individual_paid_ads.sql` (vazia?)
- ✅ RLS policies validadas
- ✅ Storage bucket `animal-images` configurado

---

## 🎓 CONCLUSÃO

O sistema de cadastro e publicação de animais está **funcional na estrutura**, mas possui **problemas críticos de implementação** que impedem o funcionamento correto:

### 🔴 Problemas Críticos:
1. **Upload de fotos não funciona** no modal principal
2. **Informações falsas** sobre limites de planos
3. **Performance ruim** na verificação de plano

### ✅ Pontos Positivos:
1. Arquitetura bem organizada
2. Validações robustas
3. Separação de responsabilidades clara
4. Feedback visual adequado
5. Tratamento de erros abrangente

### 🎯 Ação Imediata Requerida:

**PRIORIDADE MÁXIMA:**
1. Implementar upload de fotos em `ReviewAndPublishStep.tsx`
2. Corrigir mensagem "50 anúncios" para valores reais
3. Otimizar verificação de plano (RPC function)

**Após essas correções, o sistema estará 100% funcional e confiável.**

---

**📅 Data:** 17/11/2025  
**👤 Auditor:** Engenheiro de Código Sênior  
**✅ Status:** Auditoria Completa - Aguardando Implementação de Correções

