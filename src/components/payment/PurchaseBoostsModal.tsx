/**
 * =================================================================
 * MODAL DE COMPRA DE BOOSTS
 * =================================================================
 * 
 * Modal para compra de boosts avulsos (destaques)
 * Permite escolher quantidade e forma de pagamento
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
import { Zap } from 'lucide-react';
import {
  BOOST_PLANS,
  BOOST_PRICE,
  getBoostDiscount,
  getBoostTotal,
} from '@/components/payment/boostPricing';
import { BoostPlanSelector } from '@/components/payment/BoostPlanSelector';
import { BoostCheckoutStep } from '@/components/payment/BoostCheckoutStep';
import { storeCheckoutContext } from '@/utils/checkoutContext';
import { useNavigate } from 'react-router-dom';

// =================================================================
// INTERFACES
// =================================================================

interface PurchaseBoostsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onSuccess?: () => void;
  initialQuantity?: number;
  lockQuantity?: boolean;
}

// =================================================================
// COMPONENTE PRINCIPAL
// =================================================================

export function PurchaseBoostsModal({
  isOpen,
  onClose,
  initialQuantity,
  lockQuantity = false
}: PurchaseBoostsModalProps) {
  const navigate = useNavigate();

  // Estados
  const [quantity, setQuantity] = useState(initialQuantity ?? 5);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'select' | 'checkout'>('select');

  React.useEffect(() => {
    if (!isOpen) return;

    if (typeof initialQuantity === 'number') {
      setQuantity(initialQuantity);
    }

    setLoading(false);
    setStep(lockQuantity || typeof initialQuantity === 'number' ? 'checkout' : 'select');
  }, [isOpen, initialQuantity, lockQuantity]);

  const totalPrice = quantity * BOOST_PRICE;
  const finalPrice = getBoostTotal(quantity);
  const discount = getBoostDiscount(quantity);

  /**
   * Processa a compra
   */
  const handlePurchase = async () => {
    storeCheckoutContext({
      purchaseType: 'boost',
      quantity,
    });
    onClose();
    navigate('/checkout');
  };

  // =================================================================
  // RENDERIZAÇÃO
  // =================================================================

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Zap className="h-6 w-6 text-yellow-500" />
            {step === 'select' ? 'Escolha seu pacote de Boosts' : 'Finalizar compra'}
          </DialogTitle>
          <DialogDescription>
            {step === 'select'
              ? 'Selecione o pacote ideal e siga para o checkout'
              : 'Revise o pedido e conclua o pagamento'}
          </DialogDescription>
        </DialogHeader>

        {step === 'select' ? (
          <BoostPlanSelector
            plans={BOOST_PLANS}
            selectedQuantity={quantity}
            onSelect={(qty) => {
              setQuantity(qty);
              setStep('checkout');
            }}
          />
        ) : (
          <div className="space-y-6">
            <BoostCheckoutStep
              quantity={quantity}
              totalPrice={totalPrice}
              finalPrice={finalPrice}
              discount={discount}
              billingType="CREDIT_CARD"
              isProcessing={loading}
              isPolling={false}
              canGoBack={!lockQuantity}
              showBillingOptions={false}
              confirmLabel="Ir para checkout"
              showConfirmArrow
              onBillingTypeChange={() => {}}
              onBack={() => {
                if (!lockQuantity) setStep('select');
              }}
              onConfirm={handlePurchase}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default PurchaseBoostsModal;

