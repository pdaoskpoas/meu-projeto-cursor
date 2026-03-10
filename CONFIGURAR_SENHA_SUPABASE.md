# 🔒 Configurar Políticas de Senha no Supabase

**Data:** 2 de outubro de 2025  
**Objetivo:** Fortalecer políticas de senha conforme auditoria de segurança

---

## ✅ O Que Foi Implementado (Client-Side)

### Validações Client-Side Aplicadas:
- ✅ **Mínimo 12 caracteres** (aumentado de 6)
- ✅ **Pelo menos 1 letra minúscula** (a-z)
- ✅ **Pelo menos 1 letra maiúscula** (A-Z)
- ✅ **Pelo menos 1 número** (0-9)
- ✅ **Pelo menos 1 caractere especial** (!@#$%^&*...)
- ✅ **Detecção de senhas comuns** (123456, password, etc.)
- ✅ **Indicador visual de força** em tempo real no cadastro

### Arquivos Modificados:
- `src/utils/passwordValidation.ts` - Validação robusta
- `src/components/auth/PasswordStrengthIndicator.tsx` - UI de força
- `src/components/auth/LoginForm.tsx` - Validação 12+ caracteres
- `src/components/auth/register/RegisterForm.tsx` - Validação completa

---

## ⚙️ Configuração Necessária no Supabase (Server-Side)

⚠️ **IMPORTANTE:** As validações client-side podem ser bypassadas. Configure também no servidor!

### Passo 1: Acessar Dashboard do Supabase

1. Acesse: https://supabase.com/dashboard
2. Faça login na sua conta
3. Selecione o projeto **Cavalaria Digital**

### Passo 2: Configurar Password Settings

1. No menu lateral, clique em **Authentication**
2. Clique em **Settings** (ou **Providers**)
3. Procure por **Email Provider** ou **Auth Providers**
4. Role até encontrar **Password Settings** ou **Password Policies**

### Passo 3: Aplicar Configurações Recomendadas

Configure exatamente assim:

```
✅ Password Requirements:
   - Minimum password length: 12
   - ☑️ Require lowercase letters (a-z)
   - ☑️ Require uppercase letters (A-Z)  
   - ☑️ Require numbers (0-9)
   - ☑️ Require special characters (!@#$%^&*...)

✅ Password Security:
   - ☑️ Check against HaveIBeenPwned database
   - ☑️ Prevent password reuse (últimas 5 senhas)

✅ Session & Timeout:
   - Session timeout: 1 hora (3600 segundos)
   - JWT expiry: 3600 (1 hora)
   - Refresh token rotation: ☑️ Enabled
```

### Passo 4: Salvar e Testar

1. Clique em **Save** ou **Update**
2. Teste criando um novo usuário com senha fraca - deve falhar
3. Teste criando usuário com senha forte - deve funcionar

---

## 🧪 Como Testar

### Teste 1: Senha Fraca (deve FALHAR)
```
Email: teste@example.com
Senha: 123456
Resultado esperado: ❌ Erro - senha muito fraca
```

### Teste 2: Senha Média (deve FALHAR)
```
Email: teste@example.com
Senha: abcdefgh
Resultado esperado: ❌ Erro - falta números, maiúsculas, símbolos
```

### Teste 3: Senha Forte (deve FUNCIONAR)
```
Email: teste@example.com
Senha: Senha@Forte123!
Resultado esperado: ✅ Cadastro com sucesso
```

---

## 📊 Benefícios de Segurança

Com essas configurações:
- 🛡️ **Protege contra força bruta** - senhas mais longas são exponencialmente mais difíceis de quebrar
- 🛡️ **Previne reutilização** - HaveIBeenPwned detecta senhas vazadas
- 🛡️ **Exige complexidade** - múltiplos tipos de caracteres aumentam entropia
- 🛡️ **Feedback visual** - usuários criam senhas mais fortes naturalmente

### Comparação de Força:

| Senha | Tempo para Quebrar* |
|-------|---------------------|
| `123456` (6 chars) | Instantâneo |
| `abcdef123` (9 chars) | ~1 hora |
| `Senha123!` (10 chars) | ~3 semanas |
| `Senha@Forte123!` (16 chars) | ~400 anos |

*Com hardware moderno e ataque offline

---

## 🔍 Verificação de Conformidade

Após configurar, verifique se:

- [ ] Não é possível criar conta com senha < 12 caracteres
- [ ] Não é possível criar conta com senha sem maiúsculas
- [ ] Não é possível criar conta com senha sem minúsculas
- [ ] Não é possível criar conta com senha sem números
- [ ] Não é possível criar conta com senha sem símbolos
- [ ] Senhas comuns como "password123" são rejeitadas
- [ ] Indicador de força aparece no formulário de cadastro

---

## 📝 Notas Adicionais

### Para Usuários Existentes:
- Usuários com senhas antigas (< 12 chars) podem continuar fazendo login
- **Recomendado:** Forçar reset de senha para usuários existentes
- Criar migração que exige troca de senha no próximo login

### Migração de Senhas Antigas (Opcional):
```sql
-- Marcar usuários com senhas antigas para reset
UPDATE auth.users
SET user_metadata = jsonb_set(
  COALESCE(user_metadata, '{}'::jsonb),
  '{force_password_reset}',
  'true'::jsonb
)
WHERE created_at < NOW(); -- Todos os usuários atuais
```

### Monitoramento:
- Monitorar tentativas de registro com senhas fracas
- Verificar logs de autenticação para padrões suspeitos

---

## 🆘 Suporte

Se encontrar problemas:
1. Verifique os logs do Supabase: Dashboard → Logs → Auth Logs
2. Teste com Incognito/Private Window (limpa cache)
3. Consulte: https://supabase.com/docs/guides/auth/passwords

---

**Configuração recomendada por:** Auditoria de Segurança - Outubro 2025  
**Referências:** OWASP, NIST SP 800-63B, CWE-521





