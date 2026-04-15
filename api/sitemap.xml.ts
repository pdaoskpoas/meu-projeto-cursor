import { sb, SITE } from './_lib/supabase.js';

export const config = { runtime: 'nodejs' };

const PAGE_SIZE = 45000;

export default async function handler(_req: any, res: any) {
  try {
    const client = sb();
    const [animals, articles, events, profiles] = await Promise.all([
      client.from('animals').select('*', { count: 'exact', head: true }).neq('ad_status', 'suspended').neq('ad_status', 'deleted'),
      client.from('articles').select('*', { count: 'exact', head: true }).eq('is_published', true),
      client.from('events').select('*', { count: 'exact', head: true }).neq('ad_status', 'suspended').neq('ad_status', 'deleted'),
      client.from('profiles').select('*', { count: 'exact', head: true }).eq('is_active', true).eq('is_suspended', false),
    ]);

    const now = new Date().toISOString();
    const parts: string[] = [];
    parts.push(sm('/sitemap-static.xml', now));
    parts.push(...pageChunks('animals', animals.count || 0, now));
    parts.push(...pageChunks('articles', articles.count || 0, now));
    parts.push(...pageChunks('events', events.count || 0, now));
    parts.push(...pageChunks('haras', profiles.count || 0, now));

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${parts.join('\n')}
</sitemapindex>`;

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    return res.status(200).send(xml);
  } catch (err) {
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    return res.status(500).send('<?xml version="1.0"?><error/>');
  }
}

function pageChunks(type: string, total: number, lastmod: string): string[] {
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const out: string[] = [];
  for (let p = 1; p <= pages; p++) out.push(sm(`/sitemap-${type}-${p}.xml`, lastmod));
  return out;
}

function sm(path: string, lastmod: string): string {
  return `  <sitemap><loc>${SITE}${path}</loc><lastmod>${lastmod}</lastmod></sitemap>`;
}
