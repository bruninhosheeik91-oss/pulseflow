import React from 'react';
import { Tag, Sparkles, Clock, CheckCircle2, Send, XCircle } from 'lucide-react';

export type OfferQuickFilter =
  | 'Encontradas'
  | 'Excelentes'
  | 'Em análise'
  | 'Aprovadas hoje'
  | 'Publicadas hoje'
  | 'Rejeitadas';

interface MetricItem {
  id: OfferQuickFilter;
  label: string;
  count: string | number;
  icon: React.ElementType;
  accentColor: string;
}

interface OffersMetricsBarProps {
  activeFilter: OfferQuickFilter;
  onSelectFilter: (filter: OfferQuickFilter) => void;
  counts?: {
    total: number;
    excellent: number;
    inReview: number;
    approvedToday: number;
    publishedToday: number;
    rejected: number;
  };
}

export const OffersMetricsBar: React.FC<OffersMetricsBarProps> = ({
  activeFilter,
  onSelectFilter,
  counts = {
    total: 1247,
    excellent: 86,
    inReview: 142,
    approvedToday: 38,
    publishedToday: 42,
    rejected: 17,
  },
}) => {
  const metrics: MetricItem[] = [
    {
      id: 'Encontradas',
      label: 'Encontradas',
      count: counts.total.toLocaleString('pt-BR'),
      icon: Tag,
      accentColor: '#2563EB',
    },
    {
      id: 'Excelentes',
      label: 'Excelentes',
      count: counts.excellent,
      icon: Sparkles,
      accentColor: '#2563EB',
    },
    {
      id: 'Em análise',
      label: 'Em análise',
      count: counts.inReview,
      icon: Clock,
      accentColor: '#2563EB',
    },
    {
      id: 'Aprovadas hoje',
      label: 'Aprovadas hoje',
      count: counts.approvedToday,
      icon: CheckCircle2,
      accentColor: '#34D399',
    },
    {
      id: 'Publicadas hoje',
      label: 'Publicadas hoje',
      count: counts.publishedToday,
      icon: Send,
      accentColor: '#3B82F6',
    },
    {
      id: 'Rejeitadas',
      label: 'Rejeitadas',
      count: counts.rejected,
      icon: XCircle,
      accentColor: '#F87171',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
      {metrics.map((metric) => {
        const Icon = metric.icon;
        const isSelected = activeFilter === metric.id;

        return (
          <button
            key={metric.id}
            type="button"
            onClick={() => onSelectFilter(metric.id)}
            className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all duration-150 relative overflow-hidden group ${
              isSelected
                ? 'bg-[#EFF6FF] border-[#2563EB] shadow-sm shadow-[#2563EB]/15'
                : 'bg-[#F8FAFC] border-[#E2E8F0] hover:bg-[#F1F5F9] hover:border-[#94A3B8]'
            }`}
          >
            {/* Active top line accent */}
            {isSelected && (
              <span className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#2563EB] to-[#2563EB]" />
            )}

            <div className="min-w-0 pr-2">
              <span className="text-xs font-medium text-[#64748B] block truncate">
                {metric.label}
              </span>
              <span
                className={`text-lg font-bold font-mono-numeric block mt-0.5 leading-tight ${
                  isSelected ? 'text-white' : 'text-[#172033]'
                }`}
              >
                {metric.count}
              </span>
            </div>

            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border transition-colors ${
                isSelected
                  ? 'bg-[#DCE3EC] border-[#2563EB]/50'
                  : 'bg-[#F1F5F9] border-[#DCE3EC] group-hover:border-[#93C5FD]'
              }`}
            >
              <Icon
                className="w-4 h-4"
                style={{
                  color: isSelected ? metric.accentColor : '#64748B',
                }}
              />
            </div>
          </button>
        );
      })}
    </div>
  );
};
