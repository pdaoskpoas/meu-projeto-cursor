import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Cookie, Settings2, X, FileCheck2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  acceptAll,
  rejectNonEssential,
  writeConsent,
  readConsent,
  readReceipt,
  subscribeConsent,
  initConsent,
  type ConsentCategory,
  type ConsentReceipt,
} from '@/lib/consent';

interface CategoryMeta {
  key: ConsentCategory;
  label: string;
  summary: string;
  detail: string;
  required?: boolean;
}

const CATEGORIES: CategoryMeta[] = [
  {
    key: 'necessary',
    label: 'Essenciais',
    summary: 'Indispensáveis para autenticação, segurança e navegação.',
    detail:
      'Permitem login, manter a sessão ativa, aplicar preferências básicas de acessibilidade e proteger o acesso contra fraudes. Sem estes cookies, a Plataforma não funciona corretamente.',
    required: true,
  },
  {
    key: 'analytics',
    label: 'Análise de uso',
    summary: 'Ajudam a entender como a Plataforma é utilizada, de forma agregada.',
    detail:
      'Utilizamos o Google Analytics 4 com IP anonimizado para medir audiência, páginas mais visitadas e desempenho. Nenhum dado é usado para identificar você pessoalmente.',
  },
  {
    key: 'marketing',
    label: 'Marketing',
    summary: 'Personalização de ofertas e medição de campanhas.',
    detail:
      'Permitem exibir conteúdos e campanhas relevantes ao seu perfil e medir a eficácia de comunicações. Atualmente não executamos campanhas externas — esta opção ficará ativa somente se você autorizar.',
  },
];

type Prefs = Record<ConsentCategory, boolean>;

const DEFAULT_PREFS: Prefs = { necessary: true, analytics: false, marketing: false };

const CookieConsentBanner: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [receipt, setReceipt] = useState<ConsentReceipt | null>(null);

  useEffect(() => {
    initConsent();
    const current = readConsent();
    setReceipt(readReceipt());
    if (!current) {
      // Pequeno delay para evitar flash durante hidratação
      const t = window.setTimeout(() => setVisible(true), 400);
      return () => window.clearTimeout(t);
    }
    setPrefs(current.categories);
  }, []);

  useEffect(() => {
    const handler = () => {
      setPrefs((p) => ({ ...p }));
      setSettingsOpen(true);
      setVisible(false);
    };
    window.addEventListener('vdc:open-cookie-preferences', handler);
    return () => window.removeEventListener('vdc:open-cookie-preferences', handler);
  }, []);

  useEffect(() => {
    return subscribeConsent((state) => {
      if (state) setPrefs(state.categories);
      setReceipt(readReceipt());
    });
  }, []);

  const handleAcceptAll = useCallback(() => {
    acceptAll();
    setVisible(false);
    setSettingsOpen(false);
  }, []);

  const handleRejectAll = useCallback(() => {
    rejectNonEssential();
    setVisible(false);
    setSettingsOpen(false);
  }, []);

  const handleSavePrefs = useCallback(() => {
    writeConsent(prefs);
    setVisible(false);
    setSettingsOpen(false);
  }, [prefs]);

  const openSettings = useCallback(() => {
    const current = readConsent();
    setPrefs(current?.categories ?? DEFAULT_PREFS);
    setSettingsOpen(true);
  }, []);

  return (
    <>
      {visible && (
        <div
          role="dialog"
          aria-modal="false"
          aria-labelledby="cookie-consent-title"
          aria-describedby="cookie-consent-desc"
          className="fixed inset-x-0 bottom-0 z-[100] animate-fade-in px-3 pb-3 sm:bottom-4 sm:left-4 sm:right-auto sm:inset-x-auto sm:px-0 sm:pb-0"
        >
          <div className="relative mx-auto w-full max-w-md rounded-xl border border-slate-200/80 bg-white/95 shadow-premium backdrop-blur-md ring-1 ring-black/5 sm:mx-0">
            <button
              type="button"
              onClick={handleRejectAll}
              aria-label="Fechar e rejeitar cookies não essenciais"
              className="absolute right-2 top-2 rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>

            <div className="flex gap-3 p-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-blue-800 text-white shadow-card">
                <Cookie className="h-4 w-4" aria-hidden="true" />
              </div>

              <div className="flex-1 min-w-0 pr-5">
                <div className="flex items-center gap-1.5">
                  <h2
                    id="cookie-consent-title"
                    className="text-sm font-semibold text-slate-900"
                  >
                    Cookies & privacidade
                  </h2>
                  <span className="inline-flex items-center rounded-full bg-blue-50 px-1.5 py-0.5 text-[9px] font-semibold tracking-wide text-blue-700 ring-1 ring-inset ring-blue-200">
                    LGPD
                  </span>
                </div>
                <p
                  id="cookie-consent-desc"
                  className="mt-1 text-xs leading-relaxed text-slate-600"
                >
                  Usamos cookies essenciais e, com sua autorização, analíticos para melhorar
                  sua experiência.{' '}
                  <Link
                    to="/privacy"
                    className="font-medium text-blue-700 underline-offset-2 hover:underline"
                  >
                    Saiba mais
                  </Link>
                  .
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  <Button
                    onClick={handleAcceptAll}
                    size="sm"
                    className="h-8 bg-blue-700 px-3 text-xs text-white hover:bg-blue-800"
                  >
                    Aceitar todos
                  </Button>
                  <Button
                    onClick={handleRejectAll}
                    size="sm"
                    variant="outline"
                    className="h-8 border-slate-300 px-3 text-xs text-slate-800 hover:bg-slate-50"
                  >
                    Rejeitar
                  </Button>
                  <Button
                    onClick={openSettings}
                    size="sm"
                    variant="ghost"
                    className="h-8 px-2 text-xs text-slate-600 hover:bg-slate-100"
                  >
                    Personalizar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden">
          <DialogHeader className="border-b border-slate-200 bg-gradient-to-br from-slate-50 to-blue-50/40 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 text-white shadow-card">
                <Settings2 className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <DialogTitle className="text-left text-lg font-semibold text-slate-900">
                  Preferências de cookies
                </DialogTitle>
                <DialogDescription className="text-left text-sm text-slate-600">
                  Escolha quais categorias você autoriza. Você pode rever esta decisão a
                  qualquer momento.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="max-h-[60vh] overflow-y-auto px-6 py-5">
            <ul className="space-y-3">
              {CATEGORIES.map((cat) => (
                <li
                  key={cat.key}
                  className="rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:border-slate-300"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-semibold text-slate-900">{cat.label}</h3>
                        {cat.required && (
                          <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-600 ring-1 ring-inset ring-slate-200">
                            Sempre ativo
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-slate-600">{cat.summary}</p>
                      <p className="mt-2 text-xs leading-relaxed text-slate-500">
                        {cat.detail}
                      </p>
                    </div>
                    <div className="pt-0.5">
                      <Switch
                        checked={prefs[cat.key]}
                        disabled={cat.required}
                        onCheckedChange={(checked) =>
                          setPrefs((p) => ({ ...p, [cat.key]: checked }))
                        }
                        aria-label={`Ativar categoria ${cat.label}`}
                      />
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            {receipt && (
              <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50/60 p-3">
                <div className="flex items-start gap-2.5">
                  <FileCheck2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-emerald-900">
                      Comprovante de aceite registrado
                    </p>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-emerald-800/90">
                      Protocolo:{' '}
                      <code className="rounded bg-white/70 px-1 py-0.5 font-mono text-[10px] text-emerald-900">
                        {receipt.receipt_id}
                      </code>
                      <br />
                      Registrado em{' '}
                      {new Date(receipt.recorded_at).toLocaleString('pt-BR', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                      .
                    </p>
                  </div>
                </div>
              </div>
            )}

            <p className="mt-4 text-xs leading-relaxed text-slate-500">
              Registramos cada decisão de forma imutável no nosso sistema (data, IP e
              agente), conforme exigido pela LGPD (Art. 8 §2º). Detalhes em nossa{' '}
              <Link
                to="/privacy"
                className="font-medium text-blue-700 underline-offset-2 hover:underline"
                onClick={() => setSettingsOpen(false)}
              >
                Política de Privacidade
              </Link>
              .
            </p>
          </div>

          <DialogFooter className="flex flex-col-reverse gap-2 border-t border-slate-200 bg-slate-50/60 px-6 py-4 sm:flex-row sm:justify-between">
            <Button
              variant="ghost"
              onClick={handleRejectAll}
              className="text-slate-700 hover:bg-slate-100"
            >
              Rejeitar não essenciais
            </Button>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                variant="outline"
                onClick={handleSavePrefs}
                className="border-slate-300 text-slate-800 hover:bg-slate-50"
              >
                Salvar preferências
              </Button>
              <Button
                onClick={handleAcceptAll}
                className="bg-blue-700 text-white hover:bg-blue-800"
              >
                Aceitar todos
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CookieConsentBanner;

/** Abre o modal de preferências a partir de qualquer lugar (ex.: link no rodapé). */
export function openCookiePreferences(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('vdc:open-cookie-preferences'));
  }
}
