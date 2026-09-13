import React from 'react';
import { Plus, Zap, RefreshCw, Radio } from 'lucide-react';
import { Button } from '../ui/Button';

interface CampaignsHeaderProps {
  activeCount: number;
  totalCount: number;
  isEngineRunning?: boolean;
  onOpenNewCampaign: () => void;
  onRunAllEngines: () => void;
}

export const CampaignsHeader: React.FC<CampaignsHeaderProps> = ({
  activeCount,
  totalCount,
  isEngineRunning = false,
  onOpenNewCampaign,
  onRunAllEngines,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
      <div>
        <div className="flex items-center gap-2.5">
          <h1 className="text-xl font-bold text-[#172033] tracking-tight">
            Campanhas
          </h1>
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] text-xs font-semibold text-[#2563EB]">
            <Radio className="w-3 h-3 animate-pulse text-[#2563EB]" />
            <span>
              {activeCount} ativas de {totalCount}
            </span>
          </div>
        </div>
        <p className="text-xs text-[#64748B] mt-1">
          Regras de automação contínua, filtros de Deal Score e distribuição automática multimarketplace.
        </p>
      </div>

      <div className="flex items-center gap-2.5 shrink-0">
        <Button
          variant="outline"
          size="sm"
          onClick={onRunAllEngines}
          disabled={isEngineRunning}
          leftIcon={
            isEngineRunning ? (
              <RefreshCw className="w-3.5 h-3.5 text-[#2563EB] animate-spin" />
            ) : (
              <Zap className="w-3.5 h-3.5 text-[#2563EB]" />
            )
          }
          className="text-xs border-[#DCE3EC] text-[#172033] hover:bg-[#F8FAFC]"
        >
          {isEngineRunning ? 'Varrendo ofertas...' : 'Varredura Imediata'}
        </Button>

        <Button
          variant="primary"
          size="sm"
          onClick={onOpenNewCampaign}
          leftIcon={<Plus className="w-3.5 h-3.5" />}
          className="text-xs font-semibold px-4 shadow-sm shadow-[#2563EB]/20"
        >
          Nova Campanha
        </Button>
      </div>
    </div>
  );
};
