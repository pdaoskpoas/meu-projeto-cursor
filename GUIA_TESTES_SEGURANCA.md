# 🧪 Guia de Testes de Segurança

**Objetivo:** Validar todas as 6 correções críticas aplicadas

---

## 🚀 Preparação

```bash
# 1. Iniciar servidor de desenvolvimento
npm run dev

# 2. Abrir navegador em: http://localhost:8080

# 3. Abrir DevTools (F12)
```

---

## ✅ TESTE 1: Headers de Segurança HTTP

### Como Testar:
1. Abra DevTools (F12)
2. Vá em **Network** (Rede)
3. Recarregue a página (Ctrl+R)
4. Clique no primeiro request (geralmente `localhost`)
5. Vá na aba **Headers** (Cabeçalhos)

### ✅ Você DEVE Ver:
```
Content-Security-Policy: default-src 'self'; script-src...
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Strict-Transport-Security: max-age=31536000; includeSubDomains
Permissions-Policy: geolocation=(), microphone=(), camera=()
```

### ✅ Resultado Esperado:
- 6 headers de segurança presentes ✅

---

## ✅ TESTE 2: Sanitização de Logs

### Como Testar:
1. Abra DevTools > **Console**
2. Vá para página de Login
3. Digite qualquer email/senha
4. Clique em "Entrar"
5. Observe os logs no console

### ✅ Você DEVE Ver:
```
🔵 Supabase: Login attempt
  Data: { email: "***REDACTED***" }
```

### ❌ Você NÃO DEVE Ver:
```
Data: { email: "seuemail@real.com" }  // ❌ ERRO!
```

### ✅ Resultado Esperado:
- Emails aparecem como `***REDACTED***` ✅
- Senhas nunca aparecem nos logs ✅

---

## ✅ TESTE 3: localStorage Seguro

### Como Testar:
1. Abra DevTools > **Application** (Aplicação)
2. Vá em **Local Storage** > `http://localhost:8080`
3. Observe as chaves armazenadas

### ❌ Você NÃO DEVE Ver:
```
animal_views_data         ❌ DELETADO
monthly_stats             ❌ DELETADO
animal_impressions_xxx    ❌ DELETADO
session_id (de analytics) ❌ DELETADO
currentUser               ❌ DELETADO
```

### ✅ Você PODE Ver (SEGURO):
```
supabase.auth.token       ✅ OK (gerenciado pelo Supabase)
rate_limit_session_id     ✅ OK (apenas ID de sessão)
```

### ✅ Resultado Esperado:
- Nenhum dado sensível em localStorage ✅
- Estatísticas vêm do Supabase ✅

---

## ✅ TESTE 4: Dependências Atualizadas

### Como Testar:
```bash
npm audit
```

### ✅ Resultado Esperado:
```
found 0 vulnerabilities ✅
```

### ℹ️ Verificar Versões:
```bash
npm list esbuild vite
```

Deve mostrar:
```
esbuild@0.25.x  ✅
vite@7.1.8      ✅
```

---

## ✅ TESTE 5: Senhas Fortes

### Teste 5.1: Cadastro com Senha Fraca

1. Vá para página de **Cadastro**
2. Preencha os campos
3. Digite senha: `123456`
4. Tente cadastrar

### ✅ Resultado Esperado:
```
❌ ERRO: "Mínimo 12 caracteres"
```

### Teste 5.2: Cadastro com Senha Sem Complexidade

1. Digite senha: `abcdefghijkl` (12 letras minúsculas)
2. Tente cadastrar

### ✅ Resultado Esperado:
```
❌ ERRO: "Pelo menos uma letra maiúscula (A-Z)"
```

### Teste 5.3: Indicador Visual de Força

1. Digite senha gradualmente: `a` → `aB` → `aB1` → `aB1!` → `aB1!qweASD123`
2. Observe a barra de progresso

### ✅ Resultado Esperado:
- Barra começa vermelha (Muito Fraca)
- Fica amarela conforme adiciona caracteres
- Fica verde com 12+ chars + complexidade
- Checkmarks ✅ aparecem para cada requisito atendido

### Teste 5.4: Cadastro com Senha Forte

1. Digite senha: `MinhaSenh@Forte123!`
2. Tente cadastrar

### ✅ Resultado Esperado:
```
✅ Cadastro bem-sucedido!
```

---

## ✅ TESTE 6: Rate Limiting

### Teste 6.1: Login - Limite de 5 Tentativas

1. Vá para página de **Login**
2. Digite email qualquer
3. Digite senha ERRADA
4. Clique "Entrar" 6 vezes seguidas

### ✅ Resultado Esperado:

**Tentativas 1-5:**
```
❌ "Email ou senha incorretos"
```

**Tentativa 6:**
```
🛡️ "Muitas tentativas. Aguarde 30 minutos."
```

### Teste 6.2: Verificar Bloqueio no Banco

Abra Supabase Dashboard > SQL Editor:

```sql
SELECT 
  user_identifier,
  operation_type,
  attempt_count,
  blocked_until,
  created_at
FROM rate_limit_tracker
WHERE operation_type = 'login'
ORDER BY created_at DESC
LIMIT 5;
```

### ✅ Resultado Esperado:
- 6 registros de tentativas
- Último registro tem `blocked_until` preenchido
- `blocked_until` é ~30 min no futuro

---

## 🔍 TESTES EXTRAS (Opcionais)

### Extra 1: XSS Protection

1. Tente cadastrar animal com nome: `<script>alert('XSS')</script>`
2. Salve
3. Visualize o animal

### ✅ Resultado Esperado:
- Script NÃO é executado ✅
- CSP bloqueia inline scripts ✅

### Extra 2: Clickjacking Protection

1. Crie arquivo HTML temporário:
```html
<!DOCTYPE html>
<html>
<body>
  <iframe src="http://localhost:8080" width="800" height="600"></iframe>
</body>
</html>
```

2. Abra no navegador

### ✅ Resultado Esperado:
```
❌ ERRO: "Refused to display in a frame because it set 'X-Frame-Options' to 'deny'"
```

### Extra 3: Session Timeout

1. Faça login
2. Aguarde 30 minutos sem interação
3. Tente fazer uma ação

### ✅ Resultado Esperado (futuro):
```
⏱️ "Sessão expirada. Faça login novamente."
```
*Nota: Timeout ainda não implementado, mas está documentado*

---

## 📊 Checklist Final de Testes

Marque conforme testa:

- [ ] ✅ Headers de segurança presentes (6 headers)
- [ ] ✅ Logs sanitizados (emails como ***REDACTED***)
- [ ] ✅ localStorage limpo (sem dados sensíveis)
- [ ] ✅ npm audit mostra 0 vulnerabilidades
- [ ] ✅ Senha fraca rejeitada no cadastro
- [ ] ✅ Indicador de força de senha funciona
- [ ] ✅ Senha forte aceita
- [ ] ✅ Rate limiting bloqueia após 5 tentativas de login
- [ ] ✅ Build de produção funciona (`npm run build`)

---

## 🆘 Problemas Comuns

### Problema: Headers não aparecem
**Solução:** 
```bash
# Parar servidor
# Limpar cache
# Reiniciar
npm run dev
```

### Problema: Rate limiting não funciona
**Solução:**
1. Verificar se migration foi aplicada no Supabase
2. Limpar cookies/localStorage
3. Tentar em aba anônima

### Problema: Senhas fracas ainda são aceitas
**Solução:**
1. Verificar se configurou no Supabase Dashboard
2. Limpar cache do browser
3. Verificar console para erros

---

## ✅ Todos os Testes Passaram?

**Parabéns! 🎉** 

Seu sistema está seguro e pronto para produção!

### Próximos Passos:
1. ✅ Fazer deploy em staging
2. ✅ Testes completos de QA
3. ✅ Deploy em produção
4. 📅 Agendar próxima auditoria (3 meses)

---

**Dúvidas?** Revise os documentos:
- `RELATORIO_CORRECOES_SEGURANCA_APLICADAS.md`
- `CONFIGURAR_SENHA_SUPABASE.md`
- `PROXIMOS_PASSOS_IMPORTANTE.md`





