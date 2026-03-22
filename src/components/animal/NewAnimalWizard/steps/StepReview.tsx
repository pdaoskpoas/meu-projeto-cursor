// src/components/animal/NewAnimalWizard/steps/StepReview.tsx

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  ArrowLeft, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  Sparkles,
  Edit,
  Calendar,
  MapPin,
  Image as ImageIcon,
  Users,
  UserRound,
  Settings,
  CreditCard,
  TrendingUp,
  MessageCircle,
  RefreshCw
} from 'lucide-react';
import { useWizard } from '../WizardContext';
import { useAuth } from '@/contexts/AuthContext';
import { usePlanQuota } from '@/hooks/usePlanQuota';
import { canPublish, getPlanStatusMessage, type PlanQuota } from '@/services/planService';
import { animalService } from '@/services/animalService';
import { clearPlanCache } from '@/services/planService';
import { uploadMultiplePhotos } from '../utils/uploadWithRetry';
import { withTimeout, UPLOAD_TIMEOUT_PER_IMAGE } from '../utils/uploadTimeout';
import { TOTAL_OPERATION_TIMEOUT_MS } from '@/config/uploadConstants';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { log, captureError, logEvent } from '@/utils/logger';
import { supabase } from '@/lib/supabase';
import { logAdminAction } from '@/services/adminAuditService';
import { PaywallModal } from './PaywallModal';
import { ensureActiveSession } from '@/services/sessionService';

interface StepReviewProps {
  onSuccess?: (animalId: string, shareCode: string) => void;
  onClose?: () => void;
  actingUserId?: string;
  actingProfile?: { property_name?: string | null; account_type?: string } | null;
  isAdminMode?: boolean;
  adminUserId?: string;
}

export const StepReview: React.FC<StepReviewProps> = ({
  onSuccess,
  onClose,
  actingUserId,
  actingProfile,
  isAdminMode = false,
  adminUserId
}) => {
  const { state, dispatch } = useWizard();
  const { formData, isSubmitting, uploadProgress } = state;
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const effectiveUserId = actingUserId || user?.id;
  
  // Estado para controlar o modal de paywall
  const [showPaywallModal, setShowPaywallModal] = useState(false);
  const publishLockRef = React.useRef(false);
  
  // ✅ Referência para controlar se o componente está montado
  const isMountedRef = React.useRef(true);
  
  // ✅ AbortController para cancelar uploads
  const abortControllerRef = React.useRef<AbortController | null>(null);
  
  // ✅ Cleanup ao desmontar
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      // Cancelar qualquer upload em andamento
      if (abortControllerRef.current) {
        console.warn('[Upload] 🛑 Componente desmontado - Cancelando operações em andamento');
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // ✅ Dispatch seguro que só atualiza se o componente estiver montado
  interface WizardAction {
    type: string;
    [key: string]: unknown;
  }
  const safeDispatch = React.useCallback((action: WizardAction) => {
    if (isMountedRef.current) {
      dispatch(action);
    } else {
      console.warn('[SafeDispatch] Tentativa de dispatch em componente desmontado bloqueada');
    }
  }, [dispatch]);

  // ✅ Hook otimizado - usa cache agressivo
  const { quota, loading: loadingPlan, error: planError, refetch: refetchPlan } = usePlanQuota({
    userId: effectiveUserId,
    enabled: !!effectiveUserId // Só habilita se user.id existir
  });
  
  // ✅ Timeout de segurança para loading do plano (15 segundos)
  useEffect(() => {
    if (loadingPlan) {
      const timeoutId = setTimeout(() => {
        if (loadingPlan) {
          console.error('⏰ TIMEOUT: Verificação de plano demorou mais de 15s');
          toast({
            title: 'Timeout ao verificar plano',
            description: 'A verificação do plano demorou muito. Tente recarregar a página.',
            variant: 'destructive'
          });
        }
      }, 15000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [loadingPlan, toast]);

  // Validar: step sempre válido (revisão final)
  useEffect(() => {
    console.log('📍 StepReview montado');
    dispatch({
      type: 'SET_VALIDATION',
      payload: { step: 6, isValid: true }
    });
  }, [dispatch]);
  
  // Log quando quota mudar
  useEffect(() => {
    if (quota) {
      console.log('📊 [StepReview] Quota recebida:', quota);
    }
  }, [quota]);
  
  // Log quando loading mudar
  useEffect(() => {
    console.log('⏳ [StepReview] loadingPlan:', loadingPlan);
  }, [loadingPlan]);

  // Atualizar quota no estado + DEBUG
  useEffect(() => {
    if (quota) {
      // 🔍 DEBUG: Log completo dos dados do plano
      console.log('=== DEBUG PLANO ===');
      console.log('Dados recebidos:', quota);
      console.log('planIsValid:', quota.planIsValid);
      console.log('remaining:', quota.remaining);
      console.log('canPublish:', canPublish(quota));
      console.log('==================');

      dispatch({
        type: 'SET_QUOTA',
        payload: {
          plan: quota.plan,
          remaining: quota.remaining,
          allowedByPlan: quota.allowedByPlan
        }
      });
    }
  }, [quota, dispatch]);

  const handlePrev = () => {
    dispatch({ type: 'PREV_STEP' });
  };

  const handleEdit = (step: number) => {
    dispatch({ type: 'GO_TO_STEP', payload: step });
  };

  // Publicar com plano (dentro da cota)
  const handlePublishWithPlan = async (latestQuota?: PlanQuota) => {
    console.log('🔵 [DEBUG] handlePublishWithPlan chamado');
    console.log('🔵 [DEBUG] user?.id:', effectiveUserId);
    console.log('🔵 [DEBUG] quota:', quota);

    const effectiveQuota = latestQuota || quota;
    
    if (!effectiveUserId || !effectiveQuota) {
      console.error('❌ Faltam dados:', { userId: effectiveUserId, quota });
      toast({
        title: 'Erro ao publicar',
        description: 'Dados do usuário ou plano não encontrados',
        variant: 'destructive'
      });
      return;
    }

    // ✅ IMPORTANTE: Desabilitar auto-save durante publicação
    console.log('🔒 Desabilitando auto-save durante publicação...');
    safeDispatch({ type: 'SET_SUBMITTING', payload: true });
    
    // Limpar qualquer progresso anterior
    safeDispatch({
      type: 'SET_UPLOAD_PROGRESS',
      payload: null
    });

    // ✅ Declarar timeout FORA do try para estar disponível no catch/finally
    let globalTimeout: NodeJS.Timeout | null = null;
    const clearGlobalTimeout = () => {
      if (globalTimeout) {
        clearTimeout(globalTimeout);
        globalTimeout = null;
        console.log('✅ Timer global cancelado');
      }
    };

    try {
      console.log('🚀 Iniciando publicação...');

      console.log(`⏱️ [DEBUG] Iniciando timer de timeout global (${TOTAL_OPERATION_TIMEOUT_MS}ms)...`);
      
      // ✅ Timeout global alinhado com o máximo esperado da operação completa
      globalTimeout = setTimeout(() => {
        console.error(`❌❌❌ TIMEOUT GLOBAL (${TOTAL_OPERATION_TIMEOUT_MS}ms) - Operação está demorando demais!`);
        console.error('Possíveis causas:');
        console.error('1. Conexão com internet lenta ou instável');
        console.error('2. Imagem muito grande (tente usar imagem menor que 2MB)');
        console.error('3. Servidor Supabase temporariamente sobrecarregado');
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }

        toast({
          title: '⏰ Timeout',
          description: 'A publicação está demorando muito. Verifique sua conexão e tente novamente.',
          variant: 'destructive'
        });
        safeDispatch({ type: 'SET_SUBMITTING', payload: false });
        globalTimeout = null;
      }, TOTAL_OPERATION_TIMEOUT_MS);
      
      log('Iniciando publicação com plano...');
      logEvent('animal_publish_started', { userId: effectiveUserId, plan: effectiveQuota.plan });

      // ✅ OTIMIZAÇÃO: Sessão + Perfil em PARALELO (economiza ~3-5s)
      console.log('🔐 Validando sessão e buscando perfil em paralelo...');
      let userProfile: { property_name: string | null; account_type: string } | null = null;

      // Não forçar refresh — apenas verificar se sessão existe e é válida.
      // O auth listener já mantém a sessão atualizada via TOKEN_REFRESHED.
      // forceRefresh causava timeouts quando múltiplos refreshes concorriam.
      const sessionPromise = ensureActiveSession({ forceRefresh: false });

      const profilePromise = (async () => {
        if (actingProfile) {
          return {
            property_name: actingProfile.property_name ?? null,
            account_type: actingProfile.account_type || 'institutional'
          };
        }
        try {
          const { data } = await Promise.race([
            supabase.from('profiles').select('property_name, account_type').eq('id', effectiveUserId).single(),
            new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Timeout perfil')), 5000))
          ]);
          return data;
        } catch {
          return null;
        }
      })();

      const [sessionResult, profileResult] = await Promise.allSettled([sessionPromise, profilePromise]);

      if (sessionResult.status === 'rejected') {
        console.error('❌ Falha definitiva ao validar sessão:', sessionResult.reason);
        toast({
          title: 'Sessão expirada',
          description: 'Não foi possível renovar sua sessão. Faça login novamente para publicar seu anúncio.',
          variant: 'destructive'
        });
        safeDispatch({ type: 'SET_SUBMITTING', payload: false });
        clearGlobalTimeout();
        return;
      }
      console.log('✅ Sessão válida para publicar.');

      userProfile = profileResult.status === 'fulfilled' ? profileResult.value : null;
      console.log('📋 Perfil do usuário:', userProfile);

      // Preparar dados
      interface AnimalInsertData {
        name: string;
        breed: string;
        gender: string;
        birth_date?: string;
        coat?: string;
        category?: string;
        is_registered?: boolean;
        current_city?: string;
        current_state?: string;
        father_name?: string;
        mother_name?: string;
        allow_messages?: boolean;
        ad_status?: string; // Forçar status diretamente
        [key: string]: unknown;
      }
      
      // ✅ CRÍTICO: Gerar share_code no frontend para evitar trigger lento no banco
      const generateShareCode = () => {
        const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
        const year = new Date().getFullYear().toString().slice(-2);
        return `ANI-${randomStr}-${year}`;
      };
      
      const shareCode = generateShareCode();
      console.log('🔑 [ShareCode] Gerado no frontend:', shareCode);
      
      // ✅ IMPORTANTE: Forçar status 'paused' inicialmente para evitar
      // verificação duplicada de plano no createAnimal (que causa timeout)
      // Vamos ativar o animal depois manualmente
      const animalData: AnimalInsertData = {
        share_code: shareCode, // ✅ Passar código pré-gerado para evitar trigger
        name: formData.basicInfo.name,
        breed: formData.basicInfo.breed,
        gender: formData.basicInfo.gender,
        birth_date: formData.basicInfo.birth_date,
        coat: formData.basicInfo.coat,
        category: formData.basicInfo.category,
        is_registered: formData.basicInfo.is_registered,
        current_city: formData.location.current_city,
        current_state: formData.location.current_state,
        
        // Genealogia expandida - Pais
        father_name: formData.genealogy.father_name,
        mother_name: formData.genealogy.mother_name,
        
        // Genealogia expandida - Avós paternos
        paternal_grandfather_name: formData.genealogy.paternal_grandfather_name,
        paternal_grandmother_name: formData.genealogy.paternal_grandmother_name,
        
        // Genealogia expandida - Avós maternos
        maternal_grandfather_name: formData.genealogy.maternal_grandfather_name,
        maternal_grandmother_name: formData.genealogy.maternal_grandmother_name,
        
        // Genealogia expandida - Bisavós paternos (lado do avô)
        paternal_gg_father_name: formData.genealogy.paternal_gg_father_name,
        paternal_gg_mother_name: formData.genealogy.paternal_gg_mother_name,
        
        // Genealogia expandida - Bisavós paternos (lado da avó)
        paternal_gm_father_name: formData.genealogy.paternal_gm_father_name,
        paternal_gm_mother_name: formData.genealogy.paternal_gm_mother_name,
        
        // Genealogia expandida - Bisavós maternos (lado do avô)
        maternal_gg_father_name: formData.genealogy.maternal_gg_father_name,
        maternal_gg_mother_name: formData.genealogy.maternal_gg_mother_name,
        
        // Genealogia expandida - Bisavós maternos (lado da avó)
        maternal_gm_father_name: formData.genealogy.maternal_gm_father_name,
        maternal_gm_mother_name: formData.genealogy.maternal_gm_mother_name,
        
        // Descrição do anúncio
        description: formData.extras.description,
        
        // Configurações de publicação
        allow_messages: formData.publishConfig.allow_messages,
        auto_renew: formData.publishConfig.auto_renew,
        
        owner_id: effectiveUserId,
        haras_id: userProfile?.account_type === 'institutional' ? effectiveUserId : null,
        haras_name: userProfile?.property_name || null,
        // Se não tem fotos, criar já ativo direto (evita round-trip extra do updateAnimal)
        ad_status: formData.photos.files.length > 0 ? 'paused' : 'active'
      };

      console.log('📝 Dados do animal:', animalData);
      const titlesData = (formData.extras.awards || []).map(award => ({
        animal_id: null,
        event_name: award.event_name,
        event_date: award.event_date || null,
        city: award.city || null,
        state: award.state || null,
        award: award.award,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));
      const useTransactionalRpc = import.meta.env.VITE_ANIMAL_CREATE_RPC === 'true';
      console.log('🔄 Criando animal no banco...');
      
      // Criar animal (SEM timeout - deixar o Supabase decidir)
      let newAnimal: { id: string; share_code: string } | undefined;
      let timingInterval: NodeJS.Timeout | null = null; // ✅ Declarar FORA do try
      let titlesHandledByTx = false;
      
      try {
        console.log('📤 Enviando dados para o banco...');
        console.log('⏰ [TIMING] Início createAnimal:', new Date().toISOString());
        const startTime = Date.now();
        
        //  ✅ Log progressivo durante execução
        timingInterval = setInterval(() => {
          const elapsed = Date.now() - startTime;
          console.log(`⏳ [TIMING] createAnimal ainda executando... ${(elapsed/1000).toFixed(1)}s decorridos`);
        }, 5000); // Log a cada 5 segundos
        
        // ✅ Chamar createAnimal SEM Promise.race
        // Deixar a operação natural sem timeout artificial
        // Função auxiliar para criar animal com retry automático
        const createAnimalWithRetry = async (): Promise<{ id: string; share_code: string }> => {
          const doCreate = async () => {
            if (useTransactionalRpc) {
              try {
                const result = await animalService.createAnimalWithTitlesTx(animalData, titlesData);
                titlesHandledByTx = result.titlesSaved;
                console.log('✅ [TX] Animal criado via RPC transacional');
                return result.animal;
              } catch (txError) {
                console.warn('⚠️ [TX] Falha na RPC transacional, fallback para fluxo atual:', txError);
                return await animalService.createAnimal(animalData);
              }
            } else {
              return await animalService.createAnimal(animalData);
            }
          };

          try {
            return await doCreate();
          } catch (firstError: unknown) {
            const msg = firstError instanceof Error ? firstError.message.toLowerCase() : '';
            const isRecoverable = msg.includes('timeout') || msg.includes('jwt') || msg.includes('token') || msg.includes('session') || msg.includes('fetch') || msg.includes('network');

            if (!isRecoverable) throw firstError;

            console.warn('⚠️ Primeira tentativa de criação falhou, renovando sessão e tentando novamente...');
            try {
              await ensureActiveSession({ forceRefresh: true, timeoutMs: 10000 });
            } catch { /* ignorar erro de sessão no retry */ }

            return await doCreate();
          }
        };

        newAnimal = await createAnimalWithRetry();
        if (timingInterval) clearInterval(timingInterval); // Parar logs
        
        const elapsed = Date.now() - startTime;
        console.log(`✅ [TIMING] Animal criado em ${elapsed}ms (${(elapsed/1000).toFixed(1)}s):`, newAnimal);
        log('Animal criado:', newAnimal.id);
        
        if (!newAnimal || !newAnimal.id) {
          throw new Error('Animal criado mas sem ID retornado');
        }
        
        // ✅ Salvar premiações se houver
        if (!titlesHandledByTx && formData.extras.awards && formData.extras.awards.length > 0) {
          console.log(`🏆 Salvando ${formData.extras.awards.length} premiação(ões)...`);
          
          // Mapear awards para o formato do banco
          const titlesToInsert = titlesData.map(title => ({
            ...title,
            animal_id: newAnimal.id
          }));
          
          const { error: titlesError } = await supabase
            .from('animal_titles')
            .insert(titlesToInsert);
          
          if (titlesError) {
            console.error('❌ Erro ao salvar premiações:', titlesError);
            // Não propagar erro - premiações são opcionais
            toast({
              title: 'Aviso',
              description: 'As premiações não puderam ser salvas, mas o animal foi criado com sucesso.',
              variant: 'default'
            });
          } else {
            console.log(`✅ ${formData.extras.awards.length} premiação(ões) salva(s) com sucesso`);
          }
        }
      } catch (createError: unknown) {
        if (timingInterval) clearInterval(timingInterval);
        console.error('❌ Erro ao criar animal:', createError);
        
        // ✅ Tratar mensagem de timeout de forma clara para o usuário
        const errorMessage = createError?.message || String(createError);
        
        if (errorMessage.includes('TIMEOUT') || errorMessage.includes('Conexão lenta') || errorMessage.includes('bloqueada')) {
          console.error('🔴 [TIMEOUT DETECTADO] A conexão está muito lenta ou bloqueada!');
          console.error('💡 DICA: No Playwright funcionou = problema é sua rede/firewall local');
          clearGlobalTimeout();
          toast({
            title: '🔴 Conexão bloqueada ou muito lenta',
            description: 'Possíveis causas: Firewall, Antivírus, VPN ou Internet lenta. Tente: 1) Desativar temporariamente firewall/antivírus 2) Usar cabo ethernet ao invés de Wi-Fi 3) Testar em outro navegador',
            variant: 'destructive',
            duration: 10000 // 10 segundos para ler
          });
          safeDispatch({ type: 'SET_SUBMITTING', payload: false });
          return; // Não propagar erro, já tratamos
        }
        
        // Verificar se é erro de conexão
        if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
          console.error('🔴 [NETWORK ERROR] Sem conexão com a internet!');
          clearGlobalTimeout();
          toast({
            title: '❌ Sem conexão',
            description: 'Não foi possível conectar ao servidor. Verifique sua internet.',
            variant: 'destructive'
          });
          safeDispatch({ type: 'SET_SUBMITTING', payload: false });
          return;
        }
        
        console.error('🔴 [DEBUG] createError tipo:', typeof createError);
        console.error('🔴 [DEBUG] createError.message:', errorMessage);
        
        throw createError; // Propagar erro original para ser tratado pelo catch geral
      }

      // Upload de fotos
      if (formData.photos.files.length > 0) {
        log('Iniciando processamento de fotos...');
        console.log(`📊 Total de fotos para processar: ${formData.photos.files.length}`);
        
        // ✅ Feedback inicial imediato
        safeDispatch({
          type: 'SET_UPLOAD_PROGRESS',
          payload: { 
            current: 0,
            total: formData.photos.files.length, 
            retrying: false,
            message: 'Preparando imagens...'
          }
        });

        console.log(`📊 Arquivos:`, formData.photos.files);
        console.log(`📊 [DEBUG] Tipo do primeiro arquivo:`, formData.photos.files[0] instanceof File ? 'File' : typeof formData.photos.files[0]);
        console.log(`📊 [DEBUG] Detalhes do primeiro arquivo:`, {
          name: formData.photos.files[0].name,
          size: formData.photos.files[0].size,
          type: formData.photos.files[0].type
        });
        console.log(`📊 Previews:`, formData.photos.previews);
        
        try {
          // ✅ Criar AbortController para esta operação
          abortControllerRef.current = new AbortController();
          const signal = abortControllerRef.current.signal;
          
          // ✅ Listener para log de cancelamento
          signal.addEventListener('abort', () => {
            console.warn('[Upload] 🛑 Operação cancelada pelo usuário ou timeout');
            captureError(new Error('Upload cancelado'), { 
              context: 'StepReview - Abort Signal',
              reason: 'user_action_or_timeout'
            });
          });

          // ✅ Fotos já foram comprimidas no StepPhotosV2
          const filesToUpload = formData.photos.files;
          console.log(`📤 Iniciando upload de ${filesToUpload.length} imagem(ns) já otimizadas...`);
          
          // Upload com timeout e abort
          const uploadTimeout = UPLOAD_TIMEOUT_PER_IMAGE * filesToUpload.length;
          console.log(`⏱️ Timeout configurado: ${uploadTimeout}ms`);
          
          const uploadedUrls = await withTimeout(
            uploadMultiplePhotos(
              filesToUpload,
              effectiveUserId,
              newAnimal.id,
              (current, total, retrying) => {
                console.log(`[Upload Progress Callback] current=${current}, total=${total}, retrying=${retrying}`);
                // Sempre atualizar progresso
                safeDispatch({
                  type: 'SET_UPLOAD_PROGRESS',
                  payload: { 
                    current, 
                    total, 
                    retrying,
                    message: retrying ? `Tentando novamente...` : (total === 1 ? 'Enviando imagem...' : `Enviando imagem ${current} de ${total}...`)
                  }
                });
              },
              { signal }
            ),
            uploadTimeout,
            'O upload está demorando muito. Verifique sua conexão e tente novamente.',
            abortControllerRef.current
          );

          log('Fotos enviadas:', uploadedUrls.length);
          console.log('📸 URLs das fotos:', uploadedUrls);
          
          if (uploadedUrls.length === 0) {
            throw new Error('Nenhuma URL foi retornada após o upload');
          }

          // ✅ IMPORTANTE: O campo images no Supabase é JSONB array simples de URLs
          console.log('🔄 Atualizando animal com imagens e ativando...');
          try {
            await animalService.updateAnimal(newAnimal.id, {
              images: uploadedUrls,
              ad_status: 'active'
            });
            log('Animal ativado com fotos');
            console.log('✅ Animal atualizado com sucesso');
          } catch (updateError) {
            console.warn('⚠️ Primeira tentativa de ativação falhou, tentando novamente...');
            try {
              await ensureActiveSession({ forceRefresh: true, timeoutMs: 10000 });
              await animalService.updateAnimal(newAnimal.id, {
                images: uploadedUrls,
                ad_status: 'active'
              });
              console.log('✅ Animal ativado na segunda tentativa');
            } catch (retryUpdateError) {
              console.error('⚠️ Erro definitivo ao ativar animal com fotos:', retryUpdateError);
              toast({
                title: '⚠️ Aviso',
                description: 'Fotos enviadas, mas houve problema ao ativar o anúncio. Tente ativar manualmente na lista de animais.',
                variant: 'default'
              });
            }
          }
          
        } catch (timeoutError: unknown) {
          console.error('⏱️ Timeout durante processamento de imagens:', timeoutError);
          
          // ✅ Capturar erro para monitoramento
          captureError(timeoutError, { 
            context: 'StepReview - Upload Timeout',
            animalId: newAnimal.id,
            filesCount: formData.photos.files.length,
            errorType: timeoutError.name === 'AbortError' ? 'abort' : 'timeout'
          });
          
          // Se houve timeout, ainda assim tentar salvar o animal sem as imagens
          await animalService.updateAnimal(newAnimal.id, {
            ad_status: 'active'
          });
          
          throw new Error(timeoutError.message || 'Tempo limite excedido no processamento das imagens');
        } finally {
          // Sempre limpar progresso de upload
          safeDispatch({
            type: 'SET_UPLOAD_PROGRESS',
            payload: null
          });
          // Limpar AbortController
          abortControllerRef.current = null;
        }
      } else {
        // Sem fotos — animal já foi criado como 'active', nada mais a fazer
        console.log('📷 Nenhuma foto — animal já criado como ativo.');
      }

      // ✅ REMOVIDO: Não há mais step de sociedades no wizard
      // Sócios devem ser adicionados pela página "Sociedades" no menu lateral após publicação
      console.log('ℹ️ Step de sociedades removido - sócios devem ser adicionados via menu Sociedades');

      logEvent('animal_published', { 
        animalId: newAnimal.id, 
        userId: effectiveUserId,
        shareCode: newAnimal.share_code, // Código gerado pelo banco
        type: 'plan'
      });
      
      if (isAdminMode) {
        await logAdminAction({
          action: 'create_animal_admin',
          adminId: adminUserId,
          resourceType: 'animal',
          resourceId: newAnimal.id,
          newData: { name: formData.basicInfo.name, owner_id: effectiveUserId }
        });
      }

      toast({
        title: '🎉 Animal publicado com sucesso!',
        description: `${formData.basicInfo.name} está agora disponível para parcerias.`
      });

      // ✅ CRÍTICO: Limpar cache do plano após publicação
      console.log('🧹 Limpando cache do plano após publicação...');
      clearPlanCache();

      // Limpar dados do formulário
      sessionStorage.removeItem('animalDraft');
      sessionStorage.removeItem('animalDraft_timestamp');
      dispatch({ type: 'RESET' });
      
      // Chamar callback de sucesso se fornecido
      if (onSuccess) {
        onSuccess(newAnimal.id, newAnimal.share_code || '');
      }
      
      // Fechar modal
      if (onClose) {
        onClose();
      }
      
      // Navegar para dashboard (apenas fluxo normal)
      if (!isAdminMode) {
        navigate('/dashboard/animals');
      }
      
      // ✅ Limpar timeout após sucesso
      clearGlobalTimeout();

    } catch (error: unknown) {
      // ✅ Limpar timeout em caso de erro
      clearGlobalTimeout();
      
      console.error('❌ ERRO AO PUBLICAR:', error);
      console.error('🔴 [DEBUG] Tipo do erro:', typeof error);
      console.error('🔴 [DEBUG] Error completo:', JSON.stringify(error, null, 2));
      
      if (error instanceof Error) {
        console.error('🔴 [DEBUG] Stack:', error.stack);
        console.error('🔴 [DEBUG] Message:', error.message);
      }
      
      captureError(error, { context: 'handlePublishWithPlan', userId: effectiveUserId });
      
      // Mensagem de erro mais detalhada
      const errorMessage = error instanceof Error 
        ? error.message 
        : (error && typeof error === 'object' && 'message' in error ? String(error.message) : 'Erro desconhecido');
      
      toast({
        title: '❌ Erro ao publicar',
        description: `${errorMessage}. Por favor, tente novamente.`,
        variant: 'destructive'
      });

    } finally {
      // ✅ Garantir que timeout seja limpo sempre
      clearGlobalTimeout();
      
      // ✅ IMPORTANTE: Reabilitar auto-save após publicação
      console.log('🔓 Reabilitando auto-save após publicação...');
      safeDispatch({ type: 'SET_SUBMITTING', payload: false });
      safeDispatch({ type: 'SET_UPLOAD_PROGRESS', payload: null });
      // Limpar AbortController se ainda existir
      if (abortControllerRef.current) {
        abortControllerRef.current = null;
      }
    }
  };

  const getScenarioFromQuota = (value: PlanQuota | null) => {
    if (!value) return 'loading';
    
    // Free ou sem plano
    if (value.plan === 'free' || !value.planIsValid) {
      return 'free';
    }
    
    // Plano válido dentro da cota
    if (value.remaining > 0) {
      return 'within_quota';
    }
    
    // Plano válido mas cota esgotada
    return 'quota_exceeded';
  };

  // Handler do botão principal "Publicar Anúncio"
  const handlePublishClick = async () => {
    if (!effectiveUserId) return;

    if (publishLockRef.current) {
      console.warn('[PublishLock] Publicação já em andamento, ignorando novo clique.');
      return;
    }

    publishLockRef.current = true;

    try {
      // Se já temos quota em cache e é válida, usar direto sem refetch
      // Isso evita o round-trip mais lento (verificação de plano)
      const cachedQuota = quota;
      const cachedScenario = cachedQuota ? getScenarioFromQuota(cachedQuota) : null;

      if (cachedQuota && cachedScenario === 'within_quota') {
        // Plano já verificado e com vagas — publicar imediatamente
        // A sessão será validada dentro do handlePublishWithPlan
        await handlePublishWithPlan(cachedQuota);
        return;
      }

      // Se não tem cache ou cenário não é claro, buscar fresh
      const latestQuota = await refetchPlan({ forceFresh: true });
      const quotaToUse = latestQuota || quota;

      if (!quotaToUse) {
        toast({
          title: 'Não foi possível validar seu plano',
          description: 'Tente novamente para continuar com a publicação.',
          variant: 'destructive'
        });
        return;
      }

      if (!latestQuota && quota) {
        toast({
          title: 'Conexão instável',
          description: 'Usando as informações de plano já carregadas para continuar a publicação.',
        });
      }

      const latestScenario = getScenarioFromQuota(quotaToUse);

      if (latestScenario === 'within_quota') {
        await handlePublishWithPlan(quotaToUse);
        return;
      }

      // Se é FREE ou sem vagas
      if (isAdminMode) {
        toast({
          title: 'Sem vagas disponíveis',
          description: 'O plano deste haras não possui vagas disponíveis no momento.',
          variant: 'destructive'
        });
        return;
      }

      // Usuário normal: mostrar modal de paywall
      setShowPaywallModal(true);
    } finally {
      publishLockRef.current = false;
    }
  };

  // Fazer upgrade do plano - chamado do modal
  const handleUpgradePlan = () => {
    setShowPaywallModal(false);
    // Garantir que o draft está salvo antes de redirecionar
    sessionStorage.setItem('animalDraft', JSON.stringify(formData));
    sessionStorage.setItem('animalDraft_timestamp', Date.now().toString());
    
    toast({
      title: 'Redirecionando para Planos',
      description: 'Seu rascunho foi salvo. Escolha um plano e volte para publicar.',
    });
    
    navigate('/planos');
  };

  const scenario = getScenarioFromQuota(quota);

  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* Cabeçalho */}
        <div className="text-center pb-2 border-b border-gray-200">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Revise e publique seu anúncio
          </h2>
        </div>

        {/* === CONFIGURAÇÕES DE PUBLICAÇÃO === */}
        <Card className="p-5 bg-gray-50 border-2 border-gray-200">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-gray-700" />
              <h3 className="font-semibold text-gray-900">
                Configurações de Publicação
              </h3>
            </div>

            <div className="space-y-4 pt-2">
              {/* Permitir Mensagens */}
              <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                <div className="flex items-start gap-3 flex-1">
                  <MessageCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <Label htmlFor="allow_messages_review" className="font-medium text-gray-900 cursor-pointer">
                      Permitir Mensagens
                    </Label>
                    <p className="text-sm text-gray-600 mt-1">
                      Interessados poderão entrar em contato sobre reprodução e parcerias
                    </p>
                  </div>
                </div>
                <Switch
                  id="allow_messages_review"
                  checked={formData.publishConfig.allow_messages}
                  onCheckedChange={(checked) => dispatch({
                    type: 'UPDATE_PUBLISH_CONFIG',
                    payload: { allow_messages: checked }
                  })}
                />
              </div>

              {!formData.publishConfig.auto_renew && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <p className="text-sm text-amber-900">
                    <strong>Atenção:</strong> com a renovação automática desligada, seu anúncio terá duração de apenas 1 mês e será pausado automaticamente após esse período.
                  </p>
                </div>
              )}

              {/* Renovação Automática */}
              <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                <div className="flex items-start gap-3 flex-1">
                  <RefreshCw className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <Label htmlFor="auto_renew_review" className="font-medium text-gray-900 cursor-pointer">
                      Renovação Automática
                    </Label>
                    <p className="text-sm text-gray-600 mt-1">
                      Anúncio será renovado automaticamente quando expirar
                    </p>
                  </div>
                </div>
                <Switch
                  id="auto_renew_review"
                  checked={formData.publishConfig.auto_renew}
                  onCheckedChange={(checked) => dispatch({
                    type: 'UPDATE_PUBLISH_CONFIG',
                    payload: { auto_renew: checked }
                  })}
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Resumo dos Dados */}
        <div className="space-y-4">
          {/* Informações Básicas */}
          <Card className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <UserRound className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold">Informações Básicas</h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEdit(1)}
              >
                <Edit className="h-4 w-4 mr-1" />
                Editar
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-600">Nome:</span>
                <p className="font-medium">{formData.basicInfo.name}</p>
              </div>
              <div>
                <span className="text-gray-600">Raça:</span>
                <p className="font-medium">{formData.basicInfo.breed}</p>
              </div>
              <div>
                <span className="text-gray-600">Gênero:</span>
                <Badge variant="secondary">{formData.basicInfo.gender}</Badge>
              </div>
              <div>
                <span className="text-gray-600">Nascimento:</span>
                <p className="font-medium flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {(() => {
                    const [y, m, d] = formData.basicInfo.birth_date.split('-').map(Number);
                    return new Date(y, m - 1, d).toLocaleDateString('pt-BR');
                  })()}
                </p>
              </div>
              <div>
                <span className="text-gray-600">Pelagem:</span>
                <p className="font-medium">{formData.basicInfo.coat}</p>
              </div>
              <div>
                <span className="text-gray-600">Categoria:</span>
                <p className="font-medium">{formData.basicInfo.category}</p>
              </div>
              <div>
                <span className="text-gray-600">Registro:</span>
                <p className="font-medium">{formData.basicInfo.is_registered ? 'Sim' : 'Não'}</p>
              </div>
            </div>
          </Card>

          {/* Localização */}
          <Card className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-green-600" />
                <h3 className="font-semibold">Localização</h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEdit(2)}
              >
                <Edit className="h-4 w-4 mr-1" />
                Editar
              </Button>
            </div>
            <p className="text-sm font-medium">
              {formData.location.current_city}, {formData.location.current_state}
            </p>
          </Card>

          {/* Fotos */}
          <Card className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-purple-600" />
                <h3 className="font-semibold">Fotos ({formData.photos.files.length})</h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEdit(3)}
              >
                <Edit className="h-4 w-4 mr-1" />
                Editar
              </Button>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {formData.photos.previews.map((preview, index) => (
                <img
                  key={index}
                  src={preview}
                  alt={`Foto ${index + 1}`}
                  className="w-full aspect-square object-cover rounded border"
                />
              ))}
            </div>
          </Card>

          {/* Genealogia */}
          {(formData.genealogy.father_name || formData.genealogy.mother_name) && (
            <Card className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-amber-600" />
                  <h3 className="font-semibold">Genealogia</h3>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(4)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Editar
                </Button>
              </div>
              <div className="space-y-2 text-sm">
                {formData.genealogy.father_name && (
                  <div>
                    <span className="text-gray-600">Pai:</span>
                    <p className="font-medium">{formData.genealogy.father_name}</p>
                  </div>
                )}
                {formData.genealogy.mother_name && (
                  <div>
                    <span className="text-gray-600">Mãe:</span>
                    <p className="font-medium">{formData.genealogy.mother_name}</p>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Descrição e Premiações */}
          {(formData.extras.description || formData.extras.awards.length > 0) && (
            <Card className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-amber-600" />
                  <h3 className="font-semibold">Informações Adicionais</h3>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(5)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Editar
                </Button>
              </div>
              <div className="space-y-3 text-sm">
                {formData.extras.description && (
                  <div>
                    <span className="text-gray-600 font-medium">Descrição:</span>
                    <p className="text-gray-900 mt-1 p-2 bg-gray-50 rounded border border-gray-200">
                      {formData.extras.description}
                    </p>
                  </div>
                )}
                {formData.extras.awards.length > 0 && (
                  <div>
                    <span className="text-gray-600 font-medium">Premiações ({formData.extras.awards.length}):</span>
                    <div className="mt-2 space-y-2">
                      {formData.extras.awards.map((award, index) => (
                        <div key={index} className="p-2 bg-amber-50 rounded border border-amber-200">
                          <p className="font-semibold text-amber-900">{award.event_name}</p>
                          <p className="text-xs text-amber-800 mt-1">{award.award}</p>
                          {award.event_date && (
                            <p className="text-xs text-amber-700">📅 {award.event_date}</p>
                          )}
                          {award.city && award.state && (
                            <p className="text-xs text-amber-700">📍 {award.city}/{award.state}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>

        {/* ========== SEÇÃO DE STATUS DO PLANO (APENAS INFORMATIVA) ========== */}
        
        {/* Verificação de Plano */}
        {loadingPlan ? (
          <Card className="p-6 bg-blue-50 border-blue-200">
            <div className="flex items-center gap-4">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              <div>
                <p className="font-semibold text-blue-900">Verificando seu plano...</p>
                <p className="text-sm text-blue-700">Aguarde um momento</p>
              </div>
            </div>
          </Card>
        ) : planError && !quota ? (
          <Card className="p-6 bg-red-50 border-red-200">
            <div className="flex items-start gap-4">
              <AlertCircle className="h-6 w-6 text-red-600 mt-1" />
              <div className="space-y-3">
                <div>
                  <p className="font-semibold text-red-900">{planError}</p>
                  <p className="text-sm text-red-700">
                    Atualize a verificação do plano para continuar.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => refetchPlan({ forceFresh: true })}
                  className="border-red-300 text-red-700 hover:bg-red-100"
                >
                  Tentar novamente
                </Button>
              </div>
            </div>
          </Card>
        ) : planError && quota ? (
          <Card className="p-4 bg-amber-50 border-amber-200">
            <p className="text-sm text-amber-800">
              Não foi possível atualizar seu plano agora. Exibindo os dados mais recentes já carregados.
            </p>
          </Card>
        ) : scenario === 'within_quota' && (
          // ✅ CENÁRIO 1: Plano válido COM vagas disponíveis (apenas informativo)
          <Card className="p-5 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center shadow-sm">
                  <CheckCircle2 className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <p className="text-base font-bold text-green-900">
                  🎉 Tudo pronto! Você pode publicar agora
                </p>
                <p className="text-sm text-green-700">
                  Plano <strong className="text-green-900">{quota?.plan.toUpperCase()}</strong> • {getPlanStatusMessage(quota!)}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Progress de Upload */}
        {uploadProgress && (
          <Card className="p-4 bg-blue-50 border-blue-200">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-900">
                    {uploadProgress.message || `Processando... ${uploadProgress.current}/${uploadProgress.total}`}
                  </p>
                  {uploadProgress.retrying && (
                    <p className="text-xs text-blue-700">Tentando novamente...</p>
                  )}
                </div>
              </div>
              
              {/* Barra de progresso */}
              <div className="w-full bg-blue-100 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${uploadProgress.total > 0 ? Math.min(100, Math.round((uploadProgress.current / uploadProgress.total) * 100)) : 0}%` 
                  }}
                />
              </div>
              
              <p className="text-xs text-blue-600 text-center">
                {uploadProgress.total > 0 ? Math.min(100, Math.round((uploadProgress.current / uploadProgress.total) * 100)) : 0}% concluído
              </p>
            </div>
          </Card>
        )}

        {/* Botões de Ação */}
        <div className="flex justify-between pt-4">
          <Button 
            variant="outline" 
            onClick={handlePrev}
            disabled={isSubmitting}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>

          {/* Botão Publicar Anúncio - SEMPRE VISÍVEL */}
          <Button 
            onClick={handlePublishClick}
            disabled={isSubmitting || loadingPlan}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-10 py-6 text-lg shadow-lg hover:shadow-xl transition-all"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Publicando...
              </>
            ) : (
              'Publicar Anúncio'
            )}
          </Button>
        </div>
      </div>

      {!isAdminMode && (
        <PaywallModal
          isOpen={showPaywallModal}
          onClose={() => setShowPaywallModal(false)}
          onSelectPlan={handleUpgradePlan}
          isQuotaExceeded={scenario === 'quota_exceeded'}
        />
      )}
    </Card>
  );
};
