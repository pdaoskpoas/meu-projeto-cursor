// src/components/animal/NewAnimalWizard/steps/StepGenealogy.tsx

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { useWizard } from '../WizardContext';
import { useDebouncedUpdate } from '../hooks/useDebouncedUpdate';
import type { GenealogyData } from '@/types/animal';

export const StepGenealogy: React.FC = () => {
  const { state, dispatch } = useWizard();
  const { genealogy } = state.formData;

  const [localData, setLocalData] = useState(genealogy);
  const [expandGrandparents, setExpandGrandparents] = useState(false);
  const [expandGreatGrandparents, setExpandGreatGrandparents] = useState(false);

  // Debounced update para o reducer
  const debouncedUpdate = useDebouncedUpdate(
    (field: keyof GenealogyData, value: string | null) => {
      dispatch({
        type: 'UPDATE_GENEALOGY',
        payload: { [field]: value }
      });
    },
    200
  );

  // Atualização local imediata + debounced global
  const updateField = (field: keyof GenealogyData, value: string) => {
    const finalValue = value.trim() === '' ? null : value;
    
    setLocalData(prev => ({
      ...prev,
      [field]: finalValue
    }));

    debouncedUpdate(field, finalValue);
  };

  // Validar: step opcional, sempre válido
  useEffect(() => {
    dispatch({
      type: 'SET_VALIDATION',
      payload: { step: 4, isValid: true }
    });
  }, [dispatch]);

  const handleNext = () => {
    dispatch({ type: 'NEXT_STEP' });
  };

  const handlePrev = () => {
    dispatch({ type: 'PREV_STEP' });
  };

  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* Cabeçalho */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Genealogia
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Informações sobre a linhagem do animal (opcional)
          </p>
        </div>

        {/* Info */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex gap-2">
            <Info className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
              <p className="font-medium mb-1">
                🏆 Genealogia completa valoriza seu anúncio!
              </p>
              <p>
                Animais com linhagem registrada (pais, avós e bisavós) são muito mais atrativos para reprodução.
              </p>
            </div>
          </div>
        </div>

        {/* === PAIS (1ª GERAÇÃO) === */}
        <div className="space-y-4 p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            👨‍👩‍👦 Pais (1ª Geração)
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="father_name">
                Nome do Pai <span className="text-gray-400">(Opcional)</span>
              </Label>
              <Input
                id="father_name"
                placeholder="Ex: Trovão da Serra"
                value={localData.father_name || ''}
                onChange={(e) => updateField('father_name', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mother_name">
                Nome da Mãe <span className="text-gray-400">(Opcional)</span>
              </Label>
              <Input
                id="mother_name"
                placeholder="Ex: Estrela da Manhã"
                value={localData.mother_name || ''}
                onChange={(e) => updateField('mother_name', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* === AVÓS (2ª GERAÇÃO) - COLAPSÁVEL === */}
        <div className="space-y-4">
          <Button
            type="button"
            variant="outline"
            className="w-full flex justify-between items-center"
            onClick={() => setExpandGrandparents(!expandGrandparents)}
          >
            <span className="flex items-center gap-2">
              👴👵 Avós (2ª Geração) <span className="text-gray-400 text-sm">- Opcional</span>
            </span>
            {expandGrandparents ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>

          {expandGrandparents && (
            <div className="space-y-4 p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
              {/* Avós paternos */}
              <div className="space-y-3">
                <h4 className="font-medium text-blue-900">
                  🔵 Avós Paternos (pais do pai)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="paternal_grandfather_name">
                      Avô Paterno <span className="text-gray-400">(Opcional)</span>
                    </Label>
                    <Input
                      id="paternal_grandfather_name"
                      placeholder="Pai do pai"
                      value={localData.paternal_grandfather_name || ''}
                      onChange={(e) => updateField('paternal_grandfather_name', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="paternal_grandmother_name">
                      Avó Paterna <span className="text-gray-400">(Opcional)</span>
                    </Label>
                    <Input
                      id="paternal_grandmother_name"
                      placeholder="Mãe do pai"
                      value={localData.paternal_grandmother_name || ''}
                      onChange={(e) => updateField('paternal_grandmother_name', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Avós maternos */}
              <div className="space-y-3">
                <h4 className="font-medium text-pink-900">
                  🔴 Avós Maternos (pais da mãe)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="maternal_grandfather_name">
                      Avô Materno <span className="text-gray-400">(Opcional)</span>
                    </Label>
                    <Input
                      id="maternal_grandfather_name"
                      placeholder="Pai da mãe"
                      value={localData.maternal_grandfather_name || ''}
                      onChange={(e) => updateField('maternal_grandfather_name', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maternal_grandmother_name">
                      Avó Materna <span className="text-gray-400">(Opcional)</span>
                    </Label>
                    <Input
                      id="maternal_grandmother_name"
                      placeholder="Mãe da mãe"
                      value={localData.maternal_grandmother_name || ''}
                      onChange={(e) => updateField('maternal_grandmother_name', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* === BISAVÓS (3ª GERAÇÃO) - COLAPSÁVEL === */}
        <div className="space-y-4">
          <Button
            type="button"
            variant="outline"
            className="w-full flex justify-between items-center"
            onClick={() => setExpandGreatGrandparents(!expandGreatGrandparents)}
          >
            <span className="flex items-center gap-2">
              🧓🧓 Bisavós (3ª Geração) <span className="text-gray-400 text-sm">- Opcional</span>
            </span>
            {expandGreatGrandparents ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>

          {expandGreatGrandparents && (
            <div className="space-y-4 p-4 bg-purple-50 rounded-lg border-2 border-purple-200">
              {/* Bisavós paternos - lado do avô */}
              <div className="space-y-3">
                <h4 className="font-medium text-purple-900">
                  🔵🔵 Bisavós Paternos (pais do avô paterno)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="paternal_gg_father_name">
                      Bisavô <span className="text-gray-400">(Opcional)</span>
                    </Label>
                    <Input
                      id="paternal_gg_father_name"
                      placeholder="Pai do avô paterno"
                      value={localData.paternal_gg_father_name || ''}
                      onChange={(e) => updateField('paternal_gg_father_name', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="paternal_gg_mother_name">
                      Bisavó <span className="text-gray-400">(Opcional)</span>
                    </Label>
                    <Input
                      id="paternal_gg_mother_name"
                      placeholder="Mãe do avô paterno"
                      value={localData.paternal_gg_mother_name || ''}
                      onChange={(e) => updateField('paternal_gg_mother_name', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Bisavós paternos - lado da avó */}
              <div className="space-y-3">
                <h4 className="font-medium text-purple-900">
                  🔵🔴 Bisavós Paternos (pais da avó paterna)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="paternal_gm_father_name">
                      Bisavô <span className="text-gray-400">(Opcional)</span>
                    </Label>
                    <Input
                      id="paternal_gm_father_name"
                      placeholder="Pai da avó paterna"
                      value={localData.paternal_gm_father_name || ''}
                      onChange={(e) => updateField('paternal_gm_father_name', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="paternal_gm_mother_name">
                      Bisavó <span className="text-gray-400">(Opcional)</span>
                    </Label>
                    <Input
                      id="paternal_gm_mother_name"
                      placeholder="Mãe da avó paterna"
                      value={localData.paternal_gm_mother_name || ''}
                      onChange={(e) => updateField('paternal_gm_mother_name', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Bisavós maternos - lado do avô */}
              <div className="space-y-3">
                <h4 className="font-medium text-purple-900">
                  🔴🔵 Bisavós Maternos (pais do avô materno)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="maternal_gg_father_name">
                      Bisavô <span className="text-gray-400">(Opcional)</span>
                    </Label>
                    <Input
                      id="maternal_gg_father_name"
                      placeholder="Pai do avô materno"
                      value={localData.maternal_gg_father_name || ''}
                      onChange={(e) => updateField('maternal_gg_father_name', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maternal_gg_mother_name">
                      Bisavó <span className="text-gray-400">(Opcional)</span>
                    </Label>
                    <Input
                      id="maternal_gg_mother_name"
                      placeholder="Mãe do avô materno"
                      value={localData.maternal_gg_mother_name || ''}
                      onChange={(e) => updateField('maternal_gg_mother_name', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Bisavós maternos - lado da avó */}
              <div className="space-y-3">
                <h4 className="font-medium text-purple-900">
                  🔴🔴 Bisavós Maternos (pais da avó materna)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="maternal_gm_father_name">
                      Bisavô <span className="text-gray-400">(Opcional)</span>
                    </Label>
                    <Input
                      id="maternal_gm_father_name"
                      placeholder="Pai da avó materna"
                      value={localData.maternal_gm_father_name || ''}
                      onChange={(e) => updateField('maternal_gm_father_name', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maternal_gm_mother_name">
                      Bisavó <span className="text-gray-400">(Opcional)</span>
                    </Label>
                    <Input
                      id="maternal_gm_mother_name"
                      placeholder="Mãe da avó materna"
                      value={localData.maternal_gm_mother_name || ''}
                      onChange={(e) => updateField('maternal_gm_mother_name', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Botões */}
        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={handlePrev}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <Button onClick={handleNext}>
            Próximo
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};
