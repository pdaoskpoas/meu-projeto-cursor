/**
 * 🔒 Validação robusta de senha conforme recomendações de segurança
 * Baseado em: OWASP, NIST Password Guidelines
 * 
 * Requisitos:
 * - Mínimo 12 caracteres
 * - Pelo menos 1 letra minúscula (a-z)
 * - Pelo menos 1 letra maiúscula (A-Z)
 * - Pelo menos 1 número (0-9)
 * - Pelo menos 1 caractere especial (!@#$%^&*...)
 */

export interface PasswordStrength {
  score: number; // 0-5 (muito fraca, fraca, média, boa, forte, muito forte)
  label: string;
  color: string;
  feedback: string[];
}

const PASSWORD_MIN_LENGTH = 12;

export const passwordRequirements = [
  { 
    test: (password: string) => password.length >= PASSWORD_MIN_LENGTH,
    message: `Mínimo ${PASSWORD_MIN_LENGTH} caracteres`,
    weight: 2
  },
  { 
    test: (password: string) => /[a-z]/.test(password),
    message: 'Pelo menos uma letra minúscula (a-z)',
    weight: 1
  },
  { 
    test: (password: string) => /[A-Z]/.test(password),
    message: 'Pelo menos uma letra maiúscula (A-Z)',
    weight: 1
  },
  { 
    test: (password: string) => /[0-9]/.test(password),
    message: 'Pelo menos um número (0-9)',
    weight: 1
  },
  { 
    test: (password: string) => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password),
    message: 'Pelo menos um caractere especial (!@#$%...)',
    weight: 1
  }
];

/**
 * Valida se a senha atende aos requisitos mínimos
 */
export const validatePassword = (password: string): string | null => {
  if (!password) {
    return 'Senha é obrigatória';
  }

  for (const requirement of passwordRequirements) {
    if (!requirement.test(password)) {
      return requirement.message;
    }
  }

  return null;
};

/**
 * Calcula a força da senha (0-5)
 */
export const calculatePasswordStrength = (password: string): PasswordStrength => {
  if (!password) {
    return {
      score: 0,
      label: 'Nenhuma',
      color: 'bg-gray-300',
      feedback: ['Digite uma senha']
    };
  }

  let score = 0;
  const feedback: string[] = [];

  // Calcular score baseado nos requisitos
  for (const requirement of passwordRequirements) {
    if (requirement.test(password)) {
      score += requirement.weight;
    } else {
      feedback.push(requirement.message);
    }
  }

  // Bônus por comprimento extra
  if (password.length >= 16) score += 1;
  if (password.length >= 20) score += 1;

  // Penalidade por padrões comuns
  if (/(.)\1{2,}/.test(password)) {
    score -= 1;
    feedback.push('Evite repetir caracteres consecutivos');
  }
  if (/^[0-9]+$/.test(password)) {
    score -= 2;
    feedback.push('Não use apenas números');
  }
  if (/^[a-zA-Z]+$/.test(password)) {
    score -= 1;
    feedback.push('Adicione números e símbolos');
  }

  // Normalizar score (0-5)
  score = Math.max(0, Math.min(5, score));

  // Determinar label e cor
  let label = '';
  let color = '';

  if (score === 0) {
    label = 'Muito Fraca';
    color = 'bg-red-500';
  } else if (score === 1) {
    label = 'Fraca';
    color = 'bg-orange-500';
  } else if (score === 2) {
    label = 'Média';
    color = 'bg-yellow-500';
  } else if (score === 3) {
    label = 'Boa';
    color = 'bg-blue-500';
  } else if (score === 4) {
    label = 'Forte';
    color = 'bg-green-500';
  } else {
    label = 'Muito Forte';
    color = 'bg-emerald-600';
  }

  return { score, label, color, feedback };
};

/**
 * Verifica se a senha é fraca demais (lista de senhas comuns)
 */
const commonPasswords = [
  '123456', 'password', '123456789', '12345678', '12345', '1234567',
  'password1', '123123', 'admin', 'letmein', 'welcome', 'monkey',
  '1234567890', 'qwerty', 'abc123', '111111', '123321', 'Password1'
];

export const isCommonPassword = (password: string): boolean => {
  return commonPasswords.some(common => 
    password.toLowerCase().includes(common.toLowerCase())
  );
};

/**
 * Validação customizada para formulários
 */
export const passwordValidationRule = {
  required: true,
  minLength: PASSWORD_MIN_LENGTH,
  custom: (value: string) => {
    if (!value) {
      return 'Senha é obrigatória';
    }

    // Verificar senha comum
    if (isCommonPassword(value)) {
      return 'Esta senha é muito comum. Escolha uma senha mais segura';
    }

    // Validar requisitos
    const error = validatePassword(value);
    return error;
  }
};





