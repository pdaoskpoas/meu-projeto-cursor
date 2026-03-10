/**
 * 🛡️ Security Headers Configuration
 * 
 * Headers de segurança para proteger contra ataques comuns:
 * - XSS (Cross-Site Scripting)
 * - Clickjacking
 * - MIME-sniffing
 * - CSP (Content Security Policy)
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';

export const securityHeaders = {
  /**
   * Content Security Policy (CSP)
   * Define quais recursos podem ser carregados
   */
  'Content-Security-Policy': `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://unpkg.com;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    img-src 'self' data: https: blob:;
    font-src 'self' data: https://fonts.gstatic.com;
    connect-src 'self' ${SUPABASE_URL} https://*.supabase.co wss://*.supabase.co https://viacep.com.br;
    media-src 'self' blob: data:;
    object-src 'none';
    frame-ancestors 'none';
    base-uri 'self';
    form-action 'self';
    upgrade-insecure-requests;
  `.replace(/\s+/g, ' ').trim(),

  /**
   * Previne clickjacking
   */
  'X-Frame-Options': 'DENY',

  /**
   * Previne MIME-sniffing
   */
  'X-Content-Type-Options': 'nosniff',

  /**
   * XSS Protection (legacy, mas ainda útil)
   */
  'X-XSS-Protection': '1; mode=block',

  /**
   * Referrer Policy - Controla informações no header Referer
   */
  'Referrer-Policy': 'strict-origin-when-cross-origin',

  /**
   * Permissions Policy - Desabilita APIs não utilizadas
   */
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=()',

  /**
   * HSTS - Force HTTPS (apenas em produção)
   */
  ...(import.meta.env.PROD && {
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload'
  })
};

/**
 * Aplicar headers de segurança ao documento
 * (Usado para meta tags no HTML)
 */
export const applySecurityMetaTags = () => {
  const head = document.head;

  // CSP via meta tag (backup)
  const cspMeta = document.createElement('meta');
  cspMeta.httpEquiv = 'Content-Security-Policy';
  cspMeta.content = securityHeaders['Content-Security-Policy'];
  head.appendChild(cspMeta);

  // X-Content-Type-Options
  const xContentType = document.createElement('meta');
  xContentType.httpEquiv = 'X-Content-Type-Options';
  xContentType.content = 'nosniff';
  head.appendChild(xContentType);

  // Referrer Policy
  const referrerMeta = document.createElement('meta');
  referrerMeta.name = 'referrer';
  referrerMeta.content = 'strict-origin-when-cross-origin';
  head.appendChild(referrerMeta);
};

/**
 * Validar se origem é confiável
 */
export const isTrustedOrigin = (origin: string): boolean => {
  const trustedOrigins = [
    window.location.origin,
    SUPABASE_URL,
    'https://supabase.co',
    'https://supabase.io'
  ];

  return trustedOrigins.some(trusted => origin.startsWith(trusted));
};

/**
 * Sanitizar URL antes de redirect
 */
export const sanitizeRedirectUrl = (url: string): string => {
  try {
    const parsed = new URL(url, window.location.origin);
    
    // Apenas permitir redirects internos
    if (parsed.origin !== window.location.origin) {
      return '/';
    }

    return parsed.pathname + parsed.search;
  } catch {
    return '/';
  }
};

/**
 * Gerar nonce para CSP (inline scripts)
 */
export const generateCSPNonce = (): string => {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array));
};



