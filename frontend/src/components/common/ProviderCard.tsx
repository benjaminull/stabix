'use client';

import Link from 'next/link';
import { Star, MapPin } from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ProviderProfile } from '@/lib/api/client';
import { formatDistance, formatRating } from '@/lib/utils/format';
import { PRICE_BANDS } from '@/lib/config/constants';

interface ProviderCardProps {
  provider: ProviderProfile;
  onHover?: (id: number | null) => void;
  isHighlighted?: boolean;
}

export function ProviderCard({ provider, onHover, isHighlighted }: ProviderCardProps) {
  const priceBand = PRICE_BANDS[provider.price_band] || PRICE_BANDS.standard;

  return (
    <Link href={`/providers/${provider.id}`}>
      <Card
        className={`cursor-pointer transition-all hover:shadow-lg hover:border-accent-500 ${
          isHighlighted ? 'ring-2 ring-accent-500 shadow-xl' : ''
        }`}
        onMouseEnter={() => onHover?.(provider.id)}
        onMouseLeave={() => onHover?.(null)}
      >
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-display text-lg font-semibold text-foreground">
                {provider.user_email}
              </h3>
              <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
                {provider.total_reviews > 0 && (
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-accent-400 text-accent-400" />
                    <span className="font-medium text-foreground">
                      {formatRating(provider.average_rating)}
                    </span>
                    <span>({provider.total_reviews})</span>
                  </div>
                )}
                {provider.distance_km !== undefined && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span>{formatDistance(provider.distance_km)}</span>
                  </div>
                )}
              </div>
            </div>
            <Badge variant="outline">{priceBand.symbol}</Badge>
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
            <span>{provider.total_completed_orders} trabajos completados</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
