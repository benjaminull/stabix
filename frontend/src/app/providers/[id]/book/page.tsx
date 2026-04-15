'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import toast from 'react-hot-toast';
import { MapPin, Calendar, User, Phone, Mail, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useProvider } from '@/lib/api/hooks/useProviders';
import { useProviderPublicListings } from '@/lib/api/hooks/usePublicListings';
import { useGuestBooking } from '@/lib/api/hooks/useGuestBooking';
import { useServices } from '@/lib/api/hooks/useTaxonomy';
import { useAuthStore } from '@/lib/store/auth.store';
import { formatCurrency } from '@/lib/utils/format';
import { MAPBOX_TOKEN } from '@/lib/config/constants';

const bookingSchema = z.object({
  guest_name: z.string().min(2, 'Nombre es requerido'),
  guest_email: z.string().email('Email inválido'),
  guest_phone: z.string().min(8, 'Teléfono inválido'),
  listing_id: z.number().optional(),
  service: z.number().min(1, 'Selecciona un servicio'),
  address: z.string().min(5, 'Dirección es requerida'),
  details: z.string().min(10, 'Proporciona al menos 10 caracteres'),
  preferred_date: z.string().min(1, 'Selecciona una fecha'),
  preferred_time_slot: z.string().min(1, 'Selecciona un horario'),
});

type BookingFormData = z.infer<typeof bookingSchema>;

export default function BookingPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const providerId = parseInt(params.id as string, 10);

  const { user, isAuthenticated } = useAuthStore();
  const { data: provider } = useProvider(providerId);
  const { data: listingsData } = useProviderPublicListings(providerId);
  const { data: servicesData } = useServices();
  const guestBooking = useGuestBooking();

  const listings = listingsData?.results || [];

  const preselectedListingId = searchParams.get('listing')
    ? parseInt(searchParams.get('listing')!, 10)
    : undefined;
  const preselectedDate = searchParams.get('date') || '';
  const preselectedSlot = searchParams.get('slot') || '';

  const [locationCoords, setLocationCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Find the preselected listing to get its service
  const preselectedListing = listings.find((l) => l.id === preselectedListingId);
  const preselectedService = preselectedListing
    ? servicesData?.results?.find((s) => s.name === preselectedListing.service_name)
    : undefined;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      guest_name: '',
      guest_email: '',
      guest_phone: '',
      listing_id: preselectedListingId,
      service: 0,
      address: '',
      details: '',
      preferred_date: preselectedDate,
      preferred_time_slot: preselectedSlot,
    },
  });

  // Pre-fill if authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      setValue('guest_name', `${user.first_name} ${user.last_name}`.trim() || user.username);
      setValue('guest_email', user.email);
      if (user.phone) setValue('guest_phone', user.phone);
    }
  }, [isAuthenticated, user, setValue]);

  // Set service from preselected listing
  useEffect(() => {
    if (preselectedService) {
      setValue('service', preselectedService.id);
    }
  }, [preselectedService, setValue]);

  // Set preselected listing_id once listings load
  useEffect(() => {
    if (preselectedListingId) {
      setValue('listing_id', preselectedListingId);
    }
  }, [preselectedListingId, setValue]);

  const watchedListingId = watch('listing_id');
  const watchedAddress = watch('address');

  // When listing changes, update service
  useEffect(() => {
    if (watchedListingId) {
      const listing = listings.find((l) => l.id === watchedListingId);
      if (listing) {
        const service = servicesData?.results?.find((s) => s.name === listing.service_name);
        if (service) setValue('service', service.id);
      }
    }
  }, [watchedListingId, listings, servicesData, setValue]);

  // Geocoding with Mapbox
  const geocodeAddress = async (query: string) => {
    if (!MAPBOX_TOKEN || query.length < 3) {
      setAddressSuggestions([]);
      return;
    }
    try {
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&country=cl&language=es&limit=5`
      );
      const data = await res.json();
      setAddressSuggestions(data.features || []);
      setShowSuggestions(true);
    } catch {
      setAddressSuggestions([]);
    }
  };

  const selectAddress = (feature: any) => {
    setValue('address', feature.place_name);
    setLocationCoords({
      lng: feature.center[0],
      lat: feature.center[1],
    });
    setShowSuggestions(false);
  };

  const onSubmit = async (data: BookingFormData) => {
    if (!locationCoords) {
      toast.error('Selecciona una dirección válida del listado');
      return;
    }

    try {
      const result = await guestBooking.mutateAsync({
        guest_name: data.guest_name,
        guest_email: data.guest_email,
        guest_phone: data.guest_phone,
        provider_id: providerId,
        listing_id: data.listing_id,
        service: data.service,
        location_lat: locationCoords.lat,
        location_lng: locationCoords.lng,
        details: data.details,
        preferred_date: data.preferred_date,
        preferred_time_slot: data.preferred_time_slot,
      });

      router.push(
        `/booking/confirmation?ref=${result.booking_ref}&provider=${encodeURIComponent(provider?.user_email || '')}&date=${data.preferred_date}&slot=${encodeURIComponent(data.preferred_time_slot)}`
      );
    } catch (error) {
      toast.error('Error al crear la reserva. Intenta de nuevo.');
    }
  };

  const selectedListing = listings.find((l) => l.id === watchedListingId);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="font-display text-3xl font-bold mb-8">Reservar Servicio</h1>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Service Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Servicio</CardTitle>
              </CardHeader>
              <CardContent>
                {listings.length > 0 ? (
                  <select
                    className="w-full rounded-md border border-input bg-background px-3 py-2"
                    value={watchedListingId || ''}
                    onChange={(e) => {
                      const val = e.target.value ? parseInt(e.target.value, 10) : undefined;
                      setValue('listing_id', val);
                    }}
                  >
                    <option value="">Selecciona un servicio</option>
                    {listings.map((listing) => (
                      <option key={listing.id} value={listing.id}>
                        {listing.title} - {formatCurrency(Number(listing.base_price))}/{listing.price_unit}
                      </option>
                    ))}
                  </select>
                ) : (
                  <select
                    {...register('service', { valueAsNumber: true })}
                    className="w-full rounded-md border border-input bg-background px-3 py-2"
                  >
                    <option value="">Selecciona un servicio</option>
                    {servicesData?.results?.map((service) => (
                      <option key={service.id} value={service.id}>
                        {service.name}
                      </option>
                    ))}
                  </select>
                )}
                {errors.service && (
                  <p className="mt-1 text-sm text-destructive">{errors.service.message}</p>
                )}
              </CardContent>
            </Card>

            {/* Date & Time */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Fecha y Horario
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium">Fecha preferida</label>
                  <Input
                    type="date"
                    {...register('preferred_date')}
                    min={new Date().toISOString().split('T')[0]}
                  />
                  {errors.preferred_date && (
                    <p className="mt-1 text-sm text-destructive">{errors.preferred_date.message}</p>
                  )}
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">Horario preferido</label>
                  <select
                    {...register('preferred_time_slot')}
                    className="w-full rounded-md border border-input bg-background px-3 py-2"
                  >
                    <option value="">Selecciona un horario</option>
                    <option value="Mañana (9:00 - 13:00)">Mañana (9:00 - 13:00)</option>
                    <option value="Tarde (14:00 - 18:00)">Tarde (14:00 - 18:00)</option>
                  </select>
                  {errors.preferred_time_slot && (
                    <p className="mt-1 text-sm text-destructive">{errors.preferred_time_slot.message}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Contact Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Información de Contacto
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium">Nombre completo</label>
                  <Input {...register('guest_name')} placeholder="Tu nombre" />
                  {errors.guest_name && (
                    <p className="mt-1 text-sm text-destructive">{errors.guest_name.message}</p>
                  )}
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium flex items-center gap-1">
                      <Mail className="h-3.5 w-3.5" /> Email
                    </label>
                    <Input {...register('guest_email')} type="email" placeholder="tu@email.com" />
                    {errors.guest_email && (
                      <p className="mt-1 text-sm text-destructive">{errors.guest_email.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5" /> Teléfono
                    </label>
                    <Input {...register('guest_phone')} placeholder="+56 9 XXXX XXXX" />
                    {errors.guest_phone && (
                      <p className="mt-1 text-sm text-destructive">{errors.guest_phone.message}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Address */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Dirección del Servicio
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <Input
                    {...register('address')}
                    placeholder="Ingresa la dirección donde se realizará el servicio"
                    onChange={(e) => {
                      register('address').onChange(e);
                      geocodeAddress(e.target.value);
                    }}
                    onFocus={() => addressSuggestions.length > 0 && setShowSuggestions(true)}
                    autoComplete="off"
                  />
                  {showSuggestions && addressSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-48 overflow-y-auto">
                      {addressSuggestions.map((feature: any) => (
                        <button
                          key={feature.id}
                          type="button"
                          className="w-full text-left px-3 py-2 text-sm hover:bg-accent-50/10 transition-colors"
                          onClick={() => selectAddress(feature)}
                        >
                          {feature.place_name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {errors.address && (
                  <p className="mt-1 text-sm text-destructive">{errors.address.message}</p>
                )}
                {locationCoords && (
                  <div className="mt-3 rounded-md bg-accent-50/10 p-3 text-sm text-muted-foreground">
                    <MapPin className="inline h-4 w-4 mr-1" />
                    Ubicación confirmada ({locationCoords.lat.toFixed(4)}, {locationCoords.lng.toFixed(4)})
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Detalles Adicionales
                </CardTitle>
              </CardHeader>
              <CardContent>
                <textarea
                  {...register('details')}
                  rows={4}
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                  placeholder="Describe lo que necesitas, instrucciones especiales, etc."
                />
                {errors.details && (
                  <p className="mt-1 text-sm text-destructive">{errors.details.message}</p>
                )}
              </CardContent>
            </Card>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-[#FF8C42] to-[#FFD166] text-[#0D213B] font-semibold text-lg py-6 hover:shadow-lg transition-all"
              disabled={guestBooking.isPending}
            >
              {guestBooking.isPending ? 'Procesando...' : 'Confirmar Reserva'}
            </Button>
          </form>
        </div>

        {/* Summary Sidebar */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>Resumen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {provider && (
                <div>
                  <p className="text-sm text-muted-foreground">Proveedor</p>
                  <p className="font-semibold">{provider.user_email}</p>
                </div>
              )}
              {selectedListing && (
                <div>
                  <p className="text-sm text-muted-foreground">Servicio</p>
                  <p className="font-semibold">{selectedListing.title}</p>
                  <p className="text-accent-400 font-bold">
                    {formatCurrency(Number(selectedListing.base_price))}/{selectedListing.price_unit}
                  </p>
                </div>
              )}
              {watch('preferred_date') && (
                <div>
                  <p className="text-sm text-muted-foreground">Fecha</p>
                  <p className="font-semibold">
                    {new Date(watch('preferred_date') + 'T12:00:00').toLocaleDateString('es-ES', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              )}
              {watch('preferred_time_slot') && (
                <div>
                  <p className="text-sm text-muted-foreground">Horario</p>
                  <p className="font-semibold">{watch('preferred_time_slot')}</p>
                </div>
              )}
              {!isAuthenticated && (
                <div className="border-t pt-4 mt-4">
                  <p className="text-xs text-muted-foreground">
                    No necesitas cuenta para reservar. Si deseas hacer seguimiento de tus reservas,
                    puedes crear una cuenta después.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
