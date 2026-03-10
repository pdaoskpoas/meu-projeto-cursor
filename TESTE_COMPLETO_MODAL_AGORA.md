# 🧪 TESTE COMPLETO: Modal "Cadastrar Novo Animal"

**Status:** ✅ Migration Aplicada  
**Próximo Passo:** Testar tudo!

---

## ⚡ TESTE RÁPIDO (2 minutos)

### 1. Verificar Função no Supabase

Execute no **Supabase SQL Editor:**

```sql
-- Testar com seu ID de usuário
-- Substituir 'SEU_USER_ID' pelo ID real
SELECT check_user_publish_quota('SEU_USER_ID');
```

**Resultado Esperado:**
```json
{
  "plan": "vip",  // ou basic, pro, ultra, free
  "plan_is_valid": true,
  "allowedByPlan": 15,
  "active": 3,
  "remaining": 12
}
```

✅ Se retornou JSON = **FUNCIONOU!**

---

### 2. Testar no Aplicativo

**Passo a Passo:**

1. **Atualizar página** (F5 ou Ctrl+R)
2. **Abrir Console do navegador** (F12 → Console)
3. **Clicar em "Adicionar Animal"**
4. **Preencher formulário** até a última etapa
5. **Chegar em "Revisar e Publicar"**

**O que verificar no Console:**

```javascript
// Deve aparecer:
[AnimalService] 🚀 Verificando plano (RPC otimizado): user-id-123
[AnimalService] ✅ Verificação completada em 0.32s  // ⚡ < 1s!
[AnimalService] 📊 Resultado: {
  plan: 'vip',           // ✅ Plano correto!
  planIsValid: true,
  allowed: 15,
  active: 3,
  remaining: 12
}
[ReviewAndPublish] ✅ Plano verificado
[ReviewAndPublish] Cenário: PLANO COM COTA - Plano: vip
[ReviewAndPublish] ✅ Loading finalizado
```

**✅ Se mostrou isso = PERFEITO!**

---

### 3. Verificar Interface

**Para Usuário VIP (ou com plano ativo):**

- ✅ Deve mostrar: **"Plano VIP • 12 vagas disponíveis"**
- ✅ Botão verde: **"🚀 Publicar Agora Gratuitamente"**
- ✅ Texto: **"Grátis - Incluído no seu plano"**
- ✅ **SEM** opção de pagamento de R$ 47,00

**Para Usuário FREE:**

- ✅ Deve mostrar: **"Você está no plano Free"**
- ✅ Opção 1: **"Publicar por R$ 47,00"** (botão laranja)
- ✅ Opção 2: **"Assinar um Plano"** (botão azul)

---

## 📊 CHECKLIST DE VALIDAÇÃO

### ✅ Performance
- [ ] Loading dura < 1 segundo (vs 5-10s antes)
- [ ] Console mostra tempo < 500ms
- [ ] Sem mensagem de timeout
- [ ] Resposta instantânea

### ✅ Funcionalidade VIP
- [ ] VIP identificado como VIP (não FREE)
- [ ] Mostra vagas disponíveis corretas
- [ ] Botão "Publicar Gratuitamente" aparece
- [ ] Não pede pagamento

### ✅ Funcionalidade FREE
- [ ] FREE identificado como FREE
- [ ] Mostra 2 opções (pagar ou assinar)
- [ ] Preço R$ 47,00 correto
- [ ] Link para planos funciona

### ✅ Outros Planos
- [ ] Basic mostra 10 anúncios
- [ ] Pro mostra 15 anúncios
- [ ] Ultra mostra 25 anúncios

---

## 🧪 TESTES DETALHADOS

### Teste 1: Performance ⚡

**Objetivo:** Confirmar que está rápido

**Como testar:**
1. Abrir DevTools (F12)
2. Ir em **Network**
3. Abrir modal até última etapa
4. Procurar chamada `check_user_publish_quota`
5. Verificar tempo de resposta

**Resultado Esperado:**
- ⚡ Tempo: < 500ms
- ✅ Status: 200 OK
- ✅ Response: JSON válido

---

### Teste 2: Identificação Correta de Plano ✅

**Objetivo:** Confirmar que planos são identificados corretamente

**Cenário A - Usuário VIP:**
```
Plano no banco: 'vip'
plan_expires_at: null (vitalício)

Resultado esperado:
✅ Mostra: "Plano VIP • X vagas"
✅ Permite publicar gratuitamente
✅ Console: plan: 'vip', planIsValid: true
```

**Cenário B - Usuário FREE:**
```
Plano no banco: 'free' ou null

Resultado esperado:
✅ Mostra: "Plano Free"
✅ Oferece pagamento ou upgrade
✅ Console: plan: 'free', planIsValid: false
```

**Cenário C - Usuário Basic:**
```
Plano no banco: 'basic'
plan_expires_at: 2025-12-31 (válido)

Resultado esperado:
✅ Mostra: "Plano Iniciante • X vagas"
✅ Limite: 10 anúncios
✅ Console: plan: 'basic', allowedByPlan: 10
```

---

### Teste 3: Contagem de Anúncios 📊

**Objetivo:** Confirmar que conta corretamente

**Como testar:**
1. Verificar quantos anúncios ativos você tem
2. Abrir modal
3. Comparar com o que aparece

**SQL para verificar:**
```sql
-- Seus anúncios ativos
SELECT COUNT(*) as total
FROM animals
WHERE owner_id = 'SEU_USER_ID'
  AND ad_status = 'active'
  AND (is_individual_paid IS NULL OR is_individual_paid = false);
```

**Resultado Esperado:**
- ✅ Contagem no SQL = Contagem no modal
- ✅ Vagas disponíveis = Limite - Ativos

---

### Teste 4: Limite Atingido 🚫

**Objetivo:** Verificar comportamento ao atingir limite

**Como testar:**
1. Publicar anúncios até atingir limite do plano
2. Tentar publicar mais um
3. Verificar opções oferecidas

**Resultado Esperado:**
- ✅ Mostra: "Limite Mensal Atingido"
- ✅ Opção 1: Pagar R$ 47,00 individualmente
- ✅ Opção 2: Fazer upgrade de plano
- ✅ Não permite publicar gratuitamente

---

### Teste 5: Fluxo Completo de Publicação 🚀

**Objetivo:** Publicar um animal do início ao fim

**Passo a Passo:**

1. **Etapa 1 - Informações Básicas:**
   - Nome: "Cavalo Teste"
   - Raça: "Mangalarga"
   - Data: "2020-01-01"
   - Sexo: "Macho"
   - Pelagem: "Alazão"
   - Categoria: "Garanhão"
   - ✅ Clicar "Próximo"

2. **Etapa 2 - Localização:**
   - Cidade: "São Paulo"
   - Estado: "SP"
   - ✅ Clicar "Próximo"

3. **Etapa 3 - Fotos:**
   - Upload de 1 foto (mínimo)
   - ✅ Verificar preview
   - ✅ Clicar "Próximo"

4. **Etapa 4 - Genealogia:**
   - (Opcional) Pular ou preencher
   - ✅ Clicar "Próximo"

5. **Etapa 5 - Extras:**
   - (Opcional) Adicionar descrição
   - ✅ Clicar "Próximo"

6. **Etapa 6 - Revisar e Publicar:**
   - ✅ Verificar dados
   - ✅ Confirmar plano correto
   - ✅ Clicar botão de publicar

**Resultado Esperado:**
- ✅ Publicação bem-sucedida
- ✅ Redirecionamento
- ✅ Animal aparece em "Meus Animais"
- ✅ Foto carregada corretamente

---

## 🐛 SE ALGO NÃO FUNCIONAR

### Erro 1: Ainda mostra erro de timeout

**Diagnóstico:**
```sql
-- Verificar se função existe
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name = 'check_user_publish_quota';
```

**Se retornar vazio:**
- ❌ Função não foi criada
- ✅ Reaplicar migration SQL

---

### Erro 2: VIP ainda aparece como FREE

**Diagnóstico:**
```sql
-- Verificar plano do usuário
SELECT id, name, plan, plan_expires_at 
FROM profiles 
WHERE id = 'SEU_USER_ID';
```

**Verificar:**
- plan = 'vip' ✅
- plan_expires_at = NULL ✅ (vitalício)

**Se plan_expires_at tiver data antiga:**
```sql
-- Corrigir VIP para vitalício
UPDATE profiles 
SET plan_expires_at = NULL 
WHERE plan = 'vip';
```

---

### Erro 3: Contagem errada de anúncios

**Diagnóstico:**
```sql
-- Ver detalhes dos anúncios
SELECT 
  id, 
  name, 
  ad_status, 
  is_individual_paid,
  published_at,
  expires_at
FROM animals
WHERE owner_id = 'SEU_USER_ID'
ORDER BY published_at DESC;
```

**Verificar:**
- Apenas `ad_status = 'active'` devem contar
- `is_individual_paid = true` NÃO devem contar

---

### Erro 4: Lento ainda

**Diagnóstico:**
```sql
-- Verificar se índice existe
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'animals' 
  AND indexname = 'idx_animals_owner_active_individual';
```

**Se não existir:**
```sql
CREATE INDEX idx_animals_owner_active_individual
ON animals(owner_id, ad_status, is_individual_paid)
WHERE ad_status = 'active' 
  AND (is_individual_paid IS NULL OR is_individual_paid = false);
```

---

## 📸 SCREENSHOTS ESPERADOS

### Usuário VIP:
```
┌─────────────────────────────────────────┐
│  Plano VIP • 12 vagas disponíveis      │
│                                         │
│  Custo: Grátis                         │
│  Incluído no seu plano                 │
│                                         │
│  [🚀 Publicar Agora Gratuitamente]    │
│                                         │
│  ✅ Seu anúncio ficará ativo por 30    │
│     dias                               │
└─────────────────────────────────────────┘
```

### Usuário FREE:
```
┌─────────────────────────────────────────┐
│  Escolha a Forma de Publicação         │
│  Você está no plano Free               │
│                                         │
│  ┌─────────┐  ┌──────────┐           │
│  │ 💰 R$47 │  │ ⭐ Plano  │           │
│  │ 30 dias │  │ 10-25 ads│           │
│  └─────────┘  └──────────┘           │
└─────────────────────────────────────────┘
```

---

## ✅ RESULTADO FINAL

Após os testes, você deve ter:

1. ✅ **Performance:** 5-25x mais rápido
2. ✅ **Precisão:** Planos identificados corretamente
3. ✅ **Funcionalidade:** Todos os cenários funcionando
4. ✅ **UX:** Interface clara e responsiva

---

## 🎯 PRÓXIMOS PASSOS

1. **Testar com diferentes usuários**
2. **Monitorar logs no Supabase**
3. **Validar em produção**
4. **Coletar feedback de usuários**

---

## 📝 RELATÓRIO DE TESTE

Preencha após testar:

- [ ] ✅ Função RPC funciona
- [ ] ✅ Performance < 1s
- [ ] ✅ VIP identificado corretamente
- [ ] ✅ FREE identificado corretamente
- [ ] ✅ Basic/Pro/Ultra funcionam
- [ ] ✅ Contagem correta
- [ ] ✅ Limite atingido funciona
- [ ] ✅ Publicação completa funciona

---

**🚀 COMECE OS TESTES AGORA!**


