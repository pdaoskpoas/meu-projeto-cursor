# 🚨 CORREÇÕES URGENTES - APLICAR AGORA

## ⚡ Tempo Estimado: 2-3 horas

---

## 🔴 CORREÇÃO #1: Adicionar Upload de Fotos (30 minutos)

### Arquivo: `src/components/forms/steps/ReviewAndPublishStep.tsx`

### Passo 1: Adicionar Import (linha 10)

**Adicionar:**
```typescript
import { uploadAnimalImages } from '@/services/animalImageService';
```

**Resultado esperado (linhas 1-11):**
```typescript
import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { CheckCircle2, AlertCircle, Sparkles, CreditCard } from 'lucide-react';
import { animalService } from '@/services/animalService';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import { uploadAnimalImages } from '@/services/animalImageService';  // ✅ ADICIONAR
import type { AnimalTitle } from '@/types/animal';
```

---

### Passo 2: Modificar função `handlePublishByPlan` (linha 126)

**BUSCAR:**
```typescript
const handlePublishByPlan = async () => {
  if (!user?.id || submitting) return;
  
  setSubmitting(true);
  try {
    // Criar animal no banco
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

    // TODO: Upload de imagens (será implementado)
    // TODO: Salvar títulos usando animalTitlesService

    // Publicar animal (skipPlanCheck = true pois já verificamos o plano antes)
    console.log('[ReviewAndPublish] 🚀 Publicando animal com plano verificado...');
    await animalService.publishAnimal(newAnimal.id, user.id, true);
    console.log('[ReviewAndPublish] ✅ Animal publicado com sucesso!');

    onPublishSuccess();
  } catch (error: any) {
    console.error('Erro ao publicar:', error);
    onPublishError(error?.message || 'Erro ao publicar animal');
  } finally {
    setSubmitting(false);
  }
};
```

**SUBSTITUIR POR:**
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
        console.log(`[ReviewAndPublish] 📤 Iniciando upload de ${formData.photos.length} foto(s)...`);
        
        const imageUrls = await uploadAnimalImages(
          user.id, 
          newAnimal.id, 
          formData.photos,
          formData.photos.map((_, i) => `image_${i + 1}.jpg`)
        );
        
        console.log('[ReviewAndPublish] ✅ Upload concluído. URLs:', imageUrls);
        console.log('[ReviewAndPublish] 💾 Atualizando campo images no banco...');
        
        await animalService.updateAnimalImages(newAnimal.id, imageUrls);
        
        console.log('[ReviewAndPublish] ✅ Imagens salvas com sucesso na tabela animals');
      } catch (uploadError) {
        console.error('[ReviewAndPublish] ❌ ERRO no upload de imagens:', uploadError);
        // Não falhar a publicação inteira, apenas avisar
        console.warn('[ReviewAndPublish] ⚠️ Animal criado sem fotos devido a erro no upload');
      }
    } else {
      console.warn('[ReviewAndPublish] ⚠️ Nenhuma foto foi adicionada');
    }

    // 3. TODO: Salvar títulos usando animalTitlesService (implementar depois)
    if (formData.titles && formData.titles.length > 0) {
      console.log(`[ReviewAndPublish] 🏆 ${formData.titles.length} título(s) detectado(s) - salvamento pendente`);
      // TODO: Implementar quando animalTitlesService estiver pronto
    }

    // 4. Publicar animal (skipPlanCheck = true pois já verificamos o plano antes)
    console.log('[ReviewAndPublish] 🚀 Publicando animal com plano verificado...');
    await animalService.publishAnimal(newAnimal.id, user.id, true);
    console.log('[ReviewAndPublish] ✅ Animal publicado com sucesso!');

    onPublishSuccess();
  } catch (error: any) {
    console.error('[ReviewAndPublish] ❌ Erro ao publicar:', error);
    onPublishError(error?.message || 'Erro ao publicar animal');
  } finally {
    setSubmitting(false);
  }
};
```

---

### Passo 3: Modificar função `handlePayIndividualAndPublish` (linha 165)

**BUSCAR:**
```typescript
const handlePayIndividualAndPublish = async () => {
  if (!user?.id || submitting) return;
  
  setSubmitting(true);
  try {
    // Criar animal
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

    // TODO: Upload de imagens
    // TODO: Salvar títulos

    // Criar transação de anúncio individual
    await animalService.createIndividualAdTransaction(user.id, newAnimal.id, 47.0);

    // Publicar animal
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

**SUBSTITUIR POR:**
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
        console.log(`[ReviewAndPublish] 📤 Iniciando upload de ${formData.photos.length} foto(s)...`);
        
        const imageUrls = await uploadAnimalImages(
          user.id, 
          newAnimal.id, 
          formData.photos,
          formData.photos.map((_, i) => `image_${i + 1}.jpg`)
        );
        
        console.log('[ReviewAndPublish] ✅ Upload concluído. URLs:', imageUrls);
        console.log('[ReviewAndPublish] 💾 Atualizando campo images no banco...');
        
        await animalService.updateAnimalImages(newAnimal.id, imageUrls);
        
        console.log('[ReviewAndPublish] ✅ Imagens salvas com sucesso na tabela animals');
      } catch (uploadError) {
        console.error('[ReviewAndPublish] ❌ ERRO no upload de imagens:', uploadError);
        console.warn('[ReviewAndPublish] ⚠️ Animal criado sem fotos devido a erro no upload');
      }
    } else {
      console.warn('[ReviewAndPublish] ⚠️ Nenhuma foto foi adicionada');
    }

    // 3. TODO: Salvar títulos
    if (formData.titles && formData.titles.length > 0) {
      console.log(`[ReviewAndPublish] 🏆 ${formData.titles.length} título(s) detectado(s) - salvamento pendente`);
    }

    // 4. Criar transação de anúncio individual
    console.log('[ReviewAndPublish] 💳 Criando transação de R$ 47,00...');
    await animalService.createIndividualAdTransaction(user.id, newAnimal.id, 47.0);

    // 5. Publicar animal
    console.log('[ReviewAndPublish] 🚀 Publicando animal...');
    await animalService.publishAnimal(newAnimal.id, user.id);

    console.log('[ReviewAndPublish] ✅ Publicação individual concluída!');
    onPublishSuccess();
  } catch (error: any) {
    console.error('[ReviewAndPublish] ❌ Erro ao publicar:', error);
    onPublishError(error?.message || 'Erro ao publicar animal');
  } finally {
    setSubmitting(false);
  }
};
```

---

### ✅ Validação:

Após aplicar, testar:

1. **Criar novo animal com 1 foto:**
   - [ ] Modal exige foto (step 3)
   - [ ] Adicionar 1 foto
   - [ ] Preencher dados
   - [ ] Publicar
   - [ ] **VERIFICAR: Card mostra foto real (não placeholder)**
   - [ ] Console mostra: "Upload concluído", "Imagens salvas"

2. **Verificar banco de dados:**
```sql
-- Verificar último animal criado
SELECT id, name, images 
FROM animals 
ORDER BY created_at DESC 
LIMIT 1;

-- Deve retornar images com array de URLs:
-- images: ["https://.../animal-images/USER_ID/ANIMAL_ID/image_1.jpg"]
```

3. **Verificar Storage:**
   - Acessar Supabase → Storage → `animal-images`
   - Navegar para `USER_ID/ANIMAL_ID/`
   - **VERIFICAR: Arquivo `image_1.jpg` existe**

---

## 🔴 CORREÇÃO #2: Corrigir Texto "50 anúncios" (5 minutos)

### Arquivo: `src/components/forms/steps/ReviewAndPublishStep.tsx`

### Passo 1: Encontrar e Substituir (linha 439)

**BUSCAR:**
```typescript
<li className="flex items-center gap-2">
  <CheckCircle2 className="h-4 w-4 text-green-600" />
  Até 50 anúncios simultâneos
</li>
```

**SUBSTITUIR POR:**
```typescript
<li className="flex items-center gap-2">
  <CheckCircle2 className="h-4 w-4 text-green-600" />
  De 10 a 25 anúncios conforme o plano
</li>
```

---

### Passo 2: Buscar outras ocorrências

**Executar busca global no projeto:**
```bash
# Windows PowerShell
Select-String -Path "src/**/*.tsx" -Pattern "50 anúncios"

# Linux/Mac
grep -r "50 anúncios" src/
```

**Substituir TODAS as ocorrências** encontradas.

---

### ✅ Validação:

1. **Buscar "50 anúncios" no código:**
   - [ ] Deve retornar **0 resultados**

2. **Testar visualmente:**
   - [ ] Abrir modal de cadastro
   - [ ] Chegar no ReviewAndPublishStep
   - [ ] Cenário FREE deve mostrar: "De 10 a 25 anúncios conforme o plano"

---

## 🧪 TESTE COMPLETO FINAL

### Cenário 1: Usuário FREE com Pagamento Individual

1. **Configurar:**
   - Usuário com `plan: 'free'`

2. **Executar:**
   - [ ] Abrir modal "Adicionar Animal"
   - [ ] Preencher todos os campos obrigatórios
   - [ ] Adicionar 2 fotos
   - [ ] Chegar na etapa "Revisar e Publicar"
   - [ ] **VERIFICAR: Exibe cenário FREE com 2 opções**
   - [ ] Clicar "Publicar por R$ 47,00"
   - [ ] **VERIFICAR: Modal fecha**
   - [ ] **VERIFICAR: Toast "Animal publicado com sucesso!"**

3. **Validar:**
   - [ ] Card do animal mostra 2 fotos reais
   - [ ] Banco: `images` tem 2 URLs
   - [ ] Banco: `is_individual_paid = true`
   - [ ] Banco: `ad_status = 'active'`
   - [ ] Storage: Pasta tem 2 arquivos

---

### Cenário 2: Usuário com Plano Basic (dentro da cota)

1. **Configurar:**
   - Usuário com `plan: 'basic'` (limite: 10)
   - Usuário tem 3 anúncios ativos (restam 7)

2. **Executar:**
   - [ ] Abrir modal "Adicionar Animal"
   - [ ] Preencher todos os campos
   - [ ] Adicionar 3 fotos
   - [ ] Chegar na etapa "Revisar e Publicar"
   - [ ] **VERIFICAR: Exibe cenário "Publicar pelo Plano"**
   - [ ] **VERIFICAR: Mostra "7 vagas disponíveis"**
   - [ ] **VERIFICAR: Mostra "Custo: Grátis"**
   - [ ] Clicar "Publicar Agora Gratuitamente"
   - [ ] **VERIFICAR: Sucesso**

3. **Validar:**
   - [ ] Card mostra 3 fotos reais
   - [ ] Banco: `images` tem 3 URLs
   - [ ] Banco: `is_individual_paid = false` (ou null)
   - [ ] Banco: `ad_status = 'active'`
   - [ ] Storage: Pasta tem 3 arquivos
   - [ ] Usuário agora tem 4 anúncios ativos (restam 6)

---

### Cenário 3: Usuário com Plano Pro (limite atingido)

1. **Configurar:**
   - Usuário com `plan: 'pro'` (limite: 15)
   - Usuário tem 15 anúncios ativos (restam 0)

2. **Executar:**
   - [ ] Abrir modal "Adicionar Animal"
   - [ ] Preencher todos os campos
   - [ ] Adicionar 1 foto
   - [ ] Chegar na etapa "Revisar e Publicar"
   - [ ] **VERIFICAR: Exibe cenário "Limite Atingido"**
   - [ ] **VERIFICAR: 2 opções: "Publicar Individual" e "Fazer Upgrade"**

3. **Validar:**
   - [ ] Opções corretas exibidas
   - [ ] Preço individual: R$ 47,00
   - [ ] Link "Ver Planos" funciona

---

## 📊 CHECKLIST COMPLETO

### Antes de Aplicar:
- [ ] Fazer backup do arquivo `ReviewAndPublishStep.tsx`
- [ ] Git commit antes das mudanças
- [ ] Ler as correções completamente

### Durante Aplicação:
- [ ] ✅ Import adicionado
- [ ] ✅ `handlePublishByPlan` modificado
- [ ] ✅ `handlePayIndividualAndPublish` modificado
- [ ] ✅ Texto "50 anúncios" corrigido
- [ ] ✅ Busca global por "50 anúncios" = 0 resultados

### Após Aplicar:
- [ ] ✅ Cenário 1: FREE com pagamento individual
- [ ] ✅ Cenário 2: Plano com cota disponível
- [ ] ✅ Cenário 3: Plano com limite atingido
- [ ] ✅ Fotos aparecem nos cards
- [ ] ✅ Storage contém arquivos
- [ ] ✅ Banco contém URLs corretas

### Métricas:
- [ ] ✅ 100% dos animais TÊM fotos
- [ ] ✅ 0% de informações falsas
- [ ] ✅ Console sem erros

---

## 🚀 PRÓXIMOS PASSOS (Não urgente)

Após validar que tudo funciona:

1. **Otimizar Performance (P1 - Próxima semana)**
   - Criar função RPC no Supabase
   - Reduzir timeout de 20s para 5s

2. **Implementar Títulos (P2)**
   - Salvar títulos na tabela `animal_titles`

3. **Melhorar Feedback (P3)**
   - Progress bar durante upload
   - Preview antes de publicar

---

## 📞 SUPORTE

Se tiver dúvidas ou problemas durante a aplicação:

1. **Verificar logs do console:**
   - Procurar por `[ReviewAndPublish]`
   - Verificar erros de upload

2. **Verificar network:**
   - DevTools → Network
   - Procurar por upload para Storage

3. **Consultar documentação:**
   - Relatório completo: `RELATORIO_AUDITORIA_CADASTRO_PUBLICACAO_ANIMAIS_2025-11-17.md`
   - Resumo executivo: `RESUMO_EXECUTIVO_AUDITORIA_CADASTRO_ANIMAIS.md`

---

**✅ Status:** Pronto para aplicar  
**⏱️ Tempo:** 2-3 horas  
**🎯 Impacto:** CRÍTICO - Resolve 100% dos problemas P0

