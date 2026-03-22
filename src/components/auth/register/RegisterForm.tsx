import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import AccountTypeSelector from '../AccountTypeSelector';
import PropertyTypeSelector from '../PropertyTypeSelector';
import TermsAcceptance from '../TermsAcceptance';
import { useFormValidation } from '@/hooks/useFormValidation';
import { buscarCep, UF_TO_ESTADO } from '@/services/cepService';

interface RegisterFormData {
  name: string;
  propertyName: string;
  propertyType: '' | 'haras' | 'fazenda' | 'cte' | 'central-reproducao';
  cep: string;
  cpf: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  accountType: 'personal' | 'institutional';
  marketingConsent: boolean;
}

interface RegisterFormProps {
  onSubmit: (formData: RegisterFormData) => Promise<void>;
  isSubmitting: boolean;
  className?: string;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onSubmit, isSubmitting, className = '' }) => {
  const [accountType, setAccountType] = useState<'personal' | 'institutional'>('personal');
  const [formData, setFormData] = useState({
    name: '',
    propertyName: '',
    propertyType: '' as RegisterFormData['propertyType'],
    cep: '',
    cpf: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isFetchingCep, setIsFetchingCep] = useState(false);
  const [cepLocation, setCepLocation] = useState<{ city: string; state: string } | null>(null);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);

  const validationRules = {
    name: { required: true, minLength: 2 },
    propertyName: { required: accountType === 'institutional', minLength: 2 },
    propertyType: { required: accountType === 'institutional' },
    cep: { required: accountType === 'institutional', pattern: /^\d{5}-\d{3}$/ },
    cpf: { required: true, pattern: /^\d{3}\.\d{3}\.\d{3}-\d{2}$/ },
    email: { required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
    phone: { required: true, pattern: /^\(\d{2}\) \d{4,5}-\d{4}$/ },
    password: { required: true, minLength: 8 },
    confirmPassword: {
      required: true,
      custom: (value: string) => value === formData.password ? null : 'Senhas não coincidem'
    }
  };

  const { errors, validateField, validateForm, clearErrors } = useFormValidation(validationRules);

  const handleInputChange = (field: keyof RegisterFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      validateField(field, value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!acceptedTerms) {
      return;
    }

    const isValid = validateForm(formData);
    if (!isValid) return;

    try {
      await onSubmit({
        ...formData,
        accountType,
        marketingConsent
      });
    } catch (error) {
      console.error('Erro no registro:', error);
    }
  };

  const formatCep = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length > 5) {
      return `${numbers.slice(0, 5)}-${numbers.slice(5, 8)}`;
    }
    return numbers;
  };

  const handleCepChange = async (value: string) => {
    const formatted = formatCep(value);
    handleInputChange('cep', formatted);

    const cepLimpo = formatted.replace(/\D/g, '');
    if (cepLimpo.length === 8) {
      setIsFetchingCep(true);
      const result = await buscarCep(formatted);
      setIsFetchingCep(false);

      if (result.success && result.data) {
        const estadoCompleto = UF_TO_ESTADO[result.data.uf];
        if (estadoCompleto) {
          setCepLocation({ city: result.data.localidade, state: estadoCompleto });
        }
      } else {
        setCepLocation(null);
      }
    } else {
      setCepLocation(null);
    }
  };

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  };

  return (
    <div className={`w-full max-w-md mx-auto ${className}`}>
      <div className="text-center space-y-3 mb-8">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
          Crie sua conta
        </h2>
        <p className="text-slate-600 text-base">Comece a gerenciar seus cavalos hoje</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Account Type */}
        <AccountTypeSelector
          accountType={accountType}
          onAccountTypeChange={(type) => {
            setAccountType(type);
            if (type === 'personal') {
              setFormData(prev => ({
                ...prev,
                propertyName: '',
                propertyType: '',
                cep: ''
              }));
              setCepLocation(null);
            }
          }}
        />

        {/* Form Fields - sem Card, direto */}
        <div className="space-y-3">
          {/* Personal Info Fields */}
          <div>
            <Input
              placeholder="Nome completo"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={`h-12 bg-white border border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-lg transition-all ${
                errors.name ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
              }`}
            />
            {errors.name ? (
              <div className="flex items-center gap-2 mt-1.5">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <span className="text-sm text-red-500">{errors.name}</span>
              </div>
            ) : accountType === 'personal' && (
              <p className="text-xs text-slate-500 mt-1.5">
                Aparecerá em seu perfil, anúncios e chats.
              </p>
            )}
          </div>

          <div>
            <Input
              placeholder="CPF (000.000.000-00)"
              inputMode="numeric"
              value={formData.cpf}
              onChange={(e) => handleInputChange('cpf', formatCPF(e.target.value))}
              maxLength={14}
              className={`h-12 bg-white border border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-lg transition-all ${
                errors.cpf ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
              }`}
            />
            {errors.cpf && (
              <div className="flex items-center gap-2 mt-1.5">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <span className="text-sm text-red-500">{errors.cpf}</span>
              </div>
            )}
          </div>

          {/* Property Info Fields (Institutional only) */}
          {accountType === 'institutional' && (
            <>
              <div>
                <Input
                  placeholder="Nome da propriedade"
                  value={formData.propertyName}
                  onChange={(e) => handleInputChange('propertyName', e.target.value)}
                  className={`h-12 bg-white border border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-lg transition-all ${
                    errors.propertyName ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                  }`}
                />
                {errors.propertyName ? (
                  <div className="flex items-center gap-2 mt-1.5">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <span className="text-sm text-red-500">{errors.propertyName}</span>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 mt-1.5">
                    Aparecerá em seu perfil, anúncios e chats.
                  </p>
                )}
              </div>

              <PropertyTypeSelector
                selectedType={formData.propertyType}
                onTypeSelect={(type) => handleInputChange('propertyType', type)}
              />

              <div>
                <div className="relative">
                  <Input
                    placeholder="CEP (00000-000)"
                    inputMode="numeric"
                    value={formData.cep}
                    onChange={(e) => handleCepChange(e.target.value)}
                    maxLength={9}
                    className={`h-12 bg-white border border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-lg transition-all ${
                      errors.cep ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                    }`}
                    disabled={isFetchingCep}
                  />
                  {isFetchingCep && (
                    <Loader2 className="h-4 w-4 animate-spin absolute right-3 top-1/2 -translate-y-1/2 text-blue-600" />
                  )}
                </div>
                {errors.cep ? (
                  <div className="flex items-center gap-2 mt-1.5">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <span className="text-sm text-red-500">{errors.cep}</span>
                  </div>
                ) : cepLocation ? (
                  <p className="text-xs text-green-600 mt-1.5">
                    {cepLocation.city} - {cepLocation.state}
                  </p>
                ) : (
                  <p className="text-xs text-slate-500 mt-1.5">
                    Localização da propriedade
                  </p>
                )}
              </div>
            </>
          )}

          {/* Contact Fields */}
          <div>
            <Input
              type="email"
              placeholder="E-mail"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className={`h-12 bg-white border border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-lg transition-all ${
                errors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
              }`}
            />
            {errors.email && (
              <div className="flex items-center gap-2 mt-1.5">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <span className="text-sm text-red-500">{errors.email}</span>
              </div>
            )}
          </div>

          <div>
            <Input
              type="tel"
              placeholder="Telefone (00) 00000-0000"
              inputMode="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', formatPhone(e.target.value))}
              maxLength={15}
              className={`h-12 bg-white border border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-lg transition-all ${
                errors.phone ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
              }`}
            />
            {errors.phone && (
              <div className="flex items-center gap-2 mt-1.5">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <span className="text-sm text-red-500">{errors.phone}</span>
              </div>
            )}
          </div>

          {/* Password Fields */}
          <div>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Senha (mínimo 8 caracteres)"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className={`h-12 pr-12 bg-white border border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-lg transition-all ${
                  errors.password ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-700 transition-colors"
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            
            {errors.password && (
              <div className="flex items-center gap-2 mt-1.5">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <span className="text-sm text-red-500">{errors.password}</span>
              </div>
            )}
          </div>

          <div>
            <div className="relative">
              <Input
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirmar senha"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                className={`h-12 pr-12 bg-white border border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-lg transition-all ${
                  errors.confirmPassword ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-700 transition-colors"
                aria-label={showConfirmPassword ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <div className="flex items-center gap-2 mt-1.5">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <span className="text-sm text-red-500">{errors.confirmPassword}</span>
              </div>
            )}
          </div>
        </div>

        {/* Terms */}
        <TermsAcceptance
          accepted={acceptedTerms}
          onAcceptanceChange={setAcceptedTerms}
        />

        {/* Marketing Consent (separado, opcional) */}
        <div className="flex items-start space-x-3">
          <Checkbox
            id="marketing"
            checked={marketingConsent}
            onCheckedChange={(checked) => setMarketingConsent(checked === true)}
            className="mt-1"
          />
          <label htmlFor="marketing" className="text-sm text-slate-600 leading-relaxed">
            Aceito receber novidades, dicas e ofertas por e-mail.
            <span className="text-slate-400"> (opcional)</span>
          </label>
        </div>

        {/* Submit Button */}
        <div className="pt-4">
          <Button
            type="submit"
            disabled={isSubmitting || !acceptedTerms}
            className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold text-base rounded-lg shadow-lg shadow-blue-600/30 hover:shadow-xl hover:shadow-blue-600/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Criando conta...</span>
              </div>
            ) : (
              'Criar Conta'
            )}
          </Button>
        </div>
      </form>

      {/* Divider */}
      <div className="relative py-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200"></div>
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="px-4 bg-white text-slate-500">Já tem uma conta?</span>
        </div>
      </div>

      {/* Login Link */}
      <div className="text-center">
        <Link 
          to="/login" 
          className="inline-flex items-center justify-center w-full h-11 px-6 rounded-lg border-2 border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-700 font-semibold transition-all"
        >
          Fazer login
        </Link>
      </div>
    </div>
  );
};

export default RegisterForm;
