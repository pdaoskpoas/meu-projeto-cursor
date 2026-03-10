import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isDev = mode === 'development';
  
  return {
    server: {
      host: "::",
      port: 8080,
      headers: {
        // 🔒 Security Headers - Proteção contra XSS, Clickjacking, MIME Sniffing
        // Em desenvolvimento: permite iframe do Lovable
        // Em produção: segurança máxima
        'Content-Security-Policy': isDev
          ? "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://fonts.googleapis.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https: blob:; font-src 'self' https://fonts.gstatic.com data:; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.mapbox.com https://*.tiles.mapbox.com https://viacep.com.br https://servicodados.ibge.gov.br; worker-src 'self' blob:; frame-ancestors 'self' *.lovableproject.com; base-uri 'self'; form-action 'self'"
          : "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://fonts.googleapis.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https: blob:; font-src 'self' https://fonts.gstatic.com data:; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.mapbox.com https://*.tiles.mapbox.com https://viacep.com.br https://servicodados.ibge.gov.br; worker-src 'self' blob:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
        'X-Frame-Options': isDev ? 'SAMEORIGIN' : 'DENY',
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
        'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
      }
    },
    plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes("node_modules")) return;
            if (id.includes("react") || id.includes("react-dom") || id.includes("react-router")) {
              return "react-vendor";
            }
            if (id.includes("@tanstack")) return "tanstack";
            if (id.includes("@supabase")) return "supabase";
            if (id.includes("@radix-ui")) return "radix";
            if (id.includes("react-hook-form") || id.includes("@hookform/resolvers") || id.includes("zod")) {
              return "forms";
            }
            if (id.includes("date-fns") || id.includes("react-day-picker")) return "dates";
            if (id.includes("dompurify")) return "sanitizers";
            if (id.includes("sonner")) return "notifications";
            if (id.includes("cmdk") || id.includes("vaul")) return "overlays";
            if (id.includes("next-themes")) return "themes";
            if (id.includes("browser-image-compression") || id.includes("compressorjs")) {
              return "image-tools";
            }
            if (id.includes("lucide-react")) return "icons";
            if (id.includes("framer-motion")) return "motion";
            if (id.includes("embla-carousel")) return "carousel";
            if (id.includes("mapbox-gl")) return "mapbox";
            if (id.includes("recharts")) return "charts";
            if (id.includes("@tiptap")) return "tiptap";
            return "vendor";
          },
        },
      },
    },
  };
});
