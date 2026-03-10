# Sistema de Atualização de Perfil e Mapa

## 📋 Visão Geral

Sistema completo para usuários atualizarem seus perfis e aparecerem no mapa da comunidade, com diferenciação entre perfis simples e institucionais.

## 🎯 Funcionalidades Implementadas

### **1. Página de Atualização de Perfil**
- Rota: `/dashboard/update-profile`
- Componente: `src/pages/dashboard/UpdateProfilePage.tsx`

### **2. Campos Novos no Banco de Dados**

#### **Para Todos os Usuários:**
- `city` - Cidade do usuário
- `state` - Estado do usuário
- `country` - País (padrão: Brasil)

#### **Para Perfis Institucionais:**
- `founded_year` - Ano de fundação
- `owner_name` - Nome do proprietário
- `bio` - Biografia/Sobre (máx 500 caracteres)

### **3. Upload de Imagens**
- **Usuário Simples**: Foto de perfil
- **Usuário Institucional**: Logo da instituição
- Armazenamento no Supabase Storage (`profiles/avatars/`)
- Validação: Apenas imagens, máx 5MB

## 🔐 Privacidade e Segurança

### **Localização no Mapa**
- ✅ Apenas **país, estado e cidade** são exibidos
- ✅ Localização exata **NUNCA** é compartilhada
- ✅ Usuário controla se quer aparecer no mapa (checkbox)
- ✅ Aviso destacado sobre privacidade na interface

## 📝 Fluxo de Uso

### **Para Usuário Simples:**

1. Acessa **Dashboard** → **Atualizar Perfil**
2. Faz upload da **foto de perfil** (opcional)
3. Seleciona **Estado** e **Cidade**
4. Marca checkbox **"Exibir minha localização no mapa"**
5. Salva o perfil
6. Avatar aparece no mapa na cidade escolhida

**Visualização no Mapa:**
- Avatar padrão com inicial do nome
- Ao clicar: nome e informações básicas

### **Para Usuário Institucional:**

1. Acessa **Dashboard** → **Atualizar Perfil**
2. Faz upload do **logo da instituição**
3. Seleciona **Estado** e **Cidade**
4. Preenche dados institucionais:
   - Ano de fundação
   - Nome do proprietário
   - Biografia (ex: "Haras especializado em Mangalarga Marchador...")
5. Marca checkbox **"Exibir minha localização no mapa"**
6. Salva o perfil
7. Logo aparece no mapa com destaque VIP

**Visualização no Mapa:**
- Logo personalizada visível
- Coroa dourada (se VIP)
- Ao clicar: informações completas + Instagram + botão "Ver Perfil Completo"

## 🗺️ Sistema de Localização

### **Estados Disponíveis:**
27 estados brasileiros (todos)

### **Cidades por Estado:**
Sistema pré-configurado com principais cidades:
- São Paulo: São Paulo, Campinas, Santos, Ribeirão Preto...
- Rio de Janeiro: Rio de Janeiro, Niterói, Duque de Caxias...
- Minas Gerais: Belo Horizonte, Uberlândia, Contagem...
- Bahia: Salvador, Feira de Santana, Vitória da Conquista...
- Paraná: Curitiba, Londrina, Maringá...
- Rio Grande do Sul: Porto Alegre, Caxias do Sul, Pelotas...

**Expansível**: Fácil adicionar mais cidades no arquivo `UpdateProfilePage.tsx`

## 🎨 Interface do Usuário

### **Seções da Página:**

1. **Avatar/Logo**
   - Preview visual
   - Upload drag-and-drop
   - Validação de tamanho e formato

2. **Localização no Mapa**
   - Aviso de privacidade destacado
   - Seleção de Estado → Cidade
   - Checkbox para controlar visibilidade

3. **Informações Institucionais** (só para institucionais)
   - Fundado em (ano)
   - Proprietário
   - Biografia (contador de caracteres)

4. **Botões de Ação**
   - Cancelar (volta para settings)
   - Salvar Perfil (com feedback de loading)

## 📊 Validações Implementadas

### **Upload de Imagem:**
- ✅ Apenas arquivos de imagem
- ✅ Tamanho máximo: 5MB
- ✅ Formatos: PNG, JPG, JPEG

### **Localização:**
- ✅ Para aparecer no mapa: Estado e Cidade obrigatórios
- ✅ Validação no backend (trigger SQL)

### **Biografia:**
- ✅ Máximo 500 caracteres
- ✅ Contador visual em tempo real
- ✅ Validação no frontend e backend

## 🔄 Integração com o Mapa

### **Como funciona:**

1. **Usuário atualiza perfil** com localização
2. **Sistema geocodifica** cidade via API Mapbox
3. **Avatar/Logo aparece** no mapa na localização exata
4. **Offset aleatório pequeno** para múltiplos usuários na mesma cidade

### **Prioridade de Localização:**
```javascript
if (city && state && country) {
  // Usar localização completa
} else if (city && country) {
  // Usar cidade + país
} else if (property_name) {
  // Fallback para propriedade
} else {
  // Padrão: São Paulo
}
```

## 🚀 Como Usar

### **1. Aplicar Migration:**
```sql
-- Executar no Supabase Dashboard
-- Arquivo: supabase_migrations/024_add_location_fields.sql
```

### **2. Configurar Storage:**
```sql
-- Criar bucket 'profiles' se não existir
-- Configurar políticas de acesso público para leitura
```

### **3. Adicionar Link no Dashboard:**
```tsx
// No menu do dashboard ou página de settings
<Link to="/dashboard/update-profile">
  <Button>
    Atualizar Meu Perfil
  </Button>
</Link>
```

## 📱 Responsividade

- ✅ Layout adaptável mobile/desktop
- ✅ Grid responsivo para campos
- ✅ Upload otimizado para touch
- ✅ Preview adequado em telas pequenas

## 🎯 Benefícios

### **Para Usuários:**
- ✅ Controle total sobre visibilidade
- ✅ Privacidade respeitada
- ✅ Fácil de usar
- ✅ Feedback visual claro

### **Para Instituições:**
- ✅ Perfil rico e profissional
- ✅ Destaque no mapa
- ✅ Mais informações visíveis
- ✅ Branding com logo

### **Para a Plataforma:**
- ✅ Comunidade engajada
- ✅ Mapa preenchido
- ✅ Valor agregado aos planos VIP
- ✅ Networking facilitado

## 🔧 Manutenção

### **Adicionar Novas Cidades:**
```typescript
// Em UpdateProfilePage.tsx
const CITIES_BY_STATE: Record<string, string[]> = {
  'Novo Estado': ['Cidade 1', 'Cidade 2', 'Cidade 3'],
  // ...
};
```

### **Modificar Limite de Bio:**
```typescript
// No componente
maxLength={500} // Alterar aqui

// Na migration
COMMENT ON COLUMN profiles.bio IS 'máximo X caracteres';
```

## 📖 Exemplo de Uso Real

### **Haras Fictício:**
```
Nome: Haras Vale Verde
Estado: Minas Gerais
Cidade: Belo Horizonte
Fundado em: 2010
Proprietário: João Silva
Bio: "Haras especializado em Mangalarga Marchador de marcha 
      picada há 15 anos. Trabalhamos com genética de elite, 
      importação de reprodutores e criação de animais para 
      competição em provas de marcha. Localizado em BH..."
```

**Resultado no Mapa:**
- Logo do haras visível em Belo Horizonte
- Coroa dourada (se VIP)
- Ao clicar: todas as informações + Instagram + Ver Perfil

## ✅ Checklist de Implementação

- [x] Criar página UpdateProfilePage
- [x] Adicionar migration 024
- [x] Atualizar tipo Profile
- [x] Adicionar rota no App.tsx
- [x] Integrar com MapboxMap
- [x] Sistema de upload de imagens
- [x] Validações de formulário
- [x] Feedback visual (toast)
- [x] Documentação completa
- [ ] Aplicar migration no Supabase
- [ ] Configurar bucket de storage
- [ ] Adicionar link no dashboard
- [ ] Testar fluxo completo

## 🎉 Pronto para Uso!

O sistema está completo e pronto para ser usado. Basta aplicar a migration e configurar o storage para começar!

