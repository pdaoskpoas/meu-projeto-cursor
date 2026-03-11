// src/components/animal/NewAnimalWizard/steps/StepExtras.tsx

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Info, Trophy, Plus, X } from 'lucide-react';
import { useWizard } from '../WizardContext';
import type { ExtrasData, AnimalAward } from '@/types/animal';

export const StepExtras: React.FC = () => {
  const { state, dispatch } = useWizard();
  const { extras } = state.formData;

  const [description, setDescription] = useState(extras.description || '');
  const [awards, setAwards] = useState<AnimalAward[]>(extras.awards || []);
  const [newTitle, setNewTitle] = useState('');

  // Validar: step sempre válido (todos os campos são opcionais)
  useEffect(() => {
    dispatch({
      type: 'SET_VALIDATION',
      payload: { step: 5, isValid: true }
    });
  }, [dispatch]);

  const handleNext = () => {
    // Sincronizar com o estado global antes de avançar
    dispatch({
      type: 'UPDATE_EXTRAS',
      payload: {
        description: description.trim() === '' ? null : description.trim(),
        awards: awards
      }
    });
    dispatch({ type: 'NEXT_STEP' });
  };

  const handlePrev = () => {
    dispatch({ type: 'PREV_STEP' });
  };

  const updateDescription = (value: string) => {
    if (value.length <= 300) {
      setDescription(value);
    }
  };

  const addAward = () => {
    const title = newTitle.trim();
    if (!title) {
      return;
    }

    const award: AnimalAward = {
      // Mantemos as duas colunas iguais para compatibilidade com o schema atual
      event_name: title,
      event_date: '',
      city: '',
      state: '',
      award: title
    };

    setAwards(prev => [...prev, award]);
    setNewTitle('');
  };

  const removeAward = (index: number) => {
    setAwards(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* Cabeçalho */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Configurações Extras
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Adicione uma descrição e premiações para valorizar seu anúncio
          </p>
        </div>

        {/* === DESCRIÇÃO DO ANÚNCIO === */}
        <div className="space-y-4 p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900">
                Descrição do Anúncio
              </h3>
              <p className="text-sm text-blue-800 mt-1">
                Descreva as características e qualidades do animal que você deseja destacar.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">
              Descrição <span className="text-gray-400">(Opcional - máximo 300 caracteres)</span>
            </Label>
            <Textarea
              id="description"
              placeholder="Ex: Animal de excelente temperamento, marcha batida picada, muito dócil e ideal para reprodução..."
              value={description}
              onChange={(e) => updateDescription(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <div className="flex justify-end">
              <span className={`text-xs ${description.length > 280 ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                {description.length}/300 caracteres
              </span>
            </div>
          </div>
        </div>

        {/* === PREMIAÇÕES === */}
        <div className="space-y-4 p-4 bg-amber-50 rounded-lg border-2 border-amber-200">
          <div className="flex items-start gap-3">
            <Trophy className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-amber-900">
                Premiações do Animal
              </h3>
              <p className="text-sm text-amber-800 mt-1">
                Adicione cada título em uma linha. Use "Adicionar novo título" para incluir outro.
              </p>
            </div>
          </div>

          {/* Lista de prêmios existentes */}
          {awards.length > 0 && (
            <div className="space-y-2">
              {awards.map((award, index) => (
                <Card key={index} className="p-3 bg-white relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2 h-6 w-6 p-0"
                    onClick={() => removeAward(index)}
                  >
                    <X className="h-4 w-4 text-red-600" />
                  </Button>
                  <div className="pr-8">
                    <p className="font-semibold text-sm text-gray-900">
                      {award.event_name || award.award}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Formulário para adicionar novo título */}
          <div className="space-y-3 pt-3 border-t border-amber-300">
            <Label className="text-amber-900 font-semibold">
              Adicionar Novo Título
            </Label>

            <div className="space-y-2">
              <Label htmlFor="award_title">
                Título <span className="text-red-600">*</span>
              </Label>
              <Input
                id="award_title"
                placeholder="Ex: Campeã das Campeãs Brasileira de Marcha Picada em 2025"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full border-amber-400 text-amber-900 hover:bg-amber-100"
              onClick={addAward}
              disabled={!newTitle.trim()}
            >
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Novo Título
            </Button>
          </div>
        </div>

        {/* Info */}
        {(description || awards.length > 0) && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-800">
              ✅ <strong>Ótimo!</strong> Anúncios com descrição e premiações têm muito mais visualizações e geram mais interesse!
            </p>
          </div>
        )}

        {/* Botões */}
        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={handlePrev}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <Button onClick={handleNext}>
            Revisar e Publicar
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};
