import { useQuery } from '@tanstack/react-query';
import { apiClient, ProviderProfile, Order } from '../client';
import { endpoints } from '../endpoints';

interface ProviderStats {
  pending_matches: number;
  total_matches: number;
  total_orders: number;
  completed_orders: number;
  in_progress_orders: number;
  total_revenue: number;
  recent_revenue: number;
  average_rating: number;
  total_reviews: number;
}

interface ProviderDashboardData {
  provider: ProviderProfile;
  stats: ProviderStats;
  upcoming_orders: Order[];
  recent_orders: Order[];
}

export function useProviderDashboard() {
  return useQuery({
    queryKey: ['provider', 'dashboard'],
    queryFn: () =>
      apiClient.get<ProviderDashboardData>(endpoints.provider.dashboard, {
        auth: true,
      }),
  });
}

export function useProviderStats() {
  return useQuery({
    queryKey: ['provider', 'stats'],
    queryFn: async () => {
      const data = await apiClient.get<ProviderDashboardData>(
        endpoints.provider.dashboard,
        { auth: true }
      );
      return data.stats;
    },
  });
}
