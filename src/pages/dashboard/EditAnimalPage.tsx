import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, X, Calendar, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardSidebar } from '@/components/DashboardSidebar';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { formatAge, isValidBirthDate } from '@/utils/dateUtils';
import { HORSE_BREEDS } from '@/constants/breeds';
import { animalService } from '@/services/animalService';

const EditAnimalPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: '',
    breed: '',
    birthDate: '',
    gender: '',
    color: '',
    currentCity: '',
    currentState: '',
    father: '',
    mother: '',
    titles: '',
    description: '',
    allowMessages: false
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingAnimal, setIsLoadingAnimal] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const loadAnimal = async () => {
      if (!id) {
        setLoadError('Animal nao informado.');
        setIsLoadingAnimal(false);
        return;
      }

      try {
        setIsLoadingAnimal(true);
        setLoadError(null);
        const animal = await animalService.getAnimalById(id);

        if (!animal) {
          setLoadError('Animal nao encontrado.');
          return;
        }

        setFormData({
          name: animal.name,
          breed: animal.breed,
          birthDate: animal.birth_date || '',
          gender: animal.gender,
          color: animal.coat || '',
          currentCity: animal.current_city || '',
          currentState: animal.current_state || '',
          father: animal.father_name || '',
          mother: animal.mother_name || '',
          titles: (animal.titles || []).join(', '),
          description: animal.description || '',
          allowMessages: animal.allow_messages !== false
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Erro ao carregar animal.';
        setLoadError(message);
      } finally {
        setIsLoadingAnimal(false);
      }
    };

    void loadAnimal();
  }, [id]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.breed || !formData.birthDate || !formData.gender || !formData.color || !formData.currentCity || !formData.currentState) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      if (!id) {
        throw new Error('Animal nao informado.');
      }

      await animalService.updateAnimal(id, {
        name: formData.name.trim(),
        breed: formData.breed,
        birth_date: formData.birthDate,
        gender: formData.gender as 'Macho' | 'Fêmea',
        coat: formData.color,
        current_city: formData.currentCity.trim(),
        current_state: formData.currentState,
        father_name: formData.father.trim() || null,
        mother_name: formData.mother.trim() || null,
        titles: formData.titles
          .split(',')
          .map((title) => title.trim())
          .filter(Boolean),
        description: formData.description.trim() || null,
        allow_messages: formData.allowMessages
      });
      
      toast({
        title: "Equino atualizado!",
        description: `${formData.name} foi atualizado com sucesso.`
      });
      
      navigate('/dashboard/animals');
    } catch (error) {
      toast({
        title: "Erro na atualização",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Usar lista de raças do arquivo de constantes
  const breeds = HORSE_BREEDS;

  const colors = [
    'Alazão',
    'Castanho',
    'Tordilho',
    'Baio',
    'Preto',
    'Pampa',
    'Rosilho',
    'Isabela'
  ];

  const brazilianStates = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 
    'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
  ];

  return (
    <ProtectedRoute>
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <DashboardSidebar />
          
          <main className="flex-1 flex flex-col">
            {/* Header */}
            <header className="h-16 bg-card border-b border-border flex items-center px-6">
              <div className="flex items-center space-x-4">
                <SidebarTrigger />
                <Link to="/dashboard/animals" className="flex items-center space-x-2 text-gray-medium hover:text-primary transition-colors">
                  <ArrowLeft className="h-4 w-4" />
                  <span>Voltar</span>
                </Link>
                <div>
                  <h1 className="text-xl font-semibold text-blue-dark">Editar Equino</h1>
                  <p className="text-sm text-gray-medium">Atualize as informações do equino</p>
                </div>
              </div>
            </header>

            {/* Content */}
            <div className="flex-1 p-6">
              <div className="max-w-4xl mx-auto space-y-6">
                {isLoadingAnimal ? (
                  <Card className="card-professional p-6">
                    <div className="flex items-center gap-3 text-slate-500">
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      <span>Carregando dados do equino...</span>
                    </div>
                  </Card>
                ) : loadError ? (
                  <Card className="card-professional p-6">
                    <div className="space-y-4">
                      <p className="text-sm text-red-600">{loadError}</p>
                      <Button variant="outline" onClick={() => navigate('/dashboard/animals')}>
                        Voltar para meus animais
                      </Button>
                    </div>
                  </Card>
                ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Basic Information */}
                  <Card className="card-professional p-6">
                    <h3 className="text-lg font-semibold text-blue-dark mb-6 border-b border-border pb-2">
                      Informações Básicas
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-blue-dark">Nome do Equino *</label>
                        <Input
                          placeholder="Nome do equino"
                          value={formData.name}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-blue-dark">Raça *</label>
                        <select
                          value={formData.breed}
                          onChange={(e) => handleInputChange('breed', e.target.value)}
                          className="w-full px-3 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          required
                        >
                          <option value="">Selecione a raça</option>
                          {breeds.map(breed => (
                            <option key={breed} value={breed}>{breed}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-blue-dark">Data de Nascimento *</label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                          <Input
                            type="date"
                            value={formData.birthDate}
                            onChange={(e) => handleInputChange('birthDate', e.target.value)}
                            className="pl-10"
                            max={new Date().toISOString().split('T')[0]}
                            required
                          />
                        </div>
                        {formData.birthDate && isValidBirthDate(formData.birthDate) && (
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-slate-500">Idade:</span>
                            <span className="font-semibold text-blue-600">
                              {formatAge(formData.birthDate)}
                            </span>
                          </div>
                        )}
                        {formData.birthDate && !isValidBirthDate(formData.birthDate) && (
                          <p className="text-xs text-red-500">
                            Data de nascimento inválida
                          </p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-blue-dark">Sexo *</label>
                        <select
                          value={formData.gender}
                          onChange={(e) => handleInputChange('gender', e.target.value)}
                          className="w-full px-3 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          required
                        >
                          <option value="">Selecione o sexo</option>
                          <option value="Macho">Macho</option>
                          <option value="Fêmea">Fêmea</option>
                        </select>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-blue-dark">Pelagem *</label>
                        <select
                          value={formData.color}
                          onChange={(e) => handleInputChange('color', e.target.value)}
                          className="w-full px-3 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          required
                        >
                          <option value="">Selecione a pelagem</option>
                          {colors.map(color => (
                            <option key={color} value={color}>{color}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-blue-dark">Cidade Atual *</label>
                        <Input
                          placeholder="Cidade onde está o equino"
                          value={formData.currentCity}
                          onChange={(e) => handleInputChange('currentCity', e.target.value)}
                          required
                        />
                        <p className="text-xs text-gray-medium">Para coberturas e localizações</p>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-blue-dark">Estado Atual *</label>
                        <select
                          value={formData.currentState}
                          onChange={(e) => handleInputChange('currentState', e.target.value)}
                          className="w-full px-3 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          required
                        >
                          <option value="">Selecione o estado</option>
                          {brazilianStates.map(state => (
                            <option key={state} value={state}>{state}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </Card>

                  {/* Genealogy */}
                  <Card className="card-professional p-6">
                    <h3 className="text-lg font-semibold text-blue-dark mb-6 border-b border-border pb-2">
                      Genealogia
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-blue-dark">Pai</label>
                        <Input
                          placeholder="Nome do pai"
                          value={formData.father}
                          onChange={(e) => handleInputChange('father', e.target.value)}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-blue-dark">Mãe</label>
                        <Input
                          placeholder="Nome da mãe"
                          value={formData.mother}
                          onChange={(e) => handleInputChange('mother', e.target.value)}
                        />
                      </div>
                    </div>
                  </Card>

                  {/* Additional Information */}
                  <Card className="card-professional p-6">
                    <h3 className="text-lg font-semibold text-blue-dark mb-6 border-b border-border pb-2">
                      Informações Adicionais
                    </h3>
                    
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-blue-dark">Títulos e Premiações</label>
                        <Input
                          placeholder="Ex: Campeão Nacional, Grande Prêmio..."
                          value={formData.titles}
                          onChange={(e) => handleInputChange('titles', e.target.value)}
                        />
                        <p className="text-xs text-gray-medium">Separe múltiplos títulos por vírgula</p>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-blue-dark">Descrição</label>
                        <Textarea
                          placeholder="Descreva características especiais do equino..."
                          value={formData.description}
                          onChange={(e) => handleInputChange('description', e.target.value)}
                          rows={4}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={formData.allowMessages}
                            onChange={(e) => handleInputChange('allowMessages', e.target.checked)}
                            className="rounded border-gray-300 text-primary focus:ring-primary"
                          />
                          <span className="text-sm font-medium text-blue-dark">Quero receber mensagens de outros usuários neste anúncio</span>
                        </label>
                        <p className="text-xs text-gray-medium">
                          Ao ativar esta opção, outros usuários logados poderão enviar mensagens sobre este anúncio
                        </p>
                      </div>
                    </div>
                  </Card>

                  {/* Submit Actions */}
                  <div className="flex flex-col sm:flex-row gap-4 justify-end">
                    <Link to="/dashboard/animals">
                      <Button type="button" variant="outline" className="w-full sm:w-auto">
                        <X className="h-4 w-4 mr-2" />
                        Cancelar
                      </Button>
                    </Link>
                    <Button type="submit" className="btn-primary w-full sm:w-auto" disabled={isSubmitting}>
                      <Save className="h-4 w-4 mr-2" />
                      {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
                    </Button>
                  </div>
                </form>
                )}
              </div>
            </div>
          </main>
        </div>
      </SidebarProvider>
    </ProtectedRoute>
  );
};

export default EditAnimalPage;