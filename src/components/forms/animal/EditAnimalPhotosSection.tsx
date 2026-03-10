import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { X, Upload, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { compressMultipleImages, validateImageFile } from '@/components/animal/NewAnimalWizard/utils/imageCompression';

const MAX_PHOTOS_DEFAULT = 4;

type NewPhoto = {
  id: string;
  file: File;
  previewUrl: string;
};

interface EditAnimalPhotosSectionProps {
  initialImages: string[];
  maxPhotos?: number;
  disabled?: boolean;
  onChange: (state: { existingImages: string[]; newPhotos: NewPhoto[] }) => void;
}

const buildPreviewId = (file: File, index: number) =>
  `${file.name}-${file.size}-${file.lastModified}-${index}`;

const revokePreviews = (photos: NewPhoto[]) => {
  photos.forEach(photo => URL.revokeObjectURL(photo.previewUrl));
};

const EditAnimalPhotosSection: React.FC<EditAnimalPhotosSectionProps> = ({
  initialImages,
  maxPhotos = MAX_PHOTOS_DEFAULT,
  disabled = false,
  onChange,
}) => {
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);

  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newPhotos, setNewPhotos] = useState<NewPhoto[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);

  useEffect(() => {
    setExistingImages(initialImages ?? []);
    setNewPhotos(prev => {
      revokePreviews(prev);
      return [];
    });
  }, [initialImages]);

  useEffect(() => {
    onChange({ existingImages, newPhotos });
  }, [existingImages, newPhotos, onChange]);

  useEffect(() => {
    return () => {
      revokePreviews(newPhotos);
    };
  }, [newPhotos]);

  const totalPhotos = existingImages.length + newPhotos.length;
  const remainingSlots = Math.max(0, maxPhotos - totalPhotos);

  const canAddMore = remainingSlots > 0 && !disabled && !isProcessing;

  const handleRemoveExisting = useCallback((index: number) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleRemoveNew = useCallback((id: string) => {
    setNewPhotos(prev => {
      const next = prev.filter(photo => photo.id !== id);
      const removed = prev.find(photo => photo.id === id);
      if (removed) {
        URL.revokeObjectURL(removed.previewUrl);
      }
      return next;
    });
  }, []);

  const handleSelectFiles = useCallback(
    async (files: File[]) => {
      if (!files.length || !remainingSlots) return;

      const limitedFiles = files.slice(0, remainingSlots);
      if (files.length > remainingSlots) {
        toast({
          title: 'Limite de fotos',
          description: `Você pode adicionar no máximo ${remainingSlots} foto(s) agora.`,
          variant: 'destructive',
        });
      }

      const validFiles: File[] = [];
      const errors: string[] = [];

      limitedFiles.forEach(file => {
        const validation = validateImageFile(file);
        if (validation === true) {
          validFiles.push(file);
        } else {
          errors.push(`${file.name}: ${validation}`);
        }
      });

      if (errors.length > 0) {
        toast({
          title: 'Arquivo inválido',
          description: errors[0],
          variant: 'destructive',
        });
      }

      if (!validFiles.length) return;

      setIsProcessing(true);
      setProcessingProgress(0);

      try {
        const compressedFiles = await compressMultipleImages(
          validFiles,
          (current, total) => {
            const progress = total > 0 ? Math.round((current / total) * 100) : 0;
            setProcessingProgress(progress);
          }
        );

        setNewPhotos(prev => {
          const next = [...prev];
          compressedFiles.forEach((file, index) => {
            next.push({
              id: buildPreviewId(file, index),
              file,
              previewUrl: URL.createObjectURL(file),
            });
          });
          return next;
        });
      } catch (error) {
        console.error('[EditAnimalPhotos] Erro ao processar imagens:', error);
        toast({
          title: 'Erro ao processar fotos',
          description: 'Tente novamente com imagens menores.',
          variant: 'destructive',
        });
      } finally {
        setIsProcessing(false);
        setProcessingProgress(0);
        if (inputRef.current) {
          inputRef.current.value = '';
        }
      }
    },
    [remainingSlots, toast]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? []);
      handleSelectFiles(files);
    },
    [handleSelectFiles]
  );

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      if (!canAddMore) return;
      const dropped = Array.from(event.dataTransfer.files).filter(file =>
        file.type.startsWith('image/')
      );
      handleSelectFiles(dropped);
    },
    [canAddMore, handleSelectFiles]
  );

  const helperText = useMemo(() => {
    if (totalPhotos >= maxPhotos) {
      return 'Para adicionar outra foto, remova uma já enviada.';
    }
    return `Você pode adicionar mais ${remainingSlots} foto(s).`;
  }, [maxPhotos, remainingSlots, totalPhotos]);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold border-b pb-2">Fotos do Anúncio</h3>

      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>
          {totalPhotos} de {maxPhotos} fotos
        </span>
        <span>{helperText}</span>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={handleInputChange}
        disabled={!canAddMore}
      />

      <Card
        className={`border-2 border-dashed p-4 ${
          canAddMore ? 'border-gray-300 hover:border-blue-400' : 'border-gray-200'
        }`}
        onDragOver={event => {
          event.preventDefault();
        }}
        onDrop={handleDrop}
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {existingImages.map((url, index) => (
            <div key={`existing-${url}-${index}`} className="relative aspect-square">
              <img src={url} alt={`Foto ${index + 1}`} className="h-full w-full object-cover rounded" />
              <Button
                type="button"
                size="icon"
                variant="destructive"
                className="absolute top-2 right-2 h-7 w-7"
                onClick={() => handleRemoveExisting(index)}
                disabled={disabled}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}

          {newPhotos.map((photo, index) => (
            <div key={photo.id} className="relative aspect-square">
              <img src={photo.previewUrl} alt={`Nova foto ${index + 1}`} className="h-full w-full object-cover rounded" />
              <Badge className="absolute top-2 left-2 bg-blue-600">Nova</Badge>
              <Button
                type="button"
                size="icon"
                variant="destructive"
                className="absolute top-2 right-2 h-7 w-7"
                onClick={() => handleRemoveNew(photo.id)}
                disabled={disabled}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}

          {totalPhotos === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center gap-2 py-6 text-gray-500">
              <ImageIcon className="h-8 w-8" />
              <span className="text-sm">Nenhuma foto adicionada</span>
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => inputRef.current?.click()}
            disabled={!canAddMore}
          >
            <Upload className="mr-2 h-4 w-4" />
            Adicionar fotos
          </Button>
          {isProcessing && (
            <span className="text-xs text-gray-500">
              Processando imagens... {processingProgress}%
            </span>
          )}
        </div>
      </Card>
    </div>
  );
};

export default EditAnimalPhotosSection;
