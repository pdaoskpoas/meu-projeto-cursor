# 🚀 Instruções de Deploy - Sistema 10/10

**Data:** 23/11/2025  
**Versão:** 2.0

---

## 📋 Pré-requisitos

- [x] Node.js 18+ instalado
- [x] Projeto Supabase criado
- [x] Supabase CLI instalado (opcional, mas recomendado)
- [x] Git configurado

---

## 🔧 Passo a Passo Completo

### 1️⃣ Instalar Dependências

```bash
cd cavalaria-digital-showcase-main
npm install
```

**Dependências instaladas:**
- react-helmet-async (Meta tags SEO)
- TipTap (Editor WYSIWYG)
- @tanstack/react-query (Cache otimizado)
- vitest + testing-library (Testes)

---

### 2️⃣ Configurar Variáveis de Ambiente

Criar arquivo `.env` na raiz:

```env
# Supabase
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key

# Opcional
VITE_APP_NAME=Cavalaria Digital
VITE_APP_URL=https://seusite.com
```

**Onde encontrar as keys:**
- Dashboard Supabase > Settings > API
- URL do projeto
- anon/public key

---

### 3️⃣ Aplicar Migrations no Banco

#### Opção A: Via SQL Editor (Recomendado)

1. Abra: https://app.supabase.com
2. Navegue: Project > SQL Editor
3. Cole e execute cada migration:

**Migration 068 - Slugs e Agendamento:**
```sql
-- Copiar todo conteúdo de:
-- supabase_migrations/068_add_articles_slug_and_scheduling.sql

-- Executar
```

**Migration 069 - Cron Job:**
```sql
-- Copiar todo conteúdo de:
-- supabase_migrations/069_configure_cron_job.sql

-- Executar
```

#### Opção B: Via CLI

```bash
supabase link --project-ref seu-projeto-ref
supabase db push
```

---

### 4️⃣ Configurar Variáveis do Banco

No SQL Editor, executar:

```sql
-- Substituir pelos seus valores reais
ALTER DATABASE postgres 
SET app.settings.supabase_url = 'https://seu-projeto.supabase.co';

ALTER DATABASE postgres 
SET app.settings.service_role_key = 'eyJ...sua-service-role-key';
```

**⚠️ IMPORTANTE:** Use a **SERVICE_ROLE_KEY**, não a anon key!

**Onde encontrar:**
- Dashboard > Settings > API > service_role key (mostrar)

---

### 5️⃣ Deploy da Edge Function

#### Opção A: Via CLI (Recomendado)

```bash
# Login
supabase login

# Link ao projeto
supabase link --project-ref seu-projeto-ref

# Deploy
supabase functions deploy publish-scheduled-articles
```

#### Opção B: Via Dashboard

1. Navegue: Functions > Create a new function
2. Nome: `publish-scheduled-articles`
3. Cole o código de: `supabase/functions/publish-scheduled-articles/index.ts`
4. Deploy

---

### 6️⃣ Verificar Cron Job

No SQL Editor:

```sql
-- Verificar se o job foi criado
SELECT * FROM cron.job WHERE jobname = 'publish-scheduled-articles';

-- Deve retornar algo como:
-- jobname: publish-scheduled-articles
-- schedule: */5 * * * *
-- active: true
```

**Se não aparecer:**
```sql
-- Recriar manualmente
SELECT cron.schedule(
  'publish-scheduled-articles',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/publish-scheduled-articles',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
```

---

### 7️⃣ Rodar Aplicação Localmente

```bash
npm run dev
```

Abrir: http://localhost:5173

**Testar:**
1. Login como admin
2. Ir para "Dicas e Notícias"
3. Criar novo artigo
4. Verificar slug automático
5. Testar editor WYSIWYG
6. Publicar

---

### 8️⃣ Rodar Testes

```bash
# Testes básicos
npm test

# Interface visual
npm run test:ui

# Com coverage
npm run test:coverage
```

**Esperado:**
```
✓ src/utils/__tests__/slugify.test.ts (6)
✓ src/services/__tests__/newsService.test.ts (3)
✓ src/components/admin/news/__tests__/ArticleForm.test.tsx (4)

Test Files  3 passed (3)
Tests  13 passed (13)
```

---

### 9️⃣ Build de Produção

```bash
npm run build
```

**Output esperado:**
```
✓ 542 modules transformed.
dist/index.html                   0.XX kB
dist/assets/index-XXXXX.css      XX.XX kB
dist/assets/index-XXXXX.js      XXX.XX kB
✓ built in XXs
```

---

### 🔟 Deploy do Frontend

#### Vercel (Recomendado)

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel

# Seguir instruções
```

**Configurar variáveis de ambiente:**
- Vercel Dashboard > Project > Settings > Environment Variables
- Adicionar `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`

#### Netlify

```bash
# Instalar Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod

# Build command: npm run build
# Publish directory: dist
```

#### Supabase Hosting (Beta)

```bash
supabase storage upload --recursive dist/*
```

---

## ✅ Checklist de Validação

Após deploy, verificar:

### Backend
- [ ] Migration 068 aplicada (campo `slug` existe em `articles`)
- [ ] Migration 069 aplicada (cron job criado)
- [ ] Edge Function deployada e acessível
- [ ] Variáveis de ambiente configuradas
- [ ] Cron job executando (verificar logs após 5 min)

### Frontend
- [ ] Build sem erros
- [ ] Site acessível
- [ ] Login funcionando
- [ ] Criar artigo funciona
- [ ] Slug é gerado automaticamente
- [ ] Editor WYSIWYG carrega corretamente
- [ ] Publicar artigo funciona
- [ ] URLs usam slugs (/noticias/slug-do-artigo)

### SEO
- [ ] Meta tags aparecem no código-fonte
- [ ] Open Graph preview funciona (teste em debug do Facebook)
- [ ] Twitter Card preview funciona
- [ ] Canonical URL correto

### Performance
- [ ] Lighthouse score > 90
- [ ] Cache funcionando (abrir artigo 2x = instantâneo)
- [ ] Imagens lazy loading

### Testes
- [ ] Todos os testes passam (`npm test`)
- [ ] Coverage > 60%

---

## 🧪 Testar Publicação Agendada

### Teste End-to-End:

```sql
-- 1. Criar artigo agendado para daqui 2 minutos
INSERT INTO articles (
  title, 
  slug, 
  content, 
  excerpt,
  category,
  author_id,
  is_published,
  scheduled_publish_at
) VALUES (
  'Artigo Teste Agendado',
  'artigo-teste-agendado',
  '<p>Conteúdo do teste</p>',
  'Testando agendamento',
  'Tecnologia',
  (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1),
  false,
  NOW() + INTERVAL '2 minutes'
);

-- 2. Aguardar 5-10 minutos

-- 3. Verificar se foi publicado
SELECT 
  title, 
  is_published, 
  scheduled_publish_at, 
  published_at 
FROM articles 
WHERE slug = 'artigo-teste-agendado';

-- Esperado:
-- is_published: true
-- scheduled_publish_at: null
-- published_at: (timestamp recente)
```

---

## 🔍 Monitoramento

### Ver logs da Edge Function:
```bash
# Via CLI
supabase functions logs publish-scheduled-articles --tail

# Ou via Dashboard
# Functions > publish-scheduled-articles > Logs
```

### Ver execuções do Cron:
```sql
SELECT * 
FROM cron.job_run_details 
WHERE jobid = (
  SELECT jobid 
  FROM cron.job 
  WHERE jobname = 'publish-scheduled-articles'
)
ORDER BY start_time DESC 
LIMIT 10;
```

### Ver próximas execuções:
```sql
SELECT 
  jobname, 
  schedule, 
  active,
  timezone('America/Sao_Paulo', timezone('UTC', next_run_time)) as proxima_execucao
FROM cron.job 
WHERE jobname = 'publish-scheduled-articles';
```

---

## 🐛 Troubleshooting

### Problema: Cron job não executa

**Solução:**
```sql
-- Verificar se pg_cron está habilitado
SELECT * FROM pg_extension WHERE extname = 'pg_cron';

-- Se não estiver, habilitar:
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Recriar job
SELECT cron.unschedule('publish-scheduled-articles');
-- (recriar conforme passo 6)
```

### Problema: Edge Function retorna 500

**Solução:**
1. Verificar logs: `supabase functions logs`
2. Conferir variáveis de ambiente no banco
3. Testar service_role_key manualmente

### Problema: Meta tags não aparecem

**Solução:**
1. Verificar se `HelmetProvider` está envolvendo o App
2. Inspecionar código-fonte da página (não inspetor)
3. Testar com Facebook Debugger: https://developers.facebook.com/tools/debug/

### Problema: Editor WYSIWYG não carrega

**Solução:**
```bash
# Reinstalar TipTap
npm uninstall @tiptap/react @tiptap/starter-kit
npm install @tiptap/react @tiptap/starter-kit
npm install @tiptap/extension-link @tiptap/extension-image @tiptap/extension-placeholder
```

### Problema: Testes falham

**Solução:**
```bash
# Limpar cache
rm -rf node_modules
rm package-lock.json
npm install

# Rodar novamente
npm test
```

---

## 📊 Métricas Esperadas

Após deploy completo:

| Métrica | Target | Como Medir |
|---------|--------|------------|
| **Lighthouse Performance** | >90 | DevTools > Lighthouse |
| **Lighthouse SEO** | >95 | DevTools > Lighthouse |
| **Lighthouse Accessibility** | >95 | DevTools > Lighthouse |
| **First Contentful Paint** | <1.5s | DevTools > Performance |
| **Time to Interactive** | <3.0s | DevTools > Performance |
| **Test Coverage** | >60% | `npm run test:coverage` |

---

## 🎉 Conclusão

Se todos os passos acima foram executados com sucesso:

✅ Sistema está em **PRODUÇÃO**  
✅ Publicação agendada automática funcionando  
✅ SEO otimizado com meta tags  
✅ Performance máxima com cache  
✅ Editor profissional  
✅ Testes passando  
✅ Acessibilidade 100%

**Sistema 10/10 no ar!** 🚀

---

## 📞 Suporte

Se algo não funcionar:

1. Verificar logs do Supabase
2. Verificar console do navegador
3. Revisar checklist de validação
4. Consultar `IMPLEMENTACAO_COMPLETA_10_EM_10.md`

**BOA SORTE!** 🍀



