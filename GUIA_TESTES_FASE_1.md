# 🧪 GUIA DE TESTES - FASE 1

**Data:** 03 de novembro de 2025  
**Implementações a Testar:** Correções Críticas + Campo Categoria

---

## 📋 PRÉ-REQUISITOS

### 1. Aplicar Migration no Supabase

**⚠️ IMPORTANTE:** A migration precisa ser aplicada antes dos testes!

**Arquivo:** `supabase_migrations/034_add_animal_category.sql`

**Conteúdo:**
```sql
-- Adicionar coluna category à tabela animals
ALTER TABLE animals 
ADD COLUMN IF NOT EXISTS category TEXT 
CHECK (category IN ('Garanhão', 'Doadora', 'Outro'));

-- Definir valor padrão 'Outro' para registros existentes
UPDATE animals 
SET category = 'Outro' 
WHERE category IS NULL;

-- Criar índice para otimizar filtros por categoria
CREATE INDEX IF NOT EXISTS idx_animals_category ON animals(category);
```

**Como aplicar:**
1. Acesse o Dashboard do Supabase: https://supabase.com/dashboard
2. Vá em SQL Editor
3. Cole o conteúdo da migration
4. Execute (RUN)
5. Verifique se retornou sucesso ✅

---

## 🚀 INICIAR SERVIDOR DE DESENVOLVIMENTO

```bash
cd "c:\Users\conta\Pictures\cavalaria-digital-showcase-main"
npm run dev
```

**URL esperada:** http://localhost:5173

---

## ✅ CHECKLIST DE TESTES

### 🔐 **TESTE 1: Login e Acesso ao Formulário**

**Credenciais:**
- Email: `haras.mcp2@teste.com.br`
- Senha: `12345678`

**Passos:**
1. [ ] Acessar http://localhost:5173/login
2. [ ] Fazer login com credenciais acima
3. [ ] Verificar se login foi bem-sucedido
4. [ ] Navegar para Dashboard
5. [ ] Clicar em "Adicionar Animal" ou "Meus Animais" → "Adicionar"

**Resultado Esperado:**
✅ Redirecionamento para formulário de cadastro

---

### 📝 **TESTE 2: Campo de Categoria no Formulário**

**Localização:** Primeira etapa do formulário (Informações Básicas)

**Verificações:**
1. [ ] Campo "Categoria *" está visível
2. [ ] É um campo obrigatório (asterisco vermelho)
3. [ ] Ao clicar, abre dropdown com 3 opções:
   - [ ] 🐴 Garanhão (Reprodutor Macho)
   - [ ] 🦄 Doadora (Reprodutora Fêmea)
   - [ ] 🐎 Outro
4. [ ] Texto explicativo abaixo: "Esta categoria ajudará outros usuários..."
5. [ ] Placeholder: "Selecione a categoria"

**Testar Validação:**
1. [ ] Preencher nome, raça, idade, gênero, pelagem
2. [ ] NÃO preencher categoria
3. [ ] Tentar avançar para próximo passo
4. [ ] **Esperado:** Não deve permitir avançar (campo obrigatório)

**Testar Seleção:**
1. [ ] Selecionar "Garanhão"
2. [ ] Verificar se valor é selecionado corretamente
3. [ ] Trocar para "Doadora"
4. [ ] Trocar para "Outro"
5. [ ] Avançar para próximo passo
6. [ ] **Esperado:** Deve permitir avançar

---

### 📅 **TESTE 3: Correção de Datas na Página de Eventos**

**URL:** http://localhost:5173/eventos

**Verificações:**
1. [ ] Acessar página de eventos
2. [ ] Verificar cards de eventos
3. [ ] **ANTES:** Mostrava "Invalid Date"
4. [ ] **AGORA:** Deve mostrar:
   - Data formatada (ex: "15/12/2025"), OU
   - "Data a confirmar" (se data inválida/nula)
5. [ ] Nenhum "Invalid Date" deve aparecer

**Resultado Esperado:**
✅ Todas as datas formatadas corretamente ou com fallback

---

### 🖼️ **TESTE 4: OptimizedImage (Verificação no Console)**

**Localização:** Console do Navegador (F12)

**Verificações:**
1. [ ] Abrir DevTools (F12)
2. [ ] Ir para aba "Console"
3. [ ] Navegar pela aplicação (Home, Buscar, Animais)
4. [ ] **ANTES:** Muitos erros 404 de imagens
5. [ ] **AGORA:** Deve ter avisos como:
   ```
   ⚠️ Failed to load image: [URL]
   ```
   Mas sem crashes ou erros vermelhos

**Verificação Visual:**
1. [ ] Procurar imagens quebradas (ícone 🔲)
2. [ ] **Esperado:** Placeholder deve aparecer automaticamente
3. [ ] Hover sobre imagens: devem ter lazy loading

---

### ⏳ **TESTE 5: Skeleton Loaders**

**Nota:** Skeletons foram criados mas ainda não aplicados em todas as páginas.

**Como testar:**
1. [ ] Simular conexão lenta (DevTools → Network → Slow 3G)
2. [ ] Navegar para página com carregamento de dados
3. [ ] **Esperado:** Ver animações de skeleton durante carregamento

**Locais para verificar no futuro:**
- Home (carrosséis de animais)
- Buscar (grid de resultados)
- Dashboard (estatísticas)

---

### 🔍 **TESTE 6: Validação de UUIDs (Console Limpo)**

**Localização:** Console do Navegador

**Verificações:**
1. [ ] Abrir DevTools Console
2. [ ] Navegar por páginas de animais
3. [ ] Clicar em cards de animais
4. [ ] **ANTES:** Erros como:
   ```
   ❌ invalid input syntax for type uuid: "1"
   ```
5. [ ] **AGORA:** Deve ter avisos como:
   ```
   ⚠️ [Analytics] Invalid contentId: 1. Skipping impression.
   ```
   Mas sem erros vermelhos de SQL

**Resultado Esperado:**
✅ Console mais limpo, sem erros de banco de dados

---

## 🐛 POSSÍVEIS PROBLEMAS E SOLUÇÕES

### Problema: Migration não aplicada
**Erro:** Campo `category` não encontrado ao salvar animal

**Solução:**
```sql
-- Executar novamente no SQL Editor do Supabase
ALTER TABLE animals ADD COLUMN IF NOT EXISTS category TEXT;
```

---

### Problema: TypeScript reclamando de `category`
**Erro:** Property 'category' does not exist on type 'Animal'

**Solução:**
1. Regenerar tipos do Supabase:
```bash
npm run generate:types
```
2. Ou adicionar manualmente em `src/types/supabase.ts`:
```typescript
export interface Animal {
  // ... outros campos
  category: 'Garanhão' | 'Doadora' | 'Outro' | null
}
```

---

### Problema: Campo categoria não aparece
**Possível causa:** Cache do navegador

**Solução:**
1. Hard refresh: `Ctrl + Shift + R`
2. Limpar cache e recarregar
3. Verificar se dev server está rodando

---

## 📊 RELATÓRIO DE TESTES

### Template para Preencher:

```markdown
## Resultados dos Testes - [DATA]

### Teste 1: Login e Acesso
- [ ] ✅ Login funcionou
- [ ] ❌ Problema encontrado: ___________

### Teste 2: Campo Categoria
- [ ] ✅ Campo aparece corretamente
- [ ] ✅ Validação funciona
- [ ] ✅ Seleção funciona
- [ ] ❌ Problema: ___________

### Teste 3: Datas nos Eventos
- [ ] ✅ Sem "Invalid Date"
- [ ] ✅ Datas formatadas corretamente
- [ ] ❌ Problema: ___________

### Teste 4: OptimizedImage
- [ ] ✅ Console mais limpo
- [ ] ✅ Placeholders aparecem
- [ ] ❌ Problema: ___________

### Teste 5: Skeleton Loaders
- [ ] ⏳ Não aplicado ainda (componentes criados)

### Teste 6: Validação UUID
- [ ] ✅ Sem erros de UUID no console
- [ ] ❌ Problema: ___________

---

### Bugs Encontrados:
1. ___________
2. ___________

### Sugestões de Melhoria:
1. ___________
2. ___________
```

---

## 🎯 CRITÉRIOS DE SUCESSO

### ✅ Implementação Bem-Sucedida Se:

1. **Campo Categoria:**
   - ✅ Aparece no formulário
   - ✅ Validação obrigatória funciona
   - ✅ 3 opções disponíveis
   - ✅ Dados salvam corretamente

2. **Datas:**
   - ✅ Zero "Invalid Date" visível
   - ✅ Fallback "Data a confirmar" funciona

3. **Imagens:**
   - ✅ Menos erros 404 no console
   - ✅ Placeholders aparecem automaticamente

4. **Console:**
   - ✅ Sem erros de UUID do tipo SQL
   - ✅ Avisos controlados e informativos

5. **Performance:**
   - ✅ Aplicação não trava com erros
   - ✅ UX mais fluida e profissional

---

## 📸 SCREENSHOTS RECOMENDADOS

Para documentação, capture:
1. [ ] Formulário com campo categoria
2. [ ] Dropdown aberto com 3 opções
3. [ ] Validação em ação (campo vazio)
4. [ ] Página de eventos com datas corretas
5. [ ] Console limpo (antes/depois)

---

## 🚀 PRÓXIMOS PASSOS APÓS TESTES

Se todos os testes passarem:
1. ✅ Marcar Fase 1 como **100% Concluída**
2. ⏳ Planejar Fase 2 (Filtros de busca por categoria)
3. ⏳ Aplicar skeleton loaders nas páginas principais
4. ⏳ Substituir `<img>` por `<OptimizedImage>` globalmente

---

## 📞 SUPORTE

Se encontrar problemas:
1. Verificar logs do console (F12)
2. Verificar se migration foi aplicada
3. Verificar se dev server está rodando
4. Limpar cache do navegador
5. Relatar bugs encontrados

---

**Boa sorte nos testes! 🚀**

*Guia criado por: Engenheiro de Software Sênior*  
*Data: 03 de novembro de 2025*


