import React, { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Info, Upload, X, Image as ImageIcon } from 'lucide-react';

interface EventDetailsStepProps {
  formData: {
    max_participants: string;
    registration_deadline: string;
    cover_image?: File | null;
    promotora: string;
    organizadora: string;
    contact_name: string;
    contact_phone: string;
    contact_email: string;
  };
  onInputChange: (field: string, value: string | number | boolean | File | null) => void;
}

const EventDetailsStep: React.FC<EventDetailsStepProps> = ({ formData, onInputChange }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!formData.cover_image) {
      setPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(formData.cover_image);
    setPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [formData.cover_image]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tipo de arquivo
      if (!file.type.startsWith('image/')) {
        alert('Por favor, selecione apenas arquivos de imagem.');
        return;
      }
      // Validar tamanho (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('A imagem deve ter no máximo 5MB.');
        return;
      }
      onInputChange('cover_image', file);
    }
  };

  const handleRemoveImage = () => {
    onInputChange('cover_image', null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6 form-mobile">
      <div className="space-y-5">
        {/* Foto de Capa */}
        <div className="space-y-1.5">
          <Label htmlFor="cover_image" className="text-sm font-medium text-slate-700">
            Foto de Capa <span className="text-slate-400 font-normal">(opcional)</span>
          </Label>
          <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 hover:border-blue-400 transition-colors">
            {formData.cover_image ? (
              <div className="space-y-3">
                <div className="relative aspect-video bg-slate-100 rounded-lg overflow-hidden">
                  {previewUrl && (
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <ImageIcon className="h-4 w-4" />
                    <span className="truncate">{formData.cover_image.name}</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveImage}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 px-2"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <Upload className="h-10 w-10 text-slate-400 mx-auto mb-2" />
                <p className="text-sm text-slate-600 mb-3">
                  PNG, JPG até 5MB
                </p>
                <Button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  size="sm"
                  variant="outline"
                  className="border-slate-300"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Selecionar Imagem
                </Button>
              </div>
            )}
            <input
              ref={fileInputRef}
              id="cover_image"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        </div>
        {/* Limite de Participantes */}
        <div className="space-y-1.5">
          <Label htmlFor="max_participants" className="text-sm font-medium text-slate-700">
            Limite de Participantes <span className="text-slate-400 font-normal">(opcional)</span>
          </Label>
          <Input
            id="max_participants"
            type="number"
            placeholder="100"
            value={formData.max_participants}
            onChange={(e) => onInputChange('max_participants', e.target.value)}
            className="h-11 border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg"
            min="1"
          />
        </div>

        {/* Prazo de Inscrição */}
        <div className="space-y-1.5">
          <Label htmlFor="registration_deadline" className="text-sm font-medium text-slate-700">
            Prazo para Inscrições <span className="text-slate-400 font-normal">(opcional)</span>
          </Label>
          <Input
            id="registration_deadline"
            type="datetime-local"
            value={formData.registration_deadline}
            onChange={(e) => onInputChange('registration_deadline', e.target.value)}
            className="h-11 border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg"
          />
        </div>

        {/* Promotora */}
        <div className="space-y-1.5">
          <Label htmlFor="promotora" className="text-sm font-medium text-slate-700">
            Promotora <span className="text-slate-400 font-normal">(opcional)</span>
          </Label>
          <Input
            id="promotora"
            type="text"
            placeholder="Ex: Associação C.C.M.M. do Estado do RJ"
            value={formData.promotora}
            onChange={(e) => onInputChange('promotora', e.target.value)}
            className="h-11 border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg"
          />
        </div>

        {/* Organizadora */}
        <div className="space-y-1.5">
          <Label htmlFor="organizadora" className="text-sm font-medium text-slate-700">
            Organizadora <span className="text-slate-400 font-normal">(opcional)</span>
          </Label>
          <Input
            id="organizadora"
            type="text"
            placeholder="Ex: Expresso Eventos"
            value={formData.organizadora}
            onChange={(e) => onInputChange('organizadora', e.target.value)}
            className="h-11 border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg"
          />
        </div>

        {/* Contato */}
        <div className="space-y-1.5">
          <Label htmlFor="contact_name" className="text-sm font-medium text-slate-700">
            Contato <span className="text-slate-400 font-normal">(opcional)</span>
          </Label>
          <Input
            id="contact_name"
            type="text"
            placeholder="Nome do contato"
            value={formData.contact_name}
            onChange={(e) => onInputChange('contact_name', e.target.value)}
            className="h-11 border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg"
          />
        </div>

        {/* Telefone */}
        <div className="space-y-1.5">
          <Label htmlFor="contact_phone" className="text-sm font-medium text-slate-700">
            Telefone <span className="text-slate-400 font-normal">(opcional)</span>
          </Label>
          <Input
            id="contact_phone"
            type="tel"
            placeholder="Ex: 21-97233-4495"
            value={formData.contact_phone}
            onChange={(e) => onInputChange('contact_phone', e.target.value)}
            className="h-11 border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg"
          />
        </div>

        {/* Email de Contato */}
        <div className="space-y-1.5">
          <Label htmlFor="contact_email" className="text-sm font-medium text-slate-700">
            Email de Contato <span className="text-slate-400 font-normal">(opcional)</span>
          </Label>
          <Input
            id="contact_email"
            type="email"
            placeholder="contato@exemplo.com"
            value={formData.contact_email}
            onChange={(e) => onInputChange('contact_email', e.target.value)}
            className="h-11 border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg"
          />
        </div>
      </div>

      {/* Info sobre campos opcionais */}
      <div className="bg-blue-50/50 border border-blue-200 rounded-lg p-4">
        <div className="flex gap-2">
          <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
          <p className="text-sm text-slate-700">
            Todos os campos desta etapa são opcionais. Você pode continuar para finalizar.
          </p>
        </div>
      </div>
    </div>
  );
};

export default EventDetailsStep;

