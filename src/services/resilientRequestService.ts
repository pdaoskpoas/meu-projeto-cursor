import { ensureActiveSession } from '@/services/sessionService';
import { diagnostics } from '@/lib/diagnostics';

interface ResilientRequestOptions {
  timeoutMs?: number;
  retryOnRecoverableError?: boolean;
  errorMessage?: string;
  requestKey?: string;
}

const DEFAULT_TIMEOUT_MS = 12000;
const RESILIENT_SCOPE = 'resilient-request';

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
  diagnostics.debug(RESILIENT_SCOPE, 'Request started', {
    requestKey,
    timeoutMs
  });

  try {
    const result = await withTimeout(operation(), timeoutMs, errorMessage);
    diagnostics.debug(RESILIENT_SCOPE, 'Request succeeded', { requestKey });
    return ensureLatestRequest(requestToken, result);
  } catch (error) {
    if (isStaleRequestError(error)) {
      throw error;
    }

    if (!retryOnRecoverableError || !isRecoverableError(error)) {
      diagnostics.warn(RESILIENT_SCOPE, 'Request failed without retry', {
        requestKey,
        error: error instanceof Error ? error.message : String(error)
      });
      throw normalizeError(error, errorMessage);
    }

    try {
      diagnostics.info(RESILIENT_SCOPE, 'Attempting session refresh before retry', {
        requestKey
      });
      await withTimeout(
        ensureActiveSession({ forceRefresh: true, timeoutMs: 8000 }),
        10000,
        'ensureActiveSession(forceRefresh)'
      );
    } catch (sessionError) {
      diagnostics.warn(RESILIENT_SCOPE, 'Session refresh failed before retry', {
        requestKey,
        error: sessionError instanceof Error ? sessionError.message : String(sessionError)
      });
    }

    try {
      const retryResult = await withTimeout(operation(), Math.round(timeoutMs * 2), errorMessage);
      diagnostics.info(RESILIENT_SCOPE, 'Retry succeeded', { requestKey });
      return ensureLatestRequest(requestToken, retryResult);
    } catch (retryError) {
      diagnostics.error(RESILIENT_SCOPE, 'Retry failed', {
        requestKey,
        error: retryError instanceof Error ? retryError.message : String(retryError)
      });
      throw normalizeError(retryError, errorMessage);
    }
  }
}
