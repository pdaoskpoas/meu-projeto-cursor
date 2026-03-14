import React from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Calendar, MapPin, Clock } from 'lucide-react';
import { EventFormData, brazilianStates } from '../types';

interface EventDateLocationStepProps {
  formData: EventFormData;
  setFormData: (data: EventFormData) => void;
}

const EventDateLocationStep: React.FC<EventDateLocationStepProps> = ({ formData, setFormData }) => {
  const handleInputChange = (field: keyof EventFormData, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleLocationChange = (field: keyof EventFormData['location'], value: string) => {
    setFormData({
      ...formData,
      location: { ...formData.location, [field]: value }
    });
  };

  const isLeilao = formData.category === 'Leilão';

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Data e Localização</h3>
        <p className="text-sm text-gray-600">Defina quando e onde seu evento acontecerá</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Datas do Evento */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-5 w-5 text-blue-600" />
            <h4 className="font-medium text-gray-900">Datas do Evento</h4>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="eventStartDate" className="text-sm font-medium text-gray-700">
                  Data de Início *
                </Label>
                <Input
                  id="eventStartDate"
                  type="date"
                  value={formData.eventStartDate}
                  onChange={(e) => handleInputChange('eventStartDate', e.target.value)}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="eventStartTime" className="text-sm font-medium text-gray-700">
                  Horário de Início
                </Label>
                <Input
                  id="eventStartTime"
                  type="time"
                  value={formData.eventStartTime}
                  onChange={(e) => handleInputChange('eventStartTime', e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="eventEndDate" className="text-sm font-medium text-gray-700">
                  Data de Término *
                </Label>
                <Input
                  id="eventEndDate"
                  type="date"
                  value={formData.eventEndDate}
                  onChange={(e) => handleInputChange('eventEndDate', e.target.value)}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="eventEndTime" className="text-sm font-medium text-gray-700">
                  Horário de Término
                </Label>
                <Input
                  id="eventEndTime"
                  type="time"
                  value={formData.eventEndTime}
                  onChange={(e) => handleInputChange('eventEndTime', e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Localização */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="h-5 w-5 text-green-600" />
            <h4 className="font-medium text-gray-900">Localização</h4>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city" className="text-sm font-medium text-gray-700">
                  Cidade *
                </Label>
                <Input
                  id="city"
                  value={formData.location.city}
                  onChange={(e) => handleLocationChange('city', e.target.value)}
                  placeholder="Ex: Belo Horizonte"
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="state" className="text-sm font-medium text-gray-700">
                  Estado *
                </Label>
                <Select 
                  value={formData.location.state} 
                  onValueChange={(value) => handleLocationChange('state', value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Selecione o estado" />
                  </SelectTrigger>
                  <SelectContent side="bottom" align="start" avoidCollisions={false}>
                    {brazilianStates.map((state) => (
                      <SelectItem key={state.value} value={state.value}>
                        {state.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="fullAddress" className="text-sm font-medium text-gray-700">
                Endereço Completo
              </Label>
              <Textarea
                id="fullAddress"
                value={formData.location.fullAddress}
                onChange={(e) => handleLocationChange('fullAddress', e.target.value)}
                placeholder="Endereço completo do evento (rua, número, bairro, etc.)"
                className="mt-1"
                rows={3}
              />
            </div>
          </div>
        </Card>
      </div>

      {/* Datas de Inscrição (apenas para eventos que não são leilão) */}
      {!isLeilao && (
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-5 w-5 text-orange-600" />
            <h4 className="font-medium text-gray-900">Período de Inscrições</h4>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="registrationStartDate" className="text-sm font-medium text-gray-700">
                Início das Inscrições *
              </Label>
              <Input
                id="registrationStartDate"
                type="date"
                value={formData.registrationStartDate}
                onChange={(e) => handleInputChange('registrationStartDate', e.target.value)}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="registrationEndDate" className="text-sm font-medium text-gray-700">
                Fim das Inscrições *
              </Label>
              <Input
                id="registrationEndDate"
                type="date"
                value={formData.registrationEndDate}
                onChange={(e) => handleInputChange('registrationEndDate', e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default EventDateLocationStep;

