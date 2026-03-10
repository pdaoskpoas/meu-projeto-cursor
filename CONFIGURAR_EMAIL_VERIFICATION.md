# 📧 Configurar Email Verification no Supabase

**Vulnerabilidade:** MÉDIA #18  
**Objetivo:** Garantir que emails sejam verificados antes de permitir acesso completo  
**Tempo:** 5 minutos

---

## ⚙️ Configuração no Supabase Dashboard

### Passo 1: Habilitar Email Confirmation

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em: **Authentication** > **Email Templates**
4. Encontre: **Confirm signup** (ou "Confirm your email")
5. ☑️ **Enable confirmation** ou **Require email confirmation**

### Passo 2: Customizar Template (Opcional)

```html
<h2>Confirme seu Email</h2>

<p>Obrigado por se cadastrar na Cavalaria Digital!</p>

<p>Clique no botão abaixo para confirmar seu email:</p>

<a href="{{ .ConfirmationURL }}">Confirmar Email</a>

<p>Este link expira em 24 horas.</p>

<p>Se você não se cadastrou, ignore este email.</p>
```

### Passo 3: Configurar Redirect URL

```
Redirect URL após confirmação:
https://seu-dominio.com/email-confirmed

Ou para desenvolvimento:
http://localhost:8080/email-confirmed
```

### Passo 4: Configurações Adicionais

```
Email Settings:
✅ Enable email confirmations
✅ Secure email change enabled
⏱️ Email confirmation expiry: 24 hours
```

---

## 🔒 Implementação Client-Side (Opcional)

### Bloquear funcionalidades sem email verificado:

```typescript
// src/hooks/useEmailVerification.ts
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

export const useEmailVerification = () => {
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    checkEmailVerification();
  }, []);

  const checkEmailVerification = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      setIsVerified(null);
      return;
    }

    // Verificar se email foi confirmado
    const verified = user.email_confirmed_at !== null;
    setIsVerified(verified);

    if (!verified) {
      toast({
        title: 'Email não verificado',
        description: 'Verifique seu email para continuar.',
        variant: 'destructive'
      });
    }
  };

  const resendVerificationEmail = async () => {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: user.email
    });

    if (!error) {
      toast({
        title: 'Email enviado',
        description: 'Verifique sua caixa de entrada.'
      });
    }
  };

  return { isVerified, resendVerificationEmail };
};
```

---

## 🧪 Como Testar

### Teste 1: Cadastro de Novo Usuário

1. Cadastre novo usuário
2. Verifique email
3. Clique no link de confirmação
4. Deve redirecionar e permitir login

### Teste 2: Login Sem Verificação

1. Cadastre usuário
2. **NÃO** clique no link
3. Tente fazer login
4. Resultado: Bloqueado ou aviso

---

## ⚠️ Impacto em Usuários Existentes

Usuários já cadastrados **não terão** email verificado.

**Opções:**

### Opção A: Forçar Verificação Retroativa
```sql
-- Marcar todos como não verificados
UPDATE auth.users
SET email_confirmed_at = NULL
WHERE email_confirmed_at IS NOT NULL;
```
⚠️ **Cuidado:** Bloqueia todos os usuários existentes

### Opção B: Apenas Novos Usuários (Recomendado)
- Não alterar usuários existentes
- Apenas novos devem verificar
- Gradualmente migrar

---

## 📝 Mensagens de Erro Recomendadas

### Email Não Verificado:
```
"⚠️ Email não verificado

Por favor, verifique seu email antes de continuar.
Não recebeu? Reenviar email de confirmação"
```

### Link Expirado:
```
"⏱️ Link de confirmação expirado

Solicite um novo link de confirmação."
```

---

## ✅ Checklist

- [ ] Email confirmation habilitado no Supabase
- [ ] Template customizado (opcional)
- [ ] Redirect URL configurada
- [ ] Testado com novo usuário
- [ ] Decidido política para usuários existentes

---

## 📚 Referências

- [Supabase Email Auth](https://supabase.com/docs/guides/auth/auth-email)
- [Email Templates](https://supabase.com/docs/guides/auth/auth-email-templates)

---

**Configuração:** OPCIONAL mas RECOMENDADA  
**Tempo estimado:** 5-10 minutos  
**Impacto:** Melhora segurança e qualidade da base de usuários




