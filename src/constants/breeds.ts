/**
 * Lista completa de raças permitidas para cadastro de animais
 * Esta lista deve ser sincronizada com o constraint do banco de dados
 */
export const HORSE_BREEDS = [
  'Brasileiro de Hipismo',
  'Campolina',
  'Mangalarga Marchador',
  'Mangalarga Paulista',
  'Pônei Brasileiro',
  'Quarto de Milha',
  'Árabe',
  'Andaluz',
  'Puro-Sangue Inglês',
  'Crioulo',
  'Appaloosa',
  'Paint Horse',
  'Friesian',
  'Bretão',
  'Percheron',
  'Morgan'
] as const;

export type HorseBreed = typeof HORSE_BREEDS[number];

/**
 * Raças com animais registrados — exibidas na home.
 * Adicionar novas raças conforme forem tendo cadastros.
 */
export const POPULAR_BREEDS = [
  'Mangalarga Marchador',
] as const;




