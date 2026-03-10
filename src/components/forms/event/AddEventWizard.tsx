import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import StepWizard, { WizardStep } from '@/components/forms/StepWizard';
import EventBasicInfoStep from './steps/EventBasicInfoStep';
import EventDateLocationStep from './steps/EventDateLocationStep';
import EventRegistrationStep from './steps/EventRegistrationStep';
import EventPublicationStep from './steps/EventPublicationStep';
import EventReviewStep from './steps/EventReviewStep';
import { FileText, Calendar, Users, CreditCard, CheckCircle } from 'lucide-react';
import { EventFormData } from './types';

interface AddEventWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AddEventWizard: React.FC<AddEventWizardProps> = ({ isOpen, onClose, onSuccess }) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    description: '',
    fullDescription: '',
    category: '',
    registrationStartDate: '',
    registrationEndDate: '',
    eventStartDate: '',
    eventStartTime: '',
    eventEndDate: '',
    eventEndTime: '',
    location: {
      city: '',
      state: '',
      fullAddress: ''
    },
    registrationInfo: '',
    registrationLink: '',
    publicationPlan: ''
  });

  const isLeilao = formData.category === 'Leilão';

  const steps: WizardStep[] = [
    {
      id: 'basic-info',
      title: 'Informações Básicas',
      description: 'Título, categoria e descrição do evento',
      icon: FileText,
      component: (props) => <EventBasicInfoStep {...props} formData={formData} setFormData={setFormData} />,
      isValid: !!(formData.title && formData.category && formData.description)
    },
    {
      id: 'date-location',
      title: 'Data e Localização',
      description: 'Quando e onde o evento acontecerá',
      icon: Calendar,
      component: (props) => <EventDateLocationStep {...props} formData={formData} setFormData={setFormData} />,
      isValid: (() => {
        if (isLeilao) {
          // Para leilão: apenas datas de início e fim do evento
          return !!(formData.eventStartDate && formData.eventEndDate && formData.location.city && formData.location.state);
        } else {
          // Para outros eventos: datas de inscrição e evento
          return !!(
            formData.registrationStartDate && 
            formData.registrationEndDate && 
            formData.eventStartDate && 
            formData.eventEndDate && 
            formData.location.city && 
            formData.location.state
          );
        }
      })()
    },
    {
      id: 'registration',
      title: 'Informações de Inscrição',
      description: isLeilao ? 'Como participar do leilão' : 'Detalhes sobre inscrições',
      icon: Users,
      component: (props) => <EventRegistrationStep {...props} formData={formData} setFormData={setFormData} />,
      isOptional: true
    },
    {
      id: 'publication',
      title: 'Plano de Publicação',
      description: 'Como divulgar seu evento',
      icon: CreditCard,
      component: (props) => <EventPublicationStep {...props} formData={formData} setFormData={setFormData} />,
      isValid: !!formData.publicationPlan
    },
    {
      id: 'review',
      title: 'Revisão Final',
      description: 'Confira todas as informações',
      icon: CheckCircle,
      component: (props) => <EventReviewStep {...props} formData={formData} />,
      isValid: true
    }
  ];

  const handleComplete = async () => {
    setIsSubmitting(true);
    
    try {
      // Simular salvamento
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Evento criado com sucesso!",
        description: `${formData.title} foi publicado na plataforma.`,
      });
      
      onSuccess();
      onClose();
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        fullDescription: '',
        category: '',
        registrationStartDate: '',
        registrationEndDate: '',
        eventStartDate: '',
        eventStartTime: '',
        eventEndDate: '',
        eventEndTime: '',
        location: {
          city: '',
          state: '',
          fullAddress: ''
        },
        registrationInfo: '',
        registrationLink: '',
        publicationPlan: ''
      });
      
    } catch (error) {
      toast({
        title: "Erro ao criar evento",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Criar Novo Evento</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden">
          <StepWizard
            steps={steps}
            onComplete={handleComplete}
            onCancel={handleCancel}
            isSubmitting={isSubmitting}
            className="h-full"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddEventWizard;

