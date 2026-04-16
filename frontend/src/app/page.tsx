'use client';

import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Search, MapPin, ArrowRight, Sparkles } from 'lucide-react';
import { useProviders } from '@/lib/api/hooks/useProviders';
import { useCategories } from '@/lib/api/hooks/useTaxonomy';
import { Button } from '@/components/ui/button';

const ProvidersMap = dynamic(
  () => import('@/components/map/ProvidersMap').then((m) => ({ default: m.ProvidersMap })),
  {
    ssr: false,
    loading: () => (
      <div className="absolute inset-0 bg-[#0D213B] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-accent-500 rounded-full animate-spin" />
      </div>
    ),
  }
);

export default function HomePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const { data: providersData } = useProviders({});
  const { data: categories } = useCategories();
  const providers = providersData?.results || [];

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    },
    [router, searchQuery]
  );

  const handleCategoryClick = useCallback(
    (slug: string) => {
      router.push(`/search?category=${slug}`);
    },
    [router]
  );

  return (
    <div className="flex flex-col bg-[#0D213B]">
      {/* Hero: Full-screen map with overlay */}
      <section className="relative h-[100dvh]">
        {/* Map background */}
        <div className="absolute inset-0">
          <ProvidersMap
            providers={providers}
            zoom={12}
            height="100%"
          />
        </div>

        {/* Gradient overlays for readability */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-[#0D213B]/80 via-transparent to-[#0D213B]/90" />
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-[#0D213B]/60 via-transparent to-[#0D213B]/60" />

        {/* Content overlay */}
        <div className="relative z-10 h-full flex flex-col items-center justify-center px-4">
          {/* Badge */}
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

          {/* Title */}
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

          {/* Search bar */}
          <motion.form
            onSubmit={handleSearch}
            className="w-full max-w-xl mb-6"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-[#FF8C42] to-[#FFD166] rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-300" />
              <div className="relative flex items-center bg-[#0D213B]/90 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
                <MapPin className="w-5 h-5 text-[#FF8C42] ml-4 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="¿Qué servicio necesitas?"
                  className="flex-1 bg-transparent text-white placeholder:text-white/40 px-4 py-4 text-base focus:outline-none"
                />
                <button
                  type="submit"
                  className="bg-gradient-to-r from-[#FF8C42] to-[#FFD166] text-[#0D213B] font-semibold px-6 py-4 hover:brightness-110 transition-all flex items-center gap-2"
                >
                  <Search className="w-5 h-5" />
                  <span className="hidden sm:inline">Buscar</span>
                </button>
              </div>
            </div>
          </motion.form>

          {/* Category pills */}
          <motion.div
            className="flex flex-wrap justify-center gap-2 max-w-2xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            {categories?.results?.slice(0, 6).map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategoryClick(cat.slug)}
                className="px-4 py-2 rounded-full text-sm font-medium bg-[#0D213B]/70 backdrop-blur-md text-white/70 border border-white/10 hover:border-[#FF8C42]/50 hover:text-[#FFD166] hover:bg-[#FF8C42]/10 transition-all duration-200"
              >
                {cat.name}
              </button>
            ))}
          </motion.div>
        </div>

        {/* Bottom fade into next section */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#0D213B] to-transparent pointer-events-none z-10" />

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20"
          animate={{ y: [0, 8, 0] }}
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
      </section>

      {/* How it works - compact */}
      <section className="relative py-16 bg-[#0D213B]">
        <div className="container mx-auto px-4">
          <h2 className="text-center font-display text-3xl md:text-4xl font-bold text-white mb-12">
            Así de{' '}
            <span className="bg-gradient-to-r from-[#FF8C42] to-[#FFD166] bg-clip-text text-transparent">
              fácil
            </span>
          </h2>
          <div className="grid gap-8 md:grid-cols-3 max-w-4xl mx-auto">
            {[
              { step: '1', title: 'Busca', desc: 'Elige el servicio que necesitas y tu ubicación' },
              { step: '2', title: 'Conecta', desc: 'Te mostramos los mejores profesionales cerca de ti' },
              { step: '3', title: 'Resuelve', desc: 'Reserva, el proveedor llega y listo' },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
              >
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#FF8C42] to-[#FFD166] flex items-center justify-center mx-auto mb-4">
                  <span className="text-[#0D213B] text-xl font-bold">{item.step}</span>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-gray-400 text-sm">{item.desc}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            className="text-center mt-12"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <Button
              size="lg"
              className="bg-gradient-to-r from-[#FF8C42] to-[#FFD166] text-[#0D213B] font-semibold text-lg px-8 py-6 rounded-full hover:shadow-[0_0_40px_rgba(255,140,66,0.5)] transition-all duration-300 hover:scale-105"
              onClick={() => router.push('/search')}
            >
              Explorar servicios
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
