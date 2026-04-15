import { next, rewrite } from '@vercel/edge';

export const config = {
  matcher: [
    '/animal/:path*',
    '/haras/:path*',
    '/noticias/:path*',
    '/eventos/:path*',
    '/profile/:path*',
    '/u/:path*',
    '/',
  ],
};

const BOT_UA = /bot|crawl|spider|slurp|bing|yandex|baidu|duckduck|googlebot|facebookexternalhit|facebot|twitterbot|linkedinbot|whatsapp|telegrambot|slackbot|discordbot|applebot|pinterest|redditbot|skypeuripreview|embedly|quora|outbrain|vkshare|w3c_validator|iframely|telegram/i;

export default function middleware(request: Request) {
  const ua = request.headers.get('user-agent') || '';
  if (!BOT_UA.test(ua)) return next();

  const url = new URL(request.url);
  const target = new URL('/api/ssr', url);
  target.searchParams.set('path', url.pathname);
  target.searchParams.set('ua', ua.slice(0, 120));
  return rewrite(target);
}
