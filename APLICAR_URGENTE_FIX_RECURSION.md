# ⚠️ CORREÇÃO URGENTE - Recursão Infinita em RLS Policy

## 🔴 Problema Identificado

**Erro**: `infinite recursion detected in policy for relation "animals"`

**Causa**: A migration `046_part5_policies.sql` criou uma **segunda policy de SELECT** na tabela `animals`, causando recursão infinita quando combinada com a policy original `animals_select_unified`.

**Impacto**:
- ❌ Dashboard não carrega estatísticas
- ❌ Página de Estatísticas não funciona
- ❌ Queries para `animals` retornam erro 500
- ❌ Mensagens não carregam

---

## ✅ Solução

Aplicar a migration `047_fix_partnership_policy_recursion.sql` que:
1. Remove a policy duplicada
2. Atualiza a policy original para incluir sociedades

---

## 🚀 Como Aplicar

### Opção 1: Via Supabase Dashboard (RECOMENDADO)

1. Abrir **Supabase Dashboard**
2. Ir em **SQL Editor**
3. Colar o conteúdo de `supabase_migrations/047_fix_partnership_policy_recursion.sql`
4. Executar

### Opção 2: Via MCP (se disponível)

```sql
-- Copiar e executar via MCP
```

---

## 📋 Checklist Pós-Aplicação

Após aplicar a migration, verificar:

- [ ] Dashboard carrega sem erros
- [ ] Estatísticas exibem corretamente
- [ ] Meus Animais carrega
- [ ] Mensagens funcionam
- [ ] Animais públicos aparecem na busca
- [ ] Animais em sociedade aparecem para sócios

---

## 🔍 Verificação

Execute este comando no SQL Editor para confirmar que há apenas UMA policy de SELECT:

```sql
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'animals' AND cmd = 'SELECT';
```

**Resultado Esperado**: Apenas 1 linha:
- `animals_select_unified` | `SELECT`

---

## 📝 Lições Aprendidas

**Erro Cometido**: Criar policy adicional de SELECT em vez de modificar a existente.

**Correção Futura**: Sempre verificar policies existentes antes de criar novas:

```sql
-- Verificar policies existentes
SELECT * FROM pg_policies WHERE tablename = 'NOME_TABELA';

-- Se já existir policy de SELECT, fazer DROP + CREATE
-- Se não existir, pode criar nova
```

---

## 🛠️ Arquivo de Correção

**Arquivo**: `supabase_migrations/047_fix_partnership_policy_recursion.sql`

**Conteúdo**:
- ✅ Remove policy duplicada
- ✅ Atualiza policy original com lógica de sociedades
- ✅ Mantém todas as permissões (admin, dono, público, sócios)

---

## ⚡ Status

- ✅ Problema identificado
- ✅ Solução criada
- ⏳ **AGUARDANDO APLICAÇÃO PELO USUÁRIO**
- ⏳ Testes pós-correção

---

**APLIQUE AGORA** para restaurar o funcionamento do sistema!

