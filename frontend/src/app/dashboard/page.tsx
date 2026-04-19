'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth.store';
import { useProviders } from '@/lib/api/hooks/useProviders';
import { useCategories } from '@/lib/api/hooks/useTaxonomy';
import { useJobRequests } from '@/lib/api/hooks/useJobRequests';
import { useOrders } from '@/lib/api/hooks/useOrders';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { JOB_STATUS, ORDER_STATUS } from '@/lib/config/constants';
import { formatRelativeTime } from '@/lib/utils/format';
import {
  Search,
  MapPin,
  ClipboardList,
  ShoppingBag,
  Plus,
  ChevronRight,
  Loader2,
  X,
} from 'lucide-react';

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

type Panel = 'none' | 'requests' | 'orders';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [activePanel, setActivePanel] = useState<Panel>('none');
  const [highlightedProviderId, setHighlightedProviderId] = useState<number | null>(null);

  // Redirect providers to their dashboard
  useEffect(() => {
    if (!authLoading && user?.is_provider) {
      router.replace('/provider/dashboard');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login?next=/dashboard');
    }
  }, [authLoading, isAuthenticated, router]);

  const { data: providersData } = useProviders({});
  const { data: categories } = useCategories();
  const { data: jobRequests } = useJobRequests();
  const { data: orders } = useOrders();

  const providers = providersData?.results || [];
  const jobs = jobRequests?.results || [];
  const ordersList = orders?.results || [];

  if (authLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0D213B]">
        <Loader2 className="h-8 w-8 animate-spin text-[#FF8C42]" />
      </div>
    );
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
  };

  const togglePanel = (panel: Panel) => {
    setActivePanel((prev) => (prev === panel ? 'none' : panel));
  };

  return (
    <div className="relative h-[calc(100dvh-3rem)] bg-[#0D213B]">
      {/* Full-screen map */}
      <div className="absolute inset-0">
        <ProvidersMap
          providers={providers}
          zoom={12}
          height="100%"
          highlightedProviderId={highlightedProviderId}
          onProviderHover={setHighlightedProviderId}
        />
      </div>

      {/* Top bar overlay: Search + categories */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4">
        <div className="max-w-2xl mx-auto">
          {/* Search */}
          <form onSubmit={handleSearch}>
            <div className="flex items-center bg-[#0D213B]/90 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden shadow-xl shadow-black/30">
              <MapPin className="w-5 h-5 text-[#FF8C42] ml-4 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="¿Qué servicio necesitas?"
                className="flex-1 bg-transparent text-white placeholder:text-white/40 px-4 py-3.5 text-sm focus:outline-none"
              />
              <button
                type="submit"
                className="bg-gradient-to-r from-[#FF8C42] to-[#FFD166] text-[#0D213B] font-semibold px-5 py-3.5 hover:brightness-110 transition-all"
              >
                <Search className="w-5 h-5" />
              </button>
            </div>
          </form>

          {/* Category pills */}
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-hide">
            {categories?.results?.slice(0, 6).map((cat) => (
              <button
                key={cat.id}
                onClick={() => router.push(`/search?category=${cat.slug}`)}
                className="px-3.5 py-1.5 rounded-full text-xs font-medium bg-[#0D213B]/80 backdrop-blur-md text-white/70 border border-white/10 hover:border-[#FF8C42]/50 hover:text-[#FFD166] transition-all whitespace-nowrap shrink-0"
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom action bar */}
      <div className="absolute bottom-0 left-0 right-0 z-20">
        {/* Slide-up panel */}
        {activePanel !== 'none' && (
          <div className="bg-[#0D213B]/95 backdrop-blur-xl border-t border-white/10 rounded-t-3xl max-h-[60vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 pt-4 pb-2">
              <h3 className="text-base font-semibold text-white">
                {activePanel === 'requests' ? 'Mis Solicitudes' : 'Mis Órdenes'}
              </h3>
              <button
                onClick={() => setActivePanel('none')}
                className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-5 pb-5 space-y-2">
              {activePanel === 'requests' && (
                <>
                  {jobs.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-sm text-white/30 mb-3">No tienes solicitudes aún</p>
                      <Link href="/jobs/new">
                        <Button size="sm" className="bg-gradient-to-r from-[#FF8C42] to-[#FFD166] text-[#0D213B] font-semibold">
                          <Plus className="w-4 h-4 mr-1" />
                          Nueva solicitud
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    jobs.map((job) => (
                      <Link key={job.id} href={`/jobs/${job.id}`}>
                        <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] transition-colors">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-white truncate">
                              {job.service_details.name}
                            </p>
                            <p className="text-xs text-white/35 mt-0.5">
                              {formatRelativeTime(job.created_at)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 ml-3">
                            <Badge variant={JOB_STATUS[job.status].color as any} className="text-[10px]">
                              {JOB_STATUS[job.status].label}
                            </Badge>
                            <ChevronRight className="w-4 h-4 text-white/20" />
                          </div>
                        </div>
                      </Link>
                    ))
                  )}
                </>
              )}

              {activePanel === 'orders' && (
                <>
                  {ordersList.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-sm text-white/30">No tienes órdenes aún</p>
                    </div>
                  ) : (
                    ordersList.map((order) => (
                      <Link key={order.id} href={`/orders/${order.id}`}>
                        <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] transition-colors">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-white">
                              Orden #{order.id}
                            </p>
                            <p className="text-xs text-white/35 mt-0.5">${order.amount}</p>
                          </div>
                          <div className="flex items-center gap-2 ml-3">
                            <Badge variant={ORDER_STATUS[order.status].color as any} className="text-[10px]">
                              {ORDER_STATUS[order.status].label}
                            </Badge>
                            <ChevronRight className="w-4 h-4 text-white/20" />
                          </div>
                        </div>
                      </Link>
                    ))
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Action buttons bar */}
        <div className="bg-[#0D213B]/90 backdrop-blur-xl border-t border-white/[0.08] px-4 py-3 flex items-center justify-center gap-3">
          <button
            onClick={() => togglePanel('requests')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activePanel === 'requests'
                ? 'bg-[#FF8C42] text-[#0D213B]'
                : 'bg-white/[0.06] text-white/60 hover:bg-white/[0.1] hover:text-white'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            Solicitudes
            {jobs.length > 0 && (
              <span className={`w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold ${
                activePanel === 'requests' ? 'bg-[#0D213B]/20 text-[#0D213B]' : 'bg-[#FF8C42]/20 text-[#FF8C42]'
              }`}>
                {jobs.length}
              </span>
            )}
          </button>

          <button
            onClick={() => togglePanel('orders')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activePanel === 'orders'
                ? 'bg-[#FF8C42] text-[#0D213B]'
                : 'bg-white/[0.06] text-white/60 hover:bg-white/[0.1] hover:text-white'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            Órdenes
            {ordersList.length > 0 && (
              <span className={`w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold ${
                activePanel === 'orders' ? 'bg-[#0D213B]/20 text-[#0D213B]' : 'bg-[#FF8C42]/20 text-[#FF8C42]'
              }`}>
                {ordersList.length}
              </span>
            )}
          </button>

          <Link href="/search">
            <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-[#FF8C42] to-[#FFD166] text-[#0D213B] hover:brightness-110 transition-all">
              <Plus className="w-4 h-4" />
              Buscar
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
