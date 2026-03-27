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
      {/* Hero — primeiro contato, CTA claro */}
      <HeroSection />

      {/* Animais mais buscados — prova visual imediata logo após o hero */}
      <FavoritesProviderBoundary>
        <LazySection minHeight="400px">
          <SectionContainer variant="default" size="default">
            <Suspense fallback={null}>
              <MostViewedCarousel />
            </Suspense>
          </SectionContainer>
        </LazySection>

        {/* Animais turbinados — diferenciação premium */}
        <LazySection minHeight="400px">
          <SectionContainer variant="gray" size="tight">
            <Suspense fallback={null}>
              <FeaturedCarousel />
            </Suspense>
          </SectionContainer>
        </LazySection>

        {/* Eventos — urgência temporal puxa engajamento */}
        <LazySection minHeight="350px">
          <SectionContainer variant="default" size="default" divider="top">
            <Suspense fallback={null}>
              <AuctionCarousel />
            </Suspense>
          </SectionContainer>
        </LazySection>

        {/* Ranking mensal — garanhões e doadoras */}
        <LazySection minHeight="400px">
          <SectionContainer variant="gray" size="tight">
            <Suspense fallback={null}>
              <TopMalesByMonthCarousel />
            </Suspense>
          </SectionContainer>
        </LazySection>

        <LazySection minHeight="400px">
          <SectionContainer variant="default" size="tight">
            <Suspense fallback={null}>
              <TopFemalesByMonthCarousel />
            </Suspense>
          </SectionContainer>
        </LazySection>

        {/* Recém-publicados — novidade gera retorno */}
        <LazySection minHeight="400px">
          <SectionContainer variant="gray" size="tight">
            <Suspense fallback={null}>
              <RecentlyPublishedCarousel />
            </Suspense>
          </SectionContainer>
        </LazySection>
      </FavoritesProviderBoundary>

      {/* Proposta de valor — convence após ver os animais */}
      <LazySection minHeight="400px">
        <SectionContainer variant="default" size="relaxed" divider="top">
          <Suspense fallback={null}>
            <WhyChooseUsSection />
          </Suspense>
        </SectionContainer>
      </LazySection>

      {/* Patrocinadores */}
      <LazySection minHeight="220px">
        <Suspense fallback={<div className="min-h-[220px]" />}>
          <SponsorsCarousel />
        </Suspense>
      </LazySection>

      {/* Notícias e conteúdo */}
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
