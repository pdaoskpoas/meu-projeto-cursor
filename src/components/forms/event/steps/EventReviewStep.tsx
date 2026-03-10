import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Users, CreditCard, FileText, ExternalLink } from 'lucide-react';
import { EventFormData, eventCategories, brazilianStates, publicationPlans } from '../types';

interface EventReviewStepProps {
  formData: EventFormData;
}

const EventReviewStep: React.FC<EventReviewStepProps> = ({ formData }) => {
  const selectedCategory = eventCategories.find(cat => cat.value === formData.category);
  const selectedState = brazilianStates.find(state => state.value === formData.location.state);
  const selectedPlan = publicationPlans.find(plan => plan.id === formData.publicationPlan);

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    return timeString;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Revisão Final</h3>
        <p className="text-sm text-gray-600">Confira todas as informações antes de publicar</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Informações Básicas */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="h-5 w-5 text-blue-600" />
            <h4 className="font-medium text-gray-900">Informações Básicas</h4>
          </div>
          
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-gray-700">Título:</p>
              <p className="text-gray-900">{formData.title || 'Não informado'}</p>
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-700">Categoria:</p>
              {selectedCategory ? (
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border ${selectedCategory.color}`}>
                  <span>{selectedCategory.icon}</span>
                  <span>{selectedCategory.label}</span>
                </div>
              ) : (
                <p className="text-gray-500">Não selecionada</p>
              )}
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-700">Descrição:</p>
              <p className="text-gray-900 text-sm">{formData.description || 'Não informada'}</p>
            </div>
          </div>
        </Card>

        {/* Data e Horário */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-5 w-5 text-green-600" />
            <h4 className="font-medium text-gray-900">Data e Horário</h4>
          </div>
          
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-gray-700">Início:</p>
              <p className="text-gray-900">
                {formatDate(formData.eventStartDate)}
                {formData.eventStartTime && ` às ${formatTime(formData.eventStartTime)}`}
              </p>
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-700">Término:</p>
              <p className="text-gray-900">
                {formatDate(formData.eventEndDate)}
                {formData.eventEndTime && ` às ${formatTime(formData.eventEndTime)}`}
              </p>
            </div>

            {formData.registrationStartDate && (
              <div>
                <p className="text-sm font-medium text-gray-700">Inscrições:</p>
                <p className="text-gray-900">
                  {formatDate(formData.registrationStartDate)} a {formatDate(formData.registrationEndDate)}
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Localização */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="h-5 w-5 text-red-600" />
            <h4 className="font-medium text-gray-900">Localização</h4>
          </div>
          
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-gray-700">Cidade/Estado:</p>
              <p className="text-gray-900">
                {formData.location.city || 'Não informada'}
                {selectedState && `, ${selectedState.label}`}
              </p>
            </div>
            
            {formData.location.fullAddress && (
              <div>
                <p className="text-sm font-medium text-gray-700">Endereço:</p>
                <p className="text-gray-900 text-sm">{formData.location.fullAddress}</p>
              </div>
            )}
          </div>
        </Card>

        {/* Plano de Publicação */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="h-5 w-5 text-purple-600" />
            <h4 className="font-medium text-gray-900">Plano de Publicação</h4>
          </div>
          
          {selectedPlan ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{selectedPlan.icon}</span>
                  <span className="font-medium">{selectedPlan.name}</span>
                </div>
                <span className="font-bold text-lg">{formatPrice(selectedPlan.price)}</span>
              </div>
              <p className="text-sm text-gray-600">{selectedPlan.description}</p>
            </div>
          ) : (
            <p className="text-gray-500">Nenhum plano selecionado</p>
          )}
        </Card>
      </div>

      {/* Informações de Inscrição */}
      {(formData.registrationInfo || formData.registrationLink) && (
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-5 w-5 text-orange-600" />
            <h4 className="font-medium text-gray-900">Informações de Inscrição</h4>
          </div>
          
          <div className="space-y-3">
            {formData.registrationInfo && (
              <div>
                <p className="text-sm font-medium text-gray-700">Detalhes:</p>
                <p className="text-gray-900 text-sm whitespace-pre-wrap">{formData.registrationInfo}</p>
              </div>
            )}
            
            {formData.registrationLink && (
              <div>
                <p className="text-sm font-medium text-gray-700">Link:</p>
                <a 
                  href={formData.registrationLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                >
                  <ExternalLink className="h-3 w-3" />
                  {formData.registrationLink}
                </a>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Descrição Completa */}
      {formData.fullDescription && (
        <Card className="p-4">
          <h4 className="font-medium text-gray-900 mb-3">Descrição Completa</h4>
          <p className="text-gray-900 text-sm whitespace-pre-wrap">{formData.fullDescription}</p>
        </Card>
      )}

      {/* Aviso Final */}
      <Card className="p-4 bg-yellow-50 border-yellow-200">
        <h4 className="font-medium text-yellow-900 mb-2">Antes de Publicar</h4>
        <div className="text-sm text-yellow-700 space-y-1">
          <p>• Verifique se todas as informações estão corretas</p>
          <p>• Certifique-se de que as datas estão no formato correto</p>
          <p>• Confirme se o plano de publicação atende suas necessidades</p>
          <p>• Após publicar, algumas informações podem ter restrições para edição</p>
        </div>
      </Card>
    </div>
  );
};

export default EventReviewStep;

