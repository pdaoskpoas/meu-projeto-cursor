import React, { useState, useEffect } from 'react';
import { X, Calendar, MapPin, Clock, Users, Building2, Trophy, Zap, DollarSign, GraduationCap, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Event } from '@/data/eventsData';

interface EditEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  event: Event | null;
}

interface EventFormData {
  title: string;
  description: string;
  fullDescription: string;
  category: string;
  date: string;
  time: string;
  endDate: string;
  location: {
    city: string;
    state: string;
    fullAddress: string;
  };
  registrationInfo: string;
  registrationLink: string;
  featured: boolean;
}

const eventCategories = [
  { value: 'Copa de Marcha', label: 'Copa de Marcha', icon: '', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { value: 'Competição', label: 'Competição', icon: '', color: 'bg-blue-100 text-blue-800 border-blue-300' },
  { value: 'Poeirão', label: 'Poeirão', icon: '', color: 'bg-gray-100 text-gray-700 border-gray-200' },
  { value: 'Leilão', label: 'Leilão', icon: '', color: 'bg-blue-700 text-white border-blue-700' },
  { value: 'Exposição', label: 'Exposição', icon: '', color: 'bg-gray-200 text-gray-800 border-gray-300' },
  { value: 'Curso Presencial', label: 'Curso Presencial', icon: '', color: 'bg-blue-900 text-white border-blue-900' },
  { value: 'Feira', label: 'Feira', icon: '', color: 'bg-gray-50 text-gray-700 border-gray-200' }
];

const EditEventModal: React.FC<EditEventModalProps> = ({ isOpen, onClose, onSuccess, event }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    description: '',
    fullDescription: '',
    category: '',
    date: '',
    time: '',
    endDate: '',
    location: {
      city: '',
      state: '',
      fullAddress: ''
    },
    registrationInfo: '',
    registrationLink: '',
    featured: false
  });

  // Preencher o formulário quando o evento for carregado
  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title,
        description: event.description,
        fullDescription: event.fullDescription,
        category: event.category,
        date: event.date,
        time: event.time,
        endDate: event.endDate || '',
        location: {
          city: event.location.city,
          state: event.location.state,
          fullAddress: event.location.fullAddress || ''
        },
        registrationInfo: event.registrationInfo || '',
        registrationLink: event.registrationLink || '',
        featured: event.featured
      });
    }
  }, [event]);

  const handleInputChange = (field: string, value: string | boolean) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof EventFormData],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validação básica
      if (!formData.title || !formData.description || !formData.category || !formData.date || !formData.time) {
        toast({
          title: "Campos obrigatórios",
          description: "Preencha todos os campos obrigatórios.",
          variant: "destructive"
        });
        return;
      }

      // Simular API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast({
        title: "Evento atualizado!",
        description: "Seu evento foi atualizado com sucesso."
      });

      onSuccess();
      onClose();
    } catch (error) {
      toast({
        title: "Erro ao atualizar evento",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !event) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Editar Evento</h2>
              <p className="text-slate-600 mt-1">Atualize as informações do seu evento</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 hover:bg-slate-100 rounded-full"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {/* Basic Information */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-slate-900 flex items-center">
              <Building2 className="h-5 w-5 mr-2 text-blue-600" />
              Informações Básicas
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-semibold text-slate-700">Título do Evento *</label>
                <Input
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Ex: Copa de Marcha Diamantina 2024"
                  className="h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
                  required
                />
              </div>

              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-semibold text-slate-700">Descrição Resumida *</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Breve descrição do evento que aparecerá nos cards..."
                  className="min-h-[100px] border-slate-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
                  required
                />
              </div>

              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-semibold text-slate-700">Descrição Completa</label>
                <Textarea
                  value={formData.fullDescription}
                  onChange={(e) => handleInputChange('fullDescription', e.target.value)}
                  placeholder="Descrição detalhada do evento, programação, categorias, premiação, etc..."
                  className="min-h-[200px] border-slate-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
                />
              </div>
            </div>
          </div>

          {/* Category Selection */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-slate-900 flex items-center">
              <Trophy className="h-5 w-5 mr-2 text-blue-600" />
              Categoria do Evento *
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {eventCategories.map((category) => (
                <button
                  key={category.value}
                  type="button"
                  onClick={() => handleInputChange('category', category.value)}
                  className={`p-4 rounded-2xl border-2 text-left transition-all duration-300 ${
                    formData.category === category.value
                      ? `${category.color} shadow-lg`
                      : 'border-slate-200 hover:border-blue-300 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{category.icon}</span>
                    <div>
                      <h4 className="font-semibold text-slate-900">{category.label}</h4>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Date and Time */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-slate-900 flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-blue-600" />
              Data e Horário
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Data de Início *</label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  className="h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Horário de Início *</label>
                <Input
                  type="time"
                  value={formData.time}
                  onChange={(e) => handleInputChange('time', e.target.value)}
                  className="h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Data de Término</label>
                <Input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => handleInputChange('endDate', e.target.value)}
                  className="h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
                />
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-slate-900 flex items-center">
              <MapPin className="h-5 w-5 mr-2 text-blue-600" />
              Localização
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Cidade *</label>
                <Input
                  value={formData.location.city}
                  onChange={(e) => handleInputChange('location.city', e.target.value)}
                  placeholder="Ex: Diamantina"
                  className="h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Estado *</label>
                <Input
                  value={formData.location.state}
                  onChange={(e) => handleInputChange('location.state', e.target.value)}
                  placeholder="Ex: MG"
                  className="h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
                  required
                />
              </div>

              <div className="md:col-span-3 space-y-2">
                <label className="text-sm font-semibold text-slate-700">Endereço Completo</label>
                <Input
                  value={formData.location.fullAddress}
                  onChange={(e) => handleInputChange('location.fullAddress', e.target.value)}
                  placeholder="Ex: Parque de Exposições de Diamantina - Rod. Diamantina-Curvelo, KM 2"
                  className="h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
                />
              </div>
            </div>
          </div>

          {/* Registration Info */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-slate-900 flex items-center">
              <Users className="h-5 w-5 mr-2 text-blue-600" />
              Informações de Inscrição
            </h3>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Informações de Inscrição</label>
                <Textarea
                  value={formData.registrationInfo}
                  onChange={(e) => handleInputChange('registrationInfo', e.target.value)}
                  placeholder="Ex: Inscrições até 10/04/2024. Taxa: R$ 300 por conjunto."
                  className="min-h-[100px] border-slate-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Link de Inscrição</label>
                <Input
                  type="url"
                  value={formData.registrationLink}
                  onChange={(e) => handleInputChange('registrationLink', e.target.value)}
                  placeholder="https://exemplo.com/inscricoes"
                  className="h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
                />
              </div>
            </div>
          </div>

          {/* Additional Options */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-slate-900 flex items-center">
              <Zap className="h-5 w-5 mr-2 text-blue-600" />
              Opções Adicionais
            </h3>
            
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="featured"
                checked={formData.featured}
                onChange={(e) => handleInputChange('featured', e.target.checked)}
                className="h-4 w-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="featured" className="text-sm font-semibold text-slate-700">
                Evento em Destaque (aparecerá na página inicial)
              </label>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-slate-200">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="px-8 py-3 border-slate-200 hover:border-slate-300 rounded-xl font-semibold transition-all duration-300"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
            >
              {isSubmitting ? 'Atualizando...' : 'Atualizar Evento'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default EditEventModal;





