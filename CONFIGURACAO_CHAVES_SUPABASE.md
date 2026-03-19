# 🔐 Configuração Completa das Chaves Supabase

## 📋 Visão Geral

Este projeto usa **duas chaves diferentes** do Supabase para diferentes propósitos:

1. **ANON_KEY** (chave pública) - Para o frontend/navegador
2. **SERVICE_ROLE_KEY** (chave secreta) - Para scripts e Edge Functions

---

## ✅ Configuração no `.env.local`

Crie um arquivo `.env.local` na **raiz do projeto** com:

```env
# ============================================
# CHAVES PÚBLICAS (Frontend)
# ============================================
# ✅ Podem ser usadas no navegador
# ✅ Têm prefixo VITE_ para serem carregadas pelo Vite

VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...sua-anon-key

# ============================================
# CHAVE SECRETA (Backend/Scripts)
# ============================================
# 🔒 NUNCA usar no navegador!
# ❌ NÃO use prefixo VITE_ aqui!
# ✅ Usada apenas em scripts Node.js e Edge Functions

SUPABASE_SERVICE_ROLE_KEY=sb_secret_...ou-eyJ...sua-service-role-key
```

---

## 🔍 Onde Encontrar as Chaves

### 1. Acesse o Dashboard Supabase
https://app.supabase.com → Seu Projeto → **Settings → API**

### 2. Copie as Chaves:

| Variável | Onde Encontrar | Como Identificar |
|----------|----------------|------------------|
| `VITE_SUPABASE_URL` | Project URL | URL completa do projeto |
| `VITE_SUPABASE_ANON_KEY` | **anon public** key | Começa com `eyJ...`, marcada como "public" |
| `SUPABASE_SERVICE_ROLE_KEY` | **service_role** key (secret) | Pode começar com `sb_secret_` ou `eyJ...`, marcada como "secret" |

---

## ⚠️ Regras Críticas de Segurança

### ✅ CORRETO:

```env
# Frontend - com prefixo VITE_
VITE_SUPABASE_ANON_KEY=eyJ...anon-key

# Backend - SEM prefixo VITE_
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...service-key
```

### ❌ ERRADO:

```env
# ❌ NUNCA faça isso!
VITE_SUPABASE_SERVICE_ROLE_KEY=sb_secret_...  # ERRADO! Seria exposta no navegador!
```

---

## 📁 Onde Cada Chave é Usada

### Frontend (React Components)
**Usa:** `VITE_SUPABASE_ANON_KEY`

```typescript
// src/lib/supabase.ts
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
```

### Scripts Node.js
**Usa:** `SUPABASE_SERVICE_ROLE_KEY` (sem prefixo VITE_)

```javascript
// scripts/*.mjs
const env = loadEnvLocal()
const serviceKey = env['SUPABASE_SERVICE_ROLE_KEY'] // ✅ Sem VITE_
```

### Edge Functions (Deno)
**Usa:** Variáveis configuradas no dashboard ou via CLI

```typescript
// supabase/functions/*/index.ts
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
```

**Para configurar no dashboard:**
1. Supabase Dashboard → Edge Functions → Secrets
2. Adicione: `SUPABASE_SERVICE_ROLE_KEY` = sua-chave

**Ou via CLI:**
```bash
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=sua-chave
```

---

## 🧪 Testar a Configuração

### Testar ANON_KEY (Frontend):
```bash
npm run dev
# Abra o console do navegador (F12)
# Deve aparecer: "✅ Conexão Supabase verificada com sucesso"
```

### Testar SERVICE_ROLE_KEY (Scripts):
```bash
node scripts/test-supabase.mjs
# Deve conectar e retornar dados
```

---

## 🚨 Problemas Comuns

### Erro: "Forbidden use of secret API key in browser"
**Causa:** Você está usando SERVICE_ROLE_KEY no lugar de ANON_KEY no frontend.

**Solução:**
1. Verifique se `VITE_SUPABASE_ANON_KEY` está usando a chave **anon public**
2. Verifique se não há `VITE_SUPABASE_SERVICE_ROLE_KEY` (deve ser `SUPABASE_SERVICE_ROLE_KEY` sem VITE_)

### Erro: "401 Unauthorized"
**Causa:** Chave incorreta ou expirada.

**Solução:**
1. Verifique se copiou a chave completa (são muito longas)
2. Verifique se não há espaços antes/depois do `=`
3. Verifique se não há aspas na chave

### Scripts não encontram SERVICE_ROLE_KEY
**Causa:** Variável não está no `.env.local` ou tem prefixo VITE_.

**Solução:**
1. Verifique se a variável se chama `SUPABASE_SERVICE_ROLE_KEY` (sem VITE_)
2. Verifique se está no arquivo `.env.local` na raiz
3. Reinicie o terminal após adicionar

---

## 📝 Checklist de Configuração

- [ ] Criar arquivo `.env.local` na raiz do projeto
- [ ] Adicionar `VITE_SUPABASE_URL` (URL do projeto)
- [ ] Adicionar `VITE_SUPABASE_ANON_KEY` (anon public key)
- [ ] Adicionar `SUPABASE_SERVICE_ROLE_KEY` (service_role key, SEM VITE_)
- [ ] Verificar que `.env.local` está no `.gitignore`
- [ ] Testar frontend (deve conectar sem erros 401)
- [ ] Testar scripts (devem funcionar com SERVICE_ROLE_KEY)
- [ ] Configurar Edge Functions (dashboard ou CLI)

---

## 🔒 Segurança Adicional

### Para Edge Functions em Produção:

As Edge Functions precisam das variáveis configuradas no dashboard Supabase:

1. **Via Dashboard:**
   - Settings → Edge Functions → Secrets
   - Adicione: `SUPABASE_SERVICE_ROLE_KEY`

2. **Via CLI:**
   ```bash
   supabase secrets set SUPABASE_SERVICE_ROLE_KEY=sua-chave
   ```

### Revogar Chaves Expostas:

Se você acidentalmente expôs uma chave:
1. Dashboard → Settings → API
2. Revogue a chave exposta
3. Gere uma nova chave
4. Atualize todos os lugares onde a chave é usada

---

## 📚 Referências

- [Documentação Supabase - API Keys](https://supabase.com/docs/guides/api/api-keys)
- [Documentação Supabase - Edge Functions](https://supabase.com/docs/guides/functions)
- Arquivo: `.env.local.example` (exemplo completo)
