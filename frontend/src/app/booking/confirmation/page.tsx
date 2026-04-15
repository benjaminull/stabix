'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, Home, UserPlus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/lib/store/auth.store';

export default function BookingConfirmationPage() {
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuthStore();

  const ref = searchParams.get('ref') || '';
  const providerEmail = searchParams.get('provider') || '';
  const date = searchParams.get('date') || '';
  const slot = searchParams.get('slot') || '';

  return (
    <div className="container mx-auto px-4 py-16 max-w-2xl">
      <Card>
        <CardContent className="p-8 text-center space-y-6">
          {/* Success Icon */}
          <div className="flex justify-center">
            <div className="rounded-full bg-green-500/20 p-4">
              <CheckCircle2 className="h-16 w-16 text-green-500" />
            </div>
          </div>

          {/* Title */}
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">
              Reserva Confirmada
            </h1>
            <p className="mt-2 text-muted-foreground">
              Tu solicitud ha sido enviada exitosamente
            </p>
          </div>

          {/* Reference Number */}
          <div className="rounded-lg bg-accent-50/10 border border-accent-500/20 p-4">
            <p className="text-sm text-muted-foreground">Número de referencia</p>
            <p className="text-2xl font-bold text-accent-400 font-mono">{ref}</p>
          </div>

          {/* Booking Details */}
          <div className="text-left space-y-3 rounded-lg border p-4">
            {providerEmail && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Proveedor</span>
                <span className="font-medium">{providerEmail}</span>
              </div>
            )}
            {date && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Fecha</span>
                <span className="font-medium">
                  {new Date(date + 'T12:00:00').toLocaleDateString('es-ES', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>
            )}
            {slot && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Horario</span>
                <span className="font-medium">{slot}</span>
              </div>
            )}
          </div>

          {/* What's Next */}
          <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-4 text-left">
            <h3 className="font-semibold text-foreground mb-2">¿Qué sigue?</h3>
            <p className="text-sm text-muted-foreground">
              El proveedor recibirá tu solicitud y te contactará pronto para confirmar
              los detalles del servicio.
            </p>
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Link href="/" className="flex-1">
              <Button variant="outline" className="w-full">
                <Home className="mr-2 h-4 w-4" />
                Volver al Inicio
              </Button>
            </Link>
            {!isAuthenticated && (
              <Link href="/register" className="flex-1">
                <Button className="w-full bg-gradient-to-r from-[#FF8C42] to-[#FFD166] text-[#0D213B] font-semibold">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Crear Cuenta
                </Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
