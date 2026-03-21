import React, { useEffect, useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

/**
 * Converte string em slug (remove acentos, espaços, caracteres especiais)
 * Ex: "Haras Monteiro" -> "harasmonteiro"
 */
const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .normalize('NFD') // Separa acentos dos caracteres
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-z0-9]+/g, '') // Remove tudo que não for letra ou número
    .trim();
};

/**
 * Componente de redirecionamento para URLs amigáveis de haras
 * Converte /harasmonteiro/U2AB63325 em /haras/uuid-completo
 * Também funciona com perfis pessoais: /joaosilva/ABC123
 */
const ShortHarasRedirect: React.FC = () => {
  const { propertyName, code } = useParams<{ propertyName: string; code: string }>();
  const [redirectTo, setRedirectTo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchProfileId = async () => {
      if (!propertyName || !code) {
        setError(true);
        setLoading(false);
        return;
      }

      try {
        // Buscar o perfil pelo public_code (view pública - sem PII)
        const { data, error: fetchError } = await supabase
          .from('public_profiles')
          .select('id, property_name, name, account_type')
          .eq('public_code', code.toUpperCase())
          .maybeSingle();

        if (fetchError || !data) {
          console.error('Erro ao buscar perfil por código:', fetchError);
          setError(true);
        } else {
          // Verifica se o nome na URL corresponde ao nome do perfil
          const profileName = data.account_type === 'institutional' 
            ? data.property_name 
            : data.name;
          
          const profileSlug = slugify(profileName || '');
          const urlSlug = slugify(propertyName);

          // Se os slugs não batem, ainda assim redireciona (mas poderia retornar erro)
          // Optei por redirecionar para melhor UX
          if (profileSlug === urlSlug) {
            setRedirectTo(`/haras/${data.id}`);
          } else {
            // Slug não bate, mas ainda redireciona
            console.warn(`URL slug "${urlSlug}" não corresponde ao perfil "${profileSlug}", mas redirecionando mesmo assim`);
            setRedirectTo(`/haras/${data.id}`);
          }
        }
      } catch (err) {
        console.error('Erro ao redirecionar:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileId();
  }, [propertyName, code]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-slate-600">Redirecionando...</p>
        </div>
      </div>
    );
  }

  if (error || !redirectTo) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Perfil não encontrado</h1>
          <p className="text-slate-600 mb-6">
            O código <span className="font-mono bg-slate-200 px-2 py-1 rounded">{code}</span> não foi encontrado.
          </p>
          <a
            href="/"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Voltar ao Início
          </a>
        </div>
      </div>
    );
  }

  return <Navigate to={redirectTo} replace />;
};

export default ShortHarasRedirect;

