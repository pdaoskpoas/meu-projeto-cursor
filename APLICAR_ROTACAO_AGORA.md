# 🚀 GUIA RÁPIDO: APLICAR SISTEMA DE ROTAÇÃO

## ⏰ TEMPO TOTAL: 5 MINUTOS

---

## 📋 PASSO A PASSO

### **PASSO 1: Aplicar Migration SQL** (2 minutos)

#### Opção A: Via Supabase Dashboard (Recomendado)

```
1. Abrir: https://supabase.com/dashboard/project/SEU_PROJETO
2. Ir em: SQL Editor (menu lateral esquerdo)
3. Click: + New Query
4. Colar: Conteúdo completo de 062_featured_animals_rotation.sql
5. Click: Run (ou Ctrl+Enter)
6. Aguardar: "Migration 062 aplicada com sucesso!"
```

#### Opção B: Via CLI

```bash
cd seu-projeto
supabase db execute -f supabase_migrations/062_featured_animals_rotation.sql
```

### **PASSO 2: Validar Migration** (1 minuto)

Execute no SQL Editor:

```sql
-- Confirmar que função foi criada
SELECT 
    proname AS nome_funcao,
    pronargs AS num_parametros
FROM pg_proc
WHERE proname LIKE '%featured_animals_rotated%';

-- Deve retornar 2 linhas:
-- 1. get_featured_animals_rotated
-- 2. get_featured_animals_rotated_fast
```

### **PASSO 3: Testar Função** (1 minuto)

```sql
-- Testar rotação
SELECT 
    name AS nome_animal,
    rotation_position AS posicao,
    boosted_at AS impulsionado_em
FROM get_featured_animals_rotated_fast(10)
ORDER BY rotation_position;

-- Deve retornar até 10 anúncios ordenados
```

### **PASSO 4: Deploy do Frontend** (1 minuto)

O código já está atualizado! Apenas fazer build/deploy normal:

```bash
# Se usa Vercel/Netlify
git add .
git commit -m "feat: implementa sistema de rotação equitativa"
git push origin main

# Build automático acontecerá

# OU build local
npm run build
```

---

## ✅ VERIFICAÇÃO FINAL

### **No SQL Editor:**

```sql
-- Ver quantos anúncios impulsionados existem
SELECT COUNT(*) AS total_impulsionados
FROM animals
WHERE is_boosted = TRUE
  AND boost_expires_at > NOW()
  AND ad_status = 'active';

-- Ver ordem atual
SELECT 
    name,
    rotation_position
FROM get_featured_animals_rotated_fast(10);
```

### **Na Página Home:**

```
1. Abrir: http://seu-site.com
2. Observar: Seção "Animais em Destaque"
3. Contar: Deve haver no máximo 10 anúncios
4. Anotar: Os nomes dos primeiros 3 anúncios
5. Aguardar: 1-2 minutos
6. Recarregar: F5
7. Verificar: A ordem mudou!
```

---

## 🎯 EXEMPLO VISUAL DE FUNCIONAMENTO

```
═══════════════════════════════════════════════════════════
  CENÁRIO: 15 ANÚNCIOS IMPULSIONADOS (A1 até A15)
═══════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────┐
│  MINUTO 0 (Homepage carrega às 10:00)                   │
├─────────────────────────────────────────────────────────┤
│  Posição 1:  A1  ← Primeiro                             │
│  Posição 2:  A2                                         │
│  Posição 3:  A3                                         │
│  Posição 4:  A4                                         │
│  Posição 5:  A5                                         │
│  Posição 6:  A6                                         │
│  Posição 7:  A7                                         │
│  Posição 8:  A8                                         │
│  Posição 9:  A9                                         │
│  Posição 10: A10 ← Último visível                       │
│                                                          │
│  FORA DA TELA: A11, A12, A13, A14, A15                  │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  MINUTO 1 (Homepage recarrega às 10:01)                 │
├─────────────────────────────────────────────────────────┤
│  Posição 1:  A2  ← Agora é o primeiro                   │
│  Posição 2:  A3                                         │
│  Posição 3:  A4                                         │
│  Posição 4:  A5                                         │
│  Posição 5:  A6                                         │
│  Posição 6:  A7                                         │
│  Posição 7:  A8                                         │
│  Posição 8:  A9                                         │
│  Posição 9:  A10                                        │
│  Posição 10: A11 ← Novo anúncio visível                 │
│                                                          │
│  FORA DA TELA: A12, A13, A14, A15, A1                   │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  MINUTO 5 (Homepage recarrega às 10:05)                 │
├─────────────────────────────────────────────────────────┤
│  Posição 1:  A6  ← Avançou 5 posições                   │
│  Posição 2:  A7                                         │
│  Posição 3:  A8                                         │
│  Posição 4:  A9                                         │
│  Posição 5:  A10                                        │
│  Posição 6:  A11                                        │
│  Posição 7:  A12                                        │
│  Posição 8:  A13                                        │
│  Posição 9:  A14                                        │
│  Posição 10: A15 ← Último anúncio visível               │
│                                                          │
│  FORA DA TELA: A1, A2, A3, A4, A5                       │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  MINUTO 10 (Homepage recarrega às 10:10)                │
├─────────────────────────────────────────────────────────┤
│  Posição 1:  A11 ← Anúncios que estavam fora agora top  │
│  Posição 2:  A12                                        │
│  Posição 3:  A13                                        │
│  Posição 4:  A14                                        │
│  Posição 5:  A15                                        │
│  Posição 6:  A1  ← Voltou para ser visível             │
│  Posição 7:  A2                                         │
│  Posição 8:  A3                                         │
│  Posição 9:  A4                                         │
│  Posição 10: A5                                         │
│                                                          │
│  FORA DA TELA: A6, A7, A8, A9, A10                      │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  MINUTO 15 (Homepage recarrega às 10:15)                │
├─────────────────────────────────────────────────────────┤
│  Posição 1:  A1  ← Voltou ao início (ciclo completo)    │
│  Posição 2:  A2                                         │
│  Posição 3:  A3                                         │
│  Posição 4:  A4                                         │
│  Posição 5:  A5                                         │
│  Posição 6:  A6                                         │
│  Posição 7:  A7                                         │
│  Posição 8:  A8                                         │
│  Posição 9:  A9                                         │
│  Posição 10: A10                                        │
│                                                          │
│  FORA DA TELA: A11, A12, A13, A14, A15                  │
└─────────────────────────────────────────────────────────┘

📊 RESULTADO: Em 15 minutos, TODOS os 15 anúncios foram
              o primeiro anúncio visível pelo menos 1 vez!
```

---

## 📈 GARANTIAS DO SISTEMA

```
✅ DISTRIBUIÇÃO EQUITATIVA
   → Cada anúncio aparece o mesmo número de vezes

✅ LIMITE DE 10 ANÚNCIOS
   → Nunca mostra mais de 10 por vez
   → Performance sempre boa

✅ ROTAÇÃO AUTOMÁTICA
   → Muda a cada 1 minuto
   → Não precisa de intervenção manual

✅ TODOS APARECEM
   → Se há 20 anúncios, em 20 minutos todos apareceram
   → Nenhum fica "esquecido"

✅ PERFORMANCE OTIMIZADA
   → Cálculo feito no servidor
   → Cliente apenas exibe
```

---

## 🐛 SE ALGO DER ERRADO

### **Erro: "function does not exist"**

**Causa:** Migration não foi aplicada

**Solução:**
```sql
-- Re-executar migration
\i supabase_migrations/062_featured_animals_rotation.sql
```

### **Erro: Ordem não muda**

**Causa 1:** Usando função lenta (30 min)

**Solução:** Trocar para `_rotated_fast`:
```typescript
.rpc('get_featured_animals_rotated_fast', ...)
```

**Causa 2:** Cache do navegador

**Solução:** Forçar reload (Ctrl+Shift+R)

### **Problema: Aparecendo mais de 10**

**Causa:** Limite não está sendo aplicado

**Solução:** Verificar parâmetro:
```typescript
animalService.getFeaturedAnimals(10) // ← Deve ter o 10
```

---

## 📞 SUPORTE

Consulte a documentação completa:
- **SISTEMA_ROTACAO_IMPULSIONADOS.md** → Documentação técnica detalhada
- **062_featured_animals_rotation.sql** → Código SQL da migration

---

## ✅ CHECKLIST FINAL

- [ ] Migration SQL executada com sucesso
- [ ] Função `get_featured_animals_rotated_fast` existe
- [ ] Teste manual retorna resultados
- [ ] Frontend atualizado (código já está pronto)
- [ ] Build/deploy realizado
- [ ] Homepage exibe no máximo 10 anúncios
- [ ] Ordem muda após 1-2 minutos
- [ ] Todos os anúncios aparecem ao longo do tempo

---

**Tempo total:** ⏱️ ~5 minutos  
**Dificuldade:** 🟢 Fácil  
**Status:** ✅ PRONTO PARA APLICAR

