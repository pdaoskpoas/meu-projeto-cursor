import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Search, UserCog, Ban, CheckCircle, Edit, Crown, Calendar, ShieldX, Loader2 } from 'lucide-react';
import { useAdminUsers, AdminUser } from '@/hooks/admin/useAdminUsers';
import { useToast } from '@/hooks/use-toast';
import { EditUserModal } from '@/components/EditUserModal';
import { SuspensionModal } from '@/components/SuspensionModal';
import { useAuth } from '@/contexts/AuthContext';
import { logAdminAction } from '@/services/adminAuditService';

export function AdminUsers() {
  const { users, isLoading, error, suspendUser, unsuspendUser, updateUser } = useAdminUsers();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPlan, setFilterPlan] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [suspendingUser, setSuspendingUser] = useState<AdminUser | null>(null);
  const [isSuspensionModalOpen, setIsSuspensionModalOpen] = useState(false);
  const { toast } = useToast();
  const { user: adminUser } = useAuth();

  const isPlanActive = (user: AdminUser) => {
    if (!user.plan || user.plan === 'free') return true;
    if (!user.planExpiresAt) return true; // plano vitalicio
    return new Date(user.planExpiresAt).getTime() > Date.now();
  };

  const isPlanExpired = (user: AdminUser) => {
    if (!user.plan || user.plan === 'free') return false;
    if (!user.planExpiresAt) return false;
    return new Date(user.planExpiresAt).getTime() <= Date.now();
  };

  const getEffectivePlan = (user: AdminUser) => (
    isPlanActive(user) ? user.plan : 'free'
  );

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.phone && user.phone.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.propertyName && user.propertyName.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesPlan = filterPlan === 'all' || getEffectivePlan(user) === filterPlan;
    const matchesType = filterType === 'all' || user.accountType === filterType;
    
    return matchesSearch && matchesPlan && matchesType;
  });

  const handleUserAction = async (userId: string, action: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    switch (action) {
      case 'suspend':
        setSuspendingUser(user);
        setIsSuspensionModalOpen(true);
        break;
      case 'activate':
        try {
          await unsuspendUser(userId);
          await logAdminAction({
            action: 'unsuspend_user',
            adminId: adminUser?.id,
            resourceType: 'profile',
            resourceId: userId
          });
          toast({
            title: "Usuário reativado",
            description: `${user.name} foi reativado com sucesso.`,
          });
        } catch (error) {
          toast({
            title: "Erro",
            description: "Não foi possível reativar o usuário.",
            variant: "destructive"
          });
        }
        break;
      case 'edit':
        setEditingUser(user);
        setIsEditModalOpen(true);
        break;
    }
  };

  const handleConfirmSuspension = async (reason: string) => {
    if (!suspendingUser) return;

    try {
      await suspendUser(suspendingUser.id, reason);
      await logAdminAction({
        action: 'suspend_user',
        adminId: adminUser?.id,
        resourceType: 'profile',
        resourceId: suspendingUser.id,
        details: { reason }
      });
      toast({
        title: "Usuário suspenso",
        description: `${suspendingUser.name} foi suspenso. Todos os anúncios foram removidos e o acesso foi limitado.`,
        variant: "destructive"
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível suspender o usuário.",
        variant: "destructive"
      });
    } finally {
      setSuspendingUser(null);
      setIsSuspensionModalOpen(false);
    }
  };

  const handleSaveUser = async (userData: Partial<AdminUser>) => {
    if (!editingUser) return;

    try {
      await updateUser(editingUser.id, userData);
      toast({
        title: "Usuário atualizado",
        description: "Os dados do usuário foram atualizados com sucesso.",
      });
      setIsEditModalOpen(false);
      setEditingUser(null);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o usuário.",
        variant: "destructive"
      });
    }
  };

  const handleCloseModal = () => {
    setIsEditModalOpen(false);
    setEditingUser(null);
  };

  const getPlanBadgeVariant = (planType: string) => {
    const plan = planType.toLowerCase();
    switch (plan) {
      case 'vip': return 'default';
      case 'ultra': return 'secondary';
      case 'pro': return 'outline';
      case 'basic': return 'outline';
      case 'free': return 'outline';
      default: return 'outline';
    }
  };

  const getTypeBadgeVariant = (accountType: string) => {
    switch (accountType) {
      case 'institutional': return 'default';
      case 'personal': return 'outline';
      default: return 'outline';
    }
  };

  if (error) {
    return (
      <div className="p-6">
        <Card className="p-6 bg-red-50 border-red-200">
          <h3 className="text-lg font-semibold text-red-900 mb-2">Erro ao carregar usuários</h3>
          <p className="text-red-700">{error.message}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Gerenciamento de Usuários</h2>
        <p className="text-muted-foreground">
          Visualize e gerencie todos os usuários da plataforma
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-3 text-gray-600">Carregando usuários...</span>
        </div>
      ) : (
        <>
      <Card>
        <CardHeader>
          <CardTitle>Filtros e Busca</CardTitle>
          <CardDescription>
            Use os filtros abaixo para encontrar usuários específicos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar usuários..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={filterPlan} onValueChange={setFilterPlan}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por plano" />
              </SelectTrigger>
              <SelectContent side="bottom" align="start" avoidCollisions={false}>
                <SelectItem value="all">Todos os planos</SelectItem>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="basic">Basic</SelectItem>
                <SelectItem value="pro">Pro</SelectItem>
                <SelectItem value="ultra">Ultra</SelectItem>
                <SelectItem value="vip">VIP</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent side="bottom" align="start" avoidCollisions={false}>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="personal">Pessoal</SelectItem>
                <SelectItem value="institutional">Institucional</SelectItem>
              </SelectContent>
            </Select>

            <div className="text-sm text-muted-foreground flex items-center">
              {filteredUsers.length} usuário(s) encontrado(s)
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Usuários</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Haras/Fazenda</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead>Início VIP</TableHead>
                  <TableHead>Término VIP</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell className="text-muted-foreground">{user.email}</TableCell>
                    <TableCell className="text-muted-foreground">{user.phone}</TableCell>
                    <TableCell>
                      <Badge variant={getTypeBadgeVariant(user.accountType)}>
                        {user.accountType === 'personal' ? 'Pessoal' : 'Institucional'}
                      </Badge>
                    </TableCell>
                    <TableCell>{user.propertyName || '-'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant={getPlanBadgeVariant(getEffectivePlan(user).toUpperCase())}>
                          {getEffectivePlan(user).toUpperCase()}
                        </Badge>
                        {isPlanExpired(user) && (
                          <Badge variant="outline" className="bg-red-100 text-red-700 border-red-200">
                            Expirado
                          </Badge>
                        )}
                        {getEffectivePlan(user) === 'vip' && (
                          <div className="flex items-center gap-1">
                            <Crown className="h-4 w-4 text-yellow-500" />
                            <span className="text-xs text-muted-foreground">(VIP)</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          user.isSuspended
                            ? 'bg-red-500'
                            : isPlanExpired(user)
                              ? 'bg-yellow-500'
                              : user.isActive
                                ? 'bg-green-500'
                                : 'bg-gray-500'
                        }`} />
                        {user.isSuspended
                          ? 'Suspenso'
                          : isPlanExpired(user)
                            ? 'Plano expirado'
                            : user.isActive
                              ? 'Ativo'
                              : 'Inativo'}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.planPurchasedAt ? (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(user.planPurchasedAt).toLocaleDateString('pt-BR')}
                        </div>
                      ) : '-'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.planExpiresAt ? (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(user.planExpiresAt).toLocaleDateString('pt-BR')}
                        </div>
                      ) : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {/* Seção de Observações */}
                          {user.isSuspended && (
                            <>
                              <div className="px-2 py-1.5 text-xs font-medium text-gray-500 border-b">
                                Observações
                              </div>
                              <div className="px-2 py-1.5 text-xs text-gray-600 max-w-xs">
                                <div className="flex items-center gap-1 text-red-600 font-medium mb-1">
                                  <ShieldX className="h-3 w-3" />
                                  Usuário Suspenso
                                </div>
                              </div>
                              <div className="border-t my-1"></div>
                            </>
                          )}
                          
                          {user.plan === 'vip' && (
                            <>
                              <div className="px-2 py-1.5 text-xs font-medium text-gray-500 border-b">
                                Observações
                              </div>
                              <div className="px-2 py-1.5 text-xs text-gray-600">
                                <div className="flex items-center gap-1 text-yellow-600 font-medium">
                                  <Crown className="h-3 w-3" />
                                  Plano VIP
                                </div>
                              </div>
                              <div className="border-t my-1"></div>
                            </>
                          )}

                          {/* Ações */}
                          <div className="px-2 py-1.5 text-xs font-medium text-gray-500">
                            Ações
                          </div>
                          <DropdownMenuItem onClick={() => handleUserAction(user.id, 'edit')}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar usuário
                          </DropdownMenuItem>
                          {user.plan !== 'vip' && !user.isSuspended && (
                            <DropdownMenuItem onClick={() => handleUserAction(user.id, 'edit')}>
                              <Crown className="mr-2 h-4 w-4" />
                              Conceder VIP Gratuito
                            </DropdownMenuItem>
                          )}
                          {!user.isSuspended ? (
                            <DropdownMenuItem 
                              onClick={() => handleUserAction(user.id, 'suspend')}
                              className="text-red-600"
                            >
                              <Ban className="mr-2 h-4 w-4" />
                              Suspender usuário
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem 
                              onClick={() => handleUserAction(user.id, 'activate')}
                              className="text-green-600"
                            >
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Reativar usuário
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <EditUserModal
        user={editingUser}
        isOpen={isEditModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveUser}
      />

      <SuspensionModal
        user={suspendingUser}
        isOpen={isSuspensionModalOpen}
        onClose={() => {
          setIsSuspensionModalOpen(false);
          setSuspendingUser(null);
        }}
        onConfirm={handleConfirmSuspension}
      />
      </>
      )}
    </div>
  );
}