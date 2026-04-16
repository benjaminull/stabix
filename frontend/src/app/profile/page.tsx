'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth.store';
import { apiClient, User } from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { User as UserIcon, Mail, Phone, Shield, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, setUser } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    phone: user?.phone || '',
  });

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.replace('/login?next=/profile');
    }
  }, [isAuthenticated, user, router]);

  if (!isAuthenticated || !user) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updated = await apiClient.patch<User>(endpoints.customer.me, form, { auth: true });
      setUser(updated);
      setIsEditing(false);
      toast.success('Perfil actualizado');
    } catch {
      toast.error('Error al actualizar perfil');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="container max-w-2xl py-8 space-y-6">
      <h1 className="text-2xl font-bold">Mi Perfil</h1>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-500/10">
                <UserIcon className="h-6 w-6 text-accent-500" />
              </div>
              <div>
                <CardTitle>{user.first_name || user.username || 'Usuario'} {user.last_name || ''}</CardTitle>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {user.is_provider && (
                <Badge className="bg-accent-500">Proveedor</Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isEditing ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="first_name">Nombre</Label>
                  <Input
                    id="first_name"
                    value={form.first_name}
                    onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="last_name">Apellido</Label>
                  <Input
                    id="last_name"
                    value={form.last_name}
                    onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+56 9 1234 5678"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? 'Guardando...' : 'Guardar'}
                </Button>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancelar
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{user.email}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <UserIcon className="h-4 w-4 text-muted-foreground" />
                  <span>{user.first_name || '—'} {user.last_name || ''}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{user.phone || 'No configurado'}</span>
                  {user.phone_verified && (
                    <Badge variant="outline" className="text-green-500 border-green-500/30">
                      <Shield className="h-3 w-3 mr-1" />
                      Verificado
                    </Badge>
                  )}
                </div>
              </div>
              <div className="pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setForm({
                      first_name: user.first_name || '',
                      last_name: user.last_name || '',
                      phone: user.phone || '',
                    });
                    setIsEditing(true);
                  }}
                >
                  Editar perfil
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Información de cuenta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>Usuario: {user.username}</p>
          <p>Miembro desde: {new Date(user.created_at).toLocaleDateString('es-CL')}</p>
          <p>Tipo: {user.is_provider ? 'Proveedor de servicios' : 'Cliente'}</p>
        </CardContent>
      </Card>
    </div>
  );
}
