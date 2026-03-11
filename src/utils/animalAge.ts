export const getAge = (birthDate: string): string => {
  return getDetailedAge(birthDate);
};

const getUnitLabel = (value: number, singular: string, plural: string): string =>
  `${value} ${value === 1 ? singular : plural}`;

export const getDetailedAge = (birthDate: string): string => {
  const birth = new Date(birthDate);
  if (Number.isNaN(birth.getTime())) return 'Idade não informada';

  const today = new Date();
  const safeToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const safeBirth = new Date(birth.getFullYear(), birth.getMonth(), birth.getDate());

  if (safeBirth > safeToday) return '0 dias';

  let years = safeToday.getFullYear() - safeBirth.getFullYear();
  let months = safeToday.getMonth() - safeBirth.getMonth();
  let days = safeToday.getDate() - safeBirth.getDate();

  if (days < 0) {
    months -= 1;
    const previousMonthLastDay = new Date(
      safeToday.getFullYear(),
      safeToday.getMonth(),
      0
    ).getDate();
    days += previousMonthLastDay;
  }

  if (months < 0) {
    years -= 1;
    months += 12;
  }

  const parts: string[] = [];
  if (years > 0) parts.push(getUnitLabel(years, 'ano', 'anos'));
  if (months > 0) parts.push(getUnitLabel(months, 'mês', 'meses'));
  if (days > 0 || parts.length === 0) parts.push(getUnitLabel(days, 'dia', 'dias'));

  if (parts.length === 1) return parts[0];
  if (parts.length === 2) return `${parts[0]} e ${parts[1]}`;
  return `${parts[0]}, ${parts[1]} e ${parts[2]}`;
};