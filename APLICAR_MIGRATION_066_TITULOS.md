# 🏆 APLICAR MIGRATION 066 - Sistema de Títulos e Conquistas

**Data:** 17 de Novembro de 2025  
**Migration:** `066_create_animal_titles_table.sql`  
**Status:** ✅ Pronto para aplicar

---

## 📋 O QUE ESTA MIGRATION FAZ

### Mudança Solicitada
O usuário pediu para melhorar o sistema de "Títulos e Conquistas" com os seguintes campos:
- **Nome do Evento:** "52ª Exposição Nacional do Agronegócio - Vitória da Conquista"
- **Data da Competição:** "3/10/2018"
- **Premiação:** "RESERV.CAMPEÃO(A) PROGÊNIE PAI"

### O que será criado
1. **Nova tabela `animal_titles`** com estrutura completa
2. **RLS Policies** para segurança
3. **View `animals_with_titles`** para facilitar consultas
4. **Função de migração** para converter títulos antigos (TEXT[])

---

## 🗄️ ESTRUTURA DA NOVA TABELA

```sql
CREATE TABLE animal_titles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  animal_id UUID NOT NULL REFERENCES animals(id) ON DELETE CASCADE,
  
  event_name TEXT NOT NULL,      -- Nome completo do evento
  event_date DATE NOT NULL,       -- Data da competição
  award TEXT NOT NULL,            -- Premiação recebida
  notes TEXT,                     -- Observações opcionais
  certificate_url TEXT,           -- URL do certificado (futuro)
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 🚀 COMO APLICAR

### Passo 1: Acessar o Supabase
1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá para **SQL Editor** (ícone de código)

### Passo 2: Aplicar a Migration
1. Clique em **+ New Query**
2. Copie todo o conteúdo de `supabase_migrations/066_create_animal_titles_table.sql`
3. Cole no editor SQL
4. Clique em **Run** ou pressione `Ctrl+Enter`

### Passo 3: Verificar Sucesso
Execute esta query para verificar:
```sql
-- Verificar se a tabela foi criada
SELECT table_name, column_name, data_type 
FROM information_schema.columns
WHERE table_name = 'animal_titles'
ORDER BY ordinal_position;

-- Verificar se as policies foram criadas
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'animal_titles';

-- Verificar se a view foi criada
SELECT viewname 
FROM pg_views 
WHERE viewname = 'animals_with_titles';
```

**Resultado esperado:**
- ✅ 8 colunas na tabela `animal_titles`
- ✅ 4 policies (SELECT, INSERT, UPDATE, DELETE)
- ✅ 1 view `animals_with_titles`

---

## 🔄 MIGRAR TÍTULOS ANTIGOS (Opcional)

Se você já tem animais com títulos no formato antigo (TEXT[]), execute:

```sql
-- Migrar títulos antigos para a nova tabela
SELECT migrate_old_titles_to_animal_titles();

-- Verificar quantos títulos foram migrados
SELECT 
  COUNT(*) as total_titulos,
  COUNT(DISTINCT animal_id) as total_animais
FROM animal_titles;
```

---

## 📝 FRONTEND JÁ ATUALIZADO

Os seguintes arquivos já foram atualizados para trabalhar com a nova estrutura:

### 1. Tipos TypeScript
- ✅ `src/types/animal.ts` - Interface `AnimalTitle`

### 2. Componentes
- ✅ `src/components/forms/steps/ExtrasStep.tsx` - Formulário completo
- ✅ `src/components/forms/animal/AddAnimalWizard.tsx` - Integração

### 3. Interface Atualizada
O formulário agora exibe:
```
┌────────────────────────────────────────────┐
│ 🏆 Títulos e Conquistas                    │
│                                            │
│ #1 Título 1                           [X]  │
│ ┌────────────────────────────────────────┐ │
│ │ Nome do Evento:                        │ │
│ │ [52ª Exposição Nacional...]            │ │
│ │                                        │ │
│ │ Data: [03/10/2018]  Premiação:        │ │
│ │                      [RESERV.CAMPEÃ...]│ │
│ │                                        │ │
│ │ Observações (opcional):                │ │
│ │ [...]                                  │ │
│ └────────────────────────────────────────┘ │
│                                            │
│ [+ Adicionar Título]                       │
└────────────────────────────────────────────┘
```

---

## 🔧 PRÓXIMOS PASSOS (Backend)

Após aplicar a migration, você precisará:

### 1. Criar Serviço de Títulos
Arquivo: `src/services/animalTitlesService.ts`

```typescript
import { supabase } from '@/integrations/supabase/client';
import type { AnimalTitle } from '@/types/animal';

export const animalTitlesService = {
  // Buscar títulos de um animal
  async getTitles(animalId: string): Promise<AnimalTitle[]> {
    const { data, error } = await supabase
      .from('animal_titles')
      .select('*')
      .eq('animal_id', animalId)
      .order('event_date', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  // Salvar títulos de um animal
  async saveTitles(animalId: string, titles: AnimalTitle[]): Promise<void> {
    // Deletar títulos antigos
    await supabase
      .from('animal_titles')
      .delete()
      .eq('animal_id', animalId);
    
    // Inserir novos títulos
    if (titles.length > 0) {
      const { error } = await supabase
        .from('animal_titles')
        .insert(titles.map(t => ({
          animal_id: animalId,
          event_name: t.event_name,
          event_date: t.event_date,
          award: t.award,
          notes: t.notes || null
        })));
      
      if (error) throw error;
    }
  }
};
```

### 2. Atualizar PublishAnimalPage
Arquivo: `src/pages/PublishAnimalPage.tsx`

Modificar para salvar títulos após criar o animal:

```typescript
// Após criar o animal
const { data: newAnimal, error: animalError } = await supabase
  .from('animals')
  .insert({...})
  .select()
  .single();

if (!animalError && newAnimal) {
  // Salvar títulos
  await animalTitlesService.saveTitles(
    newAnimal.id,
    animalData.titles
  );
}
```

---

## 🧪 TESTAR O SISTEMA

### Teste 1: Criar Animal com Títulos
1. Dashboard → "Adicionar Equino"
2. Preencha informações básicas
3. Vá até "Títulos e Conquistas"
4. Clique em "+ Adicionar Título"
5. Preencha:
   - Nome do Evento: "52ª Exposição Nacional do Agronegócio"
   - Data: "2018-10-03"
   - Premiação: "RESERV.CAMPEÃ PROGÊNIE PAI"
6. Salve o animal
7. Verifique no banco:
   ```sql
   SELECT * FROM animal_titles 
   WHERE animal_id = 'uuid-do-animal';
   ```

### Teste 2: Ver Títulos na Listagem
```sql
-- Ver animais com seus títulos
SELECT 
  a.name,
  a.breed,
  json_agg(
    json_build_object(
      'event_name', at.event_name,
      'event_date', at.event_date,
      'award', at.award
    )
  ) as titles
FROM animals a
LEFT JOIN animal_titles at ON a.id = at.animal_id
GROUP BY a.id, a.name, a.breed;
```

---

## ⚠️ IMPORTANTE

### Não Deletar Coluna `titles` Ainda
A coluna `animals.titles` (TEXT[]) ainda existe. **NÃO DELETE** até:
1. Migrar todos os títulos antigos
2. Atualizar todas as queries do sistema
3. Testar completamente a nova estrutura
4. Fazer backup do banco

### Quando Deletar (Futuro)
```sql
-- SOMENTE APÓS VALIDAÇÃO COMPLETA
ALTER TABLE animals DROP COLUMN titles;
```

---

## 📊 VANTAGENS DA NOVA ESTRUTURA

### Antes (TEXT[])
```
titles: ['Campeão 2023', 'Reserva 2022']
```
❌ Sem contexto (qual evento? quando?)  
❌ Difícil de ordenar por data  
❌ Sem informações adicionais  

### Depois (Tabela Dedicada)
```json
[
  {
    "event_name": "52ª Exposição Nacional",
    "event_date": "2018-10-03",
    "award": "RESERV.CAMPEÃ PROGÊNIE PAI"
  }
]
```
✅ Contexto completo  
✅ Ordenação por data  
✅ Campos adicionais (notas, certificados)  
✅ Queries mais ricas  

---

## 🎯 CHECKLIST

- [ ] Migration aplicada no Supabase
- [ ] Tabela `animal_titles` criada
- [ ] RLS Policies ativas
- [ ] View `animals_with_titles` disponível
- [ ] Serviço `animalTitlesService.ts` criado
- [ ] `PublishAnimalPage.tsx` atualizado
- [ ] Testado: criar animal com títulos
- [ ] Testado: editar títulos existentes
- [ ] Testado: visualizar títulos
- [ ] Documentação atualizada

---

## 📞 SUPORTE

Se encontrar erros:

### Erro: "relation animal_titles does not exist"
**Solução:** A migration não foi aplicada. Execute o SQL novamente.

### Erro: "permission denied for table animal_titles"
**Solução:** Execute o GRANT:
```sql
GRANT SELECT, INSERT, UPDATE, DELETE ON animal_titles TO authenticated;
```

### Erro: "RLS policy violation"
**Solução:** Verifique se as policies foram criadas:
```sql
SELECT * FROM pg_policies WHERE tablename = 'animal_titles';
```

---

**Migration pronta! Aplique no Supabase e depois atualize o código de salvamento!** 🚀

