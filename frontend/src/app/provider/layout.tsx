'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  ListChecks,
  Users,
  ShoppingBag,
  Calendar,
  Bell,
  ShieldAlert,
  Loader2,
} from 'lucide-react';
import { useUnreadNotificationsCount } from '@/lib/api/hooks/useNotifications';
import { useAuthStore } from '@/lib/store/auth.store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const navigation = [
  { name: 'Dashboard', href: '/provider/dashboard', icon: LayoutDashboard },
  { name: 'Mis Servicios', href: '/provider/listings', icon: ListChecks },
  { name: 'Solicitudes', href: '/provider/matches', icon: Users },
  { name: 'Órdenes', href: '/provider/orders', icon: ShoppingBag },
  { name: 'Disponibilidad', href: '/provider/availability', icon: Calendar },
];

export default function ProviderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const { data: unreadData } = useUnreadNotificationsCount();
  const unreadCount = unreadData?.unread_count || 0;

  // Auth guard
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [isLoading, isAuthenticated, router, pathname]);

  // Loading state
  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-900">
        <Loader2 className="h-8 w-8 animate-spin text-accent-400" />
      </div>
    );
  }

  // Not a provider
  if (!user?.is_provider) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-900 p-4">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center space-y-4">
            <ShieldAlert className="h-16 w-16 text-yellow-500 mx-auto" />
            <h2 className="text-xl font-bold">Acceso Restringido</h2>
            <p className="text-muted-foreground">
              Esta sección es exclusiva para proveedores de servicios.
            </p>
            <Link href="/dashboard">
              <Button className="w-full">Ir a Mi Panel</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-brand-900">
      {/* Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col">
        <div className="flex flex-col flex-grow pt-5 bg-brand-800 overflow-y-auto border-r border-brand-700">
          <div className="flex items-center flex-shrink-0 px-4">
            <h2 className="text-xl font-bold text-white">Panel de Proveedor</h2>
          </div>
          <div className="mt-8 flex-1 flex flex-col">
            <nav className="flex-1 px-2 pb-4 space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      isActive
                        ? 'bg-brand-700 text-white'
                        : 'text-brand-300 hover:bg-brand-700/50 hover:text-white'
                    }`}
                  >
                    <Icon
                      className={`mr-3 flex-shrink-0 h-5 w-5 ${
                        isActive ? 'text-white' : 'text-brand-400 group-hover:text-white'
                      }`}
                      aria-hidden="true"
                    />
                    {item.name}
                    {item.name === 'Solicitudes' && unreadCount > 0 && (
                      <span className="ml-auto inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                        {unreadCount}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1">
        {/* Mobile header */}
        <div className="md:hidden flex items-center justify-between p-4 bg-brand-800 border-b border-brand-700">
          <h2 className="text-lg font-semibold text-white">Panel de Proveedor</h2>
          <button className="text-brand-300 hover:text-white">
            <Bell className="h-6 w-6" />
            {unreadCount > 0 && (
              <span className="absolute top-3 right-3 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                {unreadCount}
              </span>
            )}
          </button>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
