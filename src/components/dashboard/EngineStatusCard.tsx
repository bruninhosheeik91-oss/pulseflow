import React, { useState } from 'react';
import { Cpu, RefreshCw, Radio, Activity } from 'lucide-react';
import { initialEngineStatus } from '../../data/mockData';
import { Status } from '../ui/Status';

export const EngineStatusCard: React.FC = () => {
  const [syncing, setSyncing] = useState(false);
  const [lastSyncText, setLastSyncText] = useState(initialEngineStatus.lastSync);
  const [syncedJustNow, setSyncedJustNow] = useState(false);

  const handleSyncNow = () => {
    if (syncing) return;
    setSyncing(true);
    setSyncedJustNow(false);

    setTimeout(() => {
      setSyncing(false);
      setLastSyncText(initialEngineStatus.lastSync);
      setSyncedJustNow(true);
      setTimeout(() => setSyncedJustNow(false), 3000);
    }, 1200);
  };

  return (
    <div className="bg-[#FFFFFF] border border-[#DCE3EC] rounded-xl p-5 relative overflow-hidden flex flex-col justify-between">
      {/* Background subtle watermark icon */}
      <Cpu className="absolute -right-4 -bottom-4 w-28 h-28 text-[#E2E8F0] pointer-events-none opacity-30" />

      <div>
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#E2E8F0] border border-[#BFDBFE] flex items-center justify-center text-[#2563EB] shrink-0">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#172033]">
                Motor de Ofertas
              </h3>
              <p className="text-xs text-[#94A3B8]">
                Scanner contínuo de afiliados
              </p>
            </div>
          </div>

          {/* Pulsing Active Status */}
          <Status variant="idle" size="sm" label="Pausado" />
        </div>

        {/* Operational Metrics */}
        <div className="space-y-3.5 my-4">
          {/* Última sincronização */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#94A3B8]">Última sincronização</span>
            <span className="font-mono-numeric font-medium text-[#172033]">
              {lastSyncText}
            </span>
          </div>

          {/* Produtos analisados hoje */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#94A3B8]">Produtos analisados hoje</span>
            <span className="font-mono-numeric font-semibold text-[#64748B] bg-[#EFF6FF] px-2 py-0.5 rounded border border-[#CBD5E1]">
              0
            </span>
          </div>

          {/* Próxima busca */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#94A3B8]">Próxima busca programada</span>
            <span className="font-mono-numeric font-medium text-[#172033]">
              —
            </span>
          </div>

          {/* Assertividade do Deal Score */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#94A3B8]">Assertividade do Deal Score</span>
            <span className="font-mono-numeric font-semibold text-[#64748B]">
              —
            </span>
          </div>
        </div>
      </div>

      {/* Manual Sync Trigger & Connected Sources */}
      <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs text-[#94A3B8]">
          <Radio className="w-3.5 h-3.5 text-[#2563EB] shrink-0" />
          <span>
            {initialEngineStatus.activeSources > 0
              ? `${initialEngineStatus.activeSources} marketplaces conectados`
              : 'Nenhum marketplace conectado'}
          </span>
        </div>

        <button
          type="button"
          onClick={handleSyncNow}
          disabled={syncing}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2563EB] hover:text-white px-2.5 py-1 rounded-md hover:bg-[#DBEAFE] active:bg-[#F1F5F9] border border-transparent hover:border-[#BFDBFE] transition-colors disabled:opacity-50"
          title="Forçar ciclo de varredura"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`}
          />
          <span>
            {syncing
              ? 'Varrendo...'
              : syncedJustNow
              ? 'Concluído!'
              : 'Sincronizar'}
          </span>
        </button>
      </div>
    </div>
  );
};
