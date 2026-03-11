import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import StepWizard, { WizardStep } from '@/components/forms/StepWizard';
import EventBasicInfoStep from '@/components/events/steps/EventBasicInfoStep';
import EventDateLocationStep from '@/components/events/steps/EventDateLocationStep';
import EventDetailsStep from '@/components/events/steps/EventDetailsStep';
import EventReviewStep from '@/components/events/steps/EventReviewStep';
import { Calendar, MapPin, FileText, CheckCircle } from 'lucide-react';
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
  start_date: string;
  end_date: string;
  location: string;
  city: string;
  state: string;
  max_participants: string;
  registration_deadline: string;
  cover_image?: File | null;
}

const CreateEventModal: React.FC<CreateEventModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const uploadRetryEnabled = import.meta.env.VITE_EVENT_UPLOAD_RETRY === 'true';
  const draftLoadedRef = useRef(false);

  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    event_type: '',
    description: '',
    start_date: '',
    end_date: '',
    location: '',
    city: '',
    state: '',
    max_participants: '',
    registration_deadline: '',
    cover_image: null
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
          start_date: formData.start_date,
          end_date: formData.end_date,
          location: formData.location,
          city: formData.city,
          state: formData.state,
          max_participants: formData.max_participants,
          registration_deadline: formData.registration_deadline,
          cover_image: null
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

  // Verificar se há dados preenchidos
  const hasFormData = useCallback(() => {
    return formData.title.trim() !== '' || 
           formData.event_type.trim() !== '' || 
           formData.description.trim() !== '' ||
           formData.start_date.trim() !== '';
  }, [formData]);

  // Interceptar tentativa de fechar
  const handleCloseAttempt = () => {
    if (hasFormData()) {
      setShowCancelDialog(true);
    } else {
      onClose();
    }
  };

  // Confirmar cancelamento
  const handleConfirmCancel = async () => {
    setShowCancelDialog(false);

    resetForm();
    onClose();
  };

  // Continuar preenchimento
  const handleContinueEditing = () => {
    setShowCancelDialog(false);
  };

  // Função para resetar formulário
  const resetForm = () => {
    setFormData({
      title: '',
      event_type: '',
      description: '',
      start_date: '',
      end_date: '',
      location: '',
      city: '',
      state: '',
      max_participants: '',
      registration_deadline: '',
      cover_image: null,
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
      
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

      // 1. Criar evento como ativo (sem pagamento individual)
      const eventData = {
        title: formData.title,
        event_type: formData.event_type,
        description: formData.description || null,
        start_date: formData.start_date,
        end_date: formData.end_date || null,
        location: formData.location || null,
        city: formData.city,
        state: formData.state,
        max_participants: formData.max_participants ? parseInt(formData.max_participants) : null,
        registration_deadline: formData.registration_deadline || null,
        organizer_id: user.id,
        ad_status: 'active',
        is_individual_paid: false,
        expires_at: expiresAt,
      };

      const { data: createdEvent, error: createError } = await supabase
        .from('events')
        .insert(eventData)
        .select()
        .single();

      if (createError) {
        console.error('❌ Erro ao criar evento:', createError);
        throw createError;
      }

      console.log('✅ Evento criado:', createdEvent.id);

      // 2. Upload da imagem de capa, se houver
      if (formData.cover_image) {
        try {
          console.log('📸 Fazendo upload da imagem de capa...');
          const uploadStart = Date.now();
          const maxRetries = uploadRetryEnabled ? 3 : 1;
          const baseDelayMs = 1000;
          
          const fileExt = formData.cover_image.name.split('.').pop();
          const fileName = `${createdEvent.id}-${Date.now()}.${fileExt}`;
          const filePath = `${user.id}/${fileName}`;

          // Upload no bucket de eventos
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
            if (attempt >= maxRetries) {
              break;
            }
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
            throw uploadError;
          }

          console.log('✅ Imagem enviada:', filePath);
          logUploadMetric({
            type: 'upload',
            context: 'event',
            fileName: formData.cover_image.name,
            sizeBytes: formData.cover_image.size,
            durationMs: Date.now() - uploadStart,
            retries: attempt - 1,
            success: true,
          });

          // Obter URL pública
          const { data: urlData } = supabase.storage
            .from('events')
            .getPublicUrl(filePath);

          console.log('🔗 URL pública:', urlData.publicUrl);

          // Atualizar evento com a URL da imagem
          await supabase
            .from('events')
            .update({ cover_image_url: urlData.publicUrl })
            .eq('id', createdEvent.id);

          console.log('✅ URL da imagem atualizada no evento');
        } catch (uploadError) {
          console.error('⚠️ Erro ao fazer upload da imagem (não crítico):', uploadError);
          // Não falhar a criação do evento por causa da imagem
        }
      } else {
        console.log('ℹ️ Nenhuma imagem de capa foi fornecida');
      }

      toast({
        title: 'Evento publicado!',
        description: 'Seu evento já está na página de eventos. Para destacar na home por 24h, use o botão Turbinar.',
      });

      resetForm();
      onSuccess();
      onClose();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
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
            start_date: formData.start_date,
            end_date: formData.end_date,
            location: formData.location,
            city: formData.city,
            state: formData.state
          }}
          onInputChange={handleInputChange}
        />
      ),
      isValid: !!(formData.start_date && formData.city && formData.state)
    },
    {
      id: 'details',
      title: 'Detalhes Adicionais',
      description: 'Inscrições e limite de participantes',
      icon: FileText,
      component: () => (
        <EventDetailsStep 
          formData={{
            max_participants: formData.max_participants,
            registration_deadline: formData.registration_deadline,
            cover_image: formData.cover_image
          }}
          onInputChange={handleInputChange}
        />
      ),
      isOptional: true,
      isValid: true // Steps opcionais são sempre válidos
    },
    {
      id: 'review',
      title: 'Revisar e Publicar',
      description: 'Confirme os dados e publique',
      icon: CheckCircle,
      component: () => (
        <EventReviewStep 
          formData={formData}
          onPublish={handlePublish}
          isSubmitting={isSubmitting}
        />
      ),
      isValid: true,
      hideActions: true // Oculta botões padrão, componente tem os próprios
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [formData, handleInputChange, isSubmitting]);

  const handleCancel = () => {
    handleCloseAttempt();
  };

  if (!isOpen) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleCloseAttempt}>
        <DialogContent className="max-w-4xl max-h-[85vh] p-0 gap-0 flex flex-col">
          <DialogHeader className="px-6 pt-6 pb-4 shrink-0">
            <DialogTitle>Criar Novo Evento</DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto px-6">
            <StepWizard
              steps={steps}
              onComplete={async () => {}} // Publicação é feita dentro do EventReviewStep
              onCancel={handleCancel}
              isSubmitting={isSubmitting}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmação de cancelamento */}
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

    </>
  );
};

export default CreateEventModal;
