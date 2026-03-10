import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Users, Info } from 'lucide-react';
import { EventFormData } from '../CreateEventModal';
import { Badge } from '@/components/ui/badge';
import { EventPaymentModal } from '../EventPaymentModal';

interface EventReviewStepProps {
  formData: EventFormData;
  onPublish: () => void;
  isSubmitting?: boolean;
}

const EventReviewStep: React.FC<EventReviewStepProps> = ({ 
  formData, 
  onPublish, 
  isSubmitting = false 
}) => {
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const handlePublishClick = () => {
    setShowPaymentModal(true);
  };

  const handleConfirmPayment = () => {
    setShowPaymentModal(false);
    onPublish();
  };

  return (
    <div className="space-y-5">
      {/* Resumo do Evento - Minimalista */}
      <Card className="p-5 border-slate-200">
        <div className="space-y-4">
          <div>
            <p className="text-xl font-bold text-slate-900 mb-1">{formData.title}</p>
            <Badge variant="secondary" className="text-xs">{formData.event_type}</Badge>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Calendar className="h-4 w-4 shrink-0" />
            <span>
              {new Date(formData.start_date).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <MapPin className="h-4 w-4 shrink-0" />
            <span>{formData.city}, {formData.state}</span>
          </div>
          
          {formData.max_participants && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Users className="h-4 w-4 shrink-0" />
              <span>Até {formData.max_participants} participantes</span>
            </div>
          )}
        </div>
      </Card>

      {/* Informações sobre Publicação de Eventos */}
      <Card className="p-5 bg-blue-50/50 border-blue-200">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-slate-900 mb-2">Como funciona a publicação de eventos</p>
            <ul className="text-sm text-slate-700 space-y-1.5">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span>Seu evento ficará <strong>ativo por 30 dias</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span>Aparece <strong>automaticamente na página inicial nas primeiras 24 horas</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span>Após 24h, use "Turbinar" para manter o destaque na home</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span>Você tem <strong>24 horas para editar</strong> após publicar</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span>Após 30 dias, o evento pausa automaticamente</span>
              </li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Botão de Publicar */}
      <Button 
        onClick={handlePublishClick}
        disabled={isSubmitting}
        className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold text-base rounded-lg shadow-lg shadow-blue-600/30 hover:shadow-xl hover:shadow-blue-600/40"
      >
        {isSubmitting ? (
          <>
            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            Publicando...
          </>
        ) : (
          'Publicar Agora'
        )}
      </Button>

      {/* Modal de Pagamento */}
      <EventPaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onConfirmPayment={handleConfirmPayment}
        isProcessing={isSubmitting}
      />
    </div>
  );
};

export default EventReviewStep;
