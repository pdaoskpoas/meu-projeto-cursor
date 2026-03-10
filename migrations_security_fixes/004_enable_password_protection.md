# 🔐 Habilitar Proteção de Senha Vazada

## ⏱️ Tempo Estimado: 2 minutos

## 📋 Instruções

### Passo 1: Acessar Configurações de Auth

1. Abra o Supabase Dashboard
2. Acesse seu projeto: https://supabase.com/dashboard/project/wyufgltprapazpxmtaff
3. No menu lateral, clique em **"Authentication"**

### Passo 2: Configurar Password Policy

1. Dentro de Authentication, clique em **"Policies"** (ou "Configurações")
2. Procure pela seção **"Password Policy"** ou **"Password Strength"**
3. Encontre a opção **"Check against HaveIBeenPwned database"**
4. **Habilite** esta opção (toggle para ON/ativo)

### Passo 3: Salvar Configurações

1. Clique em **"Save"** ou **"Update"**
2. Aguarde a confirmação

## ✅ Validação

Após habilitar, o sistema irá:

- ✅ Verificar novas senhas contra o banco HaveIBeenPwned
- ✅ Impedir o uso de senhas comprometidas
- ✅ Aumentar a segurança das contas

## 🔍 Como Testar

Tente criar um novo usuário com uma senha comum (ex: "password123"):

```javascript
// Deve retornar erro
const { error } = await supabase.auth.signUp({
  email: 'test@example.com',
  password: 'password123'
})

// Erro esperado: "Password has been compromised"
```

## 📚 Documentação

- [Supabase Password Security](https://supabase.com/docs/guides/auth/password-security)
- [HaveIBeenPwned](https://haveibeenpwned.com/)

## ✅ Resultado

✅ Proteção contra senhas vazadas habilitada  
✅ Segurança das contas aumentada  
✅ Conformidade com melhores práticas

