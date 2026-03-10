# 🎯 MELHORIAS PÁGINA ATUALIZAR PERFIL E PERFIL INDIVIDUAL
**Data**: 27/11/2025

---

## ⚠️ **MIGRATION PENDENTE - APLICAR MANUALMENTE NO SUPABASE:**

```sql
-- Migration 079: Adicionar campos instagram e CEP
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS instagram VARCHAR(100),
ADD COLUMN IF NOT EXISTS cep VARCHAR(9);

COMMENT ON COLUMN public.profiles.instagram IS 'Username do Instagram sem o @';
COMMENT ON COLUMN public.profiles.cep IS 'CEP do endereço (formato: 12345-678)';

CREATE INDEX IF NOT EXISTS idx_profiles_instagram ON public.profiles(instagram) WHERE instagram IS NOT NULL;
```

---

## 📋 **MELHORIAS SOLICITADAS:**

### **1️⃣ PÁGINA "ATUALIZAR PERFIL" (`/dashboard/update-profile`):**

#### **A. Campo CEP com Busca Automática** ✅
- Campo input para CEP (formato: 12345-678)
- Busca automática via API ViaCEP ao completar 8 dígitos
- Preenche automaticamente Estado e Cidade
- **Arquivo criado**: `src/services/cepService.ts`

#### **B. Campo Instagram com @ Pré-definido** 📋
- Input com placeholder "@seu_instagram"
- Salva apenas o username (sem @)
- Exemplo: Se digita "@harastonho" → salva "harastonho"
- **Observação**: Link só aparece no perfil para quem tem plano

#### **C. Labels Dinâmicas Conforme Propriedade** 📋
- **Haras**: "Fundado em" / "Sobre o Haras"
- **Fazenda**: "Fundada em" / "Sobre a Fazenda"
- **CTE**: "Fundado em" / "Sobre o CTE"
- **Central de Reprodução**: "Fundada em" / "Sobre a Central"

---

### **2️⃣ PÁGINA PERFIL INDIVIDUAL (`/perfil/:id`):**

#### **A. Remover Imagem da Casa** 📋
- A imagem grande da propriedade não faz sentido
- Remover para tornar o perfil mais clean

#### **B. Adicionar Novas Seções de Animais** 📋
Atualmente existe:
- Garanhões da Propriedade (1)
- Doadoras da Propriedade (2)

**Adicionar**:
- **Potros da Propriedade** (categoria='Potro')
- **Potras da Propriedade** (categoria='Potra')
- **Outros** (categorias restantes)

---

## 🛠️ **ARQUIVOS CRIADOS:**

1. ✅ `src/services/cepService.ts` - Serviço para buscar CEP
2. ✅ `supabase_migrations/079_add_instagram_and_cep_to_profiles.sql` - Migration para novos campos

---

## 📝 **ARQUIVOS A MODIFICAR:**

### **1. `src/pages/dashboard/UpdateProfilePage.tsx`:**
```typescript
// Adicionar ao FormData:
interface FormData {
  // ... campos existentes
  instagram: string; // Novo
  cep: string; // Novo
}

// Adicionar seção de Redes Sociais:
<Card>
  <CardHeader>
    <CardTitle>Redes Sociais</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="space-y-2">
      <Label>Instagram</Label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
          @
        </span>
        <Input
          className="pl-8"
          placeholder="seu_instagram"
          value={formData.instagram}
          onChange={(e) => updateFormField('instagram', e.target.value.replace('@', ''))}
        />
      </div>
      <p className="text-xs text-slate-500">
        Link do Instagram aparecerá no seu perfil apenas se você tiver um plano ativo
      </p>
    </div>
  </CardContent>
</Card>

// Adicionar seção de CEP:
<Card>
  <CardHeader>
    <CardTitle>Endereço (CEP)</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="space-y-2">
      <Label>CEP</Label>
      <Input
        placeholder="00000-000"
        value={formData.cep}
        onChange={handleCepChange}
        maxLength={9}
      />
      <p className="text-xs text-slate-500">
        O CEP será usado para preencher automaticamente Estado e Cidade
      </p>
    </div>
  </CardContent>
</Card>

// Função handleCepChange:
const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const cep = formatarCep(e.target.value);
  updateFormField('cep', cep);
  
  if (cep.replace(/\D/g, '').length === 8) {
    const result = await buscarCep(cep);
    if (result.success && result.data) {
      updateFormField('state', UF_TO_ESTADO[result.data.uf]);
      updateFormField('city', result.data.localidade);
    }
  }
};

// Ajustar labels conforme property_type:
const getFoundedLabel = () => {
  if (!user?.propertyType) return 'Fundado em';
  
  switch (user.propertyType) {
    case 'fazenda':
    case 'central-reproducao':
      return 'Fundada em';
    default:
      return 'Fundado em';
  }
};

const getBioLabel = () => {
  if (!user?.propertyType) return 'Sobre a Instituição';
  
  switch (user.propertyType) {
    case 'haras':
      return 'Sobre o Haras';
    case 'fazenda':
      return 'Sobre a Fazenda';
    case 'cte':
      return 'Sobre o CTE';
    case 'central-reproducao':
      return 'Sobre a Central de Reprodução';
    default:
      return 'Sobre a Instituição';
  }
};
```

---

### **2. Página Perfil Individual:**

```typescript
// Adicionar link do Instagram (apenas para planos ativos):
{profile.instagram && profile.plan !== 'free' && (
  <a
    href={`https://instagram.com/${profile.instagram}`}
    target="_blank"
    rel="noopener noreferrer"
    className="flex items-center gap-2 text-purple-600 hover:text-purple-700"
  >
    <Instagram className="h-5 w-5" />
    @{profile.instagram}
  </a>
)}

// Adicionar seções de animais:
{/* Potros */}
<AnimalSection
  title="Potros da Propriedade"
  animals={animals.filter(a => a.category === 'Potro')}
  count={animals.filter(a => a.category === 'Potro').length}
/>

{/* Potras */}
<AnimalSection
  title="Potras da Propriedade"
  animals={animals.filter(a => a.category === 'Potra')}
  count={animals.filter(a => a.category === 'Potra').length}
/>

{/* Outros */}
<AnimalSection
  title="Outros"
  animals={animals.filter(a => !['Garanhão', 'Doadora', 'Potro', 'Potra'].includes(a.category))}
  count={animals.filter(a => !['Garanhão', 'Doadora', 'Potro', 'Potra'].includes(a.category)).length}
/>
```

---

## 🎯 **STATUS DAS TAREFAS:**

- ✅ Serviço de busca CEP criado
- ✅ Migration SQL criada
- ⚠️ Migration aguardando aplicação manual
- 📋 Atualizar componente UpdateProfilePage
- 📋 Atualizar página de perfil individual
- 📋 Remover imagem da casa no perfil
- 📋 Adicionar seções Potros/Potras/Outros

---

## 🚀 **PRÓXIMOS PASSOS:**

1. Aplicar migration SQL no Supabase Dashboard
2. Modificar `UpdateProfilePage.tsx` com novos campos
3. Modificar página de perfil individual
4. Testar busca de CEP
5. Testar salvamento de Instagram
6. Verificar exibição de link do Instagram apenas para planos ativos


