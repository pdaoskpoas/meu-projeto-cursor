# 🚀 APLICAR MIGRATION 065 - INSTRUÇÕES RÁPIDAS

## ✅ VERSÃO CORRIGIDA SEM ERROS DE SINTAXE

---

## 📋 PRÉ-REQUISITOS

- [ ] Backup do banco de dados realizado
- [ ] Acesso ao Supabase Dashboard
- [ ] Ambiente de desenvolvimento (não produção, recomendado)

---

## 🎯 PASSO A PASSO

### 1. Abrir Supabase SQL Editor

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **SQL Editor** (menu lateral esquerdo)
4. Clique em **New Query**

---

### 2. Copiar e Executar a Migration

**Arquivo:** `supabase_migrations/065_animal_share_code_system_FIXED.sql`

**Ação:**
1. Abra o arquivo `065_animal_share_code_system_FIXED.sql`
2. **Copie TODO o conteúdo** (Ctrl+A, Ctrl+C)
3. **Cole no SQL Editor** do Supabase (Ctrl+V)
4. Clique em **Run** (ou pressione Ctrl+Enter)

---

### 3. Aguardar Execução

⏱️ **Tempo estimado:**
- Poucos animais (< 100): ~10-30 segundos
- Muitos animais (100-1000): ~1-3 minutos
- Milhares de animais (1000+): ~5-10 minutos

**Você verá logs como:**
```
NOTICE:  Coluna share_code adicionada à tabela animals
NOTICE:  Índice idx_animals_share_code criado
NOTICE:  Encontrados 15 animais sem código, gerando...
NOTICE:  Total de 15 códigos gerados com sucesso
NOTICE:  Validação OK: 15 animais, todos com código único
...
NOTICE:  ===========================================
NOTICE:  MIGRATION 065 CONCLUÍDA COM SUCESSO!
NOTICE:  ===========================================
```

---

### 4. Verificar Sucesso

Execute estas queries de validação:

```sql
-- 1. Verificar se todos os animais têm código
SELECT COUNT(*) as total, 
       COUNT(share_code) as com_codigo
FROM animals;
-- Deve retornar números iguais

-- 2. Verificar formato dos códigos
SELECT share_code 
FROM animals 
LIMIT 5;
-- Deve retornar códigos como: ANI-A3F8C9-25

-- 3. Verificar se não há duplicações
SELECT share_code, COUNT(*) 
FROM animals 
GROUP BY share_code 
HAVING COUNT(*) > 1;
-- Deve retornar 0 linhas (vazio)

-- 4. Verificar tabela animal_partnerships
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'animal_partnerships'
ORDER BY column_name;
-- Deve incluir: joined_at, added_by
-- NÃO deve incluir: status, partner_public_code

-- 5. Testar geração de código
SELECT generate_animal_share_code();
-- Deve retornar um código único
```

---

## ✅ RESULTADO ESPERADO

Se tudo correr bem, você verá no final:

```
NOTICE:  ESTATÍSTICAS FINAIS:
NOTICE:    - Animais processados: XX
NOTICE:    - Códigos gerados: XX
NOTICE:    - Códigos duplicados: 0
NOTICE:    - Sociedades ativas: XX

NOTICE:  ALTERAÇÕES APLICADAS:
NOTICE:    - Campo share_code adicionado
NOTICE:    - Trigger automático criado
NOTICE:    - Tabela animal_partnerships simplificada
NOTICE:    - 3 funções SQL atualizadas
NOTICE:    - 1 função SQL removida
NOTICE:    - View animals_with_partnerships atualizada
NOTICE:    - Sistema de notificações adaptado
NOTICE:    - Políticas RLS ajustadas
```

E a resposta final: **`Success. No rows returned`**

---

## 🚨 POSSÍVEIS ERROS E SOLUÇÕES

### Erro: "função create_notification não encontrada"

**Causa:** Migration 042 (notificações) não foi aplicada ainda.

**Solução:** A migration já está preparada para lidar com isso! Ela verifica se a função existe antes de usá-la. Você pode ignorar este aviso.

Se quiser aplicar o sistema de notificações depois:
```sql
-- Verificar se função existe
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name = 'create_notification';
```

---

### Erro: "coluna share_code já existe"

**Causa:** Migration foi executada parcialmente antes.

**Solução:** **TUDO OK!** A migration verifica isso e pula automaticamente:
```
NOTICE:  Coluna share_code já existe, pulando...
```

---

### Erro: "duplicate key value violates unique constraint"

**Causa:** Códigos duplicados foram gerados (extremamente raro).

**Solução:**
```sql
-- Regenerar códigos duplicados
UPDATE animals
SET share_code = generate_animal_share_code()
WHERE id IN (
  SELECT id FROM animals
  WHERE share_code IN (
    SELECT share_code FROM animals
    GROUP BY share_code HAVING COUNT(*) > 1
  )
);
```

---

### Erro: "timeout" ou "statement timeout"

**Causa:** Muitos animais (> 10.000) podem causar timeout.

**Solução:** Executar em lotes menores. Abra o arquivo SQL e execute seção por seção (cada comentário `-- PASSO X`).

---

## 🔄 CASO PRECISE REVERTER (ROLLBACK)

**⚠️ IMPORTANTE:** Só faça isso se algo deu MUITO errado!

```sql
-- ROLLBACK COMPLETO (use com cuidado!)
BEGIN;

-- Remover coluna share_code
ALTER TABLE animals DROP COLUMN IF EXISTS share_code CASCADE;

-- Restaurar colunas antigas em animal_partnerships
ALTER TABLE animal_partnerships 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'accepted',
ADD COLUMN IF NOT EXISTS partner_public_code TEXT;

-- Remover novas colunas
ALTER TABLE animal_partnerships 
DROP COLUMN IF EXISTS joined_at,
DROP COLUMN IF EXISTS added_by;

-- Remover funções
DROP FUNCTION IF EXISTS generate_animal_share_code();
DROP FUNCTION IF EXISTS set_animal_share_code();
DROP TRIGGER IF EXISTS trigger_set_animal_share_code ON animals;

COMMIT;
```

**DEPOIS DE ROLLBACK:** Restaure backup do banco de dados!

---

## 📊 PRÓXIMOS PASSOS (APÓS MIGRATION)

Depois que a migration for aplicada com sucesso:

1. ✅ **Testar criação de novo animal**
   ```sql
   -- Deve gerar código automaticamente
   INSERT INTO animals (name, breed, gender, birth_date, owner_id)
   VALUES ('Teste', 'Mangalarga', 'Macho', '2020-01-01', 'USER_ID_AQUI')
   RETURNING share_code;
   ```

2. ✅ **Atualizar Service Layer** (TypeScript)
   - Seguir guia: `GUIA_IMPLEMENTACAO_CODIGO_EXCLUSIVO_PASSO_A_PASSO.md`
   - Seção: **FASE 2: SERVICE LAYER**

3. ✅ **Atualizar Frontend** (React)
   - Seguir guia: `GUIA_IMPLEMENTACAO_CODIGO_EXCLUSIVO_PASSO_A_PASSO.md`
   - Seção: **FASE 3: FRONTEND**

---

## 📞 SUPORTE

Se encontrar problemas:

1. **Copie a mensagem de erro completa**
2. **Copie os logs do SQL Editor**
3. **Tire screenshot do erro**
4. **Verifique os arquivos:**
   - `RELATORIO_AUDITORIA_SOCIEDADES_PROFISSIONAL_2025-11-17.md`
   - `GUIA_IMPLEMENTACAO_CODIGO_EXCLUSIVO_PASSO_A_PASSO.md`

---

## ✨ DIFERENÇAS DA VERSÃO CORRIGIDA

**ANTES (version com erro):**
```sql
RAISE NOTICE '🚀 Iniciando Migration 065...';  -- ❌ ERRO: fora de bloco
```

**DEPOIS (version corrigida):**
```sql
DO $$
BEGIN
    RAISE NOTICE 'Iniciando Migration 065...';  -- ✅ OK: dentro de bloco
END $$;
```

**Outras melhorias:**
- ✅ Verifica se colunas já existem antes de criar (evita erros)
- ✅ Verifica se índices já existem (evita duplicação)
- ✅ Verifica se função `create_notification` existe (não quebra se não tiver)
- ✅ Idempotente (pode executar múltiplas vezes sem erro)
- ✅ Logs informativos em português

---

## 🎉 CONCLUSÃO

Após aplicar esta migration com sucesso, você terá:

- ✅ Todos os animais com código exclusivo (ex: `ANI-R3L4MP4-25`)
- ✅ Sistema de código automático (novos animais ganham código)
- ✅ Tabela `animal_partnerships` simplificada (sem `status`)
- ✅ Funções SQL atualizadas
- ✅ Base preparada para novo sistema de sociedades

**Tempo total:** ~5-15 minutos (dependendo do número de animais)

---

**Criado por:** Engenheiro Sênior  
**Data:** 17/11/2025  
**Versão:** 2.0 (CORRIGIDA)  
**Arquivo:** `065_animal_share_code_system_FIXED.sql`

---

**BOA SORTE! 🚀**

