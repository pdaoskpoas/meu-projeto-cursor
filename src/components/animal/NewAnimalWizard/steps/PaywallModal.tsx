// src/components/animal/NewAnimalWizard/steps/PaywallModal.tsx
//
// Modal exibido quando o usuário tenta publicar sem plano ativo ou com cota esgotada.
// Modelo 100% baseado em planos: toda publicação exige plano.

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, AlertCircle, X } from 'lucide-react';

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPlan: () => void;
  /** true quando o usuário já tem plano, mas a cota está esgotada */
  isQuotaExceeded?: boolean;
}

export const PaywallModal: React.FC<PaywallModalProps> = ({
  isOpen,
  onClose,
  onSelectPlan,
  isQuotaExceeded = false,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex justify-between items-start pb-2">
            <div className="flex-1">
              <DialogTitle className="text-2xl font-bold text-gray-900 mb-1">
                {isQuotaExceeded
                  ? 'Limite de animais atingido'
                  : 'Plano necessário para publicar'}
              </DialogTitle>
              <p className="text-sm text-gray-600">
                {isQuotaExceeded
                  ? 'Faça upgrade para cadastrar mais animais.'
                  : 'Para cadastrar e publicar animais, é necessário ter um plano ativo.'}
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
          {isQuotaExceeded && (
            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-900">
                Você atingiu o limite de animais do seu plano atual.
                Faça upgrade para um plano superior para cadastrar mais animais.
                Seus animais existentes continuarão ativos.
              </p>
            </div>
          )}

          {/* Assinar / Upgrade Plano */}
          <Button
            className="w-full h-auto p-6 flex flex-col items-start gap-3 bg-blue-600 hover:bg-blue-700 text-white transition-all"
            onClick={onSelectPlan}
          >
            <div className="text-left w-full">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-5 w-5" />
                <span className="font-bold text-lg">
                  {isQuotaExceeded ? 'Fazer Upgrade' : 'Assinar um Plano'}
                </span>
                <Badge className="bg-white text-blue-700 text-xs ml-auto">
                  Obrigatório
                </Badge>
              </div>
              <p className="text-2xl font-bold mb-3">
                A partir de R$ 37,90<span className="text-sm font-normal opacity-80">/mês</span>
              </p>
              <div className="space-y-1.5 text-sm opacity-90">
                <p>Essencial: 1 animal por R$ 37,90/mês</p>
                <p>Criador: 5 animais + 2 turbinares por R$ 97,90/mês</p>
                <p>Haras Destaque: 10 animais + 5 turbinares por R$ 197,90/mês</p>
                <p>Elite: 25 animais + 10 turbinares por R$ 397,90/mês</p>
              </div>
            </div>
          </Button>

          <div className="text-center">
            <Button
              variant="ghost"
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-sm"
            >
              Voltar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
