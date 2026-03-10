// src/components/animal/NewAnimalWizard/steps/PaywallModal.tsx

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Sparkles, 
  CreditCard, 
  X
} from 'lucide-react';

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectIndividual: () => void;
  onSelectPlan: () => void;
}

export const PaywallModal: React.FC<PaywallModalProps> = ({
  isOpen,
  onClose,
  onSelectIndividual,
  onSelectPlan
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex justify-between items-start pb-2">
            <div className="flex-1">
              <DialogTitle className="text-2xl font-bold text-gray-900 mb-1">
                Seu anúncio está pronto
              </DialogTitle>
              <p className="text-sm text-gray-600">
                Escolha um plano para ativar a publicação
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="flex-shrink-0 -mt-2 -mr-2"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Call to Action */}
          <div>
            <h3 className="text-center font-semibold text-lg text-gray-700 mb-6">
              Escolha como deseja ativar seu anúncio:
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Opção 1: Pagamento Individual */}
              <Button
                variant="outline"
                className="h-auto p-5 flex flex-col items-start gap-3 border-2 border-gray-300 hover:border-blue-500 hover:bg-blue-50 transition-all"
                onClick={onSelectIndividual}
              >
                <div className="text-left w-full">
                  <div className="flex items-center gap-2 mb-2">
                    <CreditCard className="h-5 w-5 text-gray-700" />
                    <span className="font-bold text-base text-gray-900">Publicação Individual</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 mb-3">
                    R$ 47,00<span className="text-sm font-normal text-gray-600">/30 dias</span>
                  </p>
                  <div className="space-y-1.5 text-sm text-gray-700">
                    <p>• Apenas este anúncio</p>
                    <p>• Ativo por 30 dias</p>
                    <p>• Renovação manual</p>
                  </div>
                </div>
              </Button>

              {/* Opção 2: Assinar Plano */}
              <Button
                variant="outline"
                className="h-auto p-5 flex flex-col items-start gap-3 border-2 border-blue-400 hover:border-blue-600 hover:bg-blue-50 transition-all"
                onClick={onSelectPlan}
              >
                <div className="text-left w-full">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-5 w-5 text-blue-600" />
                    <span className="font-bold text-base text-gray-900">Plano Mensal</span>
                    <Badge className="bg-blue-600 text-white text-xs ml-auto">Recomendado</Badge>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 mb-3">
                    A partir de R$ 97<span className="text-sm font-normal text-gray-600">/mês</span>
                  </p>
                  <div className="space-y-1.5 text-sm text-gray-700">
                    <p>• Até 15 anúncios ativos</p>
                    <p>• Economia de até 55%</p>
                    <p>• Recursos Premium</p>
                  </div>
                </div>
              </Button>
            </div>

            {/* Botão para voltar */}
            <div className="text-center mt-6">
              <Button
                variant="ghost"
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 text-sm"
              >
                ← Voltar
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

