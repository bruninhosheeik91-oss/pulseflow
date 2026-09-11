import React from 'react';
import { RefreshCw, Sparkles, Clock } from 'lucide-react';
import { Button } from '../ui/Button';

interface OffersHeaderProps {
  lastSyncText: string;
  isScanning: boolean;
  isSyncing: boolean;
  onScanOffers: () => void;
  onSyncOffers: () => void;
}

export const OffersHeader: React.FC<OffersHeaderProps> = ({
  lastSyncText,
  isScanning,
  isSyncing,
  onScanOffers,
  onSyncOffers,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
      {/* Title & Subtitle */}
      <div>
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-[#E6E8EC] tracking-tight">
            Ofertas
          </h2>
          <span className="text-xs font-mono-numeric px-2 py-0.5 rounded-full bg-[#121E38] text-[#00C2FF] border border-[#1E3563]">
            Central Operacional
          </span>
        </div>
        <p className="text-xs text-[#8E9BAE] mt-1">
          Encontre, analise e publique as melhores oportunidades.
        </p>
      </div>

      {/* Right Actions & Sync Time */}
      <div className="flex items-center flex-wrap gap-3">
        {/* Sync Info */}
        <div className="flex items-center gap-1.5 text-xs text-[#8E9BAE] bg-[#0A1020] px-2.5 py-1 rounded-lg border border-[#162340]">
          <Clock className="w-3.5 h-3.5 text-[#5A6470]" />
          <span>Última sincronização {lastSyncText}</span>
        </div>

        {/* Sync Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={onSyncOffers}
          disabled={isSyncing || isScanning}
          leftIcon={
            <RefreshCw
              className={`w-3.5 h-3.5 text-[#8E9BAE] ${
                isSyncing ? 'animate-spin text-[#00C2FF]' : ''
              }`}
            />
          }
          className="text-xs text-[#E6E8EC] border-[#1B2947] hover:border-[#283E6E]"
        >
          {isSyncing ? 'Sincronizando...' : 'Sincronizar ofertas'}
        </Button>

        {/* Primary Scan Button */}
        <Button
          variant="primary"
          size="sm"
          onClick={onScanOffers}
          disabled={isScanning || isSyncing}
          leftIcon={
            isScanning ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-white" />
            )
          }
          className="text-xs font-semibold shadow-sm shadow-[#1E5EFF]/30"
        >
          {isScanning ? 'Buscando novas ofertas...' : '+ Buscar ofertas'}
        </Button>
      </div>
    </div>
  );
};
