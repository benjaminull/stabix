'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';

const ExploreMap = dynamic(
  () => import('@/components/map/ExploreMap').then((m) => ({ default: m.ExploreMap })),
  {
    ssr: false,
    loading: () => (
      <div className="h-[calc(100dvh-3rem)] bg-[#0D213B] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-[#FF8C42] rounded-full animate-spin" />
      </div>
    ),
  }
);

function SearchPageContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const category = searchParams.get('category') || undefined;

  return (
    <ExploreMap
      height="calc(100dvh - 4rem)"
      initialQuery={query}
      initialCategory={category}
      animateMarkers={false}
    />
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="h-[calc(100dvh-3rem)] bg-[#0D213B] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-white/20 border-t-[#FF8C42] rounded-full animate-spin" />
        </div>
      }
    >
      <SearchPageContent />
    </Suspense>
  );
}
