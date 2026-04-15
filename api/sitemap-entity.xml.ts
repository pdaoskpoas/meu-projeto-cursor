import { sb, SITE } from './_lib/supabase';

export const config = { runtime: 'nodejs' };

const PAGE_SIZE = 45000;

export default async function handler(req: any, res: any) {
  try {
    const type = String(req.query?.type || '');
    const page = Math.max(1, parseInt(String(req.query?.p || '1'), 10) || 1);
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const rows = await fetchRows(type, from, to);
    if (!rows) {
      res.setHeader('Content-Type', 'application/xml; charset=utf-8');
      return res.status(404).send('<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"/>');
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemaps-image/1.1">
${rows.map((u) => `  <url><loc>${SITE}${u.loc}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}<changefreq>${u.changefreq}</changefreq><priority>${u.priority}</priority>${u.image ? `<image:image><image:loc>${escapeXml(u.image)}</image:loc></image:image>` : ''}</url>`).join('\n')}
</urlset>`;

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    return res.status(200).send(xml);
  } catch {
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    return res.status(500).send('<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"/>');
  }
}

type Row = { loc: string; lastmod?: string; changefreq: string; priority: string; image?: string | null };

async function fetchRows(type: string, from: number, to: number): Promise<Row[] | null> {
  const c = sb();
  switch (type) {
    case 'animals': {
      const { data } = await c
        .from('animals')
        .select('id,updated_at,images,published_at')
        .neq('ad_status', 'suspended')
        .neq('ad_status', 'deleted')
        .order('updated_at', { ascending: false })
        .range(from, to);
      return (data || []).map((r: any) => ({
        loc: `/animal/${r.id}`,
        lastmod: (r.updated_at || r.published_at || '').slice(0, 10) || undefined,
        changefreq: 'weekly',
        priority: '0.8',
        image: firstImage(r.images),
      }));
    }
    case 'articles': {
      const { data } = await c
        .from('articles')
        .select('id,updated_at,published_at,cover_image_url')
        .eq('is_published', true)
        .order('published_at', { ascending: false })
        .range(from, to);
      return (data || []).map((r: any) => ({
        loc: `/noticias/${r.id}`,
        lastmod: (r.updated_at || r.published_at || '').slice(0, 10) || undefined,
        changefreq: 'monthly',
        priority: '0.7',
        image: r.cover_image_url,
      }));
    }
    case 'events': {
      const { data } = await c
        .from('events')
        .select('id,slug,updated_at,published_at,cover_image_url')
        .neq('ad_status', 'suspended')
        .neq('ad_status', 'deleted')
        .order('start_date', { ascending: false })
        .range(from, to);
      return (data || []).map((r: any) => ({
        loc: `/eventos/${r.slug || r.id}`,
        lastmod: (r.updated_at || r.published_at || '').slice(0, 10) || undefined,
        changefreq: 'weekly',
        priority: '0.7',
        image: r.cover_image_url,
      }));
    }
    case 'haras': {
      const { data } = await c
        .from('profiles')
        .select('id,updated_at,avatar_url')
        .eq('is_active', true)
        .eq('is_suspended', false)
        .order('updated_at', { ascending: false })
        .range(from, to);
      return (data || []).map((r: any) => ({
        loc: `/haras/${r.id}`,
        lastmod: (r.updated_at || '').slice(0, 10) || undefined,
        changefreq: 'weekly',
        priority: '0.6',
        image: r.avatar_url,
      }));
    }
    default:
      return null;
  }
}

function firstImage(images: any): string | null {
  if (!images) return null;
  if (typeof images === 'string') return images;
  if (Array.isArray(images)) {
    const f = images[0];
    if (!f) return null;
    if (typeof f === 'string') return f;
    return f.url || f.src || f.path || null;
  }
  if (typeof images === 'object') return images.url || images.src || null;
  return null;
}

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
