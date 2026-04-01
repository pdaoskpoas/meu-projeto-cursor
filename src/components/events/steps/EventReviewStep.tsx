import React from 'react';
import { Card } from '@/components/ui/card';
import { Calendar, MapPin, Users, Info } from 'lucide-react';
import { EventFormData } from '../CreateEventModal';
import { Badge } from '@/components/ui/badge';

interface EventReviewStepProps {
  formData: EventFormData;
}

const formatDate = (dateString: string) => {
  if (!dateString) return '';
  // Handle both "YYYY-MM-DD" and ISO strings
  const [year, month, day] = dateString.split('T')[0].split('-');
  return new Date(Number(year), Number(month) - 1, Number(day)).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
};

const EventReviewStep: React.FC<EventReviewStepProps> = ({ formData }) => {
  return (
    <div className="space-y-5">
      {/* Resumo do Evento */}
      <Card className="p-5 border-slate-200">
        <div className="space-y-4">
          <div>
            <p className="text-xl font-bold text-slate-900 mb-1">{formData.title}</p>
            <Badge variant="secondary" className="text-xs">{formData.event_type}</Badge>
          </div>

          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Calendar className="h-4 w-4 shrink-0" />
            <span>
              {formData.start_date ? formatDate(formData.start_date) : '—'}
              {formData.end_date && formData.end_date !== formData.start_date
                ? ` até ${formatDate(formData.end_date)}`
                : ''}
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm text-slate-600">
            <MapPin className="h-4 w-4 shrink-0" />
            <span>{formData.city}{formData.state ? `, ${formData.state}` : ''}</span>
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
                <span>Seu evento ficará <strong>ativo até a data de término</strong> informada</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span>Seu evento aparece na <strong>página de eventos</strong> após publicar</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span>Para aparecer na home, use o botão <strong>Turbinar</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span>Após a data de término, o evento é marcado como <strong>expirado</strong> automaticamente</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span>Se sua assinatura for cancelada, o evento fica <strong>pausado</strong></span>
              </li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default EventReviewStep;
