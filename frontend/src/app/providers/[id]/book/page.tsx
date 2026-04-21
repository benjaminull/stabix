'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  MapPin,
  Calendar,
  FileText,
  ChevronLeft,
  ChevronRight,
  Check,
  Loader2,
  Star,
  Shield,
  Clock,
  Sparkles,
  Phone,
  User,
  Mail,
  AlertCircle,
} from 'lucide-react';
import { useProvider } from '@/lib/api/hooks/useProviders';
import { useProviderPublicListings } from '@/lib/api/hooks/usePublicListings';
import { useGuestBooking } from '@/lib/api/hooks/useGuestBooking';
import { useServices } from '@/lib/api/hooks/useTaxonomy';
import { useAvailableSlots } from '@/lib/api/hooks/useAvailableSlots';
import { useAuthStore } from '@/lib/store/auth.store';
import { formatCurrency, formatRating } from '@/lib/utils/format';
import { MAPBOX_TOKEN } from '@/lib/config/constants';

type Step = 1 | 2 | 3;

interface SelectedSlot {
  start: string;          // "09:00"
  end: string;            // "10:00"
  start_datetime: string; // ISO
  end_datetime: string;   // ISO
}

interface FormState {
  listing_id?: number;
  service: number;
  preferred_date: string;
  selected_slot: SelectedSlot | null;
  address: string;
  location_lat: number | null;
  location_lng: number | null;
  details: string;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
}

export default function BookingPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const providerId = parseInt(params.id as string, 10);

  const { user, isAuthenticated } = useAuthStore();
  const { data: provider } = useProvider(providerId);
  const { data: listingsData } = useProviderPublicListings(providerId);
  const { data: servicesData } = useServices();
  const booking = useGuestBooking();

  const listings = listingsData?.results || [];

  const preselectedListingId = searchParams.get('listing')
    ? parseInt(searchParams.get('listing')!, 10)
    : undefined;
  const preselectedDate = searchParams.get('date') || '';

  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState<FormState>({
    listing_id: preselectedListingId,
    service: 0,
    preferred_date: preselectedDate,
    selected_slot: null,
    address: '',
    location_lat: null,
    location_lng: null,
    details: '',
    guest_name: '',
    guest_email: '',
    guest_phone: '',
  });

  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Get duration from selected listing or default
  const selectedListing = listings.find((l) => l.id === form.listing_id);
  const durationMinutes = (selectedListing as any)?.estimated_duration_minutes || 60;

  // Fetch available slots when date + service are selected
  const { data: slotsData, isLoading: slotsLoading } = useAvailableSlots(
    providerId,
    form.preferred_date,
    durationMinutes,
  );

  // Pre-fill guest fields from authenticated user
  useEffect(() => {
    if (user) {
      setForm((f) => ({
        ...f,
        guest_name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username || '',
        guest_email: user.email || '',
        guest_phone: user.phone || '',
      }));
    }
  }, [user]);

  // Set service from preselected listing
  useEffect(() => {
    if (preselectedListingId && listings.length > 0 && servicesData?.results) {
      const listing = listings.find((l) => l.id === preselectedListingId);
      if (listing) {
        const svc = servicesData.results.find((s) => s.name === listing.service_name);
        if (svc) setForm((f) => ({ ...f, service: svc.id }));
      }
    }
  }, [preselectedListingId, listings, servicesData]);

  // Clear selected slot when date changes
  useEffect(() => {
    setForm((f) => ({ ...f, selected_slot: null }));
  }, [form.preferred_date]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  // Geocoding
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
    setForm((f) => ({
      ...f,
      address: feature.place_name,
      location_lng: feature.center[0],
      location_lat: feature.center[1],
    }));
    setShowSuggestions(false);
  };

  // Validation
  const canStep1 = (form.service > 0 || !!form.listing_id) && !!form.preferred_date && !!form.selected_slot;
  const canStep2 =
    form.address.length >= 5 &&
    form.location_lat !== null &&
    form.details.trim().length >= 10;

  const goNext = () => setStep((s) => Math.min(s + 1, 3) as Step);
  const goBack = () => {
    if (step === 1) router.back();
    else setStep((s) => (s - 1) as Step);
  };

  const handleSubmit = async () => {
    if (!form.location_lat || !form.location_lng || !form.selected_slot) return;
    if (!form.guest_name.trim()) { toast.error('Ingresa tu nombre'); return; }
    if (!form.guest_email.trim()) { toast.error('Ingresa tu email'); return; }
    if (!form.guest_phone.trim()) { toast.error('Ingresa tu teléfono'); return; }
    try {
      const result = await booking.mutateAsync({
        guest_name: form.guest_name,
        guest_email: form.guest_email,
        guest_phone: form.guest_phone,
        provider_id: providerId,
        listing_id: form.listing_id,
        service: form.service,
        location_lat: form.location_lat,
        location_lng: form.location_lng,
        details: form.details,
        preferred_date: form.preferred_date,
        start_datetime: form.selected_slot.start_datetime,
        end_datetime: form.selected_slot.end_datetime,
        duration_minutes: durationMinutes,
      });
      router.push(
        `/booking/confirmation?ref=${result.booking_ref}&provider=${encodeURIComponent(provider?.user_email || '')}&date=${form.preferred_date}&slot=${encodeURIComponent(`${form.selected_slot.start} - ${form.selected_slot.end}`)}`
      );
    } catch (err: any) {
      toast.error(err?.message || 'Error al crear la reserva');
    }
  };

  // Generate next 14 days
  const dateOptions = useMemo(() => {
    const days: { value: string; label: string; weekday: string }[] = [];
    const today = new Date();
    for (let i = 0; i < 14; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      days.push({
        value: d.toISOString().split('T')[0],
        label: d.getDate().toString(),
        weekday: d.toLocaleDateString('es-CL', { weekday: 'short' }).replace('.', ''),
      });
    }
    return days;
  }, []);

  const slots = slotsData?.slots || [];

  const stepLabels = ['Servicio y fecha', 'Ubicación', 'Confirmar'];

  return (
    <div className="min-h-[calc(100dvh-3rem)] bg-[#0D213B]">
      {/* Header */}
      <div className="sticky top-12 z-30 bg-[#0D213B]/95 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-2xl mx-auto px-4 py-3">
          {provider && (
            <div className="flex items-center gap-3 mb-3">
              <button
                onClick={goBack}
                className="p-2 -ml-2 rounded-xl text-white/40 hover:text-white hover:bg-white/[0.06] transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">
                  Reservar con {provider.user_email}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  {provider.is_verified && (
                    <span className="flex items-center gap-0.5 text-[10px] text-emerald-400">
                      <Shield className="w-3 h-3" /> Verificado
                    </span>
                  )}
                  {provider.total_reviews > 0 && (
                    <span className="flex items-center gap-0.5 text-[10px] text-amber-400">
                      <Star className="w-3 h-3 fill-current" /> {formatRating(provider.average_rating)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Progress */}
          <div className="flex items-center gap-1.5">
            {stepLabels.map((label, i) => {
              const s = i + 1;
              const active = s === step;
              const done = s < step;
              return (
                <div key={label} className="flex-1">
                  <div
                    className={`h-1 rounded-full transition-all duration-500 ${
                      done
                        ? 'bg-gradient-to-r from-[#FF8C42] to-[#FFD166]'
                        : active
                        ? 'bg-[#FF8C42]/60'
                        : 'bg-white/[0.06]'
                    }`}
                  />
                  <p
                    className={`text-[10px] mt-1 font-medium transition-colors ${
                      active ? 'text-[#FFD166]' : done ? 'text-white/40' : 'text-white/20'
                    }`}
                  >
                    {label}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* ===== Step 1: Service + Date + Time Slot ===== */}
        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-6">
            {/* Service selection */}
            <div>
              <p className="text-white/50 text-sm mb-3">
                {listings.length > 0 ? 'Elige el servicio' : 'Selecciona un servicio'}
              </p>

              {listings.length > 0 ? (
                <div className="space-y-2.5">
                  {listings.map((listing) => {
                    const selected = form.listing_id === listing.id;
                    return (
                      <button
                        key={listing.id}
                        onClick={() => {
                          set('listing_id', listing.id);
                          set('selected_slot', null);
                          const svc = servicesData?.results?.find((s) => s.name === listing.service_name);
                          if (svc) set('service', svc.id);
                        }}
                        className={`w-full text-left p-4 rounded-2xl border transition-all duration-200 ${
                          selected
                            ? 'bg-[#FF8C42]/10 border-[#FF8C42]/40'
                            : 'bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.12]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className={`text-sm font-medium ${selected ? 'text-[#FFD166]' : 'text-white'}`}>
                              {listing.title}
                            </p>
                            <p className="text-xs text-white/35 mt-0.5">
                              {listing.service_name}
                              {(listing as any).estimated_duration_minutes && (
                                <span className="ml-2">
                                  <Clock className="w-3 h-3 inline -mt-0.5" /> {(listing as any).estimated_duration_minutes} min
                                </span>
                              )}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`text-sm font-bold ${selected ? 'text-[#FF8C42]' : 'text-emerald-400'}`}>
                              {formatCurrency(Number(listing.base_price))}
                              <span className="text-[10px] font-normal text-white/30">/{listing.price_unit}</span>
                            </span>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                              selected ? 'border-[#FF8C42] bg-[#FF8C42]' : 'border-white/20'
                            }`}>
                              {selected && <Check className="w-3 h-3 text-[#0D213B]" />}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-2.5">
                  {servicesData?.results?.map((svc) => {
                    const selected = form.service === svc.id;
                    return (
                      <button
                        key={svc.id}
                        onClick={() => set('service', svc.id)}
                        className={`w-full text-left p-4 rounded-2xl border transition-all duration-200 ${
                          selected
                            ? 'bg-[#FF8C42]/10 border-[#FF8C42]/40'
                            : 'bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.06]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <p className={`text-sm font-medium ${selected ? 'text-[#FFD166]' : 'text-white'}`}>
                            {svc.name}
                          </p>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                            selected ? 'border-[#FF8C42] bg-[#FF8C42]' : 'border-white/20'
                          }`}>
                            {selected && <Check className="w-3 h-3 text-[#0D213B]" />}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Date */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-white/70 mb-3">
                <Calendar className="w-4 h-4 text-white/30" />
                ¿Cuándo?
              </label>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
                {dateOptions.map((d) => {
                  const selected = form.preferred_date === d.value;
                  const isToday = d.value === new Date().toISOString().split('T')[0];
                  return (
                    <button
                      key={d.value}
                      onClick={() => set('preferred_date', d.value)}
                      className={`flex flex-col items-center min-w-[3.5rem] py-2.5 px-2 rounded-2xl border transition-all duration-200 shrink-0 ${
                        selected
                          ? 'bg-[#FF8C42] border-[#FF8C42] text-[#0D213B]'
                          : 'bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.06] text-white'
                      }`}
                    >
                      <span className={`text-[10px] uppercase font-medium ${
                        selected ? 'text-[#0D213B]/70' : 'text-white/35'
                      }`}>
                        {isToday ? 'Hoy' : d.weekday}
                      </span>
                      <span className={`text-lg font-bold leading-none mt-1 ${
                        selected ? 'text-[#0D213B]' : 'text-white'
                      }`}>
                        {d.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Available time slots */}
            {form.preferred_date && (
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-white/70 mb-3">
                  <Clock className="w-4 h-4 text-white/30" />
                  Horarios disponibles
                  {durationMinutes !== 60 && (
                    <span className="text-[10px] text-white/30 font-normal">({durationMinutes} min)</span>
                  )}
                </label>

                {slotsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-white/30" />
                    <span className="ml-2 text-sm text-white/30">Cargando horarios...</span>
                  </div>
                ) : slots.length === 0 ? (
                  <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                    <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
                    <p className="text-sm text-white/50">
                      No hay horarios disponibles para esta fecha. Prueba otro día.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {slots.map((slot) => {
                      const selected = form.selected_slot?.start_datetime === slot.start_datetime;
                      return (
                        <button
                          key={slot.start_datetime}
                          onClick={() => set('selected_slot', slot)}
                          className={`py-3 px-2 rounded-xl border text-center transition-all duration-200 ${
                            selected
                              ? 'bg-[#FF8C42]/15 border-[#FF8C42]/50 ring-1 ring-[#FF8C42]/30'
                              : 'bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.12]'
                          }`}
                        >
                          <p className={`text-sm font-semibold ${selected ? 'text-[#FFD166]' : 'text-white'}`}>
                            {slot.start}
                          </p>
                          <p className={`text-[10px] mt-0.5 ${selected ? 'text-[#FF8C42]/70' : 'text-white/30'}`}>
                            a {slot.end}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            <StepButton onClick={goNext} disabled={!canStep1} label="Siguiente" />
          </div>
        )}

        {/* ===== Step 2: Address + Details ===== */}
        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-5">
            <p className="text-white/50 text-sm">¿Dónde y qué necesitas?</p>

            {/* Address */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-medium text-white/70">
                <MapPin className="w-4 h-4 text-white/30" />
                Dirección del servicio
              </label>
              <div className="relative">
                <div className="flex items-center bg-white/[0.04] border border-white/[0.08] rounded-2xl overflow-hidden focus-within:border-[#FF8C42]/40 transition-colors">
                  <MapPin className="w-4 h-4 text-white/25 ml-4 shrink-0" />
                  <input
                    type="text"
                    value={form.address}
                    onChange={(e) => {
                      set('address', e.target.value);
                      geocodeAddress(e.target.value);
                    }}
                    onFocus={() => addressSuggestions.length > 0 && setShowSuggestions(true)}
                    placeholder="Ingresa la dirección"
                    autoComplete="off"
                    className="flex-1 bg-transparent text-sm text-white placeholder:text-white/20 px-3 py-3 focus:outline-none"
                  />
                </div>
                {showSuggestions && addressSuggestions.length > 0 && (
                  <div className="absolute z-20 w-full mt-1 bg-[#0D213B] border border-white/10 rounded-xl shadow-xl overflow-hidden">
                    {addressSuggestions.map((feature: any) => (
                      <button
                        key={feature.id}
                        type="button"
                        onClick={() => selectAddress(feature)}
                        className="w-full text-left px-4 py-3 text-sm text-white/70 hover:bg-white/[0.06] hover:text-white transition-colors border-b border-white/[0.04] last:border-0"
                      >
                        <MapPin className="w-3 h-3 inline mr-2 text-[#FF8C42]" />
                        {feature.place_name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {form.location_lat && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-xs text-emerald-400/80">Ubicación confirmada</span>
                </div>
              )}
            </div>

            {/* Details */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-medium text-white/70">
                <FileText className="w-4 h-4 text-white/30" />
                Describe lo que necesitas
              </label>
              <textarea
                value={form.details}
                onChange={(e) => set('details', e.target.value)}
                rows={4}
                placeholder="Ej: Tengo una fuga en el baño, la llave del lavamanos gotea. Necesito que la reparen lo antes posible..."
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-2xl px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#FF8C42]/40 resize-none transition-colors"
              />
              {form.details.length > 0 && form.details.length < 10 && (
                <p className="text-[11px] text-red-400/70">Mínimo 10 caracteres</p>
              )}
            </div>

            <StepButton onClick={goNext} disabled={!canStep2} label="Revisar reserva" />
          </div>
        )}

        {/* ===== Step 3: Confirm ===== */}
        {step === 3 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-4">
            <p className="text-white/50 text-sm">Revisa tu reserva</p>

            {/* Summary */}
            <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] overflow-hidden">
              {/* Service */}
              <div className="px-5 py-4 border-b border-white/[0.06] bg-gradient-to-r from-[#FF8C42]/10 to-transparent">
                <p className="text-[10px] uppercase tracking-wider text-[#FF8C42] font-semibold mb-1">Servicio</p>
                <p className="text-base font-semibold text-white">
                  {selectedListing?.title || servicesData?.results?.find((s) => s.id === form.service)?.name}
                </p>
                {selectedListing && (
                  <p className="text-sm font-bold text-emerald-400 mt-0.5">
                    {formatCurrency(Number(selectedListing.base_price))}/{selectedListing.price_unit}
                  </p>
                )}
              </div>

              {/* Date & time */}
              <div className="px-5 py-3 border-b border-white/[0.06] flex items-center gap-6">
                <SummaryField
                  label="Fecha"
                  value={new Date(form.preferred_date + 'T12:00:00').toLocaleDateString('es-CL', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                  })}
                />
                <SummaryField
                  label="Horario"
                  value={form.selected_slot ? `${form.selected_slot.start} - ${form.selected_slot.end}` : '—'}
                />
                <SummaryField label="Duración" value={`${durationMinutes} min`} />
              </div>

              {/* Address & details */}
              <div className="px-5 py-3 border-b border-white/[0.06]">
                <SummaryField label="Dirección" value={form.address} />
              </div>

              <div className="px-5 py-3 border-b border-white/[0.06]">
                <SummaryField label="Detalles" value={form.details} />
              </div>

              {/* Contact info */}
              <div className="px-5 py-4 border-b border-white/[0.06] space-y-3">
                <p className="text-[10px] uppercase tracking-wider text-white/30 font-semibold">Datos de contacto</p>
                {isAuthenticated ? (
                  <div className="flex items-center gap-6 flex-wrap">
                    <SummaryField label="Nombre" value={form.guest_name} />
                    <SummaryField label="Email" value={form.guest_email} />
                    <SummaryField label="Teléfono" value={form.guest_phone || '—'} />
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2 rounded-xl bg-white/[0.04] border border-white/[0.08] px-3 py-2.5">
                      <User className="w-4 h-4 text-white/30 shrink-0" />
                      <input
                        type="text"
                        value={form.guest_name}
                        onChange={(e) => setForm({ ...form, guest_name: e.target.value })}
                        placeholder="Tu nombre"
                        className="flex-1 bg-transparent text-sm text-white placeholder:text-white/20 outline-none"
                      />
                    </div>
                    <div className="flex items-center gap-2 rounded-xl bg-white/[0.04] border border-white/[0.08] px-3 py-2.5">
                      <Mail className="w-4 h-4 text-white/30 shrink-0" />
                      <input
                        type="email"
                        value={form.guest_email}
                        onChange={(e) => setForm({ ...form, guest_email: e.target.value })}
                        placeholder="tu@email.com"
                        className="flex-1 bg-transparent text-sm text-white placeholder:text-white/20 outline-none"
                      />
                    </div>
                    <div className="flex items-center gap-2 rounded-xl bg-white/[0.04] border border-white/[0.08] px-3 py-2.5">
                      <Phone className="w-4 h-4 text-white/30 shrink-0" />
                      <input
                        type="tel"
                        value={form.guest_phone}
                        onChange={(e) => setForm({ ...form, guest_phone: e.target.value })}
                        placeholder="+56 9 1234 5678"
                        className="flex-1 bg-transparent text-sm text-white placeholder:text-white/20 outline-none"
                      />
                    </div>
                  </div>
                )}
                {isAuthenticated && !user?.phone && (
                  <div className="flex items-center gap-2 rounded-xl bg-white/[0.04] border border-white/[0.08] px-3 py-2.5 mt-2">
                    <Phone className="w-4 h-4 text-white/30 shrink-0" />
                    <input
                      type="tel"
                      value={form.guest_phone}
                      onChange={(e) => setForm({ ...form, guest_phone: e.target.value })}
                      placeholder="+56 9 1234 5678"
                      className="flex-1 bg-transparent text-sm text-white placeholder:text-white/20 outline-none"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-[#FF8C42]/[0.06] border border-[#FF8C42]/10">
              <Sparkles className="w-4 h-4 text-[#FF8C42] mt-0.5 shrink-0" />
              <p className="text-xs text-white/50 leading-relaxed">
                El proveedor recibirá tu solicitud y te contactará para confirmar los detalles del servicio.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setStep(2)}
                className="flex-1 py-3.5 rounded-2xl text-sm font-medium text-white/40 hover:text-white hover:bg-white/[0.04] transition-colors"
              >
                Editar
              </button>
              <button
                onClick={handleSubmit}
                disabled={booking.isPending}
                className="flex-[2] flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-semibold bg-gradient-to-r from-[#FF8C42] to-[#FFD166] text-[#0D213B] hover:brightness-110 hover:shadow-lg hover:shadow-[#FF8C42]/20 transition-all disabled:opacity-50"
              >
                {booking.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Reservando...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Confirmar Reserva
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ===== Small reusable components ===== */

function StepButton({ onClick, disabled, label }: { onClick: () => void; disabled: boolean; label: string }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-semibold transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed bg-gradient-to-r from-[#FF8C42] to-[#FFD166] text-[#0D213B] hover:brightness-110 hover:shadow-lg hover:shadow-[#FF8C42]/20"
    >
      {label}
      <ChevronRight className="w-4 h-4" />
    </button>
  );
}

function SummaryField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-white/30 font-semibold">{label}</p>
      <p className="text-sm text-white/70 mt-0.5">{value}</p>
    </div>
  );
}
