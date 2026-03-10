# Plano de Execucao Seguro de Performance - 2026-02-10

Baseado no relatorio consolidado sem perda de qualidade. Este plano e incremental,
reversivel e focado em estabilidade funcional e visual.

---

## 1) Tarefas por prioridade

### Alta prioridade (bloqueiam o resto)

1. **Instrumentacao de Web Vitals e Long Tasks**
   - **Descricao:** coletar INP/LCP/CLS/TTI e long tasks por rota/modal.
   - **Impacto esperado:** baseline real para comparar melhorias.
   - **Dependencias:** nenhuma.
   - **Paralelo:** pode rodar junto com logs de upload.

2. **Logs estruturados de uploads (animais/eventos)**
   - **Descricao:** registrar tempos, retries, falhas, tamanho de arquivo e checksum.
   - **Impacto esperado:** diagnostico real de latencia e falhas.
   - **Dependencias:** nenhuma.
   - **Paralelo:** sim, junto com instrumentacao.

3. **Retry com backoff no upload de eventos**
   - **Descricao:** adicionar retry no upload da capa de eventos.
   - **Impacto esperado:** reduzir falhas em rede instavel.
   - **Dependencias:** logs para acompanhar taxa de falhas.

### Media prioridade

4. **Paralelismo controlado nos uploads de animais**
   - **Descricao:** subir imagens em paralelo (concorrencia 2).
   - **Impacto esperado:** reduzir tempo total de upload.
   - **Dependencias:** instrumentacao + logs ativos.
   - **Paralelo:** pode comecar em staging enquanto retry de eventos segue em prod.

5. **Autosave offline para eventos**
   - **Descricao:** salvar rascunho com debounce em sessionStorage.
   - **Impacto esperado:** reduzir perda de dados, sem alterar UI.
   - **Dependencias:** nenhuma.

### Baixa prioridade (mas recomendadas)

6. **Resumable/chunked uploads com fallback**
   - **Descricao:** endpoint opcional para upload multipart.
   - **Impacto esperado:** reduzir falhas em rede ruim.
   - **Dependencias:** logs, feature flag, staging completo.

7. **RPC transacional para publicacao de animais**
   - **Descricao:** uma RPC para insert + titulos + status.
   - **Impacto esperado:** reduzir inconsistencias e round-trips.
   - **Dependencias:** validacao de payloads e rollback no banco.

---

## 2) O que pode rodar em paralelo vs. dependencias

- **Em paralelo:**
  - Instrumentacao de Web Vitals + logs estruturados.
  - Autosave offline para eventos.
  - Preparacao de RPC em branch (sem ativar).

- **Depende de testes previos:**
  - Paralelismo de uploads (precisa baseline).
  - Resumable/chunked (precisa fallback validado).
  - RPC transacional (precisa teste de rollback no DB).

---

## 3) Checkpoints de validacao e rollback

Para cada etapa:

- **Checkpoint de validacao:**
  - Medir p95/p99 de upload.
  - Confirmar que INP/LCP/Long Tasks nao pioraram.
  - Garantir integridade do arquivo (checksum).

- **Rollback claro:**
  - Feature flag OFF no frontend.
  - Fallback para fluxo anterior.
  - Reversao de migration/funcao RPC se necessario.

---

## 4) Instrumentacao e monitoramento

### Metricas obrigatorias

- Web Vitals: INP, LCP, CLS, TTFB.
- Long Tasks: > 50ms.
- Uploads: p50/p95/p99, retries, falhas, tempo total.
- DB: latencia RPC e inserts.

### Formato de log recomendado (JSON)

```json
{
  "type": "upload",
  "context": "animal|event",
  "fileName": "image.jpg",
  "sizeBytes": 3241234,
  "durationMs": 2431,
  "retries": 1,
  "success": true,
  "network": "3g",
  "timestamp": 1739200000000
}
```

### Painel sugerido

- Grafico p95/p99 por endpoint.
- Grafico de tempo medio de upload.
- Alertas: INP > 200ms, LCP > 2.5s, falhas upload > 2%.

---

## 5) Snippets seguros (React + Supabase)

### 5.1 Upload paralelo limitado (concorrencia 2)

```ts
async function uploadInBatches(files: File[], limit = 2) {
  const queue = [...files];
  const results: string[] = [];
  const workers = Array.from({ length: limit }, async () => {
    while (queue.length) {
      const file = queue.shift();
      if (!file) return;
      const url = await uploadWithRetry(file);
      results.push(url);
    }
  });
  await Promise.all(workers);
  return results;
}
```

### 5.2 Retry com backoff exponencial

```ts
async function withRetry<T>(fn: () => Promise<T>, retries = 3, base = 1000) {
  let lastError: unknown;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt === retries) break;
      await new Promise(r => setTimeout(r, base * Math.pow(2, attempt - 1)));
    }
  }
  throw lastError;
}
```

### 5.3 Upload resumable/chunked com fallback

```ts
async function uploadResumableOrFallback(file: File) {
  try {
    return await uploadResumable(file); // novo endpoint
  } catch {
    return await uploadSimple(file); // fallback atual
  }
}
```

### 5.4 RPC transacional (exemplo de chamada)

```ts
const { data, error } = await supabase.rpc('create_animal_tx', {
  animal_payload: animalData,
  titles_payload: titlesData
});
if (error) throw error;
```

### 5.5 Autosave offline (sessionStorage + debounce)

```ts
const saveDraft = debounce((data) => {
  sessionStorage.setItem('eventDraft', JSON.stringify(data));
}, 500);
```

---

## 6) Criterios de sucesso por etapa

- **Instrumentacao:** 100% das rotas com INP/LCP/CLS coletados.
- **Retry upload eventos:** falhas criticas < 1%.
- **Paralelismo:** tempo total de upload -30% (p95).
- **Resumable:** queda de erros de upload em 3G > 50%.
- **RPC transacional:** 0 inconsistencias em staging.
- **Autosave:** 0 perda de dados em quedas de conexao.

---

## 7) Checklist final antes do deploy

- Logs confirmam integridade dos arquivos (checksum ok).
- p95/p99 de upload dentro da meta.
- INP < 100ms, LCP < 2.5s.
- Sem regressao visual nos modais.
- Rollback testado (flag OFF).
- Staging validado com 3G e wifi.

---

## 8) Rollback exato (por melhoria)

- **Retry/paralelismo:** desativar feature flag.
- **Resumable:** fallback automatico e desativar endpoint.
- **RPC:** voltar para fluxo anterior no frontend; desativar function no DB.
- **Autosave:** remover leitura/gravar no sessionStorage.

