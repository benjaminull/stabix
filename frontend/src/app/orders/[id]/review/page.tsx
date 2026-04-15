'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useOrder } from '@/lib/api/hooks/useOrders';
import { apiClient } from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Star, ArrowLeft } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

export default function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const orderId = parseInt(id);
  const router = useRouter();
  const { data: order, isLoading } = useOrder(orderId);

  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error('Selecciona una calificación');
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient.post(
        endpoints.customer.orderReview(orderId),
        { rating, comment },
        { auth: true }
      );
      toast.success('Reseña enviada. ¡Gracias!');
      router.push(`/orders/${orderId}`);
    } catch {
      toast.error('Error al enviar la reseña');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container max-w-lg py-8 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container max-w-lg py-8 text-center">
        <p className="text-muted-foreground">Orden no encontrada</p>
        <Link href="/orders">
          <Button variant="ghost" className="mt-4">Volver</Button>
        </Link>
      </div>
    );
  }

  if (order.status !== 'completed') {
    return (
      <div className="container max-w-lg py-8 text-center">
        <p className="text-muted-foreground">Solo puedes dejar reseñas en órdenes completadas</p>
        <Link href={`/orders/${orderId}`}>
          <Button variant="ghost" className="mt-4">Volver a la orden</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container max-w-lg py-8 space-y-6">
      <Link href={`/orders/${orderId}`}>
        <Button variant="ghost" size="sm">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Volver a la orden
        </Button>
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Dejar reseña</CardTitle>
          <p className="text-sm text-muted-foreground">
            Orden #{order.id} &middot; {order.provider_email}
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Star Rating */}
            <div>
              <p className="text-sm font-medium mb-2">Calificación</p>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="p-0.5 transition-transform hover:scale-110"
                  >
                    <Star
                      className={`h-8 w-8 ${
                        star <= (hoveredRating || rating)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-muted-foreground'
                      }`}
                    />
                  </button>
                ))}
              </div>
              {rating > 0 && (
                <p className="text-sm text-muted-foreground mt-1">
                  {rating === 1 && 'Malo'}
                  {rating === 2 && 'Regular'}
                  {rating === 3 && 'Bueno'}
                  {rating === 4 && 'Muy bueno'}
                  {rating === 5 && 'Excelente'}
                </p>
              )}
            </div>

            {/* Comment */}
            <div>
              <p className="text-sm font-medium mb-2">Comentario (opcional)</p>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Cuéntanos cómo fue tu experiencia..."
                rows={4}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting || rating === 0}>
              {isSubmitting ? 'Enviando...' : 'Enviar reseña'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
