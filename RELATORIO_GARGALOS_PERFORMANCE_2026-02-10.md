# Relatorio de Gargalos de Performance - 2026-02-10

Este relatorio foi gerado com base em revisao estatica do codigo e configuracoes locais do projeto.
Nao houve execucao de testes de carga, coleta de traces ou captura de HAR. Onde necessario, indico
os pontos de instrumentacao recomendados para obter evidencias reais (INP, LCP, TTI, long tasks,
p95/p99 e latencias de API).

## Escopo

- Frontend (modais de cadastro de animais e cadastro de eventos).
- Servicos e integracoes com Supabase (DB/Storage/RPC).
- Uploads e processamento de midia.
- Observabilidade e monitoramento.

## Metodologia resumida

- Revisao de fluxo dos modais e servicos relacionados.
- Mapeamento de chamadas a Supabase e storage.
- Identificacao de pontos de bloqueio no thread principal, e potenciais leaks.
- Verificacao de ausencia de instrumentacao para Web Vitals e long tasks.

---

## Findings (gargalos e pontos de contencao)

### 1) Falta de instrumentacao de Web Vitals e Long Tasks

- **URL/endpoint:** N/A (global)
- **Componente:** app geral; modais de cadastro
- **Viewport/navegador:** N/A
- **Descricao tecnica:** nao ha coleta de INP/FID, LCP, TTI, Long Tasks nem timings de abertura/submit dos modais. Sem isso, nao e possivel provar "100% fluidez" ou detectar regressao automaticamente.
- **Evidencias:** nao ha uso de `web-vitals` nem `PerformanceObserver` no frontend.
- **Severidade:** Alto
- **Repro:** N/A
- **Correcoes (priorizadas):**
  - **Rapida:** adicionar `web-vitals` e `PerformanceObserver` para `longtask`, `layout-shift`, `paint`.
  - **Estrutural:** enviar metricas a um backend (Sentry/OTel/GA4) com tags por rota/modal.

### 2) Upload de imagens sequencial, sem chunking/resumable e sem paralelismo

- **URL/endpoint:** Supabase Storage `animal-images`
- **Componente:** Modal Cadastro de Animais (`StepReview`, `uploadMultiplePhotos`)
- **Descricao tecnica:** uploads sao sequenciais com retry e timeout por imagem. Isso aumenta o tempo total e piora UX em 3G. Sem chunking/resumable, qualquer falha reinicia do zero.
- **Evidencias:** fluxo de upload sequencial e retry no utilitario de upload.
- **Severidade:** Alto
- **Repro:** selecionar 4 imagens grandes e submeter em rede lenta.
- **Correcoes (priorizadas):**
  - **Rapida:** paralelizar uploads com limite de concorrencia (ex: 2 em paralelo).
  - **Estrutural:** usar upload resumable/chunked (TUS ou multipart) com retry por chunk.

### 3) Validacao e upload do evento sem retry, progresso ou cancelamento

- **URL/endpoint:** `events` (insert/update) e Storage `events`
- **Componente:** `CreateEventModal`
- **Descricao tecnica:** upload da capa ocorre antes do pagamento; nao ha retry automatico, nem cancelamento ou resumable. Erros de upload sao engolidos, podendo resultar em evento sem imagem sem feedback claro.
- **Evidencias:** `CreateEventModal` faz upload simples e continua mesmo com erro.
- **Severidade:** Medio
- **Repro:** subir imagem grande em rede instavel.
- **Correcoes (priorizadas):**
  - **Rapida:** adicionar retry exponencial e indicador de progresso.
  - **Estrutural:** upload resumable + fila/worker para processamento de imagem.

### 4) Operacoes sequenciais e sem transacao em publicacao de animal

- **URL/endpoint:** `animals` insert, `animal_titles` insert, Storage `animal-images`, `animals` update
- **Componente:** `StepReview` (publicacao do animal)
- **Descricao tecnica:** fluxo realiza varias operacoes sequenciais sem transacao. Em falhas parciais, fica estado inconsistente (animal criado, titulos falham, imagens falham).
- **Evidencias:** sequencia de chamadas e tratamento parcial de erros.
- **Severidade:** Alto
- **Repro:** simular falha no upload apos criar animal.
- **Correcoes (priorizadas):**
  - **Rapida:** RPC unica no backend para create + titulos + status (transacao).
  - **Estrutural:** pipeline assincraono para uploads com fila e compensacao.

### 5) Verificacao de saude e sessao adicionam round-trips extras

- **URL/endpoint:** `HEAD /rest/v1/`, `supabase.auth.getSession()`, `refreshSession()`
- **Componente:** `StepReview` (publicacao)
- **Descricao tecnica:** antes de publicar, faz checagem de saude e sessao com timeouts. Em redes lentas, isso adiciona latencia extra perceptivel.
- **Evidencias:** chamadas de healthcheck e session check.
- **Severidade:** Medio
- **Repro:** publicar em 3G com latencia alta.
- **Correcoes (priorizadas):**
  - **Rapida:** mover healthcheck para background e usar o resultado apenas para alerta (nao bloquear).
  - **Estrutural:** reduzir round-trips com RPC consolidada e retry inteligente.

### 6) Falta de rascunho offline para eventos

- **URL/endpoint:** N/A
- **Componente:** `CreateEventModal`
- **Descricao tecnica:** nao ha persistencia local do progresso do evento. Em perda de conexao, o usuario perde dados. Para animais existe rascunho (sessionStorage).
- **Evidencias:** ausencia de autosave em eventos.
- **Severidade:** Medio
- **Repro:** preencher modal, perder conexao e recarregar.
- **Correcoes (priorizadas):**
  - **Rapida:** salvar rascunho em sessionStorage com debounce.
  - **Estrutural:** sincronizacao offline-first com fila de reenvio.

### 7) Filtro de eventos e re-render com listas grandes sem memoizacao

- **URL/endpoint:** N/A
- **Componente:** `EventsPage`
- **Descricao tecnica:** filtros usam `toLowerCase()` e `filter` a cada render. Em listas grandes, pode gerar jank.
- **Evidencias:** filtro direto na renderizacao.
- **Severidade:** Baixo
- **Repro:** usuario com centenas de eventos.
- **Correcoes (priorizadas):**
  - **Rapida:** `useMemo` para `filteredEvents` e `debounce` no search.
  - **Estrutural:** paginação/virtualizacao.

### 8) Previews de imagens sem descarte ao fechar modal (corrigido)

- **URL/endpoint:** N/A
- **Componente:** `NewAnimalWizard` e `EventDetailsStep`
- **Descricao tecnica:** object URLs podem acumular memoria se nao forem revogados ao fechar modal.
- **Evidencias:** criacao de previews no frontend.
- **Severidade:** Medio
- **Correcoes (priorizadas):**
  - **Rapida:** revogar `blob:` no fechamento do modal e ao trocar a imagem (aplicado).

---

## Checklist de instrumentacao obrigatoria (para evidencias reais)

- Web Vitals: INP, LCP, CLS e TTFB, com tags por rota e modal.
- PerformanceObserver para `longtask` e `layout-shift`.
- Timelines especificas:
  - **Modal Animal:** clique -> render visivel -> validacao -> upload -> resposta API.
  - **Modal Evento:** clique -> render -> validacao -> upload -> pagamento -> persistencia.
- Traces de rede (p50/p95/p99) por endpoint Supabase.
- Logging estruturado de erros e timeouts com correlacao por request.

---

## Melhorias recomendadas (priorizadas)

1. **Instrumentacao de metricas e traces** (INP/LCP/Long Tasks + p95/p99).
2. **Uploads resumable/chunked** para imagens (animais e eventos).
3. **RPC/Transacao unica** no backend para publicar animal e criar titulos.
4. **Autosave para eventos** com retry offline e rascunho local.
5. **Debounce e memoizacao** em listas e filtros.
6. **Fila assincraona** para processamento de midia com workers.

---

## Observacoes finais

Este relatorio aponta os gargalos mais provaveis observados no codigo. Para garantir fluidez
comparavel a Mercado Livre, OLX e Webmotors, e indispensavel medir Web Vitals e executar testes
de carga/latencia reais (3G/wifi) com coleta de evidencias (HAR/trace/log/SQL).
