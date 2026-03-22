import React, { Suspense, lazy } from 'react';
import HeroSection from '@/components/homepage/HeroSection';
import SectionContainer from '@/components/homepage/SectionContainer';
import LazySection from '@/components/ui/LazySection';
import FavoritesProviderBoundary from '@/components/FavoritesProviderBoundary';
const WhyChooseUsSection = lazy(() => import('@/components/homepage/WhyChooseUsSection'));
const SponsorsCarousel = lazy(() => import('@/components/SponsorsCarousel'));
const FeaturedCarousel = lazy(() => import('@/components/FeaturedCarousel'));
const MostViewedCarousel = lazy(() => import('@/components/MostViewedCarousel'));
const TopMalesByMonthCarousel = lazy(() => import('@/components/TopMalesByMonthCarousel'));
const TopFemalesByMonthCarousel = lazy(() => import('@/components/TopFemalesByMonthCarousel'));
const RecentlyPublishedCarousel = lazy(() => import('@/components/RecentlyPublishedCarousel'));
const AuctionCarousel = lazy(() => import('@/components/AuctionCarousel'));
const NewsSection = lazy(() => import('@/components/NewsSection'));

const Index = () => {
  return (
    <main className="overflow-hidden bg-white">
      {/* Hero Section - Seção principal com destaque */}
      <HeroSection />
      
      {/* Seção de Patrocinadores - Sem padding interno, já tem no componente */}
      <LazySection minHeight="220px">
        <Suspense fallback={<div className="min-h-[220px]" />}>
          <SponsorsCarousel />
        </Suspense>
      </LazySection>
      
      {/* Seção "Por que a Vitrine do Cavalo?" */}
      <LazySection minHeight="400px">
        <Suspense fallback={<div className="min-h-[400px]" />}>
          <WhyChooseUsSection />
        </Suspense>
      </LazySection>

      {/* Bloco de Animais - Carrosséis relacionados com espaçamento tight */}
      <FavoritesProviderBoundary>
        <LazySection minHeight="400px">
          <SectionContainer variant="default" size="default" divider="top">
            <Suspense fallback={null}>
              <FeaturedCarousel />
            </Suspense>
          </SectionContainer>
        </LazySection>
        
        <LazySection minHeight="400px">
          <SectionContainer variant="gray" size="tight">
            <Suspense fallback={null}>
              <MostViewedCarousel />
            </Suspense>
          </SectionContainer>
        </LazySection>
        
        <LazySection minHeight="400px">
          <SectionContainer variant="default" size="tight">
            <Suspense fallback={null}>
              <TopMalesByMonthCarousel />
            </Suspense>
          </SectionContainer>
        </LazySection>
        
        <LazySection minHeight="400px">
          <SectionContainer variant="gray" size="tight">
            <Suspense fallback={null}>
              <TopFemalesByMonthCarousel />
            </Suspense>
          </SectionContainer>
        </LazySection>
        
        <LazySection minHeight="400px">
          <SectionContainer variant="default" size="tight">
            <Suspense fallback={null}>
              <RecentlyPublishedCarousel />
            </Suspense>
          </SectionContainer>
        </LazySection>
      </FavoritesProviderBoundary>
      
      {/* Seção de Eventos - Bloco diferenciado com espaçamento relaxed */}
      <LazySection minHeight="350px">
        <SectionContainer variant="default" size="relaxed" divider="top">
          <Suspense fallback={null}>
            <AuctionCarousel />
          </Suspense>
        </SectionContainer>
      </LazySection>
      
      {/* Seção de Notícias - Última seção com espaçamento relaxed */}
      <LazySection minHeight="400px">
        <SectionContainer variant="gray" size="relaxed" divider="top">
          <Suspense fallback={null}>
            <NewsSection />
          </Suspense>
        </SectionContainer>
      </LazySection>
    </main>
  );
};

export default Index;
