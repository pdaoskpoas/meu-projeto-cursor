import { SITE } from './supabase.js';

export function esc(s: unknown): string {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function truncate(s: string | null | undefined, max = 160): string {
  const t = (s || '').replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  return t.slice(0, max - 1).replace(/\s+\S*$/, '') + '…';
}

export function stripHtml(s: string | null | undefined): string {
  return (s || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

export function absoluteUrl(path: string): string {
  if (!path) return SITE + '/';
  if (/^https?:\/\//i.test(path)) return path;
  return SITE + (path.startsWith('/') ? path : '/' + path);
}

export function canonical(pathname: string): string {
  const clean = pathname.split('?')[0].split('#')[0];
  return SITE + (clean.startsWith('/') ? clean : '/' + clean);
}

type MetaInput = {
  title: string;
  description: string;
  path: string;
  image?: string | null;
  imageAlt?: string;
  type?: 'website' | 'article' | 'product' | 'profile';
  publishedTime?: string | null;
  modifiedTime?: string | null;
  locale?: string;
  noindex?: boolean;
  jsonLd?: object | object[];
  bodyHtml?: string;
};

export function renderHtml(m: MetaInput): string {
  const url = canonical(m.path);
  const img = m.image ? absoluteUrl(m.image) : `${SITE}/logo.png.png`;
  const locale = m.locale || 'pt_BR';
  const type = m.type || 'website';
  const title = esc(m.title);
  const desc = esc(truncate(m.description, 160));
  const jsonLdArr = Array.isArray(m.jsonLd) ? m.jsonLd : m.jsonLd ? [m.jsonLd] : [];
  const jsonLd = jsonLdArr
    .map((o) => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, '\\u003c')}</script>`)
    .join('');
  const robots = m.noindex ? 'noindex,nofollow' : 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1';
  const published = m.publishedTime ? `<meta property="article:published_time" content="${esc(m.publishedTime)}">` : '';
  const modified = m.modifiedTime ? `<meta property="article:modified_time" content="${esc(m.modifiedTime)}">` : '';

  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
<meta name="description" content="${desc}">
<meta name="robots" content="${robots}">
<link rel="canonical" href="${esc(url)}">
<meta property="og:site_name" content="Vitrine do Cavalo">
<meta property="og:locale" content="${esc(locale)}">
<meta property="og:type" content="${esc(type)}">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${desc}">
<meta property="og:url" content="${esc(url)}">
<meta property="og:image" content="${esc(img)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${esc(m.imageAlt || m.title)}">
${published}${modified}
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:site" content="@vitrinedocavalo">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${desc}">
<meta name="twitter:image" content="${esc(img)}">
${jsonLd}
</head>
<body>
<main>
${m.bodyHtml || `<h1>${title}</h1><p>${desc}</p><p><a href="${esc(url)}">${esc(url)}</a></p>`}
</main>
</body>
</html>`;
}

export function notFoundHtml(path: string): string {
  return renderHtml({
    title: 'Página não encontrada | Vitrine do Cavalo',
    description: 'A página solicitada não existe ou foi removida.',
    path,
    noindex: true,
    bodyHtml: `<h1>404 — Página não encontrada</h1><p>Volte para <a href="${SITE}/">${SITE}/</a>.</p>`,
  });
}
