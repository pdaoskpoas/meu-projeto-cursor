import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { buscarCep } from '@/services/cepService';
import {
  CHECKOUT_PLANS,
  getPlanById,
  getPlanPrice,
  getInstallmentCount,
  getBoostTier,
  BOOST_TIERS,
  type CheckoutBillingCycle,
  type CheckoutPlanId,
  type BoostDuration,
} from '@/constants/checkoutPlans';
import {
  formatCep,
  formatCpf,
  formatPhone,
  isValidCpf,
  sanitizeDigits,
} from '@/utils/paymentValidation';
import {
  checkPaymentStatus,
  processBoostPayment,
  processPayment,
} from '@/services/checkoutService';
import { clearPlanCache } from '@/services/planService';
import {
  clearCheckoutContext,
  loadCheckoutContext,
  type CheckoutContext,
} from '@/utils/checkoutContext';

type CheckoutState = Partial<CheckoutContext> & {
  planId?: CheckoutPlanId;
  billingPeriod?: CheckoutBillingCycle;
};

type PurchaseType = 'plan' | 'boost';

type PaymentMethod = 'CREDIT_CARD' | 'PIX' | 'BOLETO';

const CheckoutPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user, isLoading, refreshUser } = useAuth();
  const state = useMemo(
    () => (location.state as CheckoutState) ?? {},
    [location.state]
  );
  const storedContext = useMemo(() => loadCheckoutContext(), []);
  const resolvedContext = useMemo<CheckoutContext>(() => {
    if (state?.purchaseType) return state as CheckoutContext;
    if (state?.planId || state?.billingPeriod) {
      return { purchaseType: 'plan', planId: state.planId, billingPeriod: state.billingPeriod };
    }
    if (storedContext) return storedContext;
    return { purchaseType: 'plan', planId: state.planId, billingPeriod: state.billingPeriod };
  }, [state, storedContext]);

  const defaultPlan = getPlanById(state.planId) ?? CHECKOUT_PLANS[1];
  const [purchaseType, setPurchaseType] = useState<PurchaseType>(
    resolvedContext.purchaseType === 'boost' ? 'boost' : 'plan'
  );
  const [boostDuration, setBoostDuration] = useState<BoostDuration>(
    resolvedContext.purchaseType === 'boost' ? resolvedContext.boostDuration : '24h'
  );
  const [boostAnimalId] = useState<string | undefined>(
    resolvedContext.purchaseType === 'boost' ? resolvedContext.animalId : undefined
  );
  const [planId, setPlanId] = useState<CheckoutPlanId>(defaultPlan.id);
  const [billingCycle, setBillingCycle] = useState<CheckoutBillingCycle>(
    (state.billingPeriod as CheckoutBillingCycle) ?? 'monthly'
  );

  const [form, setForm] = useState({
    cpf: '',
    name: '',
    email: '',
    phone: '',
    cep: '',
    address: '',
    number: '',
    complement: '',
    bairro: '',
    city: '',
    state: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('PIX');
  const [isFetchingCep, setIsFetchingCep] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pixData, setPixData] = useState<{ qrCode?: string; copyPaste?: string } | null>(null);
  const [pixModalOpen, setPixModalOpen] = useState(false);
  const [pixExpiresAt, setPixExpiresAt] = useState<Date | null>(null);
  const [pixTimeLeft, setPixTimeLeft] = useState(0);
  const [pixPaymentRef, setPixPaymentRef] = useState<{ paymentId?: string; subscriptionId?: string } | null>(null);
  const [isCheckingPix, setIsCheckingPix] = useState(false);

  const selectedPlan = useMemo(
    () => CHECKOUT_PLANS.find((plan) => plan.id === planId) ?? defaultPlan,
    [planId, defaultPlan]
  );

  const planPrice = useMemo(
    () => getPlanPrice(selectedPlan, billingCycle),
    [selectedPlan, billingCycle]
  );

  const selectedBoostTier = useMemo(() => getBoostTier(boostDuration), [boostDuration]);

  const isPixDiscountActive =
    paymentMethod === 'PIX' && !(purchaseType === 'plan' && billingCycle === 'monthly');

  const baseTotal = useMemo(() => {
    if (purchaseType === 'plan') return planPrice;
    return selectedBoostTier.price;
  }, [purchaseType, planPrice, selectedBoostTier]);

  const pixDiscount = isPixDiscountActive ? baseTotal * 0.03 : 0;
  const finalTotal = Math.max(0, baseTotal - pixDiscount);

  const formatPrice = (value: number) => value.toFixed(2).replace('.', ',');

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/login', { replace: true });
    }
  }, [isLoading, user, navigate]);

  useEffect(() => {
    if (purchaseType === 'plan') {
      clearCheckoutContext();
    }
  }, [purchaseType]);

  const updateField = (field: keyof typeof form, value: string) => {
    if (isSubmitting) setIsSubmitting(false);
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validateForm = () => {
    const nextErrors: Record<string, string> = {};

    if (!form.name.trim()) nextErrors.name = 'Informe o nome completo.';
    if (!form.email.trim()) nextErrors.email = 'Informe um e-mail válido.';
    if (!form.cpf.trim() || !isValidCpf(form.cpf)) nextErrors.cpf = 'CPF inválido.';
    if (!form.phone.trim()) nextErrors.phone = 'Informe um WhatsApp válido.';
    if (!form.cep.trim() || sanitizeDigits(form.cep).length !== 8) nextErrors.cep = 'CEP inválido.';
    if (!form.address.trim()) nextErrors.address = 'Informe o endereço.';
    if (!form.number.trim()) nextErrors.number = 'Informe o número.';
    if (!form.bairro.trim()) nextErrors.bairro = 'Informe o bairro.';
    if (!form.city.trim()) nextErrors.city = 'Informe a cidade.';
    if (!form.state.trim()) nextErrors.state = 'Informe o estado.';

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleCepLookup = async (value: string) => {
    const formatted = formatCep(value);
    updateField('cep', formatted);

    const digits = sanitizeDigits(formatted);
    if (digits.length !== 8) return;

    setIsFetchingCep(true);
    const result = await buscarCep(formatted);
    setIsFetchingCep(false);

    if (!result.success || !result.data) {
      setErrors((prev) => ({ ...prev, cep: result.error || 'CEP não encontrado.' }));
      return;
    }

    setForm((prev) => ({
      ...prev,
      address: result.data?.logradouro || prev.address,
      bairro: result.data?.bairro || prev.bairro,
      city: result.data?.localidade || prev.city,
      state: result.data?.uf || prev.state,
    }));
  };

  // PIX countdown timer
  useEffect(() => {
    if (!pixExpiresAt) return;
    const updateCountdown = () => {
      const diff = Math.max(0, pixExpiresAt.getTime() - Date.now());
      setPixTimeLeft(diff);
    };
    updateCountdown();
    const interval = window.setInterval(updateCountdown, 1000);
    return () => window.clearInterval(interval);
  }, [pixExpiresAt]);

  // PIX auto-polling
  useEffect(() => {
    if (!pixModalOpen || !pixPaymentRef?.paymentId || pixTimeLeft <= 0) return;

    let cancelled = false;
    const poll = async () => {
      while (!cancelled) {
        await new Promise((r) => setTimeout(r, 5000));
        if (cancelled) break;
        try {
          const result = await checkPaymentStatus(pixPaymentRef);
          if (cancelled) break;
          if (result?.success && result.status === 'APPROVED') {
            if (purchaseType === 'plan') {
              clearPlanCache();
              await refreshUser();
            }
            setPixModalOpen(false);
            toast({
              title: 'Pagamento aprovado!',
              description:
                purchaseType === 'plan'
                  ? 'Seu plano foi ativado com sucesso.'
                  : 'Seu turbinar foi ativado com sucesso.',
            });
            navigate('/dashboard');
            return;
          }
          if (result?.success && result.status === 'REJECTED') {
            setPixModalOpen(false);
            toast({
              title: 'Pagamento rejeitado',
              description: 'Não identificamos o pagamento. Tente novamente.',
              variant: 'destructive',
            });
            return;
          }
        } catch {
          // Silencia erros de polling
        }
      }
    };
    poll();
    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pixModalOpen, pixPaymentRef?.paymentId, pixTimeLeft > 0]);

  const formatCountdown = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handlePixCheck = async () => {
    if (!pixPaymentRef?.paymentId && !pixPaymentRef?.subscriptionId) return;
    setIsCheckingPix(true);
    try {
      const result = await checkPaymentStatus(pixPaymentRef);
      setIsCheckingPix(false);

      if (!result || typeof result !== 'object') {
        toast({
          title: 'Erro ao verificar pagamento',
          description: 'Resposta inesperada do servidor. Tente novamente.',
          variant: 'destructive',
        });
        return;
      }

      if (!result.success) {
        toast({
          title: 'Erro ao verificar pagamento',
          description: result.message || 'Não foi possível verificar o Pix. Tente novamente.',
          variant: 'destructive',
        });
        return;
      }

      if (result.status === 'APPROVED') {
        if (purchaseType === 'plan') {
          clearPlanCache();
          await refreshUser();
        }
        toast({
          title: 'Pagamento aprovado!',
          description:
            purchaseType === 'plan'
              ? 'Seu plano foi ativado com sucesso.'
              : 'Seu turbinar foi ativado com sucesso.',
        });
        navigate('/dashboard');
        return;
      }

      if (result.status === 'REJECTED') {
        toast({
          title: 'Pagamento rejeitado',
          description: 'Não identificamos o pagamento. Tente novamente.',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Pagamento ainda não identificado',
        description: `Status: ${result.status || 'pendente'}. Clique novamente em alguns segundos.`,
      });
    } catch (err) {
      setIsCheckingPix(false);
      toast({
        title: 'Erro ao verificar pagamento',
        description: err instanceof Error ? err.message : 'Erro inesperado. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) return;

    if (!validateForm()) {
      toast({
        title: 'Revise os dados',
        description: 'Alguns campos precisam de atenção antes de continuar.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const basePayload = {
        customer: {
          name: form.name.trim(),
          email: form.email.trim(),
          cpfCnpj: sanitizeDigits(form.cpf),
          mobilePhone: form.phone ? sanitizeDigits(form.phone) : undefined,
        },
        address: {
          postalCode: sanitizeDigits(form.cep),
          address: form.address.trim(),
          addressNumber: form.number.trim(),
          complement: form.complement.trim() || undefined,
          province: form.bairro.trim(),
          city: form.city.trim(),
          state: form.state.trim(),
        },
      };

      let result;
      if (purchaseType === 'boost') {
        result = await processBoostPayment({
          userId: user.id,
          duration: boostDuration,
          animalId: boostAnimalId,
          billingType: paymentMethod,
          ...basePayload,
        });
      } else {
        result = await processPayment({
          userId: user.id,
          planId,
          billingCycle,
          paymentMethod,
          ...basePayload,
        });
      }

      if (!result?.success) {
        toast({
          title: 'Erro ao processar pagamento',
          description: result?.message || 'Tente novamente em instantes.',
          variant: 'destructive',
        });
        return;
      }

      // PIX: show QR code modal
      if (paymentMethod === 'PIX' && result.pixQrCode) {
        setPixData({
          qrCode: result.pixQrCode,
          copyPaste: result.pixCopyPaste,
        });
        setPixPaymentRef({ paymentId: result.paymentId, subscriptionId: (result as any).subscriptionId });
        setPixExpiresAt(new Date(Date.now() + 10 * 60 * 1000));
        setPixModalOpen(true);
        toast({
          title: 'Pix gerado com sucesso',
          description: 'Finalize o pagamento usando o QR Code.',
        });
        return;
      }

      // CREDIT_CARD / BOLETO: redirect to Asaas hosted checkout
      if (result.invoiceUrl) {
        toast({
          title: 'Redirecionando para pagamento seguro',
          description: 'Você será redirecionado para o ambiente seguro do Asaas.',
        });
        window.open(result.invoiceUrl, '_blank');
        navigate('/dashboard');
        return;
      }

      // Fallback: redirect to dashboard
      toast({
        title: 'Pagamento criado',
        description: 'Acompanhe o status no dashboard.',
      });
      navigate('/dashboard');
    } catch (error) {
      toast({
        title: 'Erro ao processar pagamento',
        description: 'Não foi possível concluir a solicitação. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col bg-white">
      <div className="flex-1 px-3 sm:px-4 py-8 sm:py-12">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-6 sm:gap-10">
          <form onSubmit={handleSubmit} className="space-y-10">
            <section className="space-y-6">
              <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                {purchaseType === 'plan'
                  ? 'Checkout seguro'
                  : 'Finalizar compra de Turbinar'}
              </h1>
                <p className="text-sm text-gray-600">
                Preencha os dados abaixo para concluir o pagamento.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cpf">CPF</Label>
                  <Input
                    id="cpf"
                    value={form.cpf}
                    onChange={(e) => updateField('cpf', formatCpf(e.target.value))}
                    placeholder="000.000.000-00"
                    className={errors.cpf ? 'border-red-500' : ''}
                  />
                  {errors.cpf && <p className="text-xs text-red-500 mt-1">{errors.cpf}</p>}
                </div>
                <div>
                  <Label htmlFor="name">Nome completo</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    placeholder="Nome para faturamento"
                    className={errors.name ? 'border-red-500' : ''}
                  />
                  {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                </div>
                <div>
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    placeholder="email@exemplo.com"
                    className={errors.email ? 'border-red-500' : ''}
                  />
                  {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                </div>
                <div>
                  <Label htmlFor="phone">WhatsApp</Label>
                  <Input
                    id="phone"
                    value={form.phone}
                    onChange={(e) => updateField('phone', formatPhone(e.target.value))}
                    placeholder="(11) 99999-9999"
                  />
                  {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
                </div>
              </div>
            </section>

            <section className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Endereço de cobrança</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="cep">CEP</Label>
                  <Input
                    id="cep"
                    value={form.cep}
                    onChange={(e) => handleCepLookup(e.target.value)}
                    placeholder="00000-000"
                    className={errors.cep ? 'border-red-500' : ''}
                  />
                  {isFetchingCep && <p className="text-xs text-gray-500 mt-1">Buscando CEP...</p>}
                  {errors.cep && <p className="text-xs text-red-500 mt-1">{errors.cep}</p>}
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="address">Endereço</Label>
                  <Input
                    id="address"
                    value={form.address}
                    onChange={(e) => updateField('address', e.target.value)}
                    placeholder="Rua, avenida, etc."
                    className={errors.address ? 'border-red-500' : ''}
                  />
                  {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address}</p>}
                </div>
                <div>
                  <Label htmlFor="number">Número</Label>
                  <Input
                    id="number"
                    value={form.number}
                    onChange={(e) => updateField('number', e.target.value)}
                    placeholder="123"
                    className={errors.number ? 'border-red-500' : ''}
                  />
                  {errors.number && <p className="text-xs text-red-500 mt-1">{errors.number}</p>}
                </div>
                <div>
                  <Label htmlFor="complement">Complemento</Label>
                  <Input
                    id="complement"
                    value={form.complement}
                    onChange={(e) => updateField('complement', e.target.value)}
                    placeholder="Apto, bloco, etc."
                  />
                </div>
                <div>
                  <Label htmlFor="bairro">Bairro</Label>
                  <Input
                    id="bairro"
                    value={form.bairro}
                    onChange={(e) => updateField('bairro', e.target.value)}
                    placeholder="Bairro"
                    className={errors.bairro ? 'border-red-500' : ''}
                  />
                  {errors.bairro && <p className="text-xs text-red-500 mt-1">{errors.bairro}</p>}
                </div>
                <div>
                  <Label htmlFor="city">Cidade</Label>
                  <Input
                    id="city"
                    value={form.city}
                    onChange={(e) => updateField('city', e.target.value)}
                    placeholder="Cidade"
                    className={errors.city ? 'border-red-500' : ''}
                  />
                  {errors.city && <p className="text-xs text-red-500 mt-1">{errors.city}</p>}
                </div>
                <div>
                  <Label htmlFor="state">Estado</Label>
                  <Input
                    id="state"
                    value={form.state}
                    onChange={(e) => updateField('state', e.target.value.toUpperCase())}
                    placeholder="UF"
                    className={errors.state ? 'border-red-500' : ''}
                  />
                  {errors.state && <p className="text-xs text-red-500 mt-1">{errors.state}</p>}
                </div>
              </div>
            </section>

            <section className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Forma de pagamento</h2>
              <div>
                <Label>Escolha a forma de pagamento</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('PIX')}
                    className={`rounded-lg border px-4 py-3 text-left transition ${
                      paymentMethod === 'PIX'
                        ? 'border-green-600 bg-green-50 text-green-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <p className="font-semibold">PIX</p>
                    <p className="text-xs">3% de desconto no pagamento à vista</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('CREDIT_CARD')}
                    className={`rounded-lg border px-4 py-3 text-left transition ${
                      paymentMethod === 'CREDIT_CARD'
                        ? 'border-gray-900 bg-gray-900 text-white'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <p className="font-semibold">Cartão de crédito</p>
                    <p className="text-xs">Pagamento seguro via Asaas</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('BOLETO')}
                    className={`rounded-lg border px-4 py-3 text-left transition ${
                      paymentMethod === 'BOLETO'
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <p className="font-semibold">Boleto bancário</p>
                    <p className="text-xs">Vencimento em 3 dias úteis</p>
                  </button>
                </div>

                {paymentMethod === 'CREDIT_CARD' && (
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      Ao finalizar, você será redirecionado para o ambiente seguro do Asaas
                      para inserir os dados do cartão. Seus dados ficam protegidos.
                    </p>
                  </div>
                )}

                {paymentMethod === 'BOLETO' && (
                  <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      O boleto será gerado e você poderá pagar em qualquer banco ou app.
                      Prazo de compensação: até 3 dias úteis.
                    </p>
                  </div>
                )}
              </div>
            </section>

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? 'Processando...'
                : paymentMethod === 'PIX'
                  ? 'Gerar QR Code PIX'
                  : paymentMethod === 'BOLETO'
                    ? 'Gerar Boleto'
                    : 'Pagar com Cartão'}
            </Button>
          </form>

          <aside className="space-y-6">
            {purchaseType === 'plan' ? (
              <div className="rounded-2xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900">Plano selecionado</h3>
                <p className="text-sm text-gray-600">{selectedPlan.description}</p>

                <div className="mt-4 space-y-3">
                  {CHECKOUT_PLANS.map((plan) => (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => setPlanId(plan.id)}
                      className={`w-full text-left rounded-lg border px-4 py-3 transition ${
                        plan.id === planId
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <p className="font-semibold text-gray-900">{plan.name}</p>
                      <p className="text-xs text-gray-600">
                        {plan.description} - Até {plan.animalLimit} {plan.animalLimit === 1 ? 'animal' : 'animais'}
                        {plan.boostsPerMonth > 0 && ` + ${plan.boostsPerMonth} turbinares/mês`}
                      </p>
                    </button>
                  ))}
                </div>

                <div className="mt-6 space-y-3">
                  {(['monthly', 'annual'] as CheckoutBillingCycle[]).map((cycle) => (
                    <button
                      key={cycle}
                      type="button"
                      onClick={() => setBillingCycle(cycle)}
                      className={`w-full text-left rounded-lg border px-4 py-3 transition ${
                        cycle === billingCycle
                          ? 'border-gray-900 bg-gray-900 text-white'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <p className="font-semibold">
                        {cycle === 'monthly' && 'Mensal'}
                        {cycle === 'annual' && 'Anual (12x sem juros)'}
                      </p>
                      <p className="text-xs">
                        {cycle === 'annual'
                          ? `12x de R$ ${(getPlanPrice(selectedPlan, cycle) / 12).toFixed(2).replace('.', ',')} · Total R$ ${getPlanPrice(selectedPlan, cycle).toFixed(2).replace('.', ',')}`
                          : `R$ ${getPlanPrice(selectedPlan, cycle).toFixed(2).replace('.', ',')} /mês`
                        }
                      </p>
                    </button>
                  ))}
                </div>

                <div className="mt-6 rounded-lg bg-gray-50 p-4 space-y-1">
                  <p className="text-sm text-gray-600">Resumo</p>
                  {billingCycle === 'annual' && paymentMethod === 'CREDIT_CARD' ? (
                    <>
                      <p className="text-2xl font-bold text-gray-900">
                        12x de R$ {formatPrice(finalTotal / 12)}
                      </p>
                      <p className="text-xs text-gray-500">sem juros no cartão</p>
                      <p className="text-xs text-gray-500">Total: R$ {formatPrice(finalTotal)}</p>
                    </>
                  ) : (
                    <p className="text-2xl font-bold text-gray-900">
                      R$ {formatPrice(finalTotal)}
                    </p>
                  )}
                  {isPixDiscountActive && (
                    <>
                      <p className="text-xs text-gray-500">Subtotal R$ {formatPrice(baseTotal)}</p>
                      <p className="text-xs text-green-700">Desconto PIX (3%)</p>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900">Turbinar Animal</h3>
                <p className="text-sm text-gray-600 mb-4">Escolha a duração do destaque</p>

                <div className="space-y-3">
                  {BOOST_TIERS.map((tier) => (
                    <button
                      key={tier.duration}
                      type="button"
                      onClick={() => setBoostDuration(tier.duration)}
                      className={`w-full text-left rounded-lg border px-4 py-3 transition ${
                        tier.duration === boostDuration
                          ? 'border-yellow-500 bg-yellow-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <p className="font-semibold text-gray-900">{tier.label}</p>
                        <p className="font-bold text-gray-900">R$ {formatPrice(tier.price)}</p>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="mt-6 rounded-lg bg-gray-50 p-4 space-y-1">
                  <p className="text-sm text-gray-600">Resumo</p>
                  <p className="text-2xl font-bold text-gray-900">
                    R$ {formatPrice(finalTotal)}
                  </p>
                  <p className="text-sm text-gray-600">
                    Turbinar por {selectedBoostTier.label}
                  </p>
                  {isPixDiscountActive && (
                    <p className="text-xs text-green-700">Desconto PIX (3%)</p>
                  )}
                </div>
              </div>
            )}

            <div className="rounded-2xl border border-gray-200 p-6 space-y-3 text-sm text-gray-600">
              <p className="font-semibold text-gray-900">Sua compra está protegida</p>
              <p>Pagamento processado pelo Asaas com criptografia ponta-a-ponta.</p>
              <p>Dados sensíveis nunca passam pelo nosso servidor.</p>
              <p>Suporte humano caso precise de ajuda.</p>
            </div>
          </aside>
        </div>
      </div>

      <Dialog open={pixModalOpen} onOpenChange={setPixModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Pagamento via Pix</DialogTitle>
            <DialogDescription>
              Escaneie o QR Code ou copie o código para concluir o pagamento.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-lg bg-gray-50 p-3 text-center text-sm text-gray-700">
              Tempo restante: <span className="font-semibold">{formatCountdown(pixTimeLeft)}</span>
            </div>

            {pixData?.qrCode && (
              <div className="flex justify-center">
                <img
                  src={`data:image/png;base64,${pixData.qrCode}`}
                  alt="QR Code Pix"
                  className="w-56 h-56 border-2 border-green-200 rounded-lg bg-white"
                />
              </div>
            )}

            {pixData?.copyPaste && (
              <div className="flex gap-2">
                <Input value={pixData.copyPaste} readOnly className="text-xs bg-white" />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigator.clipboard.writeText(pixData.copyPaste || '')}
                >
                  Copiar
                </Button>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                type="button"
                className="flex-1"
                onClick={handlePixCheck}
                disabled={isCheckingPix}
              >
                {isCheckingPix ? 'Verificando...' : 'Já efetuei o pagamento'}
              </Button>
              <Button type="button" variant="outline" onClick={() => setPixModalOpen(false)}>
                Fechar
              </Button>
            </div>

            <p className="text-xs text-gray-500">
              Se o pagamento ainda não foi identificado, aguarde alguns segundos e tente novamente.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CheckoutPage;
