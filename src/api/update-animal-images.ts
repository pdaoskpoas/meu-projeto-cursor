// API endpoint para atualizar images do animal
// Em um projeto React/Vite real, isso seria um serverless function ou backend endpoint
// Por enquanto, vamos implementar usando o animalService diretamente

import { animalService } from '@/services/animalService';

// Função utilitária que simula um endpoint REST
export const updateAnimalImages = async (animalId: string, imageUrls: string[]): Promise<void> => {
  try {
    // Atualizar o animal com as URLs das imagens
    await animalService.updateAnimalImages(animalId, imageUrls);
  } catch (error) {
    console.error('Erro ao atualizar imagens do animal:', error);
    throw error;
  }
};

// Para uso direto no frontend (substituindo fetch('/api/update-animal-images'))
export default updateAnimalImages;





