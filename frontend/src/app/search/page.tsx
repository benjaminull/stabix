'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useProviders } from '@/lib/api/hooks/useProviders';
import { useFiltersStore } from '@/lib/store/filters.store';
import { ProviderCard } from '@/components/common/ProviderCard';
import { SearchBar } from '@/components/common/SearchBar';
import { SearchFilters } from '@/components/search/SearchFilters';
import { ProvidersMap } from '@/components/map/ProvidersMap';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapIcon, List } from 'lucide-react';

function SearchPageContent() {
  const searchParams = useSearchParams();
  const {
    query,
    location,
    radiusKm,
    category,
    priceBand,
    minRating,
    setQuery,
    setCategory,
  } = useFiltersStore();

  const [showMap, setShowMap] = useState(true);
  const [highlightedProviderId, setHighlightedProviderId] = useState<number | null>(null);

  useEffect(() => {
    const q = searchParams.get('q');
    const cat = searchParams.get('category');
    if (q) setQuery(q);
    if (cat) setCategory(cat);
  }, [searchParams, setQuery, setCategory]);

  const { data, isLoading } = useProviders({
    q: query || undefined,
    category: category || undefined,
    lat: location?.lat,
    lng: location?.lng,
    radius_km: location ? radiusKm : undefined,
    min_rating: minRating > 0 ? minRating : undefined,
    price_band: priceBand || undefined,
  });

  const providers = data?.results || [];

  return (
    <div className="container py-8">
      {/* Search bar */}
      <div className="mb-6">
        <SearchBar defaultValue={query} onSearch={setQuery} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px,1fr]">
        {/* Left sidebar - Filters */}
        <aside className="lg:sticky lg:top-4 h-fit">
          <SearchFilters />
        </aside>

        {/* Main content */}
        <div className="space-y-6">
          {/* Map/List toggle */}
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              {isLoading ? 'Buscando...' : `${data?.count || 0} proveedores encontrados`}
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowMap(!showMap)}
            >
              {showMap ? (
                <>
                  <List className="h-4 w-4 mr-2" />
                  Solo lista
                </>
              ) : (
                <>
                  <MapIcon className="h-4 w-4 mr-2" />
                  Mostrar mapa
                </>
              )}
            </Button>
          </div>

          {/* Map */}
          {showMap && providers.length > 0 && (
            <div className="space-y-3">
              <div className="relative">
                <ProvidersMap
                  providers={providers}
                  center={location ? { lat: location.lat, lng: location.lng } : undefined}
                  zoom={location ? 12 : 10}
                  height="500px"
                  highlightedProviderId={highlightedProviderId}
                  onProviderHover={setHighlightedProviderId}
                />
                {/* Map overlay gradient for better integration */}
                <div className="absolute inset-0 pointer-events-none rounded-lg ring-1 ring-inset ring-white/5" />
              </div>
              <div className="flex items-center justify-between text-xs">
                <p className="text-gray-400">
                  Proveedores en Santiago, Chile
                </p>
                <p className="text-[#FFD166]">
                  {providers.length} {providers.length === 1 ? 'proveedor' : 'proveedores'} en el mapa
                </p>
              </div>
            </div>
          )}

          {/* Providers grid */}
          <div className="grid gap-4 md:grid-cols-2">
            {isLoading ? (
              <>
                {[...Array(6)].map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <div className="space-y-3">
                        <div className="h-5 bg-muted rounded animate-pulse" />
                        <div className="h-4 bg-muted rounded animate-pulse w-2/3" />
                        <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </>
            ) : providers.length > 0 ? (
              providers.map((provider) => (
                <ProviderCard
                  key={provider.id}
                  provider={provider}
                  isHighlighted={highlightedProviderId === provider.id}
                  onHover={setHighlightedProviderId}
                />
              ))
            ) : (
              <div className="col-span-full">
                <Card>
                  <CardContent className="p-12 text-center">
                    <p className="text-lg text-muted-foreground">
                      No se encontraron proveedores con los filtros seleccionados.
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Intenta ajustar los filtros o ampliar el radio de búsqueda.
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="container py-8">
        <div className="mb-6">
          <div className="h-12 bg-muted rounded animate-pulse" />
        </div>
        <div className="grid gap-6 lg:grid-cols-[320px,1fr]">
          <aside className="lg:sticky lg:top-4 h-fit">
            <div className="h-96 bg-muted rounded animate-pulse" />
          </aside>
          <div className="space-y-6">
            <div className="h-10 bg-muted rounded animate-pulse" />
            <div className="grid gap-4 md:grid-cols-2">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-48 bg-muted rounded animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </div>
    }>
      <SearchPageContent />
    </Suspense>
  );
}
