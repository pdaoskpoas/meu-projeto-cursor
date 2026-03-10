import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminArticles, type AdminArticle } from '@/hooks/admin/useAdminArticles';
import { ArrowLeft, Save, Eye, Upload, X, Loader2, AlertCircle, Calendar, Clock } from 'lucide-react';
import { sanitizeRichText } from '@/utils/sanitize';
import RichTextEditor from '@/components/RichTextEditor';
import { supabase } from '@/integrations/supabase/client';

interface ArticleFormProps {
  articleId?: string;
  onSuccess?: () => void;
}

const ArticleForm: React.FC<ArticleFormProps> = ({ articleId, onSuccess }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { createArticle, updateArticle, articles } = useAdminArticles();
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    excerpt: '',
    content: '',
    category: '',
    tags: [] as string[],
    coverImageUrl: '',
    isPublished: false,
    scheduledPublishAt: '',
    slug: '',
  });

  const [showPreview, setShowPreview] = useState(false);

  const [tagInput, setTagInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories = [
    'Mercado Equestre',
    'Tecnologia',
    'Competições',
    'Sustentabilidade',
    'Recordes',
    'Exportação',
    'Nutrição',
    'Raças',
    'Reprodução',
    'Cuidados',
    'Eventos',
    'Manejo',
    'Saúde',
    'Geral'
  ];

  // Carregar artigo existente se estiver editando
  useEffect(() => {
    if (articleId) {
      const article = articles.find(a => a.id === articleId);
      if (article) {
        setFormData({
          title: article.title || '',
          excerpt: article.excerpt || '',
          content: article.content || '',
          category: article.category || '',
          tags: article.tags || [],
          coverImageUrl: article.coverImageUrl || '',
          isPublished: article.isPublished || false,
          scheduledPublishAt: article.scheduledPublishAt || '',
          slug: article.slug || '',
        });
      }
    }
  }, [articleId, articles]);

  // Detectar mudanças não salvas
  useEffect(() => {
    setHasUnsavedChanges(true);
  }, [formData]);

  const handleInputChange = (field: keyof typeof formData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      handleInputChange('tags', [...formData.tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    handleInputChange('tags', formData.tags.filter(tag => tag !== tagToRemove));
  };

  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Erro',
        description: 'Por favor, selecione uma imagem válida.',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Erro',
        description: 'A imagem deve ter no máximo 5MB.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setUploadingImage(true);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `article-cover-${Date.now()}.${fileExt}`;
      const filePath = `article-covers/${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from('event-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('event-images')
        .getPublicUrl(filePath);

      handleInputChange('coverImageUrl', publicUrl);
      
      toast({
        title: 'Sucesso',
        description: 'Imagem de capa enviada com sucesso!',
      });
    } catch (error: unknown) {
      console.error('Erro ao fazer upload da imagem:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao fazer upload da imagem.';
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const validateForm = (): boolean => {
    if (!formData.title.trim()) {
      toast({
        title: 'Validação',
        description: 'O título é obrigatório.',
        variant: 'destructive',
      });
      return false;
    }

    if (!formData.content.trim()) {
      toast({
        title: 'Validação',
        description: 'O conteúdo é obrigatório.',
        variant: 'destructive',
      });
      return false;
    }

    if (formData.content.trim().length < 100) {
      toast({
        title: 'Validação',
        description: 'O conteúdo deve ter pelo menos 100 caracteres.',
        variant: 'destructive',
      });
      return false;
    }

    if (!formData.category) {
      toast({
        title: 'Validação',
        description: 'A categoria é obrigatória.',
        variant: 'destructive',
      });
      return false;
    }

    return true;
  };

  const handlePublish = async () => {
    if (!validateForm()) return;

    if (!user) {
      toast({
        title: 'Erro',
        description: 'Você precisa estar autenticado para publicar artigos.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);

    try {
      const articleData: Partial<AdminArticle> = {
        title: formData.title.trim(),
        excerpt: formData.excerpt.trim() || formData.content.substring(0, 200) + '...',
        content: formData.content.trim(),
        category: formData.category,
        tags: formData.tags,
        coverImageUrl: formData.coverImageUrl,
        authorId: user.id,
        isPublished: true,
        slug: formData.slug || undefined,
        scheduledPublishAt: undefined, // Limpar agendamento ao publicar imediatamente
      };

      if (articleId) {
        await updateArticle(articleId, articleData);
        toast({
          title: 'Sucesso',
          description: 'Artigo atualizado e publicado com sucesso!',
        });
      } else {
        await createArticle(articleData);
        toast({
          title: 'Sucesso',
          description: 'Artigo publicado com sucesso!',
        });
      }

      setHasUnsavedChanges(false);
      
      if (onSuccess) {
        onSuccess();
      } else {
        // Voltar para a lista de artigos
        window.location.href = '/admin?section=news';
      }
    } catch (error: unknown) {
      console.error('Erro ao publicar artigo:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao publicar o artigo. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      toast({
        title: 'Validação',
        description: 'Título e conteúdo são obrigatórios mesmo para rascunhos.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);

    try {
      const articleData: Partial<AdminArticle> = {
        title: formData.title.trim(),
        excerpt: formData.excerpt.trim() || formData.content.substring(0, 200) + '...',
        content: formData.content.trim(),
        category: formData.category,
        tags: formData.tags,
        coverImageUrl: formData.coverImageUrl,
        authorId: user?.id,
        isPublished: false,
        slug: formData.slug || undefined,
        scheduledPublishAt: formData.scheduledPublishAt || undefined,
      };

      if (articleId) {
        await updateArticle(articleId, articleData);
        toast({
          title: 'Sucesso',
          description: 'Rascunho salvo com sucesso!',
        });
      } else {
        await createArticle(articleData);
        toast({
          title: 'Sucesso',
          description: 'Rascunho salvo com sucesso!',
        });
      }

      setHasUnsavedChanges(false);
    } catch (error: unknown) {
      console.error('Erro ao salvar rascunho:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao salvar o rascunho. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    if (hasUnsavedChanges) {
      if (!window.confirm('Você tem alterações não salvas. Deseja realmente sair?')) {
        return;
      }
    }
    navigate('/admin?section=news');
  };

  // Renderizar pré-visualização
  if (showPreview) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => setShowPreview(false)} className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Voltar para Edição
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">Pré-visualização</h1>
          </div>
          <Button onClick={handlePublish} disabled={isSaving} className="bg-blue-600">
            <Eye className="h-4 w-4 mr-2" />
            Publicar Artigo
          </Button>
        </div>

        <Card className="p-8 max-w-4xl mx-auto">
          {formData.coverImageUrl && (
            <div className="aspect-video rounded-lg overflow-hidden mb-6">
              <img src={formData.coverImageUrl} alt={formData.title} className="w-full h-full object-cover" />
            </div>
          )}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded font-medium">
                {formData.category || 'Sem categoria'}
              </span>
              <span>•</span>
              <span>{new Date().toLocaleDateString('pt-BR')}</span>
            </div>
            <h1 className="text-4xl font-bold text-gray-900">{formData.title || 'Título do artigo'}</h1>
            {formData.excerpt && (
              <p className="text-xl text-gray-600">{formData.excerpt}</p>
            )}
            <div 
              className="prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{ __html: sanitizeRichText(formData.content || '<p>Conteúdo do artigo</p>') }}
            />
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-4 border-t">
                {formData.tags.map((tag) => (
                  <span key={tag} className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={handleBack} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {articleId ? 'Editar Artigo' : 'Novo Artigo'}
            </h1>
            <p className="text-gray-600">
              {articleId ? 'Edite as informações do artigo' : 'Crie um novo artigo para a plataforma'}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={() => setShowPreview(true)}
          disabled={!formData.title || !formData.content}
        >
          <Eye className="h-4 w-4 mr-2" />
          Pré-visualizar
        </Button>
      </div>

      {/* Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Título */}
          <Card className="p-6">
            <Label htmlFor="title" id="title-label" className="text-base font-semibold mb-2 block">
              Título <span className="text-red-500" aria-label="obrigatório">*</span>
            </Label>
            <Input
              id="title"
              aria-labelledby="title-label"
              aria-required="true"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Digite o título do artigo..."
              className="text-lg"
            />
          </Card>

          {/* Resumo/Excerpt */}
          <Card className="p-6">
            <Label htmlFor="excerpt" className="text-base font-semibold mb-2 block">
              Resumo (opcional)
            </Label>
            <Textarea
              id="excerpt"
              value={formData.excerpt}
              onChange={(e) => handleInputChange('excerpt', e.target.value)}
              placeholder="Breve resumo do artigo que aparecerá na listagem..."
              rows={3}
              className="resize-none"
            />
            <p className="text-sm text-gray-500 mt-2">
              Se não preenchido, será gerado automaticamente a partir do conteúdo.
            </p>
          </Card>

          {/* Conteúdo */}
          <Card className="p-6">
            <Label id="content-label" htmlFor="content-editor" className="text-base font-semibold mb-2 block">
              Conteúdo <span className="text-red-500">*</span>
            </Label>
            <RichTextEditor
              content={formData.content}
              onChange={(html) => handleInputChange('content', html)}
              placeholder="Digite o conteúdo do artigo... Use a barra de ferramentas para formatar."
              inputId="content-editor"
              labelledBy="content-label"
            />
            <div className="space-y-2 mt-2">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  {formData.content.length} caracteres
                  {formData.content.length < 100 && (
                    <span className="text-red-500 ml-2">(mínimo: 100)</span>
                  )}
                </p>
              </div>
              <Card className="p-3 bg-blue-50 border-blue-200">
                <p className="text-xs text-blue-800 font-medium mb-2">💡 Dicas de Formatação HTML:</p>
                <div className="grid grid-cols-2 gap-2 text-xs text-blue-700">
                  <div><code className="bg-blue-100 px-1 rounded">&lt;p&gt;texto&lt;/p&gt;</code> - Parágrafo</div>
                  <div><code className="bg-blue-100 px-1 rounded">&lt;strong&gt;negrito&lt;/strong&gt;</code> - Negrito</div>
                  <div><code className="bg-blue-100 px-1 rounded">&lt;em&gt;itálico&lt;/em&gt;</code> - Itálico</div>
                  <div><code className="bg-blue-100 px-1 rounded">&lt;h2&gt;título&lt;/h2&gt;</code> - Subtítulo</div>
                  <div><code className="bg-blue-100 px-1 rounded">&lt;ul&gt;&lt;li&gt;item&lt;/li&gt;&lt;/ul&gt;</code> - Lista</div>
                  <div><code className="bg-blue-100 px-1 rounded">&lt;a href="url"&gt;link&lt;/a&gt;</code> - Link</div>
                </div>
              </Card>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Publicação */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Publicação</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Status:</span>
                <span className={`text-sm font-semibold ${formData.isPublished ? 'text-green-600' : formData.scheduledPublishAt ? 'text-orange-600' : 'text-gray-500'}`}>
                  {formData.isPublished ? 'Publicado' : formData.scheduledPublishAt ? 'Agendado' : 'Rascunho'}
                </span>
              </div>
              
              {/* Agendamento */}
              <div className="space-y-2 pt-2 border-t">
                <Label htmlFor="scheduledPublishAt" className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Agendar Publicação
                </Label>
                <Input
                  id="scheduledPublishAt"
                  type="datetime-local"
                  value={formData.scheduledPublishAt}
                  onChange={(e) => handleInputChange('scheduledPublishAt', e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                  className="text-sm"
                />
                {formData.scheduledPublishAt && (
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Será publicado em: {new Date(formData.scheduledPublishAt).toLocaleString('pt-BR')}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <Button
                  onClick={handlePublish}
                  disabled={isSaving}
                  aria-label="Publicar artigo agora"
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
                      <span role="status">Publicando...</span>
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4 mr-2" aria-hidden="true" />
                      Publicar Agora
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleSaveDraft}
                  disabled={isSaving}
                  variant="outline"
                  className="w-full"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      {formData.scheduledPublishAt ? 'Salvar Agendamento' : 'Salvar como Rascunho'}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Card>

          {/* Categoria */}
          <Card className="p-6">
            <Label htmlFor="category" id="category-label" className="text-base font-semibold mb-2 block">
              Categoria <span className="text-red-500" aria-label="obrigatório">*</span>
            </Label>
            <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
              <SelectTrigger id="category" aria-labelledby="category-label" aria-required="true">
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Card>

          {/* Imagem de Capa */}
          <Card className="p-6">
            <Label className="text-base font-semibold mb-2 block">Imagem de Capa</Label>
            {formData.coverImageUrl ? (
              <div className="space-y-2">
                <div className="relative aspect-video rounded-lg overflow-hidden border border-gray-200">
                  <img
                    src={formData.coverImageUrl}
                    alt="Capa do artigo"
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => handleInputChange('coverImageUrl', '')}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="w-full"
                >
                  {uploadingImage ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Trocar Imagem
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition-colors"
                >
                  <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">
                    Clique para fazer upload
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    PNG, JPG até 5MB
                  </p>
                </div>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageUpload(file);
              }}
            />
          </Card>

          {/* Tags */}
          <Card className="p-6">
            <Label className="text-base font-semibold mb-2 block">Tags</Label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  placeholder="Digite uma tag e pressione Enter"
                  className="text-sm"
                />
                <Button
                  type="button"
                  onClick={handleAddTag}
                  variant="outline"
                  size="sm"
                >
                  Adicionar
                </Button>
              </div>
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded text-sm"
                    >
                      {tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:text-blue-900"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Alerta de mudanças não salvas */}
      {hasUnsavedChanges && (
        <Card className="p-4 bg-yellow-50 border-yellow-200">
          <div className="flex items-center gap-2 text-yellow-800">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">Você tem alterações não salvas.</span>
          </div>
        </Card>
      )}
    </div>
  );
};

export default ArticleForm;

