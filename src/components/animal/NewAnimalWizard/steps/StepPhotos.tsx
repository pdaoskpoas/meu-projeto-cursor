// src/components/animal/NewAnimalWizard/steps/StepPhotos.tsx

import React, { useEffect, useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { useWizard } from '../WizardContext';
import { useToast } from '@/hooks/use-toast';
import { compressMultipleImages, validateImageFile } from '../utils/imageCompression';

const MAX_PHOTOS = 4;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export const StepPhotos: React.FC = () => {
  const { state, dispatch } = useWizard();
  const { photos } = state.formData;
  const { toast } = useToast();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string>('');
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionProgress, setCompressionProgress] = useState<string>('');

  // Validar e atualizar validação global
  useEffect(() => {
    const isValid = photos.files.length >= 1 && photos.files.length <= MAX_PHOTOS;

    dispatch({
      type: 'SET_VALIDATION',
      payload: { step: 3, isValid }
    });
  }, [photos.files, dispatch]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('[StepPhotos] handleFileSelect chamado');
    const files = Array.from(e.target.files || []);
    console.log('[StepPhotos] Arquivos selecionados:', files.length, files);
    
    if (files.length === 0) {
      console.log('[StepPhotos] Nenhum arquivo selecionado');
      return;
    }

    // Validar quantidade total
    const totalPhotos = photos.files.length + files.length;
    if (totalPhotos > MAX_PHOTOS) {
      setError(`Você pode adicionar no máximo ${MAX_PHOTOS} fotos`);
      toast({
        title: 'Limite de fotos',
        description: `Você pode adicionar no máximo ${MAX_PHOTOS} fotos`,
        variant: 'destructive'
      });
      return;
    }

    // Validar cada arquivo usando a nova função
    const validFiles: File[] = [];
    const invalidFiles: string[] = [];

    console.log('[StepPhotos] Iniciando validação dos arquivos...');
    for (const file of files) {
      console.log('[StepPhotos] Validando arquivo:', file.name, file.type, file.size);
      try {
        const validation = validateImageFile(file);
        console.log('[StepPhotos] Resultado da validação:', validation);
        if (validation === true) {
          validFiles.push(file);
        } else {
          invalidFiles.push(`${file.name}: ${validation}`);
        }
      } catch (error) {
        console.error('[StepPhotos] Erro na validação:', error);
        invalidFiles.push(`${file.name}: Erro na validação`);
      }
    }
    console.log('[StepPhotos] Arquivos válidos:', validFiles.length);
    console.log('[StepPhotos] Arquivos inválidos:', invalidFiles.length);

    // Mostrar erros se houver
    if (invalidFiles.length > 0) {
      setError(invalidFiles.join(', '));
      toast({
        title: 'Alguns arquivos foram rejeitados',
        description: invalidFiles[0],
        variant: 'destructive'
      });
    }

    // Comprimir e adicionar arquivos válidos
    if (validFiles.length > 0) {
      setIsCompressing(true);
      setCompressionProgress('Comprimindo imagens...');

      try {
        console.log('[StepPhotos] Iniciando compressão...');
        // Comprimir imagens
        const compressedFiles = await compressMultipleImages(
          validFiles,
          (current, total) => {
            console.log('[StepPhotos] Progresso compressão:', current, '/', total);
            setCompressionProgress(`Comprimindo imagem ${current} de ${total}...`);
          }
        );
        console.log('[StepPhotos] Compressão concluída:', compressedFiles.length, 'arquivos');

        // Criar previews
        const newPreviews = compressedFiles.map(file => URL.createObjectURL(file));

        // Atualizar estado
        dispatch({
          type: 'UPDATE_PHOTOS',
          payload: {
            files: [...photos.files, ...compressedFiles],
            previews: [...photos.previews, ...newPreviews]
          }
        });

        setError('');
        toast({
          title: '✅ Imagens adicionadas',
          description: `${compressedFiles.length} imagem(ns) adicionada(s) com sucesso`,
        });

      } catch (error) {
        console.error('Erro ao processar imagens:', error);
        toast({
          title: 'Erro ao processar imagens',
          description: 'Tente novamente com imagens menores',
          variant: 'destructive'
        });
      } finally {
        setIsCompressing(false);
        setCompressionProgress('');
      }
    }

    // Limpar input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemovePhoto = (index: number) => {
    // Revogar URL do preview para liberar memória
    URL.revokeObjectURL(photos.previews[index]);

    const newFiles = photos.files.filter((_, i) => i !== index);
    const newPreviews = photos.previews.filter((_, i) => i !== index);

    dispatch({
      type: 'UPDATE_PHOTOS',
      payload: {
        files: newFiles,
        previews: newPreviews
      }
    });

    setError('');
  };

  const handleNext = () => {
    if (photos.files.length >= 1 && photos.files.length <= MAX_PHOTOS) {
      dispatch({ type: 'NEXT_STEP' });
    }
  };

  const handlePrev = () => {
    dispatch({ type: 'PREV_STEP' });
  };

  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* Cabeçalho */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Fotos do Animal
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Adicione de 1 a 4 fotos de qualidade
          </p>
        </div>

        {/* Área de upload */}
        <div className="space-y-4">
          {/* Botão de adicionar foto */}
          {photos.files.length < MAX_PHOTOS && (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                className="w-full h-32 border-2 border-dashed"
                onClick={() => {
                  console.log('[StepPhotos] Botão de upload clicado');
                  fileInputRef.current?.click();
                }}
                disabled={isCompressing}
              >
                <div className="flex flex-col items-center gap-2">
                  {isCompressing ? (
                    <>
                      <Loader2 className="h-8 w-8 text-gray-400 animate-spin" />
                      <span className="text-sm font-medium">
                        {compressionProgress || 'Processando...'}
                      </span>
                    </>
                  ) : (
                    <>
                      <Upload className="h-8 w-8 text-gray-400" />
                      <span className="text-sm font-medium">
                        Clique para adicionar fotos
                      </span>
                      <span className="text-xs text-gray-500">
                        JPG, PNG ou WEBP (máx. 10MB cada)
                      </span>
                    </>
                  )}
                </div>
              </Button>
            </div>
          )}

          {/* Grid de fotos */}
          {photos.files.length > 0 && (
            <div className="grid grid-cols-2 gap-4">
              {photos.previews.map((preview, index) => (
                <div
                  key={index}
                  className="relative aspect-square rounded-lg overflow-hidden border-2 border-gray-200 group"
                >
                  <img
                    src={preview}
                    alt={`Foto ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Overlay com botão remover */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRemovePhoto(index)}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Remover
                    </Button>
                  </div>

                  {/* Badge de número */}
                  <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded">
                    {index + 1}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Contador */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              {photos.files.length} de {MAX_PHOTOS} fotos adicionadas
            </span>
            {photos.files.length >= 1 && (
              <span className="text-green-600 font-medium flex items-center gap-1">
                <ImageIcon className="h-4 w-4" />
                Mínimo atingido
              </span>
            )}
          </div>

          {/* Erro */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Dicas */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800 font-medium mb-2">
              📸 Dicas para fotos de qualidade:
            </p>
            <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
              <li>Use fotos bem iluminadas e nítidas</li>
              <li>Mostre o animal de corpo inteiro e detalhes</li>
              <li>Evite fotos tremidas ou muito escuras</li>
              <li>A primeira foto será a capa do anúncio</li>
            </ul>
          </div>
        </div>

        {/* Botões */}
        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={handlePrev}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <Button 
            onClick={handleNext}
            disabled={photos.files.length < 1}
          >
            Próximo
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};


