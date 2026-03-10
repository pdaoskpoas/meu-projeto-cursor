# 🎯 Implementação: Sistema de Atualização de Perfil com Controles de Acesso

**Data:** 27 de Novembro de 2025  
**Status:** ✅ **IMPLEMENTADO**

---

## 📋 Resumo das Mudanças

Implementado sistema completo de atualização de perfil com as seguintes funcionalidades:

1. ✅ Conversão de conta pessoal para institucional
2. ✅ Controles de acesso baseados em plano (Free vs. Planos Pagos)
3. ✅ Avisos e links diretos para upgrade de plano
4. ✅ Campos CEP e Instagram integrados
5. ✅ Validações e feedback visual aprimorados

---

## 🏗️ Arquitetura das Mudanças

### **1. Interface de Conversão Institucional**

#### **Localização:**
- `src/pages/dashboard/UpdateProfilePage.tsx`

#### **Funcionalidades:**
- **Toggle de Conversão:** Switch para ativar o modo de conversão
- **Seleção de Tipo:** Dropdown com 4 tipos de instituição:
  - Haras
  - Fazenda
  - CTE (Centro de Treinamento Equestre)
  - Central de Reprodução
- **Nome da Propriedade:** Campo obrigatório (mínimo 3 caracteres)
- **Geração de Código Público:** Automática baseada no nome da propriedade
- **Validações:** Campos obrigatórios com feedback visual

```typescript
interface FormData {
  // ... campos existentes ...
  wantsToConvert: boolean;
  property_type: 'haras' | 'fazenda' | 'cte' | 'central-reproducao' | '';
  property_name: string;
}
```

---

### **2. Controle de Acesso por Plano**

#### **Lógica de Verificação:**

```typescript
const hasActivePlan = user?.plan && user.plan !== 'free' && user?.hasActivePlan;
```

#### **Planos com Acesso Completo:**
- ✅ **Iniciante (Basic)**
- ✅ **Pro**
- ✅ **Elite (Ultra)**
- ✅ **VIP**

#### **Plano Restrito:**
- ❌ **Free** - Bloqueio nos campos:
  - Fundado em
  - Proprietário/Responsável
  - Sobre a Instituição (Bio)
  - Link do Instagram

---

### **3. Campos Bloqueados para Usuários Free**

#### **Visual dos Campos:**

**Para Usuários Free:**
```
┌─────────────────────────────────────────┐
│ 🚫 Campo Bloqueado                      │
│ Requer plano ativo                      │
│ [Ver Planos Disponíveis →]             │
└─────────────────────────────────────────┘
```

**Para Usuários com Plano:**
```
┌─────────────────────────────────────────┐
│ ✅ Campo Disponível                     │
│ [Editar normalmente...]                 │
└─────────────────────────────────────────┘
```

---

### **4. Avisos e Links de Upgrade**

#### **Componentes de Aviso:**

**1. Seção de Informações Institucionais:**
```tsx
<Alert className="bg-amber-50 border-amber-300">
  <AlertCircle className="h-4 w-4 text-amber-600" />
  <AlertDescription>
    <p className="font-semibold text-amber-800">
      Campos Bloqueados - Plano Free
    </p>
    <p className="text-sm text-amber-700">
      Os campos abaixo estão disponíveis apenas para usuários com plano ativo.
    </p>
    <Button
      variant="default"
      size="sm"
      className="mt-2 bg-amber-600 hover:bg-amber-700"
      onClick={() => window.open('/planos', '_blank')}
    >
      Ver Planos Disponíveis →
    </Button>
  </AlertDescription>
</Alert>
```

**2. Seção do Instagram:**
```tsx
<Alert className="bg-amber-50 border-amber-300">
  <AlertCircle className="h-4 w-4 text-amber-600" />
  <AlertDescription>
    <p className="font-semibold text-amber-800">
      Link do Instagram - Requer Plano Ativo
    </p>
    <p className="text-sm text-amber-700">
      O link do Instagram só ficará visível no seu perfil público 
      se você tiver um plano ativo.
    </p>
    <Button onClick={() => window.open('/planos', '_blank')}>
      Ver Planos Disponíveis →
    </Button>
  </AlertDescription>
</Alert>
```

---

## 🔄 Fluxo de Conversão Institucional

### **Passo a Passo:**

```
1. Usuário Pessoal acessa "Atualizar Perfil"
   ↓
2. Visualiza card "Converter para Perfil Institucional"
   ↓
3. Ativa o switch "Quero converter minha conta"
   ↓
4. Seleciona tipo de instituição (obrigatório)
   ↓
5. Digita nome da propriedade (obrigatório, min. 3 chars)
   ↓
6. Clica em "Salvar Perfil"
   ↓
7. Sistema valida os dados:
   - ✅ Tipo selecionado?
   - ✅ Nome válido?
   ↓
8. Backend atualiza registro:
   - account_type: 'institutional'
   - property_type: [selecionado]
   - property_name: [digitado]
   - public_code: [gerado automaticamente]
   ↓
9. Página recarrega automaticamente
   ↓
10. Usuário agora vê interface institucional completa
```

---

## 📊 Estrutura de Dados

### **Tabela `profiles` - Novos Campos:**

```sql
-- Campos já existentes
account_type TEXT CHECK (account_type IN ('personal', 'institutional'))
property_type TEXT CHECK (property_type IN ('haras', 'fazenda', 'cte', 'central-reproducao'))
property_name TEXT
public_code TEXT UNIQUE

-- Campos adicionados recentemente (Migration 079)
instagram VARCHAR(100)
cep VARCHAR(9)

-- Campos de perfil estendido (Migration 020)
founded_year TEXT
owner_name TEXT
bio TEXT
```

---

## 🔧 Hook Atualizado: `useProfileUpdate`

### **Novos Parâmetros:**

```typescript
export interface ProfileUpdateOptions {
  showOnMap?: boolean;
  convertToInstitutional?: {
    property_type: string;
    property_name: string;
  };
}
```

### **Lógica de Conversão:**

```typescript
if (options.convertToInstitutional) {
  updateData.account_type = 'institutional';
  updateData.property_type = options.convertToInstitutional.property_type;
  updateData.property_name = options.convertToInstitutional.property_name;
  
  // Gerar public_code único
  const baseName = options.convertToInstitutional.property_name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  
  const timestamp = Date.now().toString(36);
  updateData.public_code = `${baseName}-${timestamp}`;
}
```

---

## 🎨 Elementos Visuais

### **Badges de Status:**

**Campo Disponível:**
```tsx
<Badge className="ml-2 bg-green-100 text-green-700">
  Disponível
</Badge>
```

**Campo Bloqueado:**
```tsx
<Badge className="ml-2 bg-amber-100 text-amber-700">
  Requer Plano
</Badge>
```

### **Labels dos Campos:**

**Com Plano:**
```
Proprietário/Responsável (Disponível)
```

**Sem Plano:**
```
Proprietário/Responsável (Requer Plano)
```

---

## 🛡️ Validações Implementadas

### **1. Conversão Institucional:**
- ✅ Tipo de instituição obrigatório
- ✅ Nome da propriedade mínimo 3 caracteres
- ✅ Public code gerado automaticamente (único)

### **2. Campos Institucionais:**
- ✅ Ano de fundação: 1800 até ano atual
- ✅ Biografia: máximo 500 caracteres
- ✅ CEP: formato brasileiro (00000-000)
- ✅ Instagram: remove @ automaticamente

### **3. Localização:**
- ✅ Estado obrigatório se "Exibir no mapa" ativo
- ✅ Cidade obrigatória se "Exibir no mapa" ativo

---

## 📱 Comportamento por Tipo de Conta

### **Conta Pessoal (Personal):**

```
✅ Pode ver: Card de conversão institucional
✅ Pode editar: Avatar, CEP, Localização
❌ Não vê: Campos institucionais
```

### **Conta Institucional - Plano Free:**

```
✅ Pode ver: Todos os campos
✅ Pode editar: Avatar, CEP, Localização, Nome da Propriedade
🔒 Bloqueados: Fundado em, Proprietário, Bio, Instagram
📢 Vê avisos: Links para upgrade de plano
```

### **Conta Institucional - Plano Pago (Basic/Pro/Elite/VIP):**

```
✅ Pode ver: Todos os campos
✅ Pode editar: TUDO
✨ Campos premium: Fundado em, Proprietário, Bio, Instagram
```

---

## 🔗 Links e Navegação

### **Página de Planos:**
- **URL:** `/planos`
- **Abertura:** Nova aba (`_blank`)
- **Contexto:** Presente em todos os avisos de upgrade

### **Link de Voltar:**
- **Destino:** `/dashboard/settings`
- **Comportamento:** Navegação normal

---

## 🚀 Melhorias de UX

### **1. Feedback Visual:**
- ✅ Estados desabilitados claramente marcados
- ✅ Placeholders informativos ("Requer plano ativo")
- ✅ Badges coloridos (verde = disponível, âmbar = bloqueado)

### **2. Avisos Contextuais:**
- ✅ Cards de alerta com cores distintas
- ✅ Ícones apropriados (AlertCircle, CheckCircle)
- ✅ Texto claro e objetivo

### **3. Chamadas para Ação:**
- ✅ Botões de upgrade bem posicionados
- ✅ Texto motivacional sem ser intrusivo
- ✅ Abertura em nova aba (não perde progresso)

---

## 📈 Impacto de Negócio

### **Benefícios para o Usuário:**
1. **Clareza:** Sabe exatamente o que pode/não pode editar
2. **Transparência:** Entende por que certos campos estão bloqueados
3. **Facilidade:** Conversão institucional em poucos cliques
4. **Upgrade Simples:** Link direto para planos

### **Benefícios para o Negócio:**
1. **Conversão:** Links diretos aumentam conversão para planos pagos
2. **Engajamento:** Usuários entendem valor dos planos premium
3. **Redução de Suporte:** Avisos claros reduzem dúvidas
4. **Profissionalismo:** Interface clean e moderna

---

## 🧪 Testes Sugeridos

### **Cenário 1: Conversão Institucional**
```
1. Login como usuário pessoal
2. Ir para "Atualizar Perfil"
3. Ativar switch de conversão
4. Tentar salvar sem preencher → Deve mostrar erros
5. Preencher corretamente e salvar → Deve converter e recarregar
```

### **Cenário 2: Usuário Free Institucional**
```
1. Login como institucional com plano Free
2. Ir para "Atualizar Perfil"
3. Verificar campos bloqueados (disabled)
4. Verificar avisos de upgrade
5. Clicar em "Ver Planos" → Deve abrir em nova aba
```

### **Cenário 3: Usuário com Plano Pago**
```
1. Login como institucional com plano Pro
2. Ir para "Atualizar Perfil"
3. Verificar todos campos habilitados
4. Editar e salvar → Deve funcionar normalmente
```

---

## 📝 Notas Técnicas

### **Geração de Public Code:**
- **Formato:** `nome-da-propriedade-[timestamp-base36]`
- **Exemplo:** `haras-santa-maria-l5x2m3n`
- **Unicidade:** Garantida pelo timestamp

### **Recarga de Página:**
- **Quando:** Após conversão institucional
- **Por quê:** Atualizar contexto de autenticação
- **Delay:** 2 segundos (tempo para toast aparecer)

### **Controle de Plano:**
```typescript
const hasActivePlan = user?.plan && user.plan !== 'free' && user?.hasActivePlan;
```

---

## 🎯 Conclusão

✅ **Implementação Completa**

O sistema agora oferece:
- Conversão simples de pessoal para institucional
- Controles claros de acesso por plano
- Avisos informativos e não intrusivos
- Links diretos para conversão

A interface está profissional, intuitiva e alinhada com as melhores práticas de UX, incentivando naturalmente o upgrade para planos pagos sem ser agressiva.

---

## 📚 Arquivos Modificados

1. `src/pages/dashboard/UpdateProfilePage.tsx` - Interface principal
2. `src/hooks/useProfileUpdate.ts` - Lógica de atualização
3. `IMPLEMENTACAO_PERFIL_ATUALIZADO.md` - Esta documentação

---

**Desenvolvido com foco em:**
- 🎨 **UX Profissional**
- 🔒 **Segurança de Acesso**
- 💼 **Conversão de Negócio**
- ⚡ **Performance e Simplicidade**
