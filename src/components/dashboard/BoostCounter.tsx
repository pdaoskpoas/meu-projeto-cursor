import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Zap, ShoppingCart } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface BoostCounterProps {
  availableBoosts: number;
  showBuyButton?: boolean;
  onBuyClick?: () => void;
}

const BoostCounter: React.FC<BoostCounterProps> = ({ 
  availableBoosts, 
  showBuyButton = false,
  onBuyClick 
}) => {
  return (
    <Card className="p-4 bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center shadow-md">
            <Zap className="h-6 w-6 text-white" />
          </div>
          
          <div className="min-w-0">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex flex-wrap items-center gap-2 cursor-help">
                    <Badge 
                      className={`text-lg px-3 py-1 font-bold ${
                        availableBoosts > 0 
                          ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                          : 'bg-slate-500 hover:bg-slate-600 text-white'
                      }`}
                    >
                      {availableBoosts}
                    </Badge>
                    <span className="font-semibold text-slate-800">
                      {availableBoosts === 1 ? 'Turbinar Disponível' : 'Turbinar Disponíveis'}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-sm">
                    Use para turbinar seus animais ou eventos (24h, 3 dias ou 7 dias)
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <p className="text-xs text-slate-600 mt-1">
              {availableBoosts > 0 
                ? 'Tenha seu anúncio em destaque no site para alcançar mais pessoas e gerar mais cliques'
                : 'Sem créditos disponíveis'}
            </p>
          </div>
        </div>

        {showBuyButton && onBuyClick && (
          <Button 
            onClick={onBuyClick}
            className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-md min-h-11"
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Comprar Turbinar
          </Button>
        )}
      </div>
    </Card>
  );
};

export default BoostCounter;
