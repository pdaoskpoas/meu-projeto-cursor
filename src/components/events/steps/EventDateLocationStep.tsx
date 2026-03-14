import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface EventDateLocationStepProps {
  formData: {
    start_date: string;
    end_date: string;
    location: string;
    city: string;
    state: string;
  };
  onInputChange: (field: string, value: string) => void;
}

const EventDateLocationStep: React.FC<EventDateLocationStepProps> = ({ formData, onInputChange }) => {
  const brazilStates = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG',
    'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
  ];

  return (
    <div className="space-y-6 form-mobile">
      <div className="space-y-5">
        {/* Data de Início */}
        <div className="space-y-1.5">
          <Label htmlFor="start_date" className="text-sm font-medium text-slate-700">
            Data e Hora de Início *
          </Label>
          <Input
            id="start_date"
            type="datetime-local"
            value={formData.start_date}
            onChange={(e) => onInputChange('start_date', e.target.value)}
            className="h-11 border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg text-sm"
            required
          />
          <p className="text-xs text-slate-500">
            Selecione dia e horário do evento
          </p>
        </div>

        {/* Data de Término */}
        <div className="space-y-1.5">
          <Label htmlFor="end_date" className="text-sm font-medium text-slate-700">
            Data e Hora de Término <span className="text-slate-400 font-normal">(opcional)</span>
          </Label>
          <Input
            id="end_date"
            type="datetime-local"
            value={formData.end_date}
            onChange={(e) => onInputChange('end_date', e.target.value)}
            className="h-11 border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg text-sm"
          />
          <p className="text-xs text-slate-500">
            Deixe em branco se o evento for de um único dia
          </p>
        </div>

        {/* Local */}
        <div className="space-y-1.5">
          <Label htmlFor="location" className="text-sm font-medium text-slate-700">
            Local <span className="text-slate-400 font-normal">(opcional)</span>
          </Label>
          <Input
            id="location"
            type="text"
            placeholder="Parque de Exposições, Rua Principal, 123"
            value={formData.location}
            onChange={(e) => onInputChange('location', e.target.value)}
            className="h-11 border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg"
          />
        </div>

        {/* Cidade e Estado */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Cidade */}
          <div className="space-y-1.5">
            <Label htmlFor="city" className="text-sm font-medium text-slate-700">
              Cidade *
            </Label>
            <Input
              id="city"
              type="text"
              placeholder="Diamantina"
              value={formData.city}
              onChange={(e) => onInputChange('city', e.target.value)}
              className="h-11 border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg"
              required
            />
          </div>

          {/* Estado */}
          <div className="space-y-1.5">
            <Label htmlFor="state" className="text-sm font-medium text-slate-700">
              Estado *
            </Label>
            <Select value={formData.state} onValueChange={(value) => onInputChange('state', value)}>
              <SelectTrigger className="h-11 border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent side="bottom" align="start" avoidCollisions={false}>
                {brazilStates.map((state) => (
                  <SelectItem key={state} value={state}>
                    {state}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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

export default EventDateLocationStep;


