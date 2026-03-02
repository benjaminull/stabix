'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, User, LogOut, UserPlus, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/lib/store/auth.store';
import { Logo } from '@/components/brand/Logo';

export function Header() {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuthStore();

  const navigation = [
    { name: 'Buscar', href: '/search' },
    { name: 'Dashboard', href: '/dashboard' },
  ];

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
              <Link href="/profile">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-200 hover:text-[#FFD166] hover:bg-[#FF8C42]/10"
                >
                  <User className="mr-2 h-4 w-4" />
                  {user.username || user.email}
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="text-gray-200 hover:text-[#FFD166] hover:bg-[#FF8C42]/10"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-200 hover:text-[#FFD166] hover:bg-[#FF8C42]/10 border border-transparent hover:border-[#FF8C42]/30 transition-all"
                >
                  <LogIn className="mr-2 h-4 w-4" />
                  Iniciar Sesión
                </Button>
              </Link>
              <Link href="/register">
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
        </div>
      </div>
    </header>
  );
}
