# 🚨 CORREÇÃO URGENTE: Chave Supabase Incorreta

## ⚠️ PROBLEMA IDENTIFICADO

O console do navegador mostra que você está usando a **SERVICE_ROLE_KEY** (chave secreta) no lugar da **ANON_KEY** (chave pública) no navegador.

**Erro no console:**
```
Forbidden use of secret API key in browser
sb_secret_*** (exemplo - nunca commite a chave real)
```

## 🔴 AÇÃO IMEDIATA NECESSÁRIA

### 1. Revogar a chave secreta exposta (CRÍTICO)

1. Acesse: https://app.supabase.com
2. Vá em: **Settings → API**
3. Encontre: **service_role key** (secret)
4. Clique em: **Revoke** ou **Rotate** (revogar/rotacionar)
5. **IMPORTANTE**: Gere uma nova SERVICE_ROLE_KEY e guarde em local seguro

⚠️ **NUNCA** use a SERVICE_ROLE_KEY no navegador! Ela deve ser usada APENAS em:
- Edge Functions (supabase/functions)
- Scripts server-side
- Backend seguro

---

## ✅ SOLUÇÃO: Configurar a ANON_KEY Correta

### Passo 1: Encontrar a ANON_KEY correta

1. Acesse: https://app.supabase.com
2. Vá em: **Settings → API**
3. Procure por: **anon public** key
4. Copie essa chave (ela começa com `eyJ...` e é bem longa)

### Passo 2: Criar arquivo `.env.local`

Crie um arquivo chamado `.env.local` na **raiz do projeto** com:

```env
# ✅ CORRETO: Use a ANON_KEY (chave pública)
VITE_SUPABASE_URL=https://wyufgltprapazpxmtaff.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...sua-anon-key-aqui
```

**Onde encontrar:**
- **VITE_SUPABASE_URL**: Dashboard → Settings → API → Project URL
- **VITE_SUPABASE_ANON_KEY**: Dashboard → Settings → API → anon public key

### Passo 3: Verificar a chave

A ANON_KEY correta:
- ✅ Começa com `eyJ...` (é um JWT)
- ✅ É muito longa (centenas de caracteres)
- ✅ Está marcada como "anon public" ou "public" no dashboard
- ✅ Pode ser usada no navegador (é segura para frontend)

A SERVICE_ROLE_KEY (ERRADA para navegador):
- ❌ Começa com `sb_secret_...` ou `eyJ...` mas está marcada como "secret"
- ❌ Está marcada como "service_role" no dashboard
- ❌ **NUNCA** deve ser usada no navegador

### Passo 4: Reiniciar o servidor

Após criar/editar o `.env.local`:

```bash
# Parar o servidor (Ctrl+C)
# Depois iniciar novamente
npm run dev
```

---

## 🔍 Como Verificar se Está Correto

1. Abra o console do navegador (F12)
2. Procure por:
   - ✅ `✅ Conexão Supabase verificada com sucesso`
   - ✅ `🔵 Supabase Config:` mostra URL e chave (parcialmente mascarada)
3. **NÃO** deve aparecer:
   - ❌ `Forbidden use of secret API key`
   - ❌ `401 (Unauthorized)`
   - ❌ `sb_secret_...` em nenhum lugar

---

## 📋 Checklist de Correção

- [ ] Revogar SERVICE_ROLE_KEY exposta no dashboard Supabase
- [ ] Gerar nova SERVICE_ROLE_KEY (guardar em local seguro)
- [ ] Criar arquivo `.env.local` na raiz do projeto
- [ ] Adicionar `VITE_SUPABASE_URL` (URL do projeto)
- [ ] Adicionar `VITE_SUPABASE_ANON_KEY` (anon public key)
- [ ] Verificar que a chave começa com `eyJ...` e é longa
- [ ] Reiniciar o servidor de desenvolvimento
- [ ] Verificar console do navegador (sem erros 401)
- [ ] Testar se os dados aparecem no site

---

## 🆘 Se Ainda Não Funcionar

1. **Limpar cache do navegador**: Ctrl+Shift+Delete
2. **Verificar se o arquivo está na raiz**: Deve estar em `cavalaria-digital-showcase-mainnn/.env.local`
3. **Verificar se as variáveis começam com VITE_**: O Vite só carrega variáveis que começam com `VITE_`
4. **Verificar se não há espaços**: `VITE_SUPABASE_ANON_KEY=chave` (sem espaços antes ou depois do `=`)
5. **Verificar se não há aspas**: Não use aspas na chave no arquivo .env

---

## 🔒 Segurança

**IMPORTANTE**: 
- A ANON_KEY pode ser exposta no navegador (é segura)
- A SERVICE_ROLE_KEY **NUNCA** deve ser exposta
- Se você já publicou o site com a SERVICE_ROLE_KEY, **revogue imediatamente** e gere uma nova
