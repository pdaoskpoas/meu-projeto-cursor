import { useState, useCallback } from 'react';

interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: string) => string | null;
}

interface ValidationRules {
  [key: string]: ValidationRule;
}

interface FormData {
  [key: string]: string;
}

interface ValidationErrors {
  [key: string]: string | null;
}

interface UseFormValidationReturn {
  errors: ValidationErrors;
  validateField: (field: string, value: string) => string | null;
  validateForm: (data: FormData) => boolean;
  clearErrors: () => void;
  setError: (field: string, error: string | null) => void;
}

export const useFormValidation = (rules: ValidationRules): UseFormValidationReturn => {
  const [errors, setErrors] = useState<ValidationErrors>({});

  const validateField = useCallback((field: string, value: string): string | null => {
    const rule = rules[field];
    if (!rule) return null;

    // Required validation
    if (rule.required && (!value || value.trim() === '')) {
      return `${field} é obrigatório`;
    }

    // Skip other validations if field is empty and not required
    if (!value || value.trim() === '') return null;

    // Min length validation
    if (rule.minLength && value.length < rule.minLength) {
      return `${field} deve ter pelo menos ${rule.minLength} caracteres`;
    }

    // Max length validation
    if (rule.maxLength && value.length > rule.maxLength) {
      return `${field} deve ter no máximo ${rule.maxLength} caracteres`;
    }

    // Pattern validation
    if (rule.pattern && !rule.pattern.test(value)) {
      return `${field} tem formato inválido`;
    }

    // Custom validation
    if (rule.custom) {
      return rule.custom(value);
    }

    return null;
  }, [rules]);

  const validateForm = useCallback((data: FormData): boolean => {
    const newErrors: ValidationErrors = {};
    let isValid = true;

    Object.keys(rules).forEach(field => {
      const error = validateField(field, data[field] || '');
      if (error) {
        newErrors[field] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [rules, validateField]);

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  const setError = useCallback((field: string, error: string | null) => {
    setErrors(prev => ({
      ...prev,
      [field]: error
    }));
  }, []);

  return {
    errors,
    validateField,
    validateForm,
    clearErrors,
    setError
  };
};



