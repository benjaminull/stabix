'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import toast from 'react-hot-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCreateJobRequest } from '@/lib/api/hooks/useJobRequests';
import { useServices } from '@/lib/api/hooks/useTaxonomy';
import { MapPin } from 'lucide-react';

const SANTIAGO_LAT = -33.4489;
const SANTIAGO_LNG = -70.6693;

const jobSchema = z.object({
  service: z.number().min(1, 'El servicio es requerido'),
  location_lat: z.number().min(-90).max(90),
  location_lng: z.number().min(-180).max(180),
  details: z.string().min(10, 'Proporciona al menos 10 caracteres'),
  budget_estimate: z.string().optional(),
});

type JobFormData = z.infer<typeof jobSchema>;

export default function NewJobPage() {
  const router = useRouter();
  const { data: services } = useServices();
  const createJob = useCreateJobRequest();
  const [locationStatus, setLocationStatus] = useState<'loading' | 'success' | 'fallback'>('loading');

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<JobFormData>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      location_lat: SANTIAGO_LAT,
      location_lng: SANTIAGO_LNG,
    },
  });

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationStatus('fallback');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setValue('location_lat', position.coords.latitude);
        setValue('location_lng', position.coords.longitude);
        setLocationStatus('success');
      },
      () => {
        setLocationStatus('fallback');
      },
      { timeout: 5000 }
    );
  }, [setValue]);

  const onSubmit = async (data: JobFormData) => {
    try {
      const job = await createJob.mutateAsync(data);
      toast.success('Solicitud creada exitosamente');
      router.push(`/jobs/${job.id}`);
    } catch (error) {
      toast.error('Error al crear la solicitud');
    }
  };

  return (
    <div className="container max-w-2xl py-8">
      <Card>
        <CardHeader>
          <CardTitle>Crear Solicitud de Servicio</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium">Servicio</label>
              <select
                {...register('service', { valueAsNumber: true })}
                className="w-full rounded-md border border-input bg-background px-3 py-2"
              >
                <option value="">Selecciona un servicio</option>
                {services?.results?.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name}
                  </option>
                ))}
              </select>
              {errors.service && (
                <p className="mt-1 text-sm text-destructive">{errors.service.message}</p>
              )}
            </div>

            <div className="flex items-center gap-2 rounded-lg border border-input bg-background px-3 py-2.5 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              {locationStatus === 'loading' && (
                <span className="text-muted-foreground">Obteniendo ubicación...</span>
              )}
              {locationStatus === 'success' && (
                <span className="text-green-600">Usando tu ubicación actual</span>
              )}
              {locationStatus === 'fallback' && (
                <span className="text-muted-foreground">Usando ubicación por defecto (Santiago)</span>
              )}
              <input type="hidden" {...register('location_lat', { valueAsNumber: true })} />
              <input type="hidden" {...register('location_lng', { valueAsNumber: true })} />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Detalles</label>
              <textarea
                {...register('details')}
                rows={4}
                className="w-full rounded-md border border-input bg-background px-3 py-2"
                placeholder="Describe lo que necesitas..."
              />
              {errors.details && (
                <p className="mt-1 text-sm text-destructive">{errors.details.message}</p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Presupuesto estimado (opcional)
              </label>
              <Input
                type="number"
                step="0.01"
                {...register('budget_estimate')}
                placeholder="100.00"
              />
            </div>

            <Button type="submit" className="w-full" disabled={createJob.isPending}>
              {createJob.isPending ? 'Creando...' : 'Crear Solicitud'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
