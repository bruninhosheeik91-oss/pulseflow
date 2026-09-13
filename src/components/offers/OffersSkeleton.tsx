import React from 'react';
import { OfferViewMode } from './OffersSearchBar';

interface OffersSkeletonProps {
  viewMode: OfferViewMode;
  count?: number;
}

export const OffersSkeleton: React.FC<OffersSkeletonProps> = ({
  viewMode,
  count = 6,
}) => {
  if (viewMode === 'grid') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-pulse">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="bg-[#F4F7FB] border border-[#E2E8F0] rounded-xl p-3 space-y-3"
          >
            <div className="flex justify-between items-center">
              <div className="w-4 h-4 bg-[#E2E8F0] rounded" />
              <div className="w-20 h-5 bg-[#E2E8F0] rounded" />
            </div>
            <div className="flex gap-3">
              <div className="w-16 h-16 bg-[#E2E8F0] rounded-lg shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="w-24 h-3 bg-[#E2E8F0] rounded" />
                <div className="w-full h-4 bg-[#E2E8F0] rounded" />
              </div>
            </div>
            <div className="h-6 bg-[#E2E8F0] rounded" />
            <div className="h-10 bg-[#E2E8F0] rounded-lg" />
            <div className="h-8 bg-[#E2E8F0] rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="bg-[#F4F7FB] border border-[#E2E8F0] rounded-xl overflow-hidden animate-pulse">
      <div className="p-4 border-b border-[#E2E8F0] bg-[#FFFFFF] flex justify-between">
        <div className="w-40 h-4 bg-[#E2E8F0] rounded" />
        <div className="w-24 h-4 bg-[#E2E8F0] rounded" />
      </div>
      <div className="divide-y divide-[#F1F5F9] p-2 space-y-2">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="py-3 px-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-4 h-4 bg-[#E2E8F0] rounded shrink-0" />
              <div className="w-12 h-12 bg-[#E2E8F0] rounded-lg shrink-0" />
              <div className="space-y-1.5 flex-1 max-w-sm">
                <div className="w-3/4 h-3.5 bg-[#E2E8F0] rounded" />
                <div className="w-1/2 h-3 bg-[#E2E8F0] rounded" />
              </div>
            </div>
            <div className="w-24 h-4 bg-[#E2E8F0] rounded hidden sm:block" />
            <div className="w-16 h-4 bg-[#E2E8F0] rounded hidden md:block" />
            <div className="w-28 h-7 bg-[#E2E8F0] rounded" />
          </div>
        ))}
      </div>
    </div>
  );
};
