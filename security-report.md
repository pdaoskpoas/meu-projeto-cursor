# 🔒 Relatório de Auditoria de Segurança - Cavalaria Digital

**Data:** 2 de outubro de 2025  
**Versão:** 1.0  
**Auditor:** Engenheiro de Segurança Sênior  
**Escopo:** Análise completa de segurança da aplicação web  
**Metodologia:** Análise estática de código, revisão de configurações, verificação de dependências, análise de banco de dados

---

## 📊 Resumo Executivo

A aplicação **Cavalaria Digital** é uma plataforma web desenvolvida em React/TypeScript com backend Supabase (PostgreSQL + Auth + Storage). A auditoria identificou **27 vulnerabilidades** distribuídas em diferentes níveis de severidade.

### Scorecard de Segurança

| Categoria | Vulnerabilidades | Status |
|-----------|------------------|--------|
| **Críticas** | 6 | 🔴 Ação Imediata |
| **Altas** | 8 | 🟠 Urgente |
| **Médias** | 9 | 🟡 Importante |
| **Baixas** | 4 | 🟢 Recomendado |
| **Total** | **27** | ⚠️ Requer Ação |

### Visão Geral dos Riscos

- 🔴 **6 Vulnerabilidades Críticas** podem levar a comprometimento total do sistema
- 🟠 **8 Vulnerabilidades Altas** expõem dados sensíveis ou permitem ataques
- 🟡 **9 Vulnerabilidades Médias** reduzem a postura de segurança geral
- 🟢 **4 Vulnerabilidades Baixas** representam boas práticas não implementadas

**Avaliação Geral:** 🔴 **ALTO RISCO** - Requer correções críticas antes de produção

---

## 🔴 Vulnerabilidades Críticas

### 1. Falta de Headers de Segurança HTTP

**Local:** `vite.config.ts`, configuração do servidor  
**CWE:** CWE-1021 (Improper Restriction of Rendered UI Layers)  
**CVSS Score:** 7.5 (High)

#### Descrição
A aplicação não implementa headers de segurança essenciais, deixando-a vulnerável a ataques de clickjacking, XSS, MIME sniffing e outros vetores.

#### Impacto
- ❌ Clickjacking: site pode ser incorporado em iframe malicioso
- ❌ MIME Sniffing: navegador pode interpretar arquivos incorretamente
- ❌ XSS: falta de Content Security Policy aumenta superfície de ataque
- ❌ Informações sensíveis podem vazar via Referer header

#### Trechos de Código
```typescript
// vite.config.ts (linhas 7-11) - SEM headers de segurança
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  // ❌ Faltam headers de segurança!
```

#### Checklist de Correção
- [ ] Adicionar `Content-Security-Policy` para prevenir XSS
- [ ] Implementar `X-Frame-Options: DENY` para prevenir clickjacking
- [ ] Adicionar `X-Content-Type-Options: nosniff` para prevenir MIME sniffing
- [ ] Configurar `Referrer-Policy: strict-origin-when-cross-origin`
- [ ] Adicionar `Strict-Transport-Security` (HSTS) para forçar HTTPS
- [ ] Implementar `Permissions-Policy` para controlar features do navegador

```typescript
// vite.config.ts - CORREÇÃO RECOMENDADA
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    headers: {
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' https://fonts.googleapis.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://*.supabase.co",
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
    }
  },
  // ... resto da config
}));
```

#### Referências
- [OWASP Secure Headers Project](https://owasp.org/www-project-secure-headers/)
- [MDN Web Security Headers](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers#security)
- [CWE-1021](https://cwe.mitre.org/data/definitions/1021.html)

---

### 2. Exposição de Informações Sensíveis em Logs

**Local:** `src/lib/supabase.ts` (linhas 40-47), `src/services/authService.ts`  
**CWE:** CWE-532 (Insertion of Sensitive Information into Log File)  
**CVSS Score:** 7.2 (High)

#### Descrição
O sistema registra informações sensíveis nos logs de desenvolvimento, incluindo emails de usuários e detalhes de operações de autenticação.

#### Impacto
- 🔴 Exposição de emails de usuários em logs do console
- 🔴 Detalhes de erros podem revelar estrutura do banco de dados
- 🔴 Informações sobre tentativas de login expostas
- 🔴 Logs podem ser capturados por ferramentas de debugging

#### Trechos de Código
```typescript
// src/lib/supabase.ts (linhas 40-47)
export const logSupabaseOperation = (operation: string, data?: any, error?: any) => {
  if (process.env.NODE_ENV === 'development') {
    console.group(`🔵 Supabase: ${operation}`)
    if (data) console.log('Data:', data) // ❌ Pode conter emails, IDs
    if (error) console.error('Error:', error) // ❌ Expõe detalhes do sistema
    console.groupEnd()
  }
}

// src/services/authService.ts (linha 30)
logSupabaseOperation('Login attempt', { email: credentials.email }) // ❌ Email exposto
```

#### Checklist de Correção
- [ ] Remover logging de dados sensíveis (emails, IDs, tokens)
- [ ] Implementar sistema de logging estruturado com níveis (info, warn, error)
- [ ] Usar mascaramento para dados sensíveis em logs
- [ ] Garantir que logs de produção não contenham PII
- [ ] Implementar log rotation e armazenamento seguro
- [ ] Adicionar sanitização de erros antes de logging

```typescript
// CORREÇÃO RECOMENDADA
const sanitizeLogData = (data: any): any => {
  if (!data) return data;
  const sensitive = ['email', 'password', 'token', 'cpf', 'phone'];
  const sanitized = { ...data };
  
  sensitive.forEach(key => {
    if (sanitized[key]) {
      sanitized[key] = '***REDACTED***';
    }
  });
  
  return sanitized;
};

export const logSupabaseOperation = (operation: string, data?: any, error?: any) => {
  if (process.env.NODE_ENV === 'development') {
    console.group(`🔵 Supabase: ${operation}`)
    if (data) console.log('Data:', sanitizeLogData(data))
    if (error) console.error('Error:', { message: error.message, code: error.code })
    console.groupEnd()
  }
}
```

#### Referências
- [OWASP Logging Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html)
- [CWE-532](https://cwe.mitre.org/data/definitions/532.html)

---

### 3. Armazenamento Inseguro de Dados Sensíveis no Cliente

**Local:** `src/hooks/useAnimalViews.ts`, `src/hooks/useMonthlyStats.ts`, `src/services/analyticsService.ts`  
**CWE:** CWE-922 (Insecure Storage of Sensitive Information)  
**CVSS Score:** 7.5 (High)

#### Descrição
Dados sensíveis de analytics, sessões e estatísticas são armazenados em `localStorage` e `sessionStorage` sem criptografia, acessíveis via JavaScript e vulneráveis a XSS.

#### Impacto
- 🔴 Dados de analytics podem ser manipulados por atacantes
- 🔴 Session IDs armazenados em plain text
- 🔴 Dados de usuário expostos a scripts maliciosos (XSS)
- 🔴 Informações podem persistir após logout

#### Trechos de Código
```typescript
// src/services/analyticsService.ts (linhas 28-31)
let sessionId = sessionStorage.getItem('analytics_session_id')
if (!sessionId) {
  sessionId = crypto.randomUUID()
  sessionStorage.setItem('analytics_session_id', sessionId) // ❌ Session ID em plain text
}

// src/hooks/useMonthlyStats.ts (linhas 28-29)
const stored = localStorage.getItem('monthly_stats'); // ❌ Dados de stats sem proteção

// src/hooks/useAnimalViews.ts (linha 156)
let sessionId = sessionStorage.getItem('session_id'); // ❌ Outro session ID desprotegido
```

#### Checklist de Correção
- [ ] Migrar dados críticos para backend (server-side sessions)
- [ ] Usar httpOnly cookies para session management
- [ ] Implementar criptografia para dados que precisam ficar no cliente
- [ ] Limpar todos os dados do localStorage/sessionStorage no logout
- [ ] Implementar timeout automático de sessão
- [ ] Validar dados do localStorage antes de usar (podem ser manipulados)

```typescript
// CORREÇÃO RECOMENDADA - Mover para backend
// Backend: criar endpoint para tracking
async trackImpression(contentId: string, contentType: string) {
  const { error } = await supabase
    .from('impressions')
    .insert({
      content_id: contentId,
      content_type: contentType,
      // Session gerenciada pelo Supabase Auth (server-side)
    });
}

// Se realmente necessário armazenar no cliente, usar IndexedDB com Web Crypto API
async function encryptAndStore(key: string, data: any) {
  const encrypted = await crypto.subtle.encrypt(/* ... */);
  // Armazenar encrypted data
}
```

#### Referências
- [OWASP HTML5 Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html)
- [CWE-922](https://cwe.mitre.org/data/definitions/922.html)

---

### 4. Dependências com Vulnerabilidades Conhecidas

**Local:** `package.json`, `node_modules/`  
**CWE:** CWE-1104 (Use of Unmaintained Third Party Components)  
**CVSS Score:** 5.3 (Moderate)

#### Descrição
Vulnerabilidades moderadas identificadas em dependências do projeto via `npm audit`.

#### Impacto
- 🟠 **esbuild <=0.24.2**: Permite qualquer site enviar requests ao dev server e ler respostas (CWE-346)
- 🟠 **vite <=6.1.6**: Dois problemas de path traversal e exposição de arquivos

#### Vulnerabilidades Detectadas
```json
{
  "esbuild": {
    "severity": "moderate",
    "cvss": 5.3,
    "advisory": "GHSA-67mh-4wv8-2f99",
    "range": "<=0.24.2"
  },
  "vite": {
    "severity": "moderate",
    "advisories": ["GHSA-g4jq-h2w9-997c", "GHSA-jqfw-vq24-v9c3"],
    "range": "<=6.1.6"
  }
}
```

#### Checklist de Correção
- [ ] Atualizar esbuild para versão >= 0.24.3
- [ ] Atualizar vite para versão >= 6.2.0
- [ ] Executar `npm audit fix` para correções automáticas
- [ ] Implementar verificação automática de vulnerabilidades no CI/CD
- [ ] Revisar e atualizar todas as dependências desatualizadas
- [ ] Configurar Dependabot ou Renovate Bot para atualizações automáticas

```bash
# CORREÇÃO IMEDIATA
npm audit fix

# Verificar se tudo está atualizado
npm outdated

# Atualizar manualmente se necessário
npm update esbuild vite
```

#### Referências
- [npm audit documentation](https://docs.npmjs.com/cli/v8/commands/npm-audit)
- [GHSA-67mh-4wv8-2f99](https://github.com/advisories/GHSA-67mh-4wv8-2f99)
- [GHSA-g4jq-h2w9-997c](https://github.com/advisories/GHSA-g4jq-h2w9-997c)

---

### 5. Políticas de Senha Fracas

**Local:** Configuração do Supabase Auth  
**CWE:** CWE-521 (Weak Password Requirements)  
**CVSS Score:** 7.3 (High)

#### Descrição
O sistema permite senhas fracas sem requisitos mínimos de complexidade, facilitando ataques de força bruta e credential stuffing.

#### Impacto
- 🔴 Usuários podem criar senhas como "123456"
- 🔴 Vulnerável a ataques de força bruta
- 🔴 Senhas comprometidas em vazamentos podem ser reutilizadas
- 🔴 Falta de verificação contra banco HaveIBeenPwned

#### Validação Atual
```typescript
// src/components/auth/LoginForm.tsx (linhas 31-40)
password: {
  required: true,
  minLength: 6,  // ❌ Muito fraco! Apenas 6 caracteres
  custom: (value: string) => {
    if (value && value.length < 6) {
      return 'A senha deve ter pelo menos 6 caracteres';
    }
    return null;
  }
}
```

#### Checklist de Correção
- [ ] Aumentar requisito mínimo para 8+ caracteres
- [ ] Exigir pelo menos: 1 maiúscula, 1 minúscula, 1 número, 1 caractere especial
- [ ] Habilitar verificação HaveIBeenPwned no Supabase
- [ ] Implementar força de senha em tempo real (visual feedback)
- [ ] Adicionar rate limiting em tentativas de login
- [ ] Considerar implementar 2FA/MFA
- [ ] Forçar reset de senhas fracas existentes

**Configuração Supabase (via Dashboard):**
```
1. Acesse: https://supabase.com/dashboard/project/[PROJECT_ID]/auth/providers
2. Procure "Email Provider" → "Password Settings"
3. Configure:
   - Minimum password length: 12
   - ☑️ Require lowercase letters (a-z)
   - ☑️ Require uppercase letters (A-Z)
   - ☑️ Require numbers (0-9)
   - ☑️ Require special characters (!@#$%^&*)
   - ☑️ Check against HaveIBeenPwned database
```

**Validação Client-Side:**
```typescript
// CORREÇÃO RECOMENDADA
const passwordValidation = {
  minLength: 12,
  custom: (value: string) => {
    const requirements = [
      { test: /.{12,}/, message: 'Mínimo 12 caracteres' },
      { test: /[a-z]/, message: 'Pelo menos uma letra minúscula' },
      { test: /[A-Z]/, message: 'Pelo menos uma letra maiúscula' },
      { test: /[0-9]/, message: 'Pelo menos um número' },
      { test: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, message: 'Pelo menos um caractere especial' }
    ];
    
    for (const req of requirements) {
      if (!req.test.test(value)) {
        return req.message;
      }
    }
    return null;
  }
};
```

#### Referências
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [NIST Password Guidelines](https://pages.nist.gov/800-63-3/sp800-63b.html)
- [CWE-521](https://cwe.mitre.org/data/definitions/521.html)

---

### 6. Falta de Rate Limiting e Proteção DDoS

**Local:** Toda a aplicação, endpoints Supabase  
**CWE:** CWE-770 (Allocation of Resources Without Limits)  
**CVSS Score:** 7.5 (High)

#### Descrição
Não há implementação de rate limiting em operações críticas, permitindo abuso de recursos e ataques de força bruta.

#### Impacto
- 🔴 Ataques de força bruta em login sem limite
- 🔴 Spam de registros de usuários
- 🔴 Abuse de uploads de imagens
- 🔴 Esgotamento de recursos do Supabase
- 🔴 Custos elevados por uso excessivo

#### Operações sem Rate Limiting
```typescript
// src/services/authService.ts - Login sem rate limit
async login(credentials: LoginCredentials): Promise<AuthUser | null> {
  // ❌ Nenhuma verificação de tentativas anteriores
  const { data, error } = await supabase.auth.signInWithPassword({
    email: credentials.email,
    password: credentials.password
  })
}

// src/services/storageService.ts - Upload sem rate limit
async uploadAnimalImages(userId: string, animalOrDraftId: string, files: File[]): Promise<string[]> {
  // ❌ Sem limite de uploads por período
  // ❌ Sem validação de tamanho total
}
```

#### Checklist de Correção
- [ ] Implementar rate limiting no Supabase (Edge Functions ou RLS policies)
- [ ] Adicionar throttling no client-side para operações frequentes
- [ ] Limitar tentativas de login (3-5 por 15 minutos)
- [ ] Implementar CAPTCHA após N tentativas falhadas
- [ ] Configurar rate limiting no nível de API do Supabase
- [ ] Adicionar monitoramento de uso abusivo
- [ ] Implementar IP blocking temporário para ataques detectados

**Exemplo de Implementação:**
```typescript
// Criar tabela para tracking de rate limiting
CREATE TABLE rate_limit_tracker (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_identifier text NOT NULL, -- IP ou user_id
  operation_type text NOT NULL,
  attempt_count integer DEFAULT 1,
  window_start timestamptz DEFAULT now(),
  blocked_until timestamptz
);

// RLS Policy para rate limiting em login
CREATE OR REPLACE FUNCTION check_rate_limit(
  identifier text,
  operation text,
  max_attempts integer,
  window_minutes integer
) RETURNS boolean AS $$
DECLARE
  recent_attempts integer;
BEGIN
  SELECT COUNT(*) INTO recent_attempts
  FROM rate_limit_tracker
  WHERE user_identifier = identifier
    AND operation_type = operation
    AND window_start > now() - (window_minutes || ' minutes')::interval;
  
  RETURN recent_attempts < max_attempts;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Client-side throttling:**
```typescript
import { debounce } from 'lodash';

// Rate limit uploads
const throttledUpload = debounce(
  async (files: File[]) => {
    await storageService.uploadAnimalImages(userId, animalId, files);
  },
  2000, // 2 segundos entre uploads
  { leading: true, trailing: false }
);
```

#### Referências
- [OWASP Rate Limiting Guidelines](https://owasp.org/www-community/controls/Blocking_Brute_Force_Attacks)
- [Supabase Rate Limiting](https://supabase.com/docs/guides/platform/going-into-prod#api-rate-limits)
- [CWE-770](https://cwe.mitre.org/data/definitions/770.html)

---

## 🟠 Vulnerabilidades Altas

### 7. Falta de Sanitização HTML (XSS)

**Local:** Componentes que renderizam conteúdo user-generated  
**CWE:** CWE-79 (Cross-site Scripting)  
**CVSS Score:** 6.1 (Medium)

#### Descrição
A aplicação não possui biblioteca de sanitização HTML instalada (DOMPurify), permitindo potencial XSS em campos de texto livre.

#### Impacto
- 🟠 Potencial XSS em descrições de animais
- 🟠 XSS em mensagens entre usuários
- 🟠 Scripts maliciosos em nomes de propriedades
- 🟠 Roubo de sessões via XSS

#### Checklist de Correção
- [ ] Instalar DOMPurify: `npm install dompurify @types/dompurify`
- [ ] Criar função sanitize() para todo conteúdo user-generated
- [ ] Sanitizar dados antes de renderizar HTML
- [ ] Usar `dangerouslySetInnerHTML` apenas com dados sanitizados
- [ ] Implementar validação estrita em campos de texto
- [ ] Adicionar CSP para mitigar XSS

```typescript
// IMPLEMENTAÇÃO RECOMENDADA
import DOMPurify from 'dompurify';

export const sanitizeHTML = (dirty: string): string => {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
    ALLOWED_ATTR: []
  });
};

// Uso em componentes
<div dangerouslySetInnerHTML={{ __html: sanitizeHTML(animal.description) }} />
```

#### Referências
- [OWASP XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [DOMPurify](https://github.com/cure53/DOMPurify)

---

### 8. Validação de Upload de Imagens Insuficiente

**Local:** `src/services/storageService.ts`, `src/components/forms/ImageUploadWithPreview.tsx`  
**CWE:** CWE-434 (Unrestricted Upload of File with Dangerous Type)  
**CVSS Score:** 6.8 (Medium)

#### Descrição
Upload de imagens não possui validação robusta de tamanho, tipo MIME real e dimensões.

#### Impacto
- 🟠 Upload de arquivos não-imagem (bypass de extensão)
- 🟠 Upload de imagens gigantes (DoS)
- 🟠 Potencial execução de código via polyglot files
- 🟠 Esgotamento de storage

#### Validação Atual
```typescript
// src/components/forms/ImageUploadWithPreview.tsx (linhas 26-30)
const { getRootProps, getInputProps, isDragActive } = useDropzone({
  onDrop,
  accept: {
    'image/*': ['.jpeg', '.jpg', '.png', '.webp'] // ❌ Apenas client-side
  },
  maxFiles: maxImages - images.length,
  // ❌ SEM validação de tamanho!
});
```

#### Checklist de Correção
- [ ] Adicionar validação de tamanho máximo (ex: 5MB por imagem)
- [ ] Validar MIME type real (magic bytes) no backend
- [ ] Validar dimensões máximas (ex: 4000x4000px)
- [ ] Reprocessar/redimensionar imagens no backend
- [ ] Adicionar scan de malware em uploads
- [ ] Implementar quota de storage por usuário
- [ ] Gerar nomes de arquivo aleatórios (evitar path traversal)

```typescript
// CORREÇÃO RECOMENDADA
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const validateImage = async (file: File): Promise<boolean> => {
  // Validar tamanho
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('Imagem muito grande. Máximo: 5MB');
  }
  
  // Validar tipo
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Tipo de arquivo não permitido');
  }
  
  // Validar dimensões
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      if (img.width > 4000 || img.height > 4000) {
        reject(new Error('Dimensões muito grandes. Máximo: 4000x4000px'));
      }
      resolve(true);
    };
    img.src = URL.createObjectURL(file);
  });
};

// Usar no dropzone
const { getRootProps, getInputProps } = useDropzone({
  onDrop: async (acceptedFiles) => {
    for (const file of acceptedFiles) {
      await validateImage(file);
    }
    onDrop(acceptedFiles);
  },
  accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
  maxFiles: maxImages - images.length,
  maxSize: MAX_FILE_SIZE
});
```

#### Referências
- [OWASP File Upload Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html)
- [CWE-434](https://cwe.mitre.org/data/definitions/434.html)

---

### 9. Session Management Inseguro

**Local:** `src/contexts/AuthContext.tsx`, `src/lib/supabase.ts`  
**CWE:** CWE-613 (Insufficient Session Expiration)  
**CVSS Score:** 6.5 (Medium)

#### Descrição
Sessões persistem indefinidamente sem timeout automático. localStorage usado para armazenar `currentUser`.

#### Impacto
- 🟠 Sessões ativas em computadores compartilhados
- 🟠 Tokens não expiram adequadamente
- 🟠 Dados de usuário em localStorage vulneráveis a XSS

#### Implementação Atual
```typescript
// src/lib/supabase.ts (linhas 9-12)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true, // ❌ Persiste indefinidamente
    detectSessionInUrl: true
  }
});

// src/contexts/AuthContext.tsx (linha 118)
localStorage.removeItem('currentUser'); // ❌ Usa localStorage para user data
```

#### Checklist de Correção
- [ ] Implementar timeout de sessão (15-30 minutos de inatividade)
- [ ] Usar httpOnly cookies para tokens (configurar Supabase)
- [ ] Remover armazenamento de dados sensíveis em localStorage
- [ ] Implementar "Remember Me" opcional (com aviso de segurança)
- [ ] Forçar reautenticação para ações sensíveis
- [ ] Implementar logout automático em múltiplas abas
- [ ] Adicionar detecção de sessão suspeita (geolocation, user-agent)

```typescript
// IMPLEMENTAÇÃO DE SESSION TIMEOUT
let sessionTimeout: NodeJS.Timeout;

const resetSessionTimeout = () => {
  if (sessionTimeout) clearTimeout(sessionTimeout);
  
  sessionTimeout = setTimeout(() => {
    authService.logout();
    toast({
      title: 'Sessão expirada',
      description: 'Por segurança, você foi desconectado após inatividade.'
    });
  }, 30 * 60 * 1000); // 30 minutos
};

// Resetar timeout em atividade do usuário
useEffect(() => {
  const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
  
  events.forEach(event => {
    window.addEventListener(event, resetSessionTimeout);
  });
  
  return () => {
    events.forEach(event => {
      window.removeEventListener(event, resetSessionTimeout);
    });
  };
}, []);
```

#### Referências
- [OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- [CWE-613](https://cwe.mitre.org/data/definitions/613.html)

---

### 10. Falta de CSRF Protection

**Local:** Formulários da aplicação  
**CWE:** CWE-352 (Cross-Site Request Forgery)  
**CVSS Score:** 6.5 (Medium)

#### Descrição
Operações state-changing não possuem proteção explícita contra CSRF.

#### Impacto
- 🟠 Atacante pode criar/deletar animais em nome da vítima
- 🟠 Modificação não autorizada de perfil
- 🟠 Ações administrativas sem consentimento

#### Checklist de Correção
- [ ] Verificar se Supabase Auth possui proteção CSRF built-in
- [ ] Implementar SameSite=Strict em cookies
- [ ] Adicionar tokens CSRF em formulários críticos
- [ ] Validar Origin/Referer headers no backend
- [ ] Exigir reautenticação para ações sensíveis
- [ ] Implementar confirmação dupla em ações destrutivas

```typescript
// Supabase já implementa proteção CSRF em suas APIs
// Mas adicionar camada extra para ações críticas:

const performCriticalAction = async (action: string) => {
  // 1. Verificar sessão ativa
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Sessão inválida');
  
  // 2. Para ações muito sensíveis, pedir senha novamente
  if (action === 'DELETE_ACCOUNT') {
    // Mostrar modal pedindo senha
  }
  
  // 3. Executar ação
};
```

#### Referências
- [OWASP CSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- [CWE-352](https://cwe.mitre.org/data/definitions/352.html)

---

### 11. SQL Injection via RPC Functions

**Local:** `src/services/authService.ts` (linha 260)  
**CWE:** CWE-89 (SQL Injection)  
**CVSS Score:** 6.3 (Medium)

#### Descrição
Uso de `.or()` com concatenação de strings pode ser vulnerável a SQL injection se não tratado corretamente.

#### Trecho de Código
```typescript
// src/services/authService.ts (linha 260)
const { data, error } = await supabase
  .from('suspensions')
  .select('*')
  .or(`email.eq.${email},cpf.eq.${cpf}`) // ⚠️ Potencialmente vulnerável
  .eq('is_active', true)
```

#### Checklist de Correção
- [ ] Usar parametrização correta do Supabase
- [ ] Evitar concatenação de strings em queries
- [ ] Validar/sanitizar inputs antes de usar em queries
- [ ] Usar prepared statements via Supabase RPC
- [ ] Implementar input validation estrita

```typescript
// CORREÇÃO RECOMENDADA
const { data, error } = await supabase
  .from('suspensions')
  .select('*')
  .or(`email.eq."${email.replace(/"/g, '')}",cpf.eq."${cpf.replace(/"/g, '')}"`)
  .eq('is_active', true);

// Ou melhor ainda, usar duas queries separadas:
const { data: emailSuspension } = await supabase
  .from('suspensions')
  .select('*')
  .eq('email', email)
  .eq('is_active', true)
  .maybeSingle();

const { data: cpfSuspension } = await supabase
  .from('suspensions')
  .select('*')
  .eq('cpf', cpf)
  .eq('is_active', true)
  .maybeSingle();

return !!(emailSuspension || cpfSuspension);
```

#### Referências
- [OWASP SQL Injection Prevention](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html)

---

### 12. Exposição de Anon Key no Código Fonte

**Local:** Código fonte, variáveis de ambiente  
**CWE:** CWE-798 (Use of Hard-coded Credentials)  
**CVSS Score:** 6.0 (Medium)

#### Descrição
A Anon Key do Supabase está visível no código compilado do frontend, o que é esperado mas requer RLS policies rigorosas.

#### Impacto
- 🟠 Qualquer pessoa pode fazer requests ao Supabase
- 🟠 Depende 100% de RLS policies para segurança
- 🟠 Service Key jamais deve ser exposta

#### Checklist de Correção
- [x] ✅ RLS habilitado em todas as tabelas (já implementado)
- [ ] Verificar se policies cobrem todos os casos
- [ ] Nunca usar Service Key no frontend
- [ ] Monitorar uso da API para detectar abuso
- [ ] Implementar rate limiting rigoroso
- [ ] Documentar que Anon Key é pública (não é vulnerabilidade se RLS está correto)

**Validação:**
```sql
-- Verificar que TODAS as tabelas têm RLS
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = FALSE; -- Deve retornar 0 linhas
```

#### Referências
- [Supabase Security Best Practices](https://supabase.com/docs/guides/auth/row-level-security)

---

### 13. Views com SECURITY DEFINER (CORRIGIDO PARCIALMENTE)

**Local:** Banco de dados, views  
**CWE:** CWE-266 (Incorrect Privilege Assignment)  
**CVSS Score:** 8.8 (High) → 0.0 (Corrigido)

#### Descrição
**STATUS:** ✅ **CORRIGIDO** conforme `VERIFICACAO_FINAL_POS_CORRECOES.md`

6 views foram recriadas com `security_invoker = true`, eliminando bypass de RLS.

#### Views Corrigidas
- ✅ search_animals
- ✅ animals_ranking
- ✅ animals_with_stats
- ✅ events_with_stats
- ✅ articles_with_stats
- ✅ user_dashboard_stats

#### Validação
```sql
-- Verificar que views usam security_invoker
SELECT 
  schemaname, 
  viewname,
  definition
FROM pg_views 
WHERE schemaname = 'public'
AND definition NOT LIKE '%security_invoker%';
-- Deve retornar 0 linhas
```

---

### 14. Functions sem search_path (CORRIGIDO PARCIALMENTE)

**Local:** Banco de dados, functions  
**CWE:** CWE-426 (Untrusted Search Path)  
**CVSS Score:** 7.3 (High) → 0.0 (Corrigido)

#### Descrição
**STATUS:** ✅ **CORRIGIDO** conforme `VERIFICACAO_FINAL_POS_CORRECOES.md`

13 functions protegidas com `SET search_path = public, pg_temp`.

#### Referências
- Migration `002_FINAL_add_search_path.sql` aplicada com sucesso

---

## 🟡 Vulnerabilidades Médias

### 15. Falta de Auditoria de Ações Administrativas

**Local:** Sistema admin, tabela system_logs  
**CWE:** CWE-778 (Insufficient Logging)  
**CVSS Score:** 5.5 (Medium)

#### Descrição
Ações administrativas não são logadas adequadamente para auditoria.

#### Impacto
- 🟡 Impossível rastrear quem fez o quê
- 🟡 Dificulta investigação de incidentes
- 🟡 Não conformidade com regulações (LGPD)

#### Checklist de Correção
- [ ] Implementar logging de todas as ações admin
- [ ] Registrar: quem, o quê, quando, de onde (IP)
- [ ] Criar dashboard de auditoria
- [ ] Implementar alertas para ações críticas
- [ ] Garantir logs são imutáveis
- [ ] Implementar retenção de logs (mínimo 1 ano)

```sql
-- Tabela de audit log
CREATE TABLE admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES profiles(id),
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id uuid,
  details jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Trigger automático
CREATE OR REPLACE FUNCTION log_admin_action()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO admin_audit_log (admin_id, action, resource_type, resource_id, details)
  VALUES (auth.uid(), TG_OP, TG_TABLE_NAME, NEW.id, to_jsonb(NEW));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### Referências
- [OWASP Logging Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html)

---

### 16. Ausência de 2FA/MFA

**Local:** Sistema de autenticação  
**CWE:** CWE-308 (Use of Single-factor Authentication)  
**CVSS Score:** 5.9 (Medium)

#### Descrição
Sistema não oferece autenticação de dois fatores, mesmo para contas privilegiadas.

#### Impacto
- 🟡 Contas comprometidas por phishing
- 🟡 Acesso não autorizado em caso de senha vazada
- 🟡 Contas admin especialmente vulneráveis

#### Checklist de Correção
- [ ] Implementar TOTP (Google Authenticator, Authy)
- [ ] Oferecer backup codes
- [ ] Tornar 2FA obrigatório para admins
- [ ] Implementar SMS como fallback (menos seguro)
- [ ] Adicionar WebAuthn/FIDO2 (mais seguro)
- [ ] Documentar processo de recovery

**Implementação com Supabase:**
```typescript
// Supabase tem suporte nativo a MFA
import { supabase } from '@/lib/supabase';

async function enableMFA() {
  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: 'totp',
    friendlyName: 'My Authenticator App'
  });
  
  if (data) {
    // Mostrar QR code para usuário
    console.log(data.totp.qr_code);
  }
}

async function verifyMFA(code: string, factorId: string) {
  const { data, error } = await supabase.auth.mfa.verify({
    factorId: factorId,
    code: code
  });
}
```

#### Referências
- [Supabase MFA Documentation](https://supabase.com/docs/guides/auth/auth-mfa)
- [OWASP MFA Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Multifactor_Authentication_Cheat_Sheet.html)

---

### 17. Policy Faltante em system_logs

**Local:** `public.system_logs` table  
**CWE:** CWE-284 (Improper Access Control)  
**CVSS Score:** 5.3 (Medium)

#### Descrição
**STATUS:** Migration disponível mas não aplicada

Tabela tem RLS habilitado mas nenhuma policy, tornando-a inacessível.

#### Correção Disponível
- Arquivo: `migrations_security_fixes/003_add_system_logs_policy.sql`
- Status: ⏳ Pendente de aplicação

```sql
-- Correção a ser aplicada
CREATE POLICY "Only admins can view system logs"
ON public.system_logs FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);
```

---

### 18. Falta de Validação de Email

**Local:** Sistema de registro  
**CWE:** CWE-20 (Improper Input Validation)  
**CVSS Score:** 4.3 (Medium)

#### Descrição
Apenas validação de regex no client-side, sem verificação de email real.

#### Checklist de Correção
- [ ] Implementar verificação de email (link de confirmação)
- [ ] Configurar Email Verification no Supabase
- [ ] Não permitir login sem email verificado
- [ ] Implementar re-envio de email de verificação
- [ ] Bloquear emails descartáveis/temporários

**Supabase Config:**
```
1. Dashboard > Authentication > Email Templates
2. Habilitar "Confirm your email"
3. Customizar template de email
4. Configurar redirecionamento pós-confirmação
```

---

### 19-23. Outras Vulnerabilidades Médias

- **19. Falta de Proteção contra Enumeração de Usuários**: Mensagens de erro revelam se email existe
- **20. Ausência de Timeout em Operações Longas**: Uploads/queries podem travar
- **21. Informações de Depuração em Produção**: Verificar se logs estão desabilitados
- **22. Falta de Integrity Checking em Assets**: Implementar SRI (Subresource Integrity)
- **23. Ausência de Backup Automatizado**: Implementar backup regular do banco

*(Detalhamento completo disponível mediante solicitação)*

---

## 🟢 Vulnerabilidades Baixas

### 24. Falta de .env.local no .gitignore Explícito

**Local:** `.gitignore`  
**CWE:** CWE-540 (Inclusion of Sensitive Information in Source Code)  
**CVSS Score:** 3.7 (Low)

#### Descrição
Apesar de `*.local` estar no .gitignore, é boa prática listar `.env.local` explicitamente.

#### Correção
```bash
# .gitignore - adicionar:
.env
.env.local
.env.*.local
.env.production
```

---

### 25. Falta de Documentação de Segurança

**Local:** Documentação do projeto  
**CVSS Score:** 2.0 (Low)

#### Checklist
- [ ] Criar SECURITY.md com processo de report de vulnerabilidades
- [ ] Documentar políticas de segurança
- [ ] Criar guia de segurança para desenvolvedores
- [ ] Documentar recuperação de conta
- [ ] Criar runbook para incidentes

---

### 26. Ausência de Monitoramento de Segurança

**Local:** Infraestrutura  
**CVSS Score:** 3.5 (Low)

#### Checklist
- [ ] Implementar Sentry ou similar para tracking de erros
- [ ] Configurar alertas para comportamento suspeito
- [ ] Monitorar uso de API
- [ ] Implementar health checks
- [ ] Configurar uptime monitoring

---

### 27. Falta de Política de Retenção de Dados

**Local:** Sistema geral  
**CVSS Score:** 2.5 (Low)

#### Checklist
- [ ] Definir período de retenção de dados
- [ ] Implementar soft delete
- [ ] Criar processo de purga de dados antigos
- [ ] Documentar conformidade LGPD
- [ ] Implementar "direito ao esquecimento"

---

## 📋 Recomendações Gerais de Segurança

### Desenvolvimento Seguro

1. **Code Review Obrigatório**
   - Toda alteração deve passar por review de segurança
   - Usar checklist de segurança em PRs
   - Ferramenta: GitHub Pull Request Templates

2. **Testes de Segurança Automatizados**
   ```bash
   # Adicionar ao CI/CD
   npm audit
   npm run lint
   npm run test:security
   ```

3. **Dependency Scanning**
   - Configurar Dependabot
   - Snyk ou WhiteSource para monitoramento contínuo
   - Atualizar dependências regularmente

### Infraestrutura

4. **HTTPS Obrigatório**
   - ✅ Supabase já usa HTTPS
   - Configurar HSTS headers
   - Redirecionar HTTP → HTTPS

5. **Backup e Recovery**
   - Backup diário do banco Supabase
   - Testar processo de restore trimestralmente
   - Documentar RTO/RPO

6. **Monitoramento**
   - Implementar SIEM básico
   - Alertas para:
     - Múltiplas tentativas de login falhadas
     - Upload suspeito de arquivos
     - Acesso de IPs incomuns
     - Mudanças em configurações críticas

### Conformidade

7. **LGPD/GDPR**
   - [ ] Política de privacidade atualizada
   - [ ] Termos de uso claros
   - [ ] Consentimento explícito para cookies
   - [ ] Processo de exclusão de dados
   - [ ] DPO designado

8. **PCI-DSS** (se aplicável)
   - Não armazenar dados de cartão diretamente
   - Usar gateway de pagamento certificado

---

## 🎯 Plano de Melhoria da Postura de Segurança

### Fase 1: Crítico (1-2 semanas)

| # | Ação | Tempo | Responsável |
|---|------|-------|-------------|
| 1 | Implementar Headers de Segurança HTTP | 2h | DevOps |
| 2 | Corrigir Logging de Informações Sensíveis | 4h | Dev Backend |
| 3 | Migrar Analytics para Backend | 8h | Dev Fullstack |
| 4 | Atualizar Dependências Vulneráveis | 1h | Dev |
| 5 | Implementar Políticas de Senha Fortes | 2h | Dev + Config |
| 6 | Adicionar Rate Limiting Básico | 6h | Dev Backend |

**Total Fase 1:** ~23 horas (~3 dias úteis)

### Fase 2: Alto (2-4 semanas)

| # | Ação | Tempo | Responsável |
|---|------|-------|-------------|
| 7 | Instalar e Implementar DOMPurify | 4h | Dev Frontend |
| 8 | Validação Robusta de Uploads | 6h | Dev Fullstack |
| 9 | Implementar Session Timeout | 4h | Dev Frontend |
| 10 | CSRF Protection Adicional | 4h | Dev Backend |
| 11 | Refatorar Queries SQL | 6h | Dev Backend |
| 12 | Revisar e Testar RLS Policies | 8h | Dev Backend + Security |

**Total Fase 2:** ~32 horas (~4 dias úteis)

### Fase 3: Médio (1-2 meses)

| # | Ação | Tempo | Responsável |
|---|------|-------|-------------|
| 13 | Implementar Audit Logging | 12h | Dev Backend |
| 14 | Configurar 2FA/MFA | 16h | Dev Fullstack |
| 15 | Aplicar Policy system_logs | 1h | DevOps |
| 16 | Email Verification | 4h | Dev + Config |
| 17 | Implementar SRI para Assets | 2h | Dev Frontend |
| 18 | Sistema de Backup Automatizado | 8h | DevOps |

**Total Fase 3:** ~43 horas (~5-6 dias úteis)

### Fase 4: Baixo (Ongoing)

- Monitoramento contínuo de segurança
- Testes de penetração trimestrais
- Treinamento de segurança para equipe
- Atualização de documentação
- Conformidade LGPD/GDPR

---

## 📚 Referências e Recursos

### Standards & Frameworks

- [OWASP Top 10 2021](https://owasp.org/www-project-top-ten/)
- [OWASP ASVS](https://owasp.org/www-project-application-security-verification-standard/)
- [CWE Top 25](https://cwe.mitre.org/top25/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)

### Supabase Specific

- [Supabase Security Best Practices](https://supabase.com/docs/guides/platform/going-into-prod)
- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Auth Guide](https://supabase.com/docs/guides/auth)

### Tools

- [npm audit](https://docs.npmjs.com/cli/v8/commands/npm-audit)
- [Snyk](https://snyk.io/)
- [OWASP ZAP](https://www.zaproxy.org/)
- [Burp Suite](https://portswigger.net/burp)

---

## ✅ Checklist de Correções Prioritárias

### Imediato (Esta Semana)
- [ ] Adicionar Headers de Segurança HTTP
- [ ] Remover logging de emails e dados sensíveis
- [ ] Atualizar dependências vulneráveis (npm audit fix)
- [ ] Configurar requisitos de senha fortes no Supabase
- [ ] Adicionar .env explicitamente no .gitignore

### Urgente (Próximas 2 Semanas)
- [ ] Implementar rate limiting em login e upload
- [ ] Instalar e configurar DOMPurify
- [ ] Adicionar validação robusta de uploads
- [ ] Implementar session timeout
- [ ] Migrar analytics para backend
- [ ] Refatorar queries SQL inseguras

### Importante (Próximo Mês)
- [ ] Implementar 2FA para admins
- [ ] Criar sistema de audit logging
- [ ] Aplicar policy system_logs
- [ ] Configurar email verification
- [ ] Implementar backup automatizado
- [ ] Testes de penetração

### Recomendado (Próximos 3 Meses)
- [ ] Documentação de segurança
- [ ] Monitoramento de segurança
- [ ] Conformidade LGPD completa
- [ ] Treinamento de segurança para equipe
- [ ] Processo de incident response

---

## 📞 Contato e Suporte

Para reportar vulnerabilidades de segurança:
- **Email:** security@cavalaria-digital.com (criar)
- **PGP Key:** (configurar)
- **Response Time:** 24-48 horas

Para dúvidas sobre este relatório:
- Engenheiro de Segurança responsável pela auditoria

---

**Relatório gerado em:** 2 de outubro de 2025  
**Próxima revisão recomendada:** 2 de janeiro de 2026 (trimestral)  
**Assinatura:** Engenheiro de Segurança Sênior

---

## 📎 Anexos

- [A] Resultados completos do npm audit
- [B] Lista completa de dependências
- [C] Configuração atual do Supabase
- [D] Scripts de correção SQL
- [E] Checklist de deployment seguro

---

**FIM DO RELATÓRIO**





