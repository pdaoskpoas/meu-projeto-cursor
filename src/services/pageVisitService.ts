import { supabase } from '@/lib/supabase';
import type { PageVisitInsert } from '@/types/supabase';

const SESSION_STORAGE_KEY = 'analytics_session_id';
const SITE_ACCESS_STORAGE_KEY = 'site_access_recorded';
const PAGE_VISIT_PREFIX = 'page_visit_recorded';
const PAGE_VISIT_DEDUP_MS = 30_000;

interface TrackPageVisitInput {
  pathname: string;
  search?: string;
  userId?: string | null;
}

interface TrackablePage {
  key: string;
  path: string;
}

const TRACKABLE_PAGES: Array<{ key: string; pattern: RegExp }> = [
  { key: 'home', pattern: /^\/$/ },
  { key: 'search', pattern: /^\/buscar(?:\/.*)?$/ },
  { key: 'animal_detail', pattern: /^\/animal\/[^/]+$/ },
  { key: 'haras_detail', pattern: /^\/haras\/[^/]+$/ },
  { key: 'public_profile', pattern: /^\/profile\/[^/]+$/ },
  { key: 'news_list', pattern: /^\/noticias$/ },
  { key: 'article_detail', pattern: /^\/noticias\/[^/]+$/ },
  { key: 'events_list', pattern: /^\/eventos$/ },
  { key: 'event_detail', pattern: /^\/eventos\/[^/]+$/ },
  { key: 'event_page', pattern: /^\/event-page$/ },
  { key: 'plans', pattern: /^\/planos$/ },
  { key: 'help', pattern: /^\/ajuda$/ },
  { key: 'terms', pattern: /^\/terms$/ },
  { key: 'privacy', pattern: /^\/privacy$/ },
  { key: 'contact', pattern: /^\/contact$/ },
];

let hasWarnedMissingTable = false;

const getOrCreateSessionId = (): string => {
  let sessionId = sessionStorage.getItem(SESSION_STORAGE_KEY);

  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    sessionStorage.setItem(SESSION_STORAGE_KEY, sessionId);
  }

  return sessionId;
};

const resolveTrackablePage = (pathname: string, search = ''): TrackablePage | null => {
  const match = TRACKABLE_PAGES.find((page) => page.pattern.test(pathname));

  if (!match) {
    return null;
  }

  return {
    key: match.key,
    path: `${pathname}${search}`,
  };
};

const getVisitDedupKey = (pageKey: string, path: string) => `${PAGE_VISIT_PREFIX}:${pageKey}:${path}`;

const shouldSkipVisit = (pageKey: string, path: string): boolean => {
  const dedupKey = getVisitDedupKey(pageKey, path);
  const lastRecordedAt = sessionStorage.getItem(dedupKey);

  if (!lastRecordedAt) {
    return false;
  }

  return Date.now() - Number(lastRecordedAt) < PAGE_VISIT_DEDUP_MS;
};

const markVisitRecorded = (pageKey: string, path: string) => {
  sessionStorage.setItem(getVisitDedupKey(pageKey, path), String(Date.now()));
};

const isMissingPageVisitsTable = (error: unknown): boolean => {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const errorCode = 'code' in error ? String(error.code) : '';
  const errorMessage = 'message' in error ? String(error.message) : '';

  return errorCode === '42P01' || errorMessage.toLowerCase().includes('page_visits');
};

const insertVisit = async (payload: PageVisitInsert) => {
  const { error } = await supabase.from('page_visits').insert(payload);

  if (error) {
    if (isMissingPageVisitsTable(error)) {
      if (!hasWarnedMissingTable) {
        hasWarnedMissingTable = true;
        console.warn('[PageVisitService] Tabela page_visits ainda nao foi aplicada no banco.');
      }
      return;
    }

    throw error;
  }
};

class PageVisitService {
  private async recordSiteAccess(sessionId: string, userId?: string | null, pagePath = '/') {
    if (sessionStorage.getItem(SITE_ACCESS_STORAGE_KEY)) {
      return;
    }

    await insertVisit({
      page_key: 'site_access',
      page_path: pagePath,
      page_title: typeof document !== 'undefined' ? document.title : null,
      session_id: sessionId,
      user_id: userId || null,
      referrer: typeof document !== 'undefined' ? document.referrer || null : null,
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
      metadata: {
        scope: 'site',
      },
    });

    sessionStorage.setItem(SITE_ACCESS_STORAGE_KEY, 'true');
  }

  async trackPageVisit({ pathname, search = '', userId }: TrackPageVisitInput): Promise<void> {
    if (typeof window === 'undefined') {
      return;
    }

    const page = resolveTrackablePage(pathname, search);
    if (!page) {
      return;
    }

    const sessionId = getOrCreateSessionId();

    try {
      await this.recordSiteAccess(sessionId, userId, page.path);

      if (shouldSkipVisit(page.key, page.path)) {
        return;
      }

      await insertVisit({
        page_key: page.key,
        page_path: page.path,
        page_title: typeof document !== 'undefined' ? document.title : null,
        session_id: sessionId,
        user_id: userId || null,
        referrer: typeof document !== 'undefined' ? document.referrer || null : null,
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
        metadata: {
          pathname,
        },
      });

      markVisitRecorded(page.key, page.path);
    } catch (error) {
      console.error('[PageVisitService] Erro ao registrar acesso:', error);
    }
  }
}

export const pageVisitService = new PageVisitService();
