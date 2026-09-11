import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface OffersPaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  currentCount: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export const OffersPagination: React.FC<OffersPaginationProps> = ({
  currentPage,
  totalPages = 50,
  pageSize,
  totalItems = 1247,
  currentCount,
  onPageChange,
  onPageSizeChange,
}) => {
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(startItem + currentCount - 1, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 bg-[#0A0F1C] border border-[#162340] rounded-xl text-xs">
      {/* Total & Current Showing */}
      <div className="text-[#8E9BAE]">
        Mostrando <span className="font-mono-numeric font-semibold text-[#E6E8EC]">{startItem}–{endItem}</span> de{' '}
        <span className="font-mono-numeric font-semibold text-[#E6E8EC]">
          {totalItems.toLocaleString('pt-BR')}
        </span>{' '}
        ofertas
      </div>

      {/* Page Size & Page Controls */}
      <div className="flex items-center gap-4">
        {/* Items per page selector */}
        <div className="flex items-center gap-1.5 text-[#8E9BAE]">
          <span className="hidden sm:inline">Itens por página:</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="bg-[#070C18] border border-[#182747] text-[#E6E8EC] rounded-md px-2 py-1 text-xs font-mono-numeric cursor-pointer focus:outline-none focus:border-[#1E5EFF]"
          >
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
            className="p-1.5 rounded-lg border border-[#182747] text-[#8E9BAE] hover:text-[#E6E8EC] hover:bg-[#121E38] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Página anterior"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          {[1, 2, 3].map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              className={`w-7 h-7 rounded-lg border text-xs font-mono-numeric font-semibold transition-all ${
                currentPage === p
                  ? 'bg-[#152345] border-[#1E5EFF] text-[#00C2FF]'
                  : 'border-[#182747] text-[#8E9BAE] hover:text-[#E6E8EC] hover:bg-[#121E38]'
              }`}
            >
              {p}
            </button>
          ))}

          <span className="px-1 text-[#5A6470] font-mono-numeric">...</span>

          <button
            type="button"
            onClick={() => onPageChange(totalPages)}
            className={`w-7 h-7 rounded-lg border text-xs font-mono-numeric font-semibold transition-all ${
              currentPage === totalPages
                ? 'bg-[#152345] border-[#1E5EFF] text-[#00C2FF]'
                : 'border-[#182747] text-[#8E9BAE] hover:text-[#E6E8EC] hover:bg-[#121E38]'
            }`}
          >
            {totalPages}
          </button>

          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange(currentPage + 1)}
            className="p-1.5 rounded-lg border border-[#182747] text-[#8E9BAE] hover:text-[#E6E8EC] hover:bg-[#121E38] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Próxima página"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
