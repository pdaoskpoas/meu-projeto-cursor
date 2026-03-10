# 📋 IMPLEMENTAÇÃO DO SISTEMA DE LIMITES E PAGAMENTOS DE EVENTOS

## ✅ O QUE FOI IMPLEMENTADO

### 1. **Migração do Banco de Dados** ✅
**Arquivo:** `supabase_migrations/036_add_event_payment_lifecycle.sql`

**Campos adicionados à tabela `events`:**
- `is_individual_paid` - Indica se o evento foi pago individualmente
- `individual_paid_expires_at` - Data de expiração do pagamento individual
- `paused_at` - Data em que o evento foi pausado
- `auto_renew` - Se deve renovar automaticamente
- `organizer_property` - Nome da propriedade do organizador

**Funções SQL criadas:**
1. `count_active_events(user_id)` - Conta eventos ativos de um usuário
2. `get_event_limit(plan)` - Retorna limite por tipo de plano
3. `can_create_event(user_id)` - Verifica se pode criar evento
4. `process_individual_event_payment()` - Processa pagamento simulado
5. View `user_events_dashboard` - Lista eventos com analytics

**Limites por Plano:**
- **Free**: 0 eventos (precisa pagar individual)
- **Basic (Iniciante)**: 1 evento ativo
- **Pro**: 2 eventos ativos/mês
- **Ultra (Elite)**: 3 eventos ativos/mês
- **VIP**: Ilimitado

### 2. **Serviço de Gerenciamento** ✅
**Arquivo:** `src/services/eventLimitsService.ts`

**Métodos implementados:**
- `checkEventLimit()` - Verifica se usuário pode criar evento
- `simulateIndividualPayment()` - Simula pagamento de R$ 49,90
- `getUserEvents()` - Busca eventos do usuário com analytics
- Fallbacks para quando a migração não foi aplicada

### 3. **Modal de Pagamento/Upgrade** ✅
**Arquivo:** `src/components/events/EventLimitModal.tsx`

**Funcionalidades:**
- Exibe limite atual vs disponível
- Opção 1: Pagar R$ 49,90 por este evento (30 dias)
- Opção 2: Fazer upgrade de plano
- Design responsivo e intuitivo
- Feedback visual claro

---

## 🚀 PRÓXIMAS TAREFAS

### 4. **Integrar com CreateEventModal** 🔴
**O que fazer:**
1. Verificar limite ANTES de abrir o modal
2. Se não puder criar, mostrar `EventLimitModal`
3. Se usuário pagar, salvar evento como rascunho e processar pagamento
4. Após pagamento bem-sucedido, ativar evento

### 5. **Atualizar Página de Eventos do Dashboard** 🔴
**Arquivo:** `src/pages/dashboard/events/EventsPage.tsx`

**Funcionalidades necessárias:**
- Listar eventos do usuário (ativos, pausados, expirados)
- Badge de status (Ativo, Pausado, Expirando em X dias)
- Botões: Editar, Excluir, Turbinar, Renovar
- Indicador se é evento pago individualmente
- Contador de visualizações e cliques
- Filtros por status

### 6. **Sistema de Expiração Automática** 🔴
**O que criar:**
- Edge Function ou cron job para verificar eventos expirados
- Lógica:
  - Evento ativo há 30 dias → Pausar
  - Evento pausado há 7 dias → Excluir (se pago individual)
  - Eventos do plano ativo → Continuar ativos

### 7. **Publicação do Evento** 🔴
**Atualizar:** `CreateEventModal.handleComplete()`
- Salvar dados do evento no Supabase
- Fazer upload da imagem de capa
- Vincular ao organizador
- Definir status inicial (active ou draft se precisar pagar)

---

## 📂 ARQUIVOS CRIADOS

1. ✅ `supabase_migrations/036_add_event_payment_lifecycle.sql`
2. ✅ `src/services/eventLimitsService.ts`
3. ✅ `src/components/events/EventLimitModal.tsx`
4. ✅ `src/components/events/steps/EventDetailsStep.tsx` (adicionado upload de foto)
5. ✅ `src/components/forms/StepWizard.tsx` (corrigido bug de input)

---

## 🔧 COMO APLICAR A MIGRAÇÃO

### Opção 1: Via Supabase Dashboard
1. Acesse: https://supabase.com/dashboard
2. Vá em **SQL Editor**
3. Cole o conteúdo de `supabase_migrations/036_add_event_payment_lifecycle.sql`
4. Execute

### Opção 2: Via CLI (se configurado)
```bash
supabase db push
```

---

## 💡 FLUXO COMPLETO DO SISTEMA

### Cenário 1: Usuário com Plano Ativo e Dentro do Limite
1. Clica em "Criar Evento"
2. Preenche o formulário
3. Clica em "Finalizar"
4. Evento é publicado imediatamente ✅

### Cenário 2: Usuário Atingiu o Limite do Plano
1. Clica em "Criar Evento"
2. Sistema verifica limite → Limite atingido
3. Mostra `EventLimitModal` com opções:
   - **Pagar R$ 49,90** para este evento específico
   - **Fazer upgrade** para aumentar limite mensal
4. Se escolher pagar:
   - Pagamento simulado é processado
   - Transação é registrada no banco
   - Evento é ativado por 30 dias
5. Se escolher upgrade:
   - Redireciona para página de planos

### Cenário 3: Usuário Free (sem plano)
1. Clica em "Criar Evento"
2. Sistema verifica → Sem plano ativo
3. Mostra `EventLimitModal`:
   - Opção única: Pagar R$ 49,90
4. Após pagamento:
   - Evento ativo por 30 dias
   - Não conta em nenhum limite de plano

---

## 🎨 SISTEMA DE STATUS DOS EVENTOS

| Status | Descrição | Ações Disponíveis |
|--------|-----------|-------------------|
| **🟢 Ativo** | Evento publicado e visível | Editar, Turbinar, Pausar |
| **🟡 Expirando** | Faltam menos de 7 dias | Renovar, Editar |
| **⏸️ Pausado** | Expirou mas pode renovar | Renovar, Excluir |
| **🔴 Expirado** | Pausado há mais de 7 dias | Apenas Excluir |
| **📝 Rascunho** | Não publicado | Publicar, Editar, Excluir |

---

## 🔒 SEGURANÇA E VALIDAÇÕES

✅ Todas as funções SQL usam `SECURITY DEFINER`  
✅ Verificação de `organizer_id` em todas as operações  
✅ RLS policies aplicadas (já existentes)  
✅ Transações registradas para auditoria  
✅ Fallbacks implementados caso migração não exista  

---

## 📊 MÉTRICAS E ANALYTICS

Cada evento rastreia:
- **Impressões**: Quantas vezes apareceu na tela
- **Cliques**: Quantas vezes foi clicado
- **CTR**: Taxa de cliques (calculado)
- **Dias restantes**: Tempo até expirar
- **Fonte do tráfego**: De onde vieram os visitantes

---

## 🚨 NOTAS IMPORTANTES

⚠️ **PAGAMENTOS SÃO SIMULADOS** - Não há cobrança real  
⚠️ Status sempre é "completed" automaticamente  
⚠️ Migração precisa ser aplicada manualmente no Supabase  
⚠️ Upload de imagens ainda não implementado (próximo passo)  

---

## 📞 PRÓXIMO SPRINT

**Prioridade Alta:**
1. Integrar verificação de limites no `CreateEventModal`
2. Implementar upload de foto de capa
3. Salvar evento no Supabase ao finalizar
4. Atualizar dashboard de eventos

**Prioridade Média:**
5. Sistema de renovação automática
6. Edge Function para expirar eventos
7. Notificações de eventos expirando

**Prioridade Baixa:**
8. Integração com gateway de pagamento real
9. Sistema de boletos/PIX
10. Histórico de pagamentos completo

---

**Data:** 03/11/2025  
**Status:** ✅ Fundação implementada - Frontend pronto para continuar


