import React from 'react';
import { PackageSearch, RotateCcw, RefreshCw } from 'lucide-react';
import { Button } from '../ui/Button';

interface ProductsEmptyStateProps {
  onResetFilters: () => void;
  onRefreshCatalog: () => void;
}

export const ProductsEmptyState: React.FC<ProductsEmptyStateProps> = ({
  onResetFilters,
  onRefreshCatalog,
}) => {
  return (
    <div className="bg-[#0B1324] border border-[#162340] rounded-xl p-10 sm:p-14 text-center">
      <div className="w-14 h-14 rounded-2xl bg-[#101A33] border border-[#1B2F5C] flex items-center justify-center mx-auto text-[#00C2FF] mb-4 shadow-sm">
        <PackageSearch className="w-7 h-7" />
      </div>

      <h3 className="text-base font-bold text-[#E6E8EC]">
        Nenhum produto encontrado
      </h3>
      <p className="text-xs text-[#8E9BAE] max-w-sm mx-auto mt-1 mb-6">
        Ajuste os filtros aplicados ou atualize o catálogo para sincronizar novos
        produtos mapeados nos marketplaces.
      </p>

      <div className="flex items-center justify-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={onResetFilters}
          leftIcon={<RotateCcw className="w-3.5 h-3.5 text-[#8E9BAE]" />}
          className="text-xs text-[#E6E8EC] border-[#182747]"
        >
          Limpar filtros
        </Button>

        <Button
          variant="primary"
          size="sm"
          onClick={onRefreshCatalog}
          leftIcon={<RefreshCw className="w-3.5 h-3.5 text-white" />}
          className="text-xs font-semibold px-4"
        >
          Atualizar catálogo
        </Button>
      </div>
    </div>
  );
};
