# 🧹 GUIA: Como Limpar Todos os Dados de Teste

**Objetivo:** Deletar todos os usuários e dados de teste, mantendo apenas o admin

---

## 📋 PASSO A PASSO

### 1️⃣ **Acessar o Supabase SQL Editor**

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. No menu lateral, clique em **"SQL Editor"**
4. Clique em **"New query"**

---

### 2️⃣ **PRIMEIRO: Confirmar o Email do Admin**

Cole e execute esta query:

```sql
SELECT id, email, name, role 
FROM profiles 
WHERE email ILIKE '%adm%';
```

**✅ Confirme que o email correto aparece!**  
Se for diferente de `adm@gmail.com`, você precisa ajustar o script.

---

### 3️⃣ **Executar a Limpeza**

Cole este script completo no SQL Editor:

```sql
-- =====================================================
-- LIMPAR TODOS OS DADOS DE TESTE
-- ⚠️ NÃO HÁ VOLTA! Confirme antes de executar!
-- =====================================================

BEGIN;

-- CONFIRMAR: Quantos usuários serão DELETADOS?
SELECT 
  'Serão deletados:' AS status,
  COUNT(*) AS quantidade
FROM profiles
WHERE email NOT IN ('adm@gmail.com', 'admin@gmail.com');

-- CONFIRMAR: Quantos usuários serão MANTIDOS?
SELECT 
  'Serão mantidos:' AS status,
  COUNT(*) AS quantidade,
  STRING_AGG(email, ', ') AS emails
FROM profiles
WHERE email IN ('adm@gmail.com', 'admin@gmail.com');

-- Se os números acima estiverem CORRETOS, prossiga:

-- Deletar todos os profiles EXCETO admin
DELETE FROM profiles
WHERE email NOT IN ('adm@gmail.com', 'admin@gmail.com');

-- Deletar da autenticação também
DELETE FROM auth.users
WHERE email NOT IN ('adm@gmail.com', 'admin@gmail.com');

-- VERIFICAR RESULTADO:
SELECT 
  'Usuários restantes' AS tabela,
  COUNT(*) AS quantidade
FROM profiles
UNION ALL
SELECT 
  'Animais restantes',
  COUNT(*)
FROM animals
UNION ALL
SELECT 
  'Favoritos restantes',
  COUNT(*)
FROM favorites
UNION ALL
SELECT 
  'Conversas restantes',
  COUNT(*)
FROM conversations;

-- ✅ Se estiver tudo OK, execute:
COMMIT;

-- ❌ Se algo estiver errado, execute:
-- ROLLBACK;
```

---

### 4️⃣ **Verificar o Resultado**

Após executar, você deve ver:

```
Usuários restantes: 1
Animais restantes: 0
Favoritos restantes: 0
Conversas restantes: 0
```

---

### 5️⃣ **Testar o Sistema**

1. **Faça logout** do sistema
2. **Faça login** novamente com `adm@gmail.com`
3. Vá em **"Buscar"** → deve estar vazio (sem animais)
4. Vá em **"Dashboard"** → deve mostrar 0 animais cadastrados

---

## ⚠️ O QUE SERÁ DELETADO?

Ao deletar os usuários de teste, o CASCADE vai automaticamente deletar:

- ✅ Todos os animais cadastrados (incluindo os 2 da página "Buscar")
- ✅ Todas as fotos/vídeos dos animais
- ✅ Todas as conversas e mensagens
- ✅ Todos os favoritos
- ✅ Todas as notificações
- ✅ Todo histórico de boosts
- ✅ Todas as transações
- ✅ Todas as sociedades

**O QUE NÃO SERÁ DELETADO:**

- ✅ O usuário admin (adm@gmail.com)
- ✅ Estrutura do banco de dados (tabelas, migrations)
- ✅ Configurações do sistema
- ✅ Planos cadastrados

---

## 🚨 IMPORTANTE: Antes de Executar

1. **Faça backup** se tiver algum dado que queira preservar
2. **Confirme o email do admin** na etapa 2
3. **Leia os números** antes de fazer COMMIT
4. **Teste com ROLLBACK** primeiro se tiver dúvidas

---

## 🎯 Depois da Limpeza

Sistema estará **100% limpo** e pronto para:

1. ✅ Cadastrar dados reais de usuários
2. ✅ Cadastrar animais reais
3. ✅ Testar funcionalidades com dados reais
4. ✅ Sem conflitos ou dados teste misturados

---

## 🆘 Se Algo Der Errado

**Problema:** Deletei o admin por engano!

**Solução:**
```sql
-- Execute ROLLBACK imediatamente
ROLLBACK;

-- Ou recrie o admin:
INSERT INTO auth.users (email, encrypted_password, role)
VALUES ('adm@gmail.com', '$2a$10$...', 'authenticated');

-- (você precisará do hash da senha original)
```

**Problema:** Sistema não carrega após limpar

**Solução:**
1. Limpe o cache do navegador (Ctrl+Shift+Delete)
2. Faça logout e login novamente
3. Verifique se há erros no console do navegador

---

## ✅ Checklist Final

Antes de começar com dados reais:

- [ ] Executei a limpeza com sucesso
- [ ] Confirmei que apenas o admin permanece
- [ ] Testei login/logout
- [ ] Página "Buscar" está vazia
- [ ] Dashboard mostra 0 animais
- [ ] Sistema está funcionando normalmente
- [ ] Pronto para cadastrar dados reais! 🚀

---

**Qualquer dúvida, execute linha por linha e verifique os resultados antes de fazer COMMIT!**

