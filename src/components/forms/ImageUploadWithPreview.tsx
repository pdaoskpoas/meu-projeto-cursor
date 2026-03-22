import React, { useCallback, useState, useRef, useEffect } from 'react';
import { Upload, X, Camera, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ImageUploadWithPreviewProps {
  images: File[];
  onImagesChange: (images: File[]) => void;
  maxImages?: number;
  className?: string;
}

const ImageUploadWithPreview: React.FC<ImageUploadWithPreviewProps> = ({
  images,
  onImagesChange,
  maxImages = 4,
  className = ''
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Processar arquivos selecionados
  const handleFiles = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    const validFiles: File[] = [];

    for (const file of fileArray) {
      // Validação básica
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Arquivo inválido',
          description: `${file.name} não é uma imagem`,
          variant: 'destructive'
        });
        continue;
      }

      // Limite de 10MB
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: 'Arquivo muito grande',
          description: `${file.name} excede 10MB`,
          variant: 'destructive'
        });
        continue;
      }

      validFiles.push(file);
    }

    if (validFiles.length > 0) {
      const newImages = [...images, ...validFiles].slice(0, maxImages);
      onImagesChange(newImages);
      
      toast({
        title: '✅ Imagens adicionadas!',
        description: `${validFiles.length} foto(s) selecionada(s) com sucesso`
      });
    }
  }, [images, maxImages, onImagesChange, toast]);

  // Handler do input file
  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
    // Limpar o input para permitir selecionar o mesmo arquivo novamente
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [handleFiles]);

  // Handler do clique na área
  const handleClick = useCallback(() => {
    if (images.length >= maxImages) {
      toast({
        title: 'Limite atingido',
        description: `Você já adicionou ${maxImages} fotos`,
        variant: 'destructive'
      });
      return;
    }
    fileInputRef.current?.click();
  }, [images.length, maxImages, toast]);

  // Handlers de drag and drop
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (images.length >= maxImages) {
      toast({
        title: 'Limite atingido',
        description: `Você já adicionou ${maxImages} fotos`,
        variant: 'destructive'
      });
      return;
    }

    handleFiles(e.dataTransfer.files);
  }, [images.length, maxImages, handleFiles, toast]);

  // Remover imagem
  const removeImage = useCallback((index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
    
    toast({
      title: 'Foto removida',
      description: 'A foto foi removida com sucesso'
    });
  }, [images, onImagesChange, toast]);

  // Preview da imagem com cleanup de URLs para evitar memory leak
  const objectUrlsRef = useRef<string[]>([]);

  useEffect(() => {
    return () => {
      objectUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

  const getImagePreview = useCallback((file: File) => {
    const url = URL.createObjectURL(file);
    objectUrlsRef.current.push(url);
    return url;
  }, []);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Input file escondido */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Upload Area */}
      {images.length < maxImages && (
        <div
          onClick={handleClick}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            border-3 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer 
            transition-all duration-300 ease-in-out
            ${isDragging 
              ? 'border-blue-500 bg-blue-50 shadow-2xl scale-105' 
              : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50 hover:shadow-lg'
            }
          `}
        >
          <div className="space-y-6">
            {/* Ícone */}
            <div className={`
              w-24 h-24 mx-auto rounded-full flex items-center justify-center 
              transition-all duration-300
              ${isDragging ? 'bg-blue-100 scale-110' : 'bg-slate-100'}
            `}>
              <Upload className={`
                h-12 w-12 transition-colors duration-300
                ${isDragging ? 'text-blue-600' : 'text-slate-600'}
              `} />
            </div>
            
            {/* Texto */}
            <div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">
                {isDragging ? '✨ Solte suas fotos aqui!' : '📸 Clique para selecionar fotos'}
              </h3>
              <p className="text-slate-600 mb-2 text-lg">
                ou arraste e solte suas imagens
              </p>
              <p className="text-sm text-slate-500 mb-1">
                Formatos: JPG, PNG, WEBP, GIF
              </p>
              <p className="text-sm text-slate-500">
                Tamanho máximo: 10MB por foto
              </p>
              <p className="text-xs text-slate-400 mt-3">
                📊 {images.length} de {maxImages} fotos adicionadas
              </p>
            </div>

            {/* Botão visual */}
            <div className="pt-2">
              <div className="inline-flex items-center gap-3 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all">
                <Camera className="h-6 w-6" />
                <span>Selecionar Fotos</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview das imagens */}
      {images.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-green-50 border-2 border-green-200 rounded-xl">
            <h4 className="text-lg font-bold text-green-900 flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              ✅ Fotos Selecionadas: {images.length}/{maxImages}
            </h4>
            {images.length < maxImages && (
              <button
                type="button"
                onClick={handleClick}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm transition-colors"
              >
                + Adicionar mais
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {images.map((file, index) => (
              <div key={index} className="relative group">
                <div className="aspect-square rounded-xl overflow-hidden bg-slate-100 border-2 border-slate-200 hover:border-blue-400 transition-colors">
                  <img
                    src={getImagePreview(file)}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                {/* Botão remover */}
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute -top-2 -right-2 w-9 h-9 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110"
                  title="Remover foto"
                >
                  <X className="h-5 w-5" />
                </button>

                {/* Info da imagem */}
                <div className="mt-2">
                  <p className="text-xs text-slate-600 truncate font-medium">
                    {file.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {(file.size / 1024 / 1024).toFixed(1)} MB
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Dicas */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
            <h5 className="text-sm font-bold text-blue-900 mb-3">💡 Dicas para fotos de qualidade:</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-blue-800">
              <div>✓ Use boa iluminação natural</div>
              <div>✓ Mostre o animal de perfil completo</div>
              <div>✓ Inclua fotos dos aprumos</div>
              <div>✓ Evite fundos poluídos</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUploadWithPreview;
