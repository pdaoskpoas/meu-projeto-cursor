// src/components/animal/NewAnimalWizard/steps/StepPartnerships.tsx

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { UserPlus, Trash2, Users, AlertTriangle } from 'lucide-react';
import { useWizard } from '../WizardContext';

interface Partner {
  publicCode: string;
  percentage: number;
  tempId: string;
}

/**
 * Step 6: Sociedades (Opcional)
 * 
 * Permite adicionar sócios ao animal antes de publicar.
 * Este step é OPCIONAL - usuário pode pular e adicionar sócios depois.
 */
export const StepPartnerships: React.FC = () => {
  const { state, dispatch } = useWizard();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [newCode, setNewCode] = useState('');
  const [newPercentage, setNewPercentage] = useState('50');
  const [error, setError] = useState('');

  // Calcular total de percentuais
  const totalPercentage = partners.reduce((sum, p) => sum + p.percentage, 0);
  const hasInvalidTotal = totalPercentage > 100;

  const handleAddPartner = () => {
    setError('');

    // Validações
    if (!newCode.trim()) {
      setError('Digite o código público do sócio');
      return;
    }

    const percentNum = parseFloat(newPercentage);
    if (isNaN(percentNum) || percentNum <= 0 || percentNum > 100) {
      setError('Percentual deve estar entre 1 e 100');
      return;
    }

    // Verificar limite de 10 sócios
    if (partners.length >= 10) {
      setError('Máximo de 10 sócios por animal');
      return;
    }

    // Verificar se já foi adicionado
    if (partners.some(p => p.publicCode.toUpperCase() === newCode.trim().toUpperCase())) {
      setError('Este código já foi adicionado');
      return;
    }

    // Verificar se soma ultrapassa 100%
    if (totalPercentage + percentNum > 100) {
      setError(`A soma dos percentuais seria ${totalPercentage + percentNum}%. Máximo: 100%`);
      return;
    }

    // Adicionar sócio
    const newPartner: Partner = {
      publicCode: newCode.trim().toUpperCase(),
      percentage: percentNum,
      tempId: Date.now().toString()
    };

    setPartners(prev => [...prev, newPartner]);
    setNewCode('');
    setNewPercentage('50');
  };

  const handleRemovePartner = (tempId: string) => {
    setPartners(prev => prev.filter(p => p.tempId !== tempId));
    setError('');
  };

  const handleNext = () => {
    // Salvar sócios no estado (será usado no StepReview ao publicar)
    dispatch({
      type: 'UPDATE_PARTNERSHIPS',
      payload: partners.map(p => ({
        publicCode: p.publicCode,
        percentage: p.percentage
      }))
    });

    dispatch({ type: 'NEXT_STEP' });
  };

  const handleBack = () => {
    dispatch({ type: 'PREVIOUS_STEP' });
  };

  const handleSkip = () => {
    // Usuário pode pular e adicionar sócios depois
    dispatch({ type: 'UPDATE_PARTNERSHIPS', payload: [] });
    dispatch({ type: 'NEXT_STEP' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Sociedades (Opcional)
        </h3>
        <p className="text-gray-600">
          Adicione sócios que compartilharão a propriedade deste animal. Você pode pular esta etapa e adicionar sócios depois.
        </p>
      </div>

      {/* Informações */}
      <Alert>
        <Users className="h-4 w-4" />
        <AlertDescription className="text-sm">
          <ul className="space-y-1 mt-2">
            <li>• Máximo de 10 sócios por animal</li>
            <li>• Sócios com plano ativo verão o animal em seus perfis</li>
            <li>• Você pode adicionar, remover ou editar sócios a qualquer momento</li>
            <li>• A soma dos percentuais é informativa, não precisa ser 100%</li>
          </ul>
        </AlertDescription>
      </Alert>

      {/* Formulário de adicionar sócio */}
      <div className="bg-gray-50 rounded-lg p-6 space-y-4">
        <h4 className="font-medium text-gray-900">Adicionar Sócio</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <Label htmlFor="partner-code">Código Público do Sócio</Label>
            <Input
              id="partner-code"
              placeholder="Ex: HER2024"
              value={newCode}
              onChange={(e) => setNewCode(e.target.value.toUpperCase())}
              className="font-mono"
            />
          </div>

          <div>
            <Label htmlFor="partner-percentage">Percentual (%)</Label>
            <Input
              id="partner-percentage"
              type="number"
              min="1"
              max="100"
              placeholder="50"
              value={newPercentage}
              onChange={(e) => setNewPercentage(e.target.value)}
            />
          </div>
        </div>

        <Button
          type="button"
          onClick={handleAddPartner}
          variant="outline"
          className="w-full"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Adicionar Sócio
        </Button>

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>

      {/* Lista de sócios adicionados */}
      {partners.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-900">
              Sócios Adicionados ({partners.length}/10)
            </h4>
            <div className="text-sm">
              <span className="text-gray-600">Total: </span>
              <span className={`font-bold ${hasInvalidTotal ? 'text-red-600' : 'text-gray-900'}`}>
                {totalPercentage}%
              </span>
            </div>
          </div>

          {hasInvalidTotal && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                A soma dos percentuais ultrapassa 100%. Ajuste os valores antes de continuar.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            {partners.map((partner) => (
              <div
                key={partner.tempId}
                className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-4"
              >
                <div className="flex-1">
                  <p className="font-mono font-medium text-gray-900">
                    {partner.publicCode}
                  </p>
                  <p className="text-sm text-gray-600">
                    {partner.percentage}% de participação
                  </p>
                </div>
                
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemovePartner(partner.tempId)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Navegação */}
      <div className="flex justify-between pt-6 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={handleBack}
        >
          Voltar
        </Button>

        <div className="flex gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={handleSkip}
          >
            Pular esta Etapa
          </Button>

          <Button
            type="button"
            onClick={handleNext}
            disabled={hasInvalidTotal}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {partners.length > 0 ? 'Revisar e Publicar' : 'Continuar sem Sócios'}
          </Button>
        </div>
      </div>
    </div>
  );
};


