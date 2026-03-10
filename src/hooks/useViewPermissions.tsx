import { useAuth } from '@/contexts/AuthContext';
import type { Animal } from '@/types/animal';

interface User {
  id: string;
  name: string;
  email: string;
  accountType: 'personal' | 'institutional';
  propertyName?: string;
  propertyId?: string;
  role?: 'admin';
}

export const useViewPermissions = () => {
  const { user } = useAuth();

  const isAdmin = (user: User | null) => {
    // Admin is identified by a specific email or role
    return user?.email === 'admin@sistema.com.br' || user?.role === 'admin';
  };

  const isAnimalOwner = (animal: Animal) => {
    return user?.propertyId === animal.harasId;
  };

  const canViewAnimalViews = (animal: Animal) => {
    if (!user) return false;
    return isAdmin(user) || isAnimalOwner(animal);
  };

  const canViewAllViews = () => {
    if (!user) return false;
    return isAdmin(user);
  };

  return {
    canViewAnimalViews,
    canViewAllViews,
    isAdmin: user ? isAdmin(user) : false,
    isAuthenticated: !!user
  };
};