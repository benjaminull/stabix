'use client';

import { useState, useCallback, useMemo } from 'react';
import Map, { Marker, NavigationControl, GeolocateControl } from 'react-map-gl';
import { useRouter } from 'next/navigation';
import { MapPin } from 'lucide-react';
import { ProviderProfile, ServiceCategory } from '@/lib/api/client';
import { MAPBOX_TOKEN } from '@/lib/config/constants';

interface ProvidersMapProps {
  providers: ProviderProfile[];
  center?: { lat: number; lng: number };
  zoom?: number;
  height?: string;
  highlightedProviderId?: number | null;
  onProviderHover?: (providerId: number | null) => void;
  className?: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  // Servicios del Hogar - Azules y Rojos
  'servicios-hogar': '#3B82F6', // azul brillante
  gasfiteria: '#DC2626', // rojo intenso
  electricidad: '#F59E0B', // ámbar eléctrico
  limpieza: '#06B6D4', // cyan limpio
  cerrajeria: '#475569', // gris metálico
  jardineria: '#16A34A', // verde natural

  // Construcción - Púrpuras y Marrones
  construccion: '#9333EA', // púrpura construcción
  carpinteria: '#92400E', // madera marrón
  pintura: '#EC4899', // rosa vibrante
  albanileria: '#78350F', // tierra/ladrillo

  // Servicios Profesionales - Rosas y Rojos
  'servicios-profesionales': '#DB2777', // rosa profesional
  consultoria: '#7C3AED', // violeta consultoría
  contabilidad: '#059669', // verde contable

  // Servicios Personales - Turquesa
  'servicios-personales': '#0EA5E9', // azul cielo
  entrenamiento: '#0D9488', // teal fitness

  // Tecnología - Índigos y Morados
  tecnologia: '#4F46E5', // índigo tech
  'reparacion-computadores': '#6366F1', // azul tech
  'instalacion-tv': '#8B5CF6', // violeta electrónica

  default: '#64748B', // gris neutral
};

function getCategoryColor(categories?: ServiceCategory[]): string {
  if (!categories || categories.length === 0) return CATEGORY_COLORS.default;
  const firstCategory = categories[0].slug;
  return CATEGORY_COLORS[firstCategory] || CATEGORY_COLORS.default;
}

export function ProvidersMap({
  providers,
  center = { lat: -33.4489, lng: -70.6693 }, // Santiago, Chile por defecto
  zoom = 12,
  height = '500px',
  highlightedProviderId,
  onProviderHover,
  className,
}: ProvidersMapProps) {
  const router = useRouter();
  const [viewState, setViewState] = useState({
    longitude: center.lng,
    latitude: center.lat,
    zoom,
  });
  const [mapLoaded, setMapLoaded] = useState(false);

  const handleMarkerClick = useCallback(
    (providerId: number) => {
      router.push(`/providers/${providerId}`);
    },
    [router]
  );

  // Calculate map bounds to fit all providers
  const bounds = useMemo(() => {
    if (providers.length === 0) return null;

    const validProviders = providers.filter(
      (p) =>
        p.location?.coordinates &&
        Array.isArray(p.location.coordinates) &&
        p.location.coordinates.length === 2 &&
        typeof p.location.coordinates[0] === 'number' &&
        typeof p.location.coordinates[1] === 'number' &&
        !isNaN(p.location.coordinates[0]) &&
        !isNaN(p.location.coordinates[1])
    );

    if (validProviders.length === 0) return null;

    const lats = validProviders.map((p) => p.location!.coordinates[1]);
    const lngs = validProviders.map((p) => p.location!.coordinates[0]);

    return {
      minLat: Math.min(...lats),
      maxLat: Math.max(...lats),
      minLng: Math.min(...lngs),
      maxLng: Math.max(...lngs),
    };
  }, [providers]);

  // Validate coordinates helper
  const isValidCoordinate = (coords: any): coords is [number, number] => {
    return (
      coords &&
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
  };

  return (
    <div
      style={{ height, width: '100%' }}
      className={className ?? "rounded-lg overflow-hidden border border-[#FF8C42]/20 shadow-lg shadow-[#FF8C42]/10 relative"}
    >
      {!MAPBOX_TOKEN ? (
        <div className="h-full flex items-center justify-center bg-[#0D213B]">
          <p className="text-gray-400 text-sm">
            Configura NEXT_PUBLIC_MAPBOX_TOKEN para ver el mapa
          </p>
        </div>
      ) : (
        <Map
          {...viewState}
          onMove={(evt) => setViewState(evt.viewState)}
          onLoad={() => setMapLoaded(true)}
          mapStyle="mapbox://styles/mapbox/navigation-night-v1"
          mapboxAccessToken={MAPBOX_TOKEN}
          attributionControl={false}
        >
          {/* Navigation controls */}
          <NavigationControl position="top-right" />

          {/* Geolocate control to find user location */}
          <GeolocateControl
            position="top-right"
            trackUserLocation
            showUserHeading
          />

          {/* Provider markers */}
          {mapLoaded &&
            providers.map((provider) => {
              const coords = provider.location?.coordinates;
              if (!isValidCoordinate(coords)) return null;

              const [lng, lat] = coords;
              const color = getCategoryColor(provider.categories);
              const isHighlighted = highlightedProviderId === provider.id;

              return (
                <Marker
                  key={provider.id}
                  longitude={lng}
                  latitude={lat}
                  anchor="bottom"
                  onClick={(e) => {
                    e.originalEvent.stopPropagation();
                    handleMarkerClick(provider.id);
                  }}
                >
                  <div
                    className="cursor-pointer transition-all duration-200 ease-out hover:scale-110 animate-in fade-in"
                    onMouseEnter={() => onProviderHover?.(provider.id)}
                    onMouseLeave={() => onProviderHover?.(null)}
                    style={{
                      transform: isHighlighted ? 'scale(1.3)' : 'scale(1)',
                      transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                      filter: isHighlighted ? 'brightness(1.3)' : 'brightness(1)',
                    }}
                  >
                    {/* Pin icon with category color and enhanced glow effect */}
                    <div className="relative">
                      {/* Glow effect - multiple layers for stronger effect */}
                      <div
                        className="absolute inset-0 rounded-full blur-md opacity-60 animate-pulse"
                        style={{
                          background: `radial-gradient(circle, ${color}, transparent)`,
                          width: isHighlighted ? '50px' : '38px',
                          height: isHighlighted ? '50px' : '38px',
                          transform: 'translate(-25%, 0)',
                        }}
                      />
                      <div
                        className="absolute inset-0 rounded-full blur-sm opacity-80"
                        style={{
                          background: color,
                          width: isHighlighted ? '42px' : '34px',
                          height: isHighlighted ? '42px' : '34px',
                          transform: 'translate(-10%, 4px)',
                        }}
                      />
                      <MapPin
                        size={isHighlighted ? 42 : 34}
                        fill={color}
                        color="#0D213B"
                        strokeWidth={3}
                        className="relative"
                        style={{
                          filter: `drop-shadow(0 4px 8px ${color}40) drop-shadow(0 0 12px ${color}60)`,
                        }}
                      />
                      {/* Rating badge with dark theme */}
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
                </Marker>
              );
            })}
        </Map>
      )}
    </div>
  );
}
