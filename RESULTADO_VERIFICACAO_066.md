# 🔍 VERIFICAÇÃO DA MIGRATION 066

**Como verificar:** Execute o arquivo `VERIFICAR_MIGRATION_066.sql` no Supabase SQL Editor

---

## ✅ O QUE DEVE APARECER

### 1. Tabela Criada
```
verificacao              | status
-------------------------|-------------
Tabela animal_titles     | ✅ EXISTE
```

### 2. Colunas (8 colunas)
```
column_name       | data_type              | is_nullable
------------------|------------------------|-------------
id                | uuid                   | NO
animal_id         | uuid                   | NO
event_name        | text                   | NO
event_date        | date                   | NO
award             | text                   | NO
notes             | text                   | YES
certificate_url   | text                   | YES
created_at        | timestamp with time zone| YES
updated_at        | timestamp with time zone| YES
```

### 3. RLS Habilitado
```
verificacao     | status
----------------|-------------
RLS Habilitado  | ✅ ATIVADO
```

### 4. Policies (4 policies)
```
nome_policy                      | comando | status
---------------------------------|---------|-------------------
animal_titles_select_policy      | SELECT  | ✅ Configurada
animal_titles_insert_policy      | INSERT  | ✅ Configurada
animal_titles_update_policy      | UPDATE  | ✅ Configurada
animal_titles_delete_policy      | DELETE  | ✅ Configurada
```

### 5. Índices (3 índices)
```
nome_indice                          | definição
-------------------------------------|----------------------------------
idx_animal_titles_animal_id          | CREATE INDEX ... ON animal_id
idx_animal_titles_event_date         | CREATE INDEX ... ON event_date DESC
idx_animal_titles_created_at         | CREATE INDEX ... ON created_at DESC
```

### 6. Trigger
```
trigger_name                               | event_manipulation
-------------------------------------------|-------------------
trigger_update_animal_titles_updated_at    | UPDATE
```

### 7. View
```
verificacao              | status
-------------------------|-------------
View animals_with_titles | ✅ EXISTE
```

### 8. Função de Migração
```
verificacao              | status
-------------------------|-------------
Função migrate_old_titles| ✅ EXISTE
```

### 9. Permissões
```
privilege_type | grantee
---------------|-------------
SELECT         | authenticated
INSERT         | authenticated
UPDATE         | authenticated
DELETE         | authenticated
```

### 10. Status Final
```
status_final
---------------------------------------------------
✅✅✅ MIGRATION 066 APLICADA COM SUCESSO! ✅✅✅
```

---

## ❌ SE DER ERRO

### Erro: "relation animal_titles does not exist"
**Solução:** A tabela não foi criada. Execute novamente o SQL da migration.

### Erro: "permission denied"
**Solução:** Execute o GRANT:
```sql
GRANT SELECT, INSERT, UPDATE, DELETE ON animal_titles TO authenticated;
```

### Erro: Policies não aparecem
**Solução:** Execute as policies manualmente do arquivo de migration.

### Erro: View não existe
**Solução:** Execute a criação da view:
```sql
CREATE OR REPLACE VIEW animals_with_titles AS
SELECT 
  a.*,
  COALESCE(
    json_agg(
      json_build_object(
        'id', at.id,
        'event_name', at.event_name,
        'event_date', at.event_date,
        'award', at.award,
        'notes', at.notes
      ) ORDER BY at.event_date DESC
    ) FILTER (WHERE at.id IS NOT NULL),
    '[]'::json
  ) as titles_detailed
FROM animals a
LEFT JOIN animal_titles at ON a.id = at.animal_id
GROUP BY a.id;
```

---

## 📋 APÓS VERIFICAÇÃO

Se tudo estiver ✅ OK:

1. ✅ Marque no checklist: Migration aplicada
2. ➡️ Próximo passo: Atualizar PublishAnimalPage
3. ➡️ Depois: Atualizar EditAnimalPage
4. ➡️ Testar sistema completo

---

**Execute o SQL de verificação e me envie o resultado!** 🚀

