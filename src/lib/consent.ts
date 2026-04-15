/**
 * Gestão de consentimento de cookies (LGPD - Lei 13.709/2018).
 *
 * Categorias:
 *  - necessary: essenciais ao funcionamento (sempre ligadas)
 *  - analytics: Google Analytics (GA4) — tráfego e comportamento agregado
 *  - marketing: remarketing / mídia paga (reservado; hoje não usado)
 *
 * Persistência local: localStorage com versão. Alteração em CONSENT_VERSION
 * invalida escolhas anteriores e reexibe o banner.
 *
 * Persistência remota: cada decisão é gravada em `cookie_consent_logs` via
 * edge function `record-cookie-consent`, que captura IP/User-Agent no servidor
 * e retorna um receipt_id — comprovante de aceite exigido pela LGPD (Art. 8 §2º).
 */

import { supabase } from '@/lib/supabase';

export const CONSENT_STORAGE_KEY = 'vdc_cookie_consent_v1';
export const CONSENT_ANON_ID_KEY = 'vdc_cookie_anon_id';
export const CONSENT_RECEIPT_KEY = 'vdc_cookie_consent_receipt';
export const CONSENT_VERSION = 1;
export const GA_MEASUREMENT_ID = 'G-XYBL1VZFGL';

export type ConsentCategory = 'necessary' | 'analytics' | 'marketing';
export type ConsentAction =
  | 'accept_all'
  | 'reject_non_essential'
  | 'custom'
  | 'update'
  | 'withdraw';

export interface ConsentState {
  version: number;
  timestamp: string;
  categories: Record<ConsentCategory, boolean>;
  receiptId?: string | null;
}

export interface ConsentReceipt {
  receipt_id: string;
  recorded_at: string;
  action: ConsentAction;
}

const DEFAULT_CATEGORIES: Record<ConsentCategory, boolean> = {
  necessary: true,
  analytics: false,
  marketing: false,
};

type Listener = (state: ConsentState | null) => void;
const listeners = new Set<Listener>();

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

function uuidv4(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback RFC4122 v4
  const bytes = new Uint8Array(16);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function getAnonymousId(): string {
  if (typeof window === 'undefined') return uuidv4();
  try {
    const existing = window.localStorage.getItem(CONSENT_ANON_ID_KEY);
    if (existing && /^[0-9a-f-]{36}$/i.test(existing)) return existing;
  } catch {
    /* noop */
  }
  const id = uuidv4();
  try {
    window.localStorage.setItem(CONSENT_ANON_ID_KEY, id);
  } catch {
    /* noop */
  }
  return id;
}

export function readConsent(): ConsentState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ConsentState;
    if (!parsed || parsed.version !== CONSENT_VERSION) return null;
    return {
      ...parsed,
      categories: { ...DEFAULT_CATEGORIES, ...parsed.categories, necessary: true },
    };
  } catch {
    return null;
  }
}

export function readReceipt(): ConsentReceipt | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(CONSENT_RECEIPT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ConsentReceipt;
  } catch {
    return null;
  }
}

function saveReceipt(receipt: ConsentReceipt): void {
  try {
    window.localStorage.setItem(CONSENT_RECEIPT_KEY, JSON.stringify(receipt));
  } catch {
    /* noop */
  }
}

function persistState(state: ConsentState): void {
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* noop */
  }
}

/**
 * Envia o aceite para o backend (append-only) e retorna o receipt_id.
 * Silencioso em caso de falha: a escolha local ainda vale para a sessão,
 * mas registramos o erro no console para monitoramento.
 */
async function sendConsentToBackend(
  action: ConsentAction,
  categories: Record<ConsentCategory, boolean>,
): Promise<string | null> {
  try {
    const { data, error } = await supabase.functions.invoke<{
      success: boolean;
      receipt_id: string;
      recorded_at: string;
    }>('record-cookie-consent', {
      body: {
        anonymous_id: getAnonymousId(),
        consent_version: CONSENT_VERSION,
        action,
        analytics: !!categories.analytics,
        marketing: !!categories.marketing,
        page_url: typeof window !== 'undefined' ? window.location.href : undefined,
        metadata: {
          language: typeof navigator !== 'undefined' ? navigator.language : undefined,
          timezone:
            typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : undefined,
          screen:
            typeof window !== 'undefined' && window.screen
              ? `${window.screen.width}x${window.screen.height}`
              : undefined,
        },
      },
    });

    if (error || !data?.receipt_id) {
      console.warn('[consent] falha ao registrar aceite remoto:', error?.message);
      return null;
    }

    saveReceipt({
      receipt_id: data.receipt_id,
      recorded_at: data.recorded_at,
      action,
    });

    return data.receipt_id;
  } catch (err) {
    console.warn('[consent] exceção ao registrar aceite:', err);
    return null;
  }
}

function actionFromCategories(
  prev: Record<ConsentCategory, boolean> | null,
  next: Record<ConsentCategory, boolean>,
): ConsentAction {
  if (prev) return 'update';
  if (next.analytics && next.marketing) return 'accept_all';
  if (!next.analytics && !next.marketing) return 'reject_non_essential';
  return 'custom';
}

export function writeConsent(
  categories: Partial<Record<ConsentCategory, boolean>>,
  explicitAction?: ConsentAction,
): ConsentState {
  const prev = readConsent();
  const merged: Record<ConsentCategory, boolean> = {
    ...DEFAULT_CATEGORIES,
    ...(prev?.categories ?? {}),
    ...categories,
    necessary: true,
  };

  const action = explicitAction ?? actionFromCategories(prev?.categories ?? null, merged);

  const state: ConsentState = {
    version: CONSENT_VERSION,
    timestamp: new Date().toISOString(),
    categories: merged,
    receiptId: null,
  };

  persistState(state);
  applyConsent(state);
  listeners.forEach((l) => l(state));

  // Envia em background e, ao retornar, atualiza o estado com o receipt_id
  void sendConsentToBackend(action, merged).then((receiptId) => {
    if (!receiptId) return;
    const withReceipt: ConsentState = { ...state, receiptId };
    persistState(withReceipt);
    listeners.forEach((l) => l(withReceipt));
  });

  return state;
}

export function clearConsent(): void {
  try {
    window.localStorage.removeItem(CONSENT_STORAGE_KEY);
    window.localStorage.removeItem(CONSENT_RECEIPT_KEY);
  } catch {
    /* noop */
  }
  listeners.forEach((l) => l(null));
}

export function subscribeConsent(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function acceptAll(): ConsentState {
  return writeConsent({ analytics: true, marketing: true }, 'accept_all');
}

export function rejectNonEssential(): ConsentState {
  return writeConsent({ analytics: false, marketing: false }, 'reject_non_essential');
}

/**
 * Aplica o estado ao Google Consent Mode v2 e carrega o gtag.js se necessário.
 */
let gtagScriptLoaded = false;

function ensureGtagScript(): void {
  if (gtagScriptLoaded || typeof document === 'undefined') return;
  if (document.querySelector(`script[data-gtag="${GA_MEASUREMENT_ID}"]`)) {
    gtagScriptLoaded = true;
    return;
  }
  const s = document.createElement('script');
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  s.setAttribute('data-gtag', GA_MEASUREMENT_ID);
  document.head.appendChild(s);
  gtagScriptLoaded = true;
}

export function applyConsent(state: ConsentState | null): void {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;

  const analytics = state?.categories.analytics ? 'granted' : 'denied';
  const marketing = state?.categories.marketing ? 'granted' : 'denied';

  window.gtag('consent', 'update', {
    analytics_storage: analytics,
    ad_storage: marketing,
    ad_user_data: marketing,
    ad_personalization: marketing,
  });

  if (state?.categories.analytics) {
    ensureGtagScript();
  }
}

export function initConsent(): void {
  const state = readConsent();
  if (state) applyConsent(state);
}
