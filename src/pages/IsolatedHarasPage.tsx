import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
  MapPin,
  Instagram,
  ExternalLink,
  Building2,
  Verified,
  Calendar,
  X,
  ChevronLeft,
  ChevronRight,
  Ruler,
  Weight,
  Award,
} from 'lucide-react';
import { useHarasData, type HarasAnimal } from '@/hooks/useHarasData';
import { formatNameUppercase } from '@/utils/nameFormat';
import { getAge } from '@/utils/animalAge';
import mangalargaImg from '@/assets/mangalarga.jpg';

// ─── Tipos ────────────────────────────────────────────────
type DisplayMode = 'isolated';

// ─── Helpers ──────────────────────────────────────────────
function getAnimalImages(animal: HarasAnimal): string[] {
  if (Array.isArray(animal.images) && animal.images.length > 0) {
    return animal.images as string[];
  }
  return [mangalargaImg];
}

function getCategoryStyle(category?: string) {
  switch (category) {
    case 'Garanhão':
      return { bg: 'bg-blue-50 text-blue-700 border-blue-200', label: '♂ Garanhão' };
    case 'Doadora':
      return { bg: 'bg-pink-50 text-pink-700 border-pink-200', label: '♀ Doadora' };
    case 'Potro':
      return { bg: 'bg-green-50 text-green-700 border-green-200', label: '♂ Potro' };
    case 'Potra':
      return { bg: 'bg-purple-50 text-purple-700 border-purple-200', label: '♀ Potra' };
    default:
      return { bg: 'bg-slate-50 text-slate-600 border-slate-200', label: category || '' };
  }
}

// ─── Modal de detalhes do animal ──────────────────────────
const AnimalDetailModal: React.FC<{
  animal: HarasAnimal;
  onClose: () => void;
}> = ({ animal, onClose }) => {
  const [photoIndex, setPhotoIndex] = useState(0);
  const images = getAnimalImages(animal);
  const displayName = formatNameUppercase(animal.name);
  const catStyle = getCategoryStyle(animal.category);
  const age = animal.birth_date ? getAge(animal.birth_date) : null;

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const prevPhoto = () => setPhotoIndex((i) => (i === 0 ? images.length - 1 : i - 1));
  const nextPhoto = () => setPhotoIndex((i) => (i === images.length - 1 ? 0 : i + 1));

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Detalhes de ${displayName}`}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60 animate-[fadeIn_200ms_ease-out]" />

      {/* Modal */}
      <div
        className="relative z-10 bg-white w-full sm:max-w-lg sm:rounded-2xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col animate-[slideUp_300ms_ease-out] sm:animate-[scaleIn_200ms_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Galeria ── */}
        <div className="relative flex-shrink-0">
          <div className="aspect-[4/3] bg-slate-100 overflow-hidden">
            <img
              src={images[photoIndex]}
              alt={`${displayName} - foto ${photoIndex + 1}`}
              className="w-full h-full object-cover"
            />
          </div>

          <button
            onClick={onClose}
            className="absolute top-3 right-3 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors backdrop-blur-sm"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>

          {images.length > 1 && (
            <>
              <button
                onClick={prevPhoto}
                className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-1.5 transition-colors backdrop-blur-sm"
                aria-label="Foto anterior"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={nextPhoto}
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-1.5 transition-colors backdrop-blur-sm"
                aria-label="Próxima foto"
              >
                <ChevronRight className="h-5 w-5" />
              </button>

              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {images.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPhotoIndex(i)}
                    className={`h-2 rounded-full transition-all ${
                      i === photoIndex ? 'bg-white w-5' : 'bg-white/50 w-2'
                    }`}
                    aria-label={`Foto ${i + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* ── Conteúdo ── */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-6 space-y-5">
          {/* Nome + categoria */}
          <div>
            <h2 className="text-2xl font-bold text-slate-900 leading-tight">{displayName}</h2>
            {animal.category && (
              <span className={`inline-block mt-2 text-xs font-semibold px-3 py-1 rounded-full border ${catStyle.bg}`}>
                {catStyle.label}
              </span>
            )}
          </div>

          {/* Grid de info */}
          <div className="grid grid-cols-2 gap-3">
            {animal.breed && (
              <div className="bg-slate-50 rounded-xl p-3.5">
                <p className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">Raça</p>
                <p className="text-sm font-semibold text-slate-800 mt-0.5">{animal.breed}</p>
              </div>
            )}
            {animal.coat && (
              <div className="bg-slate-50 rounded-xl p-3.5">
                <p className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">Pelagem</p>
                <p className="text-sm font-semibold text-slate-800 mt-0.5">{animal.coat}</p>
              </div>
            )}
            {age && (
              <div className="bg-slate-50 rounded-xl p-3.5">
                <p className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">Idade</p>
                <p className="text-sm font-semibold text-slate-800 mt-0.5">{age}</p>
              </div>
            )}
            {animal.gender && (
              <div className="bg-slate-50 rounded-xl p-3.5">
                <p className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">Sexo</p>
                <p className="text-sm font-semibold text-slate-800 mt-0.5">{animal.gender}</p>
              </div>
            )}
            {(animal.height as number) > 0 && (
              <div className="bg-slate-50 rounded-xl p-3.5">
                <p className="text-[11px] text-slate-400 uppercase tracking-wider font-medium flex items-center gap-1">
                  <Ruler className="h-3 w-3" /> Altura
                </p>
                <p className="text-sm font-semibold text-slate-800 mt-0.5">{animal.height as number} cm</p>
              </div>
            )}
            {(animal.weight as number) > 0 && (
              <div className="bg-slate-50 rounded-xl p-3.5">
                <p className="text-[11px] text-slate-400 uppercase tracking-wider font-medium flex items-center gap-1">
                  <Weight className="h-3 w-3" /> Peso
                </p>
                <p className="text-sm font-semibold text-slate-800 mt-0.5">{animal.weight as number} kg</p>
              </div>
            )}
          </div>

          {/* Localização */}
          {(animal.current_city || animal.current_state) && (
            <div className="flex items-center gap-1.5 text-sm text-slate-500">
              <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
              {[animal.current_city, animal.current_state].filter(Boolean).join(', ')}
            </div>
          )}

          {/* Registro */}
          {animal.registration_number && (
            <div className="flex items-center gap-1.5 text-sm text-slate-500">
              <Award className="h-3.5 w-3.5 flex-shrink-0" />
              Registro: {animal.registration_number as string}
            </div>
          )}

          {/* Títulos */}
          {Array.isArray(animal.titles) && (animal.titles as string[]).length > 0 && (
            <div>
              <p className="text-[11px] text-slate-400 uppercase tracking-wider font-medium mb-2">Títulos</p>
              <div className="flex flex-wrap gap-1.5">
                {(animal.titles as string[]).map((title, i) => (
                  <span key={i} className="text-xs bg-amber-50 text-amber-700 font-medium px-2.5 py-1 rounded-lg border border-amber-200">
                    {title}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Descrição */}
          {animal.description && (
            <div>
              <p className="text-[11px] text-slate-400 uppercase tracking-wider font-medium mb-1.5">Descrição</p>
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                {animal.description as string}
              </p>
            </div>
          )}

          {/* Genealogia */}
          {(animal.father_name || animal.mother_name) && (
            <div className="border-t border-slate-100 pt-5">
              <p className="text-[11px] text-slate-400 uppercase tracking-wider font-medium mb-3">Genealogia</p>
              <div className="grid grid-cols-2 gap-3">
                {animal.father_name && (
                  <div className="bg-blue-50 rounded-xl p-3.5 border border-blue-100">
                    <p className="text-[10px] text-blue-400 uppercase tracking-wider font-medium">Pai</p>
                    <p className="text-sm font-semibold text-blue-800 mt-0.5">
                      {formatNameUppercase(animal.father_name as string)}
                    </p>
                  </div>
                )}
                {animal.mother_name && (
                  <div className="bg-pink-50 rounded-xl p-3.5 border border-pink-100">
                    <p className="text-[10px] text-pink-400 uppercase tracking-wider font-medium">Mãe</p>
                    <p className="text-sm font-semibold text-pink-800 mt-0.5">
                      {formatNameUppercase(animal.mother_name as string)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Card de animal ───────────────────────────────────────
const IsolatedAnimalCard: React.FC<{
  animal: HarasAnimal;
  onSelect: (animal: HarasAnimal) => void;
  index: number;
}> = ({ animal, onSelect, index }) => {
  const displayName = formatNameUppercase(animal.name);
  const imageSrc = getAnimalImages(animal)[0];
  const catStyle = getCategoryStyle(animal.category);

  return (
    <div
      className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-all duration-300 cursor-pointer active:scale-[0.97] animate-[fadeIn_400ms_ease-out_both]"
      style={{ animationDelay: `${index * 60}ms` }}
      onClick={() => onSelect(animal)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(animal); } }}
      aria-label={`Ver detalhes de ${displayName}`}
    >
      {/* Imagem — proporção 4:3 para dar mais respiro */}
      <div className="aspect-[4/3] overflow-hidden bg-slate-100">
        <img
          src={imageSrc}
          alt={displayName}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
          loading="lazy"
        />
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="text-[15px] font-bold text-slate-900 truncate leading-tight">{displayName}</h3>
        <p className="text-slate-400 text-xs mt-1.5">
          {animal.breed || '—'}{animal.coat ? ` • ${animal.coat}` : ''}
        </p>
        {animal.category && (
          <span className={`inline-block mt-2.5 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${catStyle.bg}`}>
            {catStyle.label}
          </span>
        )}
      </div>
    </div>
  );
};

// ─── Seção de categoria ───────────────────────────────────
const AnimalSection: React.FC<{
  title: string;
  animals: HarasAnimal[];
  count: number;
  onSelectAnimal: (animal: HarasAnimal) => void;
}> = ({ title, animals, count, onSelectAnimal }) => {
  if (count === 0) return null;
  return (
    <section className="mt-10">
      <div className="flex items-center gap-3 mb-5">
        <h2 className="text-lg font-bold text-slate-800">{title}</h2>
        <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-full">
          {count}
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {animals.map((animal, i) => (
          <IsolatedAnimalCard key={animal.id} animal={animal} onSelect={onSelectAnimal} index={i} />
        ))}
      </div>
    </section>
  );
};

// ─── Página principal isolada ─────────────────────────────
const IsolatedHarasPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const mode: DisplayMode = 'isolated';

  const { displayData, garanhoes, doadoras, potros, potras, outros, loading, errorMessage } =
    useHarasData({ slug });

  const [selectedAnimal, setSelectedAnimal] = useState<HarasAnimal | null>(null);

  const handleSelectAnimal = useCallback((animal: HarasAnimal) => {
    setSelectedAnimal(animal);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedAnimal(null);
  }, []);

  // Scroll lock
  useEffect(() => {
    if (selectedAnimal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [selectedAnimal]);

  // ── Loading ──
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
        <div className="text-center animate-[fadeIn_300ms_ease-out]">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-2 border-slate-200 border-t-blue-600 mb-4" />
          <p className="text-slate-400 text-sm">Carregando...</p>
        </div>
      </div>
    );
  }

  // ── Erro ──
  if (errorMessage || !displayData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center px-4">
        <div className="text-center max-w-md animate-[fadeIn_300ms_ease-out]">
          <Building2 className="h-16 w-16 text-slate-200 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Perfil não encontrado</h1>
          <p className="text-slate-400 text-sm">
            {errorMessage || 'O perfil solicitado não existe ou não está disponível.'}
          </p>
        </div>
      </div>
    );
  }

  const totalAnimals =
    garanhoes.length + doadoras.length + potros.length + potras.length + outros.length;

  const instagramHandle = displayData.instagram
    ? displayData.instagram.replace('@', '')
    : null;

  const instagramUrl = instagramHandle
    ? `https://instagram.com/${instagramHandle}`
    : null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col" data-mode={mode}>

      {/* ══════════════════════════════════════════════════════
          HERO — Identidade do Haras (destaque principal)
          ══════════════════════════════════════════════════════ */}
      <header className="relative bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 text-white overflow-hidden">
        {/* Padrão decorativo sutil */}
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
          backgroundSize: '24px 24px',
        }} />

        <div className="relative max-w-2xl mx-auto px-5 pt-10 pb-8 text-center animate-[fadeIn_500ms_ease-out]">
          {/* Avatar */}
          <div className="w-32 h-32 sm:w-36 sm:h-36 mx-auto rounded-full overflow-hidden border-[3px] border-white/20 shadow-2xl mb-6 ring-4 ring-white/10">
            {displayData.logo ? (
              <img
                src={displayData.logo}
                alt={displayData.displayName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-600 to-slate-700">
                <Building2 className="h-12 w-12 text-slate-400" />
              </div>
            )}
          </div>

          {/* Nome */}
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight flex items-center justify-center gap-2.5 leading-tight">
            {displayData.displayName}
            {displayData.verified && (
              <Verified className="h-6 w-6 text-blue-400 flex-shrink-0" />
            )}
          </h1>

          {/* Localização */}
          {displayData.location && displayData.location !== 'Não informado' && (
            <p className="text-slate-300 mt-2.5 flex items-center justify-center gap-1.5 text-sm font-medium">
              <MapPin className="h-3.5 w-3.5" />
              {displayData.location}
            </p>
          )}

          {/* Fundação + Instagram — linha compacta */}
          <div className="flex items-center justify-center gap-4 mt-2 text-xs text-slate-400">
            {displayData.foundedYear && displayData.foundedYear !== 'N/A' && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Desde {displayData.foundedYear}
              </span>
            )}
            {instagramUrl && (
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-slate-300 hover:text-white transition-colors"
              >
                <Instagram className="h-3.5 w-3.5" />
                @{instagramHandle}
                <ExternalLink className="h-2.5 w-2.5 opacity-50" />
              </a>
            )}
          </div>

          {/* Descrição */}
          {displayData.description && displayData.description !== 'Informações não disponíveis.' && (
            <p className="text-slate-300 mt-5 text-sm max-w-md mx-auto leading-relaxed">
              {displayData.description}
            </p>
          )}

          {/* Contador de animais */}
          {totalAnimals > 0 && (
            <div className="mt-6 inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 text-xs font-medium text-slate-200">
              <span className="font-bold text-white">{totalAnimals}</span> animais no plantel
            </div>
          )}
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════
          CATÁLOGO — Animais
          ══════════════════════════════════════════════════════ */}
      {totalAnimals > 0 && (
        <main className="flex-1 max-w-2xl mx-auto w-full px-5 pt-2 pb-10">
          <AnimalSection title="Garanhões" animals={garanhoes} count={garanhoes.length} onSelectAnimal={handleSelectAnimal} />
          <AnimalSection title="Doadoras" animals={doadoras} count={doadoras.length} onSelectAnimal={handleSelectAnimal} />
          <AnimalSection title="Potros" animals={potros} count={potros.length} onSelectAnimal={handleSelectAnimal} />
          <AnimalSection title="Potras" animals={potras} count={potras.length} onSelectAnimal={handleSelectAnimal} />
          <AnimalSection title="Outros" animals={outros} count={outros.length} onSelectAnimal={handleSelectAnimal} />
        </main>
      )}

      {/* ── Sem animais ── */}
      {totalAnimals === 0 && (
        <main className="flex-1 flex items-center justify-center px-5 py-16">
          <p className="text-slate-400 text-sm text-center">Nenhum animal cadastrado ainda.</p>
        </main>
      )}

      {/* ══════════════════════════════════════════════════════
          FOOTER
          ══════════════════════════════════════════════════════ */}
      <footer className="border-t border-slate-200 bg-white py-5">
        <p className="text-center text-[11px] text-slate-400">
          Powered by{' '}
          <span className="font-semibold text-slate-500">Vitrine do Cavalo</span>
        </p>
      </footer>

      {/* ── Modal ── */}
      {selectedAnimal && (
        <AnimalDetailModal
          animal={selectedAnimal}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
};

export default IsolatedHarasPage;
