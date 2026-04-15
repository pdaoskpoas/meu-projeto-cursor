import { SITE } from './_lib/supabase';

export const config = { runtime: 'nodejs' };

export default function handler(_req: any, res: any) {
  const urls = [
    { loc: '/', changefreq: 'daily', priority: '1.0' },
    { loc: '/buscar', changefreq: 'daily', priority: '0.9' },
    { loc: '/noticias', changefreq: 'daily', priority: '0.8' },
    { loc: '/eventos', changefreq: 'weekly', priority: '0.8' },
    { loc: '/ranking', changefreq: 'daily', priority: '0.8' },
    { loc: '/planos', changefreq: 'monthly', priority: '0.6' },
    { loc: '/sobre', changefreq: 'monthly', priority: '0.5' },
    { loc: '/ajuda', changefreq: 'monthly', priority: '0.4' },
  ];
  const now = new Date().toISOString();
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${SITE}${u.loc}</loc><lastmod>${now}</lastmod><changefreq>${u.changefreq}</changefreq><priority>${u.priority}</priority></url>`).join('\n')}
</urlset>`;
  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800');
  return res.status(200).send(xml);
}
