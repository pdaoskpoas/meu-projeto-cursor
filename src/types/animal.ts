export interface Partnership {
  harasId: string;
  harasName: string;
  publicCode: string;
  status: 'pending' | 'accepted' | 'rejected';
  percentage?: number;
}

export interface Animal {
  id: string;
  name: string;
  breed: string;
  birthDate: string;
  coat: string;
  gender: 'Macho' | 'Fêmea';
  currentLocation: {
    city: string;
    state: string;
  };
  chip?: string;
  father?: string;
  mother?: string;
  titles: string[];
  image: string;
  harasId: string;
  harasName: string;
  views: number;
  featured: boolean;
  partnerships?: Partnership[];
  publishedDate: string;
  allowMessages?: boolean;
  adStatus: 'active' | 'expired' | 'paused';
  expiresAt?: string;
  canEdit: boolean;
  isBoosted?: boolean;
  boostEndTime?: string;
  images?: string[];
}

export type Horse = Animal;
// src/types/animal.ts

/**
 * Dados básicos do animal (Step 1)
 */
export interface BasicInfoData {
  name: string;
  breed: string;
  gender: 'Macho' | 'Fêmea';
  birth_date: string; // ISO format: YYYY-MM-DD
  coat: string; // Pelagem (obrigatória, sempre feminino)
  category: string; // 'Garanhão', 'Castrado', 'Doadora', 'Matriz', 'Potro', 'Potra', 'Outro'
  is_registered: boolean; // Possui registro oficial
}

/**
 * Localização do animal (Step 2)
 */
export interface LocationData {
  current_city: string;
  current_state: string; // Sigla: SP, RJ, MG, etc.
}

/**
 * Fotos do animal (Step 3)
 */
export interface PhotosData {
  files: File[]; // Array de arquivos originais
  previews: string[]; // URLs temporárias (blob URLs)
}

/**
 * Genealogia do animal (Step 4)
 * Inclui pais, avós e bisavós (completo até 3 gerações)
 */
export interface GenealogyData {
  // Pais
  father_name: string | null;
  mother_name: string | null;
  
  // Avós paternos
  paternal_grandfather_name: string | null;
  paternal_grandmother_name: string | null;
  
  // Avós maternos
  maternal_grandfather_name: string | null;
  maternal_grandmother_name: string | null;
  
  // Bisavós paternos (lado do avô paterno)
  paternal_gg_father_name: string | null;
  paternal_gg_mother_name: string | null;
  
  // Bisavós paternos (lado da avó paterna)
  paternal_gm_father_name: string | null;
  paternal_gm_mother_name: string | null;
  
  // Bisavós maternos (lado do avô materno)
  maternal_gg_father_name: string | null;
  maternal_gg_mother_name: string | null;
  
  // Bisavós maternos (lado da avó materna)
  maternal_gm_father_name: string | null;
  maternal_gm_mother_name: string | null;
}

/**
 * Premiação do animal
 */
export interface AnimalAward {
  event_name: string; // Nome do evento (ex: 3ª COPA DE MARCHA HARAS TOURINHO 10/22)
  event_date: string; // Data do evento (formato ISO YYYY-MM-DD ou período como 10/2022)
  city: string; // Cidade do evento (ex: IRARÁ)
  state: string; // UF do evento (ex: BA)
  award: string; // Premiação recebida (ex: 5 PRÊMIO ÉGUA SÊNIOR MARCHA)
}

/**
 * Configurações extras (Step 5)
 */
export interface ExtrasData {
  description: string | null; // Descrição do anúncio (máximo 300 caracteres)
  awards: AnimalAward[]; // Premiações do animal
}

/**
 * Configurações de publicação (Step 6 - Revisar)
 */
export interface PublishConfigData {
  allow_messages: boolean; // Permitir mensagens de interessados
  auto_renew: boolean; // Renovar anúncio automaticamente
}

/**
 * Sócio/Parceiro (gerenciado via sidebar, não no wizard)
 */
export interface PartnershipData {
  publicCode: string;
  percentage: number;
}

/**
 * Estrutura completa do formulário do wizard
 */
export interface AnimalFormData {
  basicInfo: BasicInfoData;
  location: LocationData;
  photos: PhotosData;
  genealogy: GenealogyData;
  extras: ExtrasData;
  publishConfig: PublishConfigData; // Configurações de publicação (renovação e mensagens)
  partnerships?: PartnershipData[]; // Opcional (gerenciado via sidebar)
}
