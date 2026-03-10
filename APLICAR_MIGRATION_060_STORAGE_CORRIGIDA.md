# 🚀 APLICAR MIGRATION 060 - SISTEMA DE STORAGE (CORRIGIDA)

**Status:** ✅ CORRIGIDA - Pronta para aplicar  
**Data:** 2024-11-14  
**Correção:** `created_by` → `organizer_id` nas políticas de eventos

---

## ⚡ APLICAÇÃO RÁPIDA (5 MINUTOS)

### Passo 1: Abrir Supabase Dashboard
1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **SQL Editor** (menu lateral esquerdo)

### Passo 2: Executar Migration
1. Clique em **"+ New query"**
2. Abra o arquivo: `supabase_migrations/060_complete_storage_infrastructure.sql`
3. **Copie TODO o conteúdo** (Ctrl+A, Ctrl+C)
4. **Cole** no SQL Editor (Ctrl+V)
5. Clique em **"Run"** (ou pressione Ctrl+Enter)

### Passo 3: Aguardar Execução
⏱️ **Tempo esperado:** 2-3 segundos

**✅ Resultado esperado:**
```
Success. 0 rows returned
```

---

## ✅ VERIFICAÇÃO

Execute estas queries para confirmar:

### 1. Verificar Buckets Criados
```sql
SELECT name, public, file_size_limit 
FROM storage.buckets 
ORDER BY name;
```

**Resultado esperado: 4 buckets**
```
animal-images  | true | 10485760
avatars        | true | 5242880
event-images   | true | 15728640
sponsor-logos  | true | 3145728
```

### 2. Verificar Políticas RLS
```sql
SELECT COUNT(*), bucket_id
FROM (
  SELECT DISTINCT policyname,
    CASE 
      WHEN policyname LIKE '%animais%' OR policyname LIKE '%animal%' THEN 'animal-images'
      WHEN policyname LIKE '%avatar%' THEN 'avatars'
      WHEN policyname LIKE '%evento%' THEN 'event-images'
      WHEN policyname LIKE '%patrocinador%' OR policyname LIKE '%sponsor%' THEN 'sponsor-logos'
    END as bucket_id
  FROM pg_policies
  WHERE schemaname = 'storage'
) as policies
WHERE bucket_id IS NOT NULL
GROUP BY bucket_id
ORDER BY bucket_id;
```

**Resultado esperado:**
```
animal-images  : 4 políticas
avatars        : 4 políticas
event-images   : 4 políticas
sponsor-logos  : 4 políticas
```

### 3. Verificar Tabela Sponsors
```sql
SELECT 
  column_name, 
  data_type 
FROM information_schema.columns 
WHERE table_name = 'sponsors'
ORDER BY ordinal_position;
```

**Se retornar linhas** = ✅ Tabela criada!

### 4. Verificar View
```sql
SELECT COUNT(*) FROM active_sponsors;
```

**Se retornar 0** = ✅ View funcionando!

---

## 🔧 O QUE FOI CORRIGIDO

### ❌ PROBLEMA
```sql
-- ERRADO: events não tem coluna "created_by"
WHERE created_by = auth.uid()
```

### ✅ SOLUÇÃO
```sql
-- CORRETO: events tem coluna "organizer_id"
WHERE organizer_id = auth.uid()
```

---

## 📊 O QUE A MIGRATION FAZ

### 1. Cria 3 Novos Buckets
- ✅ `avatars` (5MB limite)
- ✅ `event-images` (15MB limite)
- ✅ `sponsor-logos` (3MB limite)

### 2. Atualiza Bucket Existente
- ✅ `animal-images` (10MB limite + MIME types)

### 3. Remove Políticas Duplicadas
- ✅ Limpa 4 políticas antigas redundantes

### 4. Cria Políticas RLS Otimizadas
- ✅ 4 políticas para cada bucket (16 total)
- ✅ Segurança por contexto

### 5. Cria Tabela de Patrocinadores
- ✅ Tabela `sponsors` completa
- ✅ Suporte a agendamento de campanhas
- ✅ Analytics integrado

### 6. Cria View e Funções
- ✅ View `active_sponsors`
- ✅ Função `increment_sponsor_impression()`
- ✅ Função `increment_sponsor_click()`

---

## ⚠️ TROUBLESHOOTING

### Erro: "bucket 'avatars' already exists"
**Causa:** Bucket já foi criado antes  
**Solução:** ✅ É seguro ignorar, a migration usa `ON CONFLICT`

### Erro: "relation 'sponsors' already exists"
**Causa:** Tabela já foi criada antes  
**Solução:** ✅ É seguro ignorar, a migration usa `IF NOT EXISTS`

### Erro: "policy already exists"
**Causa:** Política já foi criada antes  
**Solução:** Execute este comando para limpar e tentar novamente:
```sql
-- Deletar políticas antigas
DROP POLICY IF EXISTS "Organizadores podem fazer upload de imagens de eventos" ON storage.objects;
DROP POLICY IF EXISTS "Organizadores podem atualizar imagens de eventos" ON storage.objects;
DROP POLICY IF EXISTS "Organizadores podem deletar imagens de eventos" ON storage.objects;
```

---

## 🎯 PRÓXIMOS PASSOS

Após aplicar esta migration:

### 1. Instalar Dependência
```bash
npm install compressorjs
```

### 2. Testar Sistema
Siga o guia: `GUIA_IMPLEMENTACAO_SISTEMA_IMAGENS_COMPLETO.md`

---

## 📝 RESUMO

**O QUE FAZER AGORA:**
1. ✅ Copiar conteúdo de `060_complete_storage_infrastructure.sql`
2. ✅ Colar no Supabase SQL Editor
3. ✅ Executar (Run)
4. ✅ Verificar resultados (queries acima)
5. ✅ Instalar compressorjs
6. ✅ Me avisar do resultado!

---

**Status:** 🟢 Pronto para aplicar  
**Risco:** 🟢 Baixo (migration segura com ON CONFLICT)  
**Tempo:** ⏱️ 5 minutos

**APLIQUE AGORA E ME AVISE!** 🚀








