import { useEffect, useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import PageLoadingFallback from '@/components/PageLoadingFallback';

/**
 * ProfilePage - Redireciona /profile/:publicCode para /haras/:id
 * 
 * Esta página busca o ID do usuário baseado no public_code
 * e redireciona para a página do haras/perfil institucional.
 * 
 * Suporta todos os tipos de propriedades:
 * - Haras
 * - Fazenda
 * - CTE (Centro de Treinamento Equestre)
 * - Central de Reprodução
 * - Perfis Pessoais
 */
const ProfilePage = () => {
  const { publicCode } = useParams<{ publicCode: string }>();
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchUserIdByPublicCode = async () => {
      if (!publicCode) {
        setError(true);
        setLoading(false);
        return;
      }

      try {
        console.log('[ProfilePage] Buscando perfil com public_code:', publicCode);

        const { data, error: fetchError } = await supabase
          .from('public_profiles')
          .select('id, name, property_name, account_type')
          .eq('public_code', publicCode)
          .maybeSingle();

        if (fetchError) {
          console.error('[ProfilePage] Erro ao buscar perfil:', fetchError);
          setError(true);
          setLoading(false);
          return;
        }

        if (!data) {
          console.error('[ProfilePage] Perfil não encontrado para public_code:', publicCode);
          setError(true);
          setLoading(false);
          return;
        }

        console.log('[ProfilePage] Perfil encontrado:', {
          id: data.id,
          name: data.name,
          property_name: data.property_name,
          account_type: data.account_type
        });

        setUserId(data.id);
        setLoading(false);
      } catch (err) {
        console.error('[ProfilePage] Erro inesperado:', err);
        setError(true);
        setLoading(false);
      }
    };

    fetchUserIdByPublicCode();
  }, [publicCode]);

  if (loading) {
    return <PageLoadingFallback />;
  }

  if (error || !userId) {
    return <Navigate to="/" replace />;
  }

  // Redirecionar para a página do haras/perfil com o ID correto
  return <Navigate to={`/haras/${userId}`} replace />;
};

export default ProfilePage;

