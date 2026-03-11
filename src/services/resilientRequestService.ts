import { ensureActiveSession } from '@/services/sessionService';

interface ResilientRequestOptions {
  timeoutMs?: number;
  retryOnRecoverableError?: boolean;
  errorMessage?: string;
  requestKey?: string;
}

const DEFAULT_TIMEOUT_MS = 12000;

class RequestTimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RequestTimeoutError';
  }
}

export class StaleRequestError extends Error {
  constructor(message = 'Stale request ignored') {
    super(message);
    this.name = 'StaleRequestError';
  }
}

const latestRequestIds = new Map<string, number>();
let globalRequestSequence = 0;

const createRequestToken = (requestKey?: string) => {
  if (!requestKey) return null;

  const requestId = ++globalRequestSequence;
  latestRequestIds.set(requestKey, requestId);
  return { requestKey, requestId };
};

const ensureLatestRequest = <T>(
  requestToken: { requestKey: string; requestId: number } | null,
  result: T
): T => {
  if (!requestToken) {
    return result;
  }

  const latestRequestId = latestRequestIds.get(requestToken.requestKey);
  if (latestRequestId !== requestToken.requestId) {
    throw new StaleRequestError();
  }

  return result;
};

export const isStaleRequestError = (error: unknown): error is StaleRequestError =>
  error instanceof StaleRequestError;

const isRecoverableError = (error: unknown) => {
  if (error instanceof RequestTimeoutError) return true;

  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();

  return (
    message.includes('timeout') ||
    message.includes('demorou demais') ||
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

  if (error instanceof RequestTimeoutError || message.includes('session timeout')) {
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
      window.setTimeout(() => reject(new RequestTimeoutError(errorMessage)), timeoutMs);
    })
  ]);

export async function runResilientRequest<T>(
  operation: () => Promise<T>,
  options: ResilientRequestOptions = {}
): Promise<T> {
  const {
    timeoutMs = 30000,
    retryOnRecoverableError = true,
    errorMessage = 'A operação demorou demais para responder.',
    requestKey
  } = options;
  const requestToken = createRequestToken(requestKey);

  try {
    const result = await withTimeout(operation(), timeoutMs, errorMessage);
    return ensureLatestRequest(requestToken, result);
  } catch (error) {
    if (isStaleRequestError(error)) {
      throw error;
    }

    if (!retryOnRecoverableError || !isRecoverableError(error)) {
      throw normalizeError(error, errorMessage);
    }

    try {
      await ensureActiveSession({ forceRefresh: true, timeoutMs: 8000 });
    } catch (sessionError) {
      console.warn('[ResilientRequest] Falha ao renovar sessão, tentando a operação mesmo assim:', sessionError);
    }

    try {
      const retryResult = await withTimeout(operation(), Math.round(timeoutMs * 2), errorMessage);
      return ensureLatestRequest(requestToken, retryResult);
    } catch (retryError) {
      throw normalizeError(retryError, errorMessage);
    }
  }
}
