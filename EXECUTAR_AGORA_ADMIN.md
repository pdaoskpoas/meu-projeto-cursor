# ⚡ EXECUTE AGORA - CONFIGURAÇÃO DO ADMINISTRADOR

**Status:** ✅ Usuário `adm@gmail.com` existe no Supabase Auth  
**Próximo Passo:** Configurar o role como 'admin'

---

## 📝 PASSO A PASSO (5 minutos)

### **PASSO 1: Abrir SQL Editor** (30 segundos)

1. No Supabase Dashboard (onde você já está)
2. Menu lateral esquerdo → Clicar em **"SQL Editor"**
3. Clicar em **"New query"**

---

### **PASSO 2: Executar Verificação** (30 segundos)

**Cole e execute este SQL:**

```sql
-- Ver o estado atual do perfil
SELECT 
  id,
  email,
  name,
  role,
  account_type,
  is_active,
  is_suspended
FROM profiles 
WHERE email = 'adm@gmail.com';
```

**Clique em "Run" (ou Ctrl+Enter)**

---

### **PASSO 3: Analisar Resultado**

**Você verá uma das 3 situações:**

#### ✅ **Situação A: Retornou 1 linha**
```
Exemplo de resultado:
id: dc8881a5-3f19-4476-9b8e-e91cf1815360
email: adm@gmail.com
name: Administrador
role: user  ← AQUI ESTÁ O PROBLEMA!
```

**👉 Vá para o PASSO 4**

---

#### ⚠️ **Situação B: Retornou 0 linhas**
```
"No rows returned"
```

**Significa:** O perfil não foi criado na tabela `profiles`

**👉 Vá para o PASSO 5 (Criar Perfil)**

---

#### 🎉 **Situação C: role já é 'admin'**
```
role: admin  ← JÁ ESTÁ CORRETO!
```

**👉 Pule para o PASSO 6 (Testar Login)**

---

### **PASSO 4: Atualizar Role para Admin** (30 segundos)

**Se o resultado foi Situação A (perfil existe mas role != 'admin'):**

**Cole e execute este SQL:**

```sql
UPDATE profiles 
SET 
  role = 'admin',
  name = 'Administrador do Sistema',
  account_type = 'institutional',
  is_active = true,
  is_suspended = false,
  updated_at = NOW()
WHERE email = 'adm@gmail.com';
```

**Resultado esperado:** `UPDATE 1`

**Agora execute novamente a verificação:**

```sql
SELECT 
  id,
  email,
  role
FROM profiles 
WHERE email = 'adm@gmail.com';
```

**Você deve ver:** `role: admin` ✅

**👉 Vá para o PASSO 6 (Testar Login)**

---

### **PASSO 5: Criar Perfil (se não existe)** (1 minuto)

**Se o resultado foi Situação B (0 linhas):**

**Cole e execute este SQL:**

```sql
INSERT INTO profiles (
  id,
  email,
  name,
  role,
  account_type,
  property_name,
  plan,
  is_active,
  is_suspended,
  created_at,
  updated_at
) VALUES (
  'dc8881a5-3f19-4476-9b8e-e91cf1815360',
  'adm@gmail.com',
  'Administrador do Sistema',
  'admin',
  'institutional',
  'Administração',
  'vip',
  true,
  false,
  NOW(),
  NOW()
);
```

**Resultado esperado:** `INSERT 1`

**Verificar criação:**

```sql
SELECT * FROM profiles WHERE email = 'adm@gmail.com';
```

**Você deve ver o perfil completo com `role: admin`** ✅

---

### **PASSO 6: Testar Login e Acesso** (2 minutos)

1. **Abrir sua aplicação** (localhost ou URL de produção)

2. **Ir para a página de login:** `/login`

3. **Fazer login com:**
   - **Email:** `adm@gmail.com`
   - **Senha:** `12345678`

4. **Após login, ir para:** `/admin`

5. **Verificar se você vê:**
   - ✅ Painel Administrativo
   - ✅ Menu lateral com opções (Dashboard, Usuários, etc.)
   - ✅ Estatísticas carregando

---

## ✅ CHECKLIST DE VALIDAÇÃO

Marque conforme completar:

- [ ] SQL de verificação executado
- [ ] Role atualizado para 'admin' (ou perfil criado)
- [ ] Verificação final retornou `role: admin`
- [ ] Login realizado com sucesso
- [ ] Rota `/admin` acessível
- [ ] Dashboard administrativo carregando
- [ ] Menu lateral visível
- [ ] Estatísticas aparecendo

---

## 🚨 TROUBLESHOOTING

### **Problema: "Usuário ou senha incorretos"**

**Solução: Resetar senha**

```sql
-- No SQL Editor do Supabase
UPDATE auth.users
SET encrypted_password = crypt('12345678', gen_salt('bf'))
WHERE email = 'adm@gmail.com';
```

---

### **Problema: Após login, sou redirecionado para `/dashboard` ao invés de `/admin`**

**Causa:** O role ainda não está como 'admin'

**Solução:**

1. Fazer logout
2. Executar novamente o UPDATE do PASSO 4
3. Verificar com SELECT se o role foi atualizado
4. Fazer login novamente

---

### **Problema: Vejo o painel admin mas as estatísticas mostram 0**

**Causa:** Banco de dados vazio (normal)

**Solução:** Isso é esperado! As estatísticas vão popular conforme:
- Usuários se cadastrarem
- Animais forem publicados
- Eventos forem criados

Para testar com dados, você pode:
1. Criar usuários de teste
2. Publicar alguns animais
3. Recarregar o dashboard admin

---

## 📊 RESULTADO ESPERADO

**Após executar todos os passos:**

```
✅ Perfil existe na tabela profiles
✅ role = 'admin'
✅ is_active = true
✅ is_suspended = false
✅ Login funcionando
✅ Acesso ao painel /admin liberado
✅ Todas as funcionalidades administrativas disponíveis
```

---

## 🎯 PRÓXIMOS PASSOS (APÓS VALIDAR)

1. **Alterar senha** para algo mais seguro
2. **Testar funcionalidades:**
   - Visualizar usuários
   - Visualizar denúncias
   - Visualizar transações
   - Visualizar mensagens
3. **Reportar status** (tudo funcionou?)

---

## 💬 PRECISA DE AJUDA?

**Me avise se:**
- ❌ Algum SQL retornou erro
- ❌ Não conseguiu fazer login
- ❌ Foi redirecionado para `/dashboard`
- ❌ Painel não carregou

**Estarei aqui para ajudar!** 🚀

---

**Criado em:** 08 de Novembro de 2025  
**Para:** Configuração do administrador adm@gmail.com  
**Tempo estimado:** 5 minutos  
**Status:** ⚡ Pronto para execução imediata


