import { sanitizeName } from '@/utils/sanitize';

export const normalizeNameForStorage = (name: string | null | undefined): string | null => {
  if (!name || typeof name !== 'string') return null;
  const sanitized = sanitizeName(name);
  return sanitized ? sanitized.toUpperCase() : null;
};

export const formatNameUppercase = (name: string | null | undefined): string => {
  if (!name || typeof name !== 'string') return '';
  return name.toUpperCase();
};
