import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FileQuestion } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="text-center space-y-4 max-w-md">
        <FileQuestion className="h-12 w-12 text-muted-foreground mx-auto" />
        <h2 className="text-xl font-bold">Página no encontrada</h2>
        <p className="text-muted-foreground text-sm">
          La página que buscas no existe o fue movida.
        </p>
        <div className="flex gap-2 justify-center">
          <Link href="/">
            <Button>Ir al inicio</Button>
          </Link>
          <Link href="/search">
            <Button variant="outline">Buscar servicios</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
