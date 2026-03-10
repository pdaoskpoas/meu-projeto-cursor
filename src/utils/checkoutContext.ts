export type CheckoutContext =
  | {
      purchaseType: 'plan';
      planId?: string;
      billingPeriod?: string;
    }
  | {
      purchaseType: 'boost';
      quantity: number;
    }
  | {
      purchaseType: 'individual';
      contentType: 'animal' | 'event';
      contentId: string;
      contentName?: string;
    };

const CHECKOUT_CONTEXT_KEY = 'checkout_context';

export const storeCheckoutContext = (context: CheckoutContext) => {
  sessionStorage.setItem(CHECKOUT_CONTEXT_KEY, JSON.stringify(context));
};

export const loadCheckoutContext = (): CheckoutContext | null => {
  const raw = sessionStorage.getItem(CHECKOUT_CONTEXT_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CheckoutContext;
  } catch {
    return null;
  }
};

export const clearCheckoutContext = () => {
  sessionStorage.removeItem(CHECKOUT_CONTEXT_KEY);
};
