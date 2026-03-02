import { create } from 'zustand';

interface UIState {
  theme: 'light' | 'dark';
  isFiltersDrawerOpen: boolean;
  isMobileMenuOpen: boolean;
  selectedProviderId: number | null;

  // Actions
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
  setFiltersDrawerOpen: (open: boolean) => void;
  toggleFiltersDrawer: () => void;
  setMobileMenuOpen: (open: boolean) => void;
  toggleMobileMenu: () => void;
  setSelectedProviderId: (id: number | null) => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  theme: 'dark',
  isFiltersDrawerOpen: false,
  isMobileMenuOpen: false,
  selectedProviderId: null,

  setTheme: (theme) => {
    set({ theme });
    if (typeof window !== 'undefined') {
      document.documentElement.classList.toggle('dark', theme === 'dark');
    }
  },

  toggleTheme: () => {
    const newTheme = get().theme === 'dark' ? 'light' : 'dark';
    get().setTheme(newTheme);
  },

  setFiltersDrawerOpen: (isFiltersDrawerOpen) => set({ isFiltersDrawerOpen }),
  toggleFiltersDrawer: () =>
    set({ isFiltersDrawerOpen: !get().isFiltersDrawerOpen }),

  setMobileMenuOpen: (isMobileMenuOpen) => set({ isMobileMenuOpen }),
  toggleMobileMenu: () => set({ isMobileMenuOpen: !get().isMobileMenuOpen }),

  setSelectedProviderId: (selectedProviderId) => set({ selectedProviderId }),
}));

// Apply initial theme on load
if (typeof window !== 'undefined') {
  document.documentElement.classList.add('dark');
}
