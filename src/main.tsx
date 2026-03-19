import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { applySecurityMetaTags } from "@/lib/securityHeaders";
import { HelmetProvider } from "react-helmet-async";
import { initWebVitals } from "@/utils/perfMetrics";
import { Analytics } from "@vercel/analytics/react";

// Desabilita o scroll restoration nativo do navegador
// O componente ScrollRestoration.tsx gerencia isso manualmente
if ('scrollRestoration' in window.history) {
  window.history.scrollRestoration = 'manual';
}

applySecurityMetaTags();
initWebVitals();

// Captura global de promises não tratadas — evita falhas silenciosas
window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason;
  const message = reason instanceof Error ? reason.message : String(reason);

  // Ignorar erros de stale request (são intencionais)
  if (message === 'Stale request ignored') return;

  console.error('[Unhandled Promise Rejection]', message, reason);
});

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <App />
    <Analytics />
  </HelmetProvider>
);
