import React from 'react';
import { Radar, ListChecks, RefreshCw, Share2 } from 'lucide-react';
import { AutomationType, AUTOMATION_TYPE_LABELS } from '../../types';

interface AutomationOriginBadgeProps {
  source?: AutomationType;
  size?: 'xs' | 'sm';
  showLabel?: boolean;
  className?: string;
}

const SOURCE_META: Record<
  AutomationType,
  { icon: React.ElementType; className: string }
> = {
  AUTO_SEARCH: {
    icon: Radar,
    className:
      'bg-[#2563EB]/10 text-[#2563EB] border-[#2563EB]/25',
  },
  LINK_LIST: {
    icon: ListChecks,
    className: 'bg-[#F8FAFC]/10 text-[#22D3EE] border-[#E2E8F0]/25',
  },
  MIRROR: {
    icon: RefreshCw,
    className: 'bg-[#7C3AED]/10 text-[#A78BFA] border-[#7C3AED]/25',
  },
  MONITOR_GROUP: {
    icon: Share2,
    className: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/25',
  },
};

export const AutomationOriginBadge: React.FC<AutomationOriginBadgeProps> = ({
  source,
  size = 'xs',
  showLabel = true,
  className = '',
}) => {
  if (!source) return null;

  const meta = SOURCE_META[source];
  const Icon = meta.icon;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border font-medium whitespace-nowrap transition-colors select-none ${
        size === 'xs'
          ? 'px-1.5 py-0.5 text-[10px]'
          : 'px-2 py-0.5 text-[11px]'
      } ${meta.className} ${className}`}
      title={`Origem: ${AUTOMATION_TYPE_LABELS[source]}`}
    >
      <Icon className={size === 'xs' ? 'w-2.5 h-2.5' : 'w-3 h-3'} />
      {showLabel && <span>{AUTOMATION_TYPE_LABELS[source]}</span>}
    </span>
  );
};