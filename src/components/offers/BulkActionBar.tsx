import React from 'react';
import { CheckCircle2, Clock, Send, XCircle, X } from 'lucide-react';
import { Button } from '../ui/Button';

interface BulkActionBarProps {
  selectedCount: number;
  onApproveSelected: () => void;
  onScheduleSelected: () => void;
  onPublishSelected: () => void;
  onRejectSelected: () => void;
  onClearSelection: () => void;
}

export const BulkActionBar: React.FC<BulkActionBarProps> = ({
  selectedCount,
  onApproveSelected,
  onScheduleSelected,
  onPublishSelected,
  onRejectSelected,
  onClearSelection,
}) => {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 max-w-2xl w-[92%] sm:w-auto">
      <div className="bg-[#F8FAFC]/95 backdrop-blur-md border border-[#93C5FD] text-[#172033] px-4 py-2.5 rounded-2xl shadow-2xl shadow-black/80 flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-4 duration-200">
        {/* Selection Count */}
        <div className="flex items-center gap-2 pr-2 border-r border-[#CBD5E1]">
          <span className="w-6 h-6 rounded-full bg-[#2563EB] text-white flex items-center justify-center text-xs font-bold font-mono-numeric">
            {selectedCount}
          </span>
          <span className="text-xs font-semibold text-[#172033] whitespace-nowrap">
            {selectedCount === 1
              ? '1 oferta selecionada'
              : `${selectedCount} ofertas selecionadas`}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <Button
            size="xs"
            variant="secondary"
            onClick={onApproveSelected}
            leftIcon={<CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />}
            className="text-xs hover:border-emerald-500/40"
          >
            Aprovar
          </Button>

          <Button
            size="xs"
            variant="secondary"
            onClick={onScheduleSelected}
            leftIcon={<Clock className="w-3.5 h-3.5 text-indigo-400" />}
            className="text-xs hover:border-indigo-500/40"
          >
            Agendar
          </Button>

          <Button
            size="xs"
            variant="primary"
            onClick={onPublishSelected}
            leftIcon={<Send className="w-3.5 h-3.5" />}
            className="text-xs font-semibold"
          >
            Publicar
          </Button>

          <Button
            size="xs"
            variant="ghost"
            onClick={onRejectSelected}
            leftIcon={<XCircle className="w-3.5 h-3.5 text-rose-700" />}
            className="text-xs text-rose-700 hover:bg-rose-500/10 hover:text-rose-700"
          >
            Rejeitar
          </Button>
        </div>

        {/* Clear Selection */}
        <button
          type="button"
          onClick={onClearSelection}
          className="p-1 rounded-lg text-[#64748B] hover:text-[#172033] hover:bg-[#DBEAFE] transition-colors"
          title="Limpar seleção"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
