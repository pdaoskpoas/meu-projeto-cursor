/**
 * =================================================================
 * MODAL DE COMPRA DE PLANOS
 * =================================================================
 * 
 * Modal completo para compra de planos mensais e anuais
 * Integrado com Asaas.com via paymentService
 * 
 * Features:
 * - Seleção de plano (Basic, Pro, Ultra, VIP)
 * - Escolha entre mensal/anual
 * - Múltiplas formas de pagamento (Pix, Cartão, Boleto)
 * - Exibição de QR Code Pix
 * - Parcelamento para planos anuais
 * 
 * @author Cavalaria Digital
 * @date 2025-11-27
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Loader2, CreditCard, QrCode, Barcode, Check, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { storeCheckoutContext } from '@/utils/checkoutContext';
import { useNavigate } from 'react-router-dom';

// =================================================================
// TIPOS E INTERFACES
// =================================================================

interface PurchasePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  currentPlan?: string;
  onSuccess?: () => void;
}

interface Plan {
  id: 'basic' | 'pro' | 'ultra' | 'vip';
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  features: string[];
  maxAnimals: number;
  maxEvents: number;
  boosts: number;
}

// =================================================================
// DADOS DOS PLANOS
// =================================================================

const PLANS: Plan[] = [
  {
    id: 'basic',
    name: 'Iniciante',
    monthlyPrice: 97.00,
    annualPrice: 776.00,
    features: [
      '10 anúncios ativos',
      'Aparece no mapa interativo',
      'Perfil completo com link para Instagram',
      'Sistema completo de sociedades',
      'Relatórios de visualização',
      'Suporte por e-mail e tickets'
    ],
    maxAnimals: 10,
    maxEvents: 1,
    boosts: 0
  },
  {
    id: 'pro',
    name: 'Pro',
    monthlyPrice: 147.00,
    annualPrice: 882.00,
    features: [
      '15 anúncios ativos',
      'Destaque nos resultados',
      'Aparece no topo do mapa interativo',
      'Perfil avançado verificado',
      'Link para Instagram e WhatsApp',
      'Sistema completo de sociedades',
      'Relatórios detalhados de performance',
      'Suporte prioritário',
      '2 turbinares grátis por mês'
    ],
    maxAnimals: 15,
    maxEvents: 3,
    boosts: 2
  },
  {
    id: 'ultra',
    name: 'Elite',
    monthlyPrice: 247.00,
    annualPrice: 1482.00,
    features: [
      '25 anúncios ativos',
      'Máxima visibilidade e destaque',
      'Posição privilegiada no mapa',
      'Perfil Elite com selo premium',
      'Integração completa com redes sociais',
      'Sistema completo de sociedades',
      'Analytics avançados e insights',
      'Suporte VIP dedicado',
      'Consultoria de marketing digital',
      '5 turbinares grátis por mês'
    ],
    maxAnimals: 25,
    maxEvents: 5,
    boosts: 5
  },
  {
    id: 'vip',
    name: 'VIP',
    monthlyPrice: 147.00,
    annualPrice: 882.00,
    features: [
      'Mesmo do plano Pro',
      'Concedido apenas por administrador',
      '15 anúncios ativos',
      'Todos os recursos do Pro'
    ],
    maxAnimals: 15,
    maxEvents: 3,
    boosts: 2
  }
];

// =================================================================
// COMPONENTE PRINCIPAL
// =================================================================

export function PurchasePlanModal({
  isOpen,
  onClose,
  currentPlan,
  onSuccess
}: PurchasePlanModalProps) {
  const { toast } = useToast();
  const navigate = useNavigate();

  // Estados
  const [selectedPlan, setSelectedPlan] = useState<'basic' | 'pro' | 'ultra' | 'vip'>('pro');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [billingType, setBillingType] = useState<'PIX' | 'CREDIT_CARD' | 'BOLETO'>('PIX');
  const [installments, setInstallments] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [paymentData, setPaymentData] = useState<{
    pixCopyPaste?: string;
    pixQrCode?: string;
    invoiceUrl?: string;
  } | null>(null);

  // Dados do plano selecionado
  const plan = PLANS.find(p => p.id === selectedPlan)!;
  const price = billingCycle === 'monthly' ? plan.monthlyPrice : plan.annualPrice;
  const installmentPrice = billingCycle === 'annual' ? price / installments : price;

  /**
   * Processa a compra do plano
   */
  const handlePurchase = async () => {
    setPaymentData(null);
    const resolvedBillingCycle = billingCycle === 'annual' ? 'annual' : 'monthly';
    storeCheckoutContext({
      purchaseType: 'plan',
      planId: selectedPlan,
      billingPeriod: resolvedBillingCycle,
    });
    toast({
      title: 'Redirecionando para o checkout',
      description: 'Finalize a compra com seus dados atualizados.',
    });
    onClose();
    navigate('/checkout');
  };

  /**
   * Copia código Pix Copia e Cola
   */
  const copyPixCode = () => {
    if (paymentData?.pixCopyPaste) {
      navigator.clipboard.writeText(paymentData.pixCopyPaste);
      toast({
        title: '✅ Copiado!',
        description: 'Código Pix copiado para a área de transferência',
        duration: 2000
      });
    }
  };

  /**
   * Calcula economia do plano anual
   */
  const annualSavings = (plan.monthlyPrice * 12) - plan.annualPrice;
  const savingsPercentage = Math.round((annualSavings / (plan.monthlyPrice * 12)) * 100);

  // =================================================================
  // RENDERIZAÇÃO
  // =================================================================

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Escolha seu Plano</DialogTitle>
          <DialogDescription>
            Selecione o plano ideal e a forma de pagamento
          </DialogDescription>
        </DialogHeader>

        {!paymentData ? (
          <div className="space-y-6">
            {/* Seleção de Plano */}
            <div>
              <Label className="text-base font-semibold mb-3 block">
                1. Selecione o Plano
              </Label>
              <RadioGroup
                value={selectedPlan}
                onValueChange={(value) => setSelectedPlan(value as typeof selectedPlan)}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {PLANS.map((p) => (
                    <Label
                      key={p.id}
                      htmlFor={p.id}
                      className={`
                        relative flex flex-col p-4 border-2 rounded-lg cursor-pointer
                        transition-all hover:border-primary/50
                        ${selectedPlan === p.id ? 'border-primary bg-primary/5' : 'border-gray-200'}
                      `}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value={p.id} id={p.id} />
                          <span className="font-bold text-lg">{p.name}</span>
                        </div>
                        {p.id === 'ultra' && (
                          <Badge variant="secondary">Popular</Badge>
                        )}
                      </div>
                      
                      <div className="text-2xl font-bold text-primary mb-2">
                        R$ {billingCycle === 'monthly' ? p.monthlyPrice.toFixed(2) : p.annualPrice.toFixed(2)}
                        <span className="text-sm text-gray-500 font-normal">
                          /{billingCycle === 'monthly' ? 'mês' : 'ano'}
                        </span>
                      </div>

                      <ul className="space-y-1 text-sm text-gray-600">
                        {p.features.map((feature, idx) => (
                          <li key={idx} className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-green-600" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </Label>
                  ))}
                </div>
              </RadioGroup>
            </div>

            {/* Ciclo de Cobrança */}
            <div>
              <Label className="text-base font-semibold mb-3 block">
                2. Ciclo de Cobrança
              </Label>
              <Tabs
                value={billingCycle}
                onValueChange={(value) => setBillingCycle(value as typeof billingCycle)}
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="monthly">Mensal</TabsTrigger>
                  <TabsTrigger value="annual">
                    Anual 
                    <Badge variant="destructive" className="ml-2">-{savingsPercentage}%</Badge>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="monthly" className="mt-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-900">
                      ♻️ <strong>Renovação automática:</strong> Cobrança mensal recorrente via Pix ou cartão de crédito.
                      Cancele quando quiser.
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="annual" className="mt-4">
                  <div className="p-4 bg-green-50 rounded-lg space-y-2">
                    <p className="text-sm text-green-900">
                      💰 <strong>Economia de R$ {annualSavings.toFixed(2)}</strong> em relação ao plano mensal!
                    </p>
                    <p className="text-sm text-green-900">
                      ✅ Pagamento único para 12 meses. Parcele em até 12x no cartão (sem juros).
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* Forma de Pagamento */}
            <div>
              <Label className="text-base font-semibold mb-3 block">
                3. Forma de Pagamento
              </Label>
              <RadioGroup
                value={billingType}
                onValueChange={(value) => setBillingType(value as typeof billingType)}
              >
                <div className="grid grid-cols-1 gap-3">
                  <Label
                    htmlFor="pix"
                    className={`
                      flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer
                      transition-all hover:border-primary/50
                      ${billingType === 'PIX' ? 'border-primary bg-primary/5' : 'border-gray-200'}
                    `}
                  >
                    <RadioGroupItem value="PIX" id="pix" />
                    <QrCode className="h-5 w-5" />
                    <div className="flex-1">
                      <div className="font-semibold">Pix</div>
                      <div className="text-sm text-gray-500">Aprovação instantânea</div>
                    </div>
                    <Badge variant="secondary">Recomendado</Badge>
                  </Label>

                  {billingCycle === 'annual' && (
                    <Label
                      htmlFor="card"
                      className={`
                        flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer
                        transition-all hover:border-primary/50
                        ${billingType === 'CREDIT_CARD' ? 'border-primary bg-primary/5' : 'border-gray-200'}
                      `}
                    >
                      <RadioGroupItem value="CREDIT_CARD" id="card" />
                      <CreditCard className="h-5 w-5" />
                      <div className="flex-1">
                        <div className="font-semibold">Cartão de Crédito</div>
                        <div className="text-sm text-gray-500">Parcele em até 12x sem juros</div>
                      </div>
                    </Label>
                  )}

                  <Label
                    htmlFor="boleto"
                    className={`
                      flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer
                      transition-all hover:border-primary/50
                      ${billingType === 'BOLETO' ? 'border-primary bg-primary/5' : 'border-gray-200'}
                    `}
                  >
                    <RadioGroupItem value="BOLETO" id="boleto" />
                    <Barcode className="h-5 w-5" />
                    <div className="flex-1">
                      <div className="font-semibold">Boleto</div>
                      <div className="text-sm text-gray-500">Compensação em 1-3 dias úteis</div>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Parcelamento (apenas plano anual + cartão) */}
            {billingCycle === 'annual' && billingType === 'CREDIT_CARD' && (
              <div>
                <Label className="text-base font-semibold mb-3 block">
                  4. Parcelas
                </Label>
                <RadioGroup value={String(installments)} onValueChange={(value) => setInstallments(Number(value))}>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {[1, 3, 6, 12].map((num) => (
                      <Label
                        key={num}
                        htmlFor={`installment-${num}`}
                        className={`
                          flex items-center justify-center p-3 border-2 rounded-lg cursor-pointer
                          transition-all hover:border-primary/50
                          ${installments === num ? 'border-primary bg-primary/5' : 'border-gray-200'}
                        `}
                      >
                        <RadioGroupItem value={String(num)} id={`installment-${num}`} className="sr-only" />
                        <div className="text-center">
                          <div className="font-bold">{num}x</div>
                          <div className="text-xs text-gray-500">
                            R$ {(price / num).toFixed(2)}
                          </div>
                        </div>
                      </Label>
                    ))}
                  </div>
                </RadioGroup>
              </div>
            )}

            {/* Resumo do Pedido */}
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="font-semibold mb-2">Resumo do Pedido</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Plano {plan.name} ({billingCycle === 'monthly' ? 'Mensal' : 'Anual'})</span>
                  <span className="font-semibold">R$ {price.toFixed(2)}</span>
                </div>
                {billingCycle === 'annual' && billingType === 'CREDIT_CARD' && installments > 1 && (
                  <div className="flex justify-between text-gray-600">
                    <span>Parcelamento:</span>
                    <span>{installments}x de R$ {installmentPrice.toFixed(2)}</span>
                  </div>
                )}
                {billingCycle === 'annual' && (
                  <div className="flex justify-between text-green-600 font-semibold">
                    <span>Economia:</span>
                    <span>R$ {annualSavings.toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Botões de Ação */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={loading}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handlePurchase}
                disabled={loading}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>Confirmar Pagamento</>
                )}
              </Button>
            </div>

            {/* Informações Legais */}
            <div className="text-xs text-gray-500 text-center space-y-1">
              <p>🔒 Pagamento 100% seguro via Asaas.com</p>
              <p>📜 Você pode cancelar a qualquer momento</p>
              <p>💰 Reembolso integral em até 7 dias (CDC Art. 49)</p>
            </div>
          </div>
        ) : (
          // Tela de Pagamento Criado
          <div className="space-y-6 text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <Check className="w-8 h-8 text-green-600" />
            </div>

            <div>
              <h3 className="text-xl font-bold mb-2">Pagamento Criado com Sucesso!</h3>
              <p className="text-gray-600">
                {billingType === 'PIX' 
                  ? 'Escaneie o QR Code ou copie o código Pix Copia e Cola'
                  : 'Acesse o link para concluir seu pagamento'}
              </p>
            </div>

            {billingType === 'PIX' && paymentData.pixQrCode && (
              <div className="space-y-4">
                {/* QR Code */}
                <div className="flex justify-center">
                  <img 
                    src={`data:image/png;base64,${paymentData.pixQrCode}`}
                    alt="QR Code Pix"
                    className="w-64 h-64 border-4 border-gray-200 rounded-lg"
                  />
                </div>

                {/* Código Copia e Cola */}
                {paymentData.pixCopyPaste && (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold">Pix Copia e Cola:</p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={paymentData.pixCopyPaste}
                        readOnly
                        className="flex-1 p-2 border rounded text-xs bg-gray-50"
                      />
                      <Button onClick={copyPixCode} size="sm">
                        Copiar
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {billingType !== 'PIX' && paymentData.invoiceUrl && (
              <Button onClick={() => window.open(paymentData.invoiceUrl, '_blank')}>
                Abrir Link de Pagamento
              </Button>
            )}

            <div className="pt-4 border-t">
              <Button variant="outline" onClick={onClose} className="w-full">
                Fechar
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default PurchasePlanModal;

