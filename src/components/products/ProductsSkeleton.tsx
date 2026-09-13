import React from 'react';

interface ProductsSkeletonProps {
  viewMode: 'list' | 'grid';
}

export const ProductsSkeleton: React.FC<ProductsSkeletonProps> = ({
  viewMode,
}) => {
  if (viewMode === 'grid') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 animate-pulse">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="bg-[#F1F5F9] border border-[#E2E8F0] rounded-xl p-3.5 space-y-3"
          >
            <div className="flex gap-3">
              <div className="w-16 h-16 rounded-lg bg-[#E2E8F0] shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-[#E2E8F0] rounded w-1/3" />
                <div className="h-4 bg-[#E2E8F0] rounded w-full" />
                <div className="h-3 bg-[#E2E8F0] rounded w-1/2" />
              </div>
            </div>
            <div className="h-8 bg-[#F1F5F9] rounded-lg" />
            <div className="h-14 bg-[#F8FAFC] rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="bg-[#F1F5F9] border border-[#E2E8F0] rounded-xl overflow-hidden animate-pulse">
      <div className="h-10 bg-[#F8FAFC] border-b border-[#E2E8F0]" />
      <div className="divide-y divide-[#EFF6FF]">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-12 h-12 rounded-lg bg-[#E2E8F0] shrink-0" />
              <div className="space-y-1.5 flex-1 max-w-sm">
                <div className="h-3.5 bg-[#E2E8F0] rounded w-3/4" />
                <div className="h-3 bg-[#E2E8F0] rounded w-1/3" />
              </div>
            </div>
            <div className="w-24 h-6 bg-[#E2E8F0] rounded" />
            <div className="w-20 h-6 bg-[#E2E8F0] rounded" />
            <div className="w-24 h-8 bg-[#E2E8F0] rounded" />
            <div className="w-16 h-6 bg-[#E2E8F0] rounded" />
          </div>
        ))}
      </div>
    </div>
  );
};
