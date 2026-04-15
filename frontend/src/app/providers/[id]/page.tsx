'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Star, MapPin, CheckCircle2, Clock, Shield, CalendarCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useProvider } from '@/lib/api/hooks/useProviders';
import { useProviderReviews } from '@/lib/api/hooks/useReviews';
import { useProviderPublicListings } from '@/lib/api/hooks/usePublicListings';
import { formatRating, formatDistance, formatCurrency } from '@/lib/utils/format';
import { PRICE_BANDS } from '@/lib/config/constants';
import { ProviderSchedule } from '@/components/providers/ProviderSchedule';

export default function ProviderProfilePage() {
  const params = useParams();
  const providerId = parseInt(params.id as string, 10);

  const { data: provider, isLoading: isLoadingProvider, error: providerError } = useProvider(providerId);
  const { data: reviews, isLoading: isLoadingReviews } = useProviderReviews(providerId);
  const { data: listingsData } = useProviderPublicListings(providerId);
  const listings = listingsData?.results || [];

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [selectedListing, setSelectedListing] = useState<number | null>(null);

  if (isLoadingProvider) {
    return <ProviderProfileSkeleton />;
  }

  if (providerError || !provider) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-lg text-muted-foreground">
              No se pudo cargar el perfil del proveedor
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const priceBand = PRICE_BANDS[provider.price_band] || PRICE_BANDS.standard;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column - Main info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header Card */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h1 className="font-display text-3xl font-bold text-foreground">
                      {provider.user_email}
                    </h1>
                    {provider.is_verified && (
                      <Badge variant="default" className="flex items-center gap-1">
                        <Shield className="h-3 w-3" />
                        Verificado
                      </Badge>
                    )}
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
                    {provider.total_reviews > 0 && (
                      <div className="flex items-center gap-1">
                        <Star className="h-5 w-5 fill-accent-400 text-accent-400" />
                        <span className="font-semibold text-lg text-foreground">
                          {formatRating(provider.average_rating)}
                        </span>
                        <span className="text-muted-foreground">
                          ({provider.total_reviews} reseñas)
                        </span>
                      </div>
                    )}

                    {provider.distance_km !== undefined && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>{formatDistance(provider.distance_km)}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-1 text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>{provider.total_completed_orders} trabajos completados</span>
                    </div>

                    {provider.average_response_time_minutes && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>
                          Responde en ~{Math.round(provider.average_response_time_minutes)} min
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <Badge variant="outline" className="text-lg px-3 py-1">
                  {priceBand.symbol}
                </Badge>
              </div>

              {/* Bio */}
              {provider.bio && (
                <div className="mt-6">
                  <h3 className="font-semibold text-foreground mb-2">Acerca de</h3>
                  <p className="text-muted-foreground whitespace-pre-line">
                    {provider.bio}
                  </p>
                </div>
              )}

              {/* Service Categories */}
              {provider.categories && provider.categories.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-semibold text-foreground mb-3">Servicios</h3>
                  <div className="flex flex-wrap gap-2">
                    {provider.categories.map((category) => (
                      <Badge key={category.id} variant="secondary">
                        {category.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Service Radius */}
              <div className="mt-6">
                <h3 className="font-semibold text-foreground mb-2">Área de servicio</h3>
                <p className="text-muted-foreground">
                  Radio de {provider.radius_km} km
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Available Services */}
          {listings.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Servicios Disponibles</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  {listings.map((listing) => (
                    <div
                      key={listing.id}
                      className={`rounded-lg border p-4 transition-colors cursor-pointer ${
                        selectedListing === listing.id
                          ? 'border-accent-500 bg-accent-50/10'
                          : 'hover:border-accent-300'
                      }`}
                      onClick={() => setSelectedListing(listing.id)}
                    >
                      <h4 className="font-semibold text-foreground">{listing.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{listing.service_name}</p>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-lg font-bold text-accent-400">
                          {formatCurrency(Number(listing.base_price))}
                          <span className="text-sm font-normal text-muted-foreground">
                            /{listing.price_unit}
                          </span>
                        </span>
                        <Link
                          href={`/providers/${providerId}/book?listing=${listing.id}&date=${selectedDate.toISOString().split('T')[0]}${selectedSlot ? `&slot=${encodeURIComponent(selectedSlot)}` : ''}`}
                        >
                          <Button size="sm">Reservar</Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Reviews Section */}
          <Card>
            <CardHeader>
              <CardTitle>Reseñas ({provider.total_reviews})</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingReviews ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-16 w-full" />
                    </div>
                  ))}
                </div>
              ) : reviews && reviews.length > 0 ? (
                <div className="space-y-6">
                  {reviews.map((review) => (
                    <div key={review.id} className="border-b last:border-0 pb-4 last:pb-0">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-semibold text-foreground">
                            {review.reviewer_name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(review.created_at).toLocaleDateString('es-ES', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-accent-400 text-accent-400" />
                          <span className="font-semibold">{review.rating.toFixed(1)}</span>
                        </div>
                      </div>
                      {review.comment && (
                        <p className="text-muted-foreground">{review.comment}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  No hay reseñas aún
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column - Schedule + CTA */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>Agenda</CardTitle>
            </CardHeader>
            <CardContent>
              <ProviderSchedule
                providerId={providerId}
                availability={provider.availability}
                onDateSelect={setSelectedDate}
                onSlotSelect={setSelectedSlot}
                selectedSlot={selectedSlot}
              />

              {/* Booking CTA */}
              <div className="mt-6 pt-4 border-t">
                <Link
                  href={`/providers/${providerId}/book?${selectedListing ? `listing=${selectedListing}&` : ''}date=${selectedDate.toISOString().split('T')[0]}${selectedSlot ? `&slot=${encodeURIComponent(selectedSlot)}` : ''}`}
                >
                  <Button className="w-full bg-gradient-to-r from-[#FF8C42] to-[#FFD166] text-[#0D213B] font-semibold hover:shadow-lg transition-all">
                    <CalendarCheck className="mr-2 h-4 w-4" />
                    Reservar Servicio
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ProviderProfileSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-10 w-64 mb-4" />
              <Skeleton className="h-6 w-96 mb-6" />
              <Skeleton className="h-24 w-full mb-4" />
              <Skeleton className="h-8 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-96 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
