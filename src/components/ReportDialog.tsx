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
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { reportService } from '@/services/reportService';
import { supabase } from '@/lib/supabase';

interface ReportDialogProps {
  animalId: string;
  animalName: string;
}

const ReportDialog: React.FC<ReportDialogProps> = ({ animalId, animalName }) => {
  const [open, setOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const reportReasons = [
    { id: 'fraud', label: 'Possível golpe ou fraude', description: 'Suspeita de informações falsas ou tentativa de golpe' },
    { id: 'animal_abuse', label: 'Sinais de maus-tratos', description: 'Animal apresenta sinais de negligência ou maus-tratos' },
    { id: 'false_info', label: 'Informações incorretas', description: 'Dados do animal ou proprietário não condizem com a realidade' },
    { id: 'inappropriate', label: 'Conteúdo inapropriado', description: 'Imagens ou descrições inadequadas' },
    { id: 'spam', label: 'Spam ou publicidade enganosa', description: 'Anúncio suspeito ou com finalidade comercial inadequada' },
    { id: 'other', label: 'Outro motivo', description: 'Outra irregularidade não listada acima' }
  ];

  const handleSubmit = async () => {
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
      // Integração com backend real usando reportService
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }
      
      // Buscar informações do perfil
      const { data: profile } = await supabase
        .from('profiles')
        .select('name, email')
        .eq('id', user.id)
        .single();
      
      await reportService.reportAnimal(
        animalId,
        animalName,
        user.id,
        profile?.name || 'Usuário',
        profile?.email || user.email || '',
        reportReason,
        reportDetails.trim(),
        reportReason as 'fake_info' | 'scam' | 'inappropriate' | 'spam' | 'harassment' | 'other',
        window.location.href
      );

      toast({
        title: "Denúncia enviada com sucesso",
        description: "Nossa equipe analisará sua denúncia em até 24 horas. Obrigado por ajudar a manter a plataforma segura.",
      });

      // Reset form and close dialog
      setReportReason('');
      setReportDetails('');
      setOpen(false);
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
        >
          <Flag className="h-4 w-4 mr-2" />
          Denunciar anúncio
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center text-red-600">
            <AlertTriangle className="h-5 w-5 mr-2" />
            Denunciar Anúncio
          </DialogTitle>
          <DialogDescription>
            Você está denunciando o anúncio de <strong>{animalName}</strong>. 
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
  );
};

export default ReportDialog;