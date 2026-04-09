import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Eye,
  Users,
  TrendingUp,
  Copy,
  Check,
  ExternalLink,
  MessageCircle,
  LinkIcon,
  ToggleLeft,
  ToggleRight,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  getMyLinks,
  saveAllLinks,
  getVitrineStats,
  buildWhatsAppUrl,
  type CustomLink,
  type CustomLinkInput,
} from '@/services/customLinksService';

interface MinhaVitrineModalProps {
  open: boolean;
  onClose: () => void;
}

interface LinkFormState {
  label: string;
  url: string;
  icon: string | null;
  is_active: boolean;
  isWhatsApp: boolean; // controla se é campo de telefone
}

const DEFAULT_LINKS: LinkFormState[] = [
  { label: 'WhatsApp', url: '', icon: 'whatsapp', is_active: false, isWhatsApp: true },
  { label: '', url: '', icon: 'link', is_active: false, isWhatsApp: false },
  { label: '', url: '', icon: 'link', is_active: false, isWhatsApp: false },
];

const MinhaVitrineModal: React.FC<MinhaVitrineModalProps> = ({ open, onClose }) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [links, setLinks] = useState<LinkFormState[]>(DEFAULT_LINKS);
  const [stats, setStats] = useState({ totalVisits: 0, uniqueSessions: 0, last30DaysVisits: 0 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const vitrineUrl = user?.publicCode
    ? `${window.location.origin}/u/${user.publicCode}`
    : null;

  // Carregar dados ao abrir
  useEffect(() => {
    if (!open || !user?.id) return;

    const loadData = async () => {
      setLoading(true);
      try {
        const [existingLinks, vitrineStats] = await Promise.all([
          getMyLinks(user.id),
          getVitrineStats(user.id),
        ]);

        setStats(vitrineStats);

        // Mesclar links existentes com defaults
        const merged: LinkFormState[] = [1, 2, 3].map((pos) => {
          const existing = existingLinks.find((l) => l.position === pos);
          if (existing) {
            const isWa = existing.icon === 'whatsapp';
            return {
              label: existing.label,
              url: isWa
                ? existing.url.replace(/^https?:\/\/wa\.me\/55/, '').replace(/^https?:\/\/wa\.me\//, '')
                : existing.url,
              icon: existing.icon,
              is_active: existing.is_active,
              isWhatsApp: isWa,
            };
          }
          // Defaults
          if (pos === 1) {
            return { label: 'WhatsApp', url: '', icon: 'whatsapp', is_active: false, isWhatsApp: true };
          }
          return { label: '', url: '', icon: 'link', is_active: false, isWhatsApp: false };
        });

        setLinks(merged);
      } catch (error) {
        console.error('Erro ao carregar vitrine:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [open, user?.id]);

  // Scroll lock
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  // ESC para fechar
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  const handleCopyLink = useCallback(() => {
    if (!vitrineUrl) return;
    navigator.clipboard.writeText(vitrineUrl).then(() => {
      setCopied(true);
      toast({ title: 'Link copiado!', description: 'Cole em qualquer lugar para divulgar.' });
      setTimeout(() => setCopied(false), 2000);
    });
  }, [vitrineUrl, toast]);

  const updateLink = (index: number, field: keyof LinkFormState, value: string | boolean) => {
    setLinks((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const toggleActive = (index: number) => {
    setLinks((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], is_active: !next[index].is_active };
      return next;
    });
  };

  const handleSave = async () => {
    if (!user?.id) return;
    setSaving(true);

    try {
      const linksToSave: CustomLinkInput[] = links.map((link, i) => ({
        position: i + 1,
        label: link.label,
        url: link.isWhatsApp ? buildWhatsAppUrl(link.url) : link.url,
        icon: link.isWhatsApp ? 'whatsapp' : 'link',
        is_active: link.is_active && link.label.trim() !== '' && link.url.trim() !== '',
      }));

      const success = await saveAllLinks(user.id, linksToSave);

      if (success) {
        toast({ title: 'Vitrine atualizada!', description: 'Seus botões foram salvos com sucesso.' });
      } else {
        toast({ title: 'Erro ao salvar', description: 'Tente novamente em instantes.', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Erro ao salvar', description: 'Tente novamente.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50 animate-[fadeIn_200ms_ease-out]" />

      {/* Modal */}
      <div
        className="relative z-10 bg-white w-full sm:max-w-lg sm:rounded-2xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col animate-[slideUp_300ms_ease-out] sm:animate-[scaleIn_200ms_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-900">Minha Vitrine</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Conteúdo scrollável */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-5 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            </div>
          ) : (
            <>
              {/* ── Link de compartilhamento ── */}
              {vitrineUrl && (
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Link da sua vitrine</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 truncate font-mono">
                      {vitrineUrl}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-shrink-0"
                      onClick={handleCopyLink}
                    >
                      {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                    </Button>
                    <a
                      href={vitrineUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-shrink-0"
                    >
                      <Button size="sm" variant="outline">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </a>
                  </div>
                </div>
              )}

              {/* ── Estatísticas ── */}
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">Estatísticas da vitrine</p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-blue-50 rounded-xl p-3 text-center">
                    <Eye className="h-4 w-4 text-blue-600 mx-auto mb-1" />
                    <p className="text-xl font-bold text-slate-900">{stats.totalVisits}</p>
                    <p className="text-[10px] text-slate-500 uppercase">Total</p>
                  </div>
                  <div className="bg-green-50 rounded-xl p-3 text-center">
                    <Users className="h-4 w-4 text-green-600 mx-auto mb-1" />
                    <p className="text-xl font-bold text-slate-900">{stats.uniqueSessions}</p>
                    <p className="text-[10px] text-slate-500 uppercase">Visitantes</p>
                  </div>
                  <div className="bg-purple-50 rounded-xl p-3 text-center">
                    <TrendingUp className="h-4 w-4 text-purple-600 mx-auto mb-1" />
                    <p className="text-xl font-bold text-slate-900">{stats.last30DaysVisits}</p>
                    <p className="text-[10px] text-slate-500 uppercase">Últimos 30d</p>
                  </div>
                </div>
              </div>

              {/* ── Botões personalizados ── */}
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">
                  Botões da vitrine <span className="text-slate-400 normal-case">(até 3)</span>
                </p>

                <div className="space-y-4">
                  {links.map((link, index) => (
                    <div
                      key={index}
                      className={`rounded-xl border p-4 transition-colors ${
                        link.is_active ? 'border-blue-200 bg-blue-50/50' : 'border-slate-200 bg-white'
                      }`}
                    >
                      {/* Header do botão — toggle + posição */}
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold text-slate-500">
                          Botão {index + 1}
                          {index === 0 && !links[0].label && (
                            <span className="text-slate-400 font-normal ml-1">(sugestão: WhatsApp)</span>
                          )}
                        </span>
                        <button
                          onClick={() => toggleActive(index)}
                          className="flex items-center gap-1.5 text-xs font-medium"
                        >
                          {link.is_active ? (
                            <>
                              <ToggleRight className="h-5 w-5 text-blue-600" />
                              <span className="text-blue-600">Ativo</span>
                            </>
                          ) : (
                            <>
                              <ToggleLeft className="h-5 w-5 text-slate-400" />
                              <span className="text-slate-400">Inativo</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Campos */}
                      <div className="space-y-2.5">
                        {/* Nome do botão */}
                        <div>
                          <label className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">
                            Nome do botão
                          </label>
                          <input
                            type="text"
                            value={link.label}
                            onChange={(e) => updateLink(index, 'label', e.target.value)}
                            placeholder={index === 0 ? 'WhatsApp' : 'Ex: YouTube, Telegram...'}
                            className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                          />
                        </div>

                        {/* URL ou telefone */}
                        <div>
                          <div className="flex items-center justify-between">
                            <label className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">
                              {link.isWhatsApp ? 'Número (com DDD)' : 'Link (URL)'}
                            </label>
                            {index === 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const isWa = !link.isWhatsApp;
                                  updateLink(index, 'isWhatsApp', isWa);
                                  if (isWa && !link.label) {
                                    updateLink(index, 'label', 'WhatsApp');
                                  }
                                }}
                                className="text-[10px] text-blue-500 hover:text-blue-700 font-medium"
                              >
                                {link.isWhatsApp ? 'Usar link personalizado' : 'Usar WhatsApp'}
                              </button>
                            )}
                          </div>
                          <div className="relative mt-1">
                            {link.isWhatsApp && (
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                                +55
                              </span>
                            )}
                            <input
                              type={link.isWhatsApp ? 'tel' : 'url'}
                              value={link.url}
                              onChange={(e) => updateLink(index, 'url', e.target.value)}
                              placeholder={link.isWhatsApp ? '11999999999' : 'https://...'}
                              className={`w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 ${
                                link.isWhatsApp ? 'pl-10' : ''
                              }`}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer — Salvar */}
        {!loading && (
          <div className="flex-shrink-0 border-t border-slate-200 px-5 py-4 bg-white">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 rounded-xl"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar alterações'
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MinhaVitrineModal;
