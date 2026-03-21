/**
 * =================================================================
 * MODAL DE COMPRA DE TURBINARES
 * =================================================================
 *
 * Turbinares baseados em duração:
 * - 24 horas → R$ 19,90
 * - 3 dias   → R$ 49,90
 * - 7 dias   → R$ 89,90
 *
 * O usuário pode usar turbinares inclusos no plano primeiro.
 * Quando esgotados, pode comprar avulso aqui.
 *
 * @author Cavalaria Digital
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Zap, Clock } from 'lucide-react';
import { storeCheckoutContext } from '@/utils/checkoutContext';
import { useNavigate } from 'react-router-dom';
import { BOOST_TIERS, type BoostDuration } from '@/constants/checkoutPlans';

// =================================================================
// INTERFACES
// =================================================================

interface PurchaseBoostsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  animalId?: string;
  animalName?: string;
  onSuccess?: () => void;
}

// =================================================================
// COMPONENTE PRINCIPAL
// =================================================================

export function PurchaseBoostsModal({
  isOpen,
  onClose,
  animalId,
  animalName,
}: PurchaseBoostsModalProps) {
  const navigate = useNavigate();

  const [selectedDuration, setSelectedDuration] = useState<BoostDuration>('24h');

  React.useEffect(() => {
    if (isOpen) {
      setSelectedDuration('24h');
    }
  }, [isOpen]);

  const selectedTier = BOOST_TIERS.find(t => t.duration === selectedDuration)!;

  const formatPrice = (v: number) =>
    v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const handlePurchase = () => {
    storeCheckoutContext({
      purchaseType: 'boost',
      boostDuration: selectedDuration,
      animalId,
    });
    onClose();
    navigate('/checkout');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Zap className="h-6 w-6 text-yellow-500" />
            Turbinar Animal
          </DialogTitle>
          <DialogDescription>
            {animalName
              ? `Destaque "${animalName}" por um período escolhido`
              : 'Escolha a duração do destaque para seu animal'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Seleção de Duração */}
          <RadioGroup
            value={selectedDuration}
            onValueChange={(v) => setSelectedDuration(v as BoostDuration)}
          >
            <div className="space-y-3">
              {BOOST_TIERS.map((tier) => (
                <Label
                  key={tier.duration}
                  htmlFor={`boost-${tier.duration}`}
                  className={`
                    flex items-center gap-4 p-4 border-2 rounded-lg cursor-pointer
                    transition-all hover:border-primary/50
                    ${selectedDuration === tier.duration ? 'border-primary bg-primary/5' : 'border-gray-200'}
                  `}
                >
                  <RadioGroupItem value={tier.duration} id={`boost-${tier.duration}`} />
                  <Clock className="h-5 w-5 text-gray-500" />
                  <div className="flex-1">
                    <div className="font-semibold">{tier.label}</div>
                    <div className="text-sm text-gray-500">
                      Destaque por {tier.label.toLowerCase()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg">R$ {formatPrice(tier.price)}</div>
                  </div>
                  {tier.duration === '7d' && (
                    <Badge variant="secondary" className="ml-2">Melhor custo</Badge>
                  )}
                </Label>
              ))}
            </div>
          </RadioGroup>

          {/* Resumo */}
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="font-semibold mb-2">Resumo</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Turbinar por {selectedTier.label}</span>
                <span className="font-semibold">R$ {formatPrice(selectedTier.price)}</span>
              </div>
              {animalName && (
                <div className="flex justify-between text-gray-500">
                  <span>Animal:</span>
                  <span>{animalName}</span>
                </div>
              )}
            </div>
          </div>

          {/* Botões */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button onClick={handlePurchase} className="flex-1">
              Ir para checkout
            </Button>
          </div>

          <p className="text-xs text-gray-500 text-center">
            O destaque expira automaticamente ao final do período escolhido.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default PurchaseBoostsModal;
