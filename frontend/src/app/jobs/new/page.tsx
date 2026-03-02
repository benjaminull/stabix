'use client';

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

const jobSchema = z.object({
  service: z.number().min(1, 'Service is required'),
  location_lat: z.number().min(-90).max(90),
  location_lng: z.number().min(-180).max(180),
  details: z.string().min(10, 'Please provide at least 10 characters'),
  budget_estimate: z.string().optional(),
});

type JobFormData = z.infer<typeof jobSchema>;

export default function NewJobPage() {
  const router = useRouter();
  const { data: services } = useServices();
  const createJob = useCreateJobRequest();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<JobFormData>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      location_lat: 34.0522,
      location_lng: -118.2437,
    },
  });

  const onSubmit = async (data: JobFormData) => {
    try {
      const job = await createJob.mutateAsync(data);
      toast.success('Job request created!');
      router.push(`/jobs/${job.id}`);
    } catch (error) {
      toast.error('Failed to create job request');
    }
  };

  return (
    <div className="container max-w-2xl py-8">
      <Card>
        <CardHeader>
          <CardTitle>Create Job Request</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium">Service</label>
              <select
                {...register('service', { valueAsNumber: true })}
                className="w-full rounded-md border border-input bg-background px-3 py-2"
              >
                <option value="">Select a service</option>
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

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium">Latitude</label>
                <Input
                  type="number"
                  step="any"
                  {...register('location_lat', { valueAsNumber: true })}
                />
                {errors.location_lat && (
                  <p className="mt-1 text-sm text-destructive">
                    {errors.location_lat.message}
                  </p>
                )}
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">Longitude</label>
                <Input
                  type="number"
                  step="any"
                  {...register('location_lng', { valueAsNumber: true })}
                />
                {errors.location_lng && (
                  <p className="mt-1 text-sm text-destructive">
                    {errors.location_lng.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Details</label>
              <textarea
                {...register('details')}
                rows={4}
                className="w-full rounded-md border border-input bg-background px-3 py-2"
                placeholder="Describe what you need..."
              />
              {errors.details && (
                <p className="mt-1 text-sm text-destructive">{errors.details.message}</p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Budget Estimate (optional)
              </label>
              <Input
                type="number"
                step="0.01"
                {...register('budget_estimate')}
                placeholder="100.00"
              />
            </div>

            <Button type="submit" className="w-full" disabled={createJob.isPending}>
              {createJob.isPending ? 'Creating...' : 'Create Job Request'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
