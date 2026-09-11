import React, { useState, useMemo } from 'react';
import {
  History,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Download,
} from 'lucide-react';
import {
  HistoryDispatchItem,
  HistoryFilterPeriod,
  Marketplace,
} from '../../types';
import { initialHistoryItems } from '../../data/mockHistory';
import { HistoryMetricsBar } from './HistoryMetricsBar';
import { HistoryFilterBar } from './HistoryFilterBar';
import { HistoryTable } from './HistoryTable';
import { HistoryDetailModal } from './HistoryDetailModal';

export const HistoryPage: React.FC = () => {
  const [historyList, setHistoryList] =
    useState<HistoryDispatchItem[]>(initialHistoryItems);
  const [statusFilter, setStatusFilter] = useState('todos');
  const [periodFilter, setPeriodFilter] = useState<HistoryFilterPeriod>('todos');
  const [channelFilter, setChannelFilter] = useState('Todos');
  const [marketplaceFilter, setMarketplaceFilter] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected item for modal
  const [inspectItem, setInspectItem] = useState<HistoryDispatchItem | null>(
    null
  );

  // Toast feedback
  const [toast, setToast] = useState<{
    text: string;
    type?: 'success' | 'info' | 'warning';
  } | null>(null);

  const showToast = (
    text: string,
    type: 'success' | 'info' | 'warning' = 'success'
  ) => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Distinct channels and marketplaces
  const availableChannels = useMemo(() => {
    return Array.from(new Set(historyList.map((h) => h.channel)));
  }, [historyList]);

  const availableMarketplaces = useMemo(() => {
    return Array.from(new Set(historyList.map((h) => h.marketplace)));
  }, [historyList]);

  // Tab counts
  const counts = useMemo(() => {
    return {
      todos: historyList.length,
      entregues: historyList.filter((i) => i.status === 'Entregue').length,
      falhas: historyList.filter((i) => i.status === 'Falha').length,
      reenviados: historyList.filter((i) => i.status === 'Re-enviado').length,
    };
  }, [historyList]);

  // Filtered Items
  const filteredItems = useMemo(() => {
    let result = [...historyList];

    // Status filter
    if (statusFilter !== 'todos') {
      result = result.filter((i) => i.status === statusFilter);
    }

    // Channel filter
    if (channelFilter !== 'Todos') {
      result = result.filter((i) => i.channel === channelFilter);
    }

    // Marketplace filter
    if (marketplaceFilter !== 'Todos') {
      result = result.filter((i) => i.marketplace === marketplaceFilter);
    }

    // Period filter
    const now = Date.now();
    if (periodFilter === 'hoje') {
      result = result.filter((i) => i.dispatchedAt.startsWith('Hoje'));
    } else if (periodFilter === 'ontem') {
      result = result.filter((i) => i.dispatchedAt.startsWith('Ontem'));
    } else if (periodFilter === '7d') {
      const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
      result = result.filter((i) => i.timestamp >= sevenDaysAgo);
    } else if (periodFilter === '30d') {
      const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
      result = result.filter((i) => i.timestamp >= thirtyDaysAgo);
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (i) =>
          i.productName.toLowerCase().includes(q) ||
          i.channel.toLowerCase().includes(q) ||
          (i.campaignName && i.campaignName.toLowerCase().includes(q)) ||
          (i.coupon && i.coupon.toLowerCase().includes(q)) ||
          i.marketplace.toLowerCase().includes(q)
      );
    }

    return result;
  }, [
    historyList,
    statusFilter,
    periodFilter,
    channelFilter,
    marketplaceFilter,
    searchQuery,
  ]);

  // Handlers
  const handleInspect = (item: HistoryDispatchItem) => {
    setInspectItem(item);
  };

  const handleRetry = (item: HistoryDispatchItem) => {
    showToast(
      `Re-enviando "${item.productName.substring(0, 30)}..." para o canal "${item.channel}"...`,
      'info'
    );

    setTimeout(() => {
      setHistoryList((prev) =>
        prev.map((i) =>
          i.id === item.id
            ? {
                ...i,
                status: 'Re-enviado',
                dispatchedAt: 'Hoje às ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                retryCount: (i.retryCount || 0) + 1,
              }
            : i
        )
      );
      showToast('Disparo re-enviado e entregue com sucesso!', 'success');
    }, 1200);
  };

  const handleCopyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    showToast('Link oficial de afiliado copiado para a área de transferência!', 'success');
  };

  const handleDelete = (id: string) => {
    setHistoryList((prev) => prev.filter((i) => i.id !== id));
    showToast('Registro de disparo removido do histórico.', 'info');
  };

  const handleExportCsv = () => {
    const headers = [
      'ID',
      'Data_Disparo',
      'Canal',
      'Plataforma',
      'Marketplace',
      'Produto',
      'Preco',
      'Desconto_%',
      'Status',
      'Cliques',
      'Pedidos',
      'Comissao_R$',
      'Link_Afiliado',
    ];

    const rows = filteredItems.map((i) => [
      i.id,
      `"${i.dispatchedAt}"`,
      `"${i.channel}"`,
      i.channelPlatform,
      i.marketplace,
      `"${i.productName.replace(/"/g, '""')}"`,
      i.price.toFixed(2),
      i.discountPercentage || 0,
      i.status,
      i.clicks,
      i.orders,
      i.commission.toFixed(2),
      `"${i.affiliateUrl}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `domnex_deals_historico_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast(`Relatório CSV com ${filteredItems.length} registros baixado com sucesso!`, 'success');
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Information & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <History className="w-5 h-5 text-[#00C2FF]" />
            <span>Histórico de Publicações & Auditoria</span>
          </h2>
          <p className="text-xs text-[#8E9BAE] mt-0.5">
            Registro cronológico completo de mensagens enviadas, telemetria de instâncias e conversões atribuídas
          </p>
        </div>
      </div>

      {/* 2. Top Metrics Bar */}
      <HistoryMetricsBar historyItems={filteredItems} />

      {/* 3. Filter Bar */}
      <HistoryFilterBar
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        periodFilter={periodFilter}
        onPeriodChange={setPeriodFilter}
        channelFilter={channelFilter}
        onChannelChange={setChannelFilter}
        marketplaceFilter={marketplaceFilter}
        onMarketplaceChange={setMarketplaceFilter}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        availableChannels={availableChannels}
        availableMarketplaces={availableMarketplaces}
        onExportCsv={handleExportCsv}
        counts={counts}
      />

      {/* 4. Dense Historical Table */}
      <HistoryTable
        items={filteredItems}
        onInspect={handleInspect}
        onRetry={handleRetry}
        onCopyLink={handleCopyLink}
        onDelete={handleDelete}
      />

      {/* 5. Detail Inspection Modal */}
      <HistoryDetailModal
        isOpen={!!inspectItem}
        item={inspectItem}
        onClose={() => setInspectItem(null)}
        onRetry={handleRetry}
      />

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0E172C] border border-[#1E3563] text-[#E6E8EC] px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-xs animate-in fade-in slide-in-from-bottom-3 duration-200">
          {toast.type === 'warning' ? (
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          ) : toast.type === 'info' ? (
            <Sparkles className="w-4 h-4 text-[#00C2FF] shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span className="font-medium leading-relaxed">{toast.text}</span>
        </div>
      )}
    </div>
  );
};
