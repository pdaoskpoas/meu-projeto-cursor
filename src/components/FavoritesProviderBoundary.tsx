import React, { Suspense } from 'react';

const LazyFavoritesProvider = React.lazy(() =>
  import('@/contexts/FavoritesContext').then((module) => ({ default: module.FavoritesProvider }))
);

interface FavoritesProviderBoundaryProps {
  children: React.ReactNode;
}

const FavoritesProviderBoundary: React.FC<FavoritesProviderBoundaryProps> = ({ children }) => {
  return (
    <Suspense fallback={null}>
      <LazyFavoritesProvider>{children}</LazyFavoritesProvider>
    </Suspense>
  );
};

export default FavoritesProviderBoundary;
