'use client';

import { useRouter } from 'next/navigation';
import { motion, useMotionValue, useTransform, useScroll } from 'framer-motion';
import { ArrowRight, Zap, Shield, MapPin, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { SearchBar } from '@/components/common/SearchBar';
import { useCategories } from '@/lib/api/hooks/useTaxonomy';
import { Badge } from '@/components/ui/badge';
import { ParallaxLayer } from '@/components/parallax/ParallaxLayer';
import { FloatingNodes } from '@/components/parallax/FloatingNodes';
import { AnimatedParticles } from '@/components/parallax/AnimatedParticles';

export default function HomePage() {
  const router = useRouter();
  const { data: categories } = useCategories();

  // Mouse movement effect
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;
      mouseX.set((clientX / innerWidth - 0.5) * 40);
      mouseY.set((clientY / innerHeight - 0.5) * 40);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  const backgroundX = useTransform(mouseX, [-20, 20], [-10, 10]);
  const backgroundY = useTransform(mouseY, [-20, 20], [-10, 10]);
  const nodesX = useTransform(mouseX, [-20, 20], [-20, 20]);
  const nodesY = useTransform(mouseY, [-20, 20], [-20, 20]);

  const handleSearch = (query: string) => {
    router.push(`/search?q=${encodeURIComponent(query)}`);
  };

  const features = [
    {
      icon: Zap,
      title: 'Conexión Rápida',
      description: 'Encuentra proveedores en segundos usando nuestro algoritmo inteligente',
      color: 'from-orange-500 to-amber-500',
    },
    {
      icon: Shield,
      title: 'Proveedores Verificados',
      description: 'Todos los proveedores están verificados y evaluados por nuestra comunidad',
      color: 'from-amber-500 to-orange-400',
    },
    {
      icon: MapPin,
      title: 'Servicios Locales',
      description: 'Encuentra profesionales cerca de ti con búsqueda precisa por ubicación',
      color: 'from-orange-400 to-orange-600',
    },
  ];

  return (
    <div className="flex flex-col bg-[#0D213B] overflow-x-hidden">
      {/* Hero Section with Parallax */}
      <section className="relative h-screen overflow-hidden">
        {/* Background Layer - Slowest */}
        <motion.div
          className="absolute inset-0"
          style={{ x: backgroundX, y: backgroundY }}
        >
          <ParallaxLayer speed={-0.1} className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-br from-[#0D213B] via-[#162840] to-[#1a2f47]" />
            <AnimatedParticles />
          </ParallaxLayer>
        </motion.div>

        {/* Middle Layer - Medium speed */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{ x: nodesX, y: nodesY }}
        >
          <ParallaxLayer speed={-0.3}>
            <FloatingNodes />
          </ParallaxLayer>
        </motion.div>

        {/* Grid overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,140,66,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,140,66,0.03)_1px,transparent_1px)] bg-[size:100px_100px] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_80%)]" />

        {/* Front Layer - Fastest / Content */}
        <ParallaxLayer speed={-0.05} className="relative z-10 h-full flex items-center justify-center">
          <div className="container mx-auto px-4 text-center">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: mounted ? 1 : 0, y: mounted ? 0 : 50 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              {/* Badge */}
              <motion.div
                className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-full bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-500/20"
                whileHover={{ scale: 1.05 }}
                transition={{ type: 'spring', stiffness: 400 }}
              >
                <Sparkles className="w-4 h-4 text-[#FF8C42]" />
                <span className="text-sm font-medium text-[#FFD166]">
                  Plataforma Inteligente de Servicios
                </span>
              </motion.div>

              {/* Main Title */}
              <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6">
                <span className="text-white">Conecta.</span>
                <br />
                <span className="bg-gradient-to-r from-[#FF8C42] via-[#FFD166] to-[#FF8C42] bg-clip-text text-transparent">
                  Resuelve.
                </span>
                <br />
                <span className="text-white">Stabix.</span>
              </h1>

              {/* Subtitle */}
              <motion.p
                className="text-xl md:text-2xl text-gray-300 max-w-2xl mx-auto mb-12"
                initial={{ opacity: 0 }}
                animate={{ opacity: mounted ? 1 : 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
              >
                Marketplace inteligente que conecta profesionales con clientes
                <br />
                <span className="text-[#FFD166]">en Santiago, Chile</span>
              </motion.p>

              {/* Search Bar */}
              <motion.div
                className="max-w-2xl mx-auto mb-8"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: mounted ? 1 : 0, scale: mounted ? 1 : 0.9 }}
                transition={{ duration: 0.8, delay: 0.9 }}
              >
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-[#FF8C42] to-[#FFD166] rounded-lg blur opacity-20 group-hover:opacity-40 transition duration-300" />
                  <div className="relative">
                    <SearchBar onSearch={handleSearch} />
                  </div>
                </div>
              </motion.div>

              {/* CTA Button */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: mounted ? 1 : 0 }}
                transition={{ duration: 0.8, delay: 1.1 }}
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
            </motion.div>
          </div>
        </ParallaxLayer>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <div className="w-6 h-10 border-2 border-[#FF8C42]/50 rounded-full flex justify-center p-1">
            <motion.div
              className="w-1.5 h-3 bg-gradient-to-b from-[#FF8C42] to-[#FFD166] rounded-full"
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>
        </motion.div>
      </section>

      {/* Categories Section */}
      <section className="relative border-t border-white/5 py-20 bg-gradient-to-b from-[#0D213B] to-[#1a2f47]">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="mb-12 text-center font-display text-4xl font-bold text-white">
              Categorías{' '}
              <span className="bg-gradient-to-r from-[#FF8C42] to-[#FFD166] bg-clip-text text-transparent">
                Populares
              </span>
            </h2>
            <div className="flex flex-wrap justify-center gap-3">
              {categories?.results?.slice(0, 6).map((category, index) => (
                <motion.button
                  key={category.id}
                  onClick={() => router.push(`/search?category=${category.slug}`)}
                  className="group relative overflow-hidden"
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-[#FF8C42] to-[#FFD166] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <Badge
                    variant="outline"
                    className="relative cursor-pointer px-6 py-3 text-base border-[#FF8C42]/30 bg-[#0D213B]/50 backdrop-blur-sm text-white group-hover:text-[#0D213B] group-hover:border-transparent transition-colors duration-300"
                  >
                    {category.name}
                  </Badge>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-20 bg-[#0D213B]">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid gap-8 md:grid-cols-3">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                className="group relative"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
              >
                <div className="relative rounded-2xl border border-white/10 bg-gradient-to-br from-[#1a2f47]/50 to-[#0D213B]/50 backdrop-blur-sm p-8 transition-all duration-300 hover:border-[#FF8C42]/50 hover:shadow-[0_0_30px_rgba(255,140,66,0.2)]">
                  <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} mb-6`}>
                    <feature.icon className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="font-display text-2xl font-semibold text-white mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400 leading-relaxed">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative border-t border-white/5 bg-gradient-to-br from-[#1a2f47] to-[#0D213B] py-20">
        <div className="absolute inset-0 opacity-10">
          <AnimatedParticles />
        </div>
        <motion.div
          className="container mx-auto px-4 text-center relative z-10"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="font-display text-4xl md:text-5xl font-bold text-white mb-6">
            ¿Listo para{' '}
            <span className="bg-gradient-to-r from-[#FF8C42] to-[#FFD166] bg-clip-text text-transparent">
              comenzar?
            </span>
          </h2>
          <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
            Únete a miles de usuarios que encuentran profesionales confiables en Santiago
          </p>
          <Button
            size="lg"
            className="bg-gradient-to-r from-[#FF8C42] to-[#FFD166] text-[#0D213B] font-semibold text-lg px-8 py-6 rounded-full hover:shadow-[0_0_40px_rgba(255,140,66,0.5)] transition-all duration-300 hover:scale-105"
            onClick={() => router.push('/search')}
          >
            Explorar Servicios
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </motion.div>
      </section>
    </div>
  );
}
