export const getAge = (birthDate: string): string => {
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age -= 1;
  }

  if (age === 0) {
    let months = monthDiff;
    if (today.getDate() < birth.getDate()) {
      months -= 1;
    }
    if (months < 0) {
      months += 12;
    }
    return `${months} ${months === 1 ? 'mes' : 'meses'}`;
  }

  return `${age} ${age === 1 ? 'ano' : 'anos'}`;
};
