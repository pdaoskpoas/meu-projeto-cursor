import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  BillingFormErrors,
  BillingFormState,
  formatBillingField,
} from '@/components/payment/billingForm';

interface BillingDetailsFormProps {
  form: BillingFormState;
  errors: BillingFormErrors;
  isFetchingCep: boolean;
  onFieldChange: (field: keyof BillingFormState, value: string) => void;
  onCepBlur?: () => void;
  showCardFields: boolean;
}

export function BillingDetailsForm({
  form,
  errors,
  isFetchingCep,
  onFieldChange,
  onCepBlur,
  showCardFields,
}: BillingDetailsFormProps) {
  const handleChange = (field: keyof BillingFormState) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatBillingField(field, event.target.value);
    onFieldChange(field, formatted);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold">Dados de cobranca</h3>
        <p className="text-xs text-muted-foreground">
          Preencha os dados obrigatorios para validacao no Asaas.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="billing-cpf">CPF</Label>
          <Input
            id="billing-cpf"
            value={form.cpf}
            onChange={handleChange('cpf')}
            placeholder="000.000.000-00"
            className={errors.cpf ? 'border-red-500' : ''}
          />
          {errors.cpf && <p className="mt-1 text-xs text-red-500">{errors.cpf}</p>}
        </div>
        <div>
          <Label htmlFor="billing-name">Nome completo</Label>
          <Input
            id="billing-name"
            value={form.name}
            onChange={handleChange('name')}
            placeholder="Nome para cobranca"
            className={errors.name ? 'border-red-500' : ''}
          />
          {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
        </div>
        <div>
          <Label htmlFor="billing-email">E-mail</Label>
          <Input
            id="billing-email"
            type="email"
            value={form.email}
            onChange={handleChange('email')}
            placeholder="email@exemplo.com"
            className={errors.email ? 'border-red-500' : ''}
          />
          {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
        </div>
        <div>
          <Label htmlFor="billing-phone">WhatsApp</Label>
          <Input
            id="billing-phone"
            value={form.phone}
            onChange={handleChange('phone')}
            placeholder="(11) 99999-9999"
            className={errors.phone ? 'border-red-500' : ''}
          />
          {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone}</p>}
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold">Endereco</h4>
        <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <Label htmlFor="billing-cep">CEP</Label>
            <Input
              id="billing-cep"
              value={form.cep}
              onChange={handleChange('cep')}
              onBlur={onCepBlur}
              placeholder="00000-000"
              className={errors.cep ? 'border-red-500' : ''}
            />
            {isFetchingCep && <p className="mt-1 text-xs text-gray-500">Buscando CEP...</p>}
            {errors.cep && <p className="mt-1 text-xs text-red-500">{errors.cep}</p>}
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="billing-address">Endereco</Label>
            <Input
              id="billing-address"
              value={form.address}
              onChange={handleChange('address')}
              placeholder="Rua, avenida, etc."
              className={errors.address ? 'border-red-500' : ''}
            />
            {errors.address && <p className="mt-1 text-xs text-red-500">{errors.address}</p>}
          </div>
          <div>
            <Label htmlFor="billing-number">Numero</Label>
            <Input
              id="billing-number"
              value={form.number}
              onChange={handleChange('number')}
              placeholder="123"
              className={errors.number ? 'border-red-500' : ''}
            />
            {errors.number && <p className="mt-1 text-xs text-red-500">{errors.number}</p>}
          </div>
          <div>
            <Label htmlFor="billing-complement">Complemento</Label>
            <Input
              id="billing-complement"
              value={form.complement}
              onChange={handleChange('complement')}
              placeholder="Apto, bloco, etc."
            />
          </div>
          <div>
            <Label htmlFor="billing-bairro">Bairro</Label>
            <Input
              id="billing-bairro"
              value={form.bairro}
              onChange={handleChange('bairro')}
              placeholder="Bairro"
              className={errors.bairro ? 'border-red-500' : ''}
            />
            {errors.bairro && <p className="mt-1 text-xs text-red-500">{errors.bairro}</p>}
          </div>
          <div>
            <Label htmlFor="billing-city">Cidade</Label>
            <Input
              id="billing-city"
              value={form.city}
              onChange={handleChange('city')}
              placeholder="Cidade"
              className={errors.city ? 'border-red-500' : ''}
            />
            {errors.city && <p className="mt-1 text-xs text-red-500">{errors.city}</p>}
          </div>
          <div>
            <Label htmlFor="billing-state">Estado</Label>
            <Input
              id="billing-state"
              value={form.state}
              onChange={handleChange('state')}
              placeholder="UF"
              className={errors.state ? 'border-red-500' : ''}
            />
            {errors.state && <p className="mt-1 text-xs text-red-500">{errors.state}</p>}
          </div>
        </div>
      </div>

      {showCardFields && (
        <div>
          <h4 className="text-sm font-semibold">Dados do cartao</h4>
          <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <Label htmlFor="billing-card-name">Nome no cartao</Label>
              <Input
                id="billing-card-name"
                value={form.cardName}
                onChange={handleChange('cardName')}
                placeholder="Nome impresso no cartao"
                className={errors.cardName ? 'border-red-500' : ''}
              />
              {errors.cardName && <p className="mt-1 text-xs text-red-500">{errors.cardName}</p>}
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="billing-card-number">Numero do cartao</Label>
              <Input
                id="billing-card-number"
                value={form.cardNumber}
                onChange={handleChange('cardNumber')}
                placeholder="0000 0000 0000 0000"
                className={errors.cardNumber ? 'border-red-500' : ''}
              />
              {errors.cardNumber && <p className="mt-1 text-xs text-red-500">{errors.cardNumber}</p>}
            </div>
            <div>
              <Label htmlFor="billing-expiry">Validade</Label>
              <Input
                id="billing-expiry"
                value={form.expiry}
                onChange={handleChange('expiry')}
                placeholder="MM/AA"
                className={errors.expiry ? 'border-red-500' : ''}
              />
              {errors.expiry && <p className="mt-1 text-xs text-red-500">{errors.expiry}</p>}
            </div>
            <div>
              <Label htmlFor="billing-cvv">CVV</Label>
              <Input
                id="billing-cvv"
                value={form.cvv}
                onChange={handleChange('cvv')}
                placeholder="123"
                className={errors.cvv ? 'border-red-500' : ''}
              />
              {errors.cvv && <p className="mt-1 text-xs text-red-500">{errors.cvv}</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BillingDetailsForm;
