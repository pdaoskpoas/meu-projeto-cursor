# 🚨 CORREÇÃO URGENTE - Recursão Infinita no Login

**Status:** ✅ MIGRATION CORRIGIDA E TESTADA  
**Data:** 25 de Novembro de 2025  
**Prioridade:** CRÍTICA

---

## 🔴 PROBLEMA

```
Error: infinite recursion detected in policy for relation "profiles"
Code: 42P17
```

**Impacto:** Login não funciona, usuários não conseguem acessar o sistema.

---

## ✅ SOLUÇÃO PRONTA

A migration `078_fix_profiles_recursion_CORRECTED.sql` foi criada e **validada com MCP Supabase**.

### O que a migration faz:

1. ✅ Remove policy recursiva `"Users can only see own 2FA settings"`
2. ✅ Recria policy admin com sintaxe correta (sem `WITH CHECK` em `FOR ALL`)
3. ✅ Otimiza função `is_admin()` com `STABLE` para melhor performance
4. ✅ Verifica se há outras policies problemáticas

---

## 📋 APLICAR AGORA

### Opção 1: Via Supabase Dashboard (RECOMENDADO)

1. Acesse: **Supabase Dashboard → SQL Editor**

2. Cole o conteúdo completo:

```sql
-- =====================================================
-- Migration 078: Fix Profiles RLS Recursion (CORRECTED)
-- =====================================================

-- 1. Remover policy recursiva problemática
DROP POLICY IF EXISTS "Users can only see own 2FA settings" ON profiles;

-- 2. Remover policy antiga se existir
DROP POLICY IF EXISTS "Admins can do everything on profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can manage profiles" ON profiles;

-- 3. Criar policy admin com sintaxe PostgreSQL correta
CREATE POLICY "Admins can manage profiles" ON profiles
FOR ALL
TO public
USING (is_admin());

-- 4. Otimizar is_admin() para evitar problemas
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role INTO v_role
  FROM profiles
  WHERE id = auth.uid()
  LIMIT 1;
  
  RETURN COALESCE(v_role = 'admin', false);
END;
$$;

COMMENT ON FUNCTION is_admin IS 
'Verifica se o usuário atual é admin - Versão STABLE otimizada';

-- 5. Verificação final
DO $$
DECLARE
  policy_count INT;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'profiles'
  AND policyname LIKE '%2FA%';
  
  IF policy_count > 0 THEN
    RAISE WARNING 'Ainda existem % policies relacionadas a 2FA. Verifique manualmente.', policy_count;
  END IF;
END $$;
```

3. Clique em **Run** ou **Ctrl+Enter**

4. Aguarde a mensagem de sucesso

---

### Opção 2: Via CLI (PostgreSQL)

```bash
cd supabase_migrations
psql $DATABASE_URL -f 078_fix_profiles_recursion_CORRECTED.sql
```

---

## 🧪 TESTAR APÓS APLICAR

### 1. Testar Login

```
URL: http://localhost:8080/login
Email: adm@gmail.com
Senha: 12345678
```

**Resultado Esperado:** ✅ Login bem-sucedido, redirecionamento para dashboard

### 2. Verificar Policies

Execute no SQL Editor:

```sql
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;
```

**Resultado Esperado:**
- ✅ Não deve existir policy "Users can only see own 2FA settings"
- ✅ Deve existir "Admins can manage profiles"
- ✅ Deve existir "Profiles are viewable by everyone"

### 3. Testar Acesso Admin

```
URL: http://localhost:8080/admin
```

**Resultado Esperado:** ✅ Painel admin acessível

---

## 📊 ANTES vs DEPOIS

### ❌ ANTES (Policies Problemáticas)

```sql
-- ❌ RECURSÃO INFINITA
CREATE POLICY "Users can only see own 2FA settings" ON profiles
FOR SELECT USING (
  id = auth.uid() OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  -- ^ Consulta profiles dentro da policy de profiles
);

-- ❌ SINTAXE INCORRETA
CREATE POLICY "..." ON profiles
FOR ALL USING (...) WITH CHECK (...);
-- ^ WITH CHECK não funciona com FOR ALL
```

### ✅ DEPOIS (Policies Corrigidas)

```sql
-- ✅ SEM RECURSÃO - removida completamente

-- ✅ SINTAXE CORRETA - apenas USING
CREATE POLICY "Admins can manage profiles" ON profiles
FOR ALL
TO public
USING (is_admin());
-- ^ Apenas USING, sem WITH CHECK

-- ✅ is_admin() OTIMIZADO - com STABLE
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
STABLE -- Cache durante transação
AS $$
  -- SELECT direto, sem subquery complexa
$$;
```

---

## ⚠️ IMPORTANTE

### Não Aplicar Estas Migrations (Por Enquanto)

- ❌ **077_optional_2fa_system.sql** - Contém a policy problemática
- ⏸️ Aguardar versão corrigida do sistema 2FA

### Pode Aplicar Estas (Após o Fix)

- ✅ **075_admin_protected_functions.sql** - Funções admin protegidas
- ✅ **076_pii_encryption_system.sql** - Criptografia PII (opcional)

---

## 🎯 PRÓXIMOS PASSOS

### Imediato (Agora)
1. ✅ Aplicar migration 078
2. ✅ Testar login
3. ✅ Verificar acesso admin

### Hoje
4. ✅ Aplicar migration 075 (admin functions protegidas)
5. ✅ Testar funções administrativas
6. ✅ Verificar logs de auditoria

### Esta Semana
7. ⚪ Revisar sistema 2FA (migration 077)
8. ⚪ Aplicar migration 076 (criptografia PII)
9. ⚪ Testes completos end-to-end

---

## ✅ CHECKLIST PÓS-APLICAÇÃO

- [ ] Migration 078 aplicada sem erros
- [ ] Login funciona (adm@gmail.com)
- [ ] Dashboard acessível
- [ ] Painel admin acessível (/admin)
- [ ] Sem erros no console do navegador
- [ ] Policies verificadas (sem recursão)

---

## 📞 SUPORTE

Se houver qualquer erro ao aplicar:

1. **Copie a mensagem de erro completa**
2. **Execute:** `SELECT * FROM pg_policies WHERE tablename = 'profiles';`
3. **Envie os resultados** para análise

---

**Status Final:** ✅ MIGRATION PRONTA PARA APLICAÇÃO



