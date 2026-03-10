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

const CATEGORIES = ['Garanhão', 'Castrado', 'Doadora', 'Matriz', 'Potro', 'Potra', 'Outro'];

export const StepBasicInfo: React.FC = () => {
  const { state, dispatch } = useWizard();
  const { basicInfo } = state.formData;

  const [errors, setErrors] = useState<Partial<Record<keyof BasicInfoData, string>>>({});

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
    <Card className="p-6">
      <div className="space-y-6">
        {/* Cabeçalho */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Informações Básicas
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Dados principais do animal para identificação
          </p>
        </div>

        {/* Nome */}
        <div className="space-y-2">
          <Label htmlFor="name">
            Nome do Animal <span className="text-red-500">*</span>
          </Label>
          <Input
            id="name"
            placeholder="Ex: Estrela da Manhã"
            value={basicInfo.name}
            onChange={(e) => updateField('name', e.target.value)}
            className={errors.name ? 'border-red-500' : ''}
          />
          {errors.name && (
            <p className="text-sm text-red-500">{errors.name}</p>
          )}
        </div>

        {/* Raça */}
        <div className="space-y-2">
          <Label htmlFor="breed">
            Raça <span className="text-red-500">*</span>
          </Label>
          <Select
            value={basicInfo.breed}
            onValueChange={(value) => updateField('breed', value)}
          >
            <SelectTrigger className={errors.breed ? 'border-red-500' : ''}>
              <SelectValue placeholder="Selecione a raça" />
            </SelectTrigger>
            <SelectContent>
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

        {/* Gênero */}
        <div className="space-y-2">
          <Label>
            Gênero <span className="text-red-500">*</span>
          </Label>
          <RadioGroup
            value={basicInfo.gender}
            onValueChange={(value) => updateField('gender', value)}
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Macho" id="macho" />
              <Label htmlFor="macho" className="font-normal cursor-pointer">
                Macho
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Fêmea" id="femea" />
              <Label htmlFor="femea" className="font-normal cursor-pointer">
                Fêmea
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Data de Nascimento */}
        <div className="space-y-2">
          <Label htmlFor="birth_date">
            Data de Nascimento <span className="text-red-500">*</span>
          </Label>
          <Input
            id="birth_date"
            type="date"
            value={basicInfo.birth_date}
            onChange={(e) => updateField('birth_date', e.target.value)}
            max={new Date().toISOString().split('T')[0]}
            className={errors.birth_date ? 'border-red-500' : ''}
          />
          {errors.birth_date && (
            <p className="text-sm text-red-500">{errors.birth_date}</p>
          )}
        </div>

        {/* Pelagem (obrigatória, sempre no feminino) */}
        <div className="space-y-2">
          <Label htmlFor="coat">
            Pelagem <span className="text-red-500">*</span>
          </Label>
          <Select
            value={basicInfo.coat || ''}
            onValueChange={(value) => updateField('coat', value)}
          >
            <SelectTrigger className={errors.coat ? 'border-red-500' : ''}>
              <SelectValue placeholder="Selecione a pelagem" />
            </SelectTrigger>
            <SelectContent>
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
          <p className="text-xs text-gray-500">
            💡 Pelagens sempre no feminino (concorda com "pelagem")
          </p>
        </div>

        {/* Categoria */}
        <div className="space-y-2">
          <Label htmlFor="category">
            Categoria <span className="text-red-500">*</span>
          </Label>
          <Select
            value={basicInfo.category}
            onValueChange={(value) => updateField('category', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione a categoria" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Registro */}
        <div className="space-y-2">
          <Label>
            Possui registro? <span className="text-red-500">*</span>
          </Label>
          <RadioGroup
            value={basicInfo.is_registered ? 'Sim' : 'Não'}
            onValueChange={(value) => updateField('is_registered', value === 'Sim')}
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Sim" id="registro-sim" />
              <Label htmlFor="registro-sim" className="font-normal cursor-pointer">
                Sim
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Não" id="registro-nao" />
              <Label htmlFor="registro-nao" className="font-normal cursor-pointer">
                Não
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Botões */}
        <div className="flex justify-end pt-4">
          <Button onClick={handleNext}>
            Próximo
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};

