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
        <h2 className="text-xl font-bold text-[#E6E8EC] tracking-tight">
          Produtos
        </h2>
        <p className="text-xs text-[#8E9BAE] mt-0.5">
          Catálogo inteligente de produtos encontrados nos marketplaces.
        </p>
      </div>

      <div className="flex items-center gap-3 self-start sm:self-auto">
        <div className="flex items-center gap-1.5 text-xs text-[#8E9BAE] bg-[#0A1020] border border-[#162340] px-3 py-1.5 rounded-lg">
          <Clock className="w-3.5 h-3.5 text-[#00C2FF]" />
          <span>Última atualização</span>
          <span className="text-[#E6E8EC] font-medium font-mono-numeric">
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
              className={`w-3.5 h-3.5 text-[#00C2FF] ${
                isUpdating ? 'animate-spin' : ''
              }`}
            />
          }
          className="text-xs font-semibold border-[#1B2D52] hover:border-[#263D6C] text-[#E6E8EC] bg-[#0E172C]"
        >
          {isUpdating ? 'Atualizando catálogo...' : 'Atualizar catálogo'}
        </Button>
      </div>
    </div>
  );
};
