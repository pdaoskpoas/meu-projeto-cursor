import { Helmet } from 'react-helmet-async';

const SITE = 'https://www.vitrinedocavalo.com.br';

type Props = {
  title: string;
  description: string;
  path: string;
  image?: string | null;
  imageAlt?: string;
  type?: 'website' | 'article' | 'product' | 'profile';
  publishedTime?: string | null;
  modifiedTime?: string | null;
  noindex?: boolean;
  jsonLd?: object | object[];
};

function absolute(u?: string | null): string {
  if (!u) return `${SITE}/logo.png.png`;
  if (/^https?:\/\//i.test(u)) return u;
  return SITE + (u.startsWith('/') ? u : '/' + u);
}

function truncate(s: string, n = 160): string {
  const t = s.replace(/\s+/g, ' ').trim();
  return t.length <= n ? t : t.slice(0, n - 1).replace(/\s+\S*$/, '') + '…';
}

export default function SEO(p: Props) {
  const url = SITE + (p.path.startsWith('/') ? p.path : '/' + p.path);
  const img = absolute(p.image);
  const desc = truncate(p.description);
  const type = p.type || 'website';
  const robots = p.noindex
    ? 'noindex,nofollow'
    : 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1';
  const jsonLdArr = Array.isArray(p.jsonLd) ? p.jsonLd : p.jsonLd ? [p.jsonLd] : [];

  return (
    <Helmet>
      <title>{p.title}</title>
      <meta name="description" content={desc} />
      <meta name="robots" content={robots} />
      <link rel="canonical" href={url} />
      <meta property="og:site_name" content="Vitrine do Cavalo" />
      <meta property="og:locale" content="pt_BR" />
      <meta property="og:type" content={type} />
      <meta property="og:title" content={p.title} />
      <meta property="og:description" content={desc} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={img} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={p.imageAlt || p.title} />
      {p.publishedTime && <meta property="article:published_time" content={p.publishedTime} />}
      {p.modifiedTime && <meta property="article:modified_time" content={p.modifiedTime} />}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@vitrinedocavalo" />
      <meta name="twitter:title" content={p.title} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image" content={img} />
      {jsonLdArr.map((obj, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(obj).replace(/</g, '\\u003c')}
        </script>
      ))}
    </Helmet>
  );
}
