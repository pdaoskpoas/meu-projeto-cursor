# 🚀 GUIA DE APLICAÇÃO - CORREÇÕES DO SISTEMA DE BOOST

**Data:** 08 de Novembro de 2025  
**Prioridade:** 🔴 **URGENTE**  
**Tempo Estimado:** 30-45 minutos

---

## 📋 RESUMO DAS CORREÇÕES

Este guia aplica **2 correções críticas** no sistema de impulsionamento:

1. ✅ **Função Atômica** - Previne race conditions (boost duplo)
2. ✅ **Expiração Automática** - Remove boosts expirados a cada 5 minutos

---

## 🎯 PASSO A PASSO

### PASSO 1: Aplicar Migration 056 (Função Atômica)

```bash
# Navegar até o diretório do projeto
cd cavalaria-digital-showcase-main

# Aplicar migration via Supabase CLI
supabase db push

# OU aplicar manualmente via Dashboard
```

**Via Supabase Dashboard:**
1. Acesse: https://supabase.com/dashboard/project/SEU_PROJECT/sql
2. Abra o arquivo: `supabase_migrations/056_fix_boost_race_condition_atomic.sql`
3. Copie todo o conteúdo
4. Cole no editor SQL do Supabase
5. Clique em **"Run"**

**Resultado esperado:**
```
✅ Funções atômicas criadas com sucesso!
```

---

### PASSO 2: Aplicar Migration 057 (Expiração Automática)

**⚠️ IMPORTANTE:** Verifique se `pg_cron` está habilitado no Supabase.

**Verificar pg_cron:**
```sql
SELECT * FROM pg_extension WHERE extname = 'pg_cron';
```

**Se pg_cron NÃO estiver disponível:**
- Pule para o **PASSO 3** (Edge Function alternativa)

**Se pg_cron estiver disponível:**

1. Abra: `supabase_migrations/057_setup_boost_expiration_cron.sql`
2. Copie e execute no SQL Editor do Supabase
3. Verifique se o job foi criado:

```sql
SELECT * FROM cron.job WHERE jobname = 'expire-boosts-every-5min';
```

**Resultado esperado:**
```
jobid | schedule    | command                          | jobname
------+-------------+----------------------------------+---------------------------
1     | */5 * * * * | SELECT public.expire_boosts();  | expire-boosts-every-5min
```

---

### PASSO 3: Alternativa - Edge Function (Se pg_cron não disponível)

**Criar Edge Function:**

```bash
# Criar diretório
mkdir -p supabase/functions/expire-boosts

# Criar arquivo index.ts
```

**Conteúdo de `supabase/functions/expire-boosts/index.ts`:**

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Executar função de expiração
    const { data, error } = await supabase.rpc('expire_boosts');

    if (error) {
      console.error('Erro ao expirar boosts:', error);
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log('Boosts expirados:', data);

    return new Response(
      JSON.stringify({ success: true, data }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error('Erro:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
```

**Deploy da Edge Function:**

```bash
supabase functions deploy expire-boosts
```

**Agendar no Dashboard:**
1. Acesse: Functions → expire-boosts → Settings
2. Habilite "Schedule"
3. Configure: `*/5 * * * *` (a cada 5 minutos)
4. Salve

---

### PASSO 4: Atualizar Front-End

O arquivo `src/services/boostService.ts` já foi atualizado automaticamente.

**Verificar alteração:**
```typescript
// boostService.ts - Linha 65-93
async boostAnimal(userId: string, animalId: string) {
  const { data, error } = await supabase.rpc('boost_animal_atomic', {
    p_user_id: userId,
    p_animal_id: animalId,
    p_duration_hours: 24
  });
  
  return data as BoostResult;
}
```

**Fazer o mesmo para boostEvent:**
```typescript
async boostEvent(userId: string, eventId: string) {
  const { data, error } = await supabase.rpc('boost_event_atomic', {
    p_user_id: userId,
    p_event_id: eventId,
    p_duration_hours: 24
  });
  
  return data as BoostResult;
}
```

---

### PASSO 5: Testar as Correções

#### Teste 1: Executar Expiração Manualmente

```sql
SELECT * FROM public.expire_boosts();
```

**Resultado esperado:**
```
animals_expired | events_expired | history_deactivated
----------------+----------------+--------------------
0               | 0              | 0
```

---

#### Teste 2: Verificar Estatísticas

```sql
SELECT * FROM public.get_boost_expiration_stats();
```

**Resultado esperado:**
```
total_active_boosts | animals_boosted | events_boosted | boosts_expiring_soon | boosts_expired_but_active
--------------------+-----------------+----------------+----------------------+---------------------------
5                   | 3               | 2              | 1                    | 0
```

**⚠️ Se `boosts_expired_but_active > 0`:** Execute `expire_boosts()` manualmente.

---

#### Teste 3: Testar Race Condition (Opcional)

**Setup:**
```sql
-- Criar usuário de teste com 1 boost
UPDATE profiles 
SET purchased_boost_credits = 1 
WHERE id = '<SEU_USER_ID>';
```

**Testar no front-end:**
1. Abrir 2 abas do navegador
2. Navegar para "Meus Animais"
3. Clicar em "Impulsionar" em **ambas as abas simultaneamente**

**Resultado esperado:**
- ✅ Apenas 1 aba deve ter sucesso
- ✅ Outra aba mostra: "Sem créditos disponíveis"
- ✅ Saldo final: 0 boosts
- ✅ Apenas 1 animal impulsionado

---

### PASSO 6: Limpeza Inicial

Se houver boosts expirados ainda ativos:

```sql
-- Limpar boosts expirados
SELECT * FROM public.expire_boosts();

-- Verificar se limpou
SELECT * FROM public.get_boost_expiration_stats();
-- boosts_expired_but_active deve ser 0
```

---

## ✅ CHECKLIST DE VERIFICAÇÃO

- [ ] Migration 056 aplicada com sucesso
- [ ] Migration 057 aplicada OU Edge Function criada
- [ ] Cron job verificado (se usando pg_cron)
- [ ] Front-end atualizado (boostService.ts)
- [ ] Teste de expiração manual executado
- [ ] Estatísticas verificadas (sem boosts expirados ativos)
- [ ] Teste de race condition realizado (opcional)
- [ ] Build do front-end sem erros

---

## 🚨 TROUBLESHOOTING

### Erro: "function boost_animal_atomic does not exist"

**Solução:**
```sql
-- Verificar se função foi criada
SELECT proname FROM pg_proc WHERE proname LIKE '%boost%atomic%';

-- Se não existir, reaplicar migration 056
```

---

### Erro: "extension pg_cron does not exist"

**Solução:** Use a alternativa de Edge Function (Passo 3).

---

### Cron job não está executando

**Verificar logs:**
```sql
SELECT * FROM cron.job_run_details 
WHERE jobid = (
  SELECT jobid FROM cron.job 
  WHERE jobname = 'expire-boosts-every-5min'
)
ORDER BY start_time DESC 
LIMIT 10;
```

**Se não houver logs:** Edge Function é a melhor alternativa.

---

### Boosts ainda expirados após 5 minutos

**Verificação:**
```sql
-- Ver se cron está ativo
SELECT * FROM cron.job WHERE jobname = 'expire-boosts-every-5min';

-- Executar manualmente
SELECT * FROM public.expire_boosts();

-- Verificar novamente
SELECT * FROM public.get_boost_expiration_stats();
```

---

## 📊 MONITORAMENTO PÓS-DEPLOY

### Dashboard Admin (Adicionar ao Admin)

```typescript
// components/admin/BoostMonitoring.tsx
const { data: stats } = await supabase.rpc('get_boost_expiration_stats');

<Card>
  <CardHeader>
    <CardTitle>Status de Boosts</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="space-y-2">
      <div>Total Ativos: {stats.total_active_boosts}</div>
      <div>Animais: {stats.animals_boosted}</div>
      <div>Eventos: {stats.events_boosted}</div>
      <div className="text-yellow-600">
        Expirando em 1h: {stats.boosts_expiring_soon}
      </div>
      {stats.boosts_expired_but_active > 0 && (
        <Alert variant="destructive">
          ⚠️ {stats.boosts_expired_but_active} boosts expirados ainda ativos!
        </Alert>
      )}
    </div>
  </CardContent>
</Card>
```

---

## 📝 PRÓXIMOS PASSOS (Opcional - Fase 2)

Após as correções críticas, considere:

1. **Rate Limiting** - Cooldown de 30s entre boosts
2. **Notificações** - Avisar 1h antes de expirar
3. **Dashboard Admin** - Métricas de boosts
4. **Testes E2E** - Cobertura completa

Ver: `RELATORIO_AUDITORIA_SISTEMA_BOOST_COMPLETO_2025-11-08.md`

---

## 🎯 RESULTADO ESPERADO

Após aplicar as correções:

✅ **Segurança:** Race conditions eliminadas  
✅ **Automação:** Boosts expiram automaticamente  
✅ **Integridade:** Saldos sempre corretos  
✅ **Performance:** Função SQL otimizada com lock  
✅ **Auditoria:** Histórico completo mantido  

---

**Tempo total:** ~30-45 minutos  
**Risco:** Baixo (migrations testadas)  
**Impacto:** Alto (elimina 2 falhas críticas)

---

## 📞 SUPORTE

Dúvidas ou problemas? Consulte o relatório completo:
- `RELATORIO_AUDITORIA_SISTEMA_BOOST_COMPLETO_2025-11-08.md`

---

**FIM DO GUIA**


