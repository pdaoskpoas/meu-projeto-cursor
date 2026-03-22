import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  MapPin, 
  Upload, 
  Save, 
  Building2, 
  User, 
  Calendar, 
  Info,
  AlertCircle,
  CheckCircle,
  Loader2,
  Instagram
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useProfileUpdate } from '@/hooks/useProfileUpdate';
import { UF_TO_ESTADO } from '@/services/cepService';

interface FormData {
  country: string;
  state: string;
  city: string;
  avatar_url: string;
  founded_year: string;
  owner_name: string;
  bio: string;
  instagram: string;
  // Novos campos para conversão institucional
  wantsToConvert: boolean;
  property_type: 'haras' | 'fazenda' | 'cte' | 'central-reproducao' | '';
  property_name: string;
}

const UpdateProfilePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { loading, uploading, loadCurrentProfile, updateProfile, uploadAvatar } = useProfileUpdate();

  // Estados do formulário
  const [formData, setFormData] = useState<FormData>({
    country: 'Brasil',
    state: '',
    city: '',
    avatar_url: '',
    founded_year: '',
    owner_name: '',
    bio: '',
    instagram: '',
    wantsToConvert: false,
    property_type: '',
    property_name: '',
  });

  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const isInstitutional = user?.accountType === 'institutional';
  
  // Verificar se tem plano ativo (não free)
  const hasActivePlan = user?.plan && user.plan !== 'free' && user?.hasActivePlan;

  // Labels dinâmicas conforme tipo de propriedade
  const getFoundedLabel = () => {
    if (!user?.propertyType) return 'Fundado em (Ano)';
    
    switch (user.propertyType) {
      case 'fazenda':
      case 'central-reproducao':
        return 'Fundada em (Ano)';
      default:
        return 'Fundado em (Ano)';
    }
  };

  const getBioLabel = () => {
    if (!user?.propertyType) return 'Sobre a Instituição';
    
    switch (user.propertyType) {
      case 'haras':
        return 'Sobre o Haras';
      case 'fazenda':
        return 'Sobre a Fazenda';
      case 'cte':
        return 'Sobre o CTE';
      case 'central-reproducao':
        return 'Sobre a Central de Reprodução';
      default:
        return 'Sobre a Instituição';
    }
  };

  // Carregar dados existentes
  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.id) return;
      
      setIsInitialLoad(true);
      const data = await loadCurrentProfile();
      
      if (data) {
        setFormData({
          country: data.country || 'Brasil',
          state: data.state || '',
          city: data.city || '',
          avatar_url: data.avatar_url || '',
          founded_year: data.founded_year || '',
          owner_name: data.owner_name || '',
          bio: data.bio || '',
          instagram: data.instagram || '',
          wantsToConvert: false,
          property_type: user?.propertyType || '',
          property_name: user?.propertyName || '',
        });
      }
      setIsInitialLoad(false);
    };

    loadProfile();
  }, [user?.id, user?.propertyName, user?.propertyType, loadCurrentProfile]);

  // Validações em tempo real
  const validateField = (field: keyof FormData, value: string) => {
    const newErrors = { ...errors };

    switch (field) {
      case 'founded_year':
        if (value && isInstitutional) {
          const year = parseInt(value);
          const currentYear = new Date().getFullYear();
          if (isNaN(year) || year < 1800 || year > currentYear) {
            newErrors.founded_year = `Ano deve estar entre 1800 e ${currentYear}`;
          } else {
            delete newErrors.founded_year;
          }
        }
        break;
      case 'bio':
        if (value && isInstitutional && value.length > 500) {
          newErrors.bio = 'Biografia deve ter no máximo 500 caracteres';
        } else {
          delete newErrors.bio;
        }
        break;
    }

    setErrors(newErrors);
  };

  // Atualizar campo do formulário
  const updateFormField = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      // Se mudou o estado, limpar a cidade
      if (field === 'state') {
        newData.city = '';
      }
      
      return newData;
    });

    // Validar campo se for string
    if (typeof value === 'string') {
      validateField(field, value);
    }
  };

  // Upload de imagem
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const publicUrl = await uploadAvatar(file);
    if (publicUrl) {
      updateFormField('avatar_url', publicUrl);
      
      // Salvar automaticamente no banco e recarregar o perfil
      const success = await updateProfile(
        {
          country: formData.country || 'Brasil',
          state: formData.state,
          city: formData.city,
          avatar_url: publicUrl,
          founded_year: formData.founded_year,
          owner_name: formData.owner_name,
          bio: formData.bio,
          instagram: formData.instagram,
        },
        {}
      );
      
      if (success) {
        // Recarregar a página para atualizar o AuthContext com o novo avatar
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    }
  };

  // Validar formulário completo
  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};

    // Validação para conversão institucional
    if (formData.wantsToConvert && !isInstitutional) {
      if (!formData.property_type) {
        newErrors.property_type = 'Selecione o tipo de instituição';
      }
      if (!formData.property_name || formData.property_name.trim().length < 3) {
        newErrors.property_name = 'Nome da propriedade deve ter pelo menos 3 caracteres';
      }
    }

    // Validação de campos institucionais (se for institucional ou estiver convertendo)
    if (isInstitutional || formData.wantsToConvert) {
      if (formData.founded_year) {
        const year = parseInt(formData.founded_year);
        const currentYear = new Date().getFullYear();
        if (isNaN(year) || year < 1800 || year > currentYear) {
          newErrors.founded_year = `Ano deve estar entre 1800 e ${currentYear}`;
        }
      }

      if (formData.bio && formData.bio.length > 500) {
        newErrors.bio = 'Biografia deve ter no máximo 500 caracteres';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Salvar perfil
  const handleSave = async () => {
    if (!validateForm()) return;

    // Preparar dados do perfil
    const profileData = {
      country: formData.country,
      state: formData.state,
      city: formData.city,
      avatar_url: formData.avatar_url,
      instagram: formData.instagram.replace('@', ''), // Remove @ se o usuário digitou
      // Campos institucionais (somente se tiver plano ativo)
      founded_year: hasActivePlan ? formData.founded_year : '',
      owner_name: hasActivePlan ? formData.owner_name : '',
      bio: hasActivePlan ? formData.bio : '',
    };

    // Se estiver convertendo para institucional, incluir dados de conversão
    let conversionData = undefined;
    if (formData.wantsToConvert && !isInstitutional) {
      conversionData = {
        property_type: formData.property_type,
        property_name: formData.property_name,
      };
    }

    const success = await updateProfile(profileData, { 
      convertToInstitutional: conversionData,
    });

    if (success) {
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    }
  };

  if (isInitialLoad) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-slate-600">Carregando perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/dashboard')}
            className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              {isInstitutional ? 'Atualizar Perfil Institucional' : 'Atualizar Meu Perfil'}
            </h1>
            <p className="text-slate-600 mt-1">
              Complete seu perfil para aparecer no mapa da comunidade equestre
            </p>
          </div>
        </div>

        {/* Avatar/Logo Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              {isInstitutional ? (
                <Building2 className="h-6 w-6 text-blue-600" />
              ) : (
                <User className="h-6 w-6 text-blue-600" />
              )}
              {isInstitutional ? 'Logo da Instituição' : 'Foto do Perfil'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-6">
              {/* Preview */}
              <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center overflow-hidden shrink-0">
                {formData.avatar_url ? (
                  <img 
                    src={formData.avatar_url} 
                    alt="Avatar" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-white text-3xl font-bold">
                    {user?.name?.charAt(0).toUpperCase() || '?'}
                  </span>
                )}
              </div>

              {/* Upload Area */}
              <div className="flex-1">
                <Label htmlFor="avatar-upload">
                  <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 hover:border-blue-500 transition-colors cursor-pointer">
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={uploading}
                    />
                    <div className="text-center">
                      {uploading ? (
                        <Loader2 className="h-8 w-8 text-blue-500 mx-auto mb-2 animate-spin" />
                      ) : (
                        <Upload className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                      )}
                      <p className="text-sm font-medium text-slate-700">
                        {uploading ? 'Enviando...' : 'Clique para enviar uma imagem'}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        PNG, JPG ou JPEG (máx. 5MB)
                      </p>
                    </div>
                  </div>
                </Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Conversão para Conta Institucional */}
        {!isInstitutional && (
          <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Building2 className="h-6 w-6 text-blue-600" />
                Converter para Perfil Institucional
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Conta Institucional:</strong> Ideal para Haras, Fazendas, CTEs e Centrais de Reprodução. 
                  Tenha um perfil profissional completo com informações sobre sua instituição.
                </AlertDescription>
              </Alert>

              <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-blue-200">
                <div className="flex-1">
                  <Label htmlFor="convert-institutional" className="text-base font-semibold cursor-pointer">
                    Quero converter minha conta para institucional
                  </Label>
                  <p className="text-sm text-slate-600 mt-1">
                    Você poderá adicionar informações sobre sua propriedade
                  </p>
                </div>
                <Switch
                  id="convert-institutional"
                  checked={formData.wantsToConvert}
                  onCheckedChange={(checked) => updateFormField('wantsToConvert', checked)}
                />
              </div>

              {formData.wantsToConvert && (
                <div className="space-y-4 p-4 bg-white rounded-xl border border-blue-200">
                  <div className="space-y-2">
                    <Label>
                      Tipo de Instituição <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.property_type}
                      onValueChange={(value) => updateFormField('property_type', value as FormData['property_type'])}
                    >
                      <SelectTrigger className={errors.property_type ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent side="bottom" align="start" avoidCollisions={false}>
                        <SelectItem value="haras">Haras</SelectItem>
                        <SelectItem value="fazenda">Fazenda</SelectItem>
                        <SelectItem value="cte">CTE (Centro de Treinamento Equestre)</SelectItem>
                        <SelectItem value="central-reproducao">Central de Reprodução</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.property_type && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.property_type}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>
                      Nome da Propriedade <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      placeholder="Ex: Haras Santa Maria, Fazenda Boa Vista..."
                      value={formData.property_name}
                      onChange={(e) => updateFormField('property_name', e.target.value)}
                      className={errors.property_name ? 'border-red-500' : ''}
                    />
                    {errors.property_name && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.property_name}
                      </p>
                    )}
                  </div>

                  <Alert className="bg-green-50 border-green-200">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription>
                      <strong>Importante:</strong> Ao converter, você terá acesso a campos adicionais como 
                      ano de fundação, proprietário e biografia da instituição.
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Localização Capturada pelo CEP */}
        {(formData.state || formData.city) && (
          <Card className="bg-slate-50 border-slate-200">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-900">Localização Identificada</p>
                  <p className="text-sm text-slate-600 mt-1">
                    {formData.city && formData.state ? (
                      `${formData.city} - ${formData.state}, ${formData.country}`
                    ) : formData.state ? (
                      `${formData.state}, ${formData.country}`
                    ) : (
                      formData.country
                    )}
                  </p>
                  <p className="text-xs text-slate-500 mt-2">
                    ✓ Localização capturada automaticamente através do CEP
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Institutional Info Section */}
        {(isInstitutional || formData.wantsToConvert) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Building2 className="h-6 w-6 text-purple-600" />
                Informações da Instituição
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Aviso para usuários Free */}
              {!hasActivePlan && (
                <Alert className="bg-amber-50 border-amber-300">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <p className="font-semibold text-amber-800">
                        Campos Bloqueados - Plano Free
                      </p>
                      <p className="text-sm text-amber-700">
                        Os campos abaixo (Fundado em, Proprietário, Sobre a Instituição e Instagram) 
                        estão disponíveis apenas para usuários com plano ativo.
                      </p>
                      <Button
                        variant="default"
                        size="sm"
                        className="mt-2 bg-amber-600 hover:bg-amber-700"
                        onClick={() => window.open('/planos', '_blank')}
                      >
                        Ver Planos Disponíveis →
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {getFoundedLabel()}
                    {hasActivePlan && <span className="text-xs text-green-600">(Disponível)</span>}
                    {!hasActivePlan && <span className="text-xs text-amber-600">(Requer Plano)</span>}
                  </Label>
                  <Input
                    type="number"
                    placeholder={hasActivePlan ? "Ex: 2015" : "Requer plano ativo"}
                    value={formData.founded_year}
                    onChange={(e) => updateFormField('founded_year', e.target.value)}
                    min="1800"
                    max={new Date().getFullYear()}
                    className={errors.founded_year ? 'border-red-500' : ''}
                    disabled={!hasActivePlan}
                  />
                  {errors.founded_year && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.founded_year}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Proprietário/Responsável
                    {hasActivePlan && <span className="text-xs text-green-600">(Disponível)</span>}
                    {!hasActivePlan && <span className="text-xs text-amber-600">(Requer Plano)</span>}
                  </Label>
                  <Input
                    placeholder={hasActivePlan ? "Nome do proprietário" : "Requer plano ativo"}
                    value={formData.owner_name}
                    onChange={(e) => updateFormField('owner_name', e.target.value)}
                    disabled={!hasActivePlan}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center justify-between">
                  <span>
                    {getBioLabel()}
                    {hasActivePlan && <span className="text-xs text-green-600 ml-2">(Disponível)</span>}
                    {!hasActivePlan && <span className="text-xs text-amber-600 ml-2">(Requer Plano)</span>}
                  </span>
                  {hasActivePlan && (
                    <span className="text-sm text-slate-500">
                      {formData.bio.length}/500 caracteres
                    </span>
                  )}
                </Label>
                <Textarea
                  placeholder={hasActivePlan ? "Descreva sua instituição, especialidades, raças trabalhadas, história..." : "Requer plano ativo"}
                  value={formData.bio}
                  onChange={(e) => updateFormField('bio', e.target.value)}
                  maxLength={500}
                  rows={6}
                  className={`resize-none ${errors.bio ? 'border-red-500' : ''}`}
                  disabled={!hasActivePlan}
                />
                {errors.bio && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.bio}
                  </p>
                )}
                {hasActivePlan && (
                  <p className="text-xs text-slate-500">
                    Exemplo: "Haras especializado em Mangalarga Marchador de marcha picada há 10 anos. 
                    Trabalhamos com genética de elite e foco em animais de competição..."
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instagram Section */}
        {(isInstitutional || formData.wantsToConvert) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Instagram className="h-6 w-6 text-pink-600" />
                Redes Sociais
                {hasActivePlan && <Badge className="ml-2 bg-green-100 text-green-700">Disponível</Badge>}
                {!hasActivePlan && <Badge className="ml-2 bg-amber-100 text-amber-700">Requer Plano</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Aviso para usuários Free */}
              {!hasActivePlan && (
                <Alert className="bg-amber-50 border-amber-300">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <p className="font-semibold text-amber-800">
                        Link do Instagram - Requer Plano Ativo
                      </p>
                      <p className="text-sm text-amber-700">
                        O link do Instagram só ficará visível no seu perfil público se você tiver 
                        um plano ativo (Iniciante, Pro, Elite ou VIP).
                      </p>
                      <Button
                        variant="default"
                        size="sm"
                        className="mt-2 bg-amber-600 hover:bg-amber-700"
                        onClick={() => window.open('/planos', '_blank')}
                      >
                        Ver Planos Disponíveis →
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label>Instagram</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium">
                    @
                  </span>
                  <Input
                    className="pl-8"
                    placeholder={hasActivePlan ? "seu_instagram" : "Requer plano ativo"}
                    value={formData.instagram}
                    onChange={(e) => updateFormField('instagram', e.target.value.replace('@', ''))}
                    disabled={!hasActivePlan}
                  />
                </div>
                {hasActivePlan && (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Link do Instagram:</strong> Aparecerá no seu perfil público e ficará clicável para os visitantes.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={() => navigate('/dashboard')}
            className="flex-1"
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading || uploading || Object.keys(errors).length > 0}
            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {loading ? 'Salvando...' : 'Salvar Perfil'}
          </Button>
        </div>

        {/* Success/Error Messages */}
        {Object.keys(errors).length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Por favor, corrija os erros acima antes de salvar.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
};

export default UpdateProfilePage;