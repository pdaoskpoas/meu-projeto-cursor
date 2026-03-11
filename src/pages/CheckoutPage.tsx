import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
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
  type CheckoutBillingCycle,
  type CheckoutPlanId,
} from '@/constants/checkoutPlans';
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
import {
  checkPaymentStatus,
  processBoostPayment,
  processIndividualPayment,
  processPayment,
} from '@/services/checkoutService';
import { getBoostTotal } from '@/components/payment/boostPricing';
import { INDIVIDUAL_PRICES } from '@/constants/individualPricing';
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

type PurchaseType = 'plan' | 'boost' | 'individual';

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
  const [purchaseType, setPurchaseType] = useState<PurchaseType>(resolvedContext.purchaseType ?? 'plan');
  const [boostQuantity, setBoostQuantity] = useState(
    resolvedContext.purchaseType === 'boost' ? resolvedContext.quantity : 1
  );
  const [individualContext, setIndividualContext] = useState(
    resolvedContext.purchaseType === 'individual'
      ? {
          contentType: resolvedContext.contentType,
          contentId: resolvedContext.contentId,
          contentName: resolvedContext.contentName,
        }
      : null
  );
  const [planId, setPlanId] = useState<CheckoutPlanId>(defaultPlan.id);
  const [billingCycle, setBillingCycle] = useState<CheckoutBillingCycle>(
    state.billingPeriod ?? 'monthly'
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
    cardName: '',
    cardNumber: '',
    expiry: '',
    cvv: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [paymentMethod, setPaymentMethod] = useState<'CREDIT_CARD' | 'PIX'>('CREDIT_CARD');
  const [isFetchingCep, setIsFetchingCep] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
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

  const isPixDiscountActive =
    paymentMethod === 'PIX' && !(purchaseType === 'plan' && billingCycle === 'monthly');

  const baseTotal = useMemo(() => {
    if (purchaseType === 'plan') return planPrice;
    if (purchaseType === 'boost') return getBoostTotal(boostQuantity);
    return INDIVIDUAL_PRICES[individualContext?.contentType ?? 'animal'];
  }, [purchaseType, planPrice, boostQuantity, individualContext]);

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

  useEffect(() => {
    if (purchaseType === 'plan' && billingCycle === 'monthly' && paymentMethod === 'PIX') {
      setPaymentMethod('CREDIT_CARD');
    }
  }, [purchaseType, billingCycle, paymentMethod]);

  const updateField = (field: keyof typeof form, value: string) => {
    if (isSubmitting) setIsSubmitting(false);
    if (isPolling) setIsPolling(false);
    if (isCheckingPix) setIsCheckingPix(false);
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
    if (paymentMethod === 'CREDIT_CARD') {
      if (!form.cardName.trim()) nextErrors.cardName = 'Informe o nome no cartão.';
      if (!isValidCardNumber(form.cardNumber)) nextErrors.cardNumber = 'Número do cartão inválido.';
      if (!isValidExpiry(form.expiry)) nextErrors.expiry = 'Validade inválida.';
      if (!isValidCvv(form.cvv)) nextErrors.cvv = 'CVV inválido.';
    }

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

  const startPolling = async (
    params: { paymentId?: string; subscriptionId?: string },
    successMessage: string
  ) => {
    setIsPolling(true);
    const timeoutAt = Date.now() + 60_000;

    while (Date.now() < timeoutAt) {
      const result = await checkPaymentStatus(params);
      if (!result.success) {
        setIsPolling(false);
        toast({
          title: 'Erro ao verificar pagamento',
          description: result.message || 'Não foi possível confirmar o status. Tente novamente.',
          variant: 'destructive',
        });
        return;
      }
      if (result.success && result.status) {
        if (result.status === 'APPROVED') {
          setIsPolling(false);
          if (purchaseType === 'plan') {
            clearPlanCache();
            await refreshUser();
          }
          toast({
            title: 'Pagamento aprovado!',
            description: successMessage,
          });
          navigate('/dashboard');
          return;
        }

        if (result.status === 'REJECTED') {
          setIsPolling(false);
          toast({
            title: 'Pagamento rejeitado',
            description: 'Verifique os dados e tente novamente.',
            variant: 'destructive',
          });
          return;
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    setIsPolling(false);
    toast({
      title: 'Pagamento em análise',
      description: 'Ainda estamos aguardando a confirmação do banco. Você pode acompanhar no dashboard.',
    });
    navigate('/dashboard');
  };

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

  // ── Polling automático: verifica pagamento PIX a cada 5s enquanto modal está aberto ──
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
                  : purchaseType === 'boost'
                    ? 'Seus créditos foram liberados.'
                    : 'Seu conteúdo foi publicado com sucesso.',
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
          // Silencia erros de polling — o botão manual serve de fallback
        }
      }
    };
    const handle = poll();
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
      console.log('[PIX-CHECK] Verificando pagamento...', pixPaymentRef);
      const result = await checkPaymentStatus(pixPaymentRef);
      console.log('[PIX-CHECK] Resultado:', JSON.stringify(result));
      setIsCheckingPix(false);

      if (!result || typeof result !== 'object') {
        console.error('[PIX-CHECK] Resultado inválido:', result);
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
              : purchaseType === 'boost'
                ? 'Seus créditos foram liberados.'
                : 'Seu conteúdo foi publicado com sucesso.',
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
      console.error('[PIX-CHECK] Erro inesperado:', err);
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

    if (purchaseType === 'plan' && billingCycle === 'monthly' && paymentMethod === 'PIX') {
      setIsSubmitting(false);
      setIsPolling(false);
      setIsCheckingPix(false);
      toast({
        title: 'Forma de pagamento indisponível',
        description: 'Para planos mensais, o pagamento disponível é apenas cartão.',
        variant: 'destructive',
      });
      return;
    }

    if (!validateForm()) {
      setIsSubmitting(false);
      setIsPolling(false);
      setIsCheckingPix(false);
      toast({
        title: 'Revise os dados',
        description: 'Alguns campos precisam de atenção antes de continuar.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const cardPayload =
        paymentMethod === 'CREDIT_CARD'
          ? {
              holderName: form.cardName.trim(),
              number: sanitizeDigits(form.cardNumber),
              expiryMonth: sanitizeDigits(form.expiry).slice(0, 2),
              expiryYear: `20${sanitizeDigits(form.expiry).slice(2)}`,
              cvv: sanitizeDigits(form.cvv),
            }
          : undefined;

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
        ...(cardPayload ? { card: cardPayload } : {}),
      };

      let result;
      if (purchaseType === 'boost') {
        result = await processBoostPayment({
          userId: user.id,
          quantity: boostQuantity,
          billingType: paymentMethod,
          ...basePayload,
        });
      } else if (purchaseType === 'individual' && individualContext) {
        result = await processIndividualPayment({
          userId: user.id,
          contentId: individualContext.contentId,
          contentType: individualContext.contentType,
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

      if (paymentMethod === 'PIX') {
        setPixData({
          qrCode: result.pixQrCode,
          copyPaste: result.pixCopyPaste,
        });
        setPixPaymentRef({ paymentId: result.paymentId, subscriptionId: result.subscriptionId });
        setPixExpiresAt(new Date(Date.now() + 10 * 60 * 1000));
        setPixModalOpen(true);
        toast({
          title: 'Pix gerado com sucesso',
          description: 'Finalize o pagamento usando o QR Code.',
        });
        return;
      }

      toast({
        title: 'Pagamento iniciado',
        description: 'Estamos confirmando o status com o banco.',
      });

      await startPolling(
        { paymentId: result.paymentId, subscriptionId: result.subscriptionId },
        purchaseType === 'plan'
          ? 'Seu plano foi ativado com sucesso.'
          : purchaseType === 'boost'
            ? 'Seus créditos foram liberados.'
            : 'Seu conteúdo foi publicado com sucesso.'
      );
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
    <div className="min-h-screen flex flex-col bg-white">
      <AppHeader />

      <main className="flex-1 px-3 sm:px-4 py-8 sm:py-12">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-6 sm:gap-10">
          <form onSubmit={handleSubmit} className="space-y-10">
            <section className="space-y-6">
              <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                {purchaseType === 'plan'
                  ? 'Checkout transparente'
                  : purchaseType === 'boost'
                    ? 'Finalizar compra de Boosts'
                    : 'Finalizar publicação'}
              </h1>
                <p className="text-sm text-gray-600">
                Preencha os dados abaixo para concluir o pagamento via cartão.
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
              <h2 className="text-xl font-semibold text-gray-900">Dados do cartão</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label>Forma de pagamento</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
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
                      <p className="text-xs">Processamento imediato</p>
                    </button>
                    {!(purchaseType === 'plan' && billingCycle === 'monthly') && (
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
                    )}
                  </div>
                </div>

                {paymentMethod === 'CREDIT_CARD' && (
                  <>
                    <div className="md:col-span-2">
                      <Label htmlFor="cardName">Nome no cartão</Label>
                      <Input
                        id="cardName"
                        value={form.cardName}
                        onChange={(e) => updateField('cardName', e.target.value)}
                        placeholder="Como impresso no cartão"
                        className={errors.cardName ? 'border-red-500' : ''}
                      />
                      {errors.cardName && (
                        <p className="text-xs text-red-500 mt-1">{errors.cardName}</p>
                      )}
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="cardNumber">Número do cartão</Label>
                      <Input
                        id="cardNumber"
                        value={form.cardNumber}
                        onChange={(e) => updateField('cardNumber', formatCardNumber(e.target.value))}
                        placeholder="0000 0000 0000 0000"
                        className={errors.cardNumber ? 'border-red-500' : ''}
                      />
                      {errors.cardNumber && (
                        <p className="text-xs text-red-500 mt-1">{errors.cardNumber}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="expiry">Validade (MM/AA)</Label>
                      <Input
                        id="expiry"
                        value={form.expiry}
                        onChange={(e) => updateField('expiry', formatExpiry(e.target.value))}
                        placeholder="MM/AA"
                        className={errors.expiry ? 'border-red-500' : ''}
                      />
                      {errors.expiry && <p className="text-xs text-red-500 mt-1">{errors.expiry}</p>}
                    </div>
                    <div>
                      <Label htmlFor="cvv">CVV</Label>
                      <Input
                        id="cvv"
                        value={form.cvv}
                        onChange={(e) => updateField('cvv', formatCvv(e.target.value))}
                        placeholder="123"
                        className={errors.cvv ? 'border-red-500' : ''}
                      />
                      {errors.cvv && <p className="text-xs text-red-500 mt-1">{errors.cvv}</p>}
                    </div>
                  </>
                )}
              </div>

              {paymentMethod === 'PIX' && (pixData?.copyPaste || pixData?.qrCode) && (
                <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                  <p className="text-sm font-semibold text-green-700 mb-2">Pagamento via Pix</p>
                  <p className="text-xs text-green-700 mb-3">
                    Use o QR Code no modal para concluir o pagamento.
                  </p>
                  <Button type="button" variant="outline" onClick={() => setPixModalOpen(true)}>
                    Abrir QR Code
                  </Button>
                </div>
              )}
            </section>

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={isSubmitting || isPolling}
            >
              {isSubmitting || isPolling ? 'Processando...' : 'Finalizar pagamento'}
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
                      <p className="text-xs text-gray-600">{plan.description}</p>
                    </button>
                  ))}
                </div>

                <div className="mt-6 space-y-3">
                  {(['monthly', 'semiannual', 'annual'] as CheckoutBillingCycle[]).map((cycle) => (
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
                        {cycle === 'semiannual' && 'Semestral (6x sem juros)'}
                        {cycle === 'annual' && 'Anual (12x sem juros)'}
                      </p>
                      <p className="text-xs">
                        Total R$ {getPlanPrice(selectedPlan, cycle).toFixed(2).replace('.', ',')}
                      </p>
                    </button>
                  ))}
                </div>

                <div className="mt-6 rounded-lg bg-gray-50 p-4 space-y-1">
                  <p className="text-sm text-gray-600">Resumo</p>
                  <p className="text-2xl font-bold text-gray-900">
                    R$ {formatPrice(finalTotal)}
                  </p>
                  {isPixDiscountActive && (
                    <>
                      <p className="text-xs text-gray-500">Subtotal R$ {formatPrice(baseTotal)}</p>
                      <p className="text-xs text-green-700">Desconto PIX (3%)</p>
                    </>
                  )}
                  {billingCycle !== 'monthly' && paymentMethod === 'CREDIT_CARD' && (
                    <p className="text-xs text-gray-500">
                      {getInstallmentCount(billingCycle)}x sem juros no cartão
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900">Resumo da compra</h3>
                {purchaseType === 'boost' ? (
                  <>
                    <p className="text-sm text-gray-600">Pacote de Boosts</p>
                    <div className="mt-4 rounded-lg bg-gray-50 p-4 space-y-1">
                      <p className="text-sm text-gray-600">Quantidade</p>
                      <p className="text-2xl font-bold text-gray-900">{boostQuantity} boosts</p>
                      <p className="text-sm text-gray-600 mt-2">
                        Total R$ {formatPrice(finalTotal)}
                      </p>
                      {isPixDiscountActive && (
                        <p className="text-xs text-green-700">Desconto PIX (3%)</p>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-gray-600">
                      {individualContext?.contentType === 'event' ? 'Evento individual' : 'Anúncio individual'}
                    </p>
                    {individualContext?.contentName && (
                      <p className="text-sm text-gray-500 mt-1">{individualContext.contentName}</p>
                    )}
                    <div className="mt-4 rounded-lg bg-gray-50 p-4 space-y-1">
                      <p className="text-sm text-gray-600">Total</p>
                      <p className="text-2xl font-bold text-gray-900">
                        R$ {formatPrice(finalTotal)}
                      </p>
                      {isPixDiscountActive && (
                        <p className="text-xs text-green-700">Desconto PIX (3%)</p>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            <div className="rounded-2xl border border-gray-200 p-6 space-y-3 text-sm text-gray-600">
              <p className="font-semibold text-gray-900">Sua compra está protegida</p>
              <p>🔒 Pagamento processado pelo Asaas com criptografia ponta-a-ponta.</p>
              <p>✅ Dados do cartão nunca são armazenados.</p>
              <p>💬 Suporte humano caso precise de ajuda.</p>
            </div>
          </aside>
        </div>
      </main>

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

      <AppFooter />
    </div>
  );
};

export default CheckoutPage;
