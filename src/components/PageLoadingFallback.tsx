import { Loader2 } from "lucide-react";

/**
 * Componente de fallback exibido durante o carregamento de páginas lazy-loaded.
 * 
 * Proporciona uma experiência suave ao usuário enquanto o código da página
 * está sendo carregado dinamicamente.
 */
const PageLoadingFallback = () => {
  return (
    <div className="min-h-[60vh] w-full bg-background">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-24 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="text-sm">Carregando página...</span>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
          <div className="space-y-4 rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
            <div className="h-8 w-2/3 animate-pulse rounded-md bg-muted" />
            <div className="h-4 w-full animate-pulse rounded-md bg-muted" />
            <div className="h-4 w-5/6 animate-pulse rounded-md bg-muted" />
            <div className="h-64 animate-pulse rounded-xl bg-muted" />
          </div>

          <div className="space-y-4 rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
            <div className="h-6 w-1/2 animate-pulse rounded-md bg-muted" />
            <div className="h-24 animate-pulse rounded-xl bg-muted" />
            <div className="h-24 animate-pulse rounded-xl bg-muted" />
            <div className="h-10 w-full animate-pulse rounded-lg bg-muted" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PageLoadingFallback;



