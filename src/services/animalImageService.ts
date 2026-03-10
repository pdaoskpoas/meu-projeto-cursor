import { supabase } from '@/lib/supabase';

const BUCKET = 'animal-images';

const buildFilePath = (userId: string, animalId: string, fileName: string) =>
  `${userId}/${animalId}/${fileName}`;

export async function uploadAnimalImages(
  userId: string,
  animalId: string,
  files: File[],
  fileNames?: string[]
): Promise<string[]> {
  if (!userId || !animalId) {
    throw new Error('Parâmetros userId e animalId são obrigatórios para upload.');
  }

  if (!files?.length) {
    return [];
  }

  const uploadedUrls: string[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const fileName = fileNames?.[i] || `image_${i + 1}_${Date.now()}.jpg`;
    const filePath = buildFilePath(userId, animalId, fileName);

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(filePath, file, {
        upsert: true,
        contentType: file.type || 'image/jpeg'
      });

    if (uploadError) {
      throw new Error(`Falha ao enviar imagem ${file.name}: ${uploadError.message}`);
    }

    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
    uploadedUrls.push(urlData.publicUrl);
  }

  return uploadedUrls;
}

export async function deleteAnimalImages(userId: string, animalId: string): Promise<void> {
  if (!userId || !animalId) return;

  const folderPath = `${userId}/${animalId}`;
  const { data: files, error: listError } = await supabase.storage.from(BUCKET).list(folderPath);

  if (listError || !files?.length) return;

  const filePaths = files.map(file => `${folderPath}/${file.name}`);
  await supabase.storage.from(BUCKET).remove(filePaths);
}








