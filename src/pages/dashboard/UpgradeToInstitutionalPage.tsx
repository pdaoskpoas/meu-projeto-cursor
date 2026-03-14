import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardSidebar } from '@/components/DashboardSidebar';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Crown, Building2, MapPin, Users, BarChart3, Star, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

const brazilianStates = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 
  'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

const institutionalBenefits = [
  {
    icon: Building2,
    title: 'Perfil Profissional Completo',
    description: 'Página dedicada com história, localização e contatos'
  },
  {
    icon: MapPin,
    title: 'Visibilidade no Mapa',
    description: 'Apareça no mapa para clientes próximos'
  },
  {
    icon: Users,
    title: 'Divulgação Institucional',
    description: 'Promova seu negócio e construa sua marca'
  },
  {
    icon: BarChart3,
    title: 'Estatísticas Avançadas',
    description: 'Acompanhe visualizações e interesse nos seus animais'
  },
  {
    icon: Star,
    title: 'Destaque Premium',
    description: 'Seus animais ganham mais visibilidade'
  }
];

const UpgradeToInstitutionalPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    institutionName: '',
    state: '',
    city: '',
    foundedYear: '',
    instagram: '',
    about: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate API call to upgrade account
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    toast.success('Parabéns! Sua conta foi migrada para o plano institucional!');
    setIsLoading(false);
    
    // Redirect to dashboard after successful upgrade
    setTimeout(() => {
      navigate('/dashboard');
    }, 1500);
  };

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
                <div>
                  <h1 className="text-xl font-semibold text-blue-dark">Migrar para Institucional</h1>
                  <p className="text-sm text-gray-medium">Transforme seu perfil em uma vitrine profissional</p>
                </div>
              </div>
            </header>

            {/* Content */}
            <div className="flex-1 p-6">
              <div className="max-w-4xl mx-auto space-y-8">
                {/* Header */}
                <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center mx-auto">
          <Crown className="h-8 w-8 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Migrar para Plano Institucional</h1>
          <p className="text-lg text-muted-foreground mt-2">
            Transforme seu perfil pessoal em uma vitrine profissional
          </p>
        </div>
        <Badge variant="secondary" className="text-sm font-medium">
          Upgrade Gratuito
        </Badge>
      </div>

      {/* Benefits Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {institutionalBenefits.map((benefit, index) => (
          <Card key={index} className="text-center p-4">
            <CardContent className="space-y-3 pt-6">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto">
                <benefit.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground">{benefit.title}</h3>
              <p className="text-sm text-muted-foreground">{benefit.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Complete as Informações da Sua Instituição</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Nome da Instituição */}
            <div className="space-y-2">
              <Label htmlFor="institutionName">Nome da Instituição *</Label>
              <Input
                id="institutionName"
                value={formData.institutionName}
                onChange={(e) => handleInputChange('institutionName', e.target.value)}
                placeholder="Ex: Haras Vale Verde, Fazenda Santa Maria, CTE Elite"
                required
              />
            </div>

            {/* Localização */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="state">Estado *</Label>
                <Select value={formData.state} onValueChange={(value) => handleInputChange('state', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o estado" />
                  </SelectTrigger>
                  <SelectContent side="bottom" align="start" avoidCollisions={false}>
                    {brazilianStates.map((state) => (
                      <SelectItem key={state} value={state}>
                        {state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">Cidade *</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  placeholder="Ex: São Paulo"
                  required
                />
              </div>
            </div>

            {/* Detalhes Adicionais */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="foundedYear">Fundado em</Label>
                <Input
                  id="foundedYear"
                  type="number"
                  value={formData.foundedYear}
                  onChange={(e) => handleInputChange('foundedYear', e.target.value)}
                  placeholder="Ex: 1985"
                  min="1800"
                  max={new Date().getFullYear()}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="instagram">Instagram</Label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-muted-foreground">@</span>
                  <Input
                    id="instagram"
                    value={formData.instagram}
                    onChange={(e) => handleInputChange('instagram', e.target.value)}
                    placeholder="nomedoharas"
                    className="pl-8"
                  />
                </div>
              </div>
            </div>

            {/* Sobre a Instituição */}
            <div className="space-y-2">
              <Label htmlFor="about">Sobre a Instituição</Label>
              <Textarea
                id="about"
                value={formData.about}
                onChange={(e) => handleInputChange('about', e.target.value)}
                placeholder="Especializado na criação de Mangalarga Marchador de alta linhagem, com foco em preservação genética e excelência na marcha."
                rows={4}
                className="resize-none"
              />
              <p className="text-sm text-muted-foreground">
                Descreva a história, especialização e diferenciais da sua instituição.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex flex-col sm:flex-row gap-4 justify-end pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/dashboard')}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading} className="min-w-48">
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
                Migrando Conta...
              </>
            ) : (
              <>
                <Crown className="h-4 w-4 mr-2" />
                Migrar para Institucional
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </form>
              </div>
            </div>
          </main>
        </div>
      </SidebarProvider>
    </ProtectedRoute>
  );
};

export default UpgradeToInstitutionalPage;