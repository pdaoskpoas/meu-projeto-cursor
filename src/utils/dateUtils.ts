/**
 * Utilitários para manipulação de datas e cálculo de idade
 */

/**
 * Calcula a idade em anos e meses a partir da data de nascimento
 * @param birthDate - Data de nascimento no formato YYYY-MM-DD ou objeto Date
 * @returns Objeto com anos e meses, ou null se data inválida
 */
export function calculateAge(birthDate: string | Date | null | undefined): { years: number; months: number } | null {
  if (!birthDate) return null;

  try {
    const birth = typeof birthDate === 'string' ? new Date(birthDate) : birthDate;
    const today = new Date();

    // Verificar se a data é válida
    if (isNaN(birth.getTime())) return null;

    // Calcular diferença
    let years = today.getFullYear() - birth.getFullYear();
    let months = today.getMonth() - birth.getMonth();

    // Ajustar se os meses forem negativos
    if (months < 0) {
      years--;
      months += 12;
    }

    // Ajustar se o dia do mês ainda não passou
    if (today.getDate() < birth.getDate()) {
      months--;
      if (months < 0) {
        years--;
        months += 12;
      }
    }

    return { years, months };
  } catch (error) {
    console.error('Erro ao calcular idade:', error);
    return null;
  }
}

/**
 * Formata a idade de forma legível
 * @param birthDate - Data de nascimento
 * @returns String formatada (ex: "5 anos e 3 meses", "2 anos", "8 meses")
 */
export function formatAge(birthDate: string | Date | null | undefined): string {
  const age = calculateAge(birthDate);
  
  if (!age) return 'Idade não informada';

  const { years, months } = age;

  if (years === 0 && months === 0) {
    return 'Recém-nascido';
  }

  if (years === 0) {
    return `${months} ${months === 1 ? 'mês' : 'meses'}`;
  }

  if (months === 0) {
    return `${years} ${years === 1 ? 'ano' : 'anos'}`;
  }

  return `${years} ${years === 1 ? 'ano' : 'anos'} e ${months} ${months === 1 ? 'mês' : 'meses'}`;
}

/**
 * Formata a idade de forma compacta
 * @param birthDate - Data de nascimento
 * @returns String formatada (ex: "5 anos", "8 meses")
 */
export function formatAgeShort(birthDate: string | Date | null | undefined): string {
  const age = calculateAge(birthDate);
  
  if (!age) return '-';

  const { years, months } = age;

  if (years === 0 && months === 0) {
    return 'Recém-nascido';
  }

  if (years === 0) {
    return `${months} ${months === 1 ? 'mês' : 'meses'}`;
  }

  return `${years} ${years === 1 ? 'ano' : 'anos'}`;
}

/**
 * Valida se a data de nascimento é válida (não é futura e não é muito antiga)
 * @param birthDate - Data de nascimento
 * @returns true se válida, false caso contrário
 */
export function isValidBirthDate(birthDate: string | Date): boolean {
  try {
    const birth = typeof birthDate === 'string' ? new Date(birthDate) : birthDate;
    const today = new Date();
    const maxAge = 50; // Idade máxima razoável para cavalos

    if (isNaN(birth.getTime())) return false;
    
    // Não pode ser data futura
    if (birth > today) return false;

    // Não pode ser mais antigo que a idade máxima
    const age = calculateAge(birth);
    if (age && age.years > maxAge) return false;

    return true;
  } catch {
    return false;
  }
}

