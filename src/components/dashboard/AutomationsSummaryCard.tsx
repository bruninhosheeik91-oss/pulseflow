import React from 'react';
import { Workflow, Radar, ListChecks, RefreshCw, Share2 } from 'lucide-react';
import { initialAutomations } from '../../data/mockAutomations';
import { AutomationStatus } from '../../types';

interface AutomationsSummaryCardProps {
  onNavigate?: (item: string) => void;
}

const TYPE_ICONS = {
  AUTO_SEARCH: Radar,
  LINK_LIST: ListChecks,
  MIRROR: RefreshCw,
  MONITOR_GROUP: Share2,
};

const TYPE_LABELS = {
  AUTO_SEARCH: 'Busca Automática',
  LINK_LIST: 'Lista de Links',
  MIRROR: 'Espelhamento',
  MONITOR_GROUP: 'Grupo Monitor',
};

const statusDot: Record<AutomationStatus, string> = {
  ACTIVE: 'bg-emerald-500',
  PAUSED: 'bg-amber-500',
  REQUIRES_CONFIGURATION: 'bg-[#2563EB]',
  ERROR: 'bg-red-500',
  DISCONNECTED: 'bg-[#94A3B8]',
};

export const AutomationsSummaryCard: React.FC<AutomationsSummaryCardProps> = ({
  onNavigate,
}) => {
  const activeCount = initialAutomations.filter(
    (a) => a.status === 'ACTIVE'
  ).length;

  return (
    <div className="bg-[#FFFFFF] border border-[#DCE3EC] rounded-xl p-5">
      <button
        type="button"
        onClick={() => onNavigate && onNavigate('Automações')}
        className="w-full flex items-center justify-between border-b border-[#E2E8F0] pb-3 hover:opacity-90 transition-opacity cursor-pointer text-left"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#E2E8F0] border border-[#BFDBFE] flex items-center justify-center text-[#2563EB] shrink-0">
            <Workflow className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#172033]">
              Automações
            </h3>
            <p className="text-xs text-[#94A3B8]">
              {activeCount} de {initialAutomations.length} ativas
            </p>
          </div>
        </div>
        <span className="text-xs font-semibold text-[#2563EB] hover:underline">
          Ver todas
        </span>
      </button>

      <div className="mt-3 space-y-1">
        {initialAutomations.map((a) => {
          const Icon = TYPE_ICONS[a.type];
          return (
            <div
              key={a.id}
              className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-[#F1F5F9] transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Icon className="w-3.5 h-3.5 text-[#64748B] shrink-0" />
                <span className="text-xs text-[#334155] truncate">
                  {TYPE_LABELS[a.type]}
                </span>
              </div>
              <span
                className={`text-[10px] font-semibold ${
                  a.status === 'ACTIVE'
                    ? 'text-emerald-700'
                    : a.status === 'PAUSED'
                    ? 'text-amber-700'
                    : 'text-[#64748B]'
                } flex items-center gap-1.5`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    statusDot[a.status]
                  } ${a.status === 'ACTIVE' ? 'animate-pulse' : ''}`}
                />
                {a.status === 'ACTIVE'
                  ? 'Ativa'
                  : a.status === 'PAUSED'
                  ? 'Pausado'
                  : a.status === 'REQUIRES_CONFIGURATION'
                  ? 'Requer config.'
                  : 'Pendente'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};