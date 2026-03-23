import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import {
  CHECKOUT_PLANS,
  getPlanById,
  getPlanPrice,
  getBoostTier,
  BOOST_TIERS,
  type CheckoutBillingCycle,
  type CheckoutPlanId,
  type BoostDuration,
} from '@/constants/checkoutPlans';
import { createPaymentLink } from '@/services/checkoutService';
import {
  clearCheckoutContext,
  loadCheckoutContext,
  type CheckoutContext,
} from '@/utils/checkoutContext';

type CheckoutState = Partial<CheckoutContext> & {
  planId?: CheckoutPlanId;
  billingPeriod?: CheckoutBillingCycle;
};

type PurchaseType = 'plan' | 'boost';

const CheckoutPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user, isLoading } = useAuth();
  const state = useMemo(
    () => (location.state as CheckoutState) ?? {},
    [location.state]
  );
  const storedContext = useMemo(() => loadCheckoutContext(), []);
  const resolvedContext = useMemo<CheckoutContext>(() => {
    if (state?.purchaseType) return state as CheckoutContext;
    if (state?.planId || state?.billingPeriod) {
      return { purchaseType: 'plan', planId: state.planId, billingPeriod: state.billingPeriod };
    }
    if (storedContext) return storedContext;
    return { purchaseType: 'plan', planId: state.planId, billingPeriod: state.billingPeriod };
  }, [state, storedContext]);

  const defaultPlan = getPlanById(state.planId) ?? CHECKOUT_PLANS[1];
  const [purchaseType] = useState<PurchaseType>(
    resolvedContext.purchaseType === 'boost' ? 'boost' : 'plan'
  );
  const [boostDuration, setBoostDuration] = useState<BoostDuration>(
    resolvedContext.purchaseType === 'boost' ? resolvedContext.boostDuration : '24h'
  );
  const [boostAnimalId] = useState<string | undefined>(
    resolvedContext.purchaseType === 'boost' ? resolvedContext.animalId : undefined
  );
  const [planId, setPlanId] = useState<CheckoutPlanId>(defaultPlan.id);
  const [billingCycle, setBillingCycle] = useState<CheckoutBillingCycle>(
    (state.billingPeriod as CheckoutBillingCycle) ?? 'monthly'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedPlan = useMemo(
    () => CHECKOUT_PLANS.find((plan) => plan.id === planId) ?? defaultPlan,
    [planId, defaultPlan]
  );

  const selectedBoostTier = useMemo(() => getBoostTier(boostDuration), [boostDuration]);

  const baseTotal = useMemo(() => {
    if (purchaseType === 'plan') return getPlanPrice(selectedPlan, billingCycle);
    return selectedBoostTier.price;
  }, [purchaseType, selectedPlan, billingCycle, selectedBoostTier]);

  const formatPrice = (value: number) => value.toFixed(2).replace('.', ',');

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/login', { replace: true });
    }
  }, [isLoading, user, navigate]);

  useEffect(() => {
    if (purchaseType === 'plan') {
      clearCheckoutContext();
    }
  }, [purchaseType]);

  const handleCheckout = async () => {
    if (!user) return;

    setIsSubmitting(true);
    try {
      const payload =
        purchaseType === 'boost'
          ? { purchaseType: 'boost' as const, boostDuration, animalId: boostAnimalId }
          : { purchaseType: 'plan' as const, planId, billingCycle };

      const result = await createPaymentLink(payload);

      if (!result.success || !result.paymentLinkUrl) {
        toast({
          title: 'Erro ao gerar link de pagamento',
          description: result.message || 'Tente novamente em instantes.',
          variant: 'destructive',
        });
        return;
      }

      // Redirecionar para o checkout hospedado do Asaas
      window.location.href = result.paymentLinkUrl;
    } catch {
      toast({
        title: 'Erro ao processar',
        description: 'Não foi possível gerar o link de pagamento. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            {purchaseType === 'plan' ? 'Escolha seu plano' : 'Turbinar Animal'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Selecione a opção desejada e finalize no ambiente seguro do Asaas.
          </p>
        </div>
      </div>

      {/* Conteudo */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 items-start">

          {/* ══ COLUNA ESQUERDA: Seleções ══ */}
          <div className="space-y-6">
            {purchaseType === 'plan' ? (
              <>
                {/* Planos */}
                <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6">
                  <h2 className="text-base font-semibold text-gray-900 mb-4">1. Escolha o plano</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {CHECKOUT_PLANS.map((plan) => {
                      const isSelected = plan.id === planId;
                      const price = getPlanPrice(plan, billingCycle);
                      const isAnnual = billingCycle === 'annual';
                      return (
                        <button
                          key={plan.id}
                          type="button"
                          onClick={() => setPlanId(plan.id)}
                          className={`relative w-full text-left rounded-xl border-2 p-4 transition-all ${
                            isSelected
                              ? 'border-blue-600 bg-blue-50/60 shadow-sm'
                              : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                          }`}
                        >
                          {plan.popular && (
                            <span className="absolute -top-2.5 right-3 text-[10px] font-bold bg-blue-600 text-white px-2.5 py-0.5 rounded-full uppercase tracking-wide">
                              Popular
                            </span>
                          )}
                          <p className="font-bold text-gray-900">{plan.name}</p>
                          {isAnnual ? (
                            <>
                              <p className="text-lg font-bold text-blue-600 mt-1">
                                12x de R$ {formatPrice(price / 12)}
                              </p>
                              <p className="text-xs text-gray-500">
                                Total R$ {formatPrice(price)}/ano
                              </p>
                            </>
                          ) : (
                            <p className="text-lg font-bold text-blue-600 mt-1">
                              R$ {formatPrice(price)}
                              <span className="text-xs font-normal text-gray-500">/mês</span>
                            </p>
                          )}
                          <div className="mt-2 space-y-0.5">
                            <p className="text-xs text-gray-600">
                              {plan.animalLimit} {plan.animalLimit === 1 ? 'animal' : 'animais'}
                            </p>
                            {plan.boostsPerMonth > 0 && (
                              <p className="text-xs text-gray-600">
                                {plan.boostsPerMonth} turbinares/mês
                              </p>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Período */}
                <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6">
                  <h2 className="text-base font-semibold text-gray-900 mb-4">2. Escolha o período</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(['monthly', 'annual'] as CheckoutBillingCycle[]).map((cycle) => {
                      const isSelected = cycle === billingCycle;
                      const price = getPlanPrice(selectedPlan, cycle);
                      const savings = cycle === 'annual'
                        ? getPlanPrice(selectedPlan, 'monthly') * 12 - price
                        : 0;
                      return (
                        <button
                          key={cycle}
                          type="button"
                          onClick={() => setBillingCycle(cycle)}
                          className={`relative w-full text-left rounded-xl border-2 p-4 transition-all ${
                            isSelected
                              ? 'border-gray-900 bg-gray-900 text-white shadow-sm'
                              : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                          }`}
                        >
                          {cycle === 'annual' && savings > 0 && (
                            <span className={`absolute -top-2.5 right-3 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wide ${
                              isSelected ? 'bg-green-500 text-white' : 'bg-green-100 text-green-700'
                            }`}>
                              Economize R$ {formatPrice(savings)}
                            </span>
                          )}
                          <p className="font-bold">
                            {cycle === 'monthly' ? 'Mensal' : 'Anual'}
                          </p>
                          <p className={`text-sm mt-1 ${isSelected ? 'text-gray-300' : 'text-gray-500'}`}>
                            {cycle === 'annual'
                              ? `12x de R$ ${formatPrice(price / 12)} sem juros`
                              : `R$ ${formatPrice(price)} /mês`}
                          </p>
                          {cycle === 'annual' && (
                            <p className={`text-xs mt-0.5 ${isSelected ? 'text-gray-400' : 'text-gray-400'}`}>
                              Total R$ {formatPrice(price)}
                            </p>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : (
              /* Boost */
              <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6">
                <h2 className="text-base font-semibold text-gray-900 mb-4">Escolha a duração</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {BOOST_TIERS.map((tier) => {
                    const isSelected = tier.duration === boostDuration;
                    return (
                      <button
                        key={tier.duration}
                        type="button"
                        onClick={() => setBoostDuration(tier.duration)}
                        className={`w-full text-left rounded-xl border-2 p-4 transition-all ${
                          isSelected
                            ? 'border-yellow-500 bg-yellow-50 shadow-sm'
                            : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                        }`}
                      >
                        <p className="font-bold text-gray-900">{tier.label}</p>
                        <p className="text-lg font-bold text-yellow-600 mt-1">
                          R$ {formatPrice(tier.price)}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* ══ COLUNA DIREITA: Resumo fixo ══ */}
          <div className="lg:sticky lg:top-8 space-y-4">
            {/* Card de resumo */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 space-y-5">
              <h3 className="text-base font-semibold text-gray-900">Resumo do pedido</h3>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    {purchaseType === 'plan'
                      ? `Plano ${selectedPlan.name}`
                      : `Turbinar ${selectedBoostTier.label}`}
                  </span>
                  <span className="font-medium text-gray-900">R$ {formatPrice(baseTotal)}</span>
                </div>
                {purchaseType === 'plan' && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Período</span>
                    <span className="font-medium text-gray-900">
                      {billingCycle === 'monthly' ? 'Mensal' : 'Anual'}
                    </span>
                  </div>
                )}
                {purchaseType === 'plan' && billingCycle === 'annual' && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Parcelamento</span>
                    <span className="font-medium text-gray-900">
                      12x de R$ {formatPrice(baseTotal / 12)}
                    </span>
                  </div>
                )}
              </div>

              <div className="border-t border-gray-100 pt-4">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Total</p>
                    <p className="text-2xl font-bold text-gray-900">R$ {formatPrice(baseTotal)}</p>
                  </div>
                  {purchaseType === 'plan' && billingCycle === 'annual' && (
                    <p className="text-xs text-gray-500">ou 12x s/ juros</p>
                  )}
                </div>
              </div>

              <Button
                type="button"
                className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-base font-semibold"
                disabled={isSubmitting}
                onClick={handleCheckout}
              >
                {isSubmitting ? 'Gerando link seguro...' : 'Ir para pagamento'}
              </Button>

              <p className="text-xs text-center text-gray-400">
                Você será redirecionado para o checkout seguro do Asaas
              </p>
            </div>

            {/* Info de segurança */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-2.5">
              <p className="text-sm font-semibold text-gray-900">Pagamento 100% seguro</p>
              <div className="space-y-1.5 text-xs text-gray-500">
                <p>Seus dados são protegidos com criptografia ponta-a-ponta pelo Asaas.</p>
                <p>Ambiente de pagamento certificado e em conformidade com a LGPD.</p>
                <p>PIX, cartão de crédito ou boleto disponíveis no checkout.</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
