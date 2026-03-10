import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Zap } from 'lucide-react';
import { BoostPlan, formatCurrency } from '@/components/payment/boostPricing';

interface BoostPlanSelectorProps {
  plans: BoostPlan[];
  selectedQuantity: number;
  onSelect: (quantity: number) => void;
}

export function BoostPlanSelector({
  plans,
  selectedQuantity,
  onSelect,
}: BoostPlanSelectorProps) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 text-lg font-semibold">
          <Zap className="h-5 w-5 text-yellow-500" />
          Chame atenção
        </div>
        <p className="text-sm text-muted-foreground">
          Seja um perfil de destaque na sua area por 30 minutos.
        </p>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2">
        {plans.map((plan) => {
          const isSelected = selectedQuantity === plan.quantity;
          return (
            <div
              key={plan.quantity}
              className={`min-w-[220px] flex-1 rounded-xl border-2 p-4 transition-all ${
                isSelected ? 'border-primary shadow-lg' : 'border-muted'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold">{plan.title}</h3>
                {plan.badge && <Badge variant="secondary">{plan.badge}</Badge>}
              </div>
              <p className="text-sm text-muted-foreground">{plan.subtitle}</p>

              <div className="mt-6 space-y-1">
                <div className="text-3xl font-bold">{formatCurrency(plan.priceEach)}</div>
                <p className="text-xs text-muted-foreground">por boost</p>
              </div>

              <div className="mt-4 text-sm text-muted-foreground">
                Total {formatCurrency(plan.total)}
              </div>

              {plan.discount > 0 && (
                <div className="mt-2 text-xs text-green-600">
                  Economize {(plan.discount * 100).toFixed(0)}% neste pacote
                </div>
              )}

              <Button
                onClick={() => onSelect(plan.quantity)}
                className="mt-6 w-full"
                variant={isSelected ? 'default' : 'outline'}
              >
                Selecionar
              </Button>
            </div>
          );
        })}
      </div>

      <div className="text-xs text-muted-foreground text-center">
        Pagamento seguro e creditos liberados automaticamente apos a aprovacao.
      </div>
    </div>
  );
}

export default BoostPlanSelector;
