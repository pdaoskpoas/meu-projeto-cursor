import { sb, SITE } from './_lib/supabase.js';
import { renderHtml, notFoundHtml, esc, stripHtml, truncate, absoluteUrl, canonical } from './_lib/seo.js';

export const config = { runtime: 'nodejs' };

const CACHE = 'public, s-maxage=3600, stale-while-revalidate=86400';
const CACHE_404 = 'public, s-maxage=300, stale-while-revalidate=3600';

export default async function handler(req: any, res: any) {
  try {
    const path = (req.query?.path as string) || '/';
    const m =
      matchAnimal(path) ||
      matchHaras(path) ||
      matchArticle(path) ||
      matchEvent(path) ||
      matchProfile(path) ||
      matchLinktree(path);

    if (!m) return sendHome(res, path);

    const html = await m();
    if (!html) return send404(res, path);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', CACHE);
    res.setHeader('X-Robots-Tag', 'index,follow,max-image-preview:large');
    return res.status(200).send(html);
  } catch (err) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(500).send(renderHtml({
      title: 'Erro — Vitrine do Cavalo',
      description: 'Erro temporário ao carregar a página.',
      path: (req.query?.path as string) || '/',
      noindex: true,
    }));
  }
}

function send404(res: any, path: string) {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', CACHE_404);
  res.setHeader('X-Robots-Tag', 'noindex');
  return res.status(404).send(notFoundHtml(path));
}

function sendHome(res: any, path: string) {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', CACHE);
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Vitrine do Cavalo',
      url: SITE,
      potentialAction: {
        '@type': 'SearchAction',
        target: `${SITE}/buscar?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Vitrine do Cavalo',
      url: SITE,
      logo: `${SITE}/logo.png.png`,
      sameAs: ['https://www.instagram.com/vitrinedocavalo'],
    },
  ];
  return res.status(200).send(renderHtml({
    title: 'Vitrine do Cavalo — Plataforma Premium de Gestão Equestre',
    description: 'A plataforma mais completa do mercado equestre brasileiro. Conectamos criadores de excelência com compradores qualificados através de uma rede segura e verificada.',
    path: path || '/',
    type: 'website',
    jsonLd,
  }));
}

/* ---------- entity matchers ---------- */

function matchAnimal(path: string) {
  const m = path.match(/^\/animal\/([^\/]+)\/?$/);
  if (!m) return null;
  return async () => {
    const raw = safeDecode(m[1]);
    const cols = 'id,name,breed,gender,birth_date,description,images,haras_name,haras_id,category,registration_number,ad_status,updated_at,published_at,current_city,current_state,titles,father_name,mother_name';
    const q = sb().from('animals').select(cols);
    const filter = isUuid(raw)
      ? q.or(`id.eq.${raw},share_code.eq.${encodeFilter(raw)}`)
      : q.eq('share_code', raw);
    const { data } = await filter.limit(1).maybeSingle();
    if (!data || data.ad_status === 'suspended' || data.ad_status === 'deleted') return null;

    const img = firstImage(data.images);
    const age = data.birth_date ? yearsFrom(data.birth_date) : null;
    const loc = [data.current_city, data.current_state].filter(Boolean).join(' / ');
    const title = `${data.name} — ${data.breed}${data.gender ? ', ' + data.gender : ''} | Vitrine do Cavalo`;
    const desc = truncate(
      data.description ||
      `${data.name}, ${data.breed}${data.gender ? ', ' + data.gender : ''}${age ? `, ${age} anos` : ''}${data.haras_name ? `. Criador: ${data.haras_name}` : ''}${loc ? `. ${loc}` : ''}.`,
      160
    );

    const jsonLd: any[] = [
      {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: data.name,
        image: img ? [absoluteUrl(img)] : undefined,
        description: desc,
        sku: data.registration_number || data.id,
        brand: data.haras_name ? { '@type': 'Organization', name: data.haras_name } : undefined,
        additionalProperty: [
          { '@type': 'PropertyValue', name: 'Raça', value: data.breed },
          data.gender && { '@type': 'PropertyValue', name: 'Sexo', value: data.gender },
          data.birth_date && { '@type': 'PropertyValue', name: 'Nascimento', value: data.birth_date },
          data.category && { '@type': 'PropertyValue', name: 'Categoria', value: data.category },
          data.registration_number && { '@type': 'PropertyValue', name: 'Registro', value: data.registration_number },
        ].filter(Boolean),
      },
      breadcrumb([
        { name: 'Início', url: `${SITE}/` },
        { name: data.breed, url: `${SITE}/buscar/${encodeURIComponent(String(data.breed).toLowerCase())}` },
        { name: data.name, url: `${SITE}/animal/${data.id}` },
      ]),
    ];

    const body = `
<article>
<h1>${esc(data.name)}</h1>
<p>${esc(desc)}</p>
<ul>
<li><strong>Raça:</strong> ${esc(data.breed)}</li>
${data.gender ? `<li><strong>Sexo:</strong> ${esc(data.gender)}</li>` : ''}
${data.birth_date ? `<li><strong>Nascimento:</strong> ${esc(data.birth_date)}</li>` : ''}
${data.registration_number ? `<li><strong>Registro:</strong> ${esc(data.registration_number)}</li>` : ''}
${data.father_name ? `<li><strong>Pai:</strong> ${esc(data.father_name)}</li>` : ''}
${data.mother_name ? `<li><strong>Mãe:</strong> ${esc(data.mother_name)}</li>` : ''}
${data.haras_name ? `<li><strong>Criador:</strong> <a href="${SITE}/haras/${esc(data.haras_id || '')}">${esc(data.haras_name)}</a></li>` : ''}
${loc ? `<li><strong>Localização:</strong> ${esc(loc)}</li>` : ''}
</ul>
</article>`;

    return renderHtml({
      title,
      description: desc,
      path: `/animal/${data.id}`,
      image: img,
      imageAlt: data.name,
      type: 'product',
      publishedTime: data.published_at,
      modifiedTime: data.updated_at,
      jsonLd,
      bodyHtml: body,
    });
  };
}

function matchHaras(path: string) {
  const m = path.match(/^\/haras\/([^\/]+)\/?$/);
  if (!m) return null;
  return async () => {
    const raw = safeDecode(m[1]);
    const cols = 'id,name,property_name,avatar_url,public_code,account_type,is_active,is_suspended,updated_at';
    const q = sb().from('profiles').select(cols);
    const filter = isUuid(raw)
      ? q.or(`id.eq.${raw},public_code.eq.${encodeFilter(raw)}`)
      : q.eq('public_code', raw);
    const { data } = await filter.limit(1).maybeSingle();
    if (!data || data.is_suspended || data.is_active === false) return null;

    const displayName = data.property_name || data.name;
    const title = `${displayName} — Haras | Vitrine do Cavalo`;
    const desc = truncate(`Conheça ${displayName}, criador equestre na Vitrine do Cavalo. Veja animais, notícias e eventos relacionados.`, 160);

    const jsonLd = [
      {
        '@context': 'https://schema.org',
        '@type': data.account_type === 'institutional' ? 'Organization' : 'Person',
        name: displayName,
        url: `${SITE}/haras/${data.id}`,
        image: data.avatar_url ? absoluteUrl(data.avatar_url) : undefined,
      },
      breadcrumb([
        { name: 'Início', url: `${SITE}/` },
        { name: displayName, url: `${SITE}/haras/${data.id}` },
      ]),
    ];

    const body = `
<article>
<h1>${esc(displayName)}</h1>
<p>${esc(desc)}</p>
</article>`;

    return renderHtml({
      title,
      description: desc,
      path: `/haras/${data.id}`,
      image: data.avatar_url,
      imageAlt: displayName,
      type: 'profile',
      modifiedTime: data.updated_at,
      jsonLd,
      bodyHtml: body,
    });
  };
}

function matchArticle(path: string) {
  const m = path.match(/^\/noticias\/([^\/]+)\/?$/);
  if (!m) return null;
  return async () => {
    const slug = safeDecode(m[1]);
    if (!isUuid(slug)) return null;
    const { data } = await sb()
      .from('articles')
      .select('id,title,excerpt,content,cover_image_url,is_published,published_at,updated_at,tags,author_id,profiles:author_id(name,property_name,avatar_url)')
      .eq('id', slug)
      .eq('is_published', true)
      .limit(1)
      .maybeSingle();
    if (!data) return null;

    const plain = stripHtml(data.content);
    const desc = truncate(data.excerpt || plain, 160);
    const title = `${data.title} | Vitrine do Cavalo`;
    const author: any = Array.isArray(data.profiles) ? data.profiles[0] : data.profiles;
    const authorName = author?.property_name || author?.name || 'Redação';

    const jsonLd = [
      {
        '@context': 'https://schema.org',
        '@type': 'NewsArticle',
        headline: data.title,
        description: desc,
        image: data.cover_image_url ? [absoluteUrl(data.cover_image_url)] : undefined,
        datePublished: data.published_at,
        dateModified: data.updated_at || data.published_at,
        author: { '@type': 'Person', name: authorName },
        publisher: {
          '@type': 'Organization',
          name: 'Vitrine do Cavalo',
          logo: { '@type': 'ImageObject', url: `${SITE}/logo.png.png` },
        },
        mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE}/noticias/${data.id}` },
        keywords: data.tags?.join(', '),
      },
      breadcrumb([
        { name: 'Início', url: `${SITE}/` },
        { name: 'Notícias', url: `${SITE}/noticias` },
        { name: data.title, url: `${SITE}/noticias/${data.id}` },
      ]),
    ];

    const body = `
<article>
<h1>${esc(data.title)}</h1>
<p><em>Publicado em ${esc(data.published_at)} por ${esc(authorName)}</em></p>
<p>${esc(desc)}</p>
<div>${esc(truncate(plain, 1200))}</div>
</article>`;

    return renderHtml({
      title,
      description: desc,
      path: `/noticias/${data.id}`,
      image: data.cover_image_url,
      imageAlt: data.title,
      type: 'article',
      publishedTime: data.published_at,
      modifiedTime: data.updated_at,
      jsonLd,
      bodyHtml: body,
    });
  };
}

function matchEvent(path: string) {
  const m = path.match(/^\/eventos\/([^\/]+)\/?$/);
  if (!m) return null;
  return async () => {
    const param = safeDecode(m[1]);
    if (!param) return null;
    const query = sb()
      .from('events')
      .select('id,slug,title,description,cover_image_url,start_date,end_date,city,state,location,ad_status,published_at,updated_at');
    const { data } = isUuid(param)
      ? await query.eq('id', param).limit(1).maybeSingle()
      : await query.eq('slug', param).limit(1).maybeSingle();
    if (!data || data.ad_status === 'suspended' || data.ad_status === 'deleted') return null;

    const place = [data.location, data.city, data.state].filter(Boolean).join(', ');
    const desc = truncate(data.description || `${data.title} — ${place || 'evento equestre'}.`, 160);
    const title = `${data.title}${data.start_date ? ' — ' + formatDate(data.start_date) : ''} | Vitrine do Cavalo`;

    const jsonLd = [
      {
        '@context': 'https://schema.org',
        '@type': 'Event',
        name: data.title,
        description: desc,
        startDate: data.start_date,
        endDate: data.end_date || data.start_date,
        eventStatus: 'https://schema.org/EventScheduled',
        eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
        image: data.cover_image_url ? [absoluteUrl(data.cover_image_url)] : undefined,
        location: {
          '@type': 'Place',
          name: data.location || data.city || 'Brasil',
          address: {
            '@type': 'PostalAddress',
            addressLocality: data.city,
            addressRegion: data.state,
            addressCountry: 'BR',
          },
        },
        organizer: { '@type': 'Organization', name: 'Vitrine do Cavalo', url: SITE },
      },
      breadcrumb([
        { name: 'Início', url: `${SITE}/` },
        { name: 'Eventos', url: `${SITE}/eventos` },
        { name: data.title, url: `${SITE}/eventos/${data.slug || data.id}` },
      ]),
    ];

    const body = `
<article>
<h1>${esc(data.title)}</h1>
<p><time datetime="${esc(data.start_date)}">${esc(formatDate(data.start_date))}</time>${data.end_date ? ' — <time datetime="' + esc(data.end_date) + '">' + esc(formatDate(data.end_date)) + '</time>' : ''}</p>
${place ? `<p><strong>Local:</strong> ${esc(place)}</p>` : ''}
<p>${esc(desc)}</p>
</article>`;

    return renderHtml({
      title,
      description: desc,
      path: `/eventos/${data.slug || data.id}`,
      image: data.cover_image_url,
      imageAlt: data.title,
      type: 'article',
      publishedTime: data.published_at,
      modifiedTime: data.updated_at,
      jsonLd,
      bodyHtml: body,
    });
  };
}

function matchProfile(path: string) {
  const m = path.match(/^\/profile\/([^\/]+)\/?$/);
  if (!m) return null;
  return async () => {
    const code = safeDecode(m[1]);
    const { data } = await sb()
      .from('profiles')
      .select('id,name,property_name,avatar_url,public_code,is_active,is_suspended,updated_at')
      .eq('public_code', code)
      .limit(1)
      .maybeSingle();
    if (!data || data.is_suspended || data.is_active === false) return null;
    const display = data.property_name || data.name;
    const desc = truncate(`Perfil público de ${display} na Vitrine do Cavalo.`, 160);
    return renderHtml({
      title: `${display} | Vitrine do Cavalo`,
      description: desc,
      path: `/profile/${code}`,
      image: data.avatar_url,
      imageAlt: display,
      type: 'profile',
      modifiedTime: data.updated_at,
      jsonLd: breadcrumb([
        { name: 'Início', url: `${SITE}/` },
        { name: display, url: `${SITE}/profile/${code}` },
      ]),
    });
  };
}

function matchLinktree(path: string) {
  const m = path.match(/^\/u\/([^\/]+)\/?$/);
  if (!m) return null;
  return async () => {
    const slug = safeDecode(m[1]);
    const { data } = await sb()
      .from('profiles')
      .select('id,name,property_name,avatar_url,public_code,is_active,is_suspended,updated_at')
      .eq('public_code', slug)
      .limit(1)
      .maybeSingle();
    if (!data || data.is_suspended || data.is_active === false) return null;
    const display = data.property_name || data.name;
    return renderHtml({
      title: `${display} — Vitrine do Cavalo`,
      description: truncate(`Links e conteúdos de ${display}.`, 160),
      path: `/u/${slug}`,
      image: data.avatar_url,
      imageAlt: display,
      type: 'profile',
      modifiedTime: data.updated_at,
    });
  };
}

/* ---------- utils ---------- */

function firstImage(images: any): string | null {
  if (!images) return null;
  if (typeof images === 'string') return images;
  if (Array.isArray(images)) {
    const first = images[0];
    if (!first) return null;
    if (typeof first === 'string') return first;
    return first.url || first.src || first.path || null;
  }
  if (typeof images === 'object') return images.url || images.src || null;
  return null;
}

function yearsFrom(date: string): number | null {
  const d = new Date(date);
  if (isNaN(d.getTime())) return null;
  return Math.max(0, new Date().getFullYear() - d.getFullYear());
}

function formatDate(d: string | null | undefined): string {
  if (!d) return '';
  try {
    return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return d;
  }
}

function breadcrumb(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: it.url,
    })),
  };
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUuid(s: string): boolean {
  return UUID_RE.test(s);
}

function safeDecode(s: string): string {
  try { return decodeURIComponent(s); } catch { return s; }
}

function encodeFilter(s: string): string {
  return s.replace(/[,()"']/g, '');
}
