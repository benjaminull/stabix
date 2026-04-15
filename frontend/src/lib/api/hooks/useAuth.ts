import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/store/auth.store';
import { apiClient, User } from '../client';
import { endpoints } from '../endpoints';

export function useCurrentUser() {
  const { isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: ['user', 'me'],
    queryFn: () => apiClient.get<User>(endpoints.customer.me, { auth: true }),
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useLogin() {
  const { login } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      login(email, password),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });
}

export function useLogout() {
  const { logout } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      logout();
    },
    onSuccess: () => {
      queryClient.clear();
    },
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: (data: {
      email: string;
      username: string;
      password: string;
      first_name?: string;
      last_name?: string;
      phone?: string;
    }) => apiClient.post(endpoints.auth.register, data),
  });
}
