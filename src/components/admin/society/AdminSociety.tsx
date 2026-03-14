import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Loader2, Plus, Search, Trash2, Edit } from 'lucide-react';
import { logAdminAction } from '@/services/adminAuditService';

interface AdminAnimal {
  id: string;
  name: string;
  breed: string;
  owner_id: string | null;
  haras_id: string | null;
  haras_name: string | null;
  ad_status: string | null;
}

interface HarasProfile {
  id: string;
  name: string | null;
  property_name: string | null;
  public_code: string | null;
}

interface PartnershipRow {
  id: string;
  animal_id: string | null;
  partner_id: string | null;
  percentage: number | null;
  status: string | null;
  created_at: string | null;
  joined_at?: string | null;
  animals?: { name: string | null; haras_name: string | null };
  profiles?: { name: string | null; property_name: string | null };
}

const AdminSociety: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchAnimal, setSearchAnimal] = useState('');
  const [searchHaras, setSearchHaras] = useState('');
  const [animalResults, setAnimalResults] = useState<AdminAnimal[]>([]);
  const [harasResults, setHarasResults] = useState<HarasProfile[]>([]);
  const [selectedAnimal, setSelectedAnimal] = useState<AdminAnimal | null>(null);
  const [selectedHaras, setSelectedHaras] = useState<HarasProfile | null>(null);
  const [percentage, setPercentage] = useState('50');
  const [isCreating, setIsCreating] = useState(false);

  const [partnerships, setPartnerships] = useState<PartnershipRow[]>([]);
  const [loadingPartnerships, setLoadingPartnerships] = useState(false);
  const [editingPartnership, setEditingPartnership] = useState<PartnershipRow | null>(null);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    const fetchAnimals = async () => {
      if (searchAnimal.trim().length < 2) {
        setAnimalResults([]);
        return;
      }
      const { data, error } = await supabase
        .from('animals')
        .select('id, name, breed, owner_id, haras_id, haras_name, ad_status')
        .ilike('name', `%${searchAnimal.trim()}%`)
        .order('created_at', { ascending: false })
        .limit(10);
      if (!error) {
        setAnimalResults((data || []) as AdminAnimal[]);
      }
    };
    fetchAnimals();
  }, [searchAnimal]);

  useEffect(() => {
    const fetchHaras = async () => {
      if (searchHaras.trim().length < 2) {
        setHarasResults([]);
        return;
      }
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, property_name, public_code')
        .eq('account_type', 'institutional')
        .or(`name.ilike.%${searchHaras.trim()}%,property_name.ilike.%${searchHaras.trim()}%`)
        .order('property_name', { ascending: true })
        .limit(10);
      if (!error) {
        setHarasResults((data || []) as HarasProfile[]);
      }
    };
    fetchHaras();
  }, [searchHaras]);

  const loadPartnerships = useCallback(async () => {
    try {
      setLoadingPartnerships(true);
      const { data, error } = await supabase
        .from('animal_partnerships')
        .select(`
          id,
          animal_id,
          partner_id,
          percentage,
          status,
          created_at,
          joined_at,
          animals (name, haras_name),
          profiles:partner_id (name, property_name)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setPartnerships((data || []) as PartnershipRow[]);
    } catch (error: unknown) {
      toast({
        title: 'Erro ao carregar sociedades',
        description: error instanceof Error ? error.message : 'Não foi possível carregar as sociedades.',
        variant: 'destructive'
      });
    } finally {
      setLoadingPartnerships(false);
    }
  }, [toast]);

  useEffect(() => {
    loadPartnerships();
  }, [loadPartnerships]);

  const filteredPartnerships = useMemo(() => {
    if (filterStatus === 'all') return partnerships;
    return partnerships.filter((item) => item.status === filterStatus);
  }, [partnerships, filterStatus]);

  const handleCreate = async () => {
    if (!selectedAnimal || !selectedHaras) {
      toast({
        title: 'Seleção incompleta',
        description: 'Escolha o animal e o haras parceiro.',
        variant: 'destructive'
      });
      return;
    }

    if (selectedAnimal.owner_id === selectedHaras.id) {
      toast({
        title: 'Haras inválido',
        description: 'O haras parceiro não pode ser o mesmo proprietário do animal.',
        variant: 'destructive'
      });
      return;
    }

    const hasPercentage = percentage.trim().length > 0;
    const percentNum = hasPercentage ? parseFloat(percentage) : null;
    if (hasPercentage && (Number.isNaN(percentNum) || percentNum <= 0 || percentNum > 100)) {
      toast({
        title: 'Percentual inválido',
        description: 'Informe um percentual entre 1 e 100 ou deixe em branco.',
        variant: 'destructive'
      });
      return;
    }

    try {
      setIsCreating(true);

      const payload: Record<string, unknown> = {
        animal_id: selectedAnimal.id,
        partner_id: selectedHaras.id,
        partner_haras_name: selectedHaras.property_name || selectedHaras.name,
        percentage: percentNum,
        status: 'accepted',
        joined_at: new Date().toISOString(),
        added_by: user?.id || null,
        animal_owner_id: selectedAnimal.owner_id,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('animal_partnerships')
        .insert(payload)
        .select('id')
        .single();

      if (error) {
        console.error('Erro ao criar sociedade (admin):', error);
        throw error;
      }

      await logAdminAction({
        action: 'create_partnership_admin',
        adminId: user?.id,
        resourceType: 'animal_partnership',
        resourceId: data?.id,
        newData: payload,
        details: {
          animal_id: selectedAnimal.id,
          partner_id: selectedHaras.id
        }
      });

      toast({
        title: 'Sociedade criada',
        description: `${selectedHaras.property_name || selectedHaras.name} agora é sócio de ${selectedAnimal.name}.`
      });

      setSelectedAnimal(null);
      setSelectedHaras(null);
      setPercentage('50');
      setSearchAnimal('');
      setSearchHaras('');
      setAnimalResults([]);
      setHarasResults([]);
      loadPartnerships();
    } catch (error: unknown) {
      toast({
        title: 'Erro ao criar sociedade',
        description: error instanceof Error ? error.message : 'Não foi possível criar a sociedade.',
        variant: 'destructive'
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (partnershipId: string) => {
    if (!confirm('Tem certeza que deseja remover esta sociedade?')) return;
    try {
      const { error } = await supabase
        .from('animal_partnerships')
        .delete()
        .eq('id', partnershipId);
      if (error) throw error;
      await logAdminAction({
        action: 'delete_partnership_admin',
        adminId: user?.id,
        resourceType: 'animal_partnership',
        resourceId: partnershipId
      });
      toast({
        title: 'Sociedade removida',
        description: 'A sociedade foi encerrada com sucesso.'
      });
      loadPartnerships();
    } catch (error: unknown) {
      toast({
        title: 'Erro ao remover sociedade',
        description: error instanceof Error ? error.message : 'Não foi possível remover.',
        variant: 'destructive'
      });
    }
  };

  const handleUpdatePercentage = async () => {
    if (!editingPartnership) return;
    const percentNum = parseFloat(percentage);
    if (Number.isNaN(percentNum) || percentNum <= 0 || percentNum > 100) {
      toast({
        title: 'Percentual inválido',
        description: 'Informe um percentual entre 1 e 100.',
        variant: 'destructive'
      });
      return;
    }
    try {
      const { error } = await supabase
        .from('animal_partnerships')
        .update({ percentage: percentNum, updated_at: new Date().toISOString() })
        .eq('id', editingPartnership.id);
      if (error) throw error;
      await logAdminAction({
        action: 'update_partnership_admin',
        adminId: user?.id,
        resourceType: 'animal_partnership',
        resourceId: editingPartnership.id,
        newData: { percentage: percentNum }
      });
      toast({
        title: 'Percentual atualizado',
        description: 'Participação atualizada com sucesso.'
      });
      setEditingPartnership(null);
      setPercentage('50');
      loadPartnerships();
    } catch (error: unknown) {
      toast({
        title: 'Erro ao atualizar',
        description: error instanceof Error ? error.message : 'Não foi possível atualizar.',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Sociedades (Admin)</h2>
        <p className="text-muted-foreground">
          Crie e gerencie sociedades entre haras sem precisar de convite.
        </p>
      </div>

      <Card className="p-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Buscar Animal</label>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchAnimal}
                onChange={(e) => setSearchAnimal(e.target.value)}
                placeholder="Digite o nome do animal"
                className="pl-9"
              />
            </div>
            {animalResults.length > 0 && (
              <div className="mt-2 space-y-2">
                {animalResults.map((animal) => (
                  <button
                    key={animal.id}
                    type="button"
                    onClick={() => setSelectedAnimal(animal)}
                    className={`w-full text-left p-2 rounded border ${
                      selectedAnimal?.id === animal.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                    }`}
                  >
                    <div className="font-medium">{animal.name}</div>
                    <div className="text-xs text-gray-500">
                      {animal.breed} • {animal.haras_name || 'Sem haras'}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Buscar Haras Parceiro</label>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchHaras}
                onChange={(e) => setSearchHaras(e.target.value)}
                placeholder="Nome do haras"
                className="pl-9"
              />
            </div>
            {harasResults.length > 0 && (
              <div className="mt-2 space-y-2">
                {harasResults.map((haras) => (
                  <button
                    key={haras.id}
                    type="button"
                    onClick={() => setSelectedHaras(haras)}
                    className={`w-full text-left p-2 rounded border ${
                      selectedHaras?.id === haras.id ? 'border-purple-500 bg-purple-50' : 'border-gray-200'
                    }`}
                  >
                    <div className="font-medium">{haras.property_name || haras.name}</div>
                    <div className="text-xs text-gray-500">Código: {haras.public_code || '-'}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Percentual (%)</label>
            <Input
              type="number"
              min="1"
              max="100"
              value={percentage}
              onChange={(e) => setPercentage(e.target.value)}
              className="mt-2"
            />
            <p className="text-xs text-gray-500 mt-2">
              Opcional. Se deixar em branco, a sociedade será criada sem percentual definido.
            </p>
            <Button
              className="mt-4 w-full bg-purple-600 hover:bg-purple-700"
              onClick={handleCreate}
              disabled={isCreating}
            >
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Sociedade
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>

      <Card className="p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h3 className="text-lg font-semibold">Sociedades existentes</h3>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent side="bottom" align="start" avoidCollisions={false}>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="accepted">Ativas</SelectItem>
              <SelectItem value="pending">Pendentes</SelectItem>
              <SelectItem value="rejected">Rejeitadas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loadingPartnerships ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-3 text-gray-600">Carregando sociedades...</span>
          </div>
        ) : filteredPartnerships.length === 0 ? (
          <div className="text-center text-gray-500 py-12">Nenhuma sociedade encontrada.</div>
        ) : (
          <div className="space-y-3">
            {filteredPartnerships.map((partnership) => (
              <div key={partnership.id} className="border rounded-lg p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="font-semibold">{partnership.animals?.name || 'Animal'}</div>
                  <div className="text-sm text-muted-foreground">
                    Haras dono: {partnership.animals?.haras_name || '-'}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Sócio: {partnership.profiles?.property_name || partnership.profiles?.name || '-'}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={partnership.status === 'accepted' ? 'default' : 'secondary'}>
                    {partnership.status || 'ativa'}
                  </Badge>
                  <span className="text-sm font-medium">{partnership.percentage || 0}%</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingPartnership(partnership);
                      setPercentage(String(partnership.percentage || 0));
                    }}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(partnership.id)}>
                    <Trash2 className="h-4 w-4 mr-1" />
                    Remover
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {editingPartnership && (
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold">Editar participação</div>
              <div className="text-sm text-muted-foreground">
                {editingPartnership.animals?.name} • {editingPartnership.profiles?.property_name || editingPartnership.profiles?.name}
              </div>
            </div>
            <Button variant="ghost" onClick={() => setEditingPartnership(null)}>Cancelar</Button>
          </div>
          <div className="flex flex-col md:flex-row gap-3">
            <Input
              type="number"
              min="1"
              max="100"
              value={percentage}
              onChange={(e) => setPercentage(e.target.value)}
              className="md:max-w-[180px]"
            />
            <Button onClick={handleUpdatePercentage}>Salvar alteração</Button>
          </div>
        </Card>
      )}
    </div>
  );
};

export default AdminSociety;
