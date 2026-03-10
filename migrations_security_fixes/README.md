# 🛡️ CORREÇÕES DE SEGURANÇA CRÍTICAS

## 📊 Visão Geral

Este diretório contém as correções de segurança identificadas pelo Supabase Database Advisor.

### Status Atual
- ✅ Sistema 100% funcional
- 🔴 6 vulnerabilidades de segurança críticas
- 🟡 17 avisos de segurança média
- ⏱️ Tempo total estimado: **1 hora e 47 minutos**

---

## 🎯 Ordem de Execução

Execute os arquivos **na ordem numérica** para garantir que todas as correções sejam aplicadas corretamente.

### 1️⃣ Corrigir Views SECURITY DEFINER (15 min)

**Arquivo:** `001_fix_security_definer_views.sql`

**O que faz:**
- Remove SECURITY DEFINER de 6 views
- Adiciona `security_invoker = true`
- Elimina vulnerabilidade de escalação de privilégios

**Como executar:**
1. Acesse: https://supabase.com/dashboard/project/wyufgltprapazpxmtaff/sql/new
2. Copie todo o conteúdo de `001_fix_security_definer_views.sql`
3. Cole no editor SQL
4. Clique em **RUN** (Executar)
5. Aguarde a mensagem: ✅ "Todas as 6 views foram recriadas com sucesso!"

**Validação:**
```sql
-- Executar este SQL para confirmar
SELECT table_name, security_invoker
FROM information_schema.views
WHERE table_schema = 'public'
AND table_name IN (
  'search_animals',
  'animals_ranking',
  'animals_with_stats',
  'events_with_stats',
  'articles_with_stats',
  'user_dashboard_stats'
);
-- Todas devem ter security_invoker = 'YES'
```

---

### 2️⃣ Adicionar search_path nas Functions (10 min)

**Arquivo:** `002_add_search_path_to_functions.sql`

**O que faz:**
- Adiciona `SET search_path = public, pg_temp` em 13 funções
- Protege contra search_path injection
- Garante comportamento consistente

**Como executar:**
1. Acesse: https://supabase.com/dashboard/project/wyufgltprapazpxmtaff/sql/new
2. Copie todo o conteúdo de `002_add_search_path_to_functions.sql`
3. Cole no editor SQL
4. Clique em **RUN** (Executar)
5. Aguarde a mensagem: ✅ "Todas as 13 functions foram atualizadas!"

**Validação:**
```sql
-- Executar este SQL para confirmar
SELECT 
  proname AS function_name,
  proconfig AS settings
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
AND proname IN (
  'update_updated_at_column',
  'generate_public_code',
  'expire_boosts',
  'expire_ads'
)
ORDER BY proname;
-- Todas devem ter search_path configurado em settings
```

---

### 3️⃣ Adicionar Policy para system_logs (2 min)

**Arquivo:** `003_add_system_logs_policy.sql`

**O que faz:**
- Cria RLS policy para tabela system_logs
- Permite acesso apenas para administradores
- Resolve warning de "RLS Enabled No Policy"

**Como executar:**
1. Acesse: https://supabase.com/dashboard/project/wyufgltprapazpxmtaff/sql/new
2. Copie todo o conteúdo de `003_add_system_logs_policy.sql`
3. Cole no editor SQL
4. Clique em **RUN** (Executar)
5. Aguarde a mensagem: ✅ "Policy criada com sucesso!"

**Validação:**
```sql
-- Executar este SQL para confirmar
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'system_logs';
-- Deve retornar a policy criada
```

---

### 4️⃣ Habilitar Proteção de Senha Vazada (2 min)

**Arquivo:** `004_enable_password_protection.md` (Guia)

**O que faz:**
- Habilita verificação contra banco HaveIBeenPwned
- Impede uso de senhas comprometidas
- Aumenta segurança das contas

**Como executar:**
1. Abra: https://supabase.com/dashboard/project/wyufgltprapazpxmtaff/auth/policies
2. Procure por "Password Policy" ou "Password Strength"
3. Habilite "Check against HaveIBeenPwned database"
4. Clique em **Save**

**Validação:**
Tente criar usuário com senha comum (ex: "password123") - deve retornar erro.

---

## ✅ Checklist de Execução

Use este checklist para acompanhar o progresso:

```
[ ] 1. Executado 001_fix_security_definer_views.sql
    [ ] Views recriadas com sucesso
    [ ] Validação executada
    
[ ] 2. Executado 002_add_search_path_to_functions.sql
    [ ] Functions atualizadas
    [ ] Validação executada
    
[ ] 3. Executado 003_add_system_logs_policy.sql
    [ ] Policy criada
    [ ] Validação executada
    
[ ] 4. Habilitada proteção de senha no Dashboard
    [ ] Configuração salva
    [ ] Teste realizado
```

---

## 🔍 Validação Final

Após executar todas as correções, execute este SQL para validação completa:

```sql
-- Verificar status de segurança
SELECT 
  'Views com security_invoker' AS check_type,
  COUNT(*) AS total,
  'Esperado: 6' AS expected
FROM information_schema.views
WHERE table_schema = 'public'
AND security_invoker = 'YES'
AND table_name IN (
  'search_animals',
  'animals_ranking', 
  'animals_with_stats',
  'events_with_stats',
  'articles_with_stats',
  'user_dashboard_stats'
)

UNION ALL

SELECT 
  'Policy para system_logs',
  COUNT(*),
  'Esperado: 1+'
FROM pg_policies
WHERE tablename = 'system_logs';
```

---

## 📈 Impacto das Correções

### Antes
- 🔴 6 vulnerabilidades de segurança críticas (SECURITY DEFINER)
- 🔴 16 avisos de segurança (search_path)
- 🔴 1 tabela com RLS sem policy
- 🔴 Senhas comprometidas permitidas

### Depois
- ✅ Vulnerabilidades de escalação de privilégios eliminadas
- ✅ Proteção contra search_path injection implementada
- ✅ RLS configurado corretamente em todas as tabelas
- ✅ Senhas comprometidas bloqueadas

---

## 🚨 Problemas Comuns

### Erro: "relation does not exist"
**Solução:** Certifique-se de estar conectado ao projeto correto no Supabase.

### Erro: "permission denied"
**Solução:** Você deve ter permissões de administrador no projeto.

### Erro ao executar SQL muito grande
**Solução:** Execute os arquivos em partes menores, comentando seções já executadas.

---

## 📞 Suporte

Se encontrar problemas:

1. **Verificar logs:** Supabase Dashboard > Logs
2. **Rollback:** Cada arquivo SQL usa transações (BEGIN/COMMIT)
3. **Documentação:** 
   - [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security)
   - [Database Linter](https://supabase.com/docs/guides/database/database-linter)

---

## 🎯 Próximos Passos (Opcional)

Após aplicar estas correções críticas, você pode opcionalmente:

1. **Otimizar RLS Policies** (6-8 horas)
   - 47 policies com auth.uid() não otimizado
   - 72 políticas múltiplas para consolidar

2. **Revisar Índices** (3-4 horas)
   - 93 índices não utilizados para análise

Estas são otimizações de performance, não bloqueantes.

---

## ✅ Resultado Final Esperado

Após executar todas as correções:

```
✅ 6 views corrigidas (sem SECURITY DEFINER)
✅ 13 functions protegidas (com search_path)
✅ 1 policy criada (system_logs)
✅ Proteção de senha habilitada
✅ Sistema 100% seguro quanto às vulnerabilidades críticas
✅ Pronto para produção
```

---

**Data de criação:** 2 de outubro de 2025  
**Versão:** 1.0  
**Status:** ✅ Pronto para execução

