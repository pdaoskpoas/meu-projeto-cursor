# 🔒 Configurar Políticas de Senha no Supabase (SIMPLIFICADO)

**Requisito:** Apenas **mínimo 8 caracteres**

---

## ⚙️ Configuração no Supabase Dashboard

### Passo 1: Acessar Dashboard

1. Acesse: https://supabase.com/dashboard
2. Faça login na sua conta
3. Selecione o projeto **Cavalaria Digital**

### Passo 2: Ir para Password Settings

1. No menu lateral, clique em **Authentication**
2. Clique em **Settings** (ou **Providers**)
3. Procure por **Email Provider** ou **Auth Providers**
4. Role até **Password Settings** ou **Password Policies**

### Passo 3: Configurar

**Configure apenas isto:**

```
✅ Minimum password length: 8

☐ Require lowercase letters (a-z)        ← DESMARQUE
☐ Require uppercase letters (A-Z)        ← DESMARQUE
☐ Require numbers (0-9)                  ← DESMARQUE
☐ Require special characters (!@#$...)   ← DESMARQUE

OPCIONAL (recomendado):
☑️ Check against HaveIBeenPwned database
```

### Passo 4: Salvar

Clique em **Save** ou **Update**

---

## 🧪 Como Testar

### Teste 1: Senha Muito Curta (deve FALHAR)
```
Senha: 1234567 (7 caracteres)
Resultado: ❌ Erro - mínimo 8 caracteres
```

### Teste 2: Senha de 8 Caracteres (deve FUNCIONAR)
```
Senha: 12345678 (8 caracteres)
Resultado: ✅ Aceita
```

### Teste 3: Qualquer Senha ≥ 8 Caracteres
```
Senha: abcdefgh
Senha: password
Senha: minhsenha
Resultado: ✅ Todas aceitas (≥ 8 caracteres)
```

---

## ✅ Pronto!

Configuração simples aplicada:
- Mínimo: 8 caracteres
- Sem requisitos de complexidade
- Usuários podem escolher senhas simples

---

**Nota de Segurança:**

Senhas simples são mais fáceis de quebrar. Se no futuro quiser aumentar a segurança, você pode:
1. Aumentar para 12+ caracteres
2. Adicionar requisitos de complexidade
3. Ver `CONFIGURAR_SENHA_SUPABASE.md` para configuração robusta





