import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, TokenResponse, apiClient } from '../api/client';
import { endpoints } from '../api/endpoints';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User | null) => void;
  setTokens: (tokens: TokenResponse) => void;
  refreshAccessToken: () => Promise<string | null>;
  fetchUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const tokens = await apiClient.post<TokenResponse>(endpoints.auth.token, {
            email,
            password,
          });

          set({
            accessToken: tokens.access,
            refreshToken: tokens.refresh,
            isAuthenticated: true,
          });

          // Fetch user data
          await get().fetchUser();
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        });
      },

      setUser: (user: User | null) => {
        set({ user });
      },

      setTokens: (tokens: TokenResponse) => {
        set({
          accessToken: tokens.access,
          refreshToken: tokens.refresh,
          isAuthenticated: true,
        });
      },

      refreshAccessToken: async () => {
        const { refreshToken } = get();
        if (!refreshToken) return null;

        try {
          const tokens = await apiClient.post<TokenResponse>(endpoints.auth.refresh, {
            refresh: refreshToken,
          });

          set({
            accessToken: tokens.access,
            refreshToken: tokens.refresh,
          });

          return tokens.access;
        } catch (error) {
          get().logout();
          return null;
        }
      },

      fetchUser: async () => {
        const { accessToken } = get();
        if (!accessToken) return;

        try {
          const user = await apiClient.get<User>(endpoints.customer.me, { auth: true });
          set({ user, isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },
    }),
    {
      name: 'stabix-auth',
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Configure API client with auth store
if (typeof window !== 'undefined') {
  apiClient.setTokenGetter(() => useAuthStore.getState().accessToken);
  apiClient.setTokenRefresher(() =>
    useAuthStore.getState().refreshAccessToken()
  );
}
