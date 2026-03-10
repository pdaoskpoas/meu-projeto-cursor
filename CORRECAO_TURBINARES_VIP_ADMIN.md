# ⚠️ CORREÇÃO URGENTE: TURBINARES VIP E ADMIN

## ❌ **PROBLEMA IDENTIFICADO:**

A função `grant_monthly_boosts` está configurada incorretamente:

```sql
WHEN plan = 'vip' THEN 999999  -- ❌ ERRADO: VIP com turbinares ilimitados
```

## ✅ **CORREÇÃO NECESSÁRIA:**

### **REGRAS CORRETAS DOS TURBINARES:**

1. **Iniciante**: 0 turbinares/mês
2. **Pro**: 2 turbinares/mês
3. **Elite**: 5 turbinares/mês
4. **VIP**: 0 turbinares/mês (deve comprar igual qualquer outro)
5. **Admin**: Pode conceder manualmente até 5 turbinares/mês por usuário (independente do plano)

### **SQL PARA APLICAR MANUALMENTE:**

Execute este SQL direto no Supabase Dashboard (SQL Editor):

```sql
-- Corrigir função grant_monthly_boosts
CREATE OR REPLACE FUNCTION public.grant_monthly_boosts()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE profiles
  SET 
    plan_boost_credits = CASE
      WHEN plan = 'basic' THEN 0
      WHEN plan = 'pro' THEN 2
      WHEN plan = 'ultra' THEN 5
      WHEN plan = 'vip' THEN 0
      ELSE 0
    END,
    last_boost_grant_at = now()
  WHERE 
    plan IN ('basic', 'pro', 'ultra', 'vip')
    AND (
      last_boost_grant_at IS NULL 
      OR last_boost_grant_at < date_trunc('month', now())
    );
END;
$$;
```

### **ONDE APLICAR:**

1. Acesse: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql
2. Cole o SQL acima
3. Clique em "Run"

## 🎯 **FUNCIONALIDADE DE ADMIN:**

O admin já pode adicionar turbinares manualmente através de:

- **Frontend**: `src/hooks/admin/useAdminUsers.ts` → `updateUser()` → campo `availableBoosts`
- **Limite**: O sistema deve validar no frontend que o admin só pode adicionar até 5 turbinares por usuário por mês

### **TODO: Adicionar validação no frontend**

Adicionar em `src/hooks/admin/useAdminUsers.ts`:

```typescript
const addBoostsToUser = async (userId: string, boostsToAdd: number) => {
  if (boostsToAdd < 1 || boostsToAdd > 5) {
    throw new Error('Admin pode adicionar entre 1 e 5 turbinares por vez');
  }
  
  const user = users.find(u => u.id === userId);
  if (!user) throw new Error('Usuário não encontrado');
  
  const currentBoosts = user.availableBoosts || 0;
  const newTotal = currentBoosts + boostsToAdd;
  
  await updateUser(userId, {
    availableBoosts: newTotal
  });
};
```

## 📝 **ARQUIVO DE MIGRATION:**

A migration está salva em: `supabase_migrations/077_fix_monthly_boost_credits.sql`

**Status**: ⚠️ Aguardando aplicação manual (banco em modo read-only)


