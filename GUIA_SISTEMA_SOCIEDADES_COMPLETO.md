# 🤝 GUIA COMPLETO - SISTEMA DE SOCIEDADES

## 📋 Visão Geral

O sistema de sociedades permite que **múltiplos usuários compartilhem a propriedade de um mesmo animal** (até 10 sócios por animal). Todos os sócios e o proprietário compartilham as mesmas informações do animal.

---

## ✅ Como Funciona

### 1. **Proprietário Cadastra o Animal**
- O proprietário cria o animal normalmente através do wizard de cadastro
- O animal é registrado com o proprietário como dono principal

### 2. **Proprietário Adiciona Sócios**
- Acessa o menu **Dashboard → Sociedades**
- Clica em **"Nova Sociedade"**
- Seleciona o animal (apenas animais próprios, não animais em que já é sócio)
- Insere o **código público do parceiro** (ex: HER2024)
- Define o **percentual de participação** (1-100%)
- Clica em **"Enviar Convite"**

### 3. **Sistema Adiciona o Sócio Automaticamente**
⚠️ **IMPORTANTE**: A partir da Migration 065, **NÃO há mais sistema de convites pendentes**
- O sócio é adicionado **IMEDIATAMENTE** como ativo
- O animal aparece automaticamente no perfil do sócio (se ele tiver plano ativo)
- Todos compartilham as mesmas informações do animal

### 4. **Visualização do Animal**
- O animal aparece na lista de "Meus Animais" de todos os sócios com plano ativo
- Na página do animal, todos os sócios são listados no card "Quadro Societário"
- Os percentuais são visíveis APENAS para o dono e os sócios (privacidade)

---

## 🔧 Funcionalidades do Sistema

### ✅ O que o sistema já faz:

1. **Adicionar até 10 sócios por animal**
   - Validação automática do limite
   - Não permite adicionar o mesmo parceiro duas vezes
   - Não permite que o proprietário adicione a si mesmo

2. **Compartilhamento de informações**
   - Todos os sócios veem as mesmas informações do animal
   - Fotos, genealogia, títulos, localização, etc.

3. **Controle de acesso baseado em plano**
   - Apenas sócios com plano ativo veem o animal em seu perfil
   - Se o sócio cancelar o plano, o animal não aparece mais para ele
   - Badge "Plano Ativo" indica sócios com plano válido

4. **Privacidade de percentuais**
   - Percentuais de participação visíveis apenas para dono e sócios
   - Visitantes externos veem apenas "Animal em regime de sociedade"

5. **Gestão de sociedades**
   - Sócios podem sair voluntariamente (botão "Deixar Sociedade")
   - Proprietário pode remover sócios
   - Sistema atualiza em tempo real

---

## 📊 Estrutura do Banco de Dados

### Tabela: `animal_partnerships`

```sql
CREATE TABLE animal_partnerships (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  animal_id UUID REFERENCES animals(id),
  partner_id UUID REFERENCES profiles(id),
  partner_haras_name TEXT,
  percentage NUMERIC CHECK (percentage >= 0 AND percentage <= 100),
  animal_owner_id UUID REFERENCES profiles(id),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  added_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Campos importantes:**
- `animal_id`: ID do animal compartilhado
- `partner_id`: ID do usuário que é sócio
- `percentage`: Percentual de participação (0-100)
- `joined_at`: Data em que o sócio entrou na sociedade
- `added_by`: ID do usuário que adicionou o sócio (geralmente o proprietário)

⚠️ **Nota**: O campo `status` foi REMOVIDO na Migration 065. Todas as sociedades são ativas imediatamente.

---

## 🎯 Fluxo Completo de Uso

### Cenário: Haras A e Haras B compartilham 3 animais

1. **Haras A cadastra os 3 animais** em seu perfil

2. **Haras A adiciona Haras B como sócio** nos 3 animais:
   - Acessa "Sociedades" → "Nova Sociedade"
   - Seleciona "Animal 1"
   - Insere código público do Haras B: "HARASB2024"
   - Define percentual: 50%
   - Confirma
   - Repete para Animal 2 e Animal 3

3. **Sistema adiciona automaticamente**:
   - Haras B agora vê os 3 animais em "Meus Animais" (se tiver plano ativo)
   - Animal 1, 2 e 3 mostram "50%" de participação para Haras B
   - Nas páginas dos animais, ambos aparecem no "Quadro Societário"

4. **Ambos podem**:
   - Ver todas as informações dos animais
   - Receber mensagens de interessados
   - Ver estatísticas de visualizações (se tiverem plano adequado)
   - Gerenciar suas sociedades

5. **Se Haras B cancelar o plano**:
   - Os animais não aparecem mais em "Meus Animais" do Haras B
   - A sociedade continua existindo no banco
   - Se Haras B reativar o plano, os animais voltam a aparecer

---

## 🚀 Validações e Regras de Negócio

### Ao adicionar sócio:

✅ **Validações implementadas:**
- Código público deve existir no sistema
- Não pode adicionar a si mesmo como sócio
- Não pode adicionar o mesmo parceiro duas vezes no mesmo animal
- Máximo de 10 sócios por animal
- Percentual deve estar entre 1 e 100
- Apenas o proprietário pode adicionar sócios (não permite sócio adicionar outros sócios)

❌ **O que NÃO valida:**
- Soma dos percentuais não precisa ser 100% (é apenas informativo)
- Não há verificação de conflito de percentuais
- Não há limite de quantos animais um usuário pode participar como sócio

### Ao remover sócio:

✅ **Quem pode remover:**
- Proprietário pode remover qualquer sócio
- Sócio pode remover a si mesmo (sair da sociedade)

❌ **Quem NÃO pode remover:**
- Sócio não pode remover outros sócios
- Sócio não pode remover o proprietário

---

## 💾 Código-fonte Principal

### 1. Service: `src/services/partnershipService.ts`

Métodos principais:
```typescript
// Adicionar sócio (imediato, sem convite pendente)
sendPartnershipInvite(animalId: string, partnerPublicCode: string, percentage: number)

// Buscar sociedades do usuário (recebidas + enviadas)
getUserPartnerships(userId: string)

// Buscar sócios de um animal específico
getAnimalPartners(animalId: string)

// Buscar animais do usuário incluindo sociedades
getUserAnimalsWithPartnerships(userId: string)

// Remover sócio (apenas proprietário)
removePartnership(partnershipId: string, userId: string)

// Sair de sociedade (sócio remove a si mesmo)
leavePartnership(partnershipId: string, userId: string)
```

### 2. Página: `src/pages/dashboard/SocietyPage.tsx`

Interface para gerenciar sociedades:
- Exibe código público do usuário
- Lista sociedades como sócio
- Lista sociedades como proprietário
- Modal para criar nova sociedade
- Botões para sair/remover sociedades

### 3. Página: `src/pages/animal/AnimalPage.tsx`

Exibe o "Quadro Societário":
- Lista todos os sócios do animal
- Mostra badge "Plano Ativo" para sócios ativos
- Exibe percentuais apenas para dono e sócios
- Link para perfil de cada sócio

---

## 📈 Estatísticas

### Contadores:

- **Animais Próprios**: Animais cadastrados pelo usuário
- **Sociedades Ativas**: Soma de sociedades recebidas + enviadas
- **Animais Totais**: Próprios + em sociedade (se tiver plano ativo)

---

## 🔒 Segurança e Privacidade

### RLS (Row Level Security)

As políticas do Supabase garantem:
- Usuário só vê sociedades em que participa (como dono ou sócio)
- Apenas o dono do animal pode adicionar/remover sócios
- Sócio só pode remover a si mesmo
- Percentuais privados (não aparecem em views públicas)

---

## 🐛 Problemas Conhecidos e Limitações

### ⚠️ Limitações atuais:

1. **Não há adicionar sócios durante o cadastro**
   - Sócios só podem ser adicionados DEPOIS que o animal já está criado
   - Necessário ir em "Dashboard → Sociedades" para adicionar

2. **Não há notificações**
   - Quando um sócio é adicionado, ele não recebe notificação
   - Quando um sócio é removido, ele não recebe notificação

3. **Edição do animal**
   - Não está claro se todos os sócios podem editar o animal ou apenas o proprietário
   - Sistema atual permite edição apenas pelo proprietário

4. **Percentuais não validados**
   - Soma dos percentuais não precisa ser 100%
   - Pode haver percentuais duplicados ou conflitantes

---

## ✨ Melhorias Sugeridas

### 🎯 Curto Prazo:

1. **Adicionar sócios durante cadastro**
   - Novo step no wizard: "Sociedades (Opcional)"
   - Permite adicionar sócios antes de publicar o animal

2. **Notificações**
   - Notificar sócio quando é adicionado a um animal
   - Notificar proprietário quando sócio sai da sociedade

3. **Validação de percentuais**
   - Avisar quando soma dos percentuais != 100%
   - Sugerir distribuição automática

### 🚀 Longo Prazo:

1. **Permissões granulares**
   - Permitir que sócios possam editar informações do animal
   - Definir quem pode adicionar/remover outros sócios
   - Controle de quem pode impulsionar o anúncio

2. **Histórico de sociedades**
   - Registrar quando sócios entraram/saíram
   - Mostrar linha do tempo de mudanças

3. **Contratos digitais**
   - Permitir anexar documento de contrato de sociedade
   - Assinatura digital dos termos

4. **Dashboard específico**
   - Relatórios consolidados de animais em sociedade
   - Estatísticas agregadas de performance

---

## 📝 Casos de Uso Reais

### Caso 1: Haras compartilha reprodutor

**Cenário**: Haras Boa Vista e Haras Santa Maria compartilham garanhão "Imperador"

1. Haras Boa Vista cadastra "Imperador"
2. Adiciona Haras Santa Maria como sócio com 50%
3. Ambos podem receber mensagens de interessados
4. Anúncio mostra ambos os haras como proprietários
5. Estatísticas contam para ambos

### Caso 2: Criação em parceria

**Cenário**: 3 criadores compartilham égua "Estrela do Sul"

1. Criador A cadastra a égua
2. Adiciona Criador B (33.33%)
3. Adiciona Criador C (33.33%)
4. Os 3 veem o animal em seus perfis
5. Todos recebem leads de interessados
6. Animal aparece em pesquisas com qualquer dos 3 nomes

### Caso 3: Central de Reprodução

**Cenário**: Central gerencia 50 animais de vários proprietários

1. Cada proprietário original cadastra seu animal
2. Central é adicionada como sócia com 0-20%
3. Central vê todos os 50 animais em seu perfil
4. Pode gerenciar anúncios e responder interessados
5. Proprietários mantêm controle principal

---

## 🧪 Testando o Sistema

### Teste 1: Adicionar sócio

```
1. Login como Usuário A
2. Ir em Dashboard → Sociedades
3. Clicar em "Nova Sociedade"
4. Selecionar um animal
5. Inserir código público de Usuário B
6. Definir percentual: 50
7. Confirmar
8. Verificar que aparece em "Sociedades Como Proprietário"
9. Logout
10. Login como Usuário B
11. Verificar que animal aparece em "Meus Animais"
12. Verificar que aparece em "Sociedades Como Sócio"
```

### Teste 2: Múltiplos sócios

```
1. Login como Usuário A
2. Adicionar Usuário B como sócio (30%)
3. Adicionar Usuário C como sócio (30%)
4. Adicionar Usuário D como sócio (40%)
5. Ir na página do animal
6. Verificar que todos os 3 sócios aparecem no Quadro Societário
7. Verificar que soma = 100%
8. Login como cada usuário e verificar que veem o animal
```

### Teste 3: Limite de 10 sócios

```
1. Login como Usuário A
2. Adicionar 10 sócios diferentes
3. Tentar adicionar 11º sócio
4. Verificar mensagem de erro: "Este animal já atingiu o limite máximo de 10 sócios"
```

### Teste 4: Remover sócio

```
1. Login como proprietário
2. Ir em Dashboard → Sociedades
3. Na seção "Sociedades Como Proprietário", ver lista de sócios
4. (Atualmente não tem botão de remover - precisa implementar)
5. Ou: Login como sócio
6. Clicar em "Deixar Sociedade"
7. Confirmar
8. Verificar que animal não aparece mais em "Meus Animais"
```

---

## 📚 Referências

- Migration 065: Simplificação do sistema (removeu status de convite)
- Service: `src/services/partnershipService.ts`
- Página: `src/pages/dashboard/SocietyPage.tsx`
- Página Animal: `src/pages/animal/AnimalPage.tsx`
- Auditoria: `AUDITORIA_SISTEMA_SOCIEDADES_COMPLETA.md`

---

**Última atualização**: 24/11/2025  
**Status**: ✅ Sistema funcionando, melhorias sugeridas documentadas


