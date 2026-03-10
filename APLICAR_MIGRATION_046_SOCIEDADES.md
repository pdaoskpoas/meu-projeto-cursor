# 🚀 APLICAR MIGRATION 046 - SISTEMA DE SOCIEDADES

## ⚠️ IMPORTANTE - LEIA ANTES DE APLICAR

Esta migration cria o **sistema completo de sociedades** com:
- ✅ Função para contar animais com sociedades
- ✅ View `animals_with_partnerships` 
- ✅ Função para buscar animais do perfil
- ✅ Função para validar aceitação de convites
- ✅ Trigger para notificar sociedades aceitas
- ✅ Políticas RLS adicionais
- ✅ Índices otimizados

---

## 📋 PRÉ-REQUISITOS

Antes de aplicar esta migration, verifique:

1. ✅ Tabela `animal_partnerships` existe (migration 003)
2. ✅ Tabela `notifications` existe (migration 042)
3. ✅ Função `create_notification()` existe (migration 042)
4. ✅ View `animals_with_stats` existe (migration 010)
5. ✅ Tabela `profiles` tem campo `property_name` (migration 034)

---

## 🔍 VERIFICAÇÕES ANTES DE APLICAR

### 1. Verificar tabelas necessárias

```sql
-- Verificar se todas as tabelas existem
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('animal_partnerships', 'notifications', 'profiles', 'animals');
```

**Esperado:** 4 linhas retornadas

### 2. Verificar função create_notification

```sql
-- Verificar se a função existe
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name = 'create_notification';
```

**Esperado:** 1 linha retornada

### 3. Verificar campo property_name

```sql
-- Verificar se o campo existe na tabela profiles
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'profiles' 
  AND column_name = 'property_name';
```

**Esperado:** 1 linha retornada (`property_name | text`)

---

## ✅ APLICAR A MIGRATION

### Via Supabase Dashboard

1. Acesse: https://supabase.com/dashboard/project/YOUR_PROJECT/sql/new
2. Copie TODO o conteúdo de: `supabase_migrations/046_create_partnerships_system.sql`
3. Cole no editor SQL
4. Clique em **"Run"**
5. Aguarde a confirmação ✅

### Via CLI (se disponível)

```bash
supabase db push --file supabase_migrations/046_create_partnerships_system.sql
```

---

## 🧪 VALIDAÇÃO PÓS-APLICAÇÃO

### 1. Verificar função criada

```sql
-- Deve retornar 1 linha
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name = 'count_active_animals_with_partnerships';
```

### 2. Verificar view criada

```sql
-- Deve retornar 1 linha
SELECT table_name 
FROM information_schema.views 
WHERE table_schema = 'public' 
  AND table_name = 'animals_with_partnerships';
```

### 3. Testar a view

```sql
-- Deve retornar dados sem erro
SELECT id, name, partners, active_partners_count, pending_partners_count
FROM animals_with_partnerships
LIMIT 5;
```

### 4. Testar função de contagem

```sql
-- Substitua 'USER_UUID_AQUI' por um UUID real de usuário
SELECT count_active_animals_with_partnerships('USER_UUID_AQUI');
```

**Esperado:** Retorna um número inteiro (0 ou mais)

### 5. Verificar políticas RLS

```sql
-- Deve retornar pelo menos 1 linha
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'animals'
  AND policyname = 'Partners with active plan can view animals';
```

### 6. Verificar índices

```sql
-- Deve retornar 2 linhas
SELECT indexname 
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND tablename = 'animal_partnerships'
  AND indexname IN ('idx_animal_partnerships_partner_accepted', 'idx_animal_partnerships_animal_status');
```

### 7. Verificar trigger

```sql
-- Deve retornar 1 linha
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND trigger_name = 'trigger_notify_on_partnership_accepted';
```

---

## 🎯 TESTES FUNCIONAIS

### Teste 1: Criar convite de sociedade

```sql
-- Substitua os UUIDs pelos valores reais do seu banco
INSERT INTO animal_partnerships (
  animal_id,
  partner_id,
  partner_haras_name,
  partner_public_code,
  percentage,
  status
) VALUES (
  'ANIMAL_UUID_AQUI',
  'PARTNER_UUID_AQUI',
  'Nome do Haras Parceiro',
  'PUBLIC_CODE_AQUI',
  30.00,
  'pending'
) RETURNING *;
```

**Esperado:** 
- Registro criado com sucesso
- Notificação criada automaticamente na tabela `notifications` (verificar pelo trigger da migration 042)

### Teste 2: Aceitar convite

```sql
-- Substitua PARTNERSHIP_UUID_AQUI pelo ID da sociedade criada acima
UPDATE animal_partnerships 
SET status = 'accepted', updated_at = NOW()
WHERE id = 'PARTNERSHIP_UUID_AQUI'
RETURNING *;
```

**Esperado:**
- Status muda para 'accepted'
- Notificação criada para o dono do animal (pelo novo trigger)

### Teste 3: Verificar contagem

```sql
-- Substitua USER_UUID_AQUI pelo partner_id que aceitou
SELECT count_active_animals_with_partnerships('USER_UUID_AQUI');
```

**Esperado:** Número aumentou em 1

### Teste 4: Buscar animais do perfil

```sql
-- Substitua USER_UUID_AQUI pelo partner_id
SELECT * FROM get_profile_animals('USER_UUID_AQUI');
```

**Esperado:** Lista inclui o animal da sociedade aceita (se usuário tem plano ativo)

---

## ⚠️ TROUBLESHOOTING

### Erro: "function create_notification does not exist"
**Solução:** Aplique primeiro a migration 042 (sistema de notificações)

### Erro: "relation animals_with_stats does not exist"
**Solução:** Aplique primeiro a migration 010 (views)

### Erro: "column pp.property_name does not exist"
**Solução:** 
- Verifique se a migration 034 foi aplicada
- Se não existe, adicione o campo manualmente:
```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS property_name TEXT;
```

### Erro: "relation public.migrations does not exist"
**Solução:** Esse erro já foi corrigido. Use a versão atualizada do arquivo SQL (sem registro na tabela migrations)

### View retorna dados estranhos
**Solução:** Recrie a view:
```sql
DROP VIEW IF EXISTS animals_with_partnerships CASCADE;
-- Depois reaplique só a parte da view da migration
```

---

## 🔄 ROLLBACK (se necessário)

Se precisar reverter esta migration:

```sql
-- 1. Dropar trigger
DROP TRIGGER IF EXISTS trigger_notify_on_partnership_accepted ON animal_partnerships;
DROP FUNCTION IF EXISTS notify_on_partnership_accepted();

-- 2. Dropar política RLS
DROP POLICY IF EXISTS "Partners with active plan can view animals" ON animals;

-- 3. Dropar índices
DROP INDEX IF EXISTS idx_animal_partnerships_partner_accepted;
DROP INDEX IF EXISTS idx_animal_partnerships_animal_status;

-- 4. Revogar permissões
REVOKE EXECUTE ON FUNCTION count_active_animals_with_partnerships(UUID) FROM authenticated;
REVOKE EXECUTE ON FUNCTION get_profile_animals(UUID) FROM authenticated, anon;
REVOKE EXECUTE ON FUNCTION can_accept_partnership(UUID, UUID) FROM authenticated;
REVOKE SELECT ON animals_with_partnerships FROM authenticated, anon;

-- 5. Dropar view
DROP VIEW IF EXISTS animals_with_partnerships CASCADE;

-- 6. Dropar funções
DROP FUNCTION IF EXISTS can_accept_partnership(UUID, UUID);
DROP FUNCTION IF EXISTS get_profile_animals(UUID);
DROP FUNCTION IF EXISTS count_active_animals_with_partnerships(UUID);
```

---

## 📊 PRÓXIMOS PASSOS

Após aplicar e validar esta migration:

1. ✅ Atualizar `animalService.ts` para usar a nova função de contagem
2. ✅ Refatorar `SocietyPage.tsx` para usar dados reais
3. ✅ Atualizar `HarasPage.tsx` para buscar animais em sociedade
4. ✅ Adicionar quadro societário em `AnimalPage.tsx`
5. ✅ Testar todo o fluxo end-to-end

---

## 📝 OBSERVAÇÕES

- Esta migration **NÃO** altera dados existentes
- Esta migration **NÃO** remove nada
- Esta migration é **SEGURA** para produção
- Esta migration **ADICIONA** funcionalidades sem quebrar existentes

---

**Data de criação:** 04/11/2025  
**Versão:** 046  
**Status:** ✅ Pronto para aplicação  
**Dependências:** Migrations 003, 010, 034, 042

