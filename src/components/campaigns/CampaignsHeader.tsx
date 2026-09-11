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
          <h1 className="text-xl font-bold text-[#E6E8EC] tracking-tight">
            Campanhas
          </h1>
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#101F3D] border border-[#1C3A6E] text-xs font-semibold text-[#00C2FF]">
            <Radio className="w-3 h-3 animate-pulse text-[#00C2FF]" />
            <span>
              {activeCount} ativas de {totalCount}
            </span>
          </div>
        </div>
        <p className="text-xs text-[#8E9BAE] mt-1">
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
              <RefreshCw className="w-3.5 h-3.5 text-[#00C2FF] animate-spin" />
            ) : (
              <Zap className="w-3.5 h-3.5 text-[#00C2FF]" />
            )
          }
          className="text-xs border-[#182747] text-[#E6E8EC] hover:bg-[#0F1C36]"
        >
          {isEngineRunning ? 'Varrendo ofertas...' : 'Varredura Imediata'}
        </Button>

        <Button
          variant="primary"
          size="sm"
          onClick={onOpenNewCampaign}
          leftIcon={<Plus className="w-3.5 h-3.5" />}
          className="text-xs font-semibold px-4 shadow-sm shadow-[#1E5EFF]/20"
        >
          Nova Campanha
        </Button>
      </div>
    </div>
  );
};
