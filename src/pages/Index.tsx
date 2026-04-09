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
const InstitutionalProfilesSection = lazy(() => import('@/components/homepage/InstitutionalProfilesSection'));

const Index = () => {
  return (
    <main className="overflow-hidden bg-white">
      {/* Hero — primeiro contato, CTA claro */}
      <HeroSection />

      {/* Patrocinadores — logo após o hero */}
      <LazySection minHeight="220px">
        <Suspense fallback={<div className="min-h-[220px]" />}>
          <SponsorsCarousel />
        </Suspense>
      </LazySection>

      {/* Animais mais buscados — prova visual imediata logo após o hero */}
      <FavoritesProviderBoundary>
        <LazySection minHeight="400px">
          <SectionContainer variant="default" size="default">
            <Suspense fallback={null}>
              <MostViewedCarousel />
            </Suspense>
          </SectionContainer>
        </LazySection>

        {/* Proposta de valor — convence ANTES de ver mais animais */}
        <LazySection minHeight="300px">
          <SectionContainer variant="gray" size="relaxed">
            <Suspense fallback={null}>
              <WhyChooseUsSection />
            </Suspense>
          </SectionContainer>
        </LazySection>

        {/* Animais turbinados — diferenciação premium */}
        <LazySection minHeight="400px">
          <SectionContainer variant="default" size="tight">
            <Suspense fallback={null}>
              <FeaturedCarousel />
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

        {/* Recém-publicados */}
        <LazySection minHeight="400px">
          <SectionContainer variant="gray" size="tight">
            <Suspense fallback={null}>
              <RecentlyPublishedCarousel />
            </Suspense>
          </SectionContainer>
        </LazySection>
      </FavoritesProviderBoundary>

      {/* Quem já faz parte — perfis institucionais */}
      <LazySection id="vitrine-profiles" minHeight="300px">
        <SectionContainer variant="default" size="default" divider="top">
          <Suspense fallback={null}>
            <InstitutionalProfilesSection />
          </Suspense>
        </SectionContainer>
      </LazySection>

      {/* Eventos turbinados — renderiza apenas quando há eventos ativos */}
      <LazySection minHeight="0" fallback={null}>
        <Suspense fallback={null}>
          <AuctionCarousel />
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
