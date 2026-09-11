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
    <div className="bg-[#0A0F1C] border border-[#162340] rounded-xl p-8 text-center flex flex-col items-center justify-center">
      <div className="w-14 h-14 rounded-2xl bg-[#0F182E] border border-[#1E3057] flex items-center justify-center text-[#00C2FF] mb-4 shadow-inner">
        <SearchX className="w-7 h-7" />
      </div>

      <h3 className="text-base font-bold text-[#E6E8EC]">
        Nenhuma oferta encontrada
      </h3>
      <p className="text-xs text-[#8E9BAE] max-w-sm mt-1.5 mb-6">
        Tente ajustar os filtros ou iniciar uma nova busca de ofertas pelo motor automatizado.
      </p>

      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={onResetFilters}
          leftIcon={<RotateCcw className="w-3.5 h-3.5 text-[#8E9BAE]" />}
          className="text-xs text-[#E6E8EC]"
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
