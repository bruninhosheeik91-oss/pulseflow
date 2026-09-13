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
          <h2 className="text-xl font-bold text-[#172033] tracking-tight">
            Ofertas
          </h2>
          <span className="text-xs font-mono-numeric px-2 py-0.5 rounded-full bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]">
            Central Operacional
          </span>
        </div>
        <p className="text-xs text-[#64748B] mt-1">
          Encontre, analise e publique as melhores oportunidades.
        </p>
      </div>

      {/* Right Actions & Sync Time */}
      <div className="flex items-center flex-wrap gap-3">
        {/* Sync Info */}
        <div className="flex items-center gap-1.5 text-xs text-[#64748B] bg-[#F8FAFC] px-2.5 py-1 rounded-lg border border-[#E2E8F0]">
          <Clock className="w-3.5 h-3.5 text-[#94A3B8]" />
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
              className={`w-3.5 h-3.5 text-[#64748B] ${
                isSyncing ? 'animate-spin text-[#2563EB]' : ''
              }`}
            />
          }
          className="text-xs text-[#172033] border-[#DCE3EC] hover:border-[#E2E8F0]"
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
              <Sparkles className="w-3.5 h-3.5 text-[#172033]" />
            )
          }
          className="text-xs font-semibold shadow-sm shadow-[#2563EB]/30"
        >
          {isScanning ? 'Buscando novas ofertas...' : '+ Buscar ofertas'}
        </Button>
      </div>
    </div>
  );
};
