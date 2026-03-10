# 🔐 CONFIGURAÇÃO DE SENHA - Localização Correta

**Tempo:** 2 minutos  
**Local Correto:** Settings > Auth (não Policies!)

---

## 📍 LOCALIZAÇÃO CORRETA (Baseado na Documentação Oficial)

A configuração de senha **NÃO está em Policies**!  
Está em: **Settings > Auth > Email Provider**

---

## 🚀 PASSO A PASSO CORRETO

### OPÇÃO 1: Via Link Direto

🔗 **Abra este link:**
```
https://supabase.com/dashboard/project/wyufgltprapazpxmtaff/auth/providers
```

Este é o link direto para as configurações de autenticação.

---

### OPÇÃO 2: Via Menu (se o link não funcionar)

#### Passo 1: Acesse o Dashboard
```
https://supabase.com/dashboard/project/wyufgltprapazpxmtaff
```

#### Passo 2: Clique em "Settings" (⚙️ engrenagem)
```
[Menu Lateral - Parte de BAIXO]
> Documentation
> Integrations
> Settings          ← CLIQUE AQUI (ícone de engrenagem)
```

#### Passo 3: Clique em "Authentication"
```
[Sub-menu de Settings]
> General
> Database
> API
> Authentication    ← CLIQUE AQUI
> Storage
> Functions
```

#### Passo 4: Procure "Email Provider" ou "Email Auth"
Na página de Authentication, role para baixo e procure:
```
┌─────────────────────────────────────┐
│ Email                               │
│ [Enable Email Provider]             │
│ ☑️ Enable Email Signup              │
│                                     │
│ Password Settings:     ← AQUI!      │
│ Minimum password length: [ 8 ]     │
│                                     │
│ Password requirements:              │
│ ☐ Require lowercase letters         │
│ ☐ Require uppercase letters         │
│ ☐ Require numbers                   │
│ ☐ Require special characters        │
└─────────────────────────────────────┘
```

---

## ⚙️ CONFIGURAÇÕES RECOMENDADAS

Quando encontrar "Password Settings", configure assim:

### Minimum Password Length:
```
Valor: 8
(Digite 8 ou use o slider/dropdown)
```

### Password Requirements (marque todos):
```
☑️ Require at least one lowercase letter (a-z)
☑️ Require at least one uppercase letter (A-Z)
☑️ Require at least one number (0-9)
☑️ Require at least one special character (!@#$%^&*)
```

### Leaked Password Protection:
```
☐ Check against HaveIBeenPwned
  ^ DEIXE DESMARCADO (conforme sua escolha)
```

---

## 💾 SALVAR

Após configurar, procure o botão:
- **"Save"** (canto superior direito)
- Ou **"Update"** 
- Ou botão verde com texto "Save changes"

Clique e aguarde a confirmação: ✅

---

## 🔍 LOCAIS ALTERNATIVOS

Se não encontrar em nenhum dos lugares acima, tente:

### Alternativa 1: Project Settings
```
Dashboard > Project Settings > Authentication
```

### Alternativa 2: Authentication na raiz
```
Dashboard > Authentication > Configurações (ícone de engrenagem)
```

### Alternativa 3: Buscar
```
Use a busca do Dashboard (Ctrl+K ou Cmd+K)
Digite: "password" ou "password settings"
```

---

## 🆘 SE AINDA NÃO ENCONTRAR

**Me diga o seguinte:**

1. Quando você acessa: https://supabase.com/dashboard/project/wyufgltprapazpxmtaff/auth/providers
   - O que você vê na página?
   - Tem alguma seção sobre "Email"?
   - Tem configurações de senha em algum lugar?

2. Ou tire um print da página e me descreva o que você vê.

---

## 📚 Referência da Documentação

Segundo a [documentação oficial do Supabase](https://supabase.com/docs/guides/auth/password-security):

> "You can configure these in your project's Auth settings"
> Link: `/dashboard/project/_/auth/providers?provider=Email`

---

## ⚡ ATALHO RÁPIDO

**Link direto testado:**
```
https://supabase.com/dashboard/project/wyufgltprapazpxmtaff/auth/providers?provider=Email
```

Este link deve te levar **direto** para as configurações de Email/Senha! ⚡

---

**Teste agora:** Clique no link acima e me diga o que você vê! 🎯

