'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { User, LogOut, LogIn, Bell, LayoutDashboard, UserCircle } from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth.store';
import { useUnreadNotificationsCount } from '@/lib/api/hooks/useNotifications';
import { Logo } from '@/components/brand/Logo';

export function Header() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const isProvider = user?.is_provider;
  const { data: unreadData } = useUnreadNotificationsCount();
  const unreadCount = isAuthenticated ? (unreadData?.unread_count || 0) : 0;

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on click outside
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-40 w-full">
      <div className="flex h-12 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="group">
          <Logo size={28} />
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-1">
          {isAuthenticated && user ? (
            <>
              {/* Notifications */}
              <Link
                href="/notifications"
                className="relative p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/5 transition-all"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white px-0.5">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </Link>

              {/* Profile dropdown */}
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center gap-2 p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/5 transition-all"
                >
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#FF8C42] to-[#FFD166] flex items-center justify-center">
                    <span className="text-[10px] font-bold text-[#0D213B]">
                      {(user.first_name?.[0] || user.email[0]).toUpperCase()}
                    </span>
                  </div>
                </button>

                {/* Dropdown */}
                {menuOpen && (
                  <div className="absolute right-0 top-full mt-1 w-48 bg-[#0D213B]/95 backdrop-blur-xl rounded-xl border border-white/10 shadow-xl shadow-black/20 overflow-hidden">
                    {/* User info */}
                    <div className="px-3 py-2.5 border-b border-white/5">
                      <p className="text-xs font-medium text-white truncate">
                        {user.first_name || user.username || user.email}
                      </p>
                      <p className="text-[10px] text-white/30 truncate">{user.email}</p>
                    </div>

                    {/* Menu items */}
                    <div className="py-1">
                      {isProvider && (
                        <Link
                          href="/provider/dashboard"
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 text-xs text-white/60 hover:text-[#FFD166] hover:bg-white/5 transition-colors"
                        >
                          <LayoutDashboard className="w-3.5 h-3.5" />
                          Mi Panel
                        </Link>
                      )}

                      {!isProvider && (
                        <Link
                          href="/dashboard"
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 text-xs text-white/60 hover:text-[#FFD166] hover:bg-white/5 transition-colors"
                        >
                          <LayoutDashboard className="w-3.5 h-3.5" />
                          Mi Panel
                        </Link>
                      )}

                      <Link
                        href="/profile"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 text-xs text-white/60 hover:text-[#FFD166] hover:bg-white/5 transition-colors"
                      >
                        <UserCircle className="w-3.5 h-3.5" />
                        Perfil
                      </Link>

                      <button
                        onClick={() => {
                          logout();
                          setMenuOpen(false);
                        }}
                        className="flex items-center gap-2.5 w-full px-3 py-2 text-xs text-white/40 hover:text-red-400 hover:bg-white/5 transition-colors"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Cerrar sesión
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium
                         bg-gradient-to-r from-[#FF8C42] to-[#FFD166] text-[#0D213B]
                         hover:shadow-[0_0_16px_rgba(255,140,66,0.3)] hover:scale-105 transition-all"
            >
              <LogIn className="w-3 h-3" />
              Entrar
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
