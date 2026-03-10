// src/utils/logger.ts

interface SentryGlobal {
  captureException: (error: unknown, context?: { extra?: Record<string, unknown> }) => void;
  captureMessage: (message: string, options?: { level?: string; extra?: Record<string, unknown> }) => void;
}

declare global {
  interface Window {
    Sentry?: SentryGlobal;
  }
}

/**
 * Log padrão (apenas DEV)
 */
export const log = (...args: unknown[]) => {
  if (import.meta.env.DEV) {
    console.log('[Wizard]', ...args);
  }
};

/**
 * Log de debug (mais verboso)
 */
export const debug = (...args: unknown[]) => {
  if (import.meta.env.DEV) {
    console.debug('[Wizard]', ...args);
  }
};

/**
 * Avisos (sempre exibidos)
 */
export const warn = (...args: unknown[]) => {
  console.warn('[Wizard]', ...args);
};

/**
 * Captura de erros
 * - DEV: Console.error
 * - PROD: Sentry (quando ativado)
 */
export const captureError = (error: unknown, context?: Record<string, unknown>) => {
  if (import.meta.env.PROD && window.Sentry) {
    window.Sentry.captureException(error, {
      extra: context
    });
  } else {
    console.error('[Wizard] Error:', error, context);
  }
};

/**
 * Eventos personalizados para métricas
 * - DEV: Console.log
 * - PROD: Sentry (quando ativado)
 */
export const logEvent = (event: string, data?: Record<string, unknown>) => {
  if (import.meta.env.DEV) {
    console.log(`[Wizard] Event: ${event}`, data);
  }
  
  if (import.meta.env.PROD && window.Sentry) {
    window.Sentry.captureMessage(event, {
      level: 'info',
      extra: data
    });
  }
};



