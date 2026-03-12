import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import AppLayout from "@/components/layout/AppLayout";
import SessionTimeoutManager from "@/components/SessionTimeoutManager";
import ScrollRestoration from "@/components/ScrollRestoration";
import RouteProgressBar from "@/components/RouteProgressBar";
import PageLoadingFallback from "@/components/PageLoadingFallback";
import ErrorBoundary from "@/components/ErrorBoundary";
import ChatProviderBoundary from "@/components/ChatProviderBoundary";
import FavoritesProviderBoundary from "@/components/FavoritesProviderBoundary";
import PageVisitTracker from "@/components/analytics/PageVisitTracker";

// Páginas principais - carregadas imediatamente
import Index from "./pages/Index";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import AdminProtectedRoute from "./components/AdminProtectedRoute";

// Lazy loading para páginas que não precisam ser carregadas inicialmente
const AnimalPage = lazy(() => import("./pages/animal/AnimalPage"));
const HarasPage = lazy(() => import("./pages/HarasPage"));
const ShortHarasRedirect = lazy(() => import("./pages/ShortHarasRedirect"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const RankingPage = lazy(() => import("./pages/RankingPage"));
const RankingHistoryPage = lazy(() => import("./pages/ranking/RankingHistoryPage"));
const NewsPage = lazy(() => import("./pages/NewsPage"));
const ArticlePage = lazy(() => import("./pages/ArticlePage"));
const EventsPage = lazy(() => import("./pages/events/EventsPage"));
const EventDetailsPage = lazy(() => import("./pages/events/EventDetailsPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const AdminPage = lazy(() => import("./pages/AdminPage"));
const PlansPage = lazy(() => import("./pages/PlansPage"));
const CheckoutPage = lazy(() => import("./pages/CheckoutPage"));
const PublishDraftPage = lazy(() => import("./pages/PublishDraftPage"));
const PublishAnimalPage = lazy(() => import("./pages/PublishAnimalPage"));
const TermsPage = lazy(() => import("./pages/TermsPage"));
const PrivacyPage = lazy(() => import("./pages/PrivacyPage"));
const ContactPage = lazy(() => import("./pages/ContactPage"));
const AnimalsPage = lazy(() => import("./pages/dashboard/AnimalsPage"));
const EditAnimalPage = lazy(() => import("./pages/dashboard/EditAnimalPage"));
const DashboardEventsPage = lazy(() => import("./pages/dashboard/EventsPage"));
const StatsPage = lazy(() => import("./pages/dashboard/StatsPage"));
const NotificationsPage = lazy(() => import("./pages/dashboard/NotificationsPage"));
const SettingsPage = lazy(() => import("./pages/dashboard/SettingsPage"));
const UpgradeToInstitutionalPage = lazy(() => import("./pages/dashboard/UpgradeToInstitutionalPage"));
const UpdateProfilePage = lazy(() => import("./pages/dashboard/UpdateProfilePage"));
const MessagesPage = lazy(() => import("./pages/dashboard/MessagesPage"));
const FavoritosPage = lazy(() => import("./pages/dashboard/FavoritosPage"));
const TestUploadPage = lazy(() => import("./pages/TestUploadPage"));
const HelpPage = lazy(() => import("./pages/dashboard/HelpPage"));
const SocietyPage = lazy(() => import("./pages/dashboard/SocietyPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
        <AuthProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <SessionTimeoutManager />
            <BrowserRouter 
              future={{
                v7_startTransition: true,
                v7_relativeSplatPath: true
              }}
            >
              <ScrollRestoration />
              <PageVisitTracker />
              <RouteProgressBar />
              <Suspense fallback={<PageLoadingFallback />}>
                <Routes>
                  {/* Rota de ajuda pública (sem AppLayout) */}
                  <Route path="/ajuda" element={<HelpPage />} />
                  
                  {/* Todas as outras rotas com AppLayout */}
                  <Route path="*" element={
                    <AppLayout>
                      <Routes>
                      <Route path="/" element={<Index />} />
                      <Route
                        path="/animal/:id"
                        element={
                          <FavoritesProviderBoundary>
                            <ChatProviderBoundary>
                              <AnimalPage />
                            </ChatProviderBoundary>
                          </FavoritesProviderBoundary>
                        }
                      />
                      <Route
                        path="/haras/:id"
                        element={
                          <ChatProviderBoundary>
                            <HarasPage />
                          </ChatProviderBoundary>
                        }
                      />
                      <Route path="/profile/:publicCode" element={<ProfilePage />} />
                      <Route
                        path="/buscar"
                        element={
                          <FavoritesProviderBoundary>
                            <RankingPage />
                          </FavoritesProviderBoundary>
                        }
                      />
                      <Route
                        path="/buscar/:breed"
                        element={
                          <FavoritesProviderBoundary>
                            <RankingPage />
                          </FavoritesProviderBoundary>
                        }
                      />
                      <Route
                        path="/ranking"
                        element={
                          <FavoritesProviderBoundary>
                            <RankingHistoryPage />
                          </FavoritesProviderBoundary>
                        }
                      />
                    <Route path="/noticias" element={<NewsPage />} />
                    <Route path="/noticias/:slug" element={<ArticlePage />} />
                      <Route path="/eventos" element={<EventsPage />} />
                      <Route path="/eventos/:id" element={<EventDetailsPage />} />
                      <Route path="/login" element={<LoginPage />} />
                      <Route path="/register" element={<RegisterPage />} />
                      <Route path="/dashboard" element={<DashboardPage />} />
                      <Route path="/dashboard/animals" element={<AnimalsPage />} />
                      <Route path="/dashboard/events" element={<DashboardEventsPage />} />
                      <Route path="/dashboard/edit-animal/:id" element={<EditAnimalPage />} />
                      <Route
                        path="/dashboard/messages"
                        element={
                          <ChatProviderBoundary>
                            <MessagesPage />
                          </ChatProviderBoundary>
                        }
                      />
                      <Route path="/dashboard/stats" element={<StatsPage />} />
                      <Route path="/dashboard/notifications" element={<NotificationsPage />} />
                      <Route path="/dashboard/settings" element={<SettingsPage />} />
                      <Route path="/dashboard/settings/profile" element={<UpdateProfilePage />} />
                      <Route path="/dashboard/update-profile" element={<Navigate to="/dashboard/settings/profile" replace />} />
                      <Route
                        path="/dashboard/favoritos"
                        element={
                          <FavoritesProviderBoundary>
                            <FavoritosPage />
                          </FavoritesProviderBoundary>
                        }
                      />
                      <Route path="/dashboard/help" element={<HelpPage />} />
                      <Route path="/dashboard/society" element={<SocietyPage />} />
                      {/* Rota antiga removida - agora usa /planos */}
                      <Route path="/dashboard/upgrade-institutional" element={<UpgradeToInstitutionalPage />} />
                      <Route path="/planos" element={<PlansPage />} />
                      <Route path="/terms" element={<TermsPage />} />
                      <Route path="/privacy" element={<PrivacyPage />} />
                      <Route path="/contact" element={<ContactPage />} />
                      <Route path="/checkout" element={<CheckoutPage />} />
                      <Route path="/publicar/:draftId" element={<PublishDraftPage />} />
                      <Route path="/publicar-animal" element={<PublishAnimalPage />} />
                      <Route path="/admin" element={<AdminProtectedRoute><AdminPage /></AdminProtectedRoute>} />
                      <Route path="/test-upload" element={<TestUploadPage />} />
                      {/* Rota curta para haras - DEVE ficar antes do 404 */}
                      <Route path="/:propertyName/:code" element={<ShortHarasRedirect />} />
                      <Route path="*" element={<NotFound />} />
                      </Routes>
                    </AppLayout>
                  } />
                </Routes>
              </Suspense>
              </BrowserRouter>
            </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
  </ErrorBoundary>
);

export default App;