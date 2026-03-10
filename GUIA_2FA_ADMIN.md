# 🔐 GUIA DE IMPLEMENTAÇÃO - AUTENTICAÇÃO DE DOIS FATORES (2FA)

**Para:** Administrador do Sistema  
**Prioridade:** 🟡 **RECOMENDADO** (Alta Segurança)  
**Tempo:** 30-45 minutos

---

## 📋 O QUE É 2FA?

**Two-Factor Authentication (Autenticação de Dois Fatores)** adiciona uma camada extra de segurança ao login. Mesmo que alguém descubra sua senha, ainda precisará do segundo fator (código do celular) para acessar.

**Como funciona:**
1. Você faz login com email + senha (1º fator)
2. O sistema pede um código do seu celular (2º fator)
3. Você insere o código e tem acesso liberado

---

## ✅ BENEFÍCIOS

- 🛡️ **Proteção contra roubo de senha**
- 🛡️ **Proteção contra phishing**
- 🛡️ **Conformidade com boas práticas de segurança**
- 🛡️ **Auditoria: comprova identidade do administrador**

---

## 🚀 PASSOS PARA HABILITAR 2FA

### **PASSO 1: Habilitar 2FA no Supabase** (10 min)

#### 1.1 Verificar se o MFA está habilitado no projeto

```
1. Supabase Dashboard > Authentication > Providers
2. Procurar por "Multi-Factor Authentication (MFA)"
3. Verificar se está ENABLED
```

**Se não estiver habilitado:**
```
1. Clicar em "Enable MFA"
2. Salvar alterações
3. Aguardar deploy (1-2 minutos)
```

#### 1.2 Instalar um aplicativo autenticador

Escolha um dos aplicativos abaixo (recomendamos o **Google Authenticator** ou **Authy**):

- ✅ **Google Authenticator** (iOS/Android)
- ✅ **Microsoft Authenticator** (iOS/Android)
- ✅ **Authy** (iOS/Android/Desktop)
- ✅ **1Password** (se você já usa como gestor de senhas)

---

### **PASSO 2: Configurar 2FA no Frontend** (15 min)

O Supabase já oferece suporte nativo a MFA. Você precisa adicionar a interface no seu sistema.

#### 2.1 Instalar dependência (se necessário)

```bash
npm install @supabase/auth-ui-react
# ou
bun install @supabase/auth-ui-react
```

#### 2.2 Adicionar página de configuração de 2FA

Crie um componente para o administrador configurar o 2FA:

```typescript
// src/pages/dashboard/SecuritySettingsPage.tsx
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export const SecuritySettingsPage = () => {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [verifyCode, setVerifyCode] = useState('');
  const { toast } = useToast();

  const enableMFA = async () => {
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
      });

      if (error) throw error;

      // data contém o QR code e o secret
      setQrCode(data.totp.qr_code);
      
      toast({
        title: "QR Code gerado",
        description: "Escaneie o QR code com seu aplicativo autenticador.",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const verifyMFA = async () => {
    try {
      const { data, error } = await supabase.auth.mfa.challenge({
        factorId: 'ID_DO_FATOR', // Obtido do enroll
      });

      if (error) throw error;

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: 'ID_DO_FATOR',
        challengeId: data.id,
        code: verifyCode,
      });

      if (verifyError) throw verifyError;

      toast({
        title: "2FA habilitado!",
        description: "Autenticação de dois fatores configurada com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Segurança</h2>
      
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">
          Autenticação de Dois Fatores (2FA)
        </h3>
        
        {!qrCode ? (
          <Button onClick={enableMFA}>
            Habilitar 2FA
          </Button>
        ) : (
          <div className="space-y-4">
            <img src={qrCode} alt="QR Code" className="w-64 h-64" />
            <p className="text-sm text-muted-foreground">
              Escaneie este QR code com seu aplicativo autenticador
            </p>
            
            <div className="space-y-2">
              <input
                type="text"
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value)}
                placeholder="Digite o código de verificação"
                className="input"
              />
              <Button onClick={verifyMFA}>
                Verificar e Ativar
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
```

---

### **PASSO 3: Atualizar Fluxo de Login** (10 min)

Após habilitar o 2FA, o login precisará do segundo fator.

```typescript
// src/services/authService.ts - adicionar ao método login

// Após login com senha
const { data, error } = await supabase.auth.signInWithPassword({
  email, 
  password
});

// Verificar se precisa de MFA
if (data.user && !error) {
  const { data: factors } = await supabase.auth.mfa.listFactors();
  
  if (factors && factors.totps.length > 0) {
    // Usuário tem MFA habilitado
    // Redirecionar para página de verificação de código
    return { needsMFA: true, user: data.user };
  }
}
```

---

### **PASSO 4: Criar Códigos de Recuperação** (5 min)

**IMPORTANTE:** Gere códigos de recuperação em caso de perda do dispositivo.

```typescript
const generateRecoveryCodes = async () => {
  const { data, error } = await supabase.auth.mfa.generateRecoveryCodes();
  
  if (data) {
    // Salvar estes códigos em local seguro!
    console.log('Códigos de recuperação:', data);
  }
};
```

**Códigos de recuperação devem ser:**
- ✅ Salvos em local seguro (gestor de senhas)
- ✅ Impressos e guardados fisicamente
- ❌ NUNCA compartilhados
- ❌ NUNCA deixados em arquivo de texto desprotegido

---

## 📱 CONFIGURAÇÃO NO APLICATIVO AUTENTICADOR

### **Google Authenticator**

1. Abrir app Google Authenticator
2. Tocar em "+" ou "Scan QR code"
3. Escanear o QR code exibido no sistema
4. O app vai gerar códigos de 6 dígitos a cada 30 segundos
5. Inserir o código no sistema para verificar

### **Authy**

1. Abrir app Authy
2. Tocar em "Add Account"
3. Escanear o QR code
4. Dar um nome: "Cavalaria Digital - Admin"
5. Códigos aparecerão na lista

---

## 🧪 TESTAR 2FA

### Teste 1: Login Normal
```
1. Fazer logout
2. Fazer login com email + senha
3. Sistema deve pedir código de 6 dígitos
4. Abrir aplicativo autenticador
5. Inserir código exibido
6. Login deve ser completado
```

### Teste 2: Código Inválido
```
1. Tentar inserir código errado
2. Sistema deve rejeitar
3. Tentar novamente com código correto
4. Deve funcionar
```

### Teste 3: Código de Recuperação
```
1. Usar um dos códigos de recuperação ao invés do app
2. Deve funcionar (código é usado apenas 1 vez)
3. Gerar novos códigos de recuperação
```

---

## 🚨 TROUBLESHOOTING

### **Problema: QR Code não aparece**

**Solução:**
```sql
-- Verificar se MFA está habilitado no projeto
-- Supabase Dashboard > Authentication > Providers > MFA
```

### **Problema: Códigos do app não funcionam**

**Possíveis causas:**
1. Relógio do celular desincronizado
   - **Solução:** Ativar sincronização automática de hora
2. Código expirado (mais de 30 segundos)
   - **Solução:** Usar código mais recente
3. Digitou errado
   - **Solução:** Revisar os 6 dígitos

### **Problema: Perdi o celular**

**Solução:**
1. Usar código de recuperação
2. Fazer login
3. Desabilitar 2FA antigo
4. Configurar novo 2FA no novo dispositivo

---

## 📋 CHECKLIST FINAL

- [ ] MFA habilitado no Supabase
- [ ] Aplicativo autenticador instalado
- [ ] QR Code escaneado
- [ ] Primeiro código verificado com sucesso
- [ ] Códigos de recuperação gerados
- [ ] Códigos de recuperação salvos em local seguro
- [ ] Teste de login realizado
- [ ] 2FA funcionando corretamente

---

## 📚 DOCUMENTAÇÃO ADICIONAL

**Supabase MFA:**
- Docs: https://supabase.com/docs/guides/auth/auth-mfa
- Exemplo: https://github.com/supabase/examples/tree/main/mfa

**Segurança:**
- NIST Guidelines: https://pages.nist.gov/800-63-3/
- OWASP Authentication: https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html

---

## ⚠️ IMPORTANTE

**Após habilitar 2FA:**
- ✅ Sempre tenha acesso ao seu celular para fazer login
- ✅ Guarde os códigos de recuperação em local seguro
- ✅ Se trocar de celular, transfira o autenticador ANTES de resetar o antigo
- ✅ Considere ter um segundo dispositivo configurado (backup)

**NUNCA:**
- ❌ Compartilhe códigos com ninguém
- ❌ Tire screenshot dos códigos e deixe na nuvem
- ❌ Envie códigos por email/chat

---

**Criado em:** 08 de Novembro de 2025  
**Status:** 📖 Guia Completo para Implementação de 2FA  
**Próximo passo:** Implementar componentes no frontend


