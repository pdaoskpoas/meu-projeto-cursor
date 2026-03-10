import {
  formatCardNumber,
  formatCep,
  formatCpf,
  formatCvv,
  formatExpiry,
  formatPhone,
  isValidCardNumber,
  isValidCpf,
  isValidCvv,
  isValidExpiry,
  sanitizeDigits,
} from '@/utils/paymentValidation';

export type BillingFormState = {
  name: string;
  email: string;
  cpf: string;
  phone: string;
  cep: string;
  address: string;
  number: string;
  complement: string;
  bairro: string;
  city: string;
  state: string;
  cardName: string;
  cardNumber: string;
  expiry: string;
  cvv: string;
};

export type BillingFormErrors = Partial<Record<keyof BillingFormState, string>>;

export const createEmptyBillingForm = (): BillingFormState => ({
  name: '',
  email: '',
  cpf: '',
  phone: '',
  cep: '',
  address: '',
  number: '',
  complement: '',
  bairro: '',
  city: '',
  state: '',
  cardName: '',
  cardNumber: '',
  expiry: '',
  cvv: '',
});

export const formatBillingField = (field: keyof BillingFormState, value: string) => {
  switch (field) {
    case 'cpf':
      return formatCpf(value);
    case 'phone':
      return formatPhone(value);
    case 'cep':
      return formatCep(value);
    case 'cardNumber':
      return formatCardNumber(value);
    case 'expiry':
      return formatExpiry(value);
    case 'cvv':
      return formatCvv(value);
    default:
      return value;
  }
};

export const validateBillingForm = (
  form: BillingFormState,
  options: { requireCard: boolean }
) => {
  const errors: BillingFormErrors = {};

  if (!form.name.trim()) errors.name = 'Informe o nome completo.';
  if (!form.email.trim()) errors.email = 'Informe o e-mail.';
  if (!form.cpf.trim() || !isValidCpf(form.cpf)) errors.cpf = 'CPF inválido.';
  if (!form.phone.trim()) errors.phone = 'Informe o WhatsApp.';

  const cepDigits = sanitizeDigits(form.cep);
  if (!cepDigits || cepDigits.length !== 8) errors.cep = 'CEP inválido.';
  if (!form.address.trim()) errors.address = 'Informe o endereço.';
  if (!form.number.trim()) errors.number = 'Informe o número.';
  if (!form.bairro.trim()) errors.bairro = 'Informe o bairro.';
  if (!form.city.trim()) errors.city = 'Informe a cidade.';
  if (!form.state.trim()) errors.state = 'Informe o estado.';

  if (options.requireCard) {
    if (!form.cardName.trim()) errors.cardName = 'Informe o nome no cartão.';
    if (!form.cardNumber.trim() || !isValidCardNumber(form.cardNumber)) {
      errors.cardNumber = 'Número do cartão inválido.';
    }
    if (!form.expiry.trim() || !isValidExpiry(form.expiry)) {
      errors.expiry = 'Validade inválida.';
    }
    if (!form.cvv.trim() || !isValidCvv(form.cvv)) {
      errors.cvv = 'CVV inválido.';
    }
  }

  return {
    errors,
    isValid: Object.keys(errors).length === 0,
  };
};

export const buildCustomerPayload = (form: BillingFormState) => ({
  name: form.name.trim(),
  email: form.email.trim(),
  cpfCnpj: sanitizeDigits(form.cpf),
  mobilePhone: form.phone ? sanitizeDigits(form.phone) : undefined,
});

export const buildAddressPayload = (form: BillingFormState) => ({
  postalCode: sanitizeDigits(form.cep),
  address: form.address.trim(),
  addressNumber: form.number.trim(),
  complement: form.complement.trim() || undefined,
  province: form.bairro.trim(),
  city: form.city.trim(),
  state: form.state.trim(),
});

export const buildCardPayload = (form: BillingFormState) => ({
  holderName: form.cardName.trim(),
  number: sanitizeDigits(form.cardNumber),
  expiryMonth: sanitizeDigits(form.expiry).slice(0, 2),
  expiryYear: `20${sanitizeDigits(form.expiry).slice(2)}`,
  cvv: sanitizeDigits(form.cvv),
});
