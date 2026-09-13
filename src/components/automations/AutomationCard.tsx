import React from 'react';
import {
  Radar,
  ListChecks,
  RefreshCw,
  Share2,
  Settings,
  Globe,
  ArrowRight,
} from 'lucide-react';
import {
  Automation,
  AutomationType,
  AUTOMATION_TYPE_LABELS,
} from '../../types';
import { Status } from '../ui/Status';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { MarketplaceBadge } from '../ui/MarketplaceBadge';

interface AutomationCardProps {
  automation: Automation;
  onConfigure: (automation: Automation) => void;
}

const AUTOMATION_ICONS: Record<AutomationType, React.ElementType> = {
  AUTO_SEARCH: Radar,
  LINK_LIST: ListChecks,
  MIRROR: RefreshCw,
  MONITOR_GROUP: Share2,
};

const STATUS_MAP: Record<
  Automation['status'],
  'active' | 'idle' | 'warning' | 'error'
> = {
  ACTIVE: 'active',
  PAUSED: 'idle',
  REQUIRES_CONFIGURATION: 'warning',
  ERROR: 'error',
  DISCONNECTED: 'error',
};

export const AutomationCard: React.FC<AutomationCardProps> = ({
  automation,
  onConfigure,
}) => {
  const Icon = AUTOMATION_ICONS[automation.type];
  const accent =
    automation.type === 'AUTO_SEARCH'
      ? 'text-[#2563EB]'
      : automation.type === 'LINK_LIST'
      ? 'text-[#3B82F6]'
      : automation.type === 'MIRROR'
      ? 'text-[#A78BFA]'
      : 'text-emerald-700';

  const metricLabels: Record<string, { label: string; value: React.ReactNode }[]> =
    {
      AUTO_SEARCH: [
        { label: 'Destinos', value: automation.sources.length },
        { label: 'Envios hoje', value: automation.metrics.entriesToday.toLocaleString('pt-BR') },
        { label: 'Envios total', value: automation.metrics.published.toLocaleString('pt-BR') },
        { label: 'Último envio', value: automation.metrics.lastRun },
      ],
      LINK_LIST: [
        { label: 'Listas', value: automation.sources.length },
        { label: 'Links', value: automation.metrics.entriesToday },
        { label: 'Na fila', value: automation.metrics.queued },
        { label: 'Publicados hoje', value: automation.metrics.published },
      ],
      MIRROR: [
        { label: 'Fontes', value: automation.sources.length },
        { label: 'Capturadas hoje', value: automation.metrics.entriesToday },
        { label: 'Processadas', value: automation.metrics.processed },
        { label: 'Na fila', value: automation.metrics.queued },
      ],
      MONITOR_GROUP: [
        { label: 'Entradas hoje', value: automation.metrics.entriesToday },
        { label: 'Destinos', value: automation.sources.length },
        { label: 'Distribuições', value: automation.metrics.published },
      ],
    };

  const metrics = metricLabels[automation.type] || [];

  return (
    <div className="relative bg-[#FFFFFF] border border-[#DCE3EC] rounded-xl transition-all hover:border-[#93C5FD] hover:bg-[#F1F5F9] flex flex-col">
      {/* Header */}
      <div className="p-5 pb-4 border-b border-[#E2E8F0]">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#E2E8F0] border border-[#BFDBFE] flex items-center justify-center shrink-0">
              <Icon className={`w-5 h-5 ${accent}`} />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-[#172033] tracking-tight">
                {automation.name}
              </h3>
              <p className="text-[11px] text-[#64748B] mt-0.5 leading-snug line-clamp-2">
                {automation.description}
              </p>
            </div>
          </div>

          <Status
            variant={STATUS_MAP[automation.status]}
            size="xs"
            label={
              automation.status === 'ACTIVE'
                ? 'Ativa'
                : automation.status === 'PAUSED'
                ? 'Pausada'
                : automation.status === 'REQUIRES_CONFIGURATION'
                ? 'Requer config.'
                : automation.status === 'ERROR'
                ? 'Erro'
                : 'Desconectada'
            }
          />
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="p-5 pb-4 grid grid-cols-2 gap-x-4 gap-y-3.5 flex-1">
        {metrics.map((m) => (
          <div key={m.label}>
            <div className="text-[10px] uppercase tracking-wider text-[#64748B] font-semibold">
              {m.label}
            </div>
            <div className="text-base font-bold font-mono-numeric text-[#172033] mt-0.5">
              {m.value}
            </div>
          </div>
        ))}
      </div>

      {/* Marketplaces */}
      <div className="px-5 pb-4">
        <div className="flex flex-wrap items-center gap-1.5">
          {automation.marketplaces.slice(0, 4).map((mp) => (
            <MarketplaceBadge key={mp} marketplace={mp} size="xs" showDot={false} />
          ))}
          {automation.marketplaces.length > 4 && (
            <Badge variant="neutral" size="xs">
              +{automation.marketplaces.length - 4}
            </Badge>
          )}
        </div>
        {automation.type === 'MIRROR' && (
          <div className="flex items-center gap-1.5 mt-2.5 text-[10px] text-[#64748B]">
            <Globe className="w-3 h-3 shrink-0" />
            <span>Disponibilidade depende da integração utilizada.</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-5 py-4 border-t border-[#E2E8F0] flex items-center justify-end gap-2">
        <Button
          variant="outline"
          size="xs"
          onClick={() => onConfigure(automation)}
          leftIcon={<Settings className="w-3.5 h-3.5" />}
          rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
          className="text-xs border-[#DCE3EC] text-[#172033] hover:bg-[#E2E8F0]"
        >
          Configurar
        </Button>
      </div>

      {/* Type badge corner */}
      <span className="absolute top-4 right-16 text-[9px] font-mono-numeric uppercase tracking-wider text-[#475569] font-bold">
        {automation.id}
      </span>
    </div>
  );
};

export const automationTypeShortLabels: Record<AutomationType, string> = {
  AUTO_SEARCH: AUTOMATION_TYPE_LABELS.AUTO_SEARCH,
  LINK_LIST: AUTOMATION_TYPE_LABELS.LINK_LIST,
  MIRROR: AUTOMATION_TYPE_LABELS.MIRROR,
  MONITOR_GROUP: AUTOMATION_TYPE_LABELS.MONITOR_GROUP,
};