import React from 'react';
import {
  Clock,
  Play,
  Pause,
  Zap,
  Plus,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { Button } from '../ui/Button';

interface QueueHeaderProps {
  isQueuePaused: boolean;
  totalPendingCount: number;
  onTogglePauseQueue: () => void;
  onDispatchNextNow: () => void;
  onOpenNewPublicationModal: () => void;
  onRefreshQueue: () => void;
  isRefreshing?: boolean;
}

export const QueueHeader: React.FC<QueueHeaderProps> = ({
  isQueuePaused,
  totalPendingCount,
  onTogglePauseQueue,
  onDispatchNextNow,
  onOpenNewPublicationModal,
  onRefreshQueue,
  isRefreshing = false,
}) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[#16233B]">
      {/* Title & Pipeline Operational Status */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#101D36] border border-[#1E3360] flex items-center justify-center text-[#00C2FF] shadow-sm">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl font-bold text-[#E6E8EC] tracking-tight">
                Fila de Publicações
              </h1>

              {/* Status pill */}
              {isQueuePaused ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Pause className="w-3 h-3" /> Fila Pausada Globalmente
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Pipeline Ativo &bull; Anti-Flood Ativado
                </span>
              )}

              <span className="text-xs font-mono-numeric text-[#8E9BAE] bg-[#121E38] px-2 py-0.5 rounded border border-[#1E3360]">
                {totalPendingCount} agendados
              </span>
            </div>

            <p className="text-xs text-[#94A3B8] mt-0.5">
              Grade de postagens programadas, controle de cadência anti-ban e pipeline de disparo multimarketplace
            </p>
          </div>
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-2.5 flex-wrap">
        {/* Refresh button */}
        <button
          type="button"
          onClick={onRefreshQueue}
          disabled={isRefreshing}
          className="p-2 text-[#94A3B8] hover:text-[#E6E8EC] bg-[#0E1628] border border-[#1B2947] hover:border-[#2D426E] rounded-lg transition-colors disabled:opacity-50"
          title="Atualizar fila"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#00C2FF]' : ''}`} />
        </button>

        {/* Pause/Resume Queue Button */}
        <button
          type="button"
          onClick={onTogglePauseQueue}
          className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg border transition-all ${
            isQueuePaused
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
          }`}
          title={isQueuePaused ? 'Retomar disparos automáticos' : 'Suspender temporariamente disparos'}
        >
          {isQueuePaused ? (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Retomar Fila</span>
            </>
          ) : (
            <>
              <Pause className="w-3.5 h-3.5" />
              <span>Pausar Fila</span>
            </>
          )}
        </button>

        {/* Dispatch Next Now */}
        <button
          type="button"
          onClick={onDispatchNextNow}
          disabled={isQueuePaused || totalPendingCount === 0}
          className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-[#00C2FF] bg-[#00C2FF]/10 hover:bg-[#00C2FF]/20 border border-[#00C2FF]/30 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          title="Disparar a primeira publicação da fila imediatamente"
        >
          <Zap className="w-3.5 h-3.5 fill-current" />
          <span>Disparar Próximo</span>
        </button>

        {/* New Manual Publication Button */}
        <Button
          variant="primary"
          size="sm"
          onClick={onOpenNewPublicationModal}
          className="flex items-center gap-2 shadow-lg shadow-[#1E5EFF]/15"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Publicação</span>
        </Button>
      </div>
    </div>
  );
};
