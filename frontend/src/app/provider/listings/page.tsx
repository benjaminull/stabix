'use client';

import { useState } from 'react';
import {
  useProviderListings,
  useCreateListing,
  useUpdateListing,
  useDeleteListing,
} from '@/lib/api/hooks/useProviderListings';
import { useServices } from '@/lib/api/hooks/useTaxonomy';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Edit, Trash2, DollarSign } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function ProviderListingsPage() {
  const { data, isLoading } = useProviderListings();
  const { data: services } = useServices();
  const createListing = useCreateListing();
  const updateListing = useUpdateListing();
  const deleteListing = useDeleteListing();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingListing, setEditingListing] = useState<any>(null);
  const [formData, setFormData] = useState({
    service: '',
    title: '',
    description: '',
    base_price: '',
    price_unit: 'hourly',
    is_active: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingListing) {
        await updateListing.mutateAsync({
          id: editingListing.id,
          data: {
            service: parseInt(formData.service),
            title: formData.title,
            description: formData.description,
            base_price: formData.base_price,
            price_unit: formData.price_unit,
            is_active: formData.is_active,
          },
        });
        toast.success('Servicio actualizado');
      } else {
        await createListing.mutateAsync({
          service: parseInt(formData.service),
          title: formData.title,
          description: formData.description,
          base_price: formData.base_price,
          price_unit: formData.price_unit,
          is_active: formData.is_active,
        });
        toast.success('Servicio creado exitosamente');
      }

      setIsDialogOpen(false);
      setFormData({
        service: '',
        title: '',
        description: '',
        base_price: '',
        price_unit: 'hourly',
        is_active: true,
      });
      setEditingListing(null);
    } catch (error) {
      toast.error('Error al guardar el servicio');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este servicio?')) {
      return;
    }

    try {
      await deleteListing.mutateAsync(id);
      toast.success('Servicio eliminado');
    } catch (error) {
      toast.error('Error al eliminar el servicio');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-white">Mis Servicios</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-48 bg-brand-800" />
          ))}
        </div>
      </div>
    );
  }

  const listings = data?.results || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Mis Servicios</h1>
          <p className="text-brand-300 mt-1">
            Gestiona los servicios que ofreces
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-accent-500 hover:bg-accent-600">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Servicio
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-brand-800 text-white border-brand-700">
            <DialogHeader>
              <DialogTitle>
                {editingListing ? 'Editar Servicio' : 'Nuevo Servicio'}
              </DialogTitle>
              <DialogDescription className="text-brand-300">
                Completa los detalles del servicio que ofreces
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="service">Tipo de Servicio</Label>
                <Select
                  value={formData.service}
                  onValueChange={(value) =>
                    setFormData({ ...formData, service: value })
                  }
                >
                  <SelectTrigger className="bg-brand-700 border-brand-600">
                    <SelectValue placeholder="Selecciona un servicio" />
                  </SelectTrigger>
                  <SelectContent className="bg-brand-700 border-brand-600">
                    {services?.results.map((service) => (
                      <SelectItem key={service.id} value={service.id.toString()}>
                        {service.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="bg-brand-700 border-brand-600"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="bg-brand-700 border-brand-600"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="base_price">Precio</Label>
                  <Input
                    id="base_price"
                    type="number"
                    step="0.01"
                    value={formData.base_price}
                    onChange={(e) =>
                      setFormData({ ...formData, base_price: e.target.value })
                    }
                    className="bg-brand-700 border-brand-600"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="price_unit">Unidad</Label>
                  <Select
                    value={formData.price_unit}
                    onValueChange={(value) =>
                      setFormData({ ...formData, price_unit: value })
                    }
                  >
                    <SelectTrigger className="bg-brand-700 border-brand-600">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-brand-700 border-brand-600">
                      <SelectItem value="hourly">Por hora</SelectItem>
                      <SelectItem value="fixed">Precio fijo</SelectItem>
                      <SelectItem value="daily">Por día</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  className="border-brand-600"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="bg-accent-500 hover:bg-accent-600"
                  disabled={createListing.isPending || updateListing.isPending}
                >
                  {(createListing.isPending || updateListing.isPending) ? 'Guardando...' : 'Guardar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {listings.length === 0 ? (
        <Card className="bg-brand-800 border-brand-700">
          <CardContent className="py-12 text-center">
            <p className="text-brand-300">
              No tienes servicios publicados aún
            </p>
            <Button
              className="mt-4 bg-accent-500 hover:bg-accent-600"
              onClick={() => setIsDialogOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Crear tu primer servicio
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {listings.map((listing: any) => (
            <Card key={listing.id} className="bg-brand-800 border-brand-700">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-white">{listing.title}</CardTitle>
                    <p className="text-sm text-brand-400 mt-1">
                      {listing.service_name}
                    </p>
                  </div>
                  <Badge
                    variant={listing.is_active ? 'default' : 'secondary'}
                    className={listing.is_active ? 'bg-green-600' : ''}
                  >
                    {listing.is_active ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {listing.description && (
                  <p className="text-sm text-brand-300 mb-4">
                    {listing.description}
                  </p>
                )}

                <div className="flex items-center text-white font-bold text-lg mb-4">
                  <DollarSign className="h-5 w-5 mr-1" />
                  {listing.base_price} / {listing.price_unit}
                </div>

                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 border-brand-600"
                    onClick={() => {
                      setEditingListing(listing);
                      setFormData({
                        service: listing.service.toString(),
                        title: listing.title,
                        description: listing.description || '',
                        base_price: listing.base_price,
                        price_unit: listing.price_unit,
                        is_active: listing.is_active,
                      });
                      setIsDialogOpen(true);
                    }}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(listing.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
