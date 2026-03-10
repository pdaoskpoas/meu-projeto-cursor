import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle, CreditCard, TrendingUp, Zap } from 'lucide-react';
import { EventLimitCheck } from '@/services/eventLimitsService';

interface EventLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  limitInfo: EventLimitCheck;
  onPayIndividual: () => void;
  onUpgradePlan: () => void;
  isProcessing?: boolean;
}

const EventLimitModal: React.FC<EventLimitModalProps> = ({
  isOpen,
  onClose,
  limitInfo,
  onPayIndividual,
  onUpgradePlan,
  isProcessing = false,
}) => {
  const getTitle = () => {
    switch (limitInfo.reason) {
      case 'no_active_plan':
        return 'Plano Necessário';
      case 'active_limit_reached':
        return 'Limite de Evento Ativo Atingido';
      case 'monthly_quota_exhausted':
        return 'Cota Mensal Esgotada';
      case 'no_monthly_quota':
        return 'Upgrade Necessário';
      default:
        return 'Aviso';
    }
  };

  const getIcon = () => {
    if (limitInfo.reason === 'no_active_plan') {
      return <AlertCircle className="h-12 w-12 text-orange-600" />;
    }
    return <Zap className="h-12 w-12 text-blue-600" />;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            {getIcon()}
          </div>
          <DialogTitle className="text-center text-2xl">{getTitle()}</DialogTitle>
          <DialogDescription className="text-center text-base pt-2">
            {limitInfo.message}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Estatísticas atuais */}
          <div className="bg-slate-50 rounded-xl p-4 grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-slate-900">
                {limitInfo.current_count}/{limitInfo.event_limit}
              </p>
              <p className="text-sm text-slate-600">Evento Ativo</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">
                {limitInfo.publications_used ?? 0}/{limitInfo.publications_quota ?? 0}
              </p>
              <p className="text-sm text-slate-600">Publicações Usadas</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">
                {limitInfo.publications_available ?? 0}
              </p>
              <p className="text-sm text-slate-600">Restantes Este Mês</p>
            </div>
          </div>

          {/* Opções */}
          <div className="space-y-4">
            {/* Opção 1: Pagamento Individual */}
            {limitInfo.can_pay_individual && (
              <div className="border-2 border-blue-200 rounded-xl p-6 hover:border-blue-400 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="bg-blue-100 rounded-full p-3">
                    <CreditCard className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-slate-900 mb-1">
                      Publicar Este Evento
                    </h3>
                    <p className="text-slate-600 mb-3">
                      Pague apenas por este evento e ele ficará ativo por 30 dias
                    </p>
                    <ul className="space-y-2 text-sm text-slate-600 mb-4">
                      <li className="flex items-center gap-2">
                        <span className="text-green-600">✓</span>
                        <span>Ativo por 30 dias</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-600">✓</span>
                        <span>Não conta no limite do plano</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-600">✓</span>
                        <span>Pode turbinar posteriormente</span>
                      </li>
                    </ul>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-bold text-blue-600">
                          R$ {limitInfo.individual_price?.toFixed(2)}
                        </p>
                        <p className="text-xs text-slate-500">Pagamento único</p>
                      </div>
                      <Button
                        onClick={onPayIndividual}
                        disabled={isProcessing}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <CreditCard className="h-4 w-4 mr-2" />
                        {isProcessing ? 'Processando...' : 'Pagar Agora'}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Opção 2: Upgrade de Plano */}
            {limitInfo.can_upgrade && (
              <div className="border-2 border-green-200 rounded-xl p-6 hover:border-green-400 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="bg-green-100 rounded-full p-3">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-slate-900 mb-1">
                      Fazer Upgrade do Plano
                    </h3>
                    <p className="text-slate-600 mb-3">
                      Aumente seu limite mensal e publique mais eventos
                    </p>
                    <ul className="space-y-2 text-sm text-slate-600 mb-4">
                      <li className="flex items-center gap-2">
                        <span className="text-green-600">✓</span>
                        <span>Mais eventos ativos simultaneamente</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-600">✓</span>
                        <span>Renovação automática mensal</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-600">✓</span>
                        <span>Benefícios adicionais do plano</span>
                      </li>
                    </ul>
                    <Button
                      onClick={onUpgradePlan}
                      variant="outline"
                      className="w-full border-green-600 text-green-600 hover:bg-green-50"
                    >
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Ver Planos Disponíveis
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Apenas informativo se não tem plano */}
            {limitInfo.requires_individual_payment && !limitInfo.can_upgrade && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-900 mb-1">
                      Como Funciona
                    </p>
                    <p className="text-sm text-blue-700">
                      Você pode publicar este evento pagando R$ 49,90. Ele ficará ativo por
                      30 dias. Após esse período, você pode renovar ou ele será pausado
                      automaticamente.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Botão cancelar */}
          <div className="flex justify-center pt-4">
            <Button variant="ghost" onClick={onClose} disabled={isProcessing}>
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EventLimitModal;


