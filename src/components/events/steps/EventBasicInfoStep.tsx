import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface EventBasicInfoStepProps {
  formData: {
    title: string;
    event_type: string;
    description: string;
  };
  onInputChange: (field: string, value: string) => void;
}

const EventBasicInfoStep: React.FC<EventBasicInfoStepProps> = ({ formData, onInputChange }) => {
  const eventTypes = [
    { value: 'Competição', emoji: '', label: 'Competição' },
    { value: 'Leilão', emoji: '', label: 'Leilão' },
    { value: 'Exposição', emoji: '', label: 'Exposição' },
    { value: 'Copa', emoji: '', label: 'Copa de Marcha' },
    { value: 'Curso', emoji: '', label: 'Curso / Workshop' },
    { value: 'Encontro', emoji: '', label: 'Encontro' },
    { value: 'Outro', emoji: '', label: 'Outro' }
  ];

  return (
    <div className="space-y-6 form-mobile">
      <div className="space-y-5">
        {/* Título */}
        <div className="space-y-1.5">
          <Label htmlFor="title" className="text-sm font-medium text-slate-700">
            Título do Evento *
          </Label>
          <Input
            id="title"
            type="text"
            placeholder="Ex: Copa de Marcha Diamantina 2024"
            value={formData.title}
            onChange={(e) => onInputChange('title', e.target.value)}
            className="h-11 border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg"
            required
          />
        </div>

        {/* Tipo de Evento */}
        <div className="space-y-1.5">
          <Label htmlFor="event_type" className="text-sm font-medium text-slate-700">
            Tipo de Evento *
          </Label>
          <Select value={formData.event_type} onValueChange={(value) => onInputChange('event_type', value)}>
            <SelectTrigger className="h-11 border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg">
              <SelectValue placeholder="Selecione o tipo" />
            </SelectTrigger>
            <SelectContent side="bottom" align="start" avoidCollisions={false}>
              {eventTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Descrição */}
        <div className="space-y-1.5">
          <Label htmlFor="description" className="text-sm font-medium text-slate-700">
            Descrição <span className="text-slate-400 font-normal">(opcional)</span>
          </Label>
          <Textarea
            id="description"
            placeholder="Detalhes do evento, premiações, regras..."
            value={formData.description}
            onChange={(e) => onInputChange('description', e.target.value.slice(0, 300))}
            className="min-h-[100px] border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg resize-none text-sm"
            maxLength={300}
          />
          <p className="text-xs text-slate-400 text-right">{formData.description.length}/300</p>
        </div>
      </div>

      {/* Validation Info */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
        <p className="text-sm text-slate-600">
          <span className="text-red-500">*</span> Campos obrigatórios para continuar
        </p>
      </div>
    </div>
  );
};

export default EventBasicInfoStep;


