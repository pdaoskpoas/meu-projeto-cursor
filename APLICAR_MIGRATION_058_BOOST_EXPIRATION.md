# 🚀 APLICAR MIGRATION 058 - Corrigir Busca com Boost Expirado

**Data:** 14/11/2025  
**Prioridade:** 🔴 **ALTA**  
**Tempo estimado:** 2 minutos

---

## 📋 O Que Esta Migration Faz

Esta migration corrige a função `search_animals()` no banco de dados para:

1. ✅ **Considerar apenas boosts ATIVOS** na ordenação (não expirados)
2. ✅ **Priorizar animais impulsionados** com boost ativo na busca
3. ✅ **Ordenar corretamente** dentro de cada grupo (boosted/não-boosted) por cliques
4. ✅ **Tratar boosts expirados** como animais não-boosted na ordenação

---

## 🎯 Problema Que Resolve

### Antes (❌ PROBLEMA)

Na página "Buscar", quando o usuário ordenava por "Mais Relevantes":
- ❌ Animais com boost **expirado** apareciam primeiro (incorreto!)
- ❌ Ordenação por cliques não funcionava corretamente dentro dos boosted
- ❌ Usuários pagavam por destaque que já havia expirado

### Depois (✅ CORRETO)

Na página "Buscar", quando o usuário ordena por "Mais Relevantes":

**Grupo 1 (Boosted Ativos):**
- ✅ **1º lugar:** Animais impulsionados (boost ativo) com MAIS cliques
- ✅ **2º lugar:** Animais impulsionados (boost ativo) com MENOS cliques

**Grupo 2 (Todos os Demais - ordenados por cliques):**
- ✅ **3º lugar:** Animais com boost EXPIRADO ou SEM boost - quem tiver MAIS cliques
- ✅ **4º lugar:** Animais com boost EXPIRADO ou SEM boost - quem tiver MENOS cliques

**Exemplo:** Odin (boost expirado, 300 cliques) aparece ANTES de Thor (sem boost, 200 cliques)

---

## 📦 Passo a Passo para Aplicar

### 1️⃣ **Conectar ao Supabase**

Acesse: [https://supabase.com/dashboard](https://supabase.com/dashboard)

1. Selecione seu projeto
2. Vá em **SQL Editor** (menu lateral esquerdo)
3. Clique em **+ New query**

---

### 2️⃣ **Copiar e Colar o SQL**

Abra o arquivo:
```
supabase_migrations/058_fix_search_animals_boost_expiration.sql
```

**Copie TODO o conteúdo** do arquivo e cole no SQL Editor do Supabase.

---

### 3️⃣ **Executar a Migration**

1. Clique no botão **Run** (ou pressione `Ctrl + Enter` / `Cmd + Enter`)
2. Aguarde a execução (deve levar ~2 segundos)
3. Verifique se apareceram mensagens de sucesso:
   ```
   ✅ Função search_animals criada com sucesso!
   ✅ Teste executado com sucesso! Encontrados X resultados
   ```

---

### 4️⃣ **Validar a Correção**

Execute o seguinte SQL para testar:

```sql
-- Teste: Buscar animais ordenados por relevância
SELECT 
  name,
  is_boosted,
  boost_expires_at,
  click_count,
  impression_count
FROM search_animals(
  search_term := NULL,
  breed_filter := NULL,
  state_filter := NULL,
  city_filter := NULL,
  gender_filter := NULL,
  property_type_filter := NULL,
  category_filter := NULL,
  order_by := 'ranking',
  limit_count := 20,
  offset_count := 0
);
```

**✅ Resultado esperado:**
- Primeiros resultados devem ter `is_boosted = true` E `boost_expires_at > NOW()`
- Dentro dos boosted, ordenados por `click_count` (maior primeiro)
- Depois vêm os não-boosted, também ordenados por `click_count`

---

### 5️⃣ **Testar no Front-End**

1. Acesse a página **"Buscar"** do site
2. Use o filtro **"Ordenar por: Mais Relevantes"**
3. Verifique se:
   - ✅ Animais impulsionados aparecem primeiro
   - ✅ Animais com boost expirado NÃO aparecem no topo
   - ✅ Ordenação por cliques está funcionando

---

## 🔍 Como Funciona a Nova Ordenação

### Exemplo Prático

**Cenário:** 5 animais cadastrados

| Animal | Boost Ativo? | Cliques | Posição Final |
|--------|-------------|---------|---------------|
| Zeus   | ✅ SIM      | 150     | 🥇 **1º**    |
| Apollo | ✅ SIM      | 80      | 🥈 **2º**    |
| **Odin**   | ⏱️ **EXPIRADO** | **300**     | 🥉 **3º**    |
| **Thor**   | ❌ NÃO      | **200**     | **4º**       |
| Loki   | ❌ NÃO      | 50      | **5º**       |

**Lógica:**
1. **Zeus e Apollo** têm boost ATIVO → aparecem primeiro
2. Dentro dos boosted ativos, **Zeus (150 cliques)** vem antes de **Apollo (80 cliques)**
3. **Odin** teve boost mas EXPIROU → vai para o grupo dos "demais"
4. No grupo dos "demais", ordena por cliques: **Odin (300)** → **Thor (200)** → **Loki (50)**
5. Resultado: Boosted ativos primeiro, depois TODOS os outros por cliques

**OBS:** Quando Odin renovar o boost, ele volta para o topo (antes de Zeus e Apollo se tiver mais cliques que eles).

---

## 🛡️ Segurança e Reversão

### Reversão (Se Necessário)

Se algo der errado, você pode reverter para a versão anterior:

```sql
-- REVERTER para versão antiga (SEM filtro de expiração)
DROP FUNCTION IF EXISTS search_animals(
    text, text, text, text, text, text, text, text, integer, integer
);

-- [Colar aqui o código da migration 038 anterior]
```

**Importante:** Guarde o SQL da migration 038 antes de aplicar a 058!

---

## ✅ Checklist de Validação

Após aplicar a migration, confirme:

- [ ] Migration executada sem erros
- [ ] Função `search_animals` existe no banco
- [ ] Teste SQL retorna resultados ordenados corretamente
- [ ] Página "Buscar" exibe animais boosted primeiro
- [ ] Animais com boost expirado NÃO aparecem no topo
- [ ] Ordenação por cliques está funcionando
- [ ] Nenhum erro no console do navegador

---

## 📞 Suporte

Se encontrar algum problema durante a aplicação:

1. Verifique se há erros no SQL Editor do Supabase
2. Confira se o arquivo SQL foi copiado completamente
3. Teste com a query de validação fornecida acima
4. Em caso de dúvida, reverta para a versão anterior (migration 038)

---

## 🎉 Resultado Final

Após aplicar esta migration, o sistema estará funcionando corretamente:

✅ **Página Home:**
- Seção "Animais em Destaque" exibe TODOS os animais com boost ativo
- Animais com boost expirado são removidos automaticamente

✅ **Página Buscar:**
- Ordenação "Mais Relevantes" prioriza animais com boost ativo
- Dentro de cada grupo, ordena por cliques (mais cliques primeiro)
- Experiência justa para todos os usuários

✅ **Sistema de Monetização:**
- Boosts funcionam corretamente (aparecem enquanto ativos)
- Quando expira, o destaque é removido automaticamente
- Usuários pagam apenas pelo tempo de destaque ativo

---

**Desenvolvedor:** Claude (Cursor AI)  
**Aprovação:** Pendente de aplicação em produção

