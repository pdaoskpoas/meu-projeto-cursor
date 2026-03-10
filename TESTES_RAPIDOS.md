# ⚡ Testes Rápidos (5 minutos)

Execute estes testes agora para validar as correções:

---

## 🚀 1. Iniciar Aplicação

```bash
npm run dev
```

Aguarde: `VITE ready in XXX ms`

---

## ✅ 2. Teste de Senha Fraca (2 min)

1. Abra: http://localhost:8080/register
2. Preencha o formulário
3. Digite senha: `123456`
4. Observe:
   - ❌ Erro: "Mínimo 12 caracteres"
   - 🟥 Barra vermelha "Muito Fraca"

**PASSOU? ✅**

---

## ✅ 3. Teste de Senha Forte (1 min)

1. Digite senha: `MinhaSenh@Forte123!`
2. Observe:
   - ✅ Todos checkmarks verdes
   - 🟩 Barra verde "Muito Forte"
   - ✅ Permite cadastrar

**PASSOU? ✅**

---

## ✅ 4. Teste de Rate Limiting (2 min)

1. Vá para: http://localhost:8080/login
2. Digite email: `teste@teste.com`
3. Digite senha errada: `123`
4. Clique "Entrar" **6 vezes seguidas**

**Resultado esperado:**
- Tentativas 1-5: "Email ou senha incorretos"
- Tentativa 6: 🛡️ **BLOQUEADO**

**PASSOU? ✅**

---

## ✅ 5. Verificar Headers (1 min)

1. Pressione **F12** (DevTools)
2. Aba **Network**
3. Recarregue página (Ctrl+R)
4. Clique no primeiro request
5. Aba **Headers**

**Procure por:**
```
X-Frame-Options: DENY  ✅
X-Content-Type-Options: nosniff  ✅
Content-Security-Policy: ...  ✅
```

**PASSOU? ✅**

---

## 📊 Resultado

Se TODOS os 5 testes passaram:

**🎉 SISTEMA SEGURO E FUNCIONANDO!**

Agora só falta configurar as senhas no Supabase Dashboard.

---

## ⚠️ Se Algo Falhou

Consulte: `GUIA_TESTES_SEGURANCA.md` (testes detalhados)





