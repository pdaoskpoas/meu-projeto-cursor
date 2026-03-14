import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2, Save, AlertCircle, CheckCircle2, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { monetizationService, type AdSenseConfig, type AdSenseConfigUpdate } from '@/services/monetizationService';

const AdminMonetization: React.FC = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [config, setConfig] = useState<AdSenseConfig | null>(null);
  const [formData, setFormData] = useState<AdSenseConfigUpdate>({
    global_script: null,
    listing_banner: null,
    article_top_banner: null,
    article_mid_banner: null,
    article_bottom_banner: null,
    is_active: true,
  });

  // Carregar configuração ao montar componente
  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setIsLoading(true);
      const activeConfig = await monetizationService.getActiveConfig();
      
      if (activeConfig) {
        setConfig(activeConfig);
        setFormData({
          global_script: activeConfig.global_script,
          listing_banner: activeConfig.listing_banner,
          article_top_banner: activeConfig.article_top_banner,
          article_mid_banner: activeConfig.article_mid_banner,
          article_bottom_banner: activeConfig.article_bottom_banner,
          is_active: activeConfig.is_active,
        });
      }
    } catch (error) {
      console.error('Erro ao carregar configuração:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar a configuração de monetização.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);

      if (config) {
        // Atualizar configuração existente
        const updated = await monetizationService.updateConfig(config.id, formData);
        setConfig(updated);
        toast({
          title: 'Sucesso',
          description: 'Configuração de monetização atualizada com sucesso!',
        });
      } else {
        // Criar nova configuração
        const created = await monetizationService.createConfig(formData);
        setConfig(created);
        toast({
          title: 'Sucesso',
          description: 'Configuração de monetização criada com sucesso!',
        });
      }
    } catch (error) {
      console.error('Erro ao salvar configuração:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar a configuração. Verifique os dados e tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: keyof AdSenseConfigUpdate, value: string | boolean | null) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <DollarSign className="h-8 w-8 text-primary" />
          Monetização - Google AdSense
        </h1>
        <p className="text-gray-600 mt-2">
          Configure os anúncios do Google AdSense para serem exibidos apenas nas páginas de notícias.
        </p>
      </div>

      {/* Aviso importante */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">Importante</h3>
              <p className="text-sm text-blue-800">
                Os anúncios serão exibidos <strong>APENAS</strong> nas seguintes páginas:
              </p>
              <ul className="text-sm text-blue-800 mt-2 list-disc list-inside space-y-1">
                <li>Página de listagem de notícias (<code className="bg-blue-100 px-1 rounded">/noticias</code>)</li>
                <li>Páginas individuais de notícias (<code className="bg-blue-100 px-1 rounded">/noticias/[slug]</code>)</li>
              </ul>
              <p className="text-sm text-blue-800 mt-2">
                Nenhuma outra página do site carregará ou exibirá anúncios.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Formulário de configuração */}
      <Card>
        <CardHeader>
          <CardTitle>Configuração de Anúncios</CardTitle>
          <CardDescription>
            Cole os códigos HTML/JS fornecidos pelo Google AdSense
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status ativo */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <Label htmlFor="is_active" className="text-base font-semibold">
                Configuração Ativa
              </Label>
              <p className="text-sm text-gray-600 mt-1">
                Quando ativo, os anúncios serão exibidos nas páginas de notícias
              </p>
            </div>
            <Switch
              id="is_active"
              checked={formData.is_active ?? false}
              onCheckedChange={(checked) => handleInputChange('is_active', checked)}
            />
          </div>

          {/* Script Global */}
          <div className="space-y-2">
            <Label htmlFor="global_script">
              Script Global do AdSense <span className="text-red-500">*</span>
            </Label>
            <p className="text-sm text-gray-600">
              Cole o script completo fornecido pelo Google AdSense. Este script será carregado apenas uma vez por página.
            </p>
            <Textarea
              id="global_script"
              placeholder='<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXX" crossorigin="anonymous"></script>'
              value={formData.global_script || ''}
              onChange={(e) => handleInputChange('global_script', e.target.value || null)}
              rows={3}
              className="font-mono text-sm"
            />
          </div>

          {/* Banner Listagem */}
          <div className="space-y-2">
            <Label htmlFor="listing_banner">
              Banner para Página de Listagem (<code>/noticias</code>)
            </Label>
            <p className="text-sm text-gray-600">
              Código HTML/JS do banner que será exibido na página de listagem de notícias
            </p>
            <Textarea
              id="listing_banner"
              placeholder='<ins class="adsbygoogle" style="display:block" data-ad-client="ca-pub-XXXXXXXXXX" data-ad-slot="XXXXXXXXXX" data-ad-format="auto"></ins>'
              value={formData.listing_banner || ''}
              onChange={(e) => handleInputChange('listing_banner', e.target.value || null)}
              rows={4}
              className="font-mono text-sm"
            />
          </div>

          {/* Banner Topo do Artigo */}
          <div className="space-y-2">
            <Label htmlFor="article_top_banner">
              Banner Início do Artigo
            </Label>
            <p className="text-sm text-gray-600">
              Código HTML/JS do banner que será exibido no início do conteúdo do artigo
            </p>
            <Textarea
              id="article_top_banner"
              placeholder='<ins class="adsbygoogle" style="display:block" data-ad-client="ca-pub-XXXXXXXXXX" data-ad-slot="XXXXXXXXXX" data-ad-format="auto"></ins>'
              value={formData.article_top_banner || ''}
              onChange={(e) => handleInputChange('article_top_banner', e.target.value || null)}
              rows={4}
              className="font-mono text-sm"
            />
          </div>

          {/* Banner Meio do Artigo */}
          <div className="space-y-2">
            <Label htmlFor="article_mid_banner">
              Banner Meio do Artigo
            </Label>
            <p className="text-sm text-gray-600">
              Código HTML/JS do banner que será exibido no meio do conteúdo do artigo
            </p>
            <Textarea
              id="article_mid_banner"
              placeholder='<ins class="adsbygoogle" style="display:block" data-ad-client="ca-pub-XXXXXXXXXX" data-ad-slot="XXXXXXXXXX" data-ad-format="auto"></ins>'
              value={formData.article_mid_banner || ''}
              onChange={(e) => handleInputChange('article_mid_banner', e.target.value || null)}
              rows={4}
              className="font-mono text-sm"
            />
          </div>

          {/* Banner Final do Artigo */}
          <div className="space-y-2">
            <Label htmlFor="article_bottom_banner">
              Banner Final do Artigo
            </Label>
            <p className="text-sm text-gray-600">
              Código HTML/JS do banner que será exibido no final do conteúdo do artigo
            </p>
            <Textarea
              id="article_bottom_banner"
              placeholder='<ins class="adsbygoogle" style="display:block" data-ad-client="ca-pub-XXXXXXXXXX" data-ad-slot="XXXXXXXXXX" data-ad-format="auto"></ins>'
              value={formData.article_bottom_banner || ''}
              onChange={(e) => handleInputChange('article_bottom_banner', e.target.value || null)}
              rows={4}
              className="font-mono text-sm"
            />
          </div>

          {/* Botão Salvar */}
          <div className="flex justify-end pt-4 border-t">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="min-w-[120px]"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Configuração
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Status da configuração */}
      {config && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-green-900 mb-1">Configuração Salva</h3>
                <p className="text-sm text-green-800">
                  Última atualização: {new Date(config.updated_at).toLocaleString('pt-BR')}
                </p>
                {config.is_active && (
                  <p className="text-sm text-green-800 mt-1 font-medium">
                    ✓ Configuração está ativa e os anúncios serão exibidos
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminMonetization;
