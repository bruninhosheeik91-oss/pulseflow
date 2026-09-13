import React, { useState, useMemo } from 'react';
import {
  Clock,
  Send,
  AlertTriangle,
  Play,
  Pause,
  Zap,
  CheckCircle2,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';
import {
  QueueItem,
  QueueFilterTab,
  QueueSortOption,
  QueueViewMode,
  QueuePriority,
} from '../../types';
import { initialQueueItems } from '../../data/mockQueue';
import { QueueHeader } from './QueueHeader';
import { QueueMetricsBar } from './QueueMetricsBar';
import { QueueFilterBar } from './QueueFilterBar';
import { QueueTimelineView } from './QueueTimelineView';
import { QueueTableView } from './QueueTableView';
import { QueueMessagePreviewModal } from './QueueMessagePreviewModal';
import { QueueRescheduleModal } from './QueueRescheduleModal';
import { QueueNewItemModal } from './QueueNewItemModal';

export const QueuePage: React.FC = () => {
  const [queue, setQueue] = useState<QueueItem[]>(initialQueueItems);
  const [isQueuePaused, setIsQueuePaused] = useState(false);
  const [activeTab, setActiveTab] = useState<QueueFilterTab>('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChannel, setSelectedChannel] = useState('Todos');
  const [selectedMarketplace, setSelectedMarketplace] = useState('Todos');
  const [selectedAutomation, setSelectedAutomation] = useState('Todos');
  const [selectedCampaign, setSelectedCampaign] = useState('Todos');
  const [sortOption, setSortOption] = useState<QueueSortOption>('time-asc');
  const [viewMode, setViewMode] = useState<QueueViewMode>('timeline');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modals
  const [previewItem, setPreviewItem] = useState<QueueItem | null>(null);
  const [rescheduleItem, setRescheduleItem] = useState<QueueItem | null>(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

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

  // Distinct channels, marketplaces, campaigns for filters
  const availableChannels = useMemo(() => {
    const list = Array.from(new Set(queue.map((q) => q.channel)));
    return list;
  }, [queue]);

  const availableMarketplaces = useMemo(() => {
    const list = Array.from(
      new Set(queue.map((q) => q.marketplace).filter(Boolean) as string[])
    );
    return list;
  }, [queue]);

  const availableAutomations = useMemo(() => {
    const list = Array.from(
      new Set(queue.map((q) => q.automationSource).filter(Boolean) as string[])
    );
    return list;
  }, [queue]);

  const availableCampaigns = useMemo(() => {
    const list = Array.from(
      new Set(queue.map((q) => q.campaignName).filter(Boolean) as string[])
    );
    return list;
  }, [queue]);

  // Counts for tabs
  const queueCounts = useMemo(() => {
    return {
      todos: queue.length,
      emFila: queue.filter((i) => i.status === 'Em fila').length,
      agendados: queue.filter((i) => i.status === 'Agendado').length,
      publicando: queue.filter((i) => i.status === 'Publicando').length,
      publicados: queue.filter((i) => i.status === 'Publicado').length,
      falhas: queue.filter((i) => i.status === 'Falha').length,
    };
  }, [queue]);

  // Filter & Sort Logic
  const filteredItems = useMemo(() => {
    let result = [...queue];

    // Status Tab Filter
    if (activeTab === 'Em fila') {
      result = result.filter((i) => i.status === 'Em fila');
    } else if (activeTab === 'Agendados') {
      result = result.filter((i) => i.status === 'Agendado');
    } else if (activeTab === 'Publicando') {
      result = result.filter((i) => i.status === 'Publicando');
    } else if (activeTab === 'Publicados') {
      result = result.filter((i) => i.status === 'Publicado');
    } else if (activeTab === 'Falhas') {
      result = result.filter((i) => i.status === 'Falha');
    }

    // Channel Filter
    if (selectedChannel !== 'Todos') {
      result = result.filter((i) => i.channel === selectedChannel);
    }

    // Marketplace Filter
    if (selectedMarketplace !== 'Todos') {
      result = result.filter((i) => i.marketplace === selectedMarketplace);
    }

    // Automation Origin Filter
    if (selectedAutomation !== 'Todos') {
      result = result.filter((i) => i.automationSource === selectedAutomation);
    }

    // Campaign Filter
    if (selectedCampaign !== 'Todos') {
      result = result.filter((i) => i.campaignName === selectedCampaign);
    }

    // Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (i) =>
          i.productName.toLowerCase().includes(q) ||
          i.channel.toLowerCase().includes(q) ||
          (i.campaignName && i.campaignName.toLowerCase().includes(q)) ||
          (i.coupon && i.coupon.toLowerCase().includes(q)) ||
          (i.marketplace && i.marketplace.toLowerCase().includes(q))
      );
    }

    // Sorting
    result.sort((a, b) => {
      if (sortOption === 'score') {
        return (b.dealScore || 0) - (a.dealScore || 0);
      }
      if (sortOption === 'priority') {
        const pOrder: Record<string, number> = { Alta: 3, Normal: 2, Baixa: 1 };
        return (pOrder[b.priority || 'Normal'] || 0) - (pOrder[a.priority || 'Normal'] || 0);
      }
      if (sortOption === 'discount') {
        return (b.discountPercentage || 0) - (a.discountPercentage || 0);
      }
      if (sortOption === 'price') {
        return a.price - b.price;
      }
      if (sortOption === 'time-desc') {
        return b.time.localeCompare(a.time);
      }
      // default 'time-asc'
      return a.time.localeCompare(b.time);
    });

    return result;
  }, [
    queue,
    activeTab,
    selectedChannel,
    selectedMarketplace,
    selectedAutomation,
    selectedCampaign,
    searchQuery,
    sortOption,
  ]);

  // Operational Actions
  const handleTogglePauseQueue = () => {
    setIsQueuePaused((prev) => {
      const next = !prev;
      showToast(
        next
          ? 'Fila pausada globalmente. Postagens automáticas foram suspensas.'
          : 'Fila retomada! Cadência anti-flood ativada.',
        next ? 'warning' : 'success'
      );
      return next;
    });
  };

  const handleDispatchNow = (item: QueueItem) => {
    // Set to 'Publicando'
    setQueue((prev) =>
      prev.map((i) =>
        i.id === item.id ? { ...i, status: 'Publicando', estimatedInMinutes: 0 } : i
      )
    );
    showToast(`Disparando "${item.productName.substring(0, 30)}..." agora!`, 'info');

    // After 1.8s simulate published success
    setTimeout(() => {
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(
        now.getMinutes()
      ).padStart(2, '0')}`;

      setQueue((prev) =>
        prev.map((i) =>
          i.id === item.id
            ? {
                ...i,
                status: 'Publicado',
                time: timeStr,
                publishedAt: `Hoje às ${timeStr}`,
                clicksCount: 0,
              }
            : i
        )
      );
      showToast(
        `Oferta postada com sucesso no canal "${item.channel}"!`,
        'success'
      );
    }, 1800);
  };

  const handleDispatchNextNow = () => {
    const nextPending = queue.find(
      (i) => i.status === 'Em fila' || i.status === 'Agendado'
    );
    if (nextPending) {
      handleDispatchNow(nextPending);
    } else {
      showToast('Nenhuma postagem pendente para disparar no momento.', 'info');
    }
  };

  const handleMoveToTop = (item: QueueItem) => {
    setQueue((prev) => {
      const remaining = prev.filter((i) => i.id !== item.id);
      const updatedItem = {
        ...item,
        priority: 'Alta' as QueuePriority,
        estimatedInMinutes: 2,
      };
      return [updatedItem, ...remaining];
    });
    showToast(
      `"${item.productName.substring(0, 30)}..." movido para o topo com Alta Prioridade!`,
      'success'
    );
  };

  const handleRemoveItem = (item: QueueItem) => {
    setQueue((prev) => prev.filter((i) => i.id !== item.id));
    showToast('Publicação removida da grade com sucesso.', 'info');
  };

  const handleRetryItem = (item: QueueItem) => {
    handleDispatchNow(item);
  };

  const handleSaveReschedule = (
    itemId: string,
    newTime: string,
    priority: QueuePriority,
    delayMinutes: number
  ) => {
    setQueue((prev) =>
      prev.map((i) =>
        i.id === itemId
          ? {
              ...i,
              time: newTime,
              priority,
              estimatedInMinutes: delayMinutes,
              status: 'Agendado',
            }
          : i
      )
    );
    showToast(`Postagem reagendada para às ${newTime} com sucesso!`, 'success');
  };

  const handleSaveCopy = (itemId: string, newCopy: string) => {
    setQueue((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, customCopy: newCopy } : i))
    );
    showToast('Copy da mensagem atualizada com sucesso!', 'success');
  };

  const handleAddToQueue = (newItem: QueueItem) => {
    setQueue((prev) => [newItem, ...prev]);
    showToast(
      `Oferta adicionada à fila com agendamento para ${newItem.time}!`,
      'success'
    );
  };

  const handleBulkDispatch = (selectedItems: QueueItem[]) => {
    selectedItems.forEach((item, index) => {
      setTimeout(() => {
        handleDispatchNow(item);
      }, index * 800);
    });
    showToast(
      `Iniciando lote de ${selectedItems.length} publicações com espaçamento anti-flood!`,
      'info'
    );
  };

  const handleBulkRemove = (selectedItems: QueueItem[]) => {
    const ids = selectedItems.map((i) => i.id);
    setQueue((prev) => prev.filter((i) => !ids.includes(i.id)));
    showToast(`${selectedItems.length} publicações removidas da fila.`, 'info');
  };

  const handleRefreshQueue = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      showToast('Fila sincronizada com instâncias de WhatsApp e Telegram!', 'info');
    }, 900);
  };

  const totalPendingCount = queue.filter(
    (i) => i.status === 'Em fila' || i.status === 'Agendado'
  ).length;

  return (
    <div className="space-y-6">
      {/* Paused Banner if queue is suspended */}
      {isQueuePaused && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-700 animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0" />
            <div>
              <p className="font-semibold text-amber-700">
                Atenção: A Fila de Disparos está Pausada Globalmente
              </p>
              <p className="text-[#CBD5E1] mt-0.5">
                Nenhuma publicação agendada será enviada aos canais até que você retome o pipeline.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleTogglePauseQueue}
            className="px-3.5 py-1.5 bg-amber-400 text-slate-950 hover:bg-amber-300 font-bold rounded-lg shrink-0 flex items-center justify-center gap-1.5 transition-colors shadow-sm"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Retomar Fila Agora</span>
          </button>
        </div>
      )}

      {/* 1. Header with Controls */}
      <QueueHeader
        isQueuePaused={isQueuePaused}
        totalPendingCount={totalPendingCount}
        onTogglePauseQueue={handleTogglePauseQueue}
        onDispatchNextNow={handleDispatchNextNow}
        onOpenNewPublicationModal={() => setIsNewModalOpen(true)}
        onRefreshQueue={handleRefreshQueue}
        isRefreshing={isRefreshing}
      />

      {/* 2. Key Metrics Bar */}
      <QueueMetricsBar queueItems={queue} isQueuePaused={isQueuePaused} />

      {/* 3. Filter Bar (Tabs, Search, Selects, View Mode) */}
      <QueueFilterBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedChannel={selectedChannel}
        onChannelChange={setSelectedChannel}
        selectedMarketplace={selectedMarketplace}
        onMarketplaceChange={setSelectedMarketplace}
        selectedAutomation={selectedAutomation}
        onAutomationChange={setSelectedAutomation}
        selectedCampaign={selectedCampaign}
        onCampaignChange={setSelectedCampaign}
        sortOption={sortOption}
        onSortChange={setSortOption}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        queueCounts={queueCounts}
        availableChannels={availableChannels}
        availableMarketplaces={availableMarketplaces}
        availableAutomations={availableAutomations}
        availableCampaigns={availableCampaigns}
      />

      {/* 4. Active View: Timeline / Cards vs Table */}
      {viewMode === 'timeline' ? (
        <QueueTimelineView
          items={filteredItems}
          onDispatchNow={handleDispatchNow}
          onPreviewMessage={(item) => setPreviewItem(item)}
          onReschedule={(item) => setRescheduleItem(item)}
          onMoveToTop={handleMoveToTop}
          onRemoveItem={handleRemoveItem}
          onRetryItem={handleRetryItem}
        />
      ) : (
        <QueueTableView
          items={filteredItems}
          onDispatchNow={handleDispatchNow}
          onPreviewMessage={(item) => setPreviewItem(item)}
          onReschedule={(item) => setRescheduleItem(item)}
          onRemoveItem={handleRemoveItem}
          onBulkDispatch={handleBulkDispatch}
          onBulkRemove={handleBulkRemove}
        />
      )}

      {/* Modals */}
      <QueueMessagePreviewModal
        isOpen={!!previewItem}
        item={previewItem}
        onClose={() => setPreviewItem(null)}
        onSaveCopy={handleSaveCopy}
        onDispatchNow={handleDispatchNow}
      />

      <QueueRescheduleModal
        isOpen={!!rescheduleItem}
        item={rescheduleItem}
        onClose={() => setRescheduleItem(null)}
        onSaveReschedule={handleSaveReschedule}
      />

      <QueueNewItemModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onAddToQueue={handleAddToQueue}
      />

      {/* In-page Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#FFFFFF] border border-[#BFDBFE] text-[#172033] px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-xs animate-in fade-in slide-in-from-bottom-3 duration-200">
          {toast.type === 'warning' ? (
            <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
          ) : toast.type === 'info' ? (
            <Sparkles className="w-4 h-4 text-[#2563EB] shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
          )}
          <span className="font-medium leading-relaxed">{toast.text}</span>
        </div>
      )}
    </div>
  );
};
