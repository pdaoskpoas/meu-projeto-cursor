// src/pages/PlansPage.tsx
// Página de Planos e Preços - Modelo 100% baseado em planos

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { CHECKOUT_PLANS, type CheckoutBillingCycle } from '@/constants/checkoutPlans';

const PlansPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('annual');

  const handleSelectPlan = (planId: string) => {
    toast({
      title: 'Plano selecionado',
      description: 'Você será redirecionado para finalizar a assinatura.',
    });
    const cycle: CheckoutBillingCycle = billingPeriod === 'annual' ? 'annual' : 'monthly';
    navigate('/checkout', { state: { purchaseType: 'plan', planId, billingPeriod: cycle } });
  };

  const plans = CHECKOUT_PLANS.map((plan) => ({
    id: plan.id,
    name: plan.name,
    description: plan.description,
    monthlyPrice: plan.monthlyPrice,
    annualPrice: plan.annualTotal,
    features: plan.highlights,
    cta: 'Começar',
    popular: plan.popular ?? false,
  }));

  const formatPrice = (price: number) => {
    return price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className="flex flex-col bg-white">
      {/* Hero Section */}
        <div className="bg-gradient-to-b from-blue-50 to-white py-16 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Planos e Preços
            </h1>
            <p className="text-xl text-gray-600 mb-2">
              Escolha o plano ideal para seu negócio
            </p>
            <p className="text-sm text-gray-500 mb-8">
              Para cadastrar e publicar seus animais, é necessário ter um plano ativo.
            </p>

            {/* Toggle Billing */}
            <div className="inline-flex items-center bg-white rounded-full p-1 shadow-sm border border-gray-200">
              <button
                onClick={() => setBillingPeriod('monthly')}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                  billingPeriod === 'monthly'
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Mensal
              </button>
              <button
                onClick={() => setBillingPeriod('annual')}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                  billingPeriod === 'annual'
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Anual
                <span className="ml-2 text-xs text-green-600 font-semibold">
                  Economize
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Plans Section */}
        <div className="py-16 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className={`relative rounded-2xl p-8 ${
                    plan.popular
                      ? 'bg-gray-900 text-white shadow-2xl scale-105'
                      : 'bg-white border-2 border-gray-200 hover:border-gray-300'
                  } transition-all`}
                >
                  {/* Popular Badge */}
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-blue-500 text-white px-4 py-1">
                        Mais Popular
                      </Badge>
                    </div>
                  )}

                  {/* Plan Header */}
                  <div className="mb-6">
                    <h3
                      className={`text-2xl font-bold mb-2 ${
                        plan.popular ? 'text-white' : 'text-gray-900'
                      }`}
                    >
                      {plan.name}
                    </h3>
                    <p
                      className={`text-sm ${
                        plan.popular ? 'text-gray-300' : 'text-gray-600'
                      }`}
                    >
                      {plan.description}
                    </p>
                  </div>

                  {/* Price */}
                  <div className="mb-6">
                    <div className="flex items-baseline">
                      <span className="text-3xl font-bold">
                        R${' '}
                        {billingPeriod === 'monthly'
                          ? formatPrice(plan.monthlyPrice)
                          : formatPrice(plan.annualPrice / 12)}
                      </span>
                      <span
                        className={`ml-2 text-sm ${
                          plan.popular ? 'text-gray-300' : 'text-gray-600'
                        }`}
                      >
                        /mês
                      </span>
                    </div>
                    {billingPeriod === 'annual' && (
                      <p
                        className={`text-xs mt-1 ${
                          plan.popular ? 'text-gray-400' : 'text-gray-500'
                        }`}
                      >
                        Cobrado R$ {formatPrice(plan.annualPrice)}/ano
                      </p>
                    )}
                  </div>

                  {/* CTA Button */}
                  <Button
                    onClick={() => handleSelectPlan(plan.id)}
                    className={`w-full mb-6 ${
                      plan.popular
                        ? 'bg-blue-500 hover:bg-blue-600 text-white'
                        : 'bg-gray-900 hover:bg-gray-800 text-white'
                    }`}
                  >
                    {plan.cta}
                  </Button>

                  {/* Features */}
                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <Check
                          className={`h-5 w-5 flex-shrink-0 ${
                            plan.popular ? 'text-blue-400' : 'text-green-600'
                          }`}
                        />
                        <span
                          className={`text-sm ${
                            plan.popular ? 'text-gray-200' : 'text-gray-700'
                          }`}
                        >
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
    </div>
  );
};

export default PlansPage;
