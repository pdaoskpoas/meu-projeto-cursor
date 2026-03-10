import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  CreditCard, 
  X,
  Clock,
  Calendar,
  Zap
} from 'lucide-react';

interface EventPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmPayment: () => void;
  isProcessing?: boolean;
}

export const EventPaymentModal: React.FC<EventPaymentModalProps> = ({
  isOpen,
  onClose,
  onConfirmPayment,
  isProcessing = false
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex justify-between items-start pb-2">
            <div className="flex-1">
              <DialogTitle className="text-2xl font-bold text-gray-900 mb-1">
                Publicar Evento
              </DialogTitle>
              <p className="text-sm text-gray-600">
                Confirme o pagamento para ativar seu evento
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="flex-shrink-0 -mt-2 -mr-2"
              disabled={isProcessing}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Valor do Evento */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border-2 border-blue-200">
            <div className="text-center mb-4">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-600 rounded-full mb-3">
                <Calendar className="h-7 w-7 text-white" />
              </div>
              <p className="text-4xl font-bold text-gray-900 mb-1">
                R$ 49,99
              </p>
              <p className="text-sm text-gray-600">
                Publicação de evento por 30 dias
              </p>
            </div>

            {/* O que está incluído */}
            <div className="space-y-2 text-sm text-gray-700 bg-white/60 p-4 rounded-lg">
              <div className="flex items-start gap-2">
                <Clock className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                <span>Evento ativo por <strong>30 dias</strong></span>
              </div>
              <div className="flex items-start gap-2">
                <Zap className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                <span>Destaque automático na home por <strong>24 horas</strong></span>
              </div>
              <div className="flex items-start gap-2">
                <CreditCard className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                <span>Pagamento único, sem renovação automática</span>
              </div>
            </div>
          </div>

          {/* Botões de ação */}
          <div className="space-y-3">
            <Button
              onClick={onConfirmPayment}
              disabled={isProcessing}
              className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold text-base rounded-lg shadow-lg shadow-blue-600/30 hover:shadow-xl hover:shadow-blue-600/40"
            >
              {isProcessing ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Processando pagamento...
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-5 w-5" />
                  Confirmar Pagamento
                </>
              )}
            </Button>

            <Button
              variant="ghost"
              onClick={onClose}
              disabled={isProcessing}
              className="w-full text-gray-500 hover:text-gray-700"
            >
              Cancelar
            </Button>
          </div>

          {/* Aviso */}
          <p className="text-xs text-center text-gray-500">
            Após o pagamento, você terá 24 horas para editar as informações do evento
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};


