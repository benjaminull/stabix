'use client';

import { useState, useEffect } from 'react';
import { Filter, X, MapPin, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useFiltersStore } from '@/lib/store/filters.store';
import { useCategories } from '@/lib/api/hooks/useTaxonomy';
import { PRICE_BANDS, SEARCH_DEFAULTS } from '@/lib/config/constants';

interface SearchFiltersProps {
  onFiltersChange?: () => void;
}

export function SearchFilters({ onFiltersChange }: SearchFiltersProps) {
  const {
    category,
    radiusKm,
    priceBand,
    minRating,
    location,
    setCategory,
    setRadiusKm,
    setPriceBand,
    setMinRating,
    resetFilters,
  } = useFiltersStore();

  const { data: categoriesData, isLoading: isLoadingCategories } = useCategories();
  const categories = categoriesData?.results || [];

  const [localRadius, setLocalRadius] = useState(radiusKm);
  const [localMinRating, setLocalMinRating] = useState(minRating);

  // Update local state when store changes
  useEffect(() => {
    setLocalRadius(radiusKm);
  }, [radiusKm]);

  useEffect(() => {
    setLocalMinRating(minRating);
  }, [minRating]);

  const handleRadiusChange = (value: number[]) => {
    setLocalRadius(value[0]);
  };

  const handleRadiusCommit = (value: number[]) => {
    setRadiusKm(value[0]);
    onFiltersChange?.();
  };

  const handleMinRatingChange = (value: number[]) => {
    setLocalMinRating(value[0]);
  };

  const handleMinRatingCommit = (value: number[]) => {
    setMinRating(value[0]);
    onFiltersChange?.();
  };

  const handleCategoryChange = (value: string) => {
    setCategory(value === 'all' ? null : value);
    onFiltersChange?.();
  };

  const handlePriceBandChange = (value: string) => {
    setPriceBand(value === 'all' ? null : value);
    onFiltersChange?.();
  };

  const handleResetFilters = () => {
    resetFilters();
    onFiltersChange?.();
  };

  const activeFiltersCount = [
    category,
    priceBand,
    radiusKm !== SEARCH_DEFAULTS.RADIUS_KM,
    minRating > 0,
  ].filter(Boolean).length;

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">Filtros</CardTitle>
            {activeFiltersCount > 0 && (
              <Badge variant="secondary">{activeFiltersCount}</Badge>
            )}
          </div>
          {activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              className="h-8 px-2 text-xs"
            >
              <X className="h-3 w-3 mr-1" />
              Limpiar
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Category filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Categoría</label>
          <Select
            value={category || 'all'}
            onValueChange={handleCategoryChange}
            disabled={isLoadingCategories}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona una categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorías</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.slug}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Radius filter */}
        {location && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                Radio de búsqueda
              </label>
              <span className="text-sm text-muted-foreground font-semibold">
                {localRadius} km
              </span>
            </div>
            <Slider
              value={[localRadius]}
              onValueChange={handleRadiusChange}
              onValueCommit={handleRadiusCommit}
              min={SEARCH_DEFAULTS.MIN_RADIUS}
              max={SEARCH_DEFAULTS.MAX_RADIUS}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{SEARCH_DEFAULTS.MIN_RADIUS} km</span>
              <span>{SEARCH_DEFAULTS.MAX_RADIUS} km</span>
            </div>
          </div>
        )}

        {/* Price band filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Rango de precio</label>
          <Select
            value={priceBand || 'all'}
            onValueChange={handlePriceBandChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un rango" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los precios</SelectItem>
              {Object.entries(PRICE_BANDS).map(([key, band]) => (
                <SelectItem key={key} value={key}>
                  {band.symbol} {band.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Rating filter */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium flex items-center gap-1">
              <Star className="h-4 w-4" />
              Calificación mínima
            </label>
            <span className="text-sm text-muted-foreground font-semibold">
              {localMinRating > 0 ? `${localMinRating.toFixed(1)}+` : 'Todas'}
            </span>
          </div>
          <Slider
            value={[localMinRating]}
            onValueChange={handleMinRatingChange}
            onValueCommit={handleMinRatingCommit}
            min={0}
            max={5}
            step={0.5}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0</span>
            <span>5</span>
          </div>
        </div>

        {/* Active filters summary */}
        {activeFiltersCount > 0 && (
          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground mb-2">Filtros activos:</p>
            <div className="flex flex-wrap gap-2">
              {category && (
                <Badge variant="secondary" className="text-xs">
                  {categories.find((c) => c.slug === category)?.name}
                </Badge>
              )}
              {priceBand && (
                <Badge variant="secondary" className="text-xs">
                  {PRICE_BANDS[priceBand as keyof typeof PRICE_BANDS]?.symbol}
                </Badge>
              )}
              {radiusKm !== SEARCH_DEFAULTS.RADIUS_KM && (
                <Badge variant="secondary" className="text-xs">
                  {radiusKm} km
                </Badge>
              )}
              {minRating > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {minRating.toFixed(1)}+ estrellas
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
