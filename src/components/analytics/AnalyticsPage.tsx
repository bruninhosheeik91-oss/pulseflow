import React, { useState } from 'react';
import {
  BarChart3,
  Download,
  RefreshCw,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import {
  initialAnalyticsTimeline,
  initialMarketplacePerformance,
  initialChannelAnalytics,
  initialHourlyHeatmap,
  initialTopProductsAnalytics,
  initialTopCampaignsAnalytics,
} from '../../data/mockAnalytics';
import { AnalyticsKpiCards } from './AnalyticsKpiCards';
import { AnalyticsPerformanceChart } from './AnalyticsPerformanceChart';
import { AnalyticsMarketplaceShare } from './AnalyticsMarketplaceShare';
import { AnalyticsChannelLeaderboard } from './AnalyticsChannelLeaderboard';
import { AnalyticsHeatmap } from './AnalyticsHeatmap';
import { AnalyticsTopProducts } from './AnalyticsTopProducts';

export const AnalyticsPage: React.FC = () => {
  const [timeframe, setTimeframe] = useState<
    '7d' | '15d' | '30d' | 'mes_atual' | 'trimestre'
  >('7d');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (text: string) => {
    setToast(text);
    setTimeout(() => setToast(null), 3500);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      showToast('Dados de métricas e conversão sincronizados com as APIs de afiliados!');
    }, 1000);
  };

  const handleExportData = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(
        JSON.stringify(
          {
            generatedAt: new Date().toISOString(),
            timeframe,
            timeline: initialAnalyticsTimeline,
            marketplacePerformance: initialMarketplacePerformance,
            channelAnalytics: initialChannelAnalytics,
            topProducts: initialTopProductsAnalytics,
            topCampaigns: initialTopCampaignsAnalytics,
          },
          null,
          2
        )
      );

    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `pulse_flow_analytics_${timeframe}_${new Date().toISOString().slice(0, 10)}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    showToast('Exportação de dados analíticos concluída com sucesso!');
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Information & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#2563EB]" />
            <span>Analytics & Inteligência de Conversão</span>
          </h2>
          <p className="text-xs text-[#64748B] mt-0.5">
            Métricas de comissões, faturamento GMV, engajamento por canal e horários nobres de compra
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Timeframe Selector */}
          <div className="flex items-center gap-1 bg-[#F8FAFC] border border-[#E2E8F0] p-1 rounded-lg">
            {(
              [
                { id: '7d', label: '7 Dias' },
                { id: '15d', label: '15 Dias' },
                { id: '30d', label: '30 Dias' },
                { id: 'mes_atual', label: 'Mês Atual' },
              ] as const
            ).map((tf) => (
              <button
                key={tf.id}
                type="button"
                onClick={() => setTimeframe(tf.id)}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  timeframe === tf.id
                    ? 'bg-[#2563EB] text-white'
                    : 'text-[#64748B] hover:text-[#172033]'
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>

          {/* Sync Button */}
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F1F5F9] hover:bg-[#CBD5E1] border border-[#93C5FD] text-[#93C5FD] text-xs font-medium rounded-lg transition-colors shadow-xs"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-[#2563EB] ${
                isRefreshing ? 'animate-spin' : ''
              }`}
            />
            <span>Sincronizar APIs</span>
          </button>

          {/* Export Button */}
          <button
            type="button"
            onClick={handleExportData}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F8FAFC] hover:bg-[#E2E8F0] border border-[#DCE3EC] text-[#172033] text-xs font-medium rounded-lg transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-[#64748B]" />
            <span>Exportar Dados</span>
          </button>
        </div>
      </div>

      {/* 2. Key Performance Indicators (6 Cards) */}
      <AnalyticsKpiCards timeline={initialAnalyticsTimeline} />

      {/* 3. Performance Timeline Chart */}
      <AnalyticsPerformanceChart timeline={initialAnalyticsTimeline} />

      {/* 4. Two-Column Row: Marketplaces Share & Channels Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AnalyticsMarketplaceShare
          marketplaces={initialMarketplacePerformance}
        />
        <AnalyticsChannelLeaderboard
          channels={initialChannelAnalytics}
        />
      </div>

      {/* 5. 24-Hour Conversion Heatmap */}
      <AnalyticsHeatmap heatmapData={initialHourlyHeatmap} />

      {/* 6. Top Products & Top Automated Campaigns */}
      <AnalyticsTopProducts
        products={initialTopProductsAnalytics}
        campaigns={initialTopCampaignsAnalytics}
      />

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#FFFFFF] border border-[#BFDBFE] text-[#172033] px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-xs animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
          <span className="font-medium leading-relaxed">{toast}</span>
        </div>
      )}
    </div>
  );
};
