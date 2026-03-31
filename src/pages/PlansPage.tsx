// src/pages/PlansPage.tsx
// Página de Planos e Preços - Modelo 100% baseado em planos

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Eye, MapPin, BarChart3, Zap, ChevronDown, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { CHECKOUT_PLANS, type CheckoutBillingCycle } from '@/constants/checkoutPlans';

const faqs = [
  {
    q: 'Posso trocar de plano depois?',
    a: 'Sim. Você pode fazer upgrade a qualquer momento e o valor é ajustado proporcionalmente. Downgrade acontece na renovação.',
  },
  {
    q: 'Preciso de plano para cadastrar animais?',
    a: 'Sim. Todos os planos permitem cadastrar e publicar animais com galeria de fotos, genealogia e ficha completa.',
  },
  {
    q: 'O que acontece se meu plano vencer?',
    a: 'Seus animais ficam inativos (não aparecem na busca) mas continuam salvos. Ao renovar, voltam automaticamente.',
  },
  {
    q: 'Como funciona o "Turbinar"?',
    a: 'Turbinar destaca seu animal no topo dos carrosséis e busca por 24h. Cada crédito = 1 turbinada. Planos maiores incluem créditos mensais.',
  },
  {
    q: 'Tem período de teste?',
    a: 'Oferecemos satisfação garantida nos primeiros 7 dias. Se não gostar, devolvemos 100% do valor.',
  },
];

const PlansPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('annual');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

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
      {/* Hero Section — narrativa de valor */}
      <div className="bg-gradient-to-b from-blue-50 to-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Seu plantel visto por milhares
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            Criadores de todo o Brasil já posicionam seus animais na Vitrine.
          </p>
          <p className="text-sm text-gray-500 mb-8">
            Escolha o plano ideal e comece a receber contatos qualificados.
          </p>

          {/* Benefícios rápidos */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto mb-10">
            {[
              { icon: Eye, text: 'Visibilidade nacional' },
              { icon: MapPin, text: 'Seu haras no mapa' },
              { icon: BarChart3, text: 'Ranking e estatísticas' },
              { icon: Zap, text: 'Turbinar para destaque' },
            ].map((b) => (
              <div key={b.text} className="flex flex-col items-center gap-2 text-center">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <b.icon className="h-5 w-5 text-blue-600" />
                </div>
                <span className="text-xs sm:text-sm font-medium text-gray-700">{b.text}</span>
              </div>
            ))}
          </div>

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
              <span className="ml-2 text-xs text-blue-600 font-semibold">
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
                          plan.popular ? 'text-blue-400' : 'text-blue-600'
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

      {/* Garantia */}
      <div className="bg-slate-50 py-10 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center gap-4 bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
            <Shield className="h-10 w-10 text-blue-600 flex-shrink-0" />
            <div className="text-left">
              <p className="font-bold text-blue-900 text-base">Garantia de 7 dias</p>
              <p className="text-sm text-blue-700">
                Se não ficar satisfeito nos primeiros 7 dias, devolvemos 100% do valor. Sem perguntas.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-10">
            Perguntas frequentes
          </h2>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="border border-gray-200 rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="font-semibold text-gray-900 text-sm sm:text-base pr-4">
                    {faq.q}
                  </span>
                  <ChevronDown
                    className={`h-5 w-5 text-gray-400 flex-shrink-0 transition-transform ${
                      openFaq === i ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5">
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {faq.a}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Final */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 py-12 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            Pronto para posicionar seu plantel?
          </h2>
          <p className="text-blue-100 mb-8">
            Criadores de 27 estados já confiam na Vitrine do Cavalo.
          </p>
          <Button
            size="lg"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="bg-white text-blue-700 hover:bg-blue-50 font-bold text-base px-8 shadow-lg"
          >
            Escolher meu plano
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PlansPage;
