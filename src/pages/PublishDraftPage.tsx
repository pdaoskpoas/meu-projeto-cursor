import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import ProtectedRoute from '@/components/ProtectedRoute';
import ModernDashboardWrapper from '@/components/layout/ModernDashboardWrapper';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { draftsService } from '@/services/draftsService';
import { uploadAnimalImages } from '@/services/animalImageService';
import { animalService } from '@/services/animalService';
import { useToast } from '@/hooks/use-toast';
import { updateAnimalImages } from '@/api/update-animal-images';

type Scenario = 'free_or_no_plan' | 'plan_with_quota' | 'plan_limit_reached' | 'plan_expired'

const PublishDraftPage: React.FC = () => {
  const { draftId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [scenario, setScenario] = useState<Scenario>('free_or_no_plan');
  const [plan, setPlan] = useState<string | null>(null);
  const [remaining, setRemaining] = useState<number>(0);
  const [planExpiresAt, setPlanExpiresAt] = useState<string | null>(null);
  const [draftSummary, setDraftSummary] = useState<{ name?: string; breed?: string; gender?: string; } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!user?.id || !draftId) return;
      try {
        const draft = await draftsService.getDraftById(draftId);
        if (!draft) {
          toast({ title: 'Rascunho não encontrado', variant: 'destructive' });
          navigate('/dashboard/animals');
          return;
        }
        setDraftSummary({ name: draft.data?.name, breed: draft.data?.breed, gender: draft.data?.gender });
        const info = await animalService.canPublishByPlan(user.id);
        setPlan(info.plan);
        setRemaining(info.remaining);
        setPlanExpiresAt(info.planExpiresAt || null);
        if (!info.plan || info.plan === 'free') {
          setScenario('free_or_no_plan');
        } else if (!info.planIsValid) {
          setScenario('plan_expired');
        } else if (info.remaining > 0) {
          setScenario('plan_with_quota');
        } else {
          setScenario('plan_limit_reached');
        }
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Tente novamente';
        toast({ title: 'Falha ao carregar publicação', description: message, variant: 'destructive' });
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [user?.id, draftId, navigate, toast]);

  const finalizeAndPublishByPlan = async () => {
    if (!user?.id || !draftId) return;
    setSubmitting(true);
    try {
      const { animalId } = await draftsService.finalizeDraftToAnimal(draftId);
      // Upload de imagens (se houver cache local)
      try {
        const cached = localStorage.getItem(`draftPhotos:${draftId}`);
        if (cached) {
          const dataUrls: string[] = JSON.parse(cached);
          const blobs: Blob[] = await Promise.all(dataUrls.map(async (u) => (await fetch(u)).blob()));
          // Converter Blob para File
          const files: File[] = blobs.map((blob, i) => new File([blob], `image_${i+1}.jpg`, { type: blob.type || 'image/jpeg' }));
          const urls = await uploadAnimalImages(user.id, animalId, files, files.map((f) => f.name));
          // Salvar URLs em animals.images usando API local
          await updateAnimalImages(animalId, urls);
          // Limpar cache local após upload bem-sucedido
          localStorage.removeItem(`draftPhotos:${draftId}`);
        }
      } catch (uploadError) {
        console.warn('Falha no upload de imagens:', uploadError);
        // Continuar mesmo se o upload falhar
      }
      await animalService.publishAnimal(animalId, user.id);
      toast({ title: 'Publicado com sucesso' });
      navigate('/dashboard/animals');
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Tente novamente';
      toast({ title: 'Falha na publicação', description: message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const formatPlanExpiration = () => {
    if (!planExpiresAt) return 'Data não disponível';
    try {
      return new Date(planExpiresAt).toLocaleDateString('pt-BR');
    } catch {
      return planExpiresAt;
    }
  };

  const payIndividualAndPublish = async () => {
    if (!user?.id || !draftId) return;
    setSubmitting(true);
    try {
      const { animalId } = await draftsService.finalizeDraftToAnimal(draftId);
      try {
        const cached = localStorage.getItem(`draftPhotos:${draftId}`);
        if (cached) {
          const dataUrls: string[] = JSON.parse(cached);
          const blobs: Blob[] = await Promise.all(dataUrls.map(async (u) => (await fetch(u)).blob()));
          const files: File[] = blobs.map((blob, i) => new File([blob], `image_${i+1}.jpg`, { type: blob.type || 'image/jpeg' }));
          const urls = await uploadAnimalImages(user.id, animalId, files, files.map((f) => f.name));
          await updateAnimalImages(animalId, urls);
          localStorage.removeItem(`draftPhotos:${draftId}`);
        }
      } catch (uploadError) {
        console.warn('Falha no upload de imagens:', uploadError);
      }
      // Redirecionar para checkout - pagamento é processado via Edge Function
      // A ativação do anúncio ocorre via webhook após confirmação do pagamento
      navigate(`/checkout?type=individual&contentType=animal&contentId=${animalId}`);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Tente novamente';
      toast({ title: 'Falha ao preparar publicação', description: message, variant: 'destructive' });
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
      <ModernDashboardWrapper title="Publicar Anúncio" subtitle="Revise os dados e escolha como publicar">
        {loading ? (
          <Card className="p-6">Carregando...</Card>
        ) : (
          <div className="space-y-6">
            {/* Resumo do rascunho */}
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Revisão</h3>
                  <p className="text-sm text-slate-600">Confira as informações antes de publicar</p>
                </div>
                <Badge variant="secondary">Rascunho</Badge>
              </div>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                <div><span className="text-slate-500">Nome:</span> {draftSummary?.name || '—'}</div>
                <div><span className="text-slate-500">Raça:</span> {draftSummary?.breed || '—'}</div>
                <div><span className="text-slate-500">Sexo:</span> {draftSummary?.gender || '—'}</div>
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
                <Button className="bg-orange-500 hover:bg-orange-600" onClick={finalizeAndPublishByPlan} disabled={submitting}>
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
                      <Button variant="outline" className="mt-3">Fazer Upgrade</Button>
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

export default PublishDraftPage;


