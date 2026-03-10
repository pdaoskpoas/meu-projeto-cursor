# 📅 Sistema de Cotas Mensais para Eventos

**Data de Implementação:** 24/11/2025  
**Status:** ✅ Implementado (aguardando aplicação da migration)

---

## 🎯 Regras de Negócio

### 1. Cotas Mensais por Plano

| Plano | Publicações/Mês | Cumulativo? | Reset |
|-------|-----------------|-------------|-------|
| **Free** | 0 | - | - |
| **Iniciante (Basic)** | 0 | - | - |
| **Pro** | 1 | ❌ NÃO | Dia 1 do mês |
| **Elite (Ultra)** | 2 | ❌ NÃO | Dia 1 do mês |
| **VIP** | 0 | - | - |

> **IMPORTANTE:** Diferente dos animais (que permitem deletar e substituir), as publicações de eventos **NÃO SÃO RECUPERÁVEIS**. Se o usuário deletar um evento, ele perde a publicação do mês.

### 2. Limite de Eventos Ativos

- **TODOS os planos:** Máximo de **1 evento ativo** por vez
- Para publicar outro evento, o usuário deve:
  - Deletar o evento atual OU
  - Pagar R$ 49,99 pela publicação individual

### 3. Publicação Individual

- **Valor:** R$ 49,99
- **Duração:** 30 dias
- **NÃO conta** na cota mensal do plano
- Pode ser usado por qualquer plano

### 4. Edição de Eventos

- **Prazo:** 24 horas após a publicação
- Após 24h, o evento **não pode mais ser editado**
- Aplica-se tanto para eventos do plano quanto individuais pagos

---

## 📊 Exemplos de Cenários

### Cenário 1: Usuário Pro publica evento
```
✅ Publicou evento A (cota do plano) - Restam 0 publicações este mês
❌ Tenta publicar evento B - Bloqueado (já tem 1 ativo)
💡 Opções:
   - Deletar evento A e perder a cota
   - Pagar R$ 49,99 para publicar evento B individualmente
```

### Cenário 2: Usuário Elite usa cota completa
```
✅ Dia 05: Publicou evento A (cota 1/2)
✅ Dia 10: Deletou evento A
✅ Dia 15: Publicou evento B (cota 2/2) 
❌ Dia 20: Tenta publicar evento C - Bloqueado (cota esgotada)
💡 Opções:
   - Aguardar reset no dia 1° do próximo mês
   - Pagar R$ 49,99 individual
```

### Cenário 3: Usuário Free ou Basic
```
❌ Tenta publicar evento - Bloqueado (plano não inclui eventos)
💡 Opções:
   - Fazer upgrade para Pro/Elite
   - Pagar R$ 49,99 individual
```

### Cenário 4: Edição após 24h
```
✅ Dia 10 10:00 - Publicou evento
✅ Dia 11 09:00 - Pode editar (ainda dentro de 24h)
❌ Dia 11 11:00 - NÃO pode editar (passou 24h)
```

---

## 🗄️ Estrutura do Banco de Dados

### Novos Campos em `profiles`
```sql
event_publications_used_this_month INT DEFAULT 0
event_publications_reset_at TIMESTAMPTZ DEFAULT DATE_TRUNC('month', NOW()) + INTERVAL '1 month'
```

### Novo Campo em `events`
```sql
can_edit_until TIMESTAMPTZ  -- Data limite para edição (24h após publicação)
```

### Funções Principais

#### `get_event_monthly_quota(user_plan TEXT)`
Retorna a cota mensal do plano (Pro=1, Elite=2, outros=0)

#### `can_create_event(user_id UUID)`
Verifica todas as regras:
- Limite de 1 evento ativo
- Cota mensal disponível
- Plano ativo

#### `process_individual_event_payment(p_user_id UUID, p_event_id UUID)`
Processa pagamento individual de R$ 49,99

#### `reset_monthly_event_publications()`
Reseta contadores no dia 1 de cada mês (via CRON job)

---

## 🚀 Como Aplicar a Migration

### Passo 1: Aplicar SQL

Copie e execute o conteúdo do arquivo:
```
supabase_migrations/073_event_monthly_quota_system.sql
```

No **Supabase Dashboard > SQL Editor**

### Passo 2: Configurar CRON Job

**Manualmente via Dashboard:**
1. Acesse: Database > Cron Jobs
2. Crie novo job:
   - Nome: `reset-monthly-event-publications`
   - Schedule: `5 0 1 * *` (todo dia 1 às 00:05)
   - Comando: `SELECT reset_monthly_event_publications();`

**Ou via SQL Editor:**
```sql
SELECT cron.schedule(
  'reset-monthly-event-publications',
  '5 0 1 * *',
  'SELECT reset_monthly_event_publications();'
);
```

---

## 🔧 Arquivos Modificados

### Backend (Supabase)
- ✅ `supabase_migrations/073_event_monthly_quota_system.sql`

### Frontend (React)
- ✅ `src/services/eventLimitsService.ts`
  - Atualizado interface `EventLimitCheck`
  - Adicionado método `canEditEvent()`
  - Atualizado `checkEventLimitFallback()`
  - Adicionado `getMonthlyQuota()`

- ✅ `src/components/events/EventLimitModal.tsx`
  - Atualizado títulos para novos motivos de bloqueio
  - Estatísticas de cotas mensais (usado/total/restante)

- ⏳ `src/components/events/CreateEventModal.tsx`
  - Precisa adicionar validação de 24h para edição

---

## ⚠️ Diferenças vs Sistema de Animais

| Aspecto | Animais | Eventos |
|---------|---------|---------|
| **Limite** | 10/15/25 ativos simultâneos | 1 ativo por vez |
| **Recuperável?** | ✅ Sim (pode deletar e substituir) | ❌ Não (perde a cota) |
| **Contagem** | Animais ativos simultaneamente | Publicações usadas no mês |
| **Reset** | Não há reset | Todo dia 1 do mês |
| **Cumulativo** | Não se aplica | ❌ Não acumula |

---

## ✅ Status de Implementação

- [x] Migration SQL criada e corrigida
- [x] Funções RPC implementadas
- [x] Trigger de incremento automático
- [x] Service layer atualizado
- [x] Modal de limites atualizado
- [ ] Modal de criação precisa validar edição 24h
- [ ] Testes de integração
- [ ] Documentação do usuário

---

## 📝 Próximos Passos

1. **URGENTE:** Aplicar migration SQL via Dashboard
2. Configurar CRON job para reset mensal
3. Atualizar `CreateEventModal` com validação de 24h
4. Testar todos os cenários de uso
5. Monitorar logs do CRON job no primeiro reset

---

## 🐛 Troubleshooting

### Erro: "Cota esgotada" mas ainda não usei
```sql
-- Resetar manualmente:
UPDATE profiles 
SET event_publications_used_this_month = 0
WHERE id = 'SEU_USER_ID';
```

### Erro: "Não posso editar" mas foi publicado hoje
```sql
-- Verificar prazo:
SELECT id, title, published_at, can_edit_until, 
       NOW() - published_at as tempo_desde_publicacao
FROM events 
WHERE organizer_id = 'SEU_USER_ID';

-- Estender prazo (apenas para debug):
UPDATE events 
SET can_edit_until = NOW() + INTERVAL '24 hours'
WHERE id = 'EVENT_ID';
```

### Ver status das cotas
```sql
SELECT 
  p.id,
  p.name,
  p.plan,
  p.event_publications_used_this_month as usado,
  get_event_monthly_quota(p.plan) as cota,
  p.event_publications_reset_at as reset_em
FROM profiles p
WHERE p.id = 'SEU_USER_ID';
```

---

## 📞 Suporte

Para dúvidas ou problemas:
1. Verificar logs do Supabase Dashboard
2. Executar queries de troubleshooting acima
3. Revisar este documento

---

**Desenvolvido com 💙 pela Cavalaria Digital**


