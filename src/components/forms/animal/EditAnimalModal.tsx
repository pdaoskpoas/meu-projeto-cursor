import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { animalService } from '@/services/animalService';
import { Loader2, CheckCircle2, Building2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { uploadMultiplePhotos } from '@/components/animal/NewAnimalWizard/utils/uploadWithRetry';
import EditAnimalPhotosSection from '@/components/forms/animal/EditAnimalPhotosSection';
import { logAdminAction } from '@/services/adminAuditService';

const CATEGORY_OPTIONS = ['Garanhão', 'Castrado', 'Doadora', 'Matriz', 'Potro', 'Potra', 'Outro'];
const COAT_OPTIONS = [
  'Alazã',
  'Castanha',
  'Preta',
  'Tordilha',
  'Pampa',
  'Rosilha',
  'Baía',
  'Palomina',
  'Lobuna',
  'Ruça',
  'Baia Amarilha',
  'Pêlo de Rato',
];

interface AnimalForEdit {
  id: string;
  name?: string;
  breed?: string;
  gender?: string;
  images?: string[];
  [key: string]: unknown;
}

interface EditAnimalModalProps {
  isOpen: boolean;
  onClose: () => void;
  animal: AnimalForEdit;
  onSuccess: () => void;
  uploaderId?: string;
  allowNameEdit?: boolean;
  adminUserId?: string;
}

interface ViaCEPResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

const EditAnimalModal: React.FC<EditAnimalModalProps> = ({ 
  isOpen, 
  onClose, 
  animal, 
  onSuccess,
  uploaderId,
  allowNameEdit = false,
  adminUserId
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const effectiveUploaderId = uploaderId || user?.id;
  const isInstitutional = user?.accountType === 'institutional';
  const profileCep = user?.cep || '';
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cep, setCep] = useState('');
  const [useProfileCep, setUseProfileCep] = useState(false);
  const [loadingCep, setLoadingCep] = useState(false);
  const [cepError, setCepError] = useState('');
  const [imagesState, setImagesState] = useState<{
    existingImages: string[];
    newPhotos: { id: string; file: File; previewUrl: string }[];
  }>({ existingImages: [], newPhotos: [] });
  
  const [formData, setFormData] = useState({
    name: '',
    breed: '',
    birthDate: '',
    gender: '',
    coat: '',
    category: '',
    isRegistered: true,
    cep: '',
    currentCity: '',
    currentState: '',
    description: '',
    allowMessages: true,
    autoRenew: false,
    fatherName: '',
    motherName: '',
    paternalGrandfather: '',
    paternalGrandmother: '',
    maternalGrandfather: '',
    maternalGrandmother: '',
    titles: [] as string[]
  });

  useEffect(() => {
    if (animal && isOpen) {
      const resolveField = (keys: string[]) => {
        for (const key of keys) {
          const value = animal[key];
          if (typeof value === 'string' && value.length > 0) {
            return value;
          }
        }
        return '';
      };

      setFormData({
        name: animal.name || '',
        breed: animal.breed || '',
        birthDate: animal.birth_date || '',
        gender: animal.gender || '',
        coat: animal.coat || '',
        category: animal.category || 'Outro',
        isRegistered: animal.is_registered ?? true,
        cep: animal.cep || '',
        currentCity: animal.current_city || '',
        currentState: animal.current_state || '',
        description: animal.description || '',
        allowMessages: animal.allow_messages ?? true,
        autoRenew: animal.auto_renew ?? false,
        fatherName: resolveField(['father_name', 'father']),
        motherName: resolveField(['mother_name', 'mother']),
        paternalGrandfather: resolveField(['paternal_grandfather_name', 'paternal_grandfather']),
        paternalGrandmother: resolveField(['paternal_grandmother_name', 'paternal_grandmother']),
        maternalGrandfather: resolveField(['maternal_grandfather_name', 'maternal_grandfather']),
        maternalGrandmother: resolveField(['maternal_grandmother_name', 'maternal_grandmother']),
        titles: []
      });
      setCep(animal.cep || '');
    }
  }, [animal, isOpen]);

  // Buscar dados completos do animal (incluindo descrição) ao abrir o modal
  useEffect(() => {
    if (!animal?.id || !isOpen) return;
    (async () => {
      try {
        const fullAnimal = await animalService.getAnimalById(animal.id);
        if (fullAnimal?.description) {
          setFormData(prev => ({ ...prev, description: fullAnimal.description || '' }));
        }
      } catch (error) {
        console.error('Erro ao carregar dados completos do animal:', error);
      }
    })();
  }, [animal?.id, isOpen]);

  const handleInputChange = (field: string, value: string | boolean | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Buscar CEP na API ViaCEP
  const fetchCep = async (cepValue: string) => {
    const cleanCep = cepValue.replace(/\D/g, '');

    if (cleanCep.length !== 8) {
      setCepError('CEP deve ter 8 dígitos');
      return;
    }

    setLoadingCep(true);
    setCepError('');

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data: ViaCEPResponse = await response.json();

      if (data.erro) {
        setCepError('CEP não encontrado');
        return;
      }

      // Atualizar cidade e estado
      setFormData(prev => ({
        ...prev,
        currentCity: data.localidade,
        currentState: data.uf,
        cep: cepValue
      }));

      setCepError('');
    } catch (error) {
      setCepError('Erro ao buscar CEP. Tente novamente.');
    } finally {
      setLoadingCep(false);
    }
  };

  const handleCepChange = (value: string) => {
    let formatted = value.replace(/\D/g, '');
    if (formatted.length > 5) {
      formatted = `${formatted.slice(0, 5)}-${formatted.slice(5, 8)}`;
    }
    setCep(formatted);

    const cleanCep = formatted.replace(/\D/g, '');
    if (cleanCep.length === 8) {
      fetchCep(formatted);
    }
  };

  const handleToggleProfileCep = (checked: boolean) => {
    setUseProfileCep(checked);
    setCepError('');

    if (checked && profileCep) {
      setCep(profileCep);
      fetchCep(profileCep);
    } else {
      setCep('');
      setFormData(prev => ({ ...prev, currentCity: '', currentState: '', cep: '' }));
    }
  };

  const updateDescription = (value: string) => {
    if (value.length <= 300) {
      setFormData(prev => ({ ...prev, description: value }));
    }
  };

  const handleImagesChange = useCallback(
    (state: { existingImages: string[]; newPhotos: { id: string; file: File; previewUrl: string }[] }) => {
      setImagesState(state);
    },
    []
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      console.log('🔄 Atualizando animal:', animal.id);
      console.log('📝 Dados a serem salvos:', formData);

      // Atualizar animal no banco
      await animalService.updateAnimal(animal.id, {
        ...(allowNameEdit ? { name: formData.name } : {}),
        breed: formData.breed,
        birth_date: formData.birthDate,
        gender: formData.gender as 'Macho' | 'Fêmea',
        coat: formData.coat || null,
        category: formData.category,
        is_registered: formData.isRegistered,
        current_city: formData.currentCity || null,
        current_state: formData.currentState || null,
        description: formData.description || null,
        allow_messages: formData.allowMessages,
        auto_renew: formData.autoRenew,
        father_name: formData.fatherName || null,
        mother_name: formData.motherName || null,
        paternal_grandfather_name: formData.paternalGrandfather || null,
        paternal_grandmother_name: formData.paternalGrandmother || null,
        maternal_grandfather_name: formData.maternalGrandfather || null,
        maternal_grandmother_name: formData.maternalGrandmother || null
      });

      const existingImages = imagesState.existingImages ?? [];
      const newPhotoFiles = imagesState.newPhotos.map(photo => photo.file);
      const shouldUpdateImages = newPhotoFiles.length > 0 || existingImages.length !== (animal.images?.length ?? 0);

      if (shouldUpdateImages) {
        if (!effectiveUploaderId) {
          throw new Error('Usuário não identificado para upload das fotos.');
        }

        let uploadedUrls: string[] = [];
        if (newPhotoFiles.length > 0) {
          uploadedUrls = await uploadMultiplePhotos(newPhotoFiles, effectiveUploaderId, animal.id);
        }

        const finalImages = [...existingImages, ...uploadedUrls].slice(0, 4);
        await animalService.updateAnimalImages(animal.id, finalImages);
      }

      if (adminUserId) {
        await logAdminAction({
          action: 'update_animal_admin',
          adminId: adminUserId,
          resourceType: 'animal',
          resourceId: animal.id,
          newData: {
            name: formData.name,
            breed: formData.breed,
            coat: formData.coat,
            category: formData.category
          }
        });
      }
      
      console.log('✅ Animal atualizado com sucesso!');
      
      toast({
        title: "✅ Animal atualizado!",
        description: `${formData.name} foi atualizado com sucesso.`,
      });
      
      onSuccess();
      onClose();
    } catch (error: unknown) {
      console.error('❌ Erro ao atualizar animal:', error);
      toast({
        title: "Erro ao atualizar animal",
        description: error?.message || "Tente novamente em alguns instantes.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Editar Animal</DialogTitle>
          <p className="text-sm text-gray-600">
            Atualize as informações do animal. As alterações serão refletidas imediatamente no anúncio.
          </p>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* INFORMAÇÕES BÁSICAS */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Informações Básicas</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => allowNameEdit && handleInputChange('name', e.target.value)}
                  disabled={!allowNameEdit}
                  className={allowNameEdit ? '' : 'bg-gray-100 cursor-not-allowed'}
                />
                {!allowNameEdit && (
                  <p className="text-xs text-gray-500 mt-1">🔒 O nome não pode ser alterado</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="breed">Raça *</Label>
                <Select value={formData.breed} onValueChange={(value) => handleInputChange('breed', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a raça" />
                  </SelectTrigger>
                  <SelectContent side="bottom" align="start" avoidCollisions={false}>
                    <SelectItem value="Mangalarga Marchador">Mangalarga Marchador</SelectItem>
                    <SelectItem value="Quarto de Milha">Quarto de Milha</SelectItem>
                    <SelectItem value="Puro Sangue Inglês">Puro Sangue Inglês</SelectItem>
                    <SelectItem value="Crioulo">Crioulo</SelectItem>
                    <SelectItem value="Campolina">Campolina</SelectItem>
                    <SelectItem value="Lusitano">Lusitano</SelectItem>
                    <SelectItem value="Árabe">Árabe</SelectItem>
                    <SelectItem value="Outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="birthDate">Data de Nascimento *</Label>
                <Input
                  id="birthDate"
                  type="date"
                  value={formData.birthDate}
                  onChange={(e) => handleInputChange('birthDate', e.target.value)}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="gender">Sexo *</Label>
                <Select value={formData.gender} onValueChange={(value) => handleInputChange('gender', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent side="bottom" align="start" avoidCollisions={false}>
                    <SelectItem value="Macho">Macho</SelectItem>
                    <SelectItem value="Fêmea">Fêmea</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="coat">Pelagem</Label>
                <Select value={formData.coat} onValueChange={(value) => handleInputChange('coat', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a pelagem" />
                  </SelectTrigger>
                  <SelectContent side="bottom" align="start" avoidCollisions={false}>
                    {COAT_OPTIONS.map((coat) => (
                      <SelectItem key={coat} value={coat}>
                        {coat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="category">Categoria *</Label>
              <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent side="bottom" align="start" avoidCollisions={false}>
                  {CATEGORY_OPTIONS.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Possui registro?</Label>
              <div className="flex gap-4 mt-2">
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="radio"
                    name="isRegistered"
                    checked={formData.isRegistered}
                    onChange={() => handleInputChange('isRegistered', true)}
                  />
                  Sim
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="radio"
                    name="isRegistered"
                    checked={!formData.isRegistered}
                    onChange={() => handleInputChange('isRegistered', false)}
                  />
                  Não
                </label>
              </div>
            </div>
          </div>

          {/* LOCALIZAÇÃO */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Localização</h3>

            {isInstitutional && profileCep && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-2">
                    <Building2 className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-blue-900">
                        Usar CEP do perfil institucional
                      </p>
                      <p className="text-xs text-blue-700">
                        CEP: <span className="font-mono font-semibold">{profileCep}</span>
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={useProfileCep}
                    onCheckedChange={handleToggleProfileCep}
                  />
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="cep">CEP *</Label>
              <div className="relative">
                <Input
                  id="cep"
                  placeholder="00000-000"
                  value={cep}
                  onChange={(e) => handleCepChange(e.target.value)}
                  maxLength={9}
                  className={cepError ? 'border-red-500' : ''}
                  disabled={useProfileCep || loadingCep}
                />
                {loadingCep && (
                  <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-gray-400" />
                )}
                {!loadingCep && formData.currentCity && formData.currentState && (
                  <CheckCircle2 className="absolute right-3 top-3 h-4 w-4 text-green-600" />
                )}
              </div>
              {cepError && <p className="text-sm text-red-500 mt-1">{cepError}</p>}
              {useProfileCep ? (
                <p className="text-xs text-blue-600 mt-1">
                  Usando o CEP do perfil institucional. Desmarque para informar outro.
                </p>
              ) : (
                <p className="text-xs text-gray-500 mt-1">
                  Digite o CEP e os campos abaixo serão preenchidos automaticamente
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="currentCity">Cidade *</Label>
                <Input
                  id="currentCity"
                  value={formData.currentCity}
                  readOnly
                  disabled
                  className="bg-gray-50 cursor-not-allowed"
                  placeholder="Preenchido automaticamente"
                />
                <p className="text-xs text-gray-500 mt-1">🔒 Preenchido pelo CEP</p>
              </div>
              
              <div>
                <Label htmlFor="currentState">Estado *</Label>
                <Input
                  id="currentState"
                  value={formData.currentState}
                  readOnly
                  disabled
                  maxLength={2}
                  className="bg-gray-50 cursor-not-allowed"
                  placeholder="UF"
                />
                <p className="text-xs text-gray-500 mt-1">🔒 Preenchido pelo CEP</p>
              </div>
            </div>
          </div>

          {/* GENEALOGIA */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Genealogia</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fatherName">Nome do Pai</Label>
                <Input
                  id="fatherName"
                  value={formData.fatherName}
                  onChange={(e) => handleInputChange('fatherName', e.target.value)}
                  placeholder="Nome do garanhão"
                />
              </div>
              
              <div>
                <Label htmlFor="motherName">Nome da Mãe</Label>
                <Input
                  id="motherName"
                  value={formData.motherName}
                  onChange={(e) => handleInputChange('motherName', e.target.value)}
                  placeholder="Nome da égua"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="paternalGrandfather">Avô Paterno</Label>
                <Input
                  id="paternalGrandfather"
                  value={formData.paternalGrandfather}
                  onChange={(e) => handleInputChange('paternalGrandfather', e.target.value)}
                  placeholder="Pai do pai"
                />
              </div>
              
              <div>
                <Label htmlFor="paternalGrandmother">Avó Paterna</Label>
                <Input
                  id="paternalGrandmother"
                  value={formData.paternalGrandmother}
                  onChange={(e) => handleInputChange('paternalGrandmother', e.target.value)}
                  placeholder="Mãe do pai"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="maternalGrandfather">Avô Materno</Label>
                <Input
                  id="maternalGrandfather"
                  value={formData.maternalGrandfather}
                  onChange={(e) => handleInputChange('maternalGrandfather', e.target.value)}
                  placeholder="Pai da mãe"
                />
              </div>
              
              <div>
                <Label htmlFor="maternalGrandmother">Avó Materna</Label>
                <Input
                  id="maternalGrandmother"
                  value={formData.maternalGrandmother}
                  onChange={(e) => handleInputChange('maternalGrandmother', e.target.value)}
                  placeholder="Mãe da mãe"
                />
              </div>
            </div>
          </div>

          {/* FOTOS */}
          <EditAnimalPhotosSection
            initialImages={animal.images ?? []}
            onChange={handleImagesChange}
            disabled={isSubmitting}
          />

          {/* DESCRIÇÃO */}
          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => updateDescription(e.target.value)}
              placeholder="Descreva características especiais, comportamento, aptidões..."
              rows={4}
              maxLength={300}
            />
            <div className="flex justify-end">
              <span className={`text-xs ${formData.description.length > 280 ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                {formData.description.length}/300 caracteres
              </span>
            </div>
          </div>

          {/* OPÇÕES */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="allowMessages"
                checked={formData.allowMessages}
                onCheckedChange={(checked) => handleInputChange('allowMessages', !!checked)}
              />
              <Label htmlFor="allowMessages" className="text-sm cursor-pointer">
                Permitir mensagens de interessados
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="autoRenew"
                checked={formData.autoRenew}
                onCheckedChange={(checked) => handleInputChange('autoRenew', !!checked)}
              />
              <Label htmlFor="autoRenew" className="text-sm cursor-pointer">
                Renovar automaticamente ao expirar
              </Label>
            </div>
          </div>

          {/* BOTÕES */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar Alterações'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditAnimalModal;
