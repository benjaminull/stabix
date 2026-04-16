'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  MapPin,
  Sparkles,
  ChevronDown,
  Star,
  X,
  SlidersHorizontal,
  DollarSign,
} from 'lucide-react';
import { useProviders } from '@/lib/api/hooks/useProviders';
import { useCategories } from '@/lib/api/hooks/useTaxonomy';
import { ProviderProfile, ServiceCategory } from '@/lib/api/client';
import { MAPBOX_TOKEN, PRICE_BANDS } from '@/lib/config/constants';
import { formatRating, formatDistance } from '@/lib/utils/format';

// Dynamic imports for react-map-gl (no SSR)
const MapGL = dynamic(
  () => import('react-map-gl').then((m) => ({ default: m.default })),
  { ssr: false }
);
const MarkerGL = dynamic(
  () => import('react-map-gl').then((m) => ({ default: m.Marker })),
  { ssr: false }
);
const NavigationControlGL = dynamic(
  () => import('react-map-gl').then((m) => ({ default: m.NavigationControl })),
  { ssr: false }
);
const GeolocateControlGL = dynamic(
  () => import('react-map-gl').then((m) => ({ default: m.GeolocateControl })),
  { ssr: false }
);

// ---------- constants ----------
const SANTIAGO = { lat: -33.4489, lng: -70.6693 };
const MAP_ZOOM = 12;

const CATEGORY_COLORS: Record<string, string> = {
  'servicios-hogar': '#3B82F6',
  gasfiteria: '#DC2626',
  electricidad: '#F59E0B',
  limpieza: '#06B6D4',
  cerrajeria: '#475569',
  jardineria: '#16A34A',
  construccion: '#9333EA',
  carpinteria: '#92400E',
  pintura: '#EC4899',
  albanileria: '#78350F',
  'servicios-profesionales': '#DB2777',
  consultoria: '#7C3AED',
  contabilidad: '#059669',
  'servicios-personales': '#0EA5E9',
  entrenamiento: '#0D9488',
  tecnologia: '#4F46E5',
  'reparacion-computadores': '#6366F1',
  'instalacion-tv': '#8B5CF6',
  default: '#64748B',
};

function getCategoryColor(categories?: ServiceCategory[]): string {
  if (!categories || categories.length === 0) return CATEGORY_COLORS.default;
  return CATEGORY_COLORS[categories[0].slug] || CATEGORY_COLORS.default;
}

function isValidCoordinate(coords: unknown): coords is [number, number] {
  return (
    Array.isArray(coords) &&
    coords.length === 2 &&
    typeof coords[0] === 'number' &&
    typeof coords[1] === 'number' &&
    !isNaN(coords[0]) &&
    !isNaN(coords[1]) &&
    coords[0] >= -180 &&
    coords[0] <= 180 &&
    coords[1] >= -90 &&
    coords[1] <= 90
  );
}

// ---------- component ----------
export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const { data: categories } = useCategories();

  // Filters (local, applied directly to useProviders)
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activePriceBand, setActivePriceBand] = useState<string | null>(null);
  const [minRating, setMinRating] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  // Fetch providers with filters
  const { data: providersData } = useProviders({
    category: activeCategory || undefined,
    price_band: activePriceBand || undefined,
    min_rating: minRating > 0 ? minRating : undefined,
    q: searchQuery || undefined,
  });
  const providers = providersData?.results || [];

  // Transition state (one-way)
  const [mapRevealed, setMapRevealed] = useState(false);
  const [markersVisible, setMarkersVisible] = useState(false);
  const [transitionDone, setTransitionDone] = useState(false);
  const revealedRef = useRef(false);

  // Selected provider (marker click → card popup)
  const [selectedProvider, setSelectedProvider] = useState<ProviderProfile | null>(null);

  // Map viewState
  const [viewState, setViewState] = useState({
    longitude: SANTIAGO.lng,
    latitude: SANTIAGO.lat,
    zoom: MAP_ZOOM,
  });

  // ---- trigger reveal ----
  const triggerReveal = useCallback(() => {
    if (revealedRef.current) return;
    revealedRef.current = true;
    setMapRevealed(true);
    setTimeout(() => setMarkersVisible(true), 800);
    setTimeout(() => setTransitionDone(true), 1500);
  }, []);

  // ---- scroll / wheel / touch trigger ----
  useEffect(() => {
    const handler = () => {
      if (!revealedRef.current) triggerReveal();
    };
    window.addEventListener('scroll', handler, { passive: true });
    window.addEventListener('wheel', handler, { passive: true });
    window.addEventListener('touchmove', handler, { passive: true });
    return () => {
      window.removeEventListener('scroll', handler);
      window.removeEventListener('wheel', handler);
      window.removeEventListener('touchmove', handler);
    };
  }, [triggerReveal]);

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
  }, []);

  const toggleCategory = useCallback((slug: string) => {
    setActiveCategory((prev) => (prev === slug ? null : slug));
    setSelectedProvider(null);
  }, []);

  const togglePriceBand = useCallback((band: string) => {
    setActivePriceBand((prev) => (prev === band ? null : band));
    setSelectedProvider(null);
  }, []);

  const handleMarkerClick = useCallback(
    (provider: ProviderProfile) => {
      setSelectedProvider((prev) => (prev?.id === provider.id ? null : provider));
    },
    []
  );

  const clearFilters = useCallback(() => {
    setActiveCategory(null);
    setActivePriceBand(null);
    setMinRating(0);
    setSearchQuery('');
    setSelectedProvider(null);
  }, []);

  const hasActiveFilters = activeCategory || activePriceBand || minRating > 0 || searchQuery;

  return (
    <div className="flex flex-col bg-[#0D213B]">
      <section className="relative h-[100dvh] overflow-hidden">
        {/* ===== MAP ===== */}
        <div className="absolute inset-0">
          {MAPBOX_TOKEN ? (
            <MapGL
              {...viewState}
              onMove={(evt: any) => setViewState(evt.viewState)}
              onClick={() => setSelectedProvider(null)}
              mapStyle="mapbox://styles/mapbox/navigation-night-v1"
              mapboxAccessToken={MAPBOX_TOKEN}
              attributionControl={false}
              style={{ width: '100%', height: '100%' }}
            >
              {mapRevealed && (
                <>
                  <NavigationControlGL position="top-right" />
                  <GeolocateControlGL
                    position="top-right"
                    trackUserLocation
                    showUserHeading
                  />
                </>
              )}

              {/* Markers */}
              {markersVisible &&
                providers.map((provider, index) => {
                  const coords = provider.location?.coordinates;
                  if (!isValidCoordinate(coords)) return null;
                  const [lng, lat] = coords;
                  const color = getCategoryColor(provider.categories);
                  const isSelected = selectedProvider?.id === provider.id;

                  return (
                    <MarkerGL
                      key={provider.id}
                      longitude={lng}
                      latitude={lat}
                      anchor="bottom"
                      onClick={(e: any) => {
                        e.originalEvent.stopPropagation();
                        handleMarkerClick(provider);
                      }}
                    >
                      <div
                        className="cursor-pointer"
                        style={{
                          animation: `markerDrop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) ${index * 100}ms both`,
                        }}
                      >
                        <div
                          className="relative transition-transform duration-200"
                          style={{
                            transform: isSelected ? 'scale(1.3)' : 'scale(1)',
                          }}
                        >
                          <div
                            className="absolute inset-0 rounded-full blur-md opacity-60 animate-pulse"
                            style={{
                              background: `radial-gradient(circle, ${color}, transparent)`,
                              width: isSelected ? '50px' : '38px',
                              height: isSelected ? '50px' : '38px',
                              transform: 'translate(-25%, 0)',
                            }}
                          />
                          <div
                            className="absolute inset-0 rounded-full blur-sm opacity-80"
                            style={{
                              background: color,
                              width: isSelected ? '42px' : '34px',
                              height: isSelected ? '42px' : '34px',
                              transform: 'translate(-10%, 4px)',
                            }}
                          />
                          <MapPin
                            size={isSelected ? 42 : 34}
                            fill={color}
                            color="#0D213B"
                            strokeWidth={3}
                            className="relative"
                            style={{
                              filter: `drop-shadow(0 4px 8px ${color}40) drop-shadow(0 0 12px ${color}60)`,
                            }}
                          />
                          {provider.total_reviews > 0 && (
                            <div
                              className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2
                                         bg-gradient-to-br from-[#1a2f47] to-[#0D213B] rounded-full
                                         px-2 py-0.5 text-xs font-bold shadow-lg border-2"
                              style={{
                                minWidth: '28px',
                                textAlign: 'center',
                                borderColor: color,
                                color: '#FFD166',
                                boxShadow: `0 0 12px ${color}80, 0 4px 8px rgba(0,0,0,0.4)`,
                              }}
                            >
                              {provider.average_rating.toFixed(1)}
                            </div>
                          )}
                        </div>
                      </div>
                    </MarkerGL>
                  );
                })}
            </MapGL>
          ) : (
            <div className="h-full flex items-center justify-center bg-[#0D213B]">
              <p className="text-gray-400 text-sm">
                Configura NEXT_PUBLIC_MAPBOX_TOKEN para ver el mapa
              </p>
            </div>
          )}
        </div>

        {/* ===== BLUR OVERLAY (pre-reveal) ===== */}
        {!transitionDone && (
          <div
            className="absolute inset-0 pointer-events-none transition-opacity duration-[1200ms] ease-out"
            style={{
              opacity: mapRevealed ? 0 : 1,
              backdropFilter: 'blur(6px) brightness(0.5)',
              WebkitBackdropFilter: 'blur(6px) brightness(0.5)',
            }}
          />
        )}

        {/* ===== GRADIENT OVERLAYS (pre-reveal) ===== */}
        {!transitionDone && (
          <div
            className="absolute inset-0 pointer-events-none transition-opacity duration-[1000ms] ease-out"
            style={{ opacity: mapRevealed ? 0 : 1 }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-[#0D213B]/80 via-transparent to-[#0D213B]/90" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0D213B]/60 via-transparent to-[#0D213B]/60" />
          </div>
        )}

        {/* ===== HERO CONTENT ===== */}
        <AnimatePresence>
          {!transitionDone && (
            <motion.div
              className="absolute inset-0 z-10 flex flex-col items-center justify-center px-4"
              initial={false}
              animate={{
                opacity: mapRevealed ? 0 : 1,
                y: mapRevealed ? -40 : 0,
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              style={{ pointerEvents: mapRevealed ? 'none' : 'auto' }}
            >
              <motion.div
                className="inline-flex items-center gap-2 px-4 py-2 mb-5 rounded-full bg-[#0D213B]/70 backdrop-blur-md border border-[#FF8C42]/30"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Sparkles className="w-4 h-4 text-[#FF8C42]" />
                <span className="text-sm font-medium text-[#FFD166]">
                  {providers.length} proveedores disponibles
                </span>
              </motion.div>

              <motion.h1
                className="font-display text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-4 text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                <span className="text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]">
                  Encuentra tu{' '}
                </span>
                <span className="bg-gradient-to-r from-[#FF8C42] via-[#FFD166] to-[#FF8C42] bg-clip-text text-transparent">
                  profesional
                </span>
              </motion.h1>

              <motion.p
                className="text-lg md:text-xl text-gray-300 mb-8 text-center max-w-lg drop-shadow-[0_1px_4px_rgba(0,0,0,0.5)]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                Servicios verificados cerca de ti en{' '}
                <span className="text-[#FFD166]">Santiago</span>
              </motion.p>

              <motion.button
                onClick={triggerReveal}
                className="mt-4 group flex items-center gap-3 px-8 py-4 rounded-full bg-gradient-to-r from-[#FF8C42] to-[#FFD166] text-[#0D213B] font-bold text-lg shadow-[0_0_40px_rgba(255,140,66,0.4)] hover:shadow-[0_0_60px_rgba(255,140,66,0.6)] hover:scale-105 transition-all duration-300"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                Explorar el mapa
                <ChevronDown className="w-5 h-5 animate-bounce" />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ===== MAP UI (after reveal) — search + filters + provider card ===== */}
        <div
          className="absolute inset-x-0 top-0 z-20 transition-all duration-[1000ms] ease-out"
          style={{
            opacity: mapRevealed ? 1 : 0,
            transform: `translateY(${mapRevealed ? '0' : '-20px'})`,
            pointerEvents: mapRevealed ? 'auto' : 'none',
          }}
        >
          <div className="px-4 pt-4 max-w-2xl mx-auto space-y-3">
            {/* Search bar */}
            <form onSubmit={handleSearch}>
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-[#FF8C42] to-[#FFD166] rounded-2xl blur opacity-20" />
                <div className="relative flex items-center bg-[#0D213B]/90 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
                  <Search className="w-4 h-4 text-[#FF8C42] ml-4 shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar servicio..."
                    className="flex-1 bg-transparent text-white placeholder:text-white/40 px-3 py-3 text-sm focus:outline-none"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="p-2 text-white/40 hover:text-white/70 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowFilters(!showFilters)}
                    className={`p-3 transition-colors border-l border-white/10 ${
                      showFilters || hasActiveFilters
                        ? 'text-[#FF8C42]'
                        : 'text-white/50 hover:text-white/70'
                    }`}
                  >
                    <SlidersHorizontal className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </form>

            {/* Category pills (always visible) */}
            <div className="flex flex-wrap gap-2">
              {categories?.results?.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => toggleCategory(cat.slug)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-md border transition-all duration-200 ${
                    activeCategory === cat.slug
                      ? 'bg-[#FF8C42]/20 border-[#FF8C42]/60 text-[#FFD166]'
                      : 'bg-[#0D213B]/70 border-white/10 text-white/60 hover:border-[#FF8C42]/30 hover:text-white/80'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Expanded filters */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="bg-[#0D213B]/90 backdrop-blur-xl rounded-2xl border border-white/10 p-4 space-y-4">
                    {/* Price band */}
                    <div>
                      <label className="text-xs font-medium text-white/50 uppercase tracking-wider mb-2 block">
                        Precio
                      </label>
                      <div className="flex gap-2">
                        {Object.entries(PRICE_BANDS).map(([key, band]) => (
                          <button
                            key={key}
                            onClick={() => togglePriceBand(key)}
                            className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all duration-200 ${
                              activePriceBand === key
                                ? 'bg-[#FF8C42]/20 border-[#FF8C42]/60 text-[#FFD166]'
                                : 'bg-white/5 border-white/10 text-white/50 hover:border-white/20 hover:text-white/70'
                            }`}
                          >
                            {band.symbol}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Min rating */}
                    <div>
                      <label className="text-xs font-medium text-white/50 uppercase tracking-wider mb-2 block">
                        Rating mínimo
                      </label>
                      <div className="flex gap-2">
                        {[0, 3, 3.5, 4, 4.5].map((rating) => (
                          <button
                            key={rating}
                            onClick={() => setMinRating(rating === minRating ? 0 : rating)}
                            className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all duration-200 flex items-center justify-center gap-1 ${
                              minRating === rating && rating > 0
                                ? 'bg-[#FF8C42]/20 border-[#FF8C42]/60 text-[#FFD166]'
                                : 'bg-white/5 border-white/10 text-white/50 hover:border-white/20 hover:text-white/70'
                            }`}
                          >
                            {rating === 0 ? (
                              'Todos'
                            ) : (
                              <>
                                <Star className="w-3 h-3 fill-current" />
                                {rating}+
                              </>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Clear all */}
                    {hasActiveFilters && (
                      <button
                        onClick={clearFilters}
                        className="w-full py-2 text-xs text-[#FF8C42] hover:text-[#FFD166] transition-colors"
                      >
                        Limpiar filtros
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ===== RESULTS COUNT (bottom-left) ===== */}
        {mapRevealed && (
          <div className="absolute bottom-4 left-4 z-20">
            <div className="bg-[#0D213B]/80 backdrop-blur-md rounded-full px-4 py-2 border border-white/10 text-xs text-white/60">
              <span className="text-[#FFD166] font-semibold">{providers.length}</span> proveedores
              {hasActiveFilters && (
                <span className="text-white/40"> (filtrados)</span>
              )}
            </div>
          </div>
        )}

        {/* ===== SELECTED PROVIDER CARD (bottom-center) ===== */}
        <AnimatePresence>
          {selectedProvider && mapRevealed && (
            <motion.div
              className="absolute bottom-4 left-1/2 z-20 w-full max-w-sm px-4"
              initial={{ opacity: 0, y: 20, x: '-50%' }}
              animate={{ opacity: 1, y: 0, x: '-50%' }}
              exit={{ opacity: 0, y: 20, x: '-50%' }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              <Link href={`/providers/${selectedProvider.id}`}>
                <div className="relative group cursor-pointer">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-[#FF8C42] to-[#FFD166] rounded-2xl blur opacity-20 group-hover:opacity-40 transition" />
                  <div className="relative bg-[#0D213B]/95 backdrop-blur-xl rounded-2xl border border-white/10 p-4 hover:border-[#FF8C42]/30 transition-colors">
                    {/* Close button */}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setSelectedProvider(null);
                      }}
                      className="absolute top-3 right-3 p-1 text-white/30 hover:text-white/60 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>

                    <div className="flex items-start gap-3">
                      {/* Color dot */}
                      <div
                        className="w-3 h-3 rounded-full mt-1.5 shrink-0"
                        style={{
                          backgroundColor: getCategoryColor(selectedProvider.categories),
                          boxShadow: `0 0 8px ${getCategoryColor(selectedProvider.categories)}80`,
                        }}
                      />

                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-white truncate pr-6">
                          {selectedProvider.user_email}
                        </h3>

                        <div className="flex items-center gap-3 mt-1.5 text-xs text-white/50">
                          {selectedProvider.total_reviews > 0 && (
                            <div className="flex items-center gap-1">
                              <Star className="w-3 h-3 fill-[#FFD166] text-[#FFD166]" />
                              <span className="text-[#FFD166] font-medium">
                                {formatRating(selectedProvider.average_rating)}
                              </span>
                              <span>({selectedProvider.total_reviews})</span>
                            </div>
                          )}
                          {selectedProvider.distance_km !== undefined && (
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              <span>{formatDistance(selectedProvider.distance_km)}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            <span>
                              {PRICE_BANDS[selectedProvider.price_band]?.symbol || '$$'}
                            </span>
                          </div>
                        </div>

                        {/* Categories */}
                        {selectedProvider.categories && selectedProvider.categories.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {selectedProvider.categories.slice(0, 3).map((cat) => (
                              <span
                                key={cat.id}
                                className="px-2 py-0.5 rounded-full text-[10px] font-medium border"
                                style={{
                                  borderColor: `${getCategoryColor([cat])}40`,
                                  color: getCategoryColor([cat]),
                                  backgroundColor: `${getCategoryColor([cat])}10`,
                                }}
                              >
                                {cat.name}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="mt-2 text-[10px] text-white/30">
                          {selectedProvider.total_completed_orders} trabajos completados
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom fade (hero only) */}
        {!transitionDone && (
          <div
            className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#0D213B] to-transparent pointer-events-none z-10 transition-opacity duration-700"
            style={{ opacity: mapRevealed ? 0 : 1 }}
          />
        )}

        {/* Scroll indicator (hero only) */}
        <AnimatePresence>
          {!mapRevealed && (
            <motion.div
              className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20"
              animate={{ y: [0, 8, 0] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <div className="w-6 h-10 border-2 border-[#FF8C42]/40 rounded-full flex justify-center p-1">
                <motion.div
                  className="w-1.5 h-3 bg-gradient-to-b from-[#FF8C42] to-[#FFD166] rounded-full"
                  animate={{ y: [0, 12, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Keyframes */}
      <style jsx global>{`
        @keyframes markerDrop {
          0% {
            transform: translateY(-40px) scale(0);
            opacity: 0;
          }
          60% {
            transform: translateY(5px) scale(1.1);
            opacity: 1;
          }
          100% {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
