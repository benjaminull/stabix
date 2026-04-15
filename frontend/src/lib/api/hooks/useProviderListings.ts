import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, Listing, PaginatedResponse } from '../client';
import { endpoints } from '../endpoints';

interface ListingDetailed extends Listing {
  description?: string;
  is_active: boolean;
  service: number;
  provider: number;
}

interface CreateListingData {
  service: number;
  title: string;
  description?: string;
  base_price: string;
  price_unit: string;
  is_active?: boolean;
}

export function useProviderListings() {
  return useQuery({
    queryKey: ['provider', 'listings'],
    queryFn: () =>
      apiClient.get<PaginatedResponse<ListingDetailed>>(
        endpoints.provider.listings,
        { auth: true }
      ),
  });
}

export function useProviderListing(id: number) {
  return useQuery({
    queryKey: ['provider', 'listing', id],
    queryFn: () =>
      apiClient.get<ListingDetailed>(endpoints.provider.listingDetail(id), {
        auth: true,
      }),
    enabled: !!id,
  });
}

export function useCreateListing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateListingData) =>
      apiClient.post<ListingDetailed>(endpoints.provider.listings, data, {
        auth: true,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['provider', 'listings'] });
    },
  });
}

export function useUpdateListing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateListingData> }) =>
      apiClient.patch<ListingDetailed>(endpoints.provider.listingDetail(id), data, {
        auth: true,
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['provider', 'listings'] });
      queryClient.invalidateQueries({ queryKey: ['provider', 'listing', variables.id] });
    },
  });
}

export function useDeleteListing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) =>
      apiClient.delete(endpoints.provider.listingDetail(id), { auth: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['provider', 'listings'] });
    },
  });
}
