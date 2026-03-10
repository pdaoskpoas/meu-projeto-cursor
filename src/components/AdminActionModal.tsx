import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, ShieldX, FileX, UserX } from 'lucide-react';
import { AdminReport } from '@/hooks/admin/useAdminReports';

type AdminAction = 'warning' | 'content_removed' | 'user_suspended' | 'user_banned' | 'block_animal' | 'suspend_user' | 'both';

interface AdminActionModalProps {
  report: AdminReport | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (action: AdminAction, reason: string) => void;
}

export function AdminActionModal({ report, isOpen, onClose, onConfirm }: AdminActionModalProps) {
  const [selectedAction, setSelectedAction] = useState<AdminAction>('warning');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    if (!reason.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirm(selectedAction, reason.trim());
      setReason('');
      setSelectedAction('warning');
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setReason('');
    setSelectedAction('warning');
    onClose();
  };

  if (!report) return null;

  const getActionDescription = () => {
    switch (selectedAction) {
      case 'block_animal':
        return {
          title: 'Bloquear Animal',
          icon: <FileX className="h-5 w-5 text-orange-600" />,
          description: `Você está prestes a bloquear a exibição do animal "${report.animalName}".`,
          consequences: [
            '• Animal será removido da visualização pública',
            '• Anúncio ficará invisível para outros usuários',
            '• Proprietário não poderá reativar sem aprovação',
            '• Animal permanece no perfil do usuário'
          ]
        };
      case 'suspend_user':
        return {
          title: 'Suspender Usuário',
          icon: <UserX className="h-5 w-5 text-red-600" />,
          description: `Você está prestes a suspender o usuário "${report.reportedUserName}".`,
          consequences: [
            '• Todos os anúncios do usuário serão removidos',
            '• Perfil será suspenso e limitado',
            '• Usuário não poderá criar novos anúncios',
            '• Acesso será restrito apenas à visualização',
            '• Impedido de criar nova conta com este email/CPF'
          ]
        };
      case 'both':
        return {
          title: 'Bloquear Animal e Suspender Usuário',
          icon: <ShieldX className="h-5 w-5 text-red-600" />,
          description: `Você está prestes a bloquear o animal "${report.animalName}" e suspender o usuário "${report.reportedUserName}".`,
          consequences: [
            '• Animal será removido da visualização pública',
            '• Todos os anúncios do usuário serão removidos',
            '• Perfil será suspenso e limitado',
            '• Usuário não poderá criar novos anúncios',
            '• Acesso será restrito apenas à visualização',
            '• Impedido de criar nova conta com este email/CPF'
          ]
        };
      default:
        return {
          title: '',
          icon: null,
          description: '',
          consequences: []
        };
    }
  };

  const actionInfo = getActionDescription();

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            {actionInfo.icon}
            <DialogTitle className={selectedAction === 'suspend_user' || selectedAction === 'both' ? 'text-red-800' : 'text-orange-800'}>
              {actionInfo.title}
            </DialogTitle>
          </div>
          <DialogDescription>
            {actionInfo.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Seleção da Ação */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Selecione a ação:</Label>
            
            <div className="space-y-2">
              <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="action"
                  value="block_animal"
                  checked={selectedAction === 'block_animal'}
                  onChange={(e) => setSelectedAction(e.target.value as AdminAction)}
                  className="text-orange-600"
                />
                <div className="flex items-center space-x-2">
                  <FileX className="h-4 w-4 text-orange-600" />
                  <div>
                    <div className="font-medium">Bloquear Animal</div>
                    <div className="text-sm text-gray-600">Apenas este animal será bloqueado</div>
                  </div>
                </div>
              </label>

              <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="action"
                  value="suspend_user"
                  checked={selectedAction === 'suspend_user'}
                  onChange={(e) => setSelectedAction(e.target.value as AdminAction)}
                  className="text-red-600"
                />
                <div className="flex items-center space-x-2">
                  <UserX className="h-4 w-4 text-red-600" />
                  <div>
                    <div className="font-medium">Suspender Usuário</div>
                    <div className="text-sm text-gray-600">Usuário será suspenso completamente</div>
                  </div>
                </div>
              </label>

              <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="action"
                  value="both"
                  checked={selectedAction === 'both'}
                  onChange={(e) => setSelectedAction(e.target.value as AdminAction)}
                  className="text-red-600"
                />
                <div className="flex items-center space-x-2">
                  <ShieldX className="h-4 w-4 text-red-600" />
                  <div>
                    <div className="font-medium">Bloquear Animal e Suspender Usuário</div>
                    <div className="text-sm text-gray-600">Ação completa - animal + usuário</div>
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Alertas de Consequências */}
          <Alert className={selectedAction === 'suspend_user' || selectedAction === 'both' ? 'border-red-300 bg-red-100' : 'border-orange-300 bg-orange-100'}>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription className={selectedAction === 'suspend_user' || selectedAction === 'both' ? 'text-red-800' : 'text-orange-800'}>
              <strong>Atenção:</strong> Esta ação irá:
              <ul className="mt-2 space-y-1 text-sm">
                {actionInfo.consequences.map((consequence, index) => (
                  <li key={index}>{consequence}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>

          {/* Campo de Motivo */}
          <div className="space-y-2">
            <Label htmlFor="reason" className="text-sm font-medium">
              Motivo da Ação *
            </Label>
            <Textarea
              id="reason"
              placeholder="Descreva o motivo da ação (ex: violação das normas, informações falsas, comportamento inadequado...)"
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
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!reason.trim() || isSubmitting}
            className={selectedAction === 'suspend_user' || selectedAction === 'both' ? 'bg-red-600 hover:bg-red-700' : 'bg-orange-600 hover:bg-orange-700'}
          >
            {isSubmitting ? 'Processando...' : 'Confirmar Ação'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
