// src/components/animal/NewAnimalWizard/steps/StepLocation.tsx

import React, { useEffect, useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, ArrowRight, Loader2, MapPin, CheckCircle2, Building2 } from 'lucide-react';
import { useWizard } from '../WizardContext';
import { useAuth } from '@/contexts/AuthContext';
import type { LocationData } from '@/types/animal';

interface ViaCEPResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string; // cidade
  uf: string; // estado
  erro?: boolean;
}

export const StepLocation: React.FC = () => {
  const { state, dispatch } = useWizard();
  const { user } = useAuth();
  const { location } = state.formData;

  const isInstitutional = user?.accountType === 'institutional';
  const profileCep = user?.cep || '';

  const [cep, setCep] = useState('');
  const [useProfileCep, setUseProfileCep] = useState(false);
  const [loadingCep, setLoadingCep] = useState(false);
  const [cepError, setCepError] = useState('');
  const [errors, setErrors] = useState<Partial<Record<keyof LocationData, string>>>({});
  const hasInitialized = useRef(false);

  // Na montagem, se for institucional e tiver CEP no perfil, pré-preencher
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    if (isInstitutional && profileCep) {
      setUseProfileCep(true);
      setCep(profileCep);
      fetchCep(profileCep);
    }
  }, [isInstitutional, profileCep]);

  // Validar campos
  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof LocationData, string>> = {};

    if (!location.current_city || location.current_city.trim().length < 2) {
      newErrors.current_city = 'Cidade é obrigatória';
    }

    if (!location.current_state) {
      newErrors.current_state = 'Estado é obrigatório';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Atualizar validação no estado global
  useEffect(() => {
    const isValid =
      !!location.current_city &&
      location.current_city.trim().length >= 2 &&
      !!location.current_state;

    dispatch({
      type: 'SET_VALIDATION',
      payload: { step: 2, isValid }
    });
  }, [location, dispatch]);

  // Buscar CEP na API ViaCEP
  const fetchCep = async (cepValue: string) => {
    const cleanCep = cepValue.replace(/\D/g, '');

    if (cleanCep.length !== 8) {
      setCepError('CEP deve ter 8 dígitos');
      return;
    }

    setLoadingCep(true);
    setCepError('');

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data: ViaCEPResponse = await response.json();

      if (data.erro) {
        setCepError('CEP não encontrado');
        return;
      }

      dispatch({
        type: 'UPDATE_LOCATION',
        payload: {
          current_city: data.localidade,
          current_state: data.uf
        }
      });

      setCepError('');
    } catch {
      setCepError('Erro ao buscar CEP. Tente novamente.');
    } finally {
      setLoadingCep(false);
    }
  };

  const handleCepChange = (value: string) => {
    let formatted = value.replace(/\D/g, '');
    if (formatted.length > 5) {
      formatted = `${formatted.slice(0, 5)}-${formatted.slice(5, 8)}`;
    }
    setCep(formatted);

    const cleanCep = formatted.replace(/\D/g, '');
    if (cleanCep.length === 8) {
      fetchCep(formatted);
    }
  };

  // Toggle: usar CEP do perfil ou digitar manualmente
  const handleToggleProfileCep = (checked: boolean) => {
    setUseProfileCep(checked);
    setCepError('');

    if (checked && profileCep) {
      setCep(profileCep);
      fetchCep(profileCep);
    } else {
      setCep('');
      dispatch({
        type: 'UPDATE_LOCATION',
        payload: { current_city: '', current_state: '' }
      });
    }
  };

  const handleNext = () => {
    if (validate()) {
      dispatch({ type: 'NEXT_STEP' });
    }
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
            Localização Atual
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Informe onde o animal está localizado
          </p>
        </div>

        {/* Toggle para usar CEP do perfil institucional */}
        {isInstitutional && profileCep && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-3">
                <Building2 className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-blue-900">
                    Usar localização do perfil institucional
                  </p>
                  <p className="text-xs text-blue-700 mt-0.5">
                    CEP cadastrado: <span className="font-mono font-semibold">{profileCep}</span>
                  </p>
                </div>
              </div>
              <Switch
                checked={useProfileCep}
                onCheckedChange={handleToggleProfileCep}
              />
            </div>
          </div>
        )}

        {/* CEP */}
        <div className="space-y-2">
          <Label htmlFor="cep">
            CEP <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <Input
              id="cep"
              placeholder="00000-000"
              value={cep}
              onChange={(e) => handleCepChange(e.target.value)}
              maxLength={9}
              className={cepError ? 'border-red-500' : ''}
              disabled={useProfileCep || loadingCep}
            />
            {loadingCep && (
              <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-gray-400" />
            )}
            {!loadingCep && location.current_city && location.current_state && (
              <CheckCircle2 className="absolute right-3 top-3 h-4 w-4 text-green-600" />
            )}
          </div>
          {cepError && (
            <p className="text-sm text-red-500">{cepError}</p>
          )}
          {useProfileCep ? (
            <p className="text-xs text-blue-600">
              Usando o CEP do seu perfil institucional. Desmarque acima para informar outro.
            </p>
          ) : (
            <p className="text-xs text-gray-500">
              Digite o CEP e os campos abaixo serão preenchidos automaticamente
            </p>
          )}
        </div>

        {/* Cidade */}
        <div className="space-y-2">
          <Label htmlFor="city">
            Cidade <span className="text-red-500">*</span>
          </Label>
          <Input
            id="city"
            placeholder="Será preenchido automaticamente pelo CEP"
            value={location.current_city}
            readOnly
            disabled
            className={`bg-gray-50 cursor-not-allowed ${errors.current_city ? 'border-red-500' : ''}`}
          />
          {errors.current_city && (
            <p className="text-sm text-red-500">{errors.current_city}</p>
          )}
        </div>

        {/* Estado */}
        <div className="space-y-2">
          <Label htmlFor="state">
            Estado <span className="text-red-500">*</span>
          </Label>
          <Input
            id="state"
            placeholder="Ex: SP"
            value={location.current_state}
            readOnly
            disabled
            maxLength={2}
            className={`bg-gray-50 cursor-not-allowed ${errors.current_state ? 'border-red-500' : ''}`}
          />
          {errors.current_state && (
            <p className="text-sm text-red-500">{errors.current_state}</p>
          )}
        </div>

        {/* Info adicional */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <MapPin className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-800">
              <strong>Dica:</strong> A localização ajuda potenciais parceiros a encontrar animais próximos para reprodução.
            </p>
          </div>
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
