// src/components/animal/NewAnimalWizard/steps/StepBasicInfo.tsx

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ArrowRight } from 'lucide-react';
import { useWizard } from '../WizardContext';
import type { BasicInfoData } from '@/types/animal';
import { HORSE_BREEDS } from '@/constants/breeds';

const CATEGORIES_MALE   = ['Potro', 'Garanhão', 'Castrado', 'Outro'];
const CATEGORIES_FEMALE = ['Potra', 'Doadora', 'Matriz', 'Outro'];
const CATEGORIES_ALL    = ['Potro', 'Garanhão', 'Castrado', 'Potra', 'Doadora', 'Matriz', 'Outro'];

const getCategoriesForGender = (gender: string): string[] => {
  if (gender === 'Macho') return CATEGORIES_MALE;
  if (gender === 'Fêmea') return CATEGORIES_FEMALE;
  return CATEGORIES_ALL;
};

export const StepBasicInfo: React.FC = () => {
  const { state, dispatch } = useWizard();
  const { basicInfo } = state.formData;

  const [errors, setErrors] = useState<Partial<Record<keyof BasicInfoData, string>>>({});

  const availableCategories = getCategoriesForGender(basicInfo.gender);

  // Resetar categoria se não for válida para o gênero atual
  useEffect(() => {
    if (basicInfo.category && !availableCategories.includes(basicInfo.category)) {
      dispatch({ type: 'UPDATE_BASIC_INFO', payload: { category: '' } });
    }
  }, [basicInfo.gender]); // eslint-disable-line react-hooks/exhaustive-deps

  // Validar campos
  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof BasicInfoData, string>> = {};

    if (!basicInfo.name || basicInfo.name.trim().length < 2) {
      newErrors.name = 'Nome deve ter no mínimo 2 caracteres';
    }

    if (basicInfo.name.length > 100) {
      newErrors.name = 'Nome deve ter no máximo 100 caracteres';
    }

    if (!basicInfo.breed) {
      newErrors.breed = 'Selecione uma raça';
    }

    if (!basicInfo.coat) {
      newErrors.coat = 'Selecione a pelagem';
    }

    if (!basicInfo.birth_date) {
      newErrors.birth_date = 'Data de nascimento é obrigatória';
    } else {
      const birthDate = new Date(basicInfo.birth_date);
      const today = new Date();
      if (birthDate > today) {
        newErrors.birth_date = 'Data não pode ser no futuro';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Atualizar validação no estado global
  useEffect(() => {
    const isValid = 
      basicInfo.name.trim().length >= 2 &&
      basicInfo.name.length <= 100 &&
      !!basicInfo.breed &&
      !!basicInfo.coat &&
      !!basicInfo.birth_date &&
      new Date(basicInfo.birth_date) <= new Date();

    dispatch({
      type: 'SET_VALIDATION',
      payload: { step: 1, isValid }
    });
  }, [basicInfo, dispatch]);

  const handleNext = () => {
    if (validate()) {
      dispatch({ type: 'NEXT_STEP' });
    }
  };

  const updateField = (field: keyof BasicInfoData, value: string | number | boolean | null) => {
    dispatch({
      type: 'UPDATE_BASIC_INFO',
      payload: { [field]: value }
    });
  };

  return (
    <Card className="p-4 sm:p-6">
      <div className="space-y-5">
        {/* Cabeçalho */}
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
            Informações Básicas
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Preencha os dados principais do seu animal
          </p>
        </div>

        {/* Nome - largura total */}
        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm font-semibold">
            Nome do Animal <span className="text-red-500">*</span>
          </Label>
          <Input
            id="name"
            placeholder="Ex: Estrela da Manhã"
            value={basicInfo.name}
            onChange={(e) => updateField('name', e.target.value)}
            className={`h-11 text-base ${errors.name ? 'border-red-500' : ''}`}
          />
          {errors.name && (
            <p className="text-sm text-red-500">{errors.name}</p>
          )}
        </div>

        {/* Grid 2 colunas para campos curtos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Raça */}
          <div className="space-y-2">
            <Label htmlFor="breed" className="text-sm font-semibold">
              Raça <span className="text-red-500">*</span>
            </Label>
            <Select
              value={basicInfo.breed}
              onValueChange={(value) => updateField('breed', value)}
            >
              <SelectTrigger className={`h-11 text-base ${errors.breed ? 'border-red-500' : ''}`}>
                <SelectValue placeholder="Selecione a raça" />
              </SelectTrigger>
              <SelectContent side="bottom" align="start" avoidCollisions={false}>
                {HORSE_BREEDS.map((breed) => (
                  <SelectItem key={breed} value={breed}>
                    {breed}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.breed && (
              <p className="text-sm text-red-500">{errors.breed}</p>
            )}
          </div>

          {/* Pelagem */}
          <div className="space-y-2">
            <Label htmlFor="coat" className="text-sm font-semibold">
              Pelagem <span className="text-red-500">*</span>
            </Label>
            <Select
              value={basicInfo.coat || ''}
              onValueChange={(value) => updateField('coat', value)}
            >
              <SelectTrigger className={`h-11 text-base ${errors.coat ? 'border-red-500' : ''}`}>
                <SelectValue placeholder="Selecione a pelagem" />
              </SelectTrigger>
              <SelectContent side="bottom" align="start" avoidCollisions={false}>
                <SelectItem value="Alazã">Alazã</SelectItem>
                <SelectItem value="Castanha">Castanha</SelectItem>
                <SelectItem value="Preta">Preta</SelectItem>
                <SelectItem value="Tordilha">Tordilha</SelectItem>
                <SelectItem value="Pampa">Pampa</SelectItem>
                <SelectItem value="Rosilha">Rosilha</SelectItem>
                <SelectItem value="Baía">Baía</SelectItem>
                <SelectItem value="Palomina">Palomina</SelectItem>
                <SelectItem value="Lobuna">Lobuna</SelectItem>
                <SelectItem value="Ruça">Ruça</SelectItem>
                <SelectItem value="Baia Amarilha">Baia Amarilha</SelectItem>
                <SelectItem value="Pêlo de Rato">Pêlo de Rato</SelectItem>
              </SelectContent>
            </Select>
            {errors.coat && (
              <p className="text-sm text-red-500">{errors.coat}</p>
            )}
          </div>
        </div>

        {/* Grid 2 colunas - Gênero e Data */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Gênero */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">
              Gênero <span className="text-red-500">*</span>
            </Label>
            <RadioGroup
              value={basicInfo.gender}
              onValueChange={(value) => updateField('gender', value)}
              className="flex gap-4 pt-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Macho" id="macho" />
                <Label htmlFor="macho" className="font-normal cursor-pointer text-base">
                  Macho
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Fêmea" id="femea" />
                <Label htmlFor="femea" className="font-normal cursor-pointer text-base">
                  Fêmea
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Data de Nascimento */}
          <div className="space-y-2">
            <Label htmlFor="birth_date" className="text-sm font-semibold">
              Data de Nascimento <span className="text-red-500">*</span>
            </Label>
            <Input
              id="birth_date"
              type="date"
              value={basicInfo.birth_date}
              onChange={(e) => updateField('birth_date', e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className={`h-11 text-base ${errors.birth_date ? 'border-red-500' : ''}`}
            />
            {errors.birth_date && (
              <p className="text-sm text-red-500">{errors.birth_date}</p>
            )}
          </div>
        </div>

        {/* Grid 2 colunas - Categoria e Registro */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Categoria */}
          <div className="space-y-2">
            <Label htmlFor="category" className="text-sm font-semibold">
              Categoria <span className="text-red-500">*</span>
            </Label>
            <Select
              value={basicInfo.category}
              onValueChange={(value) => updateField('category', value)}
              disabled={!basicInfo.gender}
            >
              <SelectTrigger className="h-11 text-base">
                <SelectValue placeholder={!basicInfo.gender ? 'Selecione o gênero primeiro' : 'Selecione a categoria'} />
              </SelectTrigger>
              <SelectContent side="bottom" align="start" avoidCollisions={false}>
                {availableCategories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Registro */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">
              Possui registro? <span className="text-red-500">*</span>
            </Label>
            <RadioGroup
              value={basicInfo.is_registered ? 'Sim' : 'Não'}
              onValueChange={(value) => updateField('is_registered', value === 'Sim')}
              className="flex gap-4 pt-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Sim" id="registro-sim" />
                <Label htmlFor="registro-sim" className="font-normal cursor-pointer text-base">
                  Sim
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Não" id="registro-nao" />
                <Label htmlFor="registro-nao" className="font-normal cursor-pointer text-base">
                  Não
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>

        {/* Botões */}
        <div className="flex justify-end pt-4 border-t">
          <Button onClick={handleNext} size="lg" className="h-12 px-8 text-base">
            Próximo
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>
    </Card>
  );
};

