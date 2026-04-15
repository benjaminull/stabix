'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, User, LogOut, UserPlus, LogIn, Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/lib/store/auth.store';
import { useUnreadNotificationsCount } from '@/lib/api/hooks/useNotifications';
import { Logo } from '@/components/brand/Logo';

export function Header() {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isProvider = user?.is_provider;
  const { data: unreadData } = useUnreadNotificationsCount();
  const unreadCount = isAuthenticated ? (unreadData?.unread_count || 0) : 0;

  // Build navigation based on auth state
  const navigation: { name: string; href: string }[] = [];
  navigation.push({ name: 'Buscar Servicios', href: '/search' });

  if (!isAuthenticated) {
    navigation.push({ name: 'Soy Proveedor', href: '/login?next=/provider/dashboard' });
  } else {
    navigation.push({ name: 'Mis Reservas', href: '/dashboard' });
    if (isProvider) {
      navigation.push({ name: 'Panel Proveedor', href: '/provider/dashboard' });
    }
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#FF8C42]/10 bg-[#0D213B]/95 backdrop-blur supports-[backdrop-filter]:bg-[#0D213B]/80 shadow-lg shadow-[#FF8C42]/5">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="group">
            <Logo size={35} />
          </Link>
          <nav className="hidden md:flex gap-6">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm font-medium transition-colors ${
                  pathname === item.href
                    ? 'text-[#FF8C42]'
                    : 'text-gray-300 hover:text-[#FFD166]'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {isAuthenticated && user ? (
            <>
              <Link href="/notifications" className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-200 hover:text-[#FFD166] hover:bg-[#FF8C42]/10"
                >
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white px-1">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </Button>
              </Link>
              <Link href="/profile" className="hidden md:block">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-200 hover:text-[#FFD166] hover:bg-[#FF8C42]/10"
                >
                  <User className="mr-2 h-4 w-4" />
                  {user.first_name || user.username || user.email}
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="hidden md:flex text-gray-200 hover:text-[#FFD166] hover:bg-[#FF8C42]/10"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Link href="/login" className="hidden md:block">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-200 hover:text-[#FFD166] hover:bg-[#FF8C42]/10 border border-transparent hover:border-[#FF8C42]/30 transition-all"
                >
                  <LogIn className="mr-2 h-4 w-4" />
                  Iniciar Sesión
                </Button>
              </Link>
              <Link href="/register" className="hidden md:block">
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-[#FF8C42] to-[#FFD166] text-[#0D213B] font-semibold
                           hover:shadow-[0_0_20px_rgba(255,140,66,0.4)] transition-all duration-300 hover:scale-105"
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Registrarse
                </Button>
              </Link>
            </>
          )}

          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden text-gray-200 hover:text-[#FFD166] hover:bg-[#FF8C42]/10"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#FF8C42]/10 bg-[#0D213B]">
          <nav className="container py-4 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname === item.href
                    ? 'text-[#FF8C42] bg-[#FF8C42]/10'
                    : 'text-gray-300 hover:text-[#FFD166] hover:bg-[#FF8C42]/5'
                }`}
              >
                {item.name}
              </Link>
            ))}

            <div className="border-t border-[#FF8C42]/10 pt-3 mt-3 space-y-1">
              {isAuthenticated && user ? (
                <>
                  <Link
                    href="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-[#FFD166] hover:bg-[#FF8C42]/5"
                  >
                    <User className="h-4 w-4" />
                    Mi Perfil
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-[#FFD166] hover:bg-[#FF8C42]/5"
                  >
                    <LogOut className="h-4 w-4" />
                    Cerrar Sesión
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-[#FFD166] hover:bg-[#FF8C42]/5"
                  >
                    <LogIn className="h-4 w-4" />
                    Iniciar Sesión
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-[#FF8C42] hover:text-[#FFD166] hover:bg-[#FF8C42]/5"
                  >
                    <UserPlus className="h-4 w-4" />
                    Registrarse
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
