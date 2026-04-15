/**
 * Helpers para URLs semânticas (SEO-friendly) de animais e haras.
 *
 * Estratégia:
 *  - Animal: /animal/{slug-do-nome}-{share_code-sem-ANI}
 *    Ex: /animal/urano-do-haras-r3l4mp-25
 *    (share_code no banco: "ANI-R3L4MP-25")
 *
 *  - Haras/Perfil: /haras/{slug-do-nome}-{public_code}
 *    Ex: /haras/haras-monteiro-u2ab63325
 *    (public_code no banco: "U2AB63325" — formato [HU]\d{3}[A-Z]{3}\d{2})
 *
 * Compatibilidade:
 *  - URLs antigas com UUID continuam válidas (detecção por regex).
 *  - As páginas fazem redirect client-side (Navigate replace) de UUID -> URL canônica.
 */

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Tail do share_code (sem o prefixo ANI-): 6 alfanuméricos + "-" + 2 dígitos de ano
// Ex: "r3l4mp-25" — share_code completo é "ANI-R3L4MP-25"
// Nota: o charset inclui A-Z0-9 completo (não só hex) porque existem múltiplos
// geradores (MD5 substring no SQL, Math.random no cliente) com formatos diferentes.
const ANIMAL_CODE_TAIL_REGEX = /-([a-z0-9]{6})-(\d{2})$/i;

// Public code de perfil: [HU] + 5-6 alfanuméricos (substring do UUID, hex normalmente)
// + 2 dígitos de ano. Ex: "h25dcf26" (8 chars) ou "h123abc25" (9 chars).
// Ver migração 008: generate_public_code.
// Nota: charset alfanumérico (a-z0-9) — não só hex — para tolerar códigos legados
// ou casos onde o UPPER/REPLACE do SQL produziu chars fora do alfabeto hex.
const HARAS_CODE_TAIL_REGEX = /-([hu][a-z0-9]{5,6}\d{2})$/i;
const HARAS_CODE_STANDALONE_REGEX = /^[hu][a-z0-9]{5,6}\d{2}$/i;

/**
 * Converte string em slug URL-safe.
 * "Urano do Haras São Paulo" -> "urano-do-haras-sao-paulo"
 */
export const slugify = (text: string | null | undefined): string => {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .replace(/&/g, '-e-')
    .replace(/[^a-z0-9\s-]/g, '') // só letras, dígitos, espaço e hífen
    .trim()
    .replace(/\s+/g, '-') // espaços -> hífens
    .replace(/-+/g, '-') // hífens múltiplos -> um
    .replace(/^-+|-+$/g, ''); // remove hífens das pontas
};

export const isUuid = (value: string | null | undefined): boolean => {
  return !!value && UUID_REGEX.test(value);
};

/* ============================================================
 * ANIMAL
 * ============================================================ */

interface AnimalLike {
  id?: string | null;
  name?: string | null;
  share_code?: string | null;
  shareCode?: string | null;
}

/**
 * Monta a URL canônica de um animal.
 * Se o animal não tiver share_code (legado), usa o UUID como fallback.
 */
export const buildAnimalUrl = (animal: AnimalLike | null | undefined): string => {
  if (!animal) return '/';
  const shareCode = (animal.share_code ?? animal.shareCode ?? '').trim();

  // Sem share_code -> fallback para UUID (URL antiga continua válida)
  if (!shareCode) return `/animal/${animal.id ?? ''}`;

  // Remove prefixo "ANI-" e lowercase: "ANI-R3L4MP-25" -> "r3l4mp-25"
  const tail = shareCode.replace(/^ANI-/i, '').toLowerCase();
  const slug = slugify(animal.name);

  return slug ? `/animal/${slug}-${tail}` : `/animal/${tail}`;
};

/**
 * Interpreta o parâmetro :id da rota /animal/:id.
 * Retorna o tipo do identificador e o valor usável para query no banco.
 */
export type AnimalParam =
  | { kind: 'uuid'; uuid: string }
  | { kind: 'shareCode'; shareCode: string }
  | { kind: 'invalid' };

export const parseAnimalParam = (param: string | undefined): AnimalParam => {
  if (!param) return { kind: 'invalid' };

  if (isUuid(param)) {
    return { kind: 'uuid', uuid: param };
  }

  const match = param.match(ANIMAL_CODE_TAIL_REGEX);
  if (match) {
    const [, chars, year] = match;
    return { kind: 'shareCode', shareCode: `ANI-${chars.toUpperCase()}-${year}` };
  }

  return { kind: 'invalid' };
};

/* ============================================================
 * HARAS / PERFIL
 * ============================================================ */

interface HarasLike {
  id?: string | null;
  name?: string | null;
  property_name?: string | null;
  propertyName?: string | null;
  account_type?: string | null;
  accountType?: string | null;
  public_code?: string | null;
  publicCode?: string | null;
}

/**
 * Monta a URL canônica de um haras/perfil.
 * Para perfis institucionais usa property_name; pessoais, name.
 */
export const buildHarasUrl = (profile: HarasLike | null | undefined): string => {
  if (!profile) return '/';

  const publicCode = (profile.public_code ?? profile.publicCode ?? '').trim();

  // Sem public_code -> fallback para UUID
  if (!publicCode) return `/haras/${profile.id ?? ''}`;

  const accountType = profile.account_type ?? profile.accountType;
  const displayName =
    accountType === 'institutional'
      ? profile.property_name ?? profile.propertyName ?? profile.name
      : profile.name ?? profile.property_name ?? profile.propertyName;

  const slug = slugify(displayName);
  const code = publicCode.toLowerCase();

  return slug ? `/haras/${slug}-${code}` : `/haras/${code}`;
};

export type HarasParam =
  | { kind: 'uuid'; uuid: string }
  | { kind: 'publicCode'; publicCode: string }
  | { kind: 'invalid' };

export const parseHarasParam = (param: string | undefined): HarasParam => {
  if (!param) return { kind: 'invalid' };

  if (isUuid(param)) {
    return { kind: 'uuid', uuid: param };
  }

  const match = param.match(HARAS_CODE_TAIL_REGEX);
  if (match) {
    const [, code] = match;
    return { kind: 'publicCode', publicCode: code.toUpperCase() };
  }

  // Edge case: URL pode ser só o código puro (sem slug), ex: /haras/h25dcf26
  if (HARAS_CODE_STANDALONE_REGEX.test(param)) {
    return { kind: 'publicCode', publicCode: param.toUpperCase() };
  }

  return { kind: 'invalid' };
};

/* ============================================================
 * EVENTO
 * ============================================================
 * Padrão: /eventos/{slug-do-titulo}
 * Ex: /eventos/copa-do-brasil-2026
 *
 * Compatibilidade: URLs antigas com UUID continuam válidas — a
 * página faz redirect client-side (Navigate replace) para a URL
 * canônica com slug.
 */

interface EventLike {
  id?: string | null;
  title?: string | null;
  slug?: string | null;
}

/**
 * Monta a URL canônica de um evento.
 * Prioriza o campo `slug` do banco. Se não houver (legado), usa
 * UUID como fallback.
 */
export const buildEventUrl = (event: EventLike | null | undefined): string => {
  if (!event) return '/';
  const slug = (event.slug ?? '').trim();
  if (slug) return `/eventos/${slug}`;
  // Fallback: gera slug a partir do title; se falhar, usa UUID.
  const fromTitle = slugify(event.title);
  if (fromTitle) return `/eventos/${fromTitle}`;
  return `/eventos/${event.id ?? ''}`;
};

export type EventParam =
  | { kind: 'uuid'; uuid: string }
  | { kind: 'slug'; slug: string }
  | { kind: 'invalid' };

/**
 * Interpreta o parâmetro :slug da rota /eventos/:slug.
 * UUIDs (URLs antigas) são detectados e sinalizados para redirect.
 */
export const parseEventParam = (param: string | undefined): EventParam => {
  if (!param) return { kind: 'invalid' };
  if (isUuid(param)) return { kind: 'uuid', uuid: param };
  return { kind: 'slug', slug: param.toLowerCase() };
};
