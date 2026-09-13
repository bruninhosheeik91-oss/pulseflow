import React from 'react';
import { Package, Tag, Layers, Send, TrendingUp, AlertCircle } from 'lucide-react';
import { ProductQuickFilter } from '../../types';

interface MetricItem {
  id: ProductQuickFilter;
  label: string;
  count: string;
  icon: React.ElementType;
  accentColor: string;
}

interface ProductsMetricsBarProps {
  activeFilter: ProductQuickFilter;
  onSelectFilter: (filter: ProductQuickFilter) => void;
  counts?: {
    total?: string;
    activeOffers?: string;
    multiMarketplace?: string;
    published?: string;
    highPerformance?: string;
    noActiveOffers?: string;
  };
}

export const ProductsMetricsBar: React.FC<ProductsMetricsBarProps> = ({
  activeFilter,
  onSelectFilter,
  counts = {
    total: '3.842',
    activeOffers: '2.417',
    multiMarketplace: '684',
    published: '1.126',
    highPerformance: '327',
    noActiveOffers: '94',
  },
}) => {
  const metrics: MetricItem[] = [
    {
      id: 'Produtos',
      label: 'Produtos',
      count: counts.total || '3.842',
      icon: Package,
      accentColor: '#2563EB',
    },
    {
      id: 'Com ofertas ativas',
      label: 'Com ofertas ativas',
      count: counts.activeOffers || '2.417',
      icon: Tag,
      accentColor: '#34D399',
    },
    {
      id: 'Multimarketplace',
      label: 'Multimarketplace',
      count: counts.multiMarketplace || '684',
      icon: Layers,
      accentColor: '#2563EB',
    },
    {
      id: 'Publicados',
      label: 'Publicados',
      count: counts.published || '1.126',
      icon: Send,
      accentColor: '#3B82F6',
    },
    {
      id: 'Alta performance',
      label: 'Alta performance',
      count: counts.highPerformance || '327',
      icon: TrendingUp,
      accentColor: '#F59E0B',
    },
    {
      id: 'Sem oferta ativa',
      label: 'Sem oferta ativa',
      count: counts.noActiveOffers || '94',
      icon: AlertCircle,
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
            className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all duration-150 relative overflow-hidden group cursor-pointer ${
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
              <span className="text-[11px] font-medium text-[#64748B] block truncate">
                {metric.label}
              </span>
              <span
                className={`text-lg font-bold font-mono-numeric block mt-0.5 leading-tight ${
                  isSelected ? 'text-[#172033]' : 'text-[#172033]'
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
