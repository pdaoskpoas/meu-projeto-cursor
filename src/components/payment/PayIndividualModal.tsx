/**
 * =================================================================
 * MODAL DE PAGAMENTO INDIVIDUAL
 * =================================================================
 * 
 * Modal genérico para pagamento de anúncios e eventos individuais
 * 
 * @author Cavalaria Digital
 * @date 2025-11-27
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Check, Calendar, ArrowRight } from 'lucide-react';
import { INDIVIDUAL_PRICES } from '@/constants/individualPricing';
import { storeCheckoutContext } from '@/utils/checkoutContext';
import { useNavigate } from 'react-router-dom';

// =================================================================
// INTERFACES
// =================================================================

interface PayIndividualModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  type: 'animal' | 'event';
  contentId: string;
  contentName: string;
  onSuccess?: () => void;
}

// =================================================================
// CONSTANTES
// =================================================================

const DESCRIPTIONS = {
  animal: {
    title: 'Anúncio Individual',
    duration: '30 dias',
    features: [
      'Anúncio ativo por 30 dias',
      'Não conta no limite do plano',
      'Renovação opcional',
      'Visibilidade garantida'
    ]
  },
  event: {
    title: 'Evento Individual',
    duration: '30 dias',
    features: [
      'Evento ativo por 30 dias',
      'Não conta no limite do plano',
      'Destaque na listagem',
      'Alcance maximizado'
    ]
  }
};

// =================================================================
// COMPONENTE PRINCIPAL
// =================================================================

export function PayIndividualModal({
  isOpen,
  onClose,
  userId,
  type,
  contentId,
  contentName,
  onSuccess
}: PayIndividualModalProps) {
  const navigate = useNavigate();

  // Estados
  const [loading, setLoading] = useState(false);

  const price = INDIVIDUAL_PRICES[type];
  const description = DESCRIPTIONS[type];

  React.useEffect(() => {
    if (!isOpen) return;
    setLoading(false);
  }, [isOpen, userId]);

  /**
   * Processa o pagamento
   */
  const handlePayment = async () => {
    storeCheckoutContext({
      purchaseType: 'individual',
      contentType: type,
      contentId,
      contentName,
    });
    onClose();
    navigate('/checkout');
  };

  // =================================================================
  // RENDERIZAÇÃO
  // =================================================================

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl">{description.title}</DialogTitle>
          <DialogDescription>
            Publique seu {type === 'animal' ? 'anúncio' : 'evento'} por {description.duration}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
            {/* Informações do Conteúdo */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="font-semibold text-blue-900 mb-1">{contentName}</p>
              <div className="flex items-center gap-2 text-sm text-blue-800">
                <Calendar className="h-4 w-4" />
                <span>Válido por {description.duration}</span>
              </div>
            </div>

            {/* Features */}
            <div>
              <Label className="text-base font-semibold mb-3 block">
                O que está incluído:
              </Label>
              <ul className="space-y-2">
                {description.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
              <p className="font-semibold text-gray-900">Checkout seguro</p>
              <p>
                Ao confirmar, voce sera levado para o checkout para escolher a forma de pagamento
                e informar os dados atualizados.
              </p>
            </div>

            {/* Resumo */}
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex justify-between items-center text-lg">
                <span className="font-semibold">Total</span>
                <span className="text-2xl font-bold text-primary">
                  R$ {price.toFixed(2)}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Pagamento único para {description.duration}
              </p>
            </div>

            {/* Botões */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={loading}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handlePayment}
                disabled={loading}
                className="flex-1"
              >
                <>
                  Ir para checkout
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              </Button>
            </div>

            {/* Info */}
            <div className="text-xs text-gray-500 text-center">
              <p>🔒 Pagamento 100% seguro via Asaas.com</p>
              <p>⚡ Ativação automática após confirmação do pagamento</p>
            </div>
          </div>
      </DialogContent>
    </Dialog>
  );
}

export default PayIndividualModal;

