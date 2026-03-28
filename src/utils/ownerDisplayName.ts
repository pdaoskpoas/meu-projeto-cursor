/**
 * Utilitário para determinar o nome de exibição correto do proprietário
 * 
 * Regras:
 * - Perfil Institucional (institutional) → Exibe property_name (nome da propriedade: haras, fazenda, CTE, central de reprodução, etc.)
 * - Perfil Pessoal (personal) → Exibe name (nome da pessoa)
 * 
 * @param accountType - Tipo de conta do proprietário ('personal' | 'institutional')
 * @param personalName - Nome pessoal do proprietário
 * @param propertyName - Nome da propriedade institucional (haras, fazenda, CTE, central de reprodução, etc.)
 * @returns Nome correto para exibição
 */
import { formatNameUppercase } from '@/utils/nameFormat';

export function getOwnerDisplayName(
  accountType: string | null | undefined,
  personalName: string | null | undefined,
  propertyName: string | null | undefined
): string {
  // Se não tiver tipo de conta, assume pessoal
  const type = accountType || 'personal';

  // Perfil institucional: prioriza nome da propriedade
  if (type === 'institutional') {
    const displayName = propertyName || personalName || 'Proprietário não informado';
    return formatNameUppercase(displayName);
  }

  // Perfil pessoal: usa nome da pessoa, com fallback para nome da propriedade
  // (cobre o caso em que owner_account_type não está disponível na query)
  return personalName || propertyName || 'Proprietário não informado';
}

/**
 * Variação simplificada para objetos que já têm os campos mapeados
 */
export function getOwnerDisplayNameFromAnimal(animal: {
  owner_account_type?: string | null;
  owner_name?: string | null;
  owner_property_name?: string | null;
}): string {
  return getOwnerDisplayName(
    animal.owner_account_type,
    animal.owner_name,
    animal.owner_property_name
  );
}

