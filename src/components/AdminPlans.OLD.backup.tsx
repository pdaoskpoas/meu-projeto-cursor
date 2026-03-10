import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Plus, Edit, Trash2, MoreHorizontal, CreditCard, Check } from 'lucide-react';
import { mockPlanTypes, PlanType } from '@/data/adminData';
import { useToast } from '@/hooks/use-toast';

export function AdminPlans() {
  const [plans, setPlans] = useState<PlanType[]>(mockPlanTypes);
  const [isCreating, setIsCreating] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PlanType | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    price: 0,
    duration: 0,
    features: [] as string[],
    isActive: true
  });

  const [newFeature, setNewFeature] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingPlan) {
      // Editar plano existente
      setPlans(plans.map(plan => 
        plan.id === editingPlan.id 
          ? { ...plan, ...formData }
          : plan
      ));
      toast({
        title: "Plano atualizado",
        description: "O plano foi atualizado com sucesso.",
      });
      setEditingPlan(null);
    } else {
      // Criar novo plano
      const newPlan: PlanType = {
        id: Date.now().toString(),
        ...formData
      };
      setPlans([...plans, newPlan]);
      toast({
        title: "Plano criado",
        description: "O novo plano foi criado com sucesso.",
      });
    }

    setFormData({
      name: '',
      price: 0,
      duration: 0,
      features: [],
      isActive: true
    });
    setIsCreating(false);
  };

  const handleEdit = (plan: PlanType) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      price: plan.price,
      duration: plan.duration,
      features: [...plan.features],
      isActive: plan.isActive
    });
    setIsCreating(true);
  };

  const handleDelete = (planId: string) => {
    setPlans(plans.filter(plan => plan.id !== planId));
    toast({
      title: "Plano removido",
      description: "O plano foi removido com sucesso.",
      variant: "destructive"
    });
  };

  const togglePlanStatus = (planId: string) => {
    setPlans(plans.map(plan =>
      plan.id === planId
        ? { ...plan, isActive: !plan.isActive }
        : plan
    ));
    toast({
      title: "Status alterado",
      description: "O status do plano foi alterado.",
    });
  };

  const addFeature = () => {
    if (newFeature.trim()) {
      setFormData({
        ...formData,
        features: [...formData.features, newFeature.trim()]
      });
      setNewFeature('');
    }
  };

  const removeFeature = (index: number) => {
    setFormData({
      ...formData,
      features: formData.features.filter((_, i) => i !== index)
    });
  };

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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Plano</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Ex: Plano Premium"
                    required
                  />
                </div>
                
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
                  {formData.features.map((feature, index) => (
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

              <div className="flex items-center space-x-2">
                <Switch
                  id="active"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({...formData, isActive: checked})}
                />
                <Label htmlFor="active">Plano ativo</Label>
              </div>

              <div className="flex justify-end gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsCreating(false);
                    setEditingPlan(null);
                    setFormData({
                      name: '',
                      price: 0,
                      duration: 0,
                      features: [],
                      isActive: true
                    });
                  }}
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
          <Card key={plan.id} className={`relative ${!plan.isActive ? 'opacity-60' : ''}`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
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
                    <DropdownMenuItem onClick={() => togglePlanStatus(plan.id)}>
                      <Check className="mr-2 h-4 w-4" />
                      {plan.isActive ? 'Desativar' : 'Ativar'}
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleDelete(plan.id)}
                      className="text-red-600"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              <div className="text-3xl font-bold text-primary">
                {plan.price === 0 ? (
                  <span className="text-green-600">Gratuito</span>
                ) : (
                  <>
                    R$ {plan.price.toFixed(2)}
                {plan.duration > 0 && (
                  <span className="text-sm font-normal text-muted-foreground">
                    /mês
                  </span>
                )}
                  </>
                )}
              </div>
              
              <div className="flex gap-2">
                <Badge variant={plan.isActive ? 'default' : 'secondary'}>
                  {plan.isActive ? 'Ativo' : 'Inativo'}
                </Badge>
                {plan.duration === 0 && plan.name !== 'VIP' && (
                  <Badge variant="outline">Vitalício</Badge>
                )}
                {plan.name === 'VIP' && (
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