import React, { useState, useMemo } from 'react';
import {
  Megaphone,
  CheckCircle2,
  Plus,
  RotateCcw,
} from 'lucide-react';
import {
  Campaign,
  CampaignQuickFilter,
  CampaignSortOption,
} from '../../types';
import { initialCampaigns } from '../../data/mockCampaigns';
import { CampaignsHeader } from './CampaignsHeader';
import { CampaignsMetricsBar } from './CampaignsMetricsBar';
import {
  CampaignsSearchBar,
  CampaignViewMode,
} from './CampaignsSearchBar';
import { CampaignCard } from './CampaignCard';
import { CampaignTable } from './CampaignTable';
import { CampaignDetailDrawer } from './CampaignDetailDrawer';
import { CampaignFormModal } from './CampaignFormModal';
import { Button } from '../ui/Button';

export const CampaignsPage: React.FC = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>(initialCampaigns);
  const [quickFilter, setQuickFilter] = useState<CampaignQuickFilter>('Todas');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMarketplace, setSelectedMarketplace] = useState('Todos');
  const [sortOption, setSortOption] = useState<CampaignSortOption>('dispatches');
  const [viewMode, setViewMode] = useState<CampaignViewMode>('grid');

  // Interactive States
  const [selectedCampaignForDetail, setSelectedCampaignForDetail] =
    useState<Campaign | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [campaignToEdit, setCampaignToEdit] = useState<Campaign | null>(null);
  const [isEngineRunning, setIsEngineRunning] = useState(false);

  // Toast feedback
  const [toast, setToast] = useState<{
    text: string;
    type: 'success' | 'info';
  } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Operational Counts
  const counts = useMemo(() => {
    const total = campaigns.length;
    const active = campaigns.filter((c) => c.status === 'Ativa').length;
    const paused = campaigns.filter((c) => c.status === 'Pausada').length;
    const automatic = campaigns.filter(
      (c) => c.executionMode === 'Automático'
    ).length;
    const manual = campaigns.filter(
      (c) => c.executionMode === 'Revisão Manual'
    ).length;
    const highPerformance = campaigns.filter(
      (c) => c.stats.conversionRate >= 5.0
    ).length;

    return { total, active, paused, automatic, manual, highPerformance };
  }, [campaigns]);

  // Consolidated Today Stats
  const todayStats = useMemo(() => {
    return campaigns.reduce(
      (acc, c) => {
        acc.dispatches += c.stats.dispatchesToday;
        acc.clicks += c.stats.clicksToday;
        acc.commission += c.stats.commissionToday;
        return acc;
      },
      { dispatches: 0, clicks: 0, commission: 0 }
    );
  }, [campaigns]);

  // Actions
  const handleToggleStatus = (campaign: Campaign) => {
    const newStatus = campaign.status === 'Ativa' ? 'Pausada' : 'Ativa';
    setCampaigns((prev) =>
      prev.map((c) => (c.id === campaign.id ? { ...c, status: newStatus } : c))
    );

    if (selectedCampaignForDetail?.id === campaign.id) {
      setSelectedCampaignForDetail((prev) =>
        prev ? { ...prev, status: newStatus } : null
      );
    }

    showToast(
      `Campanha "${campaign.name}" ${
        newStatus === 'Ativa' ? 'ativada' : 'pausada'
      } com sucesso!`,
      newStatus === 'Ativa' ? 'success' : 'info'
    );
  };

  const handleRunNow = (campaign: Campaign) => {
    showToast(
      `Varredura executada para "${campaign.name}". Nenhuma nova oferta elegível.`
    );
  };

  const handleRunAllEngines = () => {
    setIsEngineRunning(true);
    setTimeout(() => {
      setIsEngineRunning(false);
      showToast(
        'Varredura multimarketplace concluída. Nenhuma nova oferta disponível.'
      );
    }, 1400);
  };

  const handleOpenNewCampaign = () => {
    setCampaignToEdit(null);
    setIsFormModalOpen(true);
  };

  const handleEditCampaign = (campaign: Campaign) => {
    setCampaignToEdit(campaign);
    setIsFormModalOpen(true);
  };

  const handleSaveCampaign = (campaignData: Partial<Campaign>) => {
    if (campaignToEdit) {
      // Update existing
      setCampaigns((prev) =>
        prev.map((c) =>
          c.id === campaignToEdit.id ? ({ ...c, ...campaignData } as Campaign) : c
        )
      );
      if (selectedCampaignForDetail?.id === campaignToEdit.id) {
        setSelectedCampaignForDetail((prev) =>
          prev ? ({ ...prev, ...campaignData } as Campaign) : null
        );
      }
      showToast(`Campanha "${campaignData.name}" atualizada com sucesso!`);
    } else {
      // Create new
      const newId = `CMP-00${campaigns.length + 1}`;
      const newCampaign: Campaign = {
        id: newId,
        name: campaignData.name || 'Nova Campanha',
        description: campaignData.description || '',
        status: 'Ativa',
        executionMode: campaignData.executionMode || 'Automático',
        automationSources: campaignData.automationSources || ['AUTO_SEARCH'],
        marketplaces: campaignData.marketplaces || ['Shopee'],
        categories: campaignData.categories || ['Todas'],
        minScore: campaignData.minScore || 80,
        minDiscount: campaignData.minDiscount || 20,
        minPrice: campaignData.minPrice,
        maxPrice: campaignData.maxPrice,
        requireFreeShipping: campaignData.requireFreeShipping || false,
        requireCoupon: campaignData.requireCoupon || false,
        channels: campaignData.channels || [],
        frequency: campaignData.frequency || '30m',
        frequencyLabel: campaignData.frequencyLabel || 'A cada 30 minutos',
        activeHours: campaignData.activeHours || { start: '08:00', end: '23:00' },
        copyTemplate: campaignData.copyTemplate || 'Urgência / Fogo',
        stats: {
          dispatchesToday: 0,
          dispatchesTotal: 0,
          clicksToday: 0,
          clicksTotal: 0,
          ordersToday: 0,
          ordersTotal: 0,
          commissionToday: 0,
          commissionTotal: 0,
          conversionRate: 0,
          avgTicket: 0,
        },
        lastExecution: 'Nunca',
        nextExecution: '—',
        createdAt: 'Hoje',
        recentDispatches: [],
      };

      setCampaigns((prev) => [newCampaign, ...prev]);
      showToast(`Nova campanha "${newCampaign.name}" criada e ativada!`);
    }
  };

  // Filter & Sort Logic
  const filteredCampaigns = useMemo(() => {
    return campaigns
      .filter((c) => {
        // Quick filter
        if (quickFilter === 'Ativas' && c.status !== 'Ativa') return false;
        if (quickFilter === 'Pausadas' && c.status !== 'Pausada') return false;
        if (quickFilter === 'Automáticas' && c.executionMode !== 'Automático')
          return false;
        if (quickFilter === 'Revisão Manual' && c.executionMode !== 'Revisão Manual')
          return false;
        if (quickFilter === 'Alta Performance' && c.stats.conversionRate < 5.0)
          return false;

        // Marketplace filter
        if (
          selectedMarketplace !== 'Todos' &&
          !c.marketplaces.includes(selectedMarketplace as any)
        ) {
          return false;
        }

        // Search text
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = c.name.toLowerCase().includes(q);
          const matchDesc = c.description.toLowerCase().includes(q);
          const matchChan = c.channels.some((ch) => ch.toLowerCase().includes(q));
          const matchCat = c.categories.some((cat) => cat.toLowerCase().includes(q));
          const matchMp = c.marketplaces.some((mp) => mp.toLowerCase().includes(q));

          if (!matchName && !matchDesc && !matchChan && !matchCat && !matchMp) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        switch (sortOption) {
          case 'dispatches':
            return b.stats.dispatchesToday - a.stats.dispatchesToday;
          case 'commission':
            return b.stats.commissionToday - a.stats.commissionToday;
          case 'score':
            return b.minScore - a.minScore;
          case 'clicks':
            return b.stats.clicksToday - a.stats.clicksToday;
          case 'name':
            return a.name.localeCompare(b.name);
          case 'recent':
          default:
            return b.id.localeCompare(a.id);
        }
      });
  }, [campaigns, quickFilter, selectedMarketplace, searchQuery, sortOption]);

  const handleResetFilters = () => {
    setQuickFilter('Todas');
    setSearchQuery('');
    setSelectedMarketplace('Todos');
  };

  return (
    <div className="space-y-5">
      {/* Toast Feedback */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 bg-[#EFF6FF] border border-[#2563EB]/50 text-[#172033] px-4 py-3 rounded-xl shadow-2xl animate-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-[#2563EB] shrink-0" />
          <span className="text-xs font-semibold">{toast.text}</span>
        </div>
      )}

      {/* 1. Header */}
      <CampaignsHeader
        activeCount={counts.active}
        totalCount={counts.total}
        isEngineRunning={isEngineRunning}
        onOpenNewCampaign={handleOpenNewCampaign}
        onRunAllEngines={handleRunAllEngines}
      />

      {/* 2. Metrics Bar & Today Consolidated Numbers */}
      <CampaignsMetricsBar
        activeFilter={quickFilter}
        onSelectFilter={setQuickFilter}
        counts={counts}
        todayStats={todayStats}
      />

      {/* 3. Search, Filter & View Mode Bar */}
      <CampaignsSearchBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        sortOption={sortOption}
        onSortChange={setSortOption}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        selectedMarketplace={selectedMarketplace}
        onSelectMarketplace={setSelectedMarketplace}
      />

      {/* 4. Campaigns List (Cards or Table) */}
      {filteredCampaigns.length === 0 ? (
        <div className="bg-[#F1F5F9] border border-[#E2E8F0] rounded-xl p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#F1F5F9] border border-[#BFDBFE] flex items-center justify-center mx-auto text-[#2563EB] mb-4">
            <Megaphone className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-[#172033]">
            Nenhuma campanha encontrada
          </h3>
          <p className="text-xs text-[#64748B] max-w-sm mx-auto mt-1 mb-6">
            Não encontramos campanhas correspondentes aos filtros atuais. Experimente ajustar os termos de busca ou crie uma nova campanha.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetFilters}
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
              className="text-xs border-[#DCE3EC] text-[#172033]"
            >
              Restaurar filtros
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenNewCampaign}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              className="text-xs font-semibold"
            >
              Criar Nova Campanha
            </Button>
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCampaigns.map((c) => (
            <CampaignCard
              key={c.id}
              campaign={c}
              onOpenDetails={(c) => setSelectedCampaignForDetail(c)}
              onToggleStatus={handleToggleStatus}
              onRunNow={handleRunNow}
            />
          ))}
        </div>
      ) : (
        <CampaignTable
          campaigns={filteredCampaigns}
          onOpenDetails={(c) => setSelectedCampaignForDetail(c)}
          onToggleStatus={handleToggleStatus}
          onRunNow={handleRunNow}
        />
      )}

      {/* 5. Campaign Detail Drawer */}
      <CampaignDetailDrawer
        campaign={selectedCampaignForDetail}
        isOpen={!!selectedCampaignForDetail}
        onClose={() => setSelectedCampaignForDetail(null)}
        onToggleStatus={handleToggleStatus}
        onRunNow={handleRunNow}
        onEdit={(c) => {
          setSelectedCampaignForDetail(null);
          handleEditCampaign(c);
        }}
      />

      {/* 6. Campaign Form Modal (Create & Edit) */}
      <CampaignFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setCampaignToEdit(null);
        }}
        onSaveCampaign={handleSaveCampaign}
        initialCampaign={campaignToEdit}
      />
    </div>
  );
};
