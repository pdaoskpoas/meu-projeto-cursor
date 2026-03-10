// src/pages/PlansPage.tsx
// Página de Planos e Preços - Standalone (sem menu lateral)
// Inspirada em Canva, Notion, Figma - Clean & Conversão

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
import { CHECKOUT_PLANS, type CheckoutBillingCycle } from '@/constants/checkoutPlans';

const PlansPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');

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
    monthlyDiscount: null,
    annualDiscount: null,
    features: plan.highlights,
    cta: 'Começar',
    popular: plan.popular ?? false,
  }));

  const faqs = [
    {
      question: 'Posso cancelar quando quiser?',
      answer: 'Sim! Cancele a qualquer momento sem taxas ou multas.',
    },
    {
      question: 'Quando meu anúncio fica visível?',
      answer: 'Imediatamente após a confirmação do pagamento.',
    },
    {
      question: 'Posso mudar de plano depois?',
      answer: 'Sim! Faça upgrade ou downgrade quando quiser.',
    },
    {
      question: 'Qual a forma de pagamento?',
      answer: 'Cartão de crédito ou PIX. Parcelamento disponível.',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <AppHeader />
      
      <main className="flex-1">
        {/* Hero Section */}
        <div className="bg-gradient-to-b from-blue-50 to-white py-16 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Planos e Preços
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Escolha o plano ideal para seu negócio
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
                  Economize até 50%
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Plans Section */}
        <div className="py-16 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
                      <span className="text-4xl font-bold">
                        R${' '}
                        {billingPeriod === 'monthly'
                          ? plan.monthlyPrice
                          : Math.floor(plan.annualPrice / 12)}
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
                        Cobrado R$ {plan.annualPrice}/ano
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

        {/* FAQ Section */}
        <div className="bg-gray-50 py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
              Perguntas Frequentes
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {faqs.map((faq, index) => (
                <div key={index} className="bg-white rounded-xl p-6 shadow-sm">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    {faq.question}
                  </h3>
                  <p className="text-sm text-gray-600">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <div className="py-16 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Pronto para começar?
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Escolha um plano e publique seu primeiro anúncio hoje
            </p>
            <Button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
            >
              Ver Planos
            </Button>
          </div>
        </div>
      </main>

      <AppFooter />
    </div>
  );
};

export default PlansPage;
