import React, { useState, useMemo } from 'react';
import { initialOffers } from '../../data/mockData';
import { ProductOffer, DealStatus } from '../../types';
import { OffersHeader } from './OffersHeader';
import { OffersMetricsBar, OfferQuickFilter } from './OffersMetricsBar';
import {
  OffersSearchBar,
  OfferSortOption,
  OfferViewMode,
} from './OffersSearchBar';
import { OffersTable } from './OffersTable';
import { OffersGrid } from './OffersGrid';
import {
  OfferFiltersDrawer,
  OfferFilterState,
  initialFilterState,
} from './OfferFiltersDrawer';
import { BulkActionBar } from './BulkActionBar';
import { OfferDetailDrawer } from './OfferDetailDrawer';
import { ScheduleOfferModal } from './ScheduleOfferModal';
import { RejectOfferModal } from './RejectOfferModal';
import { OffersPagination } from './OffersPagination';
import { OffersEmptyState } from './OffersEmptyState';
import { OffersSkeleton } from './OffersSkeleton';
import { Check, Info, Sparkles, X } from 'lucide-react';

interface ToastState {
  id: string;
  message: string;
  type: 'success' | 'info' | 'warning';
}

export const OffersPage: React.FC = () => {
  // Master Offers List
  const [offers, setOffers] = useState<ProductOffer[]>(initialOffers);

  // Search, Quick Filter & View State
  const [searchQuery, setSearchQuery] = useState('');
  const [quickFilter, setQuickFilter] = useState<OfferQuickFilter>('Encontradas');
  const [sortOption, setSortOption] = useState<OfferSortOption>('score');
  const [viewMode, setViewMode] = useState<OfferViewMode>('list');

  // Filters Drawer State
  const [isFiltersDrawerOpen, setIsFiltersDrawerOpen] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<OfferFilterState>(initialFilterState);

  // Selection State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modals & Drawers State
  const [detailOffer, setDetailOffer] = useState<ProductOffer | null>(null);
  const [scheduleOffer, setScheduleOffer] = useState<ProductOffer | null>(null);
  const [rejectOffer, setRejectOffer] = useState<ProductOffer | null>(null);

  // Sync / Scanning State
  const [isScanning, setIsScanning] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncText, setLastSyncText] = useState('—');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // In-app Notification Toasts
  const [toasts, setToasts] = useState<ToastState[]>([]);

  const addToast = (message: string, type: 'success' | 'info' | 'warning' = 'success') => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  // Count active drawer filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (appliedFilters.marketplaces && appliedFilters.marketplaces.length > 0) count++;
    if (appliedFilters.category !== 'Todas') count++;
    if (appliedFilters.minPrice || appliedFilters.maxPrice) count++;
    if (appliedFilters.minDiscount > 0) count++;
    if (appliedFilters.minRating > 0) count++;
    if (appliedFilters.minSales > 0) count++;
    if (appliedFilters.minCommission) count++;
    if (appliedFilters.minScore > 0) count++;
    if (appliedFilters.statuses.length > 0) count++;
    return count;
  }, [appliedFilters]);

  // Operational metrics count
  const metricCounts = useMemo(() => {
    return {
      total: offers.length,
      excellent: offers.filter((o) => o.score.total >= 90).length,
      inReview: offers.filter((o) => o.status === 'Em análise').length,
      approvedToday: offers.filter((o) => o.status === 'Aprovada').length,
      publishedToday: offers.filter((o) => o.status === 'Publicada').length,
      rejected: offers.filter((o) => o.status === 'Rejeitada').length,
    };
  }, [offers]);

  // Filtered & Sorted Offers
  const processedOffers = useMemo(() => {
    return offers
      .filter((offer) => {
        // Quick metric filter
        if (quickFilter === 'Excelentes' && offer.score.total < 90) return false;
        if (quickFilter === 'Em análise' && offer.status !== 'Em análise') return false;
        if (quickFilter === 'Aprovadas hoje' && offer.status !== 'Aprovada') return false;
        if (quickFilter === 'Publicadas hoje' && offer.status !== 'Publicada') return false;
        if (quickFilter === 'Rejeitadas' && offer.status !== 'Rejeitada') return false;

        // Search text query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = offer.name.toLowerCase().includes(q);
          const matchCategory = offer.category.toLowerCase().includes(q);
          const matchStore = offer.storeName.toLowerCase().includes(q);
          const matchMarketplace = offer.marketplace.toLowerCase().includes(q);
          if (!matchName && !matchCategory && !matchStore && !matchMarketplace) return false;
        }

        // Marketplace filter
        if (
          appliedFilters.marketplaces &&
          appliedFilters.marketplaces.length > 0 &&
          !appliedFilters.marketplaces.includes(offer.marketplace)
        ) {
          return false;
        }

        // Drawer filters
        if (
          appliedFilters.category !== 'Todas' &&
          offer.category !== appliedFilters.category
        ) {
          return false;
        }

        if (
          appliedFilters.minPrice &&
          offer.price < Number(appliedFilters.minPrice)
        ) {
          return false;
        }

        if (
          appliedFilters.maxPrice &&
          offer.price > Number(appliedFilters.maxPrice)
        ) {
          return false;
        }

        if (
          appliedFilters.minDiscount > 0 &&
          offer.discountPercentage < appliedFilters.minDiscount
        ) {
          return false;
        }

        if (
          appliedFilters.minRating > 0 &&
          offer.rating < appliedFilters.minRating
        ) {
          return false;
        }

        if (
          appliedFilters.minSales > 0 &&
          offer.salesVolumeNumber < appliedFilters.minSales
        ) {
          return false;
        }

        if (
          appliedFilters.minCommission &&
          offer.commissionAmount < Number(appliedFilters.minCommission)
        ) {
          return false;
        }

        if (
          appliedFilters.minScore > 0 &&
          offer.score.total < appliedFilters.minScore
        ) {
          return false;
        }

        if (
          appliedFilters.statuses.length > 0 &&
          !appliedFilters.statuses.includes(offer.status)
        ) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        switch (sortOption) {
          case 'score':
            return b.score.total - a.score.total;
          case 'discount':
            return b.discountPercentage - a.discountPercentage;
          case 'commission':
            return b.commissionAmount - a.commissionAmount;
          case 'sales':
            return b.salesVolumeNumber - a.salesVolumeNumber;
          case 'rating':
            return b.rating - a.rating;
          case 'price_asc':
            return a.price - b.price;
          case 'recent':
          default:
            return 0;
        }
      });
  }, [offers, quickFilter, searchQuery, appliedFilters, sortOption]);

  // Actions handlers
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = () => {
    const visibleIds = processedOffers.map((o) => o.id);
    const allSelected = visibleIds.every((id) => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  const handleApprove = (id: string) => {
    setOffers((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status: 'Aprovada' as DealStatus } : o))
    );
    addToast('Oferta aprovada com sucesso e pronta para publicação!');
  };

  const handlePublish = (offer: ProductOffer) => {
    setOffers((prev) =>
      prev.map((o) =>
        o.id === offer.id ? { ...o, status: 'Publicada' as DealStatus } : o
      )
    );
    addToast(`Oferta enviada para publicação no Telegram e WhatsApp!`);
  };

  const handleScheduleConfirm = (
    offer: ProductOffer,
    date: string,
    time: string,
    channel: string
  ) => {
    setOffers((prev) =>
      prev.map((o) =>
        o.id === offer.id ? { ...o, status: 'Agendada' as DealStatus } : o
      )
    );
    addToast(`Oferta agendada para ${date} às ${time} em ${channel}!`);
  };

  const handleRejectConfirm = (offer: ProductOffer, reason: string) => {
    setOffers((prev) =>
      prev.map((o) =>
        o.id === offer.id ? { ...o, status: 'Rejeitada' as DealStatus } : o
      )
    );
    addToast(`Oferta rejeitada. Motivo: ${reason}`, 'warning');
  };

  const handleCopyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    addToast('Link de afiliado copiado para a área de transferência!');
  };

  // Bulk Actions
  const handleBulkApprove = () => {
    setOffers((prev) =>
      prev.map((o) =>
        selectedIds.includes(o.id)
          ? { ...o, status: 'Aprovada' as DealStatus }
          : o
      )
    );
    addToast(`${selectedIds.length} ofertas aprovadas em massa com sucesso!`);
    setSelectedIds([]);
  };

  const handleBulkPublish = () => {
    setOffers((prev) =>
      prev.map((o) =>
        selectedIds.includes(o.id)
          ? { ...o, status: 'Publicada' as DealStatus }
          : o
      )
    );
    addToast(`${selectedIds.length} ofertas enviadas para publicação imediata!`);
    setSelectedIds([]);
  };

  const handleBulkSchedule = () => {
    setOffers((prev) =>
      prev.map((o) =>
        selectedIds.includes(o.id)
          ? { ...o, status: 'Agendada' as DealStatus }
          : o
      )
    );
    addToast(`${selectedIds.length} ofertas adicionadas à fila de disparo!`);
    setSelectedIds([]);
  };

  const handleBulkReject = () => {
    setOffers((prev) =>
      prev.map((o) =>
        selectedIds.includes(o.id)
          ? { ...o, status: 'Rejeitada' as DealStatus }
          : o
      )
    );
    addToast(`${selectedIds.length} ofertas rejeitadas e arquivadas.`, 'warning');
    setSelectedIds([]);
  };

  // Scan and Sync simulation
  const handleScanOffers = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      setLastSyncText('agora mesmo');
      addToast(
        'Varredura concluída. Nenhuma nova oportunidade identificada.',
        'info'
      );
    }, 1200);
  };

  const handleSyncOffers = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      setLastSyncText('agora mesmo');
      addToast('Ofertas sincronizadas com os marketplaces!', 'info');
    }, 800);
  };

  const handleResetFilters = () => {
    setAppliedFilters(initialFilterState);
    setSearchQuery('');
    setQuickFilter('Encontradas');
  };

  return (
    <div className="space-y-5 pb-16">
      {/* 1. Page Operational Header */}
      <OffersHeader
        lastSyncText={lastSyncText}
        isScanning={isScanning}
        isSyncing={isSyncing}
        onScanOffers={handleScanOffers}
        onSyncOffers={handleSyncOffers}
      />

      {/* 2. Compact Operational Metrics Bar (also acts as quick filters) */}
      <OffersMetricsBar
        activeFilter={quickFilter}
        onSelectFilter={setQuickFilter}
        counts={metricCounts}
      />

      {/* 3. Search & View Controls */}
      <OffersSearchBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        sortOption={sortOption}
        onSortChange={setSortOption}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        activeFiltersCount={activeFiltersCount}
        onOpenFiltersDrawer={() => setIsFiltersDrawerOpen(true)}
      />

      {/* 4. Main Content: Skeletons, Empty State or Table/Grid */}
      {isScanning || isSyncing ? (
        <OffersSkeleton viewMode={viewMode} count={viewMode === 'list' ? 6 : 8} />
      ) : processedOffers.length === 0 ? (
        <OffersEmptyState
          onResetFilters={handleResetFilters}
          onScanOffers={handleScanOffers}
        />
      ) : viewMode === 'list' ? (
        <OffersTable
          offers={processedOffers}
          selectedIds={selectedIds}
          onToggleSelect={handleToggleSelect}
          onToggleSelectAll={handleToggleSelectAll}
          onViewOffer={(offer) => setDetailOffer(offer)}
          onApproveOffer={handleApprove}
          onPublishOffer={handlePublish}
          onScheduleOffer={(offer) => setScheduleOffer(offer)}
          onRejectOffer={(offer) => setRejectOffer(offer)}
          onCopyLink={handleCopyLink}
        />
      ) : (
        <OffersGrid
          offers={processedOffers}
          selectedIds={selectedIds}
          onToggleSelect={handleToggleSelect}
          onViewOffer={(offer) => setDetailOffer(offer)}
          onApproveOffer={handleApprove}
          onPublishOffer={handlePublish}
          onScheduleOffer={(offer) => setScheduleOffer(offer)}
          onRejectOffer={(offer) => setRejectOffer(offer)}
          onCopyLink={handleCopyLink}
        />
      )}

      {/* 5. Pagination */}
      {processedOffers.length > 0 && !isScanning && (
        <OffersPagination
          currentPage={currentPage}
          totalPages={Math.max(1, Math.ceil(offers.length / pageSize))}
          pageSize={pageSize}
          totalItems={offers.length}
          currentCount={processedOffers.length}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      )}

      {/* 6. Contextual Bulk Action Bar */}
      <BulkActionBar
        selectedCount={selectedIds.length}
        onApproveSelected={handleBulkApprove}
        onScheduleSelected={handleBulkSchedule}
        onPublishSelected={handleBulkPublish}
        onRejectSelected={handleBulkReject}
        onClearSelection={() => setSelectedIds([])}
      />

      {/* 7. Slide-over Drawers & Modals */}
      <OfferFiltersDrawer
        isOpen={isFiltersDrawerOpen}
        onClose={() => setIsFiltersDrawerOpen(false)}
        filters={appliedFilters}
        onApplyFilters={setAppliedFilters}
        onResetFilters={handleResetFilters}
      />

      <OfferDetailDrawer
        offer={detailOffer}
        isOpen={!!detailOffer}
        onClose={() => setDetailOffer(null)}
        onApprove={(id) => {
          handleApprove(id);
          if (detailOffer) {
            setDetailOffer({ ...detailOffer, status: 'Aprovada' });
          }
        }}
        onPublish={(offer) => {
          handlePublish(offer);
          setDetailOffer(null);
        }}
        onSchedule={(offer) => {
          setScheduleOffer(offer);
          setDetailOffer(null);
        }}
        onReject={(offer) => {
          setRejectOffer(offer);
          setDetailOffer(null);
        }}
        onCopyLink={handleCopyLink}
      />

      <ScheduleOfferModal
        offer={scheduleOffer}
        isOpen={!!scheduleOffer}
        onClose={() => setScheduleOffer(null)}
        onConfirmSchedule={handleScheduleConfirm}
      />

      <RejectOfferModal
        offer={rejectOffer}
        isOpen={!!rejectOffer}
        onClose={() => setRejectOffer(null)}
        onConfirmReject={handleRejectConfirm}
      />

      {/* 8. Modern Feedback Toasts */}
      <div className="fixed top-20 right-6 z-50 space-y-2 pointer-events-none max-w-sm">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-xl border text-xs font-medium shadow-2xl backdrop-blur-md animate-in slide-in-from-top-2 fade-in duration-200 ${
              toast.type === 'warning'
                ? 'bg-[#F8FAFC]/95 border-rose-500/40 text-rose-700'
                : toast.type === 'info'
                ? 'bg-[#F8FAFC]/95 border-[#2563EB]/40 text-[#2563EB]'
                : 'bg-[#F8FAFC]/95 border-emerald-500/40 text-emerald-700'
            }`}
          >
            <div className="flex items-center gap-2">
              {toast.type === 'warning' ? (
                <Info className="w-4 h-4 text-rose-700 shrink-0" />
              ) : toast.type === 'info' ? (
                <Sparkles className="w-4 h-4 text-[#2563EB] shrink-0" />
              ) : (
                <Check className="w-4 h-4 text-emerald-700 shrink-0" />
              )}
              <span>{toast.message}</span>
            </div>
            <button
              type="button"
              onClick={() =>
                setToasts((prev) => prev.filter((t) => t.id !== toast.id))
              }
              className="text-slate-400 hover:text-[#2563EB] p-0.5 rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
