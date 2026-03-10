# ⚡ APLICAR MIGRATION 068 - SLUGS E AGENDAMENTO

**IMPORTANTE:** Execute esta migration no SQL Editor do Supabase **AGORA**.

---

## 📍 Como Aplicar

1. Acesse o **Supabase Dashboard**
2. Vá em **SQL Editor**
3. Clique em **New Query**
4. Copie e cole o conteúdo do arquivo: `supabase_migrations/068_add_articles_slug_and_scheduling.sql`
5. Clique em **Run**

---

## ✅ O que a Migration Faz

1. **Adiciona campo `slug`**
   - URLs amigáveis para SEO
   - Único (constraint)
   - Índice para busca rápida

2. **Adiciona campo `scheduled_publish_at`**
   - Agendamento de publicações
   - Índice para buscar artigos pendentes

3. **Gera slugs para artigos existentes**
   - Converte títulos automaticamente
   - Garante unicidade (adiciona sufixo se necessário)

---

## 🔍 Verificar se Foi Aplicada

Execute no SQL Editor:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'articles' 
AND column_name IN ('slug', 'scheduled_publish_at');
```

**Resultado esperado:**
```
column_name           | data_type
---------------------|--------------------
slug                 | text
scheduled_publish_at | timestamp with time zone
```

---

## 🚨 CRÍTICO

Sem esta migration, o sistema de notícias **NÃO FUNCIONARÁ** corretamente. As funcionalidades de:
- ✅ Slugs automáticos (SEO)
- ✅ Agendamento de publicação
- ✅ URLs amigáveis

...dependem desta migration.

---

## 📂 Localização do Arquivo

```
supabase_migrations/068_add_articles_slug_and_scheduling.sql
```

**APLICAR AGORA! ⚡**



