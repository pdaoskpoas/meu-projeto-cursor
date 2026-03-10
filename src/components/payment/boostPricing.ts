export type BoostPlan = {
  quantity: number;
  title: string;
  subtitle: string;
  total: number;
  priceEach: number;
  discount: number;
  badge?: string;
};

export const BOOST_PRICE = 47.0;

const PACKAGE_PRICES: Record<number, { priceEach: number; discount: number }> = {
  5: { priceEach: 25.85, discount: 0.45 },
  10: { priceEach: 20.21, discount: 0.57 },
};

const getBoostUnitPrice = (quantity: number) => {
  if (quantity >= 10) return PACKAGE_PRICES[10].priceEach;
  if (quantity >= 5) return PACKAGE_PRICES[5].priceEach;
  return BOOST_PRICE;
};

export const getBoostTotal = (quantity: number) => quantity * getBoostUnitPrice(quantity);

export const getBoostDiscount = (quantity: number) => {
  if (quantity >= 10) return PACKAGE_PRICES[10].discount;
  if (quantity >= 5) return PACKAGE_PRICES[5].discount;
  return 0;
};

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export const BOOST_PLANS: BoostPlan[] = [1, 5, 10].map((quantity) => {
  const total = getBoostTotal(quantity);
  const discount = getBoostDiscount(quantity);
  const priceEach = total / quantity;
  const badge = quantity === 5 ? 'Mais popular' : quantity === 10 ? 'Melhor valor' : undefined;

  return {
    quantity,
    title: `${quantity} Boost${quantity > 1 ? 's' : ''}`,
    subtitle: 'Destaque por 30 minutos',
    total,
    priceEach,
    discount,
    badge,
  };
});
