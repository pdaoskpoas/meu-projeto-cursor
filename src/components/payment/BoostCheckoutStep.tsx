import React from 'react';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Loader2, QrCode } from 'lucide-react';
import { formatCurrency } from '@/components/payment/boostPricing';

interface BoostCheckoutStepProps {
  quantity: number;
  totalPrice: number;
  finalPrice: number;
  discount: number;
  billingType: 'PIX' | 'CREDIT_CARD';
  isProcessing: boolean;
  isPolling: boolean;
  canGoBack: boolean;
  showBillingOptions?: boolean;
  confirmLabel?: string;
  showConfirmArrow?: boolean;
  onBillingTypeChange: (value: 'PIX' | 'CREDIT_CARD') => void;
  onBack: () => void;
  onConfirm: () => void;
}

export function BoostCheckoutStep({
  quantity,
  totalPrice,
  finalPrice,
  discount,
  billingType,
  isProcessing,
  isPolling,
  canGoBack,
  showBillingOptions = true,
  confirmLabel,
  showConfirmArrow,
  onBillingTypeChange,
  onBack,
  onConfirm,
}: BoostCheckoutStepProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4 rounded-xl border border-muted p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold">Forma de pagamento</h3>
            <span className="text-xs text-muted-foreground">Compra segura</span>
          </div>

          {showBillingOptions ? (
            <RadioGroup
              value={billingType}
              onValueChange={(value: 'PIX' | 'CREDIT_CARD') => onBillingTypeChange(value)}
              className="space-y-3"
            >
              <Label
                htmlFor="pix"
                className={`flex items-center gap-3 rounded-lg border-2 p-4 transition-all ${
                  billingType === 'PIX' ? 'border-primary bg-primary/5' : 'border-muted'
                }`}
              >
                <RadioGroupItem value="PIX" id="pix" />
                <QrCode className="h-5 w-5" />
                <div className="flex-1">
                  <div className="font-semibold">Pix</div>
                  <div className="text-xs text-muted-foreground">
                    Creditos liberados rapidamente
                  </div>
                </div>
                <Badge variant="secondary">Recomendado</Badge>
              </Label>

              <Label
                htmlFor="card"
                className={`flex items-center gap-3 rounded-lg border-2 p-4 transition-all ${
                  billingType === 'CREDIT_CARD' ? 'border-primary bg-primary/5' : 'border-muted'
                }`}
              >
                <RadioGroupItem value="CREDIT_CARD" id="card" />
                <CreditCard className="h-5 w-5" />
                <div className="flex-1">
                  <div className="font-semibold">Cartao de credito</div>
                  <div className="text-xs text-muted-foreground">Pagamento em 1x</div>
                </div>
              </Label>
            </RadioGroup>
          ) : (
            <div className="rounded-lg border border-muted bg-muted/20 p-4 text-sm text-muted-foreground">
              Finalize o pagamento no checkout para escolher a forma de pagamento.
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <Button
              variant="outline"
              onClick={onBack}
              disabled={!canGoBack || isProcessing || isPolling}
            >
              Voltar
            </Button>
            <Button onClick={onConfirm} disabled={isProcessing || isPolling} className="flex-1">
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  {isPolling ? 'Aguardando confirmacao...' : confirmLabel ?? 'Confirmar pagamento'}
                  {showConfirmArrow && <span className="ml-2">{'->'}</span>}
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="rounded-xl border border-muted p-4">
          <h3 className="mb-3 text-base font-semibold">Resumo</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>{quantity} Boost(s)</span>
              <span>{formatCurrency(totalPrice)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Desconto ({(discount * 100).toFixed(0)}%)</span>
                <span>-{formatCurrency(totalPrice - finalPrice)}</span>
              </div>
            )}
            <div className="flex justify-between border-t pt-2 text-base font-semibold">
              <span>Total</span>
              <span>{formatCurrency(finalPrice)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="text-center text-xs text-muted-foreground">
        Pagamento via Asaas. Nenhum dado do cartao e armazenado.
      </div>
    </div>
  );
}

export default BoostCheckoutStep;
