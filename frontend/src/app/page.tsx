'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ChevronDown } from 'lucide-react';
import { useProviders } from '@/lib/api/hooks/useProviders';
import { MAPBOX_TOKEN } from '@/lib/config/constants';

// Lazy load ExploreMap (heavy component with mapbox)
const ExploreMap = dynamic(
  () => import('@/components/map/ExploreMap').then((m) => ({ default: m.ExploreMap })),
  { ssr: false }
);

// Lightweight map just for the blurred hero background
const MapGL = dynamic(
  () => import('react-map-gl').then((m) => ({ default: m.default })),
  { ssr: false }
);

const SANTIAGO = { lat: -33.4489, lng: -70.6693 };

export default function HomePage() {
  const { data: providersData } = useProviders({});
  const providers = providersData?.results || [];

  // Transition state (one-way)
  const [mapRevealed, setMapRevealed] = useState(false);
  const [transitionDone, setTransitionDone] = useState(false);
  const revealedRef = useRef(false);

  const triggerReveal = useCallback(() => {
    if (revealedRef.current) return;
    revealedRef.current = true;
    setMapRevealed(true);
    setTimeout(() => setTransitionDone(true), 1200);
  }, []);

  // Scroll / wheel / touch trigger
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

  return (
    <div className="flex flex-col bg-[#0D213B]">
      <section className="relative h-[calc(100dvh-3rem)] overflow-hidden">
        {/* ===== PRE-REVEAL: blurred map background ===== */}
        {!transitionDone && (
          <>
            <div className="absolute inset-0">
              {MAPBOX_TOKEN && (
                <MapGL
                  longitude={SANTIAGO.lng}
                  latitude={SANTIAGO.lat}
                  zoom={12}
                  mapStyle="mapbox://styles/mapbox/navigation-night-v1"
                  mapboxAccessToken={MAPBOX_TOKEN}
                  attributionControl={false}
                  interactive={false}
                  style={{ width: '100%', height: '100%' }}
                />
              )}
            </div>

            {/* Blur overlay */}
            <div
              className="absolute inset-0 pointer-events-none transition-opacity duration-[1200ms] ease-out"
              style={{
                opacity: mapRevealed ? 0 : 1,
                backdropFilter: 'blur(6px) brightness(0.5)',
                WebkitBackdropFilter: 'blur(6px) brightness(0.5)',
              }}
            />

            {/* Gradient overlays */}
            <div
              className="absolute inset-0 pointer-events-none transition-opacity duration-[1000ms] ease-out"
              style={{ opacity: mapRevealed ? 0 : 1 }}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-[#0D213B]/80 via-transparent to-[#0D213B]/90" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#0D213B]/60 via-transparent to-[#0D213B]/60" />
            </div>
          </>
        )}

        {/* ===== POST-REVEAL: full interactive ExploreMap ===== */}
        {mapRevealed && (
          <div
            className="absolute inset-0 transition-opacity duration-700 ease-out"
            style={{ opacity: transitionDone ? 1 : 0 }}
          >
            <ExploreMap height="100%" />
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

        {/* Bottom fade (hero only) */}
        {!transitionDone && (
          <div
            className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#0D213B] to-transparent pointer-events-none z-10 transition-opacity duration-700"
            style={{ opacity: mapRevealed ? 0 : 1 }}
          />
        )}

        {/* Scroll indicator */}
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
    </div>
  );
}
