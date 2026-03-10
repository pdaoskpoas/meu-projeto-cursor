import React from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, Crown, Target, TrendingUp } from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  monthlyDiscount: number;
  annualDiscount: number;
  ads: number;
  monthlyBasePrice: number;
  monthlyPrice: number;
  annualPrice: number;
  annualInstallments: number;
  features: string[];
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  popular: boolean;
}

interface PlanCardProps {
  plan: Plan;
  billingPeriod: 'monthly' | 'annual';
  selectedPlan: string | null;
  onPlanSelect: (planId: string) => void;
}

const PlanCard: React.FC<PlanCardProps> = ({ plan, billingPeriod, selectedPlan, onPlanSelect }) => {
  const IconComponent = plan.icon;
  
  const getPrice = () => {
    if (billingPeriod === 'monthly') {
      return plan.monthlyPrice;
    }
    // Anual: preço base com desconto anual aplicado
    return plan.monthlyBasePrice * (1 - plan.annualDiscount / 100);
  };

  const getOriginalPrice = () => {
    // Sempre mostra o preço base (sem desconto)
    return plan.monthlyBasePrice;
  };

  const getDiscount = () => {
    return billingPeriod === 'monthly' ? plan.monthlyDiscount : plan.annualDiscount;
  };

  const getAnnualSavings = () => {
    // Economia = (preço mensal × 12) - (preço anual com desconto × 12)
    const monthlyYearlyCost = plan.monthlyPrice * 12;
    const annualYearlyCost = getPrice() * 12;
    return monthlyYearlyCost - annualYearlyCost;
  };

  return (
    <div className={`relative bg-white rounded-2xl border-2 transition-all duration-300 hover:shadow-xl ${
      selectedPlan === plan.id 
        ? 'border-orange-500 shadow-lg ring-4 ring-orange-100' 
        : 'border-slate-200 hover:border-orange-300'
    } ${plan.popular ? 'ring-2 ring-orange-200' : ''}`}>
      
      {/* Popular Badge */}
      {plan.popular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-1 rounded-full text-sm font-bold flex items-center space-x-1 shadow-lg">
            <Crown className="h-4 w-4" />
            <span>MAIS POPULAR</span>
          </div>
        </div>
      )}

      <div className="p-8">
        {/* Header */}
        <div className="text-center space-y-4 mb-8">
          <div className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center ${
            plan.color === 'blue' 
              ? 'bg-blue-100 text-blue-600' 
              : plan.color === 'orange'
              ? 'bg-orange-100 text-orange-600'
              : 'bg-emerald-100 text-emerald-600'
          }`}>
            <IconComponent className="h-8 w-8" />
          </div>
          
          <div>
            <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
            <p className="text-sm text-slate-600 mt-1">{plan.ads} anúncios por mês</p>
          </div>
        </div>

        {/* Pricing */}
        <div className="text-center space-y-2 mb-8">
          <div className="flex items-center justify-center space-x-2">
            <span className="text-2xl text-slate-400 line-through">
              R$ {getOriginalPrice().toFixed(2).replace('.', ',')}
            </span>
            <span className={`px-2 py-1 rounded-full text-xs font-bold ${
              plan.color === 'blue' 
                ? 'bg-blue-100 text-blue-700' 
                : plan.color === 'orange'
                ? 'bg-orange-100 text-orange-700'
                : 'bg-emerald-100 text-emerald-700'
            }`}>
              -{getDiscount()}%
            </span>
          </div>
          <div className="text-4xl font-bold text-slate-900">
            R$ {getPrice().toFixed(2).replace('.', ',')}
          </div>
          <p className="text-sm text-slate-600">
            por mês {billingPeriod === 'annual' && '(cobrado anualmente)'}
          </p>
          
          {billingPeriod === 'annual' && (
            <p className="text-xs text-emerald-600 font-medium">
              Economize R$ {getAnnualSavings().toFixed(2).replace('.', ',')} por ano
            </p>
          )}
        </div>

        {/* Features */}
        <div className="space-y-3 mb-8">
          {plan.features.map((feature, index) => (
            <div key={index} className="flex items-start space-x-3">
              <CheckCircle className={`h-5 w-5 mt-0.5 flex-shrink-0 ${
                plan.color === 'blue' 
                  ? 'text-blue-500' 
                  : plan.color === 'orange'
                  ? 'text-orange-500'
                  : 'text-emerald-500'
              }`} />
              <span className="text-sm text-slate-700">{feature}</span>
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <Button
          onClick={() => onPlanSelect(plan.id)}
          className={`w-full py-3 text-base font-semibold transition-all duration-300 ${
            selectedPlan === plan.id
              ? 'bg-orange-500 hover:bg-orange-600 text-white'
              : plan.popular
              ? 'bg-orange-500 hover:bg-orange-600 text-white'
              : plan.color === 'blue'
              ? 'bg-blue-500 hover:bg-blue-600 text-white'
              : 'bg-emerald-500 hover:bg-emerald-600 text-white'
          }`}
        >
          {selectedPlan === plan.id ? '✓ Plano Selecionado' : `Começar com ${plan.name}`}
        </Button>
      </div>
    </div>
  );
};

export default PlanCard;




