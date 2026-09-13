import React from 'react';
import { RefreshCw, Clock } from 'lucide-react';
import { Button } from '../ui/Button';

interface ProductsHeaderProps {
  lastSyncText: string;
  isUpdating: boolean;
  onRefreshCatalog: () => void;
}

export const ProductsHeader: React.FC<ProductsHeaderProps> = ({
  lastSyncText,
  isUpdating,
  onRefreshCatalog,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
      <div>
        <h2 className="text-xl font-bold text-[#172033] tracking-tight">
          Produtos
        </h2>
        <p className="text-xs text-[#64748B] mt-0.5">
          Catálogo inteligente de produtos encontrados nos marketplaces.
        </p>
      </div>

      <div className="flex items-center gap-3 self-start sm:self-auto">
        <div className="flex items-center gap-1.5 text-xs text-[#64748B] bg-[#F8FAFC] border border-[#E2E8F0] px-3 py-1.5 rounded-lg">
          <Clock className="w-3.5 h-3.5 text-[#2563EB]" />
          <span>Última atualização</span>
          <span className="text-[#172033] font-medium font-mono-numeric">
            {lastSyncText}
          </span>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={onRefreshCatalog}
          disabled={isUpdating}
          leftIcon={
            <RefreshCw
              className={`w-3.5 h-3.5 text-[#2563EB] ${
                isUpdating ? 'animate-spin' : ''
              }`}
            />
          }
          className="text-xs font-semibold border-[#CBD5E1] hover:border-[#93C5FD] text-[#172033] bg-[#FFFFFF]"
        >
          {isUpdating ? 'Atualizando catálogo...' : 'Atualizar catálogo'}
        </Button>
      </div>
    </div>
  );
};
