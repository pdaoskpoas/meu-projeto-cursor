import React, { useState } from 'react';
import { AlertTriangle, Flag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { reportService } from '@/services/reportService';
import { useAuth } from '@/contexts/AuthContext';

interface ReportMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversationId: string;
  messageId?: string;
  reportedUserId: string;
  reportedUserName: string;
}

const ReportMessageDialog: React.FC<ReportMessageDialogProps> = ({
  open,
  onOpenChange,
  conversationId,
  messageId,
  reportedUserId,
  reportedUserName,
}) => {
  const { user } = useAuth();
  const [reportReason, setReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const reportReasons = [
    { id: 'harassment', label: 'Assédio ou intimidação', description: 'Mensagens ofensivas, ameaças ou comportamento abusivo' },
    { id: 'scam', label: 'Golpe ou fraude', description: 'Tentativa de golpe financeiro ou informações fraudulentas' },
    { id: 'spam', label: 'Spam ou propaganda', description: 'Mensagens comerciais não solicitadas ou spam' },
    { id: 'inappropriate', label: 'Conteúdo inapropriado', description: 'Linguagem ou conteúdo ofensivo' },
    { id: 'fake_info', label: 'Informações falsas', description: 'Informações enganosas sobre animais ou negociações' },
    { id: 'other', label: 'Outro motivo', description: 'Outra irregularidade não listada acima' }
  ];

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para denunciar.",
        variant: "destructive",
      });
      return;
    }

    if (!reportReason) {
      toast({
        title: "Erro",
        description: "Por favor, selecione um motivo para a denúncia.",
        variant: "destructive",
      });
      return;
    }

    if (!reportDetails.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, descreva os detalhes da denúncia.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await reportService.reportMessage(
        conversationId,
        messageId,
        user.id,
        user.name || 'Usuário',
        user.email || '',
        reportedUserId,
        reportedUserName,
        reportReason,
        reportDetails.trim(),
        reportReason as 'fake_info' | 'scam' | 'inappropriate' | 'spam' | 'harassment' | 'other'
      );

      toast({
        title: "Denúncia enviada com sucesso",
        description: "Nossa equipe analisará sua denúncia em até 24 horas. Obrigado por ajudar a manter a plataforma segura.",
      });

      // Reset form and close dialog
      setReportReason('');
      setReportDetails('');
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao enviar denúncia:', error);
      toast({
        title: "Erro ao enviar denúncia",
        description: "Ocorreu um erro ao processar sua denúncia. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setReportReason('');
    setReportDetails('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center text-red-600">
            <AlertTriangle className="h-5 w-5 mr-2" />
            Denunciar {messageId ? 'Mensagem' : 'Conversa'}
          </DialogTitle>
          <DialogDescription>
            Você está denunciando {messageId ? 'uma mensagem' : 'a conversa'} de <strong>{reportedUserName}</strong>.
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
            onClick={handleCancel}
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
  );
};

export default ReportMessageDialog;

