import { create } from 'zustand';
import { Coordinates } from '../utils/geoutils';

interface FiltersState {
  // Search filters
  query: string;
  category: string | null;
  service: string | null;
  location: Coordinates | null;
  radiusKm: number;
  minRating: number;
  maxPrice: number | null;
  priceBand: string | null;

  // Actions
  setQuery: (query: string) => void;
  setCategory: (category: string | null) => void;
  setService: (service: string | null) => void;
  setLocation: (location: Coordinates | null) => void;
  setRadiusKm: (radius: number) => void;
  setMinRating: (rating: number) => void;
  setMaxPrice: (price: number | null) => void;
  setPriceBand: (band: string | null) => void;
  resetFilters: () => void;
}

const DEFAULT_RADIUS_KM = 10;
const DEFAULT_MIN_RATING = 0;

export const useFiltersStore = create<FiltersState>((set) => ({
  // Initial state
  query: '',
  category: null,
  service: null,
  location: null,
  radiusKm: DEFAULT_RADIUS_KM,
  minRating: DEFAULT_MIN_RATING,
  maxPrice: null,
  priceBand: null,

  // Actions
  setQuery: (query) => set({ query }),
  setCategory: (category) => set({ category, service: null }), // Reset service when category changes
  setService: (service) => set({ service }),
  setLocation: (location) => set({ location }),
  setRadiusKm: (radiusKm) => set({ radiusKm }),
  setMinRating: (minRating) => set({ minRating }),
  setMaxPrice: (maxPrice) => set({ maxPrice }),
  setPriceBand: (priceBand) => set({ priceBand }),
  resetFilters: () =>
    set({
      query: '',
      category: null,
      service: null,
      location: null,
      radiusKm: DEFAULT_RADIUS_KM,
      minRating: DEFAULT_MIN_RATING,
      maxPrice: null,
      priceBand: null,
    }),
}));
