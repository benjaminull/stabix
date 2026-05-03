'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  BarChart3,
  HardHat,
  FolderTree,
  ShoppingCart,
  ShieldAlert,
  Loader2,
  Menu,
  X,
  LogOut,
} from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth.store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const tabs = [
  { name: 'Resumen', href: '/panel', icon: BarChart3 },
  { name: 'Proveedores', href: '/panel/proveedores', icon: HardHat },
  { name: 'Servicios', href: '/panel/servicios', icon: FolderTree },
  { name: 'Ordenes', href: '/panel/ordenes', icon: ShoppingCart },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [isLoading, isAuthenticated, router, pathname]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-900">
        <Loader2 className="h-8 w-8 animate-spin text-accent-400" />
      </div>
    );
  }

  if (!user?.is_staff) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-900 p-4">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center space-y-4">
            <ShieldAlert className="h-16 w-16 text-yellow-500 mx-auto" />
            <h2 className="text-xl font-bold">Acceso Restringido</h2>
            <p className="text-muted-foreground">
              Esta seccion es exclusiva para administradores.
            </p>
            <Link href="/dashboard">
              <Button className="w-full">Volver</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isActive = (href: string) =>
    href === '/panel' ? pathname === '/panel' : pathname.startsWith(href);

  return (
    <div className="min-h-screen bg-brand-900">
      <header className="sticky top-0 z-40 bg-brand-900/80 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-base font-semibold text-white leading-tight">Panel Admin</h1>
                <p className="text-[11px] text-white/30 leading-tight">
                  {user?.first_name} {user?.last_name}
                </p>
              </div>
            </div>

            {/* Desktop tabs */}
            <nav className="hidden md:flex items-center bg-white/[0.04] rounded-xl p-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const active = isActive(tab.href);
                return (
                  <Link
                    key={tab.href}
                    href={tab.href}
                    className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      active
                        ? 'bg-accent-500 text-brand-900 shadow-lg shadow-accent-500/20'
                        : 'text-white/50 hover:text-white/80 hover:bg-white/[0.04]'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.name}
                  </Link>
                );
              })}
            </nav>

            {/* Right actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => { logout(); router.push('/'); }}
                className="hidden md:flex p-2.5 rounded-xl text-white/40 hover:text-white hover:bg-white/[0.06] transition-colors"
              >
                <LogOut className="w-5 h-5" />
              </button>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2.5 rounded-xl text-white/40 hover:text-white hover:bg-white/[0.06] transition-colors"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile tabs */}
          <div className="md:hidden flex items-center gap-1 px-4 pb-3 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = isActive(tab.href);
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
                    active
                      ? 'bg-accent-500 text-brand-900 shadow-lg shadow-accent-500/20'
                      : 'text-white/40 bg-white/[0.03] hover:bg-white/[0.06]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.name}
                </Link>
              );
            })}
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/[0.06] bg-brand-900/95 backdrop-blur-xl">
            <div className="px-4 py-3">
              <button
                onClick={() => { logout(); router.push('/'); }}
                className="flex items-center gap-2 w-full py-3 px-3 rounded-lg text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Cerrar Sesion
              </button>
            </div>
          </div>
        )}
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">{children}</main>
    </div>
  );
}
