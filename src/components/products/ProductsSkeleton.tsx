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
            className="bg-[#0B1324] border border-[#162340] rounded-xl p-3.5 space-y-3"
          >
            <div className="flex gap-3">
              <div className="w-16 h-16 rounded-lg bg-[#14203B] shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-[#14203B] rounded w-1/3" />
                <div className="h-4 bg-[#14203B] rounded w-full" />
                <div className="h-3 bg-[#14203B] rounded w-1/2" />
              </div>
            </div>
            <div className="h-8 bg-[#101A30] rounded-lg" />
            <div className="h-14 bg-[#080E1C] rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="bg-[#0B1324] border border-[#162340] rounded-xl overflow-hidden animate-pulse">
      <div className="h-10 bg-[#080E1C] border-b border-[#14203B]" />
      <div className="divide-y divide-[#121E38]">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-12 h-12 rounded-lg bg-[#14203B] shrink-0" />
              <div className="space-y-1.5 flex-1 max-w-sm">
                <div className="h-3.5 bg-[#14203B] rounded w-3/4" />
                <div className="h-3 bg-[#14203B] rounded w-1/3" />
              </div>
            </div>
            <div className="w-24 h-6 bg-[#14203B] rounded" />
            <div className="w-20 h-6 bg-[#14203B] rounded" />
            <div className="w-24 h-8 bg-[#14203B] rounded" />
            <div className="w-16 h-6 bg-[#14203B] rounded" />
          </div>
        ))}
      </div>
    </div>
  );
};
