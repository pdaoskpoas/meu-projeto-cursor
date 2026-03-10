// Componente AdminPlans REFATORADO - usa dados REAIS do Supabase
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Plus, Edit, Trash2, MoreHorizontal, CreditCard, Check, Loader2 } from 'lucide-react';
import { useAdminPlans, Plan, PlanInsert } from '@/hooks/admin/useAdminPlans';
import { useToast } from '@/hooks/use-toast';

export function AdminPlans() {
  const { plans, isLoading, createPlan, updatePlan, deletePlan, togglePlanStatus } = useAdminPlans();
  const [isCreating, setIsCreating] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState<Partial<PlanInsert>>({
    name: '',
    display_name: '',
    description: '',
    price: 0,
    duration: 1,
    features: [],
    max_animals: undefined,
    max_events: undefined,
    available_boosts: 0,
    is_active: true,
    is_featured: false,
    display_order: 999,
  });

  const [newFeature, setNewFeature] = useState('');

  const resetForm = () => {
    setFormData({
      name: '',
      display_name: '',
      description: '',
      price: 0,
      duration: 1,
      features: [],
      max_animals: undefined,
      max_events: undefined,
      available_boosts: 0,
      is_active: true,
      is_featured: false,
      display_order: 999,
    });
    setNewFeature('');
    setIsCreating(false);
    setEditingPlan(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingPlan) {
        // Editar plano existente
        await updatePlan(editingPlan.id, {
          display_name: formData.display_name,
          description: formData.description,
          price: formData.price,
          duration: formData.duration,
          features: formData.features,
          max_animals: formData.max_animals,
          max_events: formData.max_events,
          available_boosts: formData.available_boosts,
          is_active: formData.is_active,
          is_featured: formData.is_featured,
          display_order: formData.display_order,
        });
        
        toast({
          title: "Plano atualizado",
          description: `O plano ${formData.display_name} foi atualizado com sucesso.`,
        });
      } else {
        // Criar novo plano
        if (!formData.name || !formData.display_name) {
          toast({
            title: "Erro",
            description: "Nome e nome de exibição são obrigatórios.",
            variant: "destructive",
          });
          return;
        }

        await createPlan(formData as PlanInsert);
        
        toast({
          title: "Plano criado",
          description: `O plano ${formData.display_name} foi criado com sucesso.`,
        });
      }

      resetForm();
    } catch (error: unknown) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível salvar o plano.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (plan: Plan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      display_name: plan.display_name,
      description: plan.description,
      price: plan.price,
      duration: plan.duration,
      features: [...plan.features],
      max_animals: plan.max_animals,
      max_events: plan.max_events,
      available_boosts: plan.available_boosts,
      is_active: plan.is_active,
      is_featured: plan.is_featured,
      display_order: plan.display_order,
    });
    setIsCreating(true);
  };

  const handleDelete = async (planId: string, planName: string) => {
    if (!confirm(`Tem certeza que deseja excluir o plano "${planName}"?`)) {
      return;
    }

    try {
      await deletePlan(planId);
      toast({
        title: "Plano removido",
        description: "O plano foi removido com sucesso.",
        variant: "destructive",
      });
    } catch (error: unknown) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível remover o plano.",
        variant: "destructive",
      });
    }
  };

  const handleToggleStatus = async (planId: string) => {
    try {
      await togglePlanStatus(planId);
      toast({
        title: "Status alterado",
        description: "O status do plano foi alterado com sucesso.",
      });
    } catch (error: unknown) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível alterar o status.",
        variant: "destructive",
      });
    }
  };

  const addFeature = () => {
    if (newFeature.trim()) {
      setFormData({
        ...formData,
        features: [...(formData.features || []), newFeature.trim()]
      });
      setNewFeature('');
    }
  };

  const removeFeature = (index: number) => {
    setFormData({
      ...formData,
      features: (formData.features || []).filter((_, i) => i !== index)
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">Carregando planos...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Gerenciamento de Planos</h2>
          <p className="text-muted-foreground">
            Crie e gerencie os planos de assinatura da plataforma
          </p>
        </div>
        <Button 
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Novo Plano
        </Button>
      </div>

      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingPlan ? 'Editar Plano' : 'Criar Novo Plano'}
            </CardTitle>
            <CardDescription>
              Configure os detalhes do plano de assinatura
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Interno (ID)</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Ex: premium"
                    disabled={!!editingPlan}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Identificador único (não pode ser alterado após criação)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="display_name">Nome de Exibição</Label>
                  <Input
                    id="display_name"
                    value={formData.display_name}
                    onChange={(e) => setFormData({...formData, display_name: e.target.value})}
                    placeholder="Ex: Plano Premium"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Descrição do plano..."
                  rows={2}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Preço (R$)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value) || 0})}
                    placeholder="0.00"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration">Duração (meses)</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="0"
                    value={formData.duration}
                    onChange={(e) => setFormData({...formData, duration: parseInt(e.target.value) || 0})}
                    placeholder="0 para ilimitado"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="available_boosts">Boosts Grátis</Label>
                  <Input
                    id="available_boosts"
                    type="number"
                    min="0"
                    value={formData.available_boosts}
                    onChange={(e) => setFormData({...formData, available_boosts: parseInt(e.target.value) || 0})}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="max_animals">Máx. Animais</Label>
                  <Input
                    id="max_animals"
                    type="number"
                    min="0"
                    value={formData.max_animals || ''}
                    onChange={(e) => setFormData({...formData, max_animals: e.target.value ? parseInt(e.target.value) : undefined})}
                    placeholder="Vazio = ilimitado"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max_events">Máx. Eventos</Label>
                  <Input
                    id="max_events"
                    type="number"
                    min="0"
                    value={formData.max_events || ''}
                    onChange={(e) => setFormData({...formData, max_events: e.target.value ? parseInt(e.target.value) : undefined})}
                    placeholder="Vazio = ilimitado"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="display_order">Ordem Exibição</Label>
                  <Input
                    id="display_order"
                    type="number"
                    min="0"
                    value={formData.display_order}
                    onChange={(e) => setFormData({...formData, display_order: parseInt(e.target.value) || 0})}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Recursos do Plano</Label>
                <div className="flex gap-2">
                  <Input
                    value={newFeature}
                    onChange={(e) => setNewFeature(e.target.value)}
                    placeholder="Digite um recurso do plano"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                  />
                  <Button type="button" onClick={addFeature} variant="outline">
                    Adicionar
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {(formData.features || []).map((feature, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-2">
                      {feature}
                      <button
                        type="button"
                        onClick={() => removeFeature(index)}
                        className="ml-2 text-xs hover:text-red-500"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({...formData, is_active: checked})}
                  />
                  <Label htmlFor="active">Plano ativo</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="featured"
                    checked={formData.is_featured}
                    onCheckedChange={(checked) => setFormData({...formData, is_featured: checked})}
                  />
                  <Label htmlFor="featured">Destacar plano</Label>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={resetForm}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingPlan ? 'Atualizar' : 'Criar Plano'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <Card key={plan.id} className={`relative ${!plan.is_active ? 'opacity-60' : ''}`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">{plan.display_name}</CardTitle>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEdit(plan)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleToggleStatus(plan.id)}>
                      <Check className="mr-2 h-4 w-4" />
                      {plan.is_active ? 'Desativar' : 'Ativar'}
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleDelete(plan.id, plan.display_name)}
                      className="text-red-600"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              {plan.description && (
                <CardDescription>{plan.description}</CardDescription>
              )}
              
              <div className="text-3xl font-bold text-primary">
                {plan.price === 0 ? (
                  <span className="text-green-600">Gratuito</span>
                ) : (
                  <>
                    R$ {plan.price.toFixed(2)}
                    {plan.duration > 0 && (
                      <span className="text-sm font-normal text-muted-foreground">
                        /{plan.duration} {plan.duration === 1 ? 'mês' : 'meses'}
                      </span>
                    )}
                  </>
                )}
              </div>
              
              <div className="flex gap-2 flex-wrap">
                <Badge variant={plan.is_active ? 'default' : 'secondary'}>
                  {plan.is_active ? 'Ativo' : 'Inativo'}
                </Badge>
                {plan.is_featured && (
                  <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                    Destaque
                  </Badge>
                )}
                {plan.duration === 0 && plan.name !== 'vip' && (
                  <Badge variant="outline">Vitalício</Badge>
                )}
                {plan.name === 'vip' && (
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                    Administrativo
                  </Badge>
                )}
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Recursos inclusos:</h4>
                <ul className="space-y-1">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                      <Check className="h-3 w-3 text-green-500 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

