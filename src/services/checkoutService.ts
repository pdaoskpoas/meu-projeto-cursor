import { supabase } from '@/lib/supabase';
import type { CheckoutBillingCycle, CheckoutPlanId } from '@/constants/checkoutPlans';

export interface CustomerPayload {
  name: string;
  email: string;
  cpfCnpj: string;
  mobilePhone?: string;
}

export interface AddressPayload {
  postalCode: string;
  address: string;
  addressNumber: string;
  complement?: string;
  province: string;
  city: string;
  state: string;
}

export interface ProcessPaymentPayload {
  userId: string;
  planId: CheckoutPlanId;
  billingCycle: CheckoutBillingCycle;
  paymentMethod: 'CREDIT_CARD' | 'PIX' | 'BOLETO';
  customer: CustomerPayload;
  address: AddressPayload;
}

export interface ProcessPaymentResponse {
  success: boolean;
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';
  paymentId?: string;
  subscriptionId?: string;
  invoiceUrl?: string;
  pixQrCode?: string;
  pixCopyPaste?: string;
  message?: string;
}

export interface CheckStatusResponse {
  success: boolean;
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';
  message?: string;
}

export interface BoostPaymentPayload {
  userId: string;
  duration: string;
  animalId?: string;
  billingType: 'PIX' | 'CREDIT_CARD' | 'BOLETO';
  customer?: CustomerPayload;
  address?: AddressPayload;
}

export interface BoostPaymentResponse {
  success: boolean;
  paymentId?: string;
  invoiceUrl?: string;
  pixQrCode?: string;
  pixCopyPaste?: string;
  message?: string;
}

export interface CancelSubscriptionResponse {
  success: boolean;
  message?: string;
}

const extractErrorMessage = (error: unknown): string | null => {
  const err = error as { context?: { body?: unknown; status?: number } };
  const body = err?.context?.body;
  if (!body) return null;

  const buildMessage = (payload: {
    message?: string;
    error?: string;
    reason?: string;
    stage?: string;
    errors?: Array<{ description?: string; message?: string }>;
  }) => {
    const base =
      payload.message ||
      payload.error ||
      payload.reason ||
      payload.errors?.map((item) => item.description || item.message).filter(Boolean).join(' | ') ||
      null;
    if (!base) return null;
    return payload.stage ? `${base} (etapa: ${payload.stage})` : base;
  };

  if (typeof body === 'string') {
    try {
      const parsed = JSON.parse(body) as {
        message?: string;
        error?: string;
        reason?: string;
        stage?: string;
        errors?: Array<{ description?: string; message?: string }>;
      };
      return buildMessage(parsed) || body;
    } catch {
      return body;
    }
  }

  if (typeof body === 'object' && body !== null) {
    return buildMessage(body as {
      message?: string;
      error?: string;
      reason?: string;
      stage?: string;
      errors?: Array<{ description?: string; message?: string }>;
    });
  }

  return null;
};

const invokeFunctionViaFetch = async <T>(
  functionName: string,
  payload: unknown
): Promise<{ data: T | null; error: { message: string; context?: { status?: number; body?: unknown } } | null }> => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
  const session = await supabase.auth.getSession();
  const token = session.data.session?.access_token;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    apikey: supabaseAnonKey,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${supabaseUrl}/functions/v1/${functionName}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  const text = await response.text();
  if (!response.ok) {
    return {
      data: null,
      error: {
        message: 'Edge Function returned a non-2xx status code',
        context: { status: response.status, body: text },
      },
    };
  }

  try {
    return { data: JSON.parse(text) as T, error: null };
  } catch {
    return { data: null, error: { message: 'Resposta inválida do servidor.' } };
  }
};

const isResponseLike = (value: unknown): value is Response => {
  return Boolean(
    value &&
    typeof value === 'object' &&
    'status' in value &&
    'text' in value &&
    typeof (value as Response).text === 'function'
  );
};

const normalizeInvokeError = async (
  functionName: string,
  payload: unknown,
  error: { message?: string; context?: unknown }
): Promise<{ message: string; context?: { status?: number; body?: unknown } }> => {
  const context = error?.context;

  if (isResponseLike(context)) {
    const bodyText = await context.clone().text();
    return {
      message: error.message || 'Edge Function returned a non-2xx status code',
      context: {
        status: context.status,
        body: bodyText,
      },
    };
  }

  const shouldFallbackFetch = error?.message?.includes('non-2xx');
  if (shouldFallbackFetch) {
    const fallback = await invokeFunctionViaFetch(functionName, payload);
    if (fallback.error) {
      return fallback.error;
    }
  }

  return {
    message: error.message || 'Erro ao processar pagamento.',
  };
};

const invokeWithTimeout = async <T>(
  functionName: string,
  payload: unknown,
  timeoutMs = 20000
): Promise<{ data: T | null; error: { message: string; context?: { status?: number; body?: unknown } } | null }> => {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('TIMEOUT')), timeoutMs)
  );

  const invoke = (async () => {
    const { data, error } = await supabase.functions.invoke<T>(functionName, { body: payload });

    if (!error) {
      return { data, error: null } as {
        data: T | null;
        error: { message: string; context?: { status?: number; body?: unknown } } | null;
      };
    }

    const normalizedError = await normalizeInvokeError(functionName, payload, error);
    return {
      data: null,
      error: normalizedError,
    } as {
      data: T | null;
      error: { message: string; context?: { status?: number; body?: unknown } } | null;
    };
  })();

  return (await Promise.race([invoke, timeout])) as {
    data: T | null;
    error: { message: string; context?: { status?: number; body?: unknown } } | null;
  };
};

export const processPayment = async (
  payload: ProcessPaymentPayload
): Promise<ProcessPaymentResponse> => {
  try {
    const { data, error } = await invokeWithTimeout<ProcessPaymentResponse>('process-payment', payload);

    if (error) {
      return {
        success: false,
        message: extractErrorMessage(error) || error.message || 'Erro ao processar pagamento.',
      };
    }

    return data as ProcessPaymentResponse;
  } catch (err) {
    const message = err instanceof Error && err.message === 'TIMEOUT'
      ? 'Tempo esgotado ao comunicar com o servidor. Tente novamente.'
      : err instanceof Error
        ? err.message
        : 'Erro ao processar pagamento.';
    return { success: false, message };
  }
};

export const processBoostPayment = async (
  payload: BoostPaymentPayload
): Promise<BoostPaymentResponse> => {
  try {
    const { data, error } = await invokeWithTimeout<BoostPaymentResponse>('process-boost-payment', payload);

    if (error) {
      return {
        success: false,
        message: extractErrorMessage(error) || error.message || 'Erro ao processar pagamento.',
      };
    }

    return data as BoostPaymentResponse;
  } catch (err) {
    const message = err instanceof Error && err.message === 'TIMEOUT'
      ? 'Tempo esgotado ao comunicar com o servidor. Tente novamente.'
      : err instanceof Error
        ? err.message
        : 'Erro ao processar pagamento.';
    return { success: false, message };
  }
};

export const checkPaymentStatus = async (
  params: { paymentId?: string; subscriptionId?: string }
): Promise<CheckStatusResponse> => {
  try {
    const { data, error } = await invokeWithTimeout<CheckStatusResponse>(
      'check-payment-status',
      params,
      15000
    );

    if (error) {
      return {
        success: false,
        message: extractErrorMessage(error) || error.message || 'Erro ao verificar status do pagamento.',
      };
    }

    return data as CheckStatusResponse;
  } catch (err) {
    const message =
      err instanceof Error && err.message === 'TIMEOUT'
        ? 'Tempo esgotado ao verificar o pagamento. Tente novamente.'
        : err instanceof Error
          ? err.message
          : 'Erro ao verificar status do pagamento.';
    return { success: false, message };
  }
};

export const cancelSubscription = async (
  subscriptionId: string,
  reason: string
): Promise<CancelSubscriptionResponse> => {
  try {
    const { data, error } = await invokeWithTimeout<CancelSubscriptionResponse>(
      'cancel-subscription',
      { subscriptionId, reason },
      15000
    );

    if (error) {
      return {
        success: false,
        message: extractErrorMessage(error) || error.message || 'Erro ao cancelar assinatura.',
      };
    }

    return data as CancelSubscriptionResponse;
  } catch (err) {
    const message =
      err instanceof Error && err.message === 'TIMEOUT'
        ? 'Tempo esgotado ao cancelar assinatura. Tente novamente.'
        : err instanceof Error
          ? err.message
          : 'Erro ao cancelar assinatura.';
    return { success: false, message };
  }
};
