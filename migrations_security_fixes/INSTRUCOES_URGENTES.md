# ⚠️ INSTRUÇÕES URGENTES - CORREÇÃO DO ERRO

## 🎯 O Que Aconteceu

Você aplicou o SQL `001_fix_security_definer_views.sql` ✅ com sucesso!

Ao tentar aplicar `002_add_search_path_to_functions.sql`, recebeu este erro:
```
ERROR: 42725: function name "public.generate_public_code" is not unique
HINT: Specify the argument list to select the function unambiguously.
```

## 🔍 Causa do Erro

As funções no seu banco têm **assinaturas diferentes** das que eu havia colocado no SQL original.

Por exemplo:
- **Esperado:** `generate_public_code()` sem parâmetros
- **Real no banco:** `generate_public_code(user_id_param uuid, account_type_param text)`

## ✅ Solução

Use o arquivo **CORRIGIDO**: `002_add_search_path_CORRIGIDO.sql`

---

## 📋 PRÓXIMOS PASSOS

### 1️⃣ Ignorar o SQL Antigo

❌ **NÃO USE:** `002_add_search_path_to_functions.sql`  
✅ **USE:** `002_add_search_path_CORRIGIDO.sql`

### 2️⃣ Aplicar o SQL Corrigido

1. Abra: `migrations_security_fixes/002_add_search_path_CORRIGIDO.sql`
2. Copie **TODO o conteúdo** (Ctrl+A, Ctrl+C)
3. Acesse: https://supabase.com/dashboard/project/wyufgltprapazpxmtaff/sql/new
4. Cole o SQL
5. Clique em **RUN**
6. Aguarde a mensagem: ✅ "SUCESSO: Todas as functions foram corrigidas!"

### 3️⃣ Aplicar Correção 3

Depois aplique o SQL 3:

1. Abra: `migrations_security_fixes/003_add_system_logs_policy.sql`
2. Copie todo o conteúdo
3. Execute no Dashboard SQL
4. Aguarde: ✅ "Policy criada com sucesso"

### 4️⃣ Habilitar Proteção de Senha

1. Acesse: https://supabase.com/dashboard/project/wyufgltprapazpxmtaff/auth/policies
2. Habilite "Check against HaveIBeenPwned database"
3. Salve

---

## ✅ Checklist Atualizado

```
[✅] 1. Views SECURITY DEFINER corrigidas
[ ] 2. Functions search_path - USAR ARQUIVO CORRIGIDO
[ ] 3. Policy system_logs
[ ] 4. Proteção de senha
```

---

## 🔍 O Que Foi Corrigido

O arquivo `002_add_search_path_CORRIGIDO.sql` agora usa as **assinaturas reais** do banco:

### Funções Corrigidas:

1. ✅ `update_updated_at_column()` - sem parâmetros
2. ✅ `generate_public_code(user_id_param uuid, account_type_param text)` - 2 parâmetros
3. ✅ `add_purchased_boost_credits()` - TRIGGER, sem parâmetros
4. ✅ `zero_plan_boosts_on_free(user_uuid uuid)` - 1 parâmetro
5. ✅ `grant_monthly_boosts()` - sem parâmetros
6. ✅ `calculate_expiration_date(publish_date timestamptz)` - 1 parâmetro
7. ✅ `is_in_grace_period(expire_date timestamptz)` - 1 parâmetro
8. ✅ `set_expiration_on_publish()` - TRIGGER, sem parâmetros
9. ✅ `process_animal_expirations()` - sem parâmetros
10. ✅ `renew_animal_individually(animal_id_param uuid, user_id_param uuid)` - 2 parâmetros
11. ✅ `expire_boosts()` - sem parâmetros
12. ✅ `expire_ads()` - sem parâmetros
13. ✅ `search_animals(...)` - 9 parâmetros com defaults

---

## 📊 Status Atual

| Correção | Status | Arquivo |
|----------|--------|---------|
| 1. Views | ✅ APLICADO | `001_fix_security_definer_views.sql` |
| 2. Functions | ⏳ PENDENTE | `002_add_search_path_CORRIGIDO.sql` ⚠️ |
| 3. Policy | ⏳ PENDENTE | `003_add_system_logs_policy.sql` |
| 4. Senha | ⏳ PENDENTE | Via Dashboard |

---

## 💡 Dica

Após aplicar o SQL corrigido, execute este SQL para validar:

```sql
SELECT 
  proname AS function_name,
  CASE 
    WHEN proconfig IS NOT NULL 
    AND 'search_path' = ANY(string_to_array(array_to_string(proconfig, ','), ','))
    THEN '✅ Corrigido'
    ELSE '❌ Pendente'
  END AS status
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
AND proname IN (
  'generate_public_code',
  'expire_boosts',
  'expire_ads',
  'grant_monthly_boosts'
)
ORDER BY proname;
```

**Resultado esperado:** Todas as funções com "✅ Corrigido"

---

**Arquivo criado em:** 2 de outubro de 2025  
**Versão:** 1.0 - CORRIGIDO  
**Use sempre o arquivo CORRIGIDO para a correção 2!**

