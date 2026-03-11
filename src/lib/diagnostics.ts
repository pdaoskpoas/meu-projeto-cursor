type DiagnosticsLevel = 'debug' | 'info' | 'warn' | 'error';

const DIAGNOSTICS_STORAGE_KEY = 'vdc:diagnostics';

const isDiagnosticsEnabled = () => {
  if (import.meta.env.DEV) return true;

  try {
    return window.localStorage.getItem(DIAGNOSTICS_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
};

const emit = (
  level: DiagnosticsLevel,
  scope: string,
  message: string,
  data?: unknown
) => {
  if (!isDiagnosticsEnabled()) return;

  const prefix = `[Diagnostics][${scope}]`;
  const logger = console[level] ?? console.log;

  if (data === undefined) {
    logger(`${prefix} ${message}`);
    return;
  }

  logger(`${prefix} ${message}`, data);
};

export const diagnostics = {
  debug: (scope: string, message: string, data?: unknown) =>
    emit('debug', scope, message, data),
  info: (scope: string, message: string, data?: unknown) =>
    emit('info', scope, message, data),
  warn: (scope: string, message: string, data?: unknown) =>
    emit('warn', scope, message, data),
  error: (scope: string, message: string, data?: unknown) =>
    emit('error', scope, message, data)
};
