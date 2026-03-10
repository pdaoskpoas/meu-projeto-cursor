import React, { useState } from 'react';
import { AlertTriangle, Flag } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { reportService } from '@/services/reportService';

interface EventReportDialogProps {
  eventId: string;
  eventTitle: string;
  organizerId?: string | null;
  organizerName?: string;
}

const EventReportDialog: React.FC<EventReportDialogProps> = ({
  eventId,
  eventTitle,
  organizerId,
  organizerName
}) => {
  const [open, setOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const reportReasons = [
    { id: 'fake_info', label: 'Informações falsas', description: 'Detalhes do evento não conferem com a realidade' },
    { id: 'scam', label: 'Possível golpe ou fraude', description: 'Suspeita de tentativa de golpe ou enganação' },
    { id: 'inappropriate', label: 'Conteúdo inapropriado', description: 'Imagens ou descrições inadequadas' },
    { id: 'spam', label: 'Spam ou publicidade enganosa', description: 'Divulgação abusiva ou com intenção suspeita' },
    { id: 'harassment', label: 'Assédio ou ameaça', description: 'Conteúdo ofensivo, ameaçador ou abusivo' },
    { id: 'other', label: 'Outro motivo', description: 'Outra irregularidade não listada acima' }
  ];

  const handleOpenDialog = () => {
    if (!user) {
      navigate('/login', { state: { from: location.pathname } });
      return;
    }
    setOpen(true);
  };

  const handleSubmit = async () => {
    if (!reportReason) {
      toast({
        title: 'Erro',
        description: 'Por favor, selecione um motivo para a denúncia.',
        variant: 'destructive'
      });
      return;
    }

    if (!reportDetails.trim()) {
      toast({
        title: 'Erro',
        description: 'Por favor, descreva os detalhes da denúncia.',
        variant: 'destructive'
      });
      return;
    }

    if (!user) {
      navigate('/login', { state: { from: location.pathname } });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('name, email')
        .eq('id', user.id)
        .single();

      await reportService.reportEvent(
        eventId,
        eventTitle,
        organizerId,
        organizerName,
        user.id,
        profile?.name || 'Usuário',
        profile?.email || user.email || '',
        reportReason,
        reportDetails.trim(),
        reportReason as 'fake_info' | 'scam' | 'inappropriate' | 'spam' | 'harassment' | 'other',
        window.location.href
      );

      toast({
        title: 'Denúncia enviada com sucesso',
        description: 'Nossa equipe analisará sua denúncia em até 24 horas. Obrigado por ajudar a manter a plataforma segura.'
      });

      setReportReason('');
      setReportDetails('');
      setOpen(false);
    } catch (error) {
      console.error('Erro ao enviar denúncia de evento:', error);
      toast({
        title: 'Erro ao enviar denúncia',
        description: 'Ocorreu um erro ao processar sua denúncia. Tente novamente.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        className="w-full text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
        onClick={handleOpenDialog}
      >
        <Flag className="h-4 w-4 mr-2" />
        Denunciar evento
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center text-red-600">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Denunciar Evento
            </DialogTitle>
            <DialogDescription>
              Você está denunciando o evento <strong>{eventTitle}</strong>. 
              Por favor, selecione o motivo e forneça detalhes sobre a irregularidade.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-3">
              <Label htmlFor="reason" className="text-sm font-medium">
                Motivo da denúncia *
              </Label>
              <RadioGroup
                value={reportReason}
                onValueChange={setReportReason}
                className="space-y-2"
              >
                {reportReasons.map((reason) => (
                  <div key={reason.id} className="flex items-start space-x-2">
                    <RadioGroupItem value={reason.id} id={reason.id} className="mt-1" />
                    <div className="grid gap-1.5 leading-none">
                      <Label
                        htmlFor={reason.id}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {reason.label}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {reason.description}
                      </p>
                    </div>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="details" className="text-sm font-medium">
                Detalhes da denúncia *
              </Label>
              <Textarea
                id="details"
                placeholder="Descreva detalhadamente o que você observou que considera irregular ou suspeito..."
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                className="resize-none"
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                Quanto mais detalhes você fornecer, mais rápida será a análise da nossa equipe.
              </p>
            </div>
          </div>

          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isSubmitting ? 'Enviando...' : 'Enviar Denúncia'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EventReportDialog;
