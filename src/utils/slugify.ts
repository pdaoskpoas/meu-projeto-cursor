/**
 * Gera slug amigável para SEO a partir de um texto
 * 
 * @param text - Texto para converter em slug
 * @returns Slug formatado (ex: "titulo-do-artigo")
 */
export const slugify = (text: string): string => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    // Remove acentos
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    // Remove caracteres especiais
    .replace(/[^\w\s-]/g, '')
    // Substitui espaços por hífens
    .replace(/\s+/g, '-')
    // Remove hífens duplicados
    .replace(/--+/g, '-')
    // Remove hífens no início e fim
    .replace(/^-+|-+$/g, '');
};

/**
 * Gera slug único adicionando sufixo numérico se necessário
 * 
 * @param baseSlug - Slug base
 * @param existingSlugs - Lista de slugs existentes
 * @returns Slug único
 */
export const generateUniqueSlug = (baseSlug: string, existingSlugs: string[]): string => {
  let slug = baseSlug;
  let counter = 1;

  while (existingSlugs.includes(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
};



