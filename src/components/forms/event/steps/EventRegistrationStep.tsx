import React from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Users, ExternalLink, FileText } from 'lucide-react';
import { EventFormData } from '../types';

interface EventRegistrationStepProps {
  formData: EventFormData;
  setFormData: (data: EventFormData) => void;
}

const EventRegistrationStep: React.FC<EventRegistrationStepProps> = ({ formData, setFormData }) => {
  const handleInputChange = (field: keyof EventFormData, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const isLeilao = formData.category === 'Leilão';

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Informações de Inscrição</h3>
        <p className="text-sm text-gray-600">
          {isLeilao 
            ? "Configure as informações para participação no leilão"
            : "Defina como os participantes podem se inscrever no evento"
          }
        </p>
      </div>

      <div className="space-y-6">
        {/* Informações de Inscrição */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="h-5 w-5 text-blue-600" />
            <h4 className="font-medium text-gray-900">
              {isLeilao ? "Informações de Participação" : "Detalhes da Inscrição"}
            </h4>
          </div>
          
          <div>
            <Label htmlFor="registrationInfo" className="text-sm font-medium text-gray-700">
              {isLeilao 
                ? "Como participar do leilão"
                : "Informações sobre a inscrição"
              }
            </Label>
            <Textarea
              id="registrationInfo"
              value={formData.registrationInfo}
              onChange={(e) => handleInputChange('registrationInfo', e.target.value)}
              placeholder={
                isLeilao
                  ? "Explique como os interessados podem participar do leilão (cadastro, documentos necessários, forma de pagamento, etc.)"
                  : "Descreva o processo de inscrição, documentos necessários, taxa de inscrição, etc."
              }
              className="mt-1"
              rows={6}
            />
          </div>
        </Card>

        {/* Link de Inscrição */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <ExternalLink className="h-5 w-5 text-green-600" />
            <h4 className="font-medium text-gray-900">
              {isLeilao ? "Link do Leilão" : "Link de Inscrição"}
            </h4>
          </div>
          
          <div>
            <Label htmlFor="registrationLink" className="text-sm font-medium text-gray-700">
              {isLeilao 
                ? "Link para acessar o leilão online"
                : "Link para inscrição (opcional)"
              }
            </Label>
            <Input
              id="registrationLink"
              type="url"
              value={formData.registrationLink}
              onChange={(e) => handleInputChange('registrationLink', e.target.value)}
              placeholder={
                isLeilao
                  ? "https://exemplo.com/leilao"
                  : "https://exemplo.com/inscricao"
              }
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">
              {isLeilao
                ? "Link onde os participantes podem acessar o leilão online"
                : "Se você tem um sistema próprio de inscrição, cole o link aqui"
              }
            </p>
          </div>
        </Card>

        {/* Informações Adicionais baseadas na categoria */}
        {isLeilao && (
          <Card className="p-4 bg-purple-50 border-purple-200">
            <div className="flex items-center gap-2 mb-3">
              <Users className="h-5 w-5 text-purple-600" />
              <h4 className="font-medium text-purple-900">Dicas para Leilões</h4>
            </div>
            <div className="text-sm text-purple-700 space-y-2">
              <p>• Inclua informações sobre o catálogo de animais</p>
              <p>• Mencione se haverá leilão presencial e/ou online</p>
              <p>• Especifique formas de pagamento aceitas</p>
              <p>• Informe sobre comissões e taxas</p>
              <p>• Adicione contato para esclarecimentos</p>
            </div>
          </Card>
        )}

        {formData.category === 'Curso Presencial' && (
          <Card className="p-4 bg-indigo-50 border-indigo-200">
            <div className="flex items-center gap-2 mb-3">
              <Users className="h-5 w-5 text-indigo-600" />
              <h4 className="font-medium text-indigo-900">Dicas para Cursos</h4>
            </div>
            <div className="text-sm text-indigo-700 space-y-2">
              <p>• Mencione o número máximo de participantes</p>
              <p>• Inclua informações sobre certificado</p>
              <p>• Especifique materiais inclusos ou necessários</p>
              <p>• Informe sobre coffee break ou refeições</p>
              <p>• Adicione informações sobre o instrutor</p>
            </div>
          </Card>
        )}

        {(formData.category === 'Competição' || formData.category === 'Copa de Marcha') && (
          <Card className="p-4 bg-yellow-50 border-yellow-200">
            <div className="flex items-center gap-2 mb-3">
              <Users className="h-5 w-5 text-yellow-600" />
              <h4 className="font-medium text-yellow-900">Dicas para Competições</h4>
            </div>
            <div className="text-sm text-yellow-700 space-y-2">
              <p>• Especifique as categorias de competição</p>
              <p>• Inclua informações sobre premiação</p>
              <p>• Mencione requisitos dos animais participantes</p>
              <p>• Informe sobre regulamento e julgamento</p>
              <p>• Adicione taxa de inscrição por categoria</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default EventRegistrationStep;

