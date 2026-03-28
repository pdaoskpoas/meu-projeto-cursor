import mangalargaImg from '@/assets/mangalarga.jpg';
import thoroughbredImg from '@/assets/thoroughbred.jpg';
import quarterHorseImg from '@/assets/quarter-horse.jpg';
import { getOwnerDisplayName } from './ownerDisplayName';
import { formatNameUppercase } from '@/utils/nameFormat';

export interface AnimalCardData {
  id: string;
  name: string;
  breed: string;
  coat: string;
  gender: 'Macho' | 'Fêmea';
  harasName: string;
  birthDate: string;
  adStatus: string;
  currentLocation: {
    city: string;
    state: string;
  };
  images: string[];
  clickCount: number;
  impressionCount: number;
  publishedAt: string;
}

const placeholderMap: Record<string, string> = {
  mangalarga: mangalargaImg,
  'quarter-horse': quarterHorseImg,
  thoroughbred: thoroughbredImg,
};

const unsplashFallbacks = [
  'https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?w=400&h=300&fit=crop&auto=format&q=80&ixlib=rb-4.0.3',
  'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=400&h=300&fit=crop&auto=format&q=80&ixlib=rb-4.0.3',
  'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop&auto=format&q=80&ixlib=rb-4.0.3',
];

const sanitizeImageArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.filter((url): url is string => typeof url === 'string' && url.trim().length > 0);
  }

  if (value && typeof value === 'object') {
    const maybeArray = Object.values(value as Record<string, unknown>);
    return maybeArray.filter((url): url is string => typeof url === 'string' && url.trim().length > 0);
  }

  return [];
};

export const normalizeSupabaseImages = (record: {
  images?: unknown;
  cover_image?: string | null;
  default_image_key?: string | null;
}) => {
  const normalized = sanitizeImageArray(record?.images);

  if (normalized.length > 0) {
    return normalized;
  }

  if (record?.cover_image) {
    return [record.cover_image];
  }

  return [];
};

export const getPlaceholderGallery = (preferredKey?: string) => {
  const placeholder = preferredKey && placeholderMap[preferredKey]
    ? placeholderMap[preferredKey]
    : mangalargaImg;

  return [placeholder, ...unsplashFallbacks];
};

export const mapAnimalRecordToCard = (record: Record<string, unknown>): AnimalCardData => ({
  id: record.id,
  name: formatNameUppercase(record.name),
  breed: record.breed ?? '—',
  coat: record.coat ?? '—',
  gender: record.gender ?? 'Macho',
  harasName: getOwnerDisplayName(
    record.owner_account_type ?? record.account_type,
    record.owner_name ?? record.haras_name,
    record.owner_property_name ?? record.property_name
  ),
  birthDate: record.birth_date ?? '2000-01-01',
  adStatus: record.ad_status ?? 'inactive',
  currentLocation: {
    city: record.current_city ?? '—',
    state: record.current_state ?? '—',
  },
  images: normalizeSupabaseImages(record),
  clickCount: record.clicks ?? record.click_count ?? 0,
  impressionCount: record.impressions ?? record.impression_count ?? 0,
  publishedAt: record.published_at ?? new Date().toISOString(),
});


