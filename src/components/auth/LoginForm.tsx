import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useFormValidation } from '@/hooks/useFormValidation';

interface LoginFormProps {
  onSubmit: (email: string, password: string) => Promise<void>;
  isSubmitting: boolean;
  className?: string;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSubmit, isSubmitting, className = '' }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const validationRules = {
    email: {
      required: true,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      custom: (value: string) => {
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          return 'Por favor, insira um email válido';
        }
        return null;
      }
    },
    password: {
      required: true,
      minLength: 8,
      custom: (value: string) => {
        if (!value) {
          return 'Senha é obrigatória';
        }
        if (value.length < 8) {
          return 'A senha deve ter pelo menos 8 caracteres';
        }
        return null;
      }
    }
  };

  const { errors, validateField, validateForm, clearErrors } = useFormValidation(validationRules);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const formData = { email, password };
    if (validateForm(formData)) {
      await onSubmit(email, password);
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    if (errors.email) {
      validateField('email', value);
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    if (errors.password) {
      validateField('password', value);
    }
  };

  // Clear errors when component unmounts or form is submitted successfully
  useEffect(() => {
    return () => clearErrors();
  }, [clearErrors]);

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="text-center space-y-3 mb-8">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
          Bem-vindo de volta
        </h2>
        <p className="text-slate-600 text-base">Entre na sua conta para continuar</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email */}
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium text-slate-700">
            E-mail
          </label>
          <div className="relative">
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={handleEmailChange}
              className={`h-12 bg-white border border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-lg text-slate-900 placeholder-slate-400 transition-all ${errors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
              required
              aria-describedby={errors.email ? 'email-error' : undefined}
              aria-invalid={!!errors.email}
            />
            {errors.email && (
              <div className="flex items-center gap-2 mt-1.5">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <span id="email-error" className="text-sm text-red-500" role="alert">
                  {errors.email}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Password */}
        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium text-slate-700">
            Senha
          </label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Digite sua senha"
              value={password}
              onChange={handlePasswordChange}
              className={`h-12 pr-12 bg-white border border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-lg text-slate-900 placeholder-slate-400 transition-all ${errors.password ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
              required
              aria-describedby={errors.password ? 'password-error' : undefined}
              aria-invalid={!!errors.password}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-700 transition-colors"
              aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
            {errors.password && (
              <div className="flex items-center gap-2 mt-1.5">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <span id="password-error" className="text-sm text-red-500" role="alert">
                  {errors.password}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Forgot Password Link */}
        <div className="text-right">
          <Link 
            to="/forgot-password" 
            className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
          >
            Esqueceu sua senha?
          </Link>
        </div>

        {/* Submit Button */}
        <div className="pt-4">
          <Button 
            type="submit" 
            className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold text-base rounded-lg shadow-lg shadow-blue-600/30 hover:shadow-xl hover:shadow-blue-600/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none" 
            disabled={isSubmitting}
            aria-describedby="submit-status"
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Entrando...</span>
              </div>
            ) : (
              'Entrar'
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
          <span className="px-4 bg-white text-slate-500">Novo por aqui?</span>
        </div>
      </div>

      {/* Register Link */}
      <div className="text-center">
        <Link 
          to="/register" 
          className="inline-flex items-center justify-center w-full h-11 px-6 rounded-lg border-2 border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-700 font-semibold transition-all"
        >
          Criar uma conta
        </Link>
      </div>
    </div>
  );
};

export default LoginForm;
