# Relatorio Tecnico Consolidado (sem perda de qualidade) - 2026-02-10

Objetivo: aplicar melhorias de performance sem compressao, redimensionamento ou alteracao
das imagens enviadas pelo usuario, sem quebra funcional nos modais de cadastro de animais
e eventos, e com reversibilidade total das mudancas.

Este relatorio substitui/atualiza o relatorio anterior com foco em ajustes seguros,
progressivos e sem risco de regressao visual ou funcional.

---

## Premissas nao negociaveis

- Nenhuma alteracao no arquivo de imagem: **sem compressao, sem resize, sem conversao**.
- Fluxos atuais intactos: abrir modal, validar, enviar, publicar e feedback visual.
- Mudancas reversiveis: feature flags e rollback simples.
- Sem alteracao de API publica no frontend ou backend.

---

## Ajustes de arquitetura seguros (sem impacto na qualidade)

### A. Uploads sem alteracao de arquivo (baseline)

Manter o arquivo original intacto, com apenas:
- retry com backoff (sem alterar o arquivo).
- paralelismo controlado (sem alterar o arquivo).
- resumable/chunked no transporte (arquivo recomposto identico no destino).

---

## Roteiro tecnico seguro (passo a passo)

Ordem recomendada para reduzir risco e garantir rollback facil:

1) **Instrumentacao e baseline**
   - Adicionar metricas (INP/LCP/Long Tasks/TTI).
   - Medir tempos reais de abertura/submit/upload.
   - Ativar logs por feature flag.
   - Sem alteracoes de fluxo.

2) **Retry seguro e transparente**
   - Inserir retry com backoff no upload de eventos.
   - Manter upload de animais como esta (ja tem retry), apenas garantir que nao haja compressao.
   - Guardar metricas de falha/retry.

3) **Paralelismo controlado**
   - Upload de animais em paralelo com limite pequeno (2).
   - Upload de eventos opcionalmente em paralelo se houver multiplos arquivos (future).
   - Feature flag para rollback imediato.

4) **Resumable/chunked**
   - Introduzir via edge function/worker (upload multipart).
   - Compatibilidade 100%: fallback para upload atual.
   - Sem alteracao de API externa.

5) **RPC transacional (backend)**
   - Criar RPC que insere animal + titulos + status em transacao.
   - Frontend chama RPC, mantendo payloads atuais.
   - Flag para fallback no fluxo antigo.

6) **Autosave offline para eventos**
   - Implementar sessionStorage com debounce (sem mudar UI).
   - Recuperacao silenciosa ao reabrir modal.

---

## Verificacoes de qualidade (por etapa)

### Logs e metricas obrigatorias

- Uploads: tempo total, p95/p99, taxa de retries, erros por tipo.
- Modais: tempo de abertura (click->paint), INP, long tasks.
- Storage: sucesso/falha por tipo de rede.
- DB: latencia do insert e RPC (p95/p99).

### Smoke tests (antes e depois de cada mudança)

- Modal animal: abrir, preencher, subir 1/4 imagens, publicar.
- Modal evento: abrir, preencher, subir capa, publicar.
- Rede lenta: simular 3G e repetir uploads.
- Cancelar modal com dados e validar limpeza.

---

## O que testar em staging antes de producao

1) **Upload de imagens originais**
   - Confirmar checksum e tamanho igual ao arquivo local.

2) **Fluxos de erro controlado**
   - Falha de upload -> retry -> sucesso.
   - Falha permanente -> feedback claro, sem travar UI.

3) **RPC transacional**
   - Criacao de animal com e sem titulos.
   - Rollback total se erro no meio.

4) **Performance de abertura de modal**
   - Medir click->paint em 3G e wifi.

5) **Compatibilidade**
   - Fallback para upload antigo quando resumable falha.

---

## Melhorias consolidadas (com risco e passos seguros)

### 1) Instrumentacao de Web Vitals e Long Tasks

- **Descricao:** coleta de INP/LCP/CLS/TTI e long tasks por modal e rota.
- **Risco de regressao:** Baixo
- **Medidas preventivas:** flag de ativacao; logs somente em prod.
- **Passos seguros:**
  - Adicionar observer e enviar para log/analytics.
  - Validar que nao altera UI.
- **Metricas esperadas:** baseline de INP/LCP/Long Tasks.

### 2) Retry com backoff para upload de eventos

- **Descricao:** implementar retry no upload da capa de eventos.
- **Risco de regressao:** Baixo
- **Medidas preventivas:** limite de tentativas; mensagens claras.
- **Passos seguros:**
  - Aplicar retry com backoff e timeout controlado.
  - Monitorar taxa de sucesso.
- **Metricas esperadas:** menos falhas 5xx/timeout; p95 menor.

### 3) Paralelismo controlado nos uploads de animais

- **Descricao:** subir 2 imagens em paralelo (sem alterar arquivos).
- **Risco de regressao:** Medio
- **Medidas preventivas:** flag; limite pequeno; fallback serial.
- **Passos seguros:**
  - Implementar fila com concorrencia 2.
  - Comparar tempo total com baseline.
- **Metricas esperadas:** reducao de tempo total em 30-45%.

### 4) Resumable/chunked uploads (sem alterar imagem)

- **Descricao:** transporte resiliente com recomposicao identica no storage.
- **Risco de regressao:** Medio
- **Medidas preventivas:** fallback para upload simples; testes em staging.
- **Passos seguros:**
  - Criar endpoint opcional.
  - Feature flag no frontend.
- **Metricas esperadas:** menor falha em rede instavel; melhor p95.

### 5) RPC transacional para publicacao de animal

- **Descricao:** criar RPC unica para insert + titulos + status.
- **Risco de regressao:** Medio
- **Medidas preventivas:** manter fluxo antigo como fallback.
- **Passos seguros:**
  - Criar RPC com rollback.
  - Comparar resultados em staging.
- **Metricas esperadas:** menor inconsistencia, menor numero de round-trips.

### 6) Autosave offline para eventos

- **Descricao:** salvar rascunho no sessionStorage com debounce.
- **Risco de regressao:** Baixo
- **Medidas preventivas:** salvar somente se houver alteracao; limpar no sucesso.
- **Passos seguros:**
  - Implementar autosave silencioso.
  - Restaurar ao abrir modal.
- **Metricas esperadas:** menor perda de dados; menos abandonos.

---

## Garantias de preservacao de qualidade da imagem

Para garantir 100% da qualidade:

- Desativar compressao e redimensionamento no fluxo de upload.
- Validar tamanho/byte-length antes e depois do upload.
- Opcional: checksum MD5 no client e comparar com checksum retornado.

---

## Conclusao

O plano acima permite ganhos de performance com risco minimo e sem qualquer perda de qualidade
de imagem. A implementacao deve seguir o roteiro proposto com flags, rollback rapido e validacao
em staging antes de produção.

