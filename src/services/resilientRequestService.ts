import { ensureActiveSession } from '@/services/sessionService';

interface ResilientRequestOptions {
  timeoutMs?: number;
  retryOnRecoverableError?: boolean;
  errorMessage?: string;
}

const DEFAULT_TIMEOUT_MS = 12000;

const isRecoverableError = (error: unknown) => {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();

  return (
    message.includes('timeout') ||
    message.includes('network') ||
    message.includes('fetch') ||
    message.includes('jwt') ||
    message.includes('token') ||
    message.includes('session') ||
    message.includes('auth')
  );
};

const normalizeError = (error: unknown, fallbackMessage: string) => {
  if (!(error instanceof Error)) {
    return new Error(fallbackMessage);
  }

  const message = error.message.toLowerCase();

  if (message.includes('session timeout')) {
    return new Error(fallbackMessage);
  }

  return error;
};

export const withTimeout = async <T>(
  operation: Promise<T>,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  errorMessage = 'A operação demorou demais para responder.'
): Promise<T> =>
  Promise.race([
    operation,
    new Promise<T>((_, reject) => {
      window.setTimeout(() => reject(new Error(errorMessage)), timeoutMs);
    })
  ]);

export async function runResilientRequest<T>(
  operation: () => Promise<T>,
  options: ResilientRequestOptions = {}
): Promise<T> {
  const {
    timeoutMs = DEFAULT_TIMEOUT_MS,
    retryOnRecoverableError = true,
    errorMessage = 'A operação demorou demais para responder.'
  } = options;

  try {
    return await withTimeout(operation(), timeoutMs, errorMessage);
  } catch (error) {
    if (!retryOnRecoverableError || !isRecoverableError(error)) {
      throw normalizeError(error, errorMessage);
    }

    try {
      await ensureActiveSession({ forceRefresh: true, timeoutMs: 8000 });
    } catch (sessionError) {
      console.warn('[ResilientRequest] Falha ao renovar sessão, tentando a operação mesmo assim:', sessionError);
    }

    try {
      return await withTimeout(operation(), timeoutMs, errorMessage);
    } catch (retryError) {
      throw normalizeError(retryError, errorMessage);
    }
  }
}
