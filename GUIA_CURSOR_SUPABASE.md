# 🤖 Guia para o Cursor: Entendendo o Projeto Supabase

Este documento ajuda o Cursor a entender a estrutura e configuração do Supabase neste projeto.

## 📁 Estrutura de Pastas

```
cavalaria-digital-showcase-mainnn/
├── supabase/                    # Configuração do Supabase
│   ├── config.toml             # Config local (NÃO commitar!)
│   ├── functions/              # Edge Functions (Deno)
│   │   ├── process-payment/
│   │   ├── process-boost-payment/
│   │   └── ...
│   └── migrations/            # Migrations (se houver)
├── supabase_migrations/        # Migrations SQL do banco
│   ├── 001_initial_schema.sql
│   ├── 009_create_rls_policies.sql
│   └── ...
├── scripts/                    # Scripts Node.js
│   ├── test-supabase.mjs      # Testa conexão
│   ├── seed-haras.mjs         # Seed de dados
│   └── ...
└── src/                        # Código React/TypeScript
    ├── lib/
    │   └── supabase.ts        # Cliente Supabase (frontend)
    └── ...
```

## 🔑 Variáveis de Ambiente

### Frontend (Navegador) - Prefixo `VITE_`

**Arquivo:** `.env.local` (na raiz)

```env
VITE_SUPABASE_URL=https://projeto.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...anon-key
```

**Uso:**
```typescript
// src/lib/supabase.ts
const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY
```

**Características:**
- ✅ Expostas no navegador (é seguro para ANON_KEY)
- ✅ Carregadas automaticamente pelo Vite
- ✅ Respeitam RLS (Row Level Security)

### Backend/Scripts - SEM prefixo `VITE_`

**Arquivo:** `.env.local` (na raiz)

```env
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...ou-eyJ...service-key
```

**Uso:**
```javascript
// scripts/*.mjs
const env = loadEnvLocal()
const serviceKey = env['SUPABASE_SERVICE_ROLE_KEY'] // Sem VITE_!
```

**Características:**
- ❌ NUNCA expostas no navegador
- ✅ Carregadas manualmente pelos scripts
- ⚠️ Ignoram RLS (acesso total ao banco)

### Edge Functions - Variáveis do Deno

**Configuração:** Dashboard Supabase ou CLI

```bash
# Via CLI
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=chave
```

**Uso:**
```typescript
// supabase/functions/*/index.ts
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
```

## 🚨 Regras Críticas

### ❌ NUNCA faça:

1. **Usar prefixo VITE_ com SERVICE_ROLE_KEY:**
   ```env
   # ❌ ERRADO - Seria exposta no navegador!
   VITE_SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
   ```

2. **Usar SERVICE_ROLE_KEY no frontend:**
   ```typescript
   // ❌ ERRADO - Nunca faça isso!
   const key = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY
   ```

3. **Comitar arquivos .env:**
   - `.env.local` está no `.gitignore`
   - Nunca commite chaves secretas

### ✅ SEMPRE faça:

1. **Usar ANON_KEY no frontend:**
   ```typescript
   // ✅ CORRETO
   const key = import.meta.env.VITE_SUPABASE_ANON_KEY
   ```

2. **Usar SERVICE_ROLE_KEY apenas em scripts:**
   ```javascript
   // ✅ CORRETO
   const serviceKey = env['SUPABASE_SERVICE_ROLE_KEY'] // Sem VITE_!
   ```

3. **Validar chaves antes de usar:**
   ```typescript
   if (!supabaseUrl || !supabaseAnonKey) {
     throw new Error('Variáveis não configuradas')
   }
   ```

## 🔍 Como o Cursor Deve Ajudar

### Ao Criar Componentes React:

```typescript
// ✅ Use import.meta.env.VITE_SUPABASE_ANON_KEY
import { supabase } from '@/lib/supabase'

// ✅ O cliente já está configurado em src/lib/supabase.ts
const { data } = await supabase.from('animals').select('*')
```

### Ao Criar Scripts Node.js:

```javascript
// ✅ Carregue .env.local manualmente
function loadEnvLocal() {
  const content = fs.readFileSync('.env.local', 'utf8')
  const env = {}
  for (const line of content.split(/\r?\n/)) {
    const m = line.match(/^([^=#]+)=(.*)$/)
    if (m) env[m[1].trim()] = m[2].trim()
  }
  return env
}

// ✅ Use SUPABASE_SERVICE_ROLE_KEY (sem VITE_)
const env = loadEnvLocal()
const serviceKey = env['SUPABASE_SERVICE_ROLE_KEY']
const supabase = createClient(url, serviceKey)
```

### Ao Criar Edge Functions:

```typescript
// ✅ Use Deno.env.get() (não import.meta.env)
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const supabase = createClient(url, serviceKey)
```

## 📊 Diferenças entre Chaves

| Característica | ANON_KEY | SERVICE_ROLE_KEY |
|----------------|----------|------------------|
| **Prefixo no .env** | `VITE_` | Sem prefixo |
| **Uso no navegador** | ✅ Sim | ❌ Nunca |
| **Uso em scripts** | ✅ Sim | ✅ Sim (preferível) |
| **Uso em Edge Functions** | ✅ Sim | ✅ Sim (preferível) |
| **Respeita RLS** | ✅ Sim | ❌ Não |
| **Formato** | `eyJ...` (JWT) | `sb_secret_...` ou `eyJ...` |
| **Segurança** | Segura para expor | NUNCA expor |

## 🛠️ Comandos Úteis

### Testar Conexão Frontend:
```bash
npm run dev
# Verificar console do navegador
```

### Testar Conexão Script:
```bash
node scripts/test-supabase.mjs
```

### Aplicar Migrations:
```bash
# Via SQL Editor no dashboard
# Ou via CLI:
supabase db push
```

### Configurar Secrets para Edge Functions:
```bash
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=sua-chave
```

## 📚 Arquivos de Referência

- `.env.local.example` - Exemplo de configuração
- `CONFIGURACAO_CHAVES_SUPABASE.md` - Guia completo
- `src/lib/supabase.ts` - Cliente Supabase (frontend)
- `scripts/test-supabase.mjs` - Exemplo de script
- `supabase/functions/process-payment/index.ts` - Exemplo de Edge Function

## ⚠️ Problemas Comuns

### Erro: "Forbidden use of secret API key in browser"
**Causa:** SERVICE_ROLE_KEY está sendo usada no frontend.

**Solução:** Verificar que `VITE_SUPABASE_ANON_KEY` usa a chave **anon public**, não a service_role.

### Script não encontra SERVICE_ROLE_KEY
**Causa:** Variável não tem o nome correto ou não está no `.env.local`.

**Solução:** Verificar que a variável se chama `SUPABASE_SERVICE_ROLE_KEY` (sem `VITE_`).

### Edge Function não encontra variável
**Causa:** Variável não foi configurada no dashboard ou via CLI.

**Solução:** Configurar via `supabase secrets set` ou dashboard.
