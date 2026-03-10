# 📰 SISTEMA DE NOTÍCIAS - ESTRUTURA ATUAL

**Data:** 17/11/2025

---

## 🔍 VERIFICAÇÃO SUPABASE

### ✅ **Tabela `articles` JÁ EXISTE**

Criada na migration `004_create_events_and_articles.sql`:

```sql
CREATE TABLE articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  author_id UUID REFERENCES profiles(id),
  category TEXT,
  tags TEXT[] DEFAULT '{}',
  cover_image_url TEXT,
  published_at TIMESTAMP WITH TIME ZONE,
  is_published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### ✅ **RLS Policies Configuradas**

```sql
-- Todos podem ver artigos publicados
CREATE POLICY "Published articles are viewable by everyone" 
ON articles FOR SELECT 
USING (is_published = true);

-- Autores podem ver seus próprios artigos
CREATE POLICY "Authors can view own articles" 
ON articles FOR SELECT 
USING (author_id = auth.uid());

-- Apenas ADMINS podem criar/editar/deletar
CREATE POLICY "Only admins can manage articles" 
ON articles FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);
```

### ✅ **Índices Criados**

- `idx_articles_author_id` - Buscar por autor
- `idx_articles_published_at` - Ordenar por data
- `idx_articles_is_published` - Filtrar publicados
- `idx_articles_category` - Filtrar por categoria

---

## ⚠️ O QUE FALTA IMPLEMENTAR

### 1️⃣ **Adicionar campo `views` na tabela**
Para tracking de visualizações (como os mockArticles tinham)

### 2️⃣ **Criar `newsService.ts`**
Serviço frontend para CRUD de notícias

### 3️⃣ **Atualizar `NewsPage.tsx`**
Buscar dados reais do Supabase ao invés de `mockArticles`

### 4️⃣ **Criar interface Admin**
Página no painel admin para criar/editar notícias

### 5️⃣ **Migrar interface `Article`**
Ajustar tipos TypeScript para match com banco

---

## 🎯 PRÓXIMOS PASSOS

1. Migration para adicionar campo `views`
2. Criar `newsService.ts`
3. Atualizar `NewsPage.tsx` e `ArticlePage.tsx`
4. Criar componente admin de gerenciamento
5. Testar fluxo completo

---

## 🔒 SEGURANÇA

✅ **Apenas ADMIN pode criar notícias**  
✅ RLS policies já configuradas corretamente  
✅ Todos podem ler apenas artigos publicados (`is_published = true`)

