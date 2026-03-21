import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import ProtectedRoute from '@/components/ProtectedRoute';
import ModernDashboardWrapper from '@/components/layout/ModernDashboardWrapper';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { animalService } from '@/services/animalService';
import { uploadAnimalImages } from '@/services/animalImageService';
import { useToast } from '@/hooks/use-toast';
import { AnimalFormData } from '@/components/forms/animal/AddAnimalWizard';
import { formatNameUppercase } from '@/utils/nameFormat';

type Scenario = 'free_or_no_plan' | 'plan_with_quota' | 'plan_limit_reached' | 'plan_expired'

const PublishAnimalPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const loadingRef = useRef(loading);
  const [scenario, setScenario] = useState<Scenario>('free_or_no_plan');
  const [plan, setPlan] = useState<string | null>(null);
  const [remaining, setRemaining] = useState<number>(0);
  const [planExpiresAt, setPlanExpiresAt] = useState<string | null>(null);
  const [animalData, setAnimalData] = useState<AnimalFormData | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [autoRenew, setAutoRenew] = useState(true); // Padrão: renovação automática habilitada

  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);

  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout;
    
    (async () => {
      if (!user?.id) {
        console.log('[PublishAnimal] ❌ Sem user.id, abortando');
        if (mounted) setLoading(false);
        return;
      }
      
      // Timeout de segurança - se demorar mais de 10s, desabilita loading
      timeoutId = setTimeout(() => {
        if (mounted && loadingRef.current) {
          console.error('[PublishAnimal] ⏰ TIMEOUT - Forçando fim do loading após 10s');
          setLoading(false);
          toast({ 
            title: 'Tempo esgotado', 
            description: 'A página demorou muito para carregar. Tente novamente.',
            variant: 'destructive' 
          });
        }
      }, 10000);
      
      try {
        console.log('[PublishAnimal] ============ INICIANDO CARREGAMENTO ============');
        console.log('[PublishAnimal] user.id:', user.id);
        
        // Carregar dados do animal do sessionStorage
        const savedData = sessionStorage.getItem('pendingAnimalData');
        console.log('[PublishAnimal] savedData existe?', !!savedData);
        console.log('[PublishAnimal] savedData length:', savedData?.length || 0);
        
        if (!savedData) {
          console.error('[PublishAnimal] ❌ Dados não encontrados no sessionStorage');
          toast({ title: 'Dados do animal não encontrados', variant: 'destructive' });
          navigate('/dashboard/animals');
          return;
        }

        console.log('[PublishAnimal] Parseando dados...');
        interface ParsedDraftData {
          photosBase64?: Array<{ data: string; name: string; type: string }>;
          [key: string]: unknown;
        }
        const parsedData = JSON.parse(savedData) as ParsedDraftData;
        console.log('[PublishAnimal] ✅ Dados parseados:', Object.keys(parsedData));
        console.log('[PublishAnimal] Fotos base64:', parsedData.photosBase64?.length || 0);
        
        // Converter fotos base64 de volta para objetos File
        const photosFiles: File[] = [];
        if (parsedData.photosBase64 && Array.isArray(parsedData.photosBase64)) {
          console.log('[PublishAnimal] Convertendo', parsedData.photosBase64.length, 'fotos...');
          
          for (let i = 0; i < parsedData.photosBase64.length; i++) {
            try {
              const base64 = parsedData.photosBase64[i];
              const file = base64ToFile(base64, `photo_${i + 1}.jpg`);
              photosFiles.push(file);
              console.log(`[PublishAnimal] ✅ Foto ${i + 1} convertida (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
            } catch (photoError) {
              console.error(`[PublishAnimal] ❌ Erro ao converter foto ${i + 1}:`, photoError);
            }
          }
          
          console.log('[PublishAnimal] ✅ Total de fotos convertidas:', photosFiles.length);
        } else {
          console.log('[PublishAnimal] ⚠️ Nenhuma foto encontrada');
        }
        
        // Atualizar dados com fotos convertidas
        const animalData: AnimalFormData = {
          ...parsedData,
          photos: photosFiles
        };
        
        console.log('[PublishAnimal] ✅ animalData preparado');
        setAnimalData(animalData);

        // Verificar plano do usuário
        console.log('[PublishAnimal] Verificando plano do usuário...');
        try {
          const info = await animalService.canPublishByPlan(user.id);
          console.log('[PublishAnimal] ✅ Plano verificado:', info);
          
          setPlan(info.plan);
          setRemaining(info.remaining);
          setPlanExpiresAt(info.planExpiresAt || null);
          
          if (!info.plan || info.plan === 'free') {
            console.log('[PublishAnimal] Cenário: free_or_no_plan');
            setScenario('free_or_no_plan');
          } else if (!info.planIsValid) {
            console.log('[PublishAnimal] Cenário: plan_expired');
            setScenario('plan_expired');
          } else if (info.remaining > 0) {
            console.log('[PublishAnimal] Cenário: plan_with_quota');
            setScenario('plan_with_quota');
          } else {
            console.log('[PublishAnimal] Cenário: plan_limit_reached');
            setScenario('plan_limit_reached');
          }
        } catch (planError) {
          console.error('[PublishAnimal] ❌ Erro ao verificar plano:', planError);
          // Se falhar ao verificar plano, assume free
          console.log('[PublishAnimal] Assumindo cenário free por segurança');
          setScenario('free_or_no_plan');
        }
        
        console.log('[PublishAnimal] ============ CARREGAMENTO CONCLUÍDO ============');
      } catch (e: unknown) {
        console.error('[PublishAnimal] ❌ ERRO FATAL:', e);
        const message = e instanceof Error ? e.message : 'Erro desconhecido. Verifique o console.';
        toast({ 
          title: 'Erro ao carregar', 
          description: message,
          variant: 'destructive' 
        });
      } finally {
        clearTimeout(timeoutId);
        if (mounted) {
          console.log('[PublishAnimal] Desabilitando loading...');
          setLoading(false);
        }
      }
    })();
    
    return () => { 
      mounted = false;
      clearTimeout(timeoutId);
    };
  }, [user?.id, navigate, toast]);

  // Função auxiliar para converter base64 para File (sem usar fetch para evitar CSP)
  const base64ToFile = (base64: string, filename: string): File => {
    // Extrair o tipo MIME e os dados base64
    const arr = base64.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    
    return new File([u8arr], filename, { type: mime });
  };

  const formatPlanExpiration = () => {
    if (!planExpiresAt) return 'Data não disponível';
    try {
      return new Date(planExpiresAt).toLocaleDateString('pt-BR');
    } catch {
      return planExpiresAt;
    }
  };

  const publishByPlan = async () => {
    if (!user?.id || !animalData) return;
    setSubmitting(true);
    
    try {
      // Revalidar plano no momento da publicação
      const latestPlan = await animalService.canPublishByPlan(user.id);
      setPlan(latestPlan.plan);
      setRemaining(latestPlan.remaining);
      setPlanExpiresAt(latestPlan.planExpiresAt || null);
      
      if (!latestPlan.plan || latestPlan.plan === 'free') {
        setScenario('free_or_no_plan');
        toast({
          title: 'Sem plano ativo',
          description: 'Você não possui plano ativo para publicar com cota.',
          variant: 'destructive'
        });
        return;
      }
      
      if (!latestPlan.planIsValid) {
        setScenario('plan_expired');
        toast({
          title: 'Plano expirado',
          description: 'Seu plano expirou. Renove ou publique individualmente.',
          variant: 'destructive'
        });
        return;
      }
      
      if (latestPlan.remaining <= 0) {
        setScenario('plan_limit_reached');
        toast({
          title: 'Limite atingido',
          description: 'Você não possui mais vagas disponíveis no seu plano.',
          variant: 'destructive'
        });
        return;
      }

      // 1. Criar animal no banco
      const newAnimal = await animalService.createAnimal({
        name: animalData.name,
        breed: animalData.breed,
        gender: animalData.gender as 'Macho' | 'Fêmea',
        birth_date: animalData.birthDate,
        coat: animalData.color || null,
        current_city: animalData.currentCity || null,
        current_state: animalData.currentState || null,
        registration_number: animalData.isRegistered ? animalData.registrationNumber : null,
        titles: animalData.titles || [],
        owner_id: user.id,
        haras_id: user.id,
        allow_messages: animalData.allowMessages,
        auto_renew: autoRenew // Incluir opção de renovação automática
      });

      // 2. Upload de imagens se houver
      if (animalData.photos && animalData.photos.length > 0) {
        try {
          console.log(`[PublishAnimal] Iniciando upload de ${animalData.photos.length} imagem(ns)...`);
          
          const imageUrls = await uploadAnimalImages(
            user.id, 
            newAnimal.id, 
            animalData.photos,
            animalData.photos.map((_, i) => `image_${i + 1}.jpg`)
          );
          
          console.log('[PublishAnimal] Upload concluído. URLs:', imageUrls);
          console.log('[PublishAnimal] Atualizando coluna images do animal...');
          
          await animalService.updateAnimalImages(newAnimal.id, imageUrls);
          
          console.log('[PublishAnimal] Imagens salvas com sucesso na tabela animals');
        } catch (uploadError) {
          console.error('[PublishAnimal] ERRO no upload de imagens:', uploadError);
          toast({ 
            title: 'Aviso', 
            description: 'Não foi possível fazer upload das imagens. O animal foi criado sem fotos.',
            variant: 'destructive' 
          });
          // Continue mesmo se o upload falhar
        }
      } else {
        console.log('[PublishAnimal] Nenhuma foto foi enviada no formulário');
      }

      // 3. Publicar animal
      await animalService.publishAnimal(newAnimal.id, user.id);

      // 4. Limpar sessionStorage
      sessionStorage.removeItem('pendingAnimalData');

      toast({ title: 'Animal publicado com sucesso!' });
      navigate('/dashboard/animals');
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Tente novamente';
      toast({ title: 'Falha na publicação', description: message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const payIndividualAndPublish = async () => {
    if (!user?.id || !animalData) return;
    setSubmitting(true);
    
    try {
      // 1. Criar animal
      const newAnimal = await animalService.createAnimal({
        name: animalData.name,
        breed: animalData.breed,
        gender: animalData.gender as 'Macho' | 'Fêmea',
        birth_date: animalData.birthDate,
        coat: animalData.color || null,
        current_city: animalData.currentCity || null,
        current_state: animalData.currentState || null,
        registration_number: animalData.isRegistered ? animalData.registrationNumber : null,
        titles: animalData.titles || [],
        owner_id: user.id,
        haras_id: user.id,
        allow_messages: animalData.allowMessages,
        auto_renew: autoRenew // Incluir opção de renovação automática
      });

      // 2. Upload de imagens
      if (animalData.photos && animalData.photos.length > 0) {
        try {
          console.log(`[PublishAnimal] Iniciando upload de ${animalData.photos.length} imagem(ns)...`);
          
          const imageUrls = await uploadAnimalImages(
            user.id, 
            newAnimal.id, 
            animalData.photos,
            animalData.photos.map((_, i) => `image_${i + 1}.jpg`)
          );
          
          console.log('[PublishAnimal] Upload concluído. URLs:', imageUrls);
          console.log('[PublishAnimal] Atualizando coluna images do animal...');
          
          await animalService.updateAnimalImages(newAnimal.id, imageUrls);
          
          console.log('[PublishAnimal] Imagens salvas com sucesso na tabela animals');
        } catch (uploadError) {
          console.error('[PublishAnimal] ERRO no upload de imagens:', uploadError);
          toast({ 
            title: 'Aviso', 
            description: 'Não foi possível fazer upload das imagens. O animal foi criado sem fotos.',
            variant: 'destructive' 
          });
        }
      } else {
        console.log('[PublishAnimal] Nenhuma foto foi enviada no formulário');
      }

      // 3. Limpar sessionStorage antes de redirecionar
      sessionStorage.removeItem('pendingAnimalData');

      // 4. Redirecionar para checkout - pagamento é processado via Edge Function
      // A ativação do anúncio ocorre via webhook após confirmação do pagamento
      navigate(`/checkout?type=individual&contentType=animal&contentId=${newAnimal.id}`);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Tente novamente';
      toast({ title: 'Falha ao pagar/publicar', description: message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center">Carregando...</div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <ModernDashboardWrapper title="Publicar Animal" subtitle="Revise os dados e escolha como publicar">
        {loading ? (
          <Card className="p-6">Carregando...</Card>
        ) : (
          <div className="space-y-6">
            {/* Resumo do animal */}
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Revisão</h3>
                  <p className="text-sm text-slate-600">Confira as informações antes de publicar</p>
                </div>
                <Badge variant="secondary">Pronto para publicar</Badge>
              </div>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                <div><span className="text-slate-500">Nome:</span> {formatNameUppercase(animalData?.name) || '—'}</div>
                <div><span className="text-slate-500">Raça:</span> {animalData?.breed || '—'}</div>
                <div><span className="text-slate-500">Sexo:</span> {animalData?.gender || '—'}</div>
              </div>
              {animalData?.photos && animalData.photos.length > 0 && (
                <div className="mt-3 text-sm">
                  <span className="text-slate-500">Fotos:</span> {animalData.photos.length} imagem{animalData.photos.length > 1 ? 'ns' : ''} adicionada{animalData.photos.length > 1 ? 's' : ''}
                </div>
              )}
            </Card>

            {/* Opção de renovação automática */}
            <Card className="p-6 space-y-4">
              <h3 className="text-lg font-semibold">Configurações de Renovação</h3>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <Checkbox 
                    id="auto-renew" 
                    checked={autoRenew}
                    onCheckedChange={(checked) => setAutoRenew(checked as boolean)}
                  />
                  <div className="space-y-1">
                    <Label htmlFor="auto-renew" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Renovar automaticamente após 30 dias
                    </Label>
                    <p className="text-xs text-slate-600">
                      {autoRenew 
                        ? "Seu anúncio será renovado automaticamente se você tiver plano válido, ou aguardará pagamento individual"
                        : "Seu anúncio ficará pausado após 30 dias (você poderá reativar manualmente por 7 dias)"
                      }
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Cenários */}
            {scenario === 'free_or_no_plan' && (
              <Card className="p-6 space-y-4">
                <h3 className="text-lg font-semibold">Forma de Publicação</h3>
                <p className="text-slate-600 text-sm">Você está no plano Free. Escolha uma opção:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="p-4 border-amber-200 bg-amber-50">
                    <h4 className="font-semibold">Publicar Individualmente</h4>
                    <p className="text-sm text-slate-600">R$ 47,00 por anúncio | 1 mês ativo | aparece na Home e em Buscar.</p>
                    <Button className="mt-3 bg-orange-500 hover:bg-orange-600" onClick={payIndividualAndPublish} disabled={submitting}>
                      {submitting ? 'Processando...' : 'Publicar Agora'}
                    </Button>
                  </Card>
                  <Card className="p-4">
                    <h4 className="font-semibold">Assinar um Plano</h4>
                    <p className="text-sm text-slate-600">Publique vários anúncios sem pagar individual.</p>
                    <Link to="/planos">
                      <Button variant="outline" className="mt-3">Ver Planos</Button>
                    </Link>
                  </Card>
                </div>
              </Card>
            )}

            {scenario === 'plan_with_quota' && (
              <Card className="p-6 space-y-2">
                <h3 className="text-lg font-semibold">Publicar pelo Plano</h3>
                <p className="text-slate-600 text-sm">Plano atual: <strong>{plan?.toUpperCase()}</strong> • Vagas disponíveis este mês: <strong>{remaining}</strong></p>
                <Button className="bg-orange-500 hover:bg-orange-600" onClick={publishByPlan} disabled={submitting}>
                  {submitting ? 'Publicando...' : 'Publicar Agora'}
                </Button>
              </Card>
            )}

            {scenario === 'plan_expired' && (
              <Card className="p-6 space-y-4 border border-amber-200 bg-amber-50">
                <div>
                  <h3 className="text-lg font-semibold text-amber-900">Plano expirado</h3>
                  <p className="text-sm text-amber-700">
                    Seu plano {plan?.toUpperCase()} expirou em {formatPlanExpiration()}.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="p-4 border-amber-200 bg-white">
                    <h4 className="font-semibold">Publicar Individualmente</h4>
                    <p className="text-sm text-slate-600">R$ 47,00 por anúncio | 1 mês ativo.</p>
                    <Button className="mt-3 bg-orange-500 hover:bg-orange-600" onClick={payIndividualAndPublish} disabled={submitting}>
                      {submitting ? 'Processando...' : 'Publicar Agora'}
                    </Button>
                  </Card>
                  <Card className="p-4">
                    <h4 className="font-semibold">Renovar ou Fazer Upgrade</h4>
                    <p className="text-sm text-slate-600">Ative novamente seu plano para liberar vagas.</p>
                    <Link to="/planos">
                      <Button variant="outline" className="mt-3">Ver Planos</Button>
                    </Link>
                  </Card>
                </div>
              </Card>
            )}

            {scenario === 'plan_limit_reached' && (
              <Card className="p-6 space-y-4">
                <h3 className="text-lg font-semibold">Limite de Publicações Atingido</h3>
                <p className="text-slate-600 text-sm">Para publicar este animal, escolha uma das opções:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="p-4 border-amber-200 bg-amber-50">
                    <h4 className="font-semibold">Publicar Individualmente</h4>
                    <p className="text-sm text-slate-600">R$ 47,00 por anúncio | 1 mês ativo.</p>
                    <Button className="mt-3 bg-orange-500 hover:bg-orange-600" onClick={payIndividualAndPublish} disabled={submitting}>
                      {submitting ? 'Processando...' : 'Publicar Agora'}
                    </Button>
                  </Card>
                  <Card className="p-4">
                    <h4 className="font-semibold">Upgrade de Plano</h4>
                    <p className="text-sm text-slate-600">Aumente seu limite de publicações mensais.</p>
                    <Link to="/planos">
                      <Button variant="outline" className="mt-3">Fazer Upgrade</Button>
                    </Link>
                  </Card>
                </div>
              </Card>
            )}
          </div>
        )}
      </ModernDashboardWrapper>
    </ProtectedRoute>
  );
};

export default PublishAnimalPage;
