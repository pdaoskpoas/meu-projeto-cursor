import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import StepWizard, { WizardStep } from '@/components/forms/StepWizard';
import EventBasicInfoStep from '@/components/events/steps/EventBasicInfoStep';
import EventDateLocationStep from '@/components/events/steps/EventDateLocationStep';
import EventDetailsStep from '@/components/events/steps/EventDetailsStep';
import EventReviewStep from '@/components/events/steps/EventReviewStep';
import { Calendar, MapPin, FileText, CheckCircle, Lock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { logUploadMetric } from '@/utils/perfMetrics';
import { uploadResumableWithFallback } from '@/utils/resumableUpload';
import { eventLimitsService } from '@/services/eventLimitsService';

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export interface EventFormData {
  title: string;
  event_type: string;
  description: string;
  cep: string;
  start_date: string;
  end_date: string;
  location: string;
  city: string;
  state: string;
  max_participants: string;
  registration_deadline: string;
  cover_image?: File | null;
  promotora: string;
  organizadora: string;
  contact_name: string;
  contact_phone: string;
  contact_email: string;
}

const CreateEventModal: React.FC<CreateEventModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const planBlocked = !user?.hasActivePlan;
  const uploadRetryEnabled = import.meta.env.VITE_EVENT_UPLOAD_RETRY === 'true';
  const draftLoadedRef = useRef(false);

  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    event_type: '',
    description: '',
    cep: '',
    start_date: '',
    end_date: '',
    location: '',
    city: '',
    state: '',
    max_participants: '',
    registration_deadline: '',
    cover_image: null,
    promotora: '',
    organizadora: '',
    contact_name: '',
    contact_phone: '',
    contact_email: ''
  });

  const isFormEmpty = useCallback(() => {
    return (
      !formData.title.trim() &&
      !formData.event_type.trim() &&
      !formData.description.trim() &&
      !formData.start_date.trim() &&
      !formData.end_date.trim() &&
      !formData.location.trim() &&
      !formData.city.trim() &&
      !formData.state.trim() &&
      !formData.max_participants.trim() &&
      !formData.registration_deadline.trim()
    );
  }, [formData]);

  useEffect(() => {
    if (!isOpen || draftLoadedRef.current) return;
    const savedDraft = sessionStorage.getItem('eventDraft');
    if (!savedDraft) {
      draftLoadedRef.current = true;
      return;
    }
    if (!isFormEmpty()) {
      draftLoadedRef.current = true;
      return;
    }
    try {
      const draft = JSON.parse(savedDraft) as Partial<EventFormData>;
      setFormData(prev => ({
        ...prev,
        ...draft,
        cover_image: null
      }));
    } catch (error) {
      console.error('Erro ao carregar draft do evento:', error);
      sessionStorage.removeItem('eventDraft');
    } finally {
      draftLoadedRef.current = true;
    }
  }, [isOpen, isFormEmpty]);

  useEffect(() => {
    if (!isOpen) {
      draftLoadedRef.current = false;
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      try {
        const dataToSave: Partial<EventFormData> = {
          title: formData.title,
          event_type: formData.event_type,
          description: formData.description,
          cep: formData.cep,
          start_date: formData.start_date,
          end_date: formData.end_date,
          location: formData.location,
          city: formData.city,
          state: formData.state,
          max_participants: formData.max_participants,
          registration_deadline: formData.registration_deadline,
          cover_image: null,
          promotora: formData.promotora,
          organizadora: formData.organizadora,
          contact_name: formData.contact_name,
          contact_phone: formData.contact_phone,
          contact_email: formData.contact_email
        };
        sessionStorage.setItem('eventDraft', JSON.stringify(dataToSave));
      } catch (error) {
        console.error('Erro ao salvar draft do evento:', error);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData, isOpen]);

  const handleInputChange = useCallback((field: string, value: string | number | boolean | File | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const hasFormData = useCallback(() => {
    return formData.title.trim() !== '' ||
           formData.event_type.trim() !== '' ||
           formData.description.trim() !== '' ||
           formData.start_date.trim() !== '';
  }, [formData]);

  const handleCloseAttempt = () => {
    if (hasFormData()) {
      setShowCancelDialog(true);
    } else {
      onClose();
    }
  };

  const handleConfirmCancel = async () => {
    setShowCancelDialog(false);
    resetForm();
    onClose();
  };

  const handleContinueEditing = () => {
    setShowCancelDialog(false);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      event_type: '',
      description: '',
      cep: '',
      start_date: '',
      end_date: '',
      location: '',
      city: '',
      state: '',
      max_participants: '',
      registration_deadline: '',
      cover_image: null,
      promotora: '',
      organizadora: '',
      contact_name: '',
      contact_phone: '',
      contact_email: ''
    });
    sessionStorage.removeItem('eventDraft');
    draftLoadedRef.current = false;
  };

  const handlePublish = async () => {
    console.log('🚀 Iniciando publicação de evento...');
    setIsSubmitting(true);

    try {
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      if (!formData.title.trim()) {
        throw new Error('O título do evento é obrigatório');
      }
      if (!formData.event_type.trim()) {
        throw new Error('O tipo do evento é obrigatório');
      }
      if (!formData.start_date) {
        throw new Error('A data de início é obrigatória');
      }
      if (!formData.end_date) {
        throw new Error('A data de término é obrigatória');
      }
      if (!formData.city.trim()) {
        throw new Error('A cidade é obrigatória');
      }
      if (!formData.state.trim()) {
        throw new Error('O estado é obrigatório');
      }

      const limitCheck = await eventLimitsService.checkEventLimit(user.id);
      if (!limitCheck.can_create) {
        toast({
          title: 'Não foi possível publicar',
          description: limitCheck.message,
          variant: 'destructive',
        });
        return;
      }

      console.log('📝 Criando evento ativo...');

      // expires_at = data de término do evento
      const expiresAt = formData.end_date
        ? new Date(formData.end_date + 'T23:59:59').toISOString()
        : null;

      const eventData = {
        title: formData.title.trim(),
        event_type: formData.event_type.trim(),
        description: formData.description.trim() || null,
        start_date: formData.start_date,
        end_date: formData.end_date || null,
        location: formData.location.trim() || null,
        city: formData.city.trim(),
        state: formData.state.trim(),
        max_participants: formData.max_participants ? parseInt(formData.max_participants) : null,
        registration_deadline: formData.registration_deadline || null,
        organizer_id: user.id,
        ad_status: 'active',
        is_individual_paid: false,
        payment_status: 'completed',
        published_at: new Date().toISOString(),
        expires_at: expiresAt,
        promotora: formData.promotora.trim() || null,
        organizadora: formData.organizadora.trim() || null,
        contact_name: formData.contact_name.trim() || null,
        contact_phone: formData.contact_phone.trim() || null,
        contact_email: formData.contact_email.trim() || null,
      };

      console.log('📦 Dados do evento:', eventData);

      const { data: createdEvent, error: createError } = await supabase
        .from('events')
        .insert(eventData)
        .select()
        .single();

      if (createError) {
        console.error('❌ Erro ao criar evento:', createError);
        throw new Error(createError.message || 'Erro ao salvar evento no banco de dados');
      }

      console.log('✅ Evento criado:', createdEvent.id);

      // Upload da imagem de capa, se houver
      if (formData.cover_image) {
        try {
          console.log('📸 Fazendo upload da imagem de capa...');
          const uploadStart = Date.now();
          const maxRetries = uploadRetryEnabled ? 3 : 1;
          const baseDelayMs = 1000;

          const fileExt = formData.cover_image.name.split('.').pop();
          const fileName = `${createdEvent.id}-${Date.now()}.${fileExt}`;
          const filePath = `${user.id}/${fileName}`;

          let uploadError: Error | null = null;
          let attempt = 1;

          for (; attempt <= maxRetries; attempt++) {
            let attemptError: Error | null = null;

            await uploadResumableWithFallback({
              file: formData.cover_image,
              bucket: 'events',
              path: filePath,
              uploadFallback: async () => {
                const { error } = await supabase.storage
                  .from('events')
                  .upload(filePath, formData.cover_image);
                if (error) {
                  attemptError = error;
                  throw error;
                }
              }
            });

            if (!attemptError) {
              uploadError = null;
              break;
            }

            uploadError = attemptError;
            if (attempt >= maxRetries) break;
            const delay = baseDelayMs * Math.pow(2, attempt - 1);
            await new Promise(resolve => setTimeout(resolve, delay));
          }

          if (uploadError) {
            console.error('❌ Erro ao fazer upload:', uploadError);
            logUploadMetric({
              type: 'upload',
              context: 'event',
              fileName: formData.cover_image.name,
              sizeBytes: formData.cover_image.size,
              durationMs: Date.now() - uploadStart,
              retries: attempt - 1,
              success: false,
              errorMessage: uploadError.message,
            });
            // Não falhar a criação por causa da imagem
          } else {
            logUploadMetric({
              type: 'upload',
              context: 'event',
              fileName: formData.cover_image.name,
              sizeBytes: formData.cover_image.size,
              durationMs: Date.now() - uploadStart,
              retries: attempt - 1,
              success: true,
            });

            const { data: urlData } = supabase.storage
              .from('events')
              .getPublicUrl(filePath);

            await supabase
              .from('events')
              .update({ cover_image_url: urlData.publicUrl })
              .eq('id', createdEvent.id);

            console.log('✅ Imagem de capa atualizada');
          }
        } catch (uploadError) {
          console.error('⚠️ Erro ao fazer upload da imagem (não crítico):', uploadError);
        }
      }

      toast({
        title: 'Evento publicado!',
        description: 'Seu evento já está na página de eventos. Para destacar na home, use o botão Turbinar.',
      });

      resetForm();
      onSuccess();
      onClose();
    } catch (error: unknown) {
      const message = error instanceof Error
        ? error.message
        : (error as { message?: string })?.message || 'Erro desconhecido';

      console.error('❌ Erro fatal ao publicar evento:', error);

      toast({
        title: 'Erro ao publicar evento',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps: WizardStep[] = useMemo(() => [
    {
      id: 'basic-info',
      title: 'Informações Básicas',
      description: 'Título, tipo e descrição do evento',
      icon: Calendar,
      component: () => (
        <EventBasicInfoStep
          formData={{
            title: formData.title,
            event_type: formData.event_type,
            description: formData.description
          }}
          onInputChange={handleInputChange}
        />
      ),
      isValid: !!(formData.title && formData.event_type)
    },
    {
      id: 'date-location',
      title: 'Data e Local',
      description: 'Quando e onde será o evento',
      icon: MapPin,
      component: () => (
        <EventDateLocationStep
          formData={{
            cep: formData.cep,
            start_date: formData.start_date,
            end_date: formData.end_date,
            location: formData.location,
            city: formData.city,
            state: formData.state
          }}
          onInputChange={handleInputChange}
        />
      ),
      isValid: !!(formData.start_date && formData.end_date && formData.city && formData.state)
    },
    {
      id: 'details',
      title: 'Detalhes Adicionais',
      description: 'Inscrições, limite de participantes e contato',
      icon: FileText,
      component: () => (
        <EventDetailsStep
          formData={{
            max_participants: formData.max_participants,
            registration_deadline: formData.registration_deadline,
            cover_image: formData.cover_image,
            promotora: formData.promotora,
            organizadora: formData.organizadora,
            contact_name: formData.contact_name,
            contact_phone: formData.contact_phone,
            contact_email: formData.contact_email
          }}
          onInputChange={handleInputChange}
        />
      ),
      isOptional: true,
      isValid: true
    },
    {
      id: 'review',
      title: 'Revisar e Publicar',
      description: 'Confirme os dados e publique',
      icon: CheckCircle,
      component: () => (
        <EventReviewStep formData={formData} />
      ),
      isValid: true
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [formData, handleInputChange]);

  const handleCancel = () => {
    handleCloseAttempt();
  };

  const handleNavigateToPlans = () => {
    onClose();
    navigate('/planos');
  };

  if (!isOpen) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={planBlocked ? onClose : handleCloseAttempt}>
        <DialogContent className="max-w-4xl max-h-[85vh] p-0 gap-0 flex flex-col">
          <DialogHeader className="px-6 pt-6 pb-4 shrink-0">
            <DialogTitle>Criar Novo Evento</DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 relative">
            <div className={planBlocked ? 'blur-[2px] pointer-events-none select-none opacity-60' : ''}>
              <StepWizard
                steps={steps}
                onComplete={handlePublish}
                onCancel={handleCancel}
                isSubmitting={isSubmitting}
              />
            </div>

            {planBlocked && (
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <div className="bg-white/95 backdrop-blur-sm border-2 border-blue-200 rounded-2xl shadow-2xl p-6 sm:p-8 max-w-md mx-4 text-center">
                  <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                    <Lock className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Plano necessário para criar eventos
                  </h3>
                  <p className="text-gray-600 mb-6 text-sm leading-relaxed">
                    Para criar e publicar eventos, é necessário ter um plano ativo. Escolha o plano ideal para você e comece agora!
                  </p>
                  <div className="space-y-3">
                    <Button
                      onClick={handleNavigateToPlans}
                      className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base gap-2"
                    >
                      Ver Planos
                    </Button>
                    <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                      <Badge variant="secondary" className="text-xs font-normal">
                        A partir de R$ 33,25/mês
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      onClick={onClose}
                      className="w-full text-gray-500 hover:text-gray-700 text-sm"
                    >
                      Voltar
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {!planBlocked && (
        <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Deseja cancelar a criação do evento?</AlertDialogTitle>
              <AlertDialogDescription>
                As informações inseridas durante o preenchimento serão perdidas e não poderão ser recuperadas.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                onClick={handleContinueEditing}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Continuar Editando
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmCancel}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Cancelar Evento
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
};

export default CreateEventModal;
