import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Check, Star, Crown, Zap } from 'lucide-react';
import { EventFormData, publicationPlans } from '../types';

interface EventPublicationStepProps {
  formData: EventFormData;
  setFormData: (data: EventFormData) => void;
}

const EventPublicationStep: React.FC<EventPublicationStepProps> = ({ formData, setFormData }) => {
  const handlePlanSelect = (planId: string) => {
    setFormData({ ...formData, publicationPlan: planId });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Plano de Publicação</h3>
        <p className="text-sm text-gray-600">Escolha como você quer divulgar seu evento</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {publicationPlans.map((plan) => {
          const isSelected = formData.publicationPlan === plan.id;
          const IconComponent = plan.id === 'basic' ? Zap : plan.id === 'premium' ? Star : Crown;
          
          return (
            <Card 
              key={plan.id}
              className={`relative p-6 cursor-pointer transition-all duration-200 hover:shadow-lg ${
                isSelected 
                  ? 'ring-2 ring-blue-500 shadow-lg' 
                  : 'hover:shadow-md'
              } ${plan.popular ? 'border-blue-500' : ''}`}
              onClick={() => handlePlanSelect(plan.id)}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-blue-500 text-white px-3 py-1">
                    Mais Popular
                  </Badge>
                </div>
              )}

              <div className="text-center mb-4">
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-3 ${plan.color}`}>
                  <IconComponent className="h-6 w-6" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900">{plan.name}</h4>
                <div className="text-3xl font-bold text-gray-900 mt-2">
                  {formatPrice(plan.price)}
                </div>
                <p className="text-sm text-gray-600 mt-1">{plan.description}</p>
              </div>

              <div className="space-y-3 mb-6">
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>

              <Button
                variant={isSelected ? "default" : "outline"}
                className="w-full"
                onClick={() => handlePlanSelect(plan.id)}
              >
                {isSelected ? "Selecionado" : "Selecionar Plano"}
              </Button>
            </Card>
          );
        })}
      </div>

      {/* Informações Adicionais */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <h4 className="font-medium text-blue-900 mb-2">Informações Importantes</h4>
        <div className="text-sm text-blue-700 space-y-1">
          <p>• O pagamento será processado após a confirmação do evento</p>
          <p>• Todos os planos incluem suporte técnico</p>
          <p>• Você pode alterar o plano antes da publicação</p>
          <p>• Eventos gratuitos podem usar o plano básico sem custo</p>
        </div>
      </Card>

      {/* Preview do Plano Selecionado */}
      {formData.publicationPlan && (
        <Card className="p-4 bg-gray-50">
          <h4 className="font-medium text-gray-900 mb-2">Plano Selecionado:</h4>
          {(() => {
            const selectedPlan = publicationPlans.find(plan => plan.id === formData.publicationPlan);
            return selectedPlan ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${selectedPlan.color}`}>
                    <span className="text-lg">{selectedPlan.icon}</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{selectedPlan.name}</p>
                    <p className="text-sm text-gray-600">{selectedPlan.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900">
                    {formatPrice(selectedPlan.price)}
                  </p>
                </div>
              </div>
            ) : null;
          })()}
        </Card>
      )}
    </div>
  );
};

export default EventPublicationStep;

