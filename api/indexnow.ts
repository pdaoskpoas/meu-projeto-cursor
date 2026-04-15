import { SITE } from './_lib/supabase';

export const config = { runtime: 'nodejs' };

const KEY = process.env.INDEXNOW_KEY || '';
const SECRET = process.env.INDEXNOW_WEBHOOK_SECRET || '';
const HOST = new URL(SITE).host;

export default async function handler(req: any, res: any) {
  if (req.method === 'GET' && typeof req.query?.verify === 'string') {
    if (req.query.verify === KEY) {
      res.setHeader('Content-Type', 'text/plain');
      return res.status(200).send(KEY);
    }
    return res.status(404).send('not found');
  }

  if (req.method !== 'POST') return res.status(405).send('method not allowed');

  const auth = req.headers['authorization'] || '';
  if (!SECRET || auth !== `Bearer ${SECRET}`) return res.status(401).send('unauthorized');

  const body = typeof req.body === 'string' ? safeJson(req.body) : req.body || {};
  const urls: string[] = Array.isArray(body?.urls) ? body.urls : buildUrlsFromRow(body);
  if (!urls.length) return res.status(400).send('no urls');

  const payload = {
    host: HOST,
    key: KEY,
    keyLocation: `${SITE}/${KEY}.txt`,
    urlList: urls.map((u) => (u.startsWith('http') ? u : SITE + (u.startsWith('/') ? u : '/' + u))),
  };

  const targets = [
    'https://api.indexnow.org/indexnow',
    `https://www.google.com/ping?sitemap=${encodeURIComponent(SITE + '/sitemap.xml')}`,
  ];

  const results = await Promise.allSettled([
    fetch(targets[0], {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(payload),
    }),
    fetch(targets[1]),
  ]);

  return res.status(200).json({
    ok: true,
    submitted: urls.length,
    indexnow: status(results[0]),
    google: status(results[1]),
  });
}

function status(r: PromiseSettledResult<Response>) {
  if (r.status === 'fulfilled') return r.value.status;
  return 'error';
}

function safeJson(s: string) {
  try { return JSON.parse(s); } catch { return {}; }
}

function buildUrlsFromRow(body: any): string[] {
  const table = body?.table;
  const rec = body?.record || body?.new || body;
  if (!rec) return [];
  if (table === 'animals' && rec.id) return [`/animal/${rec.id}`];
  if (table === 'articles' && rec.id) return [`/noticias/${rec.id}`];
  if (table === 'events' && rec.id) return [`/eventos/${rec.id}`];
  if (table === 'profiles' && rec.id) return [`/haras/${rec.id}`];
  return [];
}
