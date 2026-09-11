import React, { useState, useMemo } from 'react';
import {
  Radio,
  CheckCircle2,
  AlertTriangle,
  Zap,
  FilterX,
  X,
} from 'lucide-react';
import {
  DistributionChannel,
  ChannelQuickFilter,
  ChannelSortOption,
} from '../../types';
import { initialChannels } from '../../data/mockChannels';
import { ChannelsHeader } from './ChannelsHeader';
import { ChannelsMetricsBar } from './ChannelsMetricsBar';
import {
  ChannelsSearchBar,
  ChannelViewMode,
} from './ChannelsSearchBar';
import { ChannelCard } from './ChannelCard';
import { ChannelTable } from './ChannelTable';
import { ChannelDetailDrawer } from './ChannelDetailDrawer';
import { ChannelFormModal } from './ChannelFormModal';

export const ChannelsPage: React.FC = () => {
  const [channels, setChannels] = useState<DistributionChannel[]>(initialChannels);
  const [activeFilter, setActiveFilter] = useState<ChannelQuickFilter>('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('Todos');
  const [selectedStatus, setSelectedStatus] = useState('Todos');
  const [sortOption, setSortOption] = useState<ChannelSortOption>('audience');
  const [viewMode, setViewMode] = useState<ChannelViewMode>('grid');

  // Modal and Drawer states
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [selectedChannelForDrawer, setSelectedChannelForDrawer] =
    useState<DistributionChannel | null>(null);
  const [editingChannel, setEditingChannel] =
    useState<DistributionChannel | null>(null);

  // Status & Test states
  const [isTestingConnections, setIsTestingConnections] = useState(false);
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: 'success' | 'info';
  } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Test Connections action
  const handleTestConnections = () => {
    setIsTestingConnections(true);
    setTimeout(() => {
      setIsTestingConnections(false);
      showToast(
        'Diagnóstico concluído. Nenhuma instância conectada no momento.',
        'info'
      );
    }, 1200);
  };

  // Toggle status (Pausado / Conectado)
  const handleToggleStatus = (channel: DistributionChannel) => {
    setChannels((prev) =>
      prev.map((c) => {
        if (c.id === channel.id) {
          const nextStatus = c.status === 'Pausado' ? 'Conectado' : 'Pausado';
          return { ...c, status: nextStatus };
        }
        return c;
      })
    );

    if (selectedChannelForDrawer?.id === channel.id) {
      setSelectedChannelForDrawer((prev) =>
        prev
          ? {
              ...prev,
              status: prev.status === 'Pausado' ? 'Conectado' : 'Pausado',
            }
          : null
      );
    }

    const actionText =
      channel.status === 'Pausado'
        ? `Canal "${channel.name}" ativado com sucesso!`
        : `Canal "${channel.name}" pausado. Os envios automáticos foram suspensos.`;
    showToast(actionText, 'info');
  };

  // Send Test Message
  const handleSendTestMessage = (channel: DistributionChannel) => {
    showToast(
      `⚡ Mensagem de teste enviada com sucesso para "${channel.name}" via ${channel.instanceName}!`,
      'success'
    );
  };

  // Save Channel (create or edit)
  const handleSaveChannel = (channelData: Partial<DistributionChannel>) => {
    if (editingChannel) {
      // Edit
      setChannels((prev) =>
        prev.map((c) =>
          c.id === editingChannel.id
            ? ({ ...c, ...channelData } as DistributionChannel)
            : c
        )
      );
      showToast(`Canal "${channelData.name}" atualizado com sucesso!`);
      setEditingChannel(null);
    } else {
      // Create
      const newChannel: DistributionChannel = {
        id: `CH-00${channels.length + 1}`,
        name: channelData.name || 'Novo Canal',
        platform: channelData.platform || 'WhatsApp',
        type: channelData.type || 'Grupo WhatsApp',
        status: 'Pausado',
        membersCount: channelData.membersCount || 0,
        description: channelData.description || '',
        identifier: channelData.identifier || '',
        instanceName: channelData.instanceName || '',
        instanceStatus: 'Offline',
        instanceBattery: 0,
        linkedCampaigns: channelData.linkedCampaigns || [],
        antiFloodDelay: channelData.antiFloodDelay || 30,
        stats: {
          messagesToday: 0,
          messagesTotal: 0,
          deliveryRate: 0,
          clicksToday: 0,
          clicksTotal: 0,
          lastMessageTime: '—',
        },
        recentMessages: [],
        createdAt: 'Hoje',
      };
      setChannels((prev) => [newChannel, ...prev]);
      showToast(`Novo canal "${newChannel.name}" conectado e pronto para envio!`);
    }
  };

  // Filter and Sort calculation
  const filteredChannels = useMemo(() => {
    return channels
      .filter((ch) => {
        // Quick filter
        if (activeFilter === 'WhatsApp' && ch.platform !== 'WhatsApp') return false;
        if (activeFilter === 'Telegram' && ch.platform !== 'Telegram') return false;
        if (activeFilter === 'Conectados' && ch.status !== 'Conectado') return false;
        if (activeFilter === 'Atenção' && ch.status !== 'Atenção') return false;
        if (activeFilter === 'Alta Audiência' && ch.membersCount < 5000) return false;

        // Platform dropdown
        if (selectedPlatform !== 'Todos' && ch.platform !== selectedPlatform) {
          return false;
        }

        // Status dropdown
        if (selectedStatus !== 'Todos' && ch.status !== selectedStatus) {
          return false;
        }

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = ch.name.toLowerCase().includes(q);
          const matchId = ch.identifier.toLowerCase().includes(q);
          const matchInst = ch.instanceName.toLowerCase().includes(q);
          const matchCamp = ch.linkedCampaigns.some((c) =>
            c.toLowerCase().includes(q)
          );
          const matchDesc = ch.description.toLowerCase().includes(q);
          if (!matchName && !matchId && !matchInst && !matchCamp && !matchDesc) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortOption === 'audience') {
          return b.membersCount - a.membersCount;
        }
        if (sortOption === 'dispatches') {
          return b.stats.messagesToday - a.stats.messagesToday;
        }
        if (sortOption === 'delivery') {
          return b.stats.deliveryRate - a.stats.deliveryRate;
        }
        if (sortOption === 'recent') {
          return b.id.localeCompare(a.id);
        }
        if (sortOption === 'name') {
          return a.name.localeCompare(b.name);
        }
        return 0;
      });
  }, [
    channels,
    activeFilter,
    selectedPlatform,
    selectedStatus,
    searchQuery,
    sortOption,
  ]);

  // Summary counts
  const counts = useMemo(() => {
    return {
      total: channels.length,
      whatsapp: channels.filter((c) => c.platform === 'WhatsApp').length,
      telegram: channels.filter((c) => c.platform === 'Telegram').length,
      connected: channels.filter((c) => c.status === 'Conectado').length,
      attention: channels.filter((c) => c.status === 'Atenção').length,
      highAudience: channels.filter((c) => c.membersCount >= 5000).length,
    };
  }, [channels]);

  // Consolidated statistics
  const summaryStats = useMemo(() => {
    const totalAudience = channels.reduce((acc, c) => acc + c.membersCount, 0);
    const messagesToday = channels.reduce(
      (acc, c) => acc + c.stats.messagesToday,
      0
    );
    const clicksToday = channels.reduce(
      (acc, c) => acc + c.stats.clicksToday,
      0
    );
    const avgDeliveryRate =
      channels.length > 0
        ? channels.reduce((acc, c) => acc + c.stats.deliveryRate, 0) /
          channels.length
        : 0;

    return {
      totalAudience,
      messagesToday,
      clicksToday,
      avgDeliveryRate,
    };
  }, [channels]);

  return (
    <div className="space-y-5">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0E172C] border border-[#1E3563] text-[#E6E8EC] px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-xs animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="flex items-center gap-2">
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <Zap className="w-4 h-4 text-[#00C2FF] shrink-0" />
            )}
            <span className="font-medium leading-relaxed">{toastMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-[#8E9BAE] hover:text-white cursor-pointer ml-4 shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <ChannelsHeader
        totalCount={channels.length}
        onlineCount={counts.connected}
        totalAudience={summaryStats.totalAudience}
        isTestingConnections={isTestingConnections}
        onTestConnections={handleTestConnections}
        onOpenConnectModal={() => {
          setEditingChannel(null);
          setIsConnectModalOpen(true);
        }}
      />

      {/* Quick Filters & Consolidated Metrics Strip */}
      <ChannelsMetricsBar
        activeFilter={activeFilter}
        onSelectFilter={(filter) => setActiveFilter(filter)}
        counts={counts}
        summaryStats={summaryStats}
      />

      {/* Search & Control Bar */}
      <ChannelsSearchBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedPlatform={selectedPlatform}
        onSelectPlatform={setSelectedPlatform}
        selectedStatus={selectedStatus}
        onSelectStatus={setSelectedStatus}
        sortOption={sortOption}
        onSortChange={setSortOption}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {/* Channels List / Grid View */}
      {filteredChannels.length === 0 ? (
        <div className="p-8 text-center bg-[#0B1324] border border-[#162340] rounded-xl space-y-3">
          <FilterX className="w-10 h-10 text-[#64748B] mx-auto" />
          <h3 className="text-sm font-bold text-[#E6E8EC]">
            Nenhum canal encontrado com os filtros atuais
          </h3>
          <p className="text-xs text-[#8E9BAE] max-w-sm mx-auto">
            Tente remover a busca por texto ou redefinir a plataforma selecionada para visualizar os canais cadastrados.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSelectedPlatform('Todos');
              setSelectedStatus('Todos');
              setActiveFilter('Todos');
            }}
            className="text-xs text-[#00C2FF] font-semibold hover:underline cursor-pointer"
          >
            Limpar todos os filtros
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredChannels.map((channel) => (
            <ChannelCard
              key={channel.id}
              channel={channel}
              onOpenDetails={(ch) => setSelectedChannelForDrawer(ch)}
              onToggleStatus={handleToggleStatus}
              onSendTestMessage={handleSendTestMessage}
            />
          ))}
        </div>
      ) : (
        <ChannelTable
          channels={filteredChannels}
          onOpenDetails={(ch) => setSelectedChannelForDrawer(ch)}
          onToggleStatus={handleToggleStatus}
          onSendTestMessage={handleSendTestMessage}
        />
      )}

      {/* Detail Drawer */}
      <ChannelDetailDrawer
        channel={selectedChannelForDrawer}
        isOpen={!!selectedChannelForDrawer}
        onClose={() => setSelectedChannelForDrawer(null)}
        onToggleStatus={handleToggleStatus}
        onSendTestMessage={handleSendTestMessage}
        onEdit={(ch) => {
          setSelectedChannelForDrawer(null);
          setEditingChannel(ch);
          setIsConnectModalOpen(true);
        }}
      />

      {/* Connect / Edit Modal */}
      <ChannelFormModal
        isOpen={isConnectModalOpen}
        onClose={() => {
          setIsConnectModalOpen(false);
          setEditingChannel(null);
        }}
        onSaveChannel={handleSaveChannel}
        initialChannel={editingChannel}
      />
    </div>
  );
};
