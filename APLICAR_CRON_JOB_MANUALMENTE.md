# 🔧 Como Aplicar o Cron Job Manualmente

**Problema:** Migration 069 deu erro porque tentou remover um job que não existia.

**Solução:** Aplicar SQL corrigido via Dashboard do Supabase.

---

## 📋 Passo a Passo

### 1️⃣ Abrir SQL Editor

1. Acesse: https://app.supabase.com
2. Selecione seu projeto
3. Navegue: **SQL Editor** (no menu lateral)
4. Clique em: **New Query**

---

### 2️⃣ Copiar e Executar SQL

Cole o código abaixo e clique em **RUN**:

```sql
-- =====================================================
-- CRON JOB PARA PUBLICAÇÃO AUTOMÁTICA DE ARTIGOS
-- =====================================================

-- 1. Remover job anterior (se existir)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM cron.job WHERE jobname = 'publish-scheduled-articles'
    ) THEN
        PERFORM cron.unschedule('publish-scheduled-articles');
        RAISE NOTICE '✅ Job anterior removido';
    ELSE
        RAISE NOTICE 'ℹ️ Nenhum job anterior encontrado';
    END IF;
END
$$;

-- 2. Criar função que publica artigos agendados
CREATE OR REPLACE FUNCTION public.publish_scheduled_articles()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  article_record RECORD;
  published_count INTEGER := 0;
BEGIN
  RAISE NOTICE '🔍 Iniciando verificação de artigos agendados...';

  -- Buscar artigos que devem ser publicados
  FOR article_record IN
    SELECT id, title, slug, scheduled_publish_at
    FROM public.articles
    WHERE scheduled_publish_at <= NOW()
      AND is_published = FALSE
      AND scheduled_publish_at IS NOT NULL
  LOOP
    -- Publicar o artigo
    UPDATE public.articles
    SET 
      is_published = TRUE,
      published_at = NOW(),
      scheduled_publish_at = NULL,
      updated_at = NOW()
    WHERE id = article_record.id;

    published_count := published_count + 1;
    RAISE NOTICE '✅ Artigo publicado: % (slug: %)', article_record.title, article_record.slug;
  END LOOP;

  RAISE NOTICE '📊 Total de artigos publicados: %', published_count;
END
$$;

-- 3. Criar o cron job (executa a cada 5 minutos)
SELECT cron.schedule(
  'publish-scheduled-articles',    -- Nome do job
  '*/5 * * * *',                    -- Schedule: a cada 5 minutos
  'SELECT public.publish_scheduled_articles();'  -- Comando
);

-- 4. Verificar se foi criado com sucesso
SELECT 
  jobid,
  jobname, 
  schedule, 
  active,
  command
FROM cron.job 
WHERE jobname = 'publish-scheduled-articles';
```

---

### 3️⃣ Resultado Esperado

Você deve ver algo como:

```
NOTICE: ℹ️ Nenhum job anterior encontrado
NOTICE: ✅ Job anterior removido (se existia)

Query resultado:
jobid | jobname                      | schedule      | active | command
------|------------------------------|---------------|--------|--------
3     | publish-scheduled-articles   | */5 * * * *   | true   | SELECT public.publish_scheduled_articles();
```

✅ **Job criado com sucesso!**

---

## 🧪 Testar a Função

### Teste Manual

Execute no SQL Editor:

```sql
-- Chamar a função manualmente para testar
SELECT public.publish_scheduled_articles();

-- Você verá logs no output:
-- NOTICE: 🔍 Iniciando verificação de artigos agendados...
-- NOTICE: 📊 Total de artigos publicados: 0
```

### Teste com Artigo Agendado

```sql
-- 1. Criar um artigo agendado para daqui 1 minuto
INSERT INTO public.articles (
  title,
  slug,
  content,
  excerpt,
  category,
  author_id,
  is_published,
  scheduled_publish_at
) VALUES (
  'Teste de Agendamento',
  'teste-agendamento',
  '<p>Conteúdo de teste</p>',
  'Testando publicação automática',
  'Tecnologia',
  (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1),
  FALSE,
  NOW() + INTERVAL '1 minute'
);

-- 2. Aguardar 5-10 minutos

-- 3. Verificar se foi publicado automaticamente
SELECT 
  title,
  is_published,
  scheduled_publish_at,
  published_at
FROM public.articles
WHERE slug = 'teste-agendamento';

-- Esperado:
-- is_published: TRUE ✅
-- scheduled_publish_at: NULL ✅
-- published_at: (timestamp recente) ✅
```

---

## 📊 Monitoramento

### Ver Status do Job

```sql
SELECT 
  jobid,
  jobname,
  schedule,
  active,
  database,
  username
FROM cron.job
WHERE jobname = 'publish-scheduled-articles';
```

### Ver Histórico de Execuções

```sql
SELECT 
  runid,
  status,
  return_message,
  start_time,
  end_time,
  end_time - start_time as duracao
FROM cron.job_run_details
WHERE jobid = (
  SELECT jobid FROM cron.job WHERE jobname = 'publish-scheduled-articles'
)
ORDER BY start_time DESC
LIMIT 10;
```

### Ver Próxima Execução

```sql
SELECT 
  jobname,
  schedule,
  -- O cron roda a cada 5 minutos, próxima execução será em até 5 min
  NOW() as agora,
  NOW() + INTERVAL '5 minutes' as proxima_possivel
FROM cron.job
WHERE jobname = 'publish-scheduled-articles';
```

---

## 🔧 Troubleshooting

### Problema: Job não aparece

**Solução:**
```sql
-- Verificar se pg_cron está habilitado
SELECT * FROM pg_extension WHERE extname = 'pg_cron';

-- Se não retornar nada, habilitar:
CREATE EXTENSION IF NOT EXISTS pg_cron;
```

### Problema: Job não executa

**Solução:**
```sql
-- Verificar se está ativo
SELECT jobname, active FROM cron.job WHERE jobname = 'publish-scheduled-articles';

-- Se active = false, ativar:
SELECT cron.alter_job(
  (SELECT jobid FROM cron.job WHERE jobname = 'publish-scheduled-articles'),
  active => true
);
```

### Problema: Erro na função

**Solução:**
```sql
-- Testar manualmente para ver o erro
SELECT public.publish_scheduled_articles();

-- Ver logs completos no Dashboard:
-- Logs > Postgres Logs
```

---

## 🗑️ Remover Job (se necessário)

```sql
-- Remover o cron job
SELECT cron.unschedule('publish-scheduled-articles');

-- Remover a função
DROP FUNCTION IF EXISTS public.publish_scheduled_articles();
```

---

## ✅ Checklist Final

- [ ] SQL executado sem erros
- [ ] Job aparece na tabela `cron.job`
- [ ] Função `publish_scheduled_articles()` existe
- [ ] Teste manual funciona
- [ ] Teste com artigo agendado funciona (aguardar 5-10 min)

---

## 📝 Observações

- O job roda **a cada 5 minutos** automaticamente
- Não precisa de Edge Function (mais simples e confiável)
- Logs aparecem no Dashboard > Logs > Postgres Logs
- Artigos são publicados quando `scheduled_publish_at <= NOW()`

**BOA SORTE!** 🚀



