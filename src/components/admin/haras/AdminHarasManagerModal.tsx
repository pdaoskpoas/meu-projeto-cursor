import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { NewAnimalWizard } from '@/components/animal/NewAnimalWizard';
import EditAnimalModal from '@/components/forms/animal/EditAnimalModal';
import { getUserPlanQuota } from '@/services/planService';
import { normalizeNameForStorage } from '@/utils/nameFormat';
import type { AdminHarasProfile } from '@/hooks/admin/useAdminHaras';
import type { PlanQuota } from '@/services/planService';
import { Loader2, Plus, RefreshCw, UploadCloud } from 'lucide-react';
import { logAdminAction } from '@/services/adminAuditService';

interface AdminAnimal {
  id: string;
  name: string;
  breed: string;
  gender: 'Macho' | 'Fêmea';
  birth_date: string;
  ad_status: 'active' | 'paused' | 'expired' | 'draft';
  images: string[];
  created_at: string;
  coat?: string | null;
  current_city?: string | null;
  current_state?: string | null;
  description?: string | null;
  allow_messages?: boolean;
  auto_renew?: boolean;
  father_name?: string | null;
  mother_name?: string | null;
  paternal_grandfather_name?: string | null;
  paternal_grandmother_name?: string | null;
  maternal_grandfather_name?: string | null;
  maternal_grandmother_name?: string | null;
}

interface AdminHarasManagerModalProps {
  isOpen: boolean;
  profile: AdminHarasProfile | null;
  onClose: () => void;
  onUpdated?: () => void;
}

const toDateInput = (value?: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().split('T')[0];
};

const AdminHarasManagerModal: React.FC<AdminHarasManagerModalProps> = ({
  isOpen,
  profile,
  onClose,
  onUpdated
}) => {
  const { toast } = useToast();
  const { user: adminUser } = useAuth();
  const [animals, setAnimals] = useState<AdminAnimal[]>([]);
  const [animalsLoading, setAnimalsLoading] = useState(false);
  const [animalsError, setAnimalsError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [animalToEdit, setAnimalToEdit] = useState<AdminAnimal | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [quota, setQuota] = useState<PlanQuota | null>(null);
  const [quotaLoading, setQuotaLoading] = useState(false);

  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: '',
    propertyName: '',
    propertyType: 'haras' as AdminHarasProfile['propertyType'],
    plan: 'free' as AdminHarasProfile['plan'],
    planExpiresAt: '',
    planPurchasedAt: '',
    avatarUrl: ''
  });
  const [originalPlan, setOriginalPlan] = useState<AdminHarasProfile['plan']>('free');

  const loadAnimals = useCallback(async () => {
    if (!profile?.id) return;
    try {
      setAnimalsLoading(true);
      setAnimalsError(null);
      const { data, error } = await supabase
        .from('animals')
        .select('id, name, breed, gender, birth_date, ad_status, images, created_at, coat, current_city, current_state, description, allow_messages, auto_renew, father_name, mother_name, paternal_grandfather_name, paternal_grandmother_name, maternal_grandfather_name, maternal_grandmother_name')
        .eq('haras_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAnimals((data || []) as AdminAnimal[]);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao carregar anúncios.';
      setAnimalsError(message);
    } finally {
      setAnimalsLoading(false);
    }
  }, [profile?.id]);

  const loadQuota = useCallback(async () => {
    if (!profile?.id) return;
    try {
      setQuotaLoading(true);
      const data = await getUserPlanQuota(profile.id);
      setQuota(data);
    } catch (error: unknown) {
      console.error('Erro ao carregar quota do haras:', error);
      setQuota(null);
    } finally {
      setQuotaLoading(false);
    }
  }, [profile?.id]);

  const loadProfileDetails = useCallback(async () => {
    if (!profile?.id) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('name, property_name, property_type, plan, plan_expires_at, plan_purchased_at, avatar_url')
        .eq('id', profile.id)
        .single();

      if (error) throw error;

      setProfileForm({
        name: data?.name || '',
        propertyName: data?.property_name || '',
        propertyType: (data?.property_type as AdminHarasProfile['propertyType']) || 'haras',
        plan: (data?.plan as AdminHarasProfile['plan']) || 'free',
        planExpiresAt: toDateInput(data?.plan_expires_at),
        planPurchasedAt: data?.plan_purchased_at ? toDateInput(data.plan_purchased_at) : '',
        avatarUrl: data?.avatar_url || ''
      });
      setOriginalPlan((data?.plan as AdminHarasProfile['plan']) || 'free');
    } catch (error: unknown) {
      console.error('Erro ao carregar dados do haras:', error);
      toast({
        title: 'Erro ao carregar dados do haras',
        description: error instanceof Error ? error.message : 'Tente novamente.',
        variant: 'destructive'
      });
    }
  }, [profile?.id, toast]);

  useEffect(() => {
    if (!isOpen || !profile?.id) return;
    loadAnimals();
    loadQuota();
    loadProfileDetails();
  }, [isOpen, profile?.id, loadAnimals, loadQuota, loadProfileDetails]);

  useEffect(() => {
    if (isOpen) return;
    setIsAddModalOpen(false);
    setIsEditModalOpen(false);
    setAnimalToEdit(null);
    setSearchTerm('');
  }, [isOpen]);

  const filteredAnimals = useMemo(() => {
    if (!searchTerm.trim()) return animals;
    const term = searchTerm.toLowerCase();
    return animals.filter(animal =>
      animal.name.toLowerCase().includes(term) ||
      animal.breed.toLowerCase().includes(term)
    );
  }, [animals, searchTerm]);

  const handleSaveProfile = async () => {
    if (!profile?.id) return;
    try {
      setIsSavingProfile(true);
      const isGrantingVip = profileForm.plan === 'vip' && originalPlan !== 'vip';
      const shouldSetVipStart = profileForm.plan === 'vip' && !profileForm.planPurchasedAt;
      const vipStart = shouldSetVipStart ? new Date().toISOString() : (profileForm.planPurchasedAt ? new Date(profileForm.planPurchasedAt).toISOString() : null);

      const { error } = await supabase
        .from('profiles')
        .update({
          name: profileForm.name,
          property_name: normalizeNameForStorage(profileForm.propertyName),
          property_type: profileForm.propertyType || null,
          plan: profileForm.plan,
          plan_expires_at: profileForm.planExpiresAt ? new Date(profileForm.planExpiresAt).toISOString() : null,
          plan_purchased_at: vipStart,
          avatar_url: profileForm.avatarUrl || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id);

      if (error) throw error;

      if (isGrantingVip) {
        await supabase.from('transactions').insert({
          user_id: profile.id,
          type: 'plan_subscription',
          amount: 0,
          currency: 'BRL',
          status: 'completed',
          plan_type: 'vip',
          is_annual: false,
          metadata: {
            admin_grant: true,
            granted_by_admin: adminUser?.id || null,
            plan_expires_at: profileForm.planExpiresAt || null
          }
        });
      }

      await logAdminAction({
        action: 'update_haras',
        adminId: adminUser?.id,
        resourceType: 'profile',
        resourceId: profile.id,
        oldData: { plan: originalPlan },
        newData: profileForm
      });

      if (shouldSetVipStart) {
        setProfileForm((prev) => ({ ...prev, planPurchasedAt: toDateInput(vipStart) }));
      }

      toast({
        title: 'Haras atualizado!',
        description: 'Dados do haras foram salvos com sucesso.'
      });
      setOriginalPlan(profileForm.plan);
      onUpdated?.();
      loadQuota();
    } catch (error: unknown) {
      toast({
        title: 'Erro ao salvar haras',
        description: error instanceof Error ? error.message : 'Tente novamente.',
        variant: 'destructive'
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleLogoUpload = async (file: File | null) => {
    if (!profile?.id || !file) return;
    try {
      setIsUploadingLogo(true);
      if (!file.type.startsWith('image/')) {
        throw new Error('Apenas imagens são permitidas.');
      }
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Imagem muito grande. Máximo 5MB.');
      }
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${profile.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setProfileForm((prev) => ({ ...prev, avatarUrl: data.publicUrl }));
      toast({
        title: 'Logo enviado',
        description: 'Logo atualizado, não esqueça de salvar.'
      });
    } catch (error: unknown) {
      toast({
        title: 'Erro no upload',
        description: error instanceof Error ? error.message : 'Não foi possível enviar o logo.',
        variant: 'destructive'
      });
    } finally {
      setIsUploadingLogo(false);
    }
  };

  if (!profile) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            Gerenciar Haras: {profile.propertyName || profile.name}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="animals" className="mt-2">
          <TabsList>
            <TabsTrigger value="animals">Anúncios</TabsTrigger>
            <TabsTrigger value="profile">Dados do Haras</TabsTrigger>
          </TabsList>

          <TabsContent value="animals" className="space-y-4">
            <Card className="p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Plano</p>
                  <div className="flex items-center gap-2">
                    <Badge variant={profileForm.plan === 'vip' ? 'default' : 'outline'}>
                      {profileForm.plan.toUpperCase()}
                    </Badge>
                    {quotaLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    ) : quota ? (
                      <span className="text-sm text-muted-foreground">
                        {quota.remaining} de {quota.allowedByPlan} vagas disponíveis
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">Quota indisponível</span>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={loadAnimals} disabled={animalsLoading}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Atualizar
                  </Button>
                  <Button onClick={() => setIsAddModalOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Novo anúncio
                  </Button>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <Input
                  placeholder="Buscar por nome ou raça..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="md:max-w-sm"
                />
                <span className="text-sm text-muted-foreground">
                  {filteredAnimals.length} anúncio(s)
                </span>
              </div>
            </Card>

            <Card>
              {animalsLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : animalsError ? (
                <div className="p-6 text-sm text-red-600">{animalsError}</div>
              ) : filteredAnimals.length === 0 ? (
                <div className="p-6 text-sm text-muted-foreground">
                  Nenhum anúncio encontrado para este haras.
                </div>
              ) : (
                <div className="p-4 overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Raça</TableHead>
                        <TableHead>Nascimento</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAnimals.map((animal) => (
                        <TableRow key={animal.id}>
                          <TableCell className="font-medium">{animal.name}</TableCell>
                          <TableCell>
                            <Badge variant={animal.ad_status === 'active' ? 'default' : 'secondary'}>
                              {animal.ad_status === 'active' ? 'Ativo' : animal.ad_status === 'paused' ? 'Pausado' : 'Expirado'}
                            </Badge>
                          </TableCell>
                          <TableCell>{animal.breed}</TableCell>
                          <TableCell>
                            {animal.birth_date ? new Date(animal.birth_date).toLocaleDateString('pt-BR') : '-'}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setAnimalToEdit(animal);
                                setIsEditModalOpen(true);
                              }}
                              disabled={animal.ad_status !== 'active'}
                              title={animal.ad_status !== 'active' ? 'Somente anúncios ativos podem ser editados' : 'Editar anúncio'}
                            >
                              Editar
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="profile" className="space-y-4">
            <Card className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nome do responsável</label>
                  <Input
                    value={profileForm.name}
                    onChange={(e) => setProfileForm((prev) => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Nome do Haras</label>
                  <Input
                    value={profileForm.propertyName}
                    onChange={(e) => setProfileForm((prev) => ({ ...prev, propertyName: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Tipo de propriedade</label>
                  <Select
                    value={profileForm.propertyType || 'haras'}
                    onValueChange={(value) =>
                      setProfileForm((prev) => ({ ...prev, propertyType: value as AdminHarasProfile['propertyType'] }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent side="bottom" align="start" avoidCollisions={false}>
                      <SelectItem value="haras">Haras</SelectItem>
                      <SelectItem value="fazenda">Fazenda</SelectItem>
                      <SelectItem value="cte">CTE</SelectItem>
                      <SelectItem value="central-reproducao">Central Reprodução</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Plano</label>
                  <Select
                    value={profileForm.plan}
                    onValueChange={(value) =>
                      setProfileForm((prev) => ({ ...prev, plan: value as AdminHarasProfile['plan'] }))
                    }
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

                <div className="space-y-2">
                  <label className="text-sm font-medium">Plano expira em</label>
                  <Input
                    type="date"
                    value={profileForm.planExpiresAt}
                    onChange={(e) => setProfileForm((prev) => ({ ...prev, planExpiresAt: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Deixe vazio para planos vitalícios (VIP).
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Logo do Haras</label>
                  <div className="flex flex-col gap-2">
                    <Input
                      placeholder="URL do logo"
                      value={profileForm.avatarUrl}
                      onChange={(e) => setProfileForm((prev) => ({ ...prev, avatarUrl: e.target.value }))}
                    />
                    <label className="inline-flex items-center gap-2 text-sm text-blue-600 cursor-pointer">
                      <UploadCloud className="h-4 w-4" />
                      {isUploadingLogo ? 'Enviando...' : 'Enviar novo logo'}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleLogoUpload(e.target.files?.[0] || null)}
                        disabled={isUploadingLogo}
                      />
                    </label>
                  </div>
                </div>
              </div>

              <Card className="p-4 bg-muted/30">
                <div className="flex flex-col gap-2">
                  <span className="text-sm text-muted-foreground">Vagas disponíveis</span>
                  {quotaLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  ) : quota ? (
                    <span className="text-sm">
                      {quota.remaining} de {quota.allowedByPlan} vagas disponíveis (ativos: {quota.active})
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground">Informação indisponível</span>
                  )}
                </div>
              </Card>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={onClose}>
                  Fechar
                </Button>
                <Button onClick={handleSaveProfile} disabled={isSavingProfile}>
                  {isSavingProfile ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Salvar alterações
                </Button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>

      <NewAnimalWizard
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        actingUserId={profile.id}
        actingProfile={{ property_name: profileForm.propertyName || profile.propertyName || null, account_type: 'institutional' }}
        isAdminMode
        adminUserId={adminUser?.id}
        onSuccess={() => {
          loadAnimals();
          loadQuota();
          setIsAddModalOpen(false);
        }}
      />

      {animalToEdit && (
        <EditAnimalModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setAnimalToEdit(null);
          }}
          animal={animalToEdit}
          onSuccess={() => {
            loadAnimals();
          }}
          uploaderId={profile.id}
          allowNameEdit
          adminUserId={adminUser?.id}
        />
      )}
    </Dialog>
  );
};

export default AdminHarasManagerModal;
