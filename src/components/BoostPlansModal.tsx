import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Zap, Star, Crown, Check } from 'lucide-react';

interface BoostPlansModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPlan: (plan: 'single' | 'popular' | 'prime') => void;
  type: 'animal' | 'event';
}

const BoostPlansModal: React.FC<BoostPlansModalProps> = ({ 
  isOpen, 
  onClose, 
  onSelectPlan, 
  type 
}) => {
  const [selectedPlan, setSelectedPlan] = useState<'single' | 'popular' | 'prime'>('popular');
  const plans = [
    {
      id: 'single' as const,
      name: '1 Turbinar',
      price: 'R$ 19,90',
      individualPrice: 'R$ 19,90',
      boosts: 1,
      duration: '24 horas',
      description: 'Destaque seu anúncio na página inicial',
      features: [],
      popular: false,
      bestOffer: false,
      savings: null,
      buttonText: 'Selecionar',
      icon: Zap,
      color: 'bg-slate-50 border-slate-200',
      buttonColor: 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800'
    },
    {
      id: 'popular' as const,
      name: '3 Turbinar',
      price: 'R$ 49,90',
      individualPrice: 'R$ 16,63',
      boosts: 3,
      duration: '3x 24 horas',
      description: 'Melhor custo-benefício para uso frequente',
      features: [],
      popular: true,
      bestOffer: false,
      savings: '16%',
      buttonText: 'Receba 3 por R$ 49,90',
      icon: Star,
      color: 'bg-slate-50 border-slate-200',
      buttonColor: 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800'
    },
    {
      id: 'prime' as const,
      name: '7 Turbinar',
      price: 'R$ 89,90',
      individualPrice: 'R$ 12,84',
      boosts: 7,
      duration: '7x 24 horas',
      description: 'Para criadores profissionais',
      features: [],
      popular: false,
      bestOffer: true,
      savings: '35%',
      buttonText: 'Receba 7 por R$ 89,90',
      icon: Crown,
      color: 'bg-slate-50 border-slate-200',
      buttonColor: 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800'
    }
  ];

  const getTypeText = () => {
    return type === 'animal' ? 'animal' : 'evento';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg lg:max-w-4xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl font-bold text-center text-slate-900 mb-2">
            Planos para Turbinar
          </DialogTitle>
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4 sm:p-6 mb-4 sm:mb-6 border border-purple-200">
            <div className="flex items-center justify-center space-x-2 text-slate-700 mb-1">
              <Zap className="h-5 w-5 text-purple-600 flex-shrink-0" />
              <span className="text-base sm:text-lg font-semibold">Destaque seu animal ou evento na página inicial</span>
            </div>
            <p className="text-center text-sm sm:text-base text-slate-600 leading-relaxed">
              Por 24 horas e aumente suas chances de visualização
            </p>
          </div>
        </DialogHeader>

        {/* Mobile: horizontal scroll cards / Desktop: grid */}
        <div className="hidden lg:grid lg:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const IconComponent = plan.icon;
            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl border-2 p-6 transition-all duration-300 cursor-pointer transform hover:scale-105 hover:shadow-xl flex flex-col ${
                  selectedPlan === plan.id
                    ? 'border-blue-500 shadow-lg scale-105'
                    : 'bg-slate-50 border-slate-200'
                }`}
                onClick={() => setSelectedPlan(plan.id)}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-purple-100 text-purple-700 border-purple-200 px-4 py-1 text-sm font-semibold">
                      Popular
                    </Badge>
                  </div>
                )}

                {plan.bestOffer && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-purple-100 text-purple-700 border-purple-200 px-4 py-1 text-sm font-semibold">
                      Melhor Oferta
                    </Badge>
                  </div>
                )}

                <div className="text-center mb-6 flex-grow">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-slate-100">
                    <IconComponent className="h-8 w-8 text-slate-600" />
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 mb-3">
                    {plan.name}
                  </h3>

                  <div className="mb-4">
                    <div className="text-3xl font-bold text-slate-900 mb-1">
                      {plan.id === 'single' ? plan.price : ''}
                    </div>
                    {plan.savings && (
                      <div className="space-y-1">
                        <div className="text-sm text-slate-600">
                          {plan.individualPrice}/cada
                        </div>
                        <Badge className="bg-green-100 text-green-700 border-green-200 text-xs font-semibold">
                          Economize {plan.savings}
                        </Badge>
                      </div>
                    )}
                  </div>

                  <p className="text-sm text-slate-600 leading-relaxed">
                    {plan.description}
                  </p>
                </div>

                <Button
                  className={`w-full ${plan.buttonColor} text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 mt-auto`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectPlan(plan.id);
                  }}
                >
                  <IconComponent className="h-4 w-4 mr-2" />
                  {plan.buttonText}
                </Button>
              </div>
            );
          })}
        </div>

        {/* Mobile layout: stacked cards */}
        <div className="flex flex-col gap-3 lg:hidden">
          {plans.map((plan) => {
            const IconComponent = plan.icon;
            const isSelected = selectedPlan === plan.id;
            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl border-2 p-4 transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? 'border-blue-500 shadow-md bg-white'
                    : 'bg-slate-50 border-slate-200'
                }`}
                onClick={() => setSelectedPlan(plan.id)}
              >
                {(plan.popular || plan.bestOffer) && (
                  <div className="absolute -top-2.5 left-4">
                    <Badge className="bg-purple-100 text-purple-700 border-purple-200 px-3 py-0.5 text-xs font-semibold">
                      {plan.popular ? 'Popular' : 'Melhor Oferta'}
                    </Badge>
                  </div>
                )}

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center bg-slate-100 flex-shrink-0">
                    <IconComponent className="h-6 w-6 text-slate-600" />
                  </div>

                  <div className="flex-grow min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-base font-bold text-slate-900">
                        {plan.name}
                      </h3>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {plan.savings && (
                          <Badge className="bg-green-100 text-green-700 border-green-200 text-xs font-semibold">
                            -{plan.savings}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-baseline gap-2 mt-0.5">
                      <span className="text-lg font-bold text-slate-900">
                        {plan.id === 'single' ? plan.price : plan.individualPrice + '/cada'}
                      </span>
                      {plan.id !== 'single' && (
                        <span className="text-xs text-slate-500">
                          Total: {plan.price}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{plan.description}</p>
                  </div>

                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    isSelected ? 'border-blue-500 bg-blue-500' : 'border-slate-300'
                  }`}>
                    {isSelected && <Check className="h-3 w-3 text-white" />}
                  </div>
                </div>
              </div>
            );
          })}

          <Button
            className={`w-full ${plans.find(p => p.id === selectedPlan)?.buttonColor} text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 mt-2`}
            onClick={() => onSelectPlan(selectedPlan)}
          >
            <Zap className="h-4 w-4 mr-2" />
            {plans.find(p => p.id === selectedPlan)?.buttonText}
          </Button>
        </div>

        <div className="mt-4 sm:mt-8 p-4 sm:p-6 bg-gradient-to-r from-slate-50 to-purple-50 rounded-xl border border-slate-200">
          <div className="flex items-center justify-center space-x-3 text-slate-700">
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Zap className="h-4 w-4 text-purple-600" />
            </div>
            <div className="text-center">
              <div className="font-semibold text-slate-800 text-sm sm:text-base mb-1">
                Flexibilidade Total
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Os créditos comprados podem ser utilizados tanto na página <strong>"Meus Equinos"</strong> quanto <strong>"Meus Eventos"</strong> para destacar animais ou eventos.
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BoostPlansModal;
