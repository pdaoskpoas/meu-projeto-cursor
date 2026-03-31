import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ShieldX, AlertTriangle } from 'lucide-react';

interface SuspensionModalProps {
  user: {
    id: string;
    name: string;
    email: string;
  } | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}

export function SuspensionModal({ user, isOpen, onClose, onConfirm }: SuspensionModalProps) {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    if (!reason.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirm(reason.trim());
      setReason('');
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setReason('');
    onClose();
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <ShieldX className="h-5 w-5 text-gray-900" />
            <DialogTitle className="text-gray-900">Suspender Usuário</DialogTitle>
          </div>
          <DialogDescription>
            Você está prestes a suspender o usuário <strong>{user.name}</strong> ({user.email}).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert className="border-gray-300 bg-gray-900">
            <AlertTriangle className="h-4 w-4 text-white" />
            <AlertDescription className="text-white">
              <strong>Atenção:</strong> Esta ação irá:
              <ul className="mt-2 space-y-1 text-sm">
                <li>• Remover todos os anúncios do usuário</li>
                <li>• Remover sociedades do perfil</li>
                <li>• Limitar o acesso apenas à visualização</li>
                <li>• Impedir criação de nova conta com este email/CPF</li>
              </ul>
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="reason" className="text-sm font-medium">
              Motivo da Suspensão *
            </Label>
            <Textarea
              id="reason"
              placeholder="Descreva o motivo da suspensão (ex: violação das normas, tentativa de golpe, comportamento inadequado...)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-[100px] resize-none"
              maxLength={500}
            />
            <div className="text-xs text-muted-foreground text-right">
              {reason.length}/500 caracteres
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button 
            variant="destructive"
            onClick={handleConfirm}
            disabled={!reason.trim() || isSubmitting}
            className="bg-red-600 hover:bg-red-700"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Suspendo...
              </>
            ) : (
              <>
                <ShieldX className="mr-2 h-4 w-4" />
                Confirmar Suspensão
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


