import React from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { EventFormData, eventCategories } from '../types';

interface EventBasicInfoStepProps {
  formData: EventFormData;
  setFormData: (data: EventFormData) => void;
}

const EventBasicInfoStep: React.FC<EventBasicInfoStepProps> = ({ formData, setFormData }) => {
  const handleInputChange = (field: keyof EventFormData, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Informações Básicas do Evento</h3>
        <p className="text-sm text-gray-600">Defina o título, categoria e descrição do seu evento</p>
      </div>

      <div className="space-y-4">
        {/* Título do Evento */}
        <div>
          <Label htmlFor="title" className="text-sm font-medium text-gray-700">
            Título do Evento *
          </Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            placeholder="Ex: Copa de Marcha 2024"
            className="mt-1"
          />
        </div>

        {/* Categoria */}
        <div>
          <Label htmlFor="category" className="text-sm font-medium text-gray-700">
            Categoria do Evento *
          </Label>
          <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Selecione a categoria" />
            </SelectTrigger>
            <SelectContent side="bottom" align="start" avoidCollisions={false}>
              {eventCategories.map((category) => (
                <SelectItem key={category.value} value={category.value}>
                  <div className="flex items-center gap-2">
                    <span>{category.icon}</span>
                    <span>{category.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Descrição Resumida */}
        <div>
          <Label htmlFor="description" className="text-sm font-medium text-gray-700">
            Descrição Resumida *
          </Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Breve descrição do evento (máximo 200 caracteres)"
            className="mt-1"
            rows={3}
            maxLength={200}
          />
          <p className="text-xs text-gray-500 mt-1">
            {formData.description.length}/200 caracteres
          </p>
        </div>

        {/* Descrição Completa */}
        <div>
          <Label htmlFor="fullDescription" className="text-sm font-medium text-gray-700">
            Descrição Completa
          </Label>
          <Textarea
            id="fullDescription"
            value={formData.fullDescription}
            onChange={(e) => handleInputChange('fullDescription', e.target.value)}
            placeholder="Descrição detalhada do evento, incluindo programação, premiação, etc."
            className="mt-1"
            rows={6}
          />
        </div>
      </div>

      {/* Preview da Categoria Selecionada */}
      {formData.category && (
        <Card className="p-4 bg-gray-50">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Preview da Categoria:</h4>
          {(() => {
            const selectedCategory = eventCategories.find(cat => cat.value === formData.category);
            return selectedCategory ? (
              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border ${selectedCategory.color}`}>
                <span>{selectedCategory.icon}</span>
                <span>{selectedCategory.label}</span>
              </div>
            ) : null;
          })()}
        </Card>
      )}
    </div>
  );
};

export default EventBasicInfoStep;

