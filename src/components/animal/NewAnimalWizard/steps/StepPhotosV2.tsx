// src/components/animal/NewAnimalWizard/steps/StepPhotosV2.tsx

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowLeft, 
  ArrowRight, 
  Upload, 
  X, 
  Image as ImageIcon, 
  Loader2,
  Camera,
  AlertCircle,
  CheckCircle2,
  Star
} from 'lucide-react';
import { useWizard } from '../WizardContext';
import { useToast } from '@/hooks/use-toast';
import { compressMultipleImages, validateImageFile } from '../utils/imageCompression';
import { cn } from '@/lib/utils';

const MAX_PHOTOS = 4;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

interface PhotoSlot {
  id: string;
  file: File | null;
  preview: string | null;
  status: 'empty' | 'uploading' | 'ready' | 'error';
  error?: string;
}

export const StepPhotosV2: React.FC = () => {
  const { state, dispatch } = useWizard();
  const { photos } = state.formData;
  const { toast } = useToast();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [photoSlots, setPhotoSlots] = useState<PhotoSlot[]>([]);
  
  // Inicializar slots vazios
  useEffect(() => {
    if (photoSlots.length === 0) {
      const initialSlots: PhotoSlot[] = Array.from({ length: MAX_PHOTOS }, (_, i) => ({
        id: `slot-${i}`,
        file: null,
        preview: null,
        status: 'empty',
      }));
      
      // Se já existem fotos no estado, preencher os slots
      if (photos.files.length > 0) {
        photos.files.forEach((file, index) => {
          if (index < MAX_PHOTOS) {
            initialSlots[index] = {
              id: `slot-${index}`,
              file,
              preview: photos.previews[index],
              status: 'ready',
            };
          }
        });
      }
      
      setPhotoSlots(initialSlots);
    }
  }, [photoSlots.length, photos.files, photos.previews]);

  // Atualizar validação global
  useEffect(() => {
    const filledSlots = photoSlots.filter(slot => slot.status === 'ready').length;
    const isValid = filledSlots >= 1 && filledSlots <= MAX_PHOTOS;
    
    dispatch({
      type: 'SET_VALIDATION',
      payload: { step: 3, isValid }
    });
  }, [photoSlots, dispatch]);

  // Processar arquivos selecionados
  const processFiles = useCallback(async (files: File[]) => {
    if (files.length === 0) return;
    
    console.log('[StepPhotosV2] Processando arquivos:', files.length);
    setIsProcessing(true);
    setProcessingProgress(0);
    
    try {
      // Encontrar slots vazios
      const emptySlots = photoSlots.filter(slot => slot.status === 'empty');
      const filesToProcess = files.slice(0, Math.min(files.length, emptySlots.length));
      
      if (filesToProcess.length === 0) {
        toast({
          title: 'Limite atingido',
          description: 'Todas as posições de fotos já estão preenchidas',
          variant: 'destructive'
        });
        return;
      }
      
      // Validar arquivos
      const validFiles: File[] = [];
      const errors: string[] = [];
      
      for (const file of filesToProcess) {
        const validation = validateImageFile(file);
        if (validation === true) {
          validFiles.push(file);
        } else {
          errors.push(`${file.name}: ${validation}`);
        }
      }
      
      if (errors.length > 0) {
        toast({
          title: 'Arquivos inválidos',
          description: errors[0],
          variant: 'destructive'
        });
      }
      
      if (validFiles.length === 0) {
        setIsProcessing(false);
        return;
      }
      
      // Atualizar slots para "uploading"
      const newSlots = [...photoSlots];
      let slotIndex = 0;
      
      for (let i = 0; i < newSlots.length && slotIndex < validFiles.length; i++) {
        if (newSlots[i].status === 'empty') {
          newSlots[i] = {
            ...newSlots[i],
            status: 'uploading',
            file: validFiles[slotIndex],
            preview: URL.createObjectURL(validFiles[slotIndex])
          };
          slotIndex++;
        }
      }
      setPhotoSlots(newSlots);
      
      // Comprimir imagens
      console.log('[StepPhotosV2] Comprimindo imagens...');
      const compressedFiles = await compressMultipleImages(
        validFiles,
        (current, total) => {
          const progress = Math.round((current / total) * 100);
          setProcessingProgress(progress);
        }
      );
      
      // Atualizar slots com arquivos comprimidos
      const finalSlots = [...newSlots];
      let compressedIndex = 0;
      
      for (let i = 0; i < finalSlots.length && compressedIndex < compressedFiles.length; i++) {
        if (finalSlots[i].status === 'uploading') {
          // Limpar preview antigo
          if (finalSlots[i].preview) {
            URL.revokeObjectURL(finalSlots[i].preview!);
          }
          
          finalSlots[i] = {
            ...finalSlots[i],
            file: compressedFiles[compressedIndex],
            preview: URL.createObjectURL(compressedFiles[compressedIndex]),
            status: 'ready'
          };
          compressedIndex++;
        }
      }
      
      setPhotoSlots(finalSlots);
      
      // Atualizar estado global
      const readyFiles = finalSlots
        .filter(slot => slot.status === 'ready' && slot.file)
        .map(slot => slot.file!);
      const readyPreviews = finalSlots
        .filter(slot => slot.status === 'ready' && slot.preview)
        .map(slot => slot.preview!);
      
      dispatch({
        type: 'UPDATE_PHOTOS',
        payload: {
          files: readyFiles,
          previews: readyPreviews
        }
      });
      
      toast({
        title: 'Fotos adicionadas',
        description: `${compressedFiles.length} foto(s) processada(s) com sucesso`,
      });
      
    } catch (error) {
      console.error('[StepPhotosV2] Erro ao processar imagens:', error);
      toast({
        title: 'Erro ao processar fotos',
        description: 'Por favor, tente novamente',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
      setProcessingProgress(0);
      
      // Limpar input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [photoSlots, dispatch, toast]);

  // Handle file input change
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    processFiles(files);
  }, [processFiles]);

  // Handle drag and drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    processFiles(imageFiles);
  }, [processFiles]);

  // Remover foto
  const handleRemovePhoto = useCallback((slotId: string) => {
    const newSlots = photoSlots.map(slot => {
      if (slot.id === slotId) {
        // Limpar preview
        if (slot.preview) {
          URL.revokeObjectURL(slot.preview);
        }
        return {
          ...slot,
          file: null,
          preview: null,
          status: 'empty' as const,
          error: undefined
        };
      }
      return slot;
    });
    
    setPhotoSlots(newSlots);
    
    // Atualizar estado global
    const readyFiles = newSlots
      .filter(slot => slot.status === 'ready' && slot.file)
      .map(slot => slot.file!);
    const readyPreviews = newSlots
      .filter(slot => slot.status === 'ready' && slot.preview)
      .map(slot => slot.preview!);
    
    dispatch({
      type: 'UPDATE_PHOTOS',
      payload: {
        files: readyFiles,
        previews: readyPreviews
      }
    });
  }, [photoSlots, dispatch]);

  // Navegação
  const handleNext = () => {
    const filledSlots = photoSlots.filter(slot => slot.status === 'ready').length;
    if (filledSlots >= 1) {
      dispatch({ type: 'NEXT_STEP' });
    }
  };

  const handlePrev = () => {
    dispatch({ type: 'PREV_STEP' });
  };

  const filledSlotsCount = photoSlots.filter(slot => slot.status === 'ready').length;

  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* Cabeçalho */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Fotos do Animal
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Adicione até {MAX_PHOTOS} fotos de alta qualidade
          </p>
        </div>

        {/* Área de Upload com Drag & Drop */}
        <div 
          className={cn(
            "relative border-2 border-dashed rounded-lg p-6 transition-all",
            isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300",
            isProcessing && "opacity-50 pointer-events-none"
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            disabled={isProcessing || filledSlotsCount >= MAX_PHOTOS}
          />
          
          {/* Grid de Slots */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {photoSlots.map((slot, index) => (
              <div
                key={slot.id}
                className={cn(
                  "relative aspect-square rounded-lg overflow-hidden group",
                  "border-2 transition-all",
                  slot.status === 'empty' && "border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 cursor-pointer",
                  slot.status === 'uploading' && "border-blue-300 bg-blue-50",
                  slot.status === 'ready' && "border-green-500 bg-white",
                  slot.status === 'error' && "border-red-300 bg-red-50"
                )}
                onClick={() => {
                  if (slot.status === 'empty' && !isProcessing) {
                    fileInputRef.current?.click();
                  }
                }}
              >
                {/* Conteúdo do Slot */}
                {slot.status === 'empty' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                    <Camera className="h-8 w-8 text-gray-400 mb-2" />
                    <span className="text-xs text-gray-500 text-center">
                      {index === 0 ? 'Foto Principal' : `Foto ${index + 1}`}
                    </span>
                  </div>
                )}
                
                {slot.status === 'uploading' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/80">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                  </div>
                )}
                
                {slot.status === 'ready' && slot.preview && (
                  <>
                    <img
                      src={slot.preview}
                      alt={`Foto ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Botão remover — sempre visível em mobile, hover em desktop */}
                    <button
                      type="button"
                      className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center shadow-lg sm:opacity-0 sm:group-hover:opacity-100 transition-opacity z-10"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemovePhoto(slot.id);
                      }}
                      aria-label="Remover foto"
                    >
                      <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </button>
                    
                    {/* Badge de número/principal */}
                    {index === 0 && (
                      <div className="absolute top-2 left-2 bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
                        <Star className="h-3 w-3" />
                        Principal
                      </div>
                    )}
                    
                    {/* Indicador de sucesso */}
                    <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                  </>
                )}
                
                {slot.status === 'error' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                    <AlertCircle className="h-8 w-8 text-red-500 mb-2" />
                    <span className="text-xs text-red-600 text-center">
                      {slot.error || 'Erro'}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {/* Botão de adicionar (quando todos os slots estão vazios) */}
          {filledSlotsCount === 0 && !isProcessing && (
            <div className="mt-6 text-center">
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => fileInputRef.current?.click()}
                className="mx-auto"
              >
                <Upload className="mr-2 h-5 w-5" />
                Selecionar Fotos
              </Button>
              <p className="text-xs text-gray-500 mt-2">
                ou arraste as imagens para esta área
              </p>
            </div>
          )}
        </div>

        {/* Barra de Progresso */}
        {isProcessing && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Processando imagens...</span>
              <span className="text-gray-900 font-medium">{processingProgress}%</span>
            </div>
            <Progress value={processingProgress} className="h-2" />
          </div>
        )}

        {/* Contador e Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {filledSlotsCount} de {MAX_PHOTOS} fotos
            </span>
            {filledSlotsCount >= 1 && (
              <span className="text-sm text-green-600 font-medium flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" />
                Pronto para continuar
              </span>
            )}
          </div>
        </div>

        {/* Dicas */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-900 font-medium mb-2">
            📸 Dicas para melhores resultados:
          </p>
          <ul className="text-sm text-blue-700 space-y-1">
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-0.5">•</span>
              <span>A primeira foto será a imagem principal do anúncio</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-0.5">•</span>
              <span>Use fotos bem iluminadas e de alta qualidade</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-0.5">•</span>
              <span>Mostre diferentes ângulos e detalhes do animal</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-0.5">•</span>
              <span>Evite filtros excessivos ou edições pesadas</span>
            </li>
          </ul>
        </div>

        {/* Botões de Navegação */}
        <div className="flex justify-between pt-4 border-t">
          <Button 
            variant="outline" 
            onClick={handlePrev}
            disabled={isProcessing}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <Button 
            onClick={handleNext}
            disabled={filledSlotsCount < 1 || isProcessing}
          >
            Próximo
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};

