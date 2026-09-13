import React from 'react';
import { SearchX, RotateCcw, Sparkles } from 'lucide-react';
import { Button } from '../ui/Button';

interface OffersEmptyStateProps {
  onResetFilters: () => void;
  onScanOffers: () => void;
}

export const OffersEmptyState: React.FC<OffersEmptyStateProps> = ({
  onResetFilters,
  onScanOffers,
}) => {
  return (
    <div className="bg-[#F4F7FB] border border-[#E2E8F0] rounded-xl p-8 text-center flex flex-col items-center justify-center">
      <div className="w-14 h-14 rounded-2xl bg-[#F1F5F9] border border-[#BFDBFE] flex items-center justify-center text-[#2563EB] mb-4 shadow-inner">
        <SearchX className="w-7 h-7" />
      </div>

      <h3 className="text-base font-bold text-[#172033]">
        Nenhuma oferta encontrada
      </h3>
      <p className="text-xs text-[#64748B] max-w-sm mt-1.5 mb-6">
        Tente ajustar os filtros ou iniciar uma nova busca de ofertas pelo motor automatizado.
      </p>

      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={onResetFilters}
          leftIcon={<RotateCcw className="w-3.5 h-3.5 text-[#64748B]" />}
          className="text-xs text-[#172033]"
        >
          Limpar filtros
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={onScanOffers}
          leftIcon={<Sparkles className="w-3.5 h-3.5" />}
          className="text-xs font-semibold"
        >
          Buscar ofertas
        </Button>
      </div>
    </div>
  );
};
