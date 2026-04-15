'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="text-center space-y-4 max-w-md">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto" />
        <h2 className="text-xl font-bold">Algo salió mal</h2>
        <p className="text-muted-foreground text-sm">
          Ocurrió un error inesperado. Por favor intenta de nuevo.
        </p>
        <div className="flex gap-2 justify-center">
          <Button onClick={reset}>Reintentar</Button>
          <Button variant="outline" onClick={() => window.location.href = '/'}>
            Ir al inicio
          </Button>
        </div>
      </div>
    </div>
  );
}
