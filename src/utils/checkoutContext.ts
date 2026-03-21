import { type BoostDuration } from '@/constants/checkoutPlans';

export type CheckoutContext =
  | {
      purchaseType: 'plan';
      planId?: string;
      billingPeriod?: string;
    }
  | {
      purchaseType: 'boost';
      boostDuration: BoostDuration;
      animalId?: string;
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
