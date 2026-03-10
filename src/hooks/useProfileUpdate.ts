import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { normalizeNameForStorage } from '@/utils/nameFormat';

export interface ProfileUpdateData {
  // Localização
  country?: string;
  state?: string;
  city?: string;
  
  // Avatar/Logo
  avatar_url?: string;
  
  // Dados institucionais (apenas para account_type = 'institutional')
  founded_year?: string;
  owner_name?: string;
  bio?: string;
  
  // Novos campos
  cep?: string;
  instagram?: string;
}

export interface ProfileUpdateOptions {
  convertToInstitutional?: {
    property_type: string;
    property_name: string;
  };
}

export interface ProfileData {
  country: string | null;
  state: string | null;
  city: string | null;
  avatar_url: string | null;
  founded_year: string | null;
  owner_name: string | null;
  bio: string | null;
  cep: string | null;
  instagram: string | null;
  account_type: string;
}

export const useProfileUpdate = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Carregar dados atuais do perfil
  const loadCurrentProfile = useCallback(async (): Promise<ProfileData | null> => {
    if (!user?.id) return null;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('country, state, city, avatar_url, founded_year, owner_name, bio, cep, instagram, account_type')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      return data as ProfileData;
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar dados do perfil',
        variant: 'destructive',
      });
      return null;
    }
  }, [user?.id, toast]);

  // Atualizar perfil
  const updateProfile = async (
    profileData: ProfileUpdateData, 
    options: ProfileUpdateOptions = {}
  ): Promise<boolean> => {
    if (!user?.id) {
      toast({
        title: 'Erro',
        description: 'Usuário não autenticado',
        variant: 'destructive',
      });
      return false;
    }

    if (user.accountType === 'institutional' && profileData.bio && profileData.bio.length > 500) {
      toast({
        title: 'Atenção',
        description: 'A biografia deve ter no máximo 500 caracteres',
        variant: 'destructive',
      });
      return false;
    }

    // Validar ano de fundação
    if (profileData.founded_year) {
      const year = parseInt(profileData.founded_year);
      const currentYear = new Date().getFullYear();
      if (isNaN(year) || year < 1800 || year > currentYear) {
        toast({
          title: 'Atenção',
          description: `Ano de fundação deve estar entre 1800 e ${currentYear}`,
          variant: 'destructive',
        });
        return false;
      }
    }

    setLoading(true);

    try {
      // Preparar dados para atualização
      const updateData: Record<string, unknown> = {
        country: profileData.country || 'Brasil',
        state: profileData.state || null,
        city: profileData.city || null,
        avatar_url: profileData.avatar_url || null,
        cep: profileData.cep || null,
        instagram: profileData.instagram || null,
        updated_at: new Date().toISOString(),
      };

      // Se estiver convertendo para institucional
    if (options.convertToInstitutional) {
      const normalizedPropertyName = normalizeNameForStorage(options.convertToInstitutional.property_name);

        updateData.account_type = 'institutional';
        updateData.property_type = options.convertToInstitutional.property_type;
      updateData.property_name = normalizedPropertyName;
        
        // Gerar public_code se não existir
        const { data: currentProfile } = await supabase
          .from('profiles')
          .select('public_code')
          .eq('id', user.id)
          .single();
        
        if (!currentProfile?.public_code) {
          // Gerar código baseado no nome da propriedade
        const baseName = (normalizedPropertyName || options.convertToInstitutional.property_name)
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Remove acentos
            .replace(/[^a-z0-9]/g, '-') // Substitui caracteres especiais por hífen
            .replace(/-+/g, '-') // Remove hífens duplicados
            .replace(/^-|-$/g, ''); // Remove hífens do início e fim
          
          // Adicionar timestamp para garantir unicidade
          const timestamp = Date.now().toString(36);
          updateData.public_code = `${baseName}-${timestamp}`;
        }
      }

      // Adicionar campos institucionais apenas se for conta institucional
      if (user.accountType === 'institutional' || options.convertToInstitutional) {
        updateData.founded_year = profileData.founded_year || null;
        updateData.owner_name = profileData.owner_name || null;
        updateData.bio = profileData.bio || null;
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      if (error) throw error;

      const successMessage = options.convertToInstitutional
        ? 'Perfil convertido para institucional com sucesso!'
        : 'Perfil atualizado com sucesso';

      toast({
        title: 'Sucesso!',
        description: successMessage,
      });

      // Se converteu para institucional, recarregar a página para atualizar o contexto
      if (options.convertToInstitutional) {
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }

      return true;
    } catch (error: unknown) {
      console.error('Erro ao salvar perfil:', error);
      const message = error instanceof Error ? error.message : 'Erro ao atualizar perfil';
      toast({
        title: 'Erro',
        description: message,
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Upload de avatar/logo
  const uploadAvatar = async (file: File): Promise<string | null> => {
    if (!user?.id) return null;

    setUploading(true);

    try {
      // Validar arquivo
      if (!file.type.startsWith('image/')) {
        throw new Error('Apenas imagens são permitidas');
      }

      if (file.size > 5 * 1024 * 1024) { // 5MB
        throw new Error('Imagem muito grande. Máximo 5MB');
      }

      // Gerar nome único para o arquivo
      // A política RLS requer que o arquivo esteja em uma pasta com o ID do usuário
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`; // Estrutura: {userId}/{timestamp}.ext

      // Upload para o Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true // Permitir sobrescrever arquivo existente
        });

      if (uploadError) throw uploadError;

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      toast({
        title: 'Sucesso!',
        description: user.accountType === 'institutional' ? 'Logo enviado com sucesso' : 'Foto enviada com sucesso',
      });

      return publicUrl;
    } catch (error: unknown) {
      console.error('Erro no upload:', error);
      const message = error instanceof Error ? error.message : 'Erro ao fazer upload da imagem';
      toast({
        title: 'Erro no upload',
        description: message,
        variant: 'destructive',
      });
      return null;
    } finally {
      setUploading(false);
    }
  };

  return {
    loading,
    uploading,
    loadCurrentProfile,
    updateProfile,
    uploadAvatar,
  };
};