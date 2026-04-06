import React, { useState, useEffect, useRef } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Save,
  X,
  Building2,
  Link as LinkIcon,
  TrendingUp,
  MousePointerClick,
  CheckCircle2,
  Image as ImageIcon,
  Search,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import SponsorService, { Sponsor, CreateSponsorData } from '@/services/sponsorService';

interface HarasOption {
  id: string;
  label: string;
}

const AdminSponsors: React.FC = () => {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingSponsor, setEditingSponsor] = useState<Sponsor | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    website_url: '',
    is_active: false,
    linked_profile_id: '' as string,
    click_action_enabled: false,
  });

  // Haras search
  const [harasOptions, setHarasOptions] = useState<HarasOption[]>([]);
  const [harasSearch, setHarasSearch] = useState('');
  const [harasSearchResults, setHarasSearchResults] = useState<HarasOption[]>([]);
  const [showHarasDropdown, setShowHarasDropdown] = useState(false);

  // Logo files
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    loadSponsors();
    loadHarasOptions();
  }, []);

  useEffect(() => {
    if (!harasSearch.trim()) {
      setHarasSearchResults(harasOptions.slice(0, 8));
      return;
    }
    const q = harasSearch.toLowerCase();
    setHarasSearchResults(harasOptions.filter(h => h.label.toLowerCase().includes(q)).slice(0, 8));
  }, [harasSearch, harasOptions]);

  const loadHarasOptions = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, property_name, name')
      .eq('account_type', 'institutional')
      .order('property_name', { ascending: true });
    if (data) {
      setHarasOptions(data.map(p => ({
        id: p.id,
        label: p.property_name || p.name,
      })));
    }
  };

  const selectedHarasLabel = harasOptions.find(h => h.id === formData.linked_profile_id)?.label || '';

  const loadSponsors = async () => {
    setLoading(true);
    try {
      const data = await SponsorService.getAllSponsors();
      setSponsors(data);
    } catch (error) {
      console.error('Erro ao carregar patrocinadores:', error);
      toast.error('Erro ao carregar patrocinadores');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSponsor = async () => {
    if (!formData.name.trim()) {
      toast.error('Nome do patrocinador é obrigatório');
      return;
    }

    if (!logoFile) {
      toast.error('Logo é obrigatório');
      return;
    }

    try {
      // Criar patrocinador
      const result = await SponsorService.createSponsor({
        name: formData.name,
        website_url: formData.website_url || undefined,
        is_active: formData.is_active,
        display_priority: 0,
        display_locations: ['home'],
        linked_profile_id: formData.linked_profile_id || null,
        click_action_enabled: formData.click_action_enabled,
      });
      
      if (!result.success || !result.sponsor) {
        toast.error(result.error || 'Erro ao criar patrocinador');
        return;
      }

      // Upload de logo
      const uploadResult = await SponsorService.uploadLogos(result.sponsor.id, {
        logoFile,
      });
      
      if (!uploadResult.success) {
        toast.error('Erro no upload do logo. Tente editar o patrocinador para fazer upload novamente.');
      } else {
        toast.success('Patrocinador criado com sucesso!');
      }

      setIsCreateModalOpen(false);
      resetForm();
      loadSponsors();
    } catch (error: unknown) {
      console.error('Erro ao criar patrocinador:', error);
      const message = error instanceof Error ? error.message : 'Erro ao criar patrocinador';
      toast.error(message);
    }
  };

  const handleUpdateSponsor = async () => {
    if (!editingSponsor) return;

    if (!formData.name.trim()) {
      toast.error('Nome do patrocinador é obrigatório');
      return;
    }

    try {
      const result = await SponsorService.updateSponsor(editingSponsor.id, {
        name: formData.name,
        website_url: formData.website_url || undefined,
        is_active: formData.is_active,
        linked_profile_id: formData.linked_profile_id || null,
        click_action_enabled: formData.click_action_enabled,
      });
      
      if (!result.success) {
        toast.error(result.error || 'Erro ao atualizar patrocinador');
        return;
      }

      // Upload de novo logo (se houver)
      if (logoFile) {
        const uploadResult = await SponsorService.uploadLogos(editingSponsor.id, {
          logoFile,
        });
        
        if (!uploadResult.success) {
          toast.warning('Patrocinador atualizado, mas houve erro no upload do logo');
        }
      }

      toast.success('Patrocinador atualizado com sucesso!');
      setIsEditModalOpen(false);
      setEditingSponsor(null);
      resetForm();
      loadSponsors();
    } catch (error: unknown) {
      console.error('Erro ao atualizar patrocinador:', error);
      const message = error instanceof Error ? error.message : 'Erro ao atualizar patrocinador';
      toast.error(message);
    }
  };

  const handleToggleStatus = async (sponsor: Sponsor) => {
    try {
      const result = await SponsorService.toggleSponsorStatus(sponsor.id, !sponsor.is_active);
      
      if (!result.success) {
        toast.error(result.error || 'Erro ao atualizar status');
        return;
      }

      toast.success(`Patrocinador ${!sponsor.is_active ? 'ativado' : 'desativado'} com sucesso!`);
      loadSponsors();
    } catch (error: unknown) {
      console.error('Erro ao atualizar status:', error);
      const message = error instanceof Error ? error.message : 'Erro ao atualizar status';
      toast.error(message);
    }
  };

  const handleDeleteSponsor = async (sponsor: Sponsor) => {
    if (!confirm(`Tem certeza que deseja deletar o patrocinador "${sponsor.name}"?`)) {
      return;
    }

    try {
      const result = await SponsorService.deleteSponsor(sponsor.id);
      
      if (!result.success) {
        toast.error(result.error || 'Erro ao deletar patrocinador');
        return;
      }

      toast.success('Patrocinador deletado com sucesso!');
      loadSponsors();
    } catch (error: unknown) {
      console.error('Erro ao deletar patrocinador:', error);
      const message = error instanceof Error ? error.message : 'Erro ao deletar patrocinador';
      toast.error(message);
    }
  };

  const openEditModal = (sponsor: Sponsor) => {
    setEditingSponsor(sponsor);
    setFormData({
      name: sponsor.name,
      website_url: sponsor.website_url || '',
      is_active: sponsor.is_active,
      linked_profile_id: sponsor.linked_profile_id || '',
      click_action_enabled: sponsor.click_action_enabled,
    });
    setHarasSearch('');
    setLogoPreview(sponsor.logo_url || '');
    setIsEditModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      website_url: '',
      is_active: false,
      linked_profile_id: '',
      click_action_enabled: false,
    });
    setHarasSearch('');
    setLogoFile(null);
    setLogoPreview('');
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gerenciar Patrocinadores</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie os logos exibidos na seção "Empresas que confiam na Vitrine do Cavalo"
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Adicionar Patrocinador
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Ativos</p>
              <p className="text-2xl font-bold">{sponsors.filter(s => s.is_active).length}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <TrendingUp className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Impressões Totais</p>
              <p className="text-2xl font-bold">
                {sponsors.reduce((acc, s) => acc + s.impression_count, 0)}
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <MousePointerClick className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Cliques Totais</p>
              <p className="text-2xl font-bold">
                {sponsors.reduce((acc, s) => acc + s.click_count, 0)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Lista de Patrocinadores */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sponsors.map((sponsor) => (
          <Card key={sponsor.id} className="p-4 space-y-3">
            {/* Logo e Status */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                {sponsor.logo_url ? (
                  <img
                    src={sponsor.logo_url}
                    alt={sponsor.name}
                    className="h-12 w-12 object-contain rounded"
                  />
                ) : (
                  <div className="h-12 w-12 bg-gray-100 rounded flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-gray-400" />
                  </div>
                )}
                <div>
                  <h3 className="font-semibold">{sponsor.name}</h3>
                  {sponsor.website_url && (
                    <a 
                      href={sponsor.website_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-blue-500 hover:underline flex items-center gap-1"
                    >
                      <LinkIcon className="h-3 w-3" />
                      Website
                    </a>
                  )}
                </div>
              </div>
              <Badge variant={sponsor.is_active ? 'default' : 'secondary'}>
                {sponsor.is_active ? 'Ativo' : 'Inativo'}
              </Badge>
            </div>

            {/* Estatísticas */}
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Eye className="h-4 w-4 text-blue-500" />
                <span>{sponsor.impression_count}</span>
              </div>
              <div className="flex items-center gap-1">
                <MousePointerClick className="h-4 w-4 text-purple-500" />
                <span>{sponsor.click_count}</span>
              </div>
            </div>

            {/* Ações */}
            <div className="flex items-center gap-2 pt-2 border-t">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleToggleStatus(sponsor)}
                className="flex-1"
              >
                {sponsor.is_active ? (
                  <>
                    <EyeOff className="h-4 w-4 mr-1" />
                    Desativar
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-1" />
                    Ativar
                  </>
                )}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => openEditModal(sponsor)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleDeleteSponsor(sponsor)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {sponsors.length === 0 && (
        <Card className="p-12 text-center">
          <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhum patrocinador cadastrado</h3>
          <p className="text-muted-foreground mb-4">
            Comece adicionando seu primeiro patrocinador para exibir na home
          </p>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Primeiro Patrocinador
          </Button>
        </Card>
      )}

      {/* Modal de Criar/Editar */}
      <Dialog open={isCreateModalOpen || isEditModalOpen} onOpenChange={(open) => {
        if (!open) {
          setIsCreateModalOpen(false);
          setIsEditModalOpen(false);
          setEditingSponsor(null);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingSponsor ? 'Editar Patrocinador' : 'Adicionar Novo Patrocinador'}
            </DialogTitle>
            <DialogDescription>
              Preencha as informações abaixo para {editingSponsor ? 'atualizar' : 'criar'} o patrocinador
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Nome */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Nome *
                <span className="text-xs text-muted-foreground ml-2">(identificação interna)</span>
              </label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Rações Premium"
              />
            </div>

            {/* Logo Upload */}
            <div>
              <label className="text-sm font-medium mb-2 block">Logo *</label>
              <div className="border-2 border-dashed rounded-lg p-4 text-center">
                {logoPreview ? (
                  <div className="space-y-2">
                    <img
                      src={logoPreview}
                      alt="Preview"
                      className="max-h-32 mx-auto object-contain"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setLogoPreview('');
                        setLogoFile(null);
                        if (fileInputRef.current) {
                          fileInputRef.current.value = '';
                        }
                      }}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Remover
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp"
                      onChange={handleLogoChange}
                      className="hidden"
                      id="logo-upload-input"
                    />
                    <label htmlFor="logo-upload-input" className="cursor-pointer block">
                      <div className="space-y-2">
                        <ImageIcon className="h-8 w-8 mx-auto text-muted-foreground" />
                        <p className="text-sm text-muted-foreground text-center">
                          Clique aqui para selecionar o logo
                        </p>
                        <p className="text-xs text-muted-foreground text-center">
                          PNG, JPG ou WEBP até 5MB
                        </p>
                      </div>
                    </label>
                    <div className="flex justify-center">
                      <label htmlFor="logo-upload-input">
                        <Button type="button" variant="outline" size="sm">
                          Escolher Arquivo
                        </Button>
                      </label>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Website */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Website (opcional)
              </label>
              <div className="relative">
                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={formData.website_url}
                  onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                  placeholder="https://exemplo.com"
                  className="pl-10"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Se informado, o banner será clicável e levará os usuários para este link
              </p>
            </div>

            {/* Vincular a perfil de haras */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Vincular ao perfil do haras no site
                <span className="text-xs text-muted-foreground ml-2">(opcional)</span>
              </label>
              <div className="relative">
                {formData.linked_profile_id ? (
                  <div className="flex items-center gap-2 border rounded-md px-3 py-2 bg-blue-50 border-blue-200">
                    <Building2 className="h-4 w-4 text-blue-500 shrink-0" />
                    <span className="text-sm flex-1 truncate">{selectedHarasLabel}</span>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, linked_profile_id: '' })}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={harasSearch}
                      onChange={(e) => {
                        setHarasSearch(e.target.value);
                        setShowHarasDropdown(true);
                      }}
                      onFocus={() => setShowHarasDropdown(true)}
                      onBlur={() => setTimeout(() => setShowHarasDropdown(false), 150)}
                      placeholder="Buscar haras cadastrado..."
                      className="pl-10"
                    />
                    {showHarasDropdown && harasSearchResults.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-md max-h-48 overflow-y-auto">
                        {harasSearchResults.map(h => (
                          <button
                            key={h.id}
                            type="button"
                            className="w-full text-left px-3 py-2 text-sm hover:bg-accent flex items-center gap-2"
                            onMouseDown={() => {
                              setFormData({ ...formData, linked_profile_id: h.id });
                              setHarasSearch('');
                              setShowHarasDropdown(false);
                            }}
                          >
                            <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                            {h.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Se vinculado, o clique no logo redireciona para a página do haras no site (prioridade sobre o website externo)
              </p>
            </div>

            {/* Ação de clique */}
            <div className="space-y-2 rounded-lg border p-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="click_action_enabled"
                  checked={formData.click_action_enabled}
                  onChange={(e) => setFormData({ ...formData, click_action_enabled: e.target.checked })}
                  className="h-4 w-4"
                />
                <label htmlFor="click_action_enabled" className="text-sm font-medium cursor-pointer">
                  Ativar ação ao clicar no logo
                </label>
              </div>
              {formData.click_action_enabled && (
                <p className="text-xs text-muted-foreground pl-6">
                  {formData.linked_profile_id
                    ? 'Clique vai redirecionar para o perfil do haras no site'
                    : formData.website_url
                      ? 'Clique vai abrir o website externo'
                      : 'Informe um haras vinculado ou website para ativar o redirecionamento'}
                </p>
              )}
            </div>

            {/* Status Ativo */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="h-4 w-4"
              />
              <label htmlFor="is_active" className="text-sm font-medium cursor-pointer">
                Ativar patrocinador imediatamente
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateModalOpen(false);
                setIsEditModalOpen(false);
                setEditingSponsor(null);
                resetForm();
              }}
            >
              Cancelar
            </Button>
            <Button onClick={editingSponsor ? handleUpdateSponsor : handleCreateSponsor}>
              <Save className="h-4 w-4 mr-2" />
              {editingSponsor ? 'Atualizar' : 'Criar'} Patrocinador
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminSponsors;
