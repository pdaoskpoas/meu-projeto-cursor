import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, Crown, User } from 'lucide-react';
import { AdminUser } from '@/hooks/admin/useAdminUsers';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { logAdminAction } from '@/services/adminAuditService';

interface EditUserModalProps {
  user: AdminUser | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (userData: Partial<AdminUser>) => Promise<void>;
}

export function EditUserModal({ user, isOpen, onClose, onSave }: EditUserModalProps) {
  const [formData, setFormData] = useState<Partial<AdminUser>>({});
  const [vipEndDate, setVipEndDate] = useState<string>('');
  const { toast } = useToast();
  const { user: adminUser } = useAuth();

  React.useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        phone: user.phone,
        accountType: user.accountType,
        propertyName: user.propertyName,
        plan: user.plan,
        planExpiresAt: user.planExpiresAt
      });
      
      if (user.planExpiresAt) {
        setVipEndDate(user.planExpiresAt);
      }
    }
  }, [user]);

  const recordVipGrant = async (planExpiresAt?: string) => {
    if (!user) return;
    try {
      await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          type: 'plan_subscription',
          amount: 0,
          currency: 'BRL',
          status: 'completed',
          plan_type: 'vip',
          is_annual: false,
          metadata: {
            admin_grant: true,
            granted_by_admin: adminUser?.id || null,
            plan_expires_at: planExpiresAt || null
          }
        });
      await logAdminAction({
        action: 'grant_vip',
        adminId: adminUser?.id,
        resourceType: 'profile',
        resourceId: user.id,
        newData: { plan: 'vip', planExpiresAt }
      });
    } catch (error) {
      console.error('Erro ao registrar concessão VIP:', error);
      toast({
        title: 'Aviso',
        description: 'VIP concedido, mas não foi possível registrar a concessão.',
        variant: 'destructive'
      });
    }
  };

  const handleSave = async () => {
    if (!user) return;

    const updatedData = {
      ...formData,
      planExpiresAt: vipEndDate || undefined,
      planPurchasedAt: formData.plan === 'vip' && !user.planPurchasedAt 
        ? new Date().toISOString()
        : user.planPurchasedAt
    };

    const isGrantingVip = user.plan !== 'vip' && updatedData.plan === 'vip';

    try {
      await onSave(updatedData);
      await logAdminAction({
        action: 'update_user',
        adminId: adminUser?.id,
        resourceType: 'profile',
        resourceId: user.id,
        oldData: user,
        newData: updatedData
      });
      if (isGrantingVip) {
        await recordVipGrant(updatedData.planExpiresAt);
      }
      onClose();
    } catch (error) {
      // Error is handled in the parent component
    }
  };

  const handleMakeVip = async () => {
    if (!vipEndDate) {
      toast({
        title: "Data necessária",
        description: "Por favor, insira uma data de término para o plano VIP.",
        variant: "destructive"
      });
      return;
    }

    const updatedData = {
      ...formData,
      plan: 'vip' as const,
      planPurchasedAt: new Date().toISOString(),
      planExpiresAt: vipEndDate,
      isAnnualPlan: false
    };

    try {
      await onSave(updatedData);
      await recordVipGrant(updatedData.planExpiresAt);
      toast({
        title: "Usuário promovido a VIP",
        description: `Usuário agora tem plano VIP até ${new Date(vipEndDate).toLocaleDateString('pt-BR')}. Concedido gratuitamente pelo administrador.`
      });
      onClose();
    } catch (error) {
      // Error is handled in the parent component
    }
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Editar Usuário: {user.name}
          </DialogTitle>
          <DialogDescription>
            Atualize as informações do usuário ou promova para VIP
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email || ''}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Telefone</Label>
            <Input
              id="phone"
              value={formData.phone || ''}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="accountType">Tipo de Conta</Label>
            <Select 
              value={formData.accountType} 
              onValueChange={(value: "personal" | "institutional") => setFormData({ ...formData, accountType: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent side="bottom" align="start" avoidCollisions={false}>
                <SelectItem value="personal">Pessoal</SelectItem>
                <SelectItem value="institutional">Institucional</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="propertyName">Nome da Propriedade</Label>
            <Input
              id="propertyName"
              value={formData.propertyName || ''}
              onChange={(e) => setFormData({ ...formData, propertyName: e.target.value })}
              placeholder="Nome da propriedade (se institucional)"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="plan">Tipo de Plano</Label>
            <Select 
              value={formData.plan} 
              onValueChange={(value: "free" | "basic" | "pro" | "ultra" | "vip") => setFormData({ ...formData, plan: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o plano" />
              </SelectTrigger>
              <SelectContent side="bottom" align="start" avoidCollisions={false}>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="basic">Basic</SelectItem>
                <SelectItem value="pro">Pro</SelectItem>
                <SelectItem value="ultra">Ultra</SelectItem>
                <SelectItem value="vip">VIP</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Seção VIP */}
        <div className="border-t pt-4">
          <div className="flex items-center gap-2 mb-4">
            <Crown className="h-5 w-5 text-yellow-500" />
            <h3 className="text-lg font-semibold">Gerenciamento VIP</h3>
            <Badge variant="outline" className="text-xs">
              Mesmo que Pro (gratuito)
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="vipEndDate">Data de Término do VIP</Label>
              <Input
                id="vipEndDate"
                type="date"
                value={vipEndDate}
                onChange={(e) => setVipEndDate(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                O VIP oferece os mesmos benefícios do Pro, mas é concedido gratuitamente pelo administrador.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Informações do Plano</Label>
              <div className="text-sm text-muted-foreground space-y-1">
                {user.planPurchasedAt && (
                  <p>Início: {new Date(user.planPurchasedAt).toLocaleDateString('pt-BR')}</p>
                )}
                {user.planExpiresAt && (
                  <p>Expira: {new Date(user.planExpiresAt).toLocaleDateString('pt-BR')}</p>
                )}
                {user.plan === 'vip' && (
                  <p className="text-green-600 font-medium">✓ Plano VIP Ativo</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          
          {formData.plan !== 'vip' && (
            <Button 
              onClick={handleMakeVip}
              className="bg-yellow-600 hover:bg-yellow-700"
              disabled={!vipEndDate}
            >
              <Crown className="mr-2 h-4 w-4" />
              Conceder VIP Gratuito
            </Button>
          )}
          
          <Button onClick={handleSave}>
            Salvar Alterações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
