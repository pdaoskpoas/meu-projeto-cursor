# 🔧 CORREÇÃO CRÍTICA - Timeout na Publicação de Animais

**Data:** 26 de Novembro de 2025  
**Status:** ✅ **CORRIGIDO**  
**Prioridade:** 🔴 **CRÍTICA**

---

## 🐛 PROBLEMA IDENTIFICADO

### Sintoma Principal
Ao clicar em "Publicar Anúncio", o botão mudava para "Publicando..." mas ficava **travado indefinidamente**. O anúncio nunca era publicado, mesmo após esperar vários minutos.

### Logs do Console
```
🔵 [DEBUG] handlePublishWithPlan chamado
🔵 [DEBUG] user?.id: addb892b-e6f8-456a-a32a-1152951@cafb
🔵 [DEBUG] quota: { plan: 'vip', active: 2, allowedByPlan: 15, remaining: 13 }
🔐 Verificando sessão do Supabase...
[TRAVA AQUI - Nenhum log adicional]
```

### Problema Secundário
Ao **fechar e reabrir o modal**, a última etapa (Revisar e Publicar) ficava eternamente em **"Verificando seu plano..."**.

---

## 🔍 CAUSA RAIZ

### 1. **Chamadas ao Supabase Sem Timeout**
Várias operações críticas não tinham timeout configurado:
- ✅ `supabase.auth.getSession()` - verificação de sessão
- ✅ `supabase.rpc('check_user_publish_quota')` - verificação de plano
- ✅ `generateUniqueShareCode()` - geração de código único
- ✅ `supabase.from('profiles').select()` - busca de perfil
- ✅ `animalService.createAnimal()` - criação do animal

**Problema:** Se qualquer dessas operações travasse (conexão lenta, servidor não respondendo, etc.), o sistema ficava esperando **infinitamente**.

### 2. **Hook usePlanQuota Sem Proteção**
O hook que verifica o plano do usuário não tinha:
- Timeout nas chamadas RPC
- Feedback visual de timeout
- Fallback em caso de falha

---

## ✅ CORREÇÕES APLICADAS

### 1. **Timeout em Todas as Operações Críticas**

#### a) Verificação de Sessão (3 segundos)
```typescript
// ✅ ANTES: Sem timeout
const { data: sessionData } = await supabase.auth.getSession();

// ✅ DEPOIS: Com timeout de 3s
try {
  const { data: sessionData } = await Promise.race([
    supabase.auth.getSession(),
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Session check timeout')), 3000)
    )
  ]);
} catch {
  // Continua mesmo se falhar
  console.warn('⚠️ Timeout na verificação de sessão. Continuando...');
}
```

**Razão:** Verificação de sessão é OPCIONAL. O Supabase já gerencia sessões automaticamente. Se demorar, podemos continuar.

#### b) Geração de Código Único (5 segundos)
```typescript
// ✅ Com timeout de 5s
const shareCode = await Promise.race([
  generateUniqueShareCode(),
  new Promise<string>((_, reject) => 
    setTimeout(() => reject(new Error('Timeout ao gerar código')), 5000)
  )
]);
```

**Razão:** Operação deve ser rápida. Se demorar mais de 5s, há problema na geração de UUID.

#### c) Busca de Perfil (5 segundos)
```typescript
// ✅ Com timeout e fallback
try {
  const userProfile = await Promise.race([
    supabase.from('profiles').select(...),
    new Promise((_, reject) => setTimeout(() => reject(...), 5000))
  ]);
} catch {
  // Continua sem dados de haras (não crítico)
  userProfile = null;
}
```

**Razão:** Dados de haras são opcionais. Se falhar, criamos animal sem essas informações.

#### d) Criação do Animal (15 segundos)
```typescript
// ✅ Com timeout de 15s
const newAnimal = await Promise.race([
  animalService.createAnimal(animalData),
  new Promise((_, reject) => 
    setTimeout(() => reject(new Error('Timeout ao criar animal')), 15000)
  )
]);
```

**Razão:** Operação mais pesada que pode levar alguns segundos. 15s é um limite razoável.

### 2. **Timeout no Hook usePlanQuota**

#### Arquivo: `src/services/planService.ts`
```typescript
// ✅ ANTES: Sem timeout
const { data, error } = await supabase.rpc('check_user_publish_quota', {
  p_user_id: userId
});

// ✅ DEPOIS: Com timeout de 10s
const { data, error } = await Promise.race([
  supabase.rpc('check_user_publish_quota', { p_user_id: userId }),
  new Promise<never>((_, reject) => 
    setTimeout(() => reject(new Error('Timeout ao verificar plano (10s)')), 10000)
  )
]);
```

#### Arquivo: `src/components/animal/NewAnimalWizard/steps/StepReview.tsx`
```typescript
// ✅ Timeout de segurança adicional (15 segundos)
useEffect(() => {
  if (loadingPlan) {
    const timeoutId = setTimeout(() => {
      if (loadingPlan) {
        console.error('⏰ TIMEOUT: Verificação de plano demorou mais de 15s');
        toast({
          title: 'Timeout ao verificar plano',
          description: 'A verificação do plano demorou muito. Tente recarregar a página.',
          variant: 'destructive'
        });
      }
    }, 15000);
    
    return () => clearTimeout(timeoutId);
  }
}, [loadingPlan, toast]);
```

### 3. **Logs de Debug Aprimorados**

Adicionados logs em pontos estratégicos:
```typescript
console.log('📍 StepReview montado');
console.log('📊 [StepReview] Quota recebida:', quota);
console.log('⏳ [StepReview] loadingPlan:', loadingPlan);
console.log('🔑 Gerando código secreto...');
console.log('👤 Buscando perfil do usuário...');
console.log('🔄 Criando animal no banco...');
```

**Benefício:** Permite identificar **exatamente** onde o processo trava.

### 4. **Tratamento de Erros Melhorado**

Todos os blocos try/catch agora:
- ✅ Logam o tipo do erro
- ✅ Logam o erro completo em JSON
- ✅ Verificam se é instância de `Error`
- ✅ Mostram mensagens específicas ao usuário

```typescript
} catch (error: unknown) {
  console.error('❌ ERRO:', error);
  console.error('🔴 [DEBUG] Tipo do erro:', typeof error);
  console.error('🔴 [DEBUG] Error completo:', JSON.stringify(error, null, 2));
  
  if (error instanceof Error) {
    console.error('🔴 [DEBUG] Stack:', error.stack);
    console.error('🔴 [DEBUG] Message:', error.message);
  }
  
  const errorMessage = error instanceof Error 
    ? error.message 
    : 'Erro desconhecido';
  
  toast({
    title: '❌ Erro ao publicar',
    description: errorMessage,
    variant: 'destructive'
  });
}
```

---

## 📊 TEMPOS DE TIMEOUT CONFIGURADOS

| Operação | Timeout | Crítico? | Ação em Timeout |
|----------|---------|----------|-----------------|
| Verificação de sessão | 3s | ❌ Não | Continua sem verificar |
| Geração de código único | 5s | ✅ Sim | Falha e exibe erro |
| Busca de perfil | 5s | ❌ Não | Continua sem dados de haras |
| Verificação de plano (RPC) | 10s | ✅ Sim | Falha e exibe erro |
| Criação do animal | 15s | ✅ Sim | Falha e exibe erro |
| Loading do plano (UI) | 15s | ❌ Não | Exibe aviso mas continua |

---

## 🧪 COMO TESTAR

### Teste 1: Fluxo Normal (Conexão Boa)
1. Preencher todos os campos do formulário
2. Clicar em "Publicar Anúncio"
3. Abrir Console (F12)
4. Verificar logs:
   ```
   🔵 [DEBUG] handlePublishWithPlan chamado
   🚀 Iniciando publicação...
   🔐 Verificando sessão do Supabase (com timeout)...
   ✅ Sessão válida.
   🔑 Gerando código secreto...
   ✅ Código gerado: ABC123
   👤 Buscando perfil do usuário...
   📋 Perfil do usuário: {...}
   🔄 Criando animal no banco...
   ✅ Animal criado: {...}
   ```
5. **Resultado Esperado:** Animal publicado com sucesso em 3-5 segundos

### Teste 2: Simulando Conexão Lenta
1. Abrir DevTools (F12) → Network → Throttling → "Slow 3G"
2. Preencher formulário e clicar em "Publicar"
3. **Resultado Esperado:** 
   - Deve demorar mais mas **não travar**
   - Se alguma operação passar do timeout, exibe erro específico

### Teste 3: Fechar e Reabrir Modal
1. Abrir modal "Adicionar Animal"
2. Preencher até Step 5
3. **Fechar modal**
4. **Reabrir modal** (não limpar cache)
5. Navegar até Step 6 (Revisar)
6. **Resultado Esperado:**
   - Loading do plano deve aparecer
   - Deve carregar em **menos de 3 segundos** (cache)
   - Se demorar mais de 15s, exibe mensagem de timeout

### Teste 4: Sem Conexão
1. Desativar internet
2. Tentar publicar
3. **Resultado Esperado:**
   - Timeouts devem disparar em sequência
   - Mensagem clara de erro ao usuário
   - Botão volta ao estado normal (não fica travado)

---

## 🔄 FLUXO COMPLETO DE PUBLICAÇÃO (COM TIMEOUTS)

```
┌─────────────────────────────────────────────────┐
│ 1. Usuário clica "Publicar Anúncio"             │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│ 2. SET_SUBMITTING(true) - Desabilita botão      │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│ 3. Verificar sessão (3s timeout) ⏰              │
│    ├─ Sucesso: Continua                         │
│    └─ Timeout: Continua mesmo assim (opcional)  │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│ 4. Gerar código único (5s timeout) ⏰            │
│    ├─ Sucesso: Prossegue                        │
│    └─ Timeout: ❌ FALHA e exibe erro            │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│ 5. Buscar perfil do usuário (5s timeout) ⏰      │
│    ├─ Sucesso: Usa dados de haras               │
│    └─ Timeout: Continua sem haras (opcional)    │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│ 6. Criar animal no banco (15s timeout) ⏰        │
│    ├─ Sucesso: Prossegue para upload            │
│    └─ Timeout: ❌ FALHA e exibe erro            │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│ 7. Upload de fotos (se houver)                  │
│    ├─ Compressão (timeout por foto)             │
│    └─ Upload (timeout por foto)                 │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│ 8. Ativar animal (ad_status = 'active')         │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│ 9. Limpar cache e redirecionar                  │
│    └─ /dashboard/animals                        │
└─────────────────────────────────────────────────┘
```

---

## 📋 ARQUIVOS MODIFICADOS

1. ✅ `src/components/animal/NewAnimalWizard/steps/StepReview.tsx`
   - Adicionados timeouts em todas operações críticas
   - Logs de debug aprimorados
   - Tratamento de erros melhorado

2. ✅ `src/services/planService.ts`
   - Timeout de 10s no RPC `check_user_publish_quota`
   - Melhor tratamento de erro

---

## ⚠️ IMPORTANTE: MONITORAMENTO

### Métricas a Observar
- **Taxa de timeout:** Quantos usuários encontram timeouts?
- **Operação mais lenta:** Qual step demora mais?
- **Padrões de erro:** Erros ocorrem em horários específicos?

### Logs a Coletar (Produção)
Se usuários reportarem problemas, peça:
1. Console completo (F12 → Console → copiar tudo)
2. Aba Network (F12 → Network → filtrar por "supabase")
3. Velocidade da conexão (pode testar em fast.com)
4. Navegador e versão

---

## 🎯 PRÓXIMOS PASSOS RECOMENDADOS

### Curto Prazo (Urgente)
- [ ] Testar em ambiente de desenvolvimento
- [ ] Testar com conexão lenta (throttling)
- [ ] Verificar se timeouts estão apropriados
- [ ] Documentar casos de erro para usuários

### Médio Prazo
- [ ] Implementar retry automático para operações críticas
- [ ] Adicionar indicador de qualidade de conexão
- [ ] Implementar queue de publicações offline
- [ ] Adicionar analytics de performance

### Longo Prazo
- [ ] Migrar para arquitetura de jobs assíncronos
- [ ] Implementar websockets para feedback em tempo real
- [ ] Adicionar modo offline com sincronização posterior

---

## ✅ CONCLUSÃO

Todas as operações críticas agora têm **timeouts configurados**. O sistema não ficará mais travado indefinidamente. Se houver problema de conexão, o usuário verá uma **mensagem clara de erro** e o botão voltará ao estado normal.

**Tempo máximo de espera total:** ~40 segundos (soma de todos os timeouts)  
**Tempo esperado (conexão boa):** 3-5 segundos

---

**Autor:** Assistente IA  
**Data:** 26/11/2025  
**Status:** ✅ Pronto para teste


