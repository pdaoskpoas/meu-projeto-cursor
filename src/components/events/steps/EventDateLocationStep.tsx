import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { buscarCep } from '@/services/cepService';
import { Loader2 } from 'lucide-react';

interface EventDateLocationStepProps {
  formData: {
    cep: string;
    start_date: string;
    end_date: string;
    location: string;
    city: string;
    state: string;
  };
  onInputChange: (field: string, value: string) => void;
}

const brazilStates = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG',
  'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

const EventDateLocationStep: React.FC<EventDateLocationStepProps> = ({ formData, onInputChange }) => {
  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError] = useState('');

  const handleCepChange = async (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    // Format as 00000-000
    const formatted = cleaned.length > 5
      ? `${cleaned.slice(0, 5)}-${cleaned.slice(5, 8)}`
      : cleaned;
    onInputChange('cep', formatted);
    setCepError('');

    if (cleaned.length === 8) {
      setCepLoading(true);
      try {
        const result = await buscarCep(cleaned);
        if (result.success && result.data) {
          onInputChange('city', result.data.localidade);
          onInputChange('state', result.data.uf);
          if (result.data.logradouro) {
            onInputChange('location', result.data.logradouro);
          }
        } else {
          setCepError(result.error || 'CEP não encontrado');
        }
      } finally {
        setCepLoading(false);
      }
    }
  };

  return (
    <div className="space-y-6 form-mobile">
      <div className="space-y-5">
        {/* Data de Início */}
        <div className="space-y-1.5">
          <Label htmlFor="start_date" className="text-sm font-medium text-slate-700">
            Data de Início *
          </Label>
          <Input
            id="start_date"
            type="date"
            value={formData.start_date}
            onChange={(e) => onInputChange('start_date', e.target.value)}
            className="h-11 border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg text-sm"
            required
          />
        </div>

        {/* Data de Término */}
        <div className="space-y-1.5">
          <Label htmlFor="end_date" className="text-sm font-medium text-slate-700">
            Data de Término *
          </Label>
          <Input
            id="end_date"
            type="date"
            value={formData.end_date}
            onChange={(e) => onInputChange('end_date', e.target.value)}
            className="h-11 border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg text-sm"
            required
          />
        </div>

        {/* CEP */}
        <div className="space-y-1.5">
          <Label htmlFor="cep" className="text-sm font-medium text-slate-700">
            CEP *
          </Label>
          <div className="relative">
            <Input
              id="cep"
              type="text"
              placeholder="00000-000"
              value={formData.cep}
              onChange={(e) => handleCepChange(e.target.value)}
              maxLength={9}
              className="h-11 border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg"
            />
            {cepLoading && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-slate-400" />
            )}
          </div>
          {cepError && <p className="text-xs text-red-500">{cepError}</p>}
          <p className="text-xs text-slate-500">Digite o CEP para preencher cidade e estado automaticamente</p>
        </div>

        {/* Cidade e Estado (preenchidos pelo CEP, mas editáveis) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="city" className="text-sm font-medium text-slate-700">
              Cidade *
            </Label>
            <Input
              id="city"
              type="text"
              placeholder="Preenchido pelo CEP"
              value={formData.city}
              onChange={(e) => onInputChange('city', e.target.value)}
              className="h-11 border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg"
              required
            />
          </div>

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
