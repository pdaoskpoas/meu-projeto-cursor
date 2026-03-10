# Guia de Testes - Sistema de Sociedades

## ✅ Implementações Concluídas

### 1. **Backend (Migration 046)**
- ✅ Funções SQL para contagem de animais ativos com sociedades
- ✅ Função para verificar se animal deve estar ativo (owner OU partner com plano ativo)
- ✅ Função para determinar destinatário de mensagens (owner → partner ativo → owner)
- ✅ View `animals_with_partnerships` com dados completos
- ✅ Trigger para notificações ao aceitar convite
- ✅ RLS policies para visualização de animais em sociedade
- ✅ Limite de 10 sócios por animal

### 2. **Service Layer**
- ✅ `partnershipService.ts` com todos métodos CRUD
- ✅ Enviar convite com validações (auto-convite, limite 10 sócios)
- ✅ Aceitar/Rejeitar convite
- ✅ **NOVO**: Método `leavePartnership()` - sócio pode sair da sociedade
- ✅ Listar sociedades (recebidas e enviadas)
- ✅ Buscar animais considerando sociedades
- ✅ Flag `has_active_partnerships` em animais próprios

### 3. **Frontend - SocietyPage**
- ✅ Listagem de convites recebidos e enviados
- ✅ Aceitar/Rejeitar convites
- ✅ **NOVO**: Botão "Deixar Sociedade" para sociedades aceitas
- ✅ Confirmação antes de sair da sociedade
- ✅ Enviar novos convites com validação
- ✅ Estatísticas em tempo real

### 4. **Frontend - AnimalPage**
- ✅ Quadro Societário exibindo sócios com plano ativo
- ✅ **PRIVACIDADE**: Percentual visível APENAS para dono/sócios
- ✅ Visitantes veem apenas "Animal em regime de sociedade"
- ✅ Links para perfis dos sócios
- ✅ Badge "Plano Ativo" para cada sócio

### 5. **Frontend - Meus Animais (AnimalsPage)**
- ✅ Integração com `getUserAnimalsWithPartnerships()`
- ✅ Badge "Sócio" para animais onde sou sócio
- ✅ Badge "Sociedade" para animais próprios com sócios
- ✅ Indicador de percentual de participação
- ✅ Animais de sociedade contam no limite do plano

### 6. **Frontend - HarasPage**
- ✅ Busca animais usando `get_profile_animals()`
- ✅ Exibe animais próprios + sociedades ativas

### 7. **Frontend - AnimalCard Component**
- ✅ Prop `hasPartnership` opcional
- ✅ Badge "Sociedade" no canto superior direito

---

## 🧪 Roteiro de Testes

### **Teste 1: Enviar Convite de Sociedade**

**Cenário**: Usuário A (plano ativo) envia convite para Usuário B

1. Login como **Usuário A** (com plano ativo)
2. Ir em **Dashboard → Sociedades**
3. Clicar em **"Adicionar Sociedade"**
4. Selecionar animal próprio
5. Inserir código público do **Usuário B**
6. Definir percentual (ex: 30%)
7. Enviar convite

**Resultado Esperado**:
- ✅ Convite criado com sucesso
- ✅ Aparece em "Convites Enviados" do Usuário A
- ✅ **Usuário B** recebe notificação
- ✅ Convite aparece em "Convites Recebidos" do Usuário B

---

### **Teste 2: Aceitar Convite**

**Cenário**: Usuário B aceita convite do Usuário A

1. Login como **Usuário B**
2. Ir em **Dashboard → Sociedades**
3. Ver convite pendente em "Convites Recebidos"
4. Clicar em **"Aceitar"**

**Resultado Esperado**:
- ✅ Convite muda status para "Aceito"
- ✅ Animal aparece em **"Meus Animais"** do Usuário B com badge "Sócio"
- ✅ Mostra percentual (ex: "30% de participação")
- ✅ Conta **1 animal** no limite do plano do Usuário B
- ✅ **Usuário A** recebe notificação de aceitação

---

### **Teste 3: Visualização Pública do Animal**

**Cenário**: Visitante acessa página do animal em sociedade

1. Abrir página do animal (ex: `/animal/[id]`) **sem login**

**Resultado Esperado**:
- ✅ Exibe **Quadro Societário**
- ✅ Mostra nome/haras dos sócios com plano ativo
- ✅ **NÃO** mostra percentual de participação
- ✅ Mostra apenas texto: *"Animal em regime de sociedade"*

---

### **Teste 4: Visualização como Sócio/Dono**

**Cenário**: Usuário A ou B (sócios) acessam página do animal

1. Login como **Usuário A** (dono) ou **Usuário B** (sócio)
2. Acessar página do animal

**Resultado Esperado**:
- ✅ Exibe **Quadro Societário**
- ✅ **MOSTRA** percentual de cada sócio (ex: "30% participação")
- ✅ Exibe badge "Plano Ativo" para cada sócio

---

### **Teste 5: Deixar Sociedade**

**Cenário**: Usuário B (sócio) decide sair da sociedade

1. Login como **Usuário B**
2. Ir em **Dashboard → Sociedades**
3. Localizar sociedade aceita
4. Clicar em **"Deixar Sociedade"**
5. Confirmar ação no popup

**Resultado Esperado**:
- ✅ Sociedade é removida
- ✅ Animal **desaparece** de "Meus Animais" do Usuário B
- ✅ Libera **1 vaga** no limite de animais do Usuário B
- ✅ Usuário B **não aparece mais** no Quadro Societário

---

### **Teste 6: Plano FREE - Ocultar Sócio**

**Cenário**: Usuário B tem plano ativo, depois muda para FREE

1. Login como **Usuário B** (sócio com plano ativo)
2. ⚠️ **Simular mudança de plano para FREE**:
   - Via admin Supabase: `profiles.plan = 'free'`
3. Acessar perfil público do **Usuário A** (dono do animal)

**Resultado Esperado**:
- ✅ Animal **NÃO aparece** no perfil do Usuário B
- ✅ Usuário B **NÃO aparece** no Quadro Societário
- ✅ Animal **continua ativo** no perfil do Usuário A (dono)
- ✅ Se Usuário B reativar plano → animal volta a aparecer

---

### **Teste 7: Dono FREE + Sócio Ativo**

**Cenário**: Dono (Usuário A) tem plano FREE, mas Sócio (Usuário B) tem plano ativo

1. ⚠️ **Simular**: Usuário A (dono) com `plan = 'free'`
2. ⚠️ Usuário B (sócio) com `plan = 'premium'` (ativo)
3. Acessar página pública do animal

**Resultado Esperado**:
- ✅ Animal **NÃO aparece** no perfil do Usuário A (dono FREE)
- ✅ Animal **APARECE** no perfil do Usuário B (sócio ativo)
- ✅ Anúncio continua **ATIVO** (pois há sócio com plano ativo)
- ✅ Quadro Societário mostra apenas **Usuário B**

---

### **Teste 8: Limite de 10 Sócios**

**Cenário**: Tentar adicionar 11º sócio a um animal

1. Login como **Usuário A**
2. Criar 10 convites para um animal (pode usar contas de teste)
3. Tentar enviar **11º convite**

**Resultado Esperado**:
- ❌ Erro: *"Este animal já atingiu o limite de 10 sócios"*
- ✅ Convite **não é criado**

---

### **Teste 9: Estatísticas Compartilhadas**

**Cenário**: Visualizações do animal são compartilhadas entre sócios

1. Login como **Usuário A** (dono)
2. Ver estatísticas do animal (ex: 100 visualizações)
3. Login como **Usuário B** (sócio)
4. Acessar mesmo animal em "Meus Animais"

**Resultado Esperado**:
- ✅ Ambos veem **mesmas estatísticas** (100 visualizações)
- ✅ Estatísticas são **compartilhadas**, não duplicadas

---

### **Teste 10: Mensagens - Destinatário Correto**

**Cenário**: Visitante envia mensagem sobre animal em sociedade

**Regra**: Owner (ativo) → Partner ativo → Owner (free)

#### 10.1: Dono com Plano Ativo
1. Animal com Dono (A) ativo + Sócio (B) ativo
2. Visitante envia mensagem
3. **Resultado**: Mensagem vai para **Usuário A** (dono)

#### 10.2: Dono FREE + Sócio Ativo
1. Dono (A) = FREE, Sócio (B) = ATIVO
2. Visitante envia mensagem
3. **Resultado**: Mensagem vai para **Usuário B** (sócio ativo)

#### 10.3: Ambos FREE (Caso Extremo)
1. Dono (A) = FREE, Sócio (B) = FREE
2. Visitante envia mensagem
3. **Resultado**: Mensagem vai para **Usuário A** (dono, mesmo FREE)

---

## 📊 Checklist Geral

### Backend
- [ ] Migration 046 aplicada com sucesso
- [ ] Funções SQL criadas (`count_active_animals_with_partnerships`, `should_animal_be_active`, `get_animal_message_recipient`, etc.)
- [ ] View `animals_with_partnerships` funcional
- [ ] Triggers de notificação funcionando
- [ ] RLS policies corretas

### Frontend
- [ ] SocietyPage exibe dados reais
- [ ] Enviar/aceitar/rejeitar convites funciona
- [ ] Botão "Deixar Sociedade" funcional
- [ ] AnimalPage mostra Quadro Societário
- [ ] Percentual oculto para não-sócios
- [ ] Meus Animais mostra badges "Sócio" / "Sociedade"
- [ ] HarasPage exibe animais + sociedades

### Regras de Negócio
- [ ] Limite de 10 sócios por animal
- [ ] Animal ativo se owner OU partner tiver plano ativo
- [ ] Sócio FREE não aparece em quadro societário
- [ ] Estatísticas compartilhadas
- [ ] Mensagens seguem fallback correto
- [ ] Animais de sociedade contam no limite do plano

---

## 🐛 Possíveis Problemas

### 1. **Migration não aplicada**
- Verificar no Supabase SQL Editor se funções existem
- Re-aplicar parts 1-6 se necessário

### 2. **Quadro Societário não aparece**
- Verificar se `getAnimalPartners()` retorna dados
- Verificar console do navegador para erros

### 3. **Percentual visível para todos**
- Verificar lógica `isOwnerOrPartner` em AnimalPage
- Deve ser `true` apenas se usuário é dono OU sócio

### 4. **Animal não some ao virar FREE**
- Verificar função `get_profile_animals()` no SQL
- Deve filtrar apenas partners com plano ativo

---

## 🎯 Próximos Passos Sugeridos

1. **Testar cada cenário** acima em ordem
2. **Documentar bugs** encontrados
3. **Validar contagem** de animais no limite do plano
4. **Testar performance** com muitos sócios (100+ animais)
5. **Adicionar analytics** de uso do sistema de sociedades

---

## 📝 Notas do Desenvolvedor

### Melhorias de Escalabilidade
1. **Cache de partnerships**: Considerar cache Redis para `getAnimalPartners()`
2. **Lazy loading**: Quadro societário pode ser carregado sob demanda
3. **Websockets**: Notificações em tempo real ao aceitar convite
4. **Audit log**: Registrar histórico de entradas/saídas de sociedades

### Melhorias de UX
1. **Modal de preview**: Ao enviar convite, mostrar preview do animal
2. **Busca de sócios**: Buscar por nome/haras além de código público
3. **Gráfico de participação**: Pizza chart mostrando % de cada sócio
4. **Histórico**: Timeline de sociedades passadas

### Segurança
- ✅ RLS policies aplicadas
- ✅ Validação de limites no backend
- ✅ Privacidade de percentuais respeitada
- ⚠️ Considerar rate limiting para envio de convites

---

**Implementado por**: Assistente IA Senior Developer  
**Data**: 2025-11-04  
**Status**: ✅ **PRONTO PARA TESTES**

