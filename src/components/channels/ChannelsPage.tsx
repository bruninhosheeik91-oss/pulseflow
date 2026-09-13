import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, FilterX, Loader2, X, Zap } from 'lucide-react';
import {
  DistributionChannel,
  ChannelQuickFilter,
  ChannelSortOption,
} from '../../types';
import { getGroupDisplayName, WhatsAppAccount, WhatsAppGroup } from '../../types/whatsApp';
import { getWhatsAppProvider } from '../../services/whatsApp/provider';
import { ChannelsHeader } from './ChannelsHeader';
import { ChannelsMetricsBar } from './ChannelsMetricsBar';
import {
  ChannelsSearchBar,
  ChannelViewMode,
} from './ChannelsSearchBar';
import { ChannelCard } from './ChannelCard';
import { ChannelTable } from './ChannelTable';
import { ChannelDetailDrawer } from './ChannelDetailDrawer';

function accountStatusToChannelStatus(
  account: WhatsAppAccount
): DistributionChannel['status'] {
  if (account.status === 'connected') return 'Conectado';
  if (account.status === 'error' || account.status === 'reconnecting') return 'Atenção';
  return 'Desconectado';
}

function accountStatusToInstanceStatus(
  account: WhatsAppAccount
): DistributionChannel['instanceStatus'] {
  if (account.status === 'connected') return 'Online';
  if (account.status === 'awaiting_qr') return 'Aguardando QR';
  return 'Offline';
}

function channelFromRealGroup(
  account: WhatsAppAccount,
  group: WhatsAppGroup
): DistributionChannel {
  return {
    id: `${account.sessionId}|${group.id}`,
    name: getGroupDisplayName(group),
    platform: 'WhatsApp',
    type: 'Grupo WhatsApp',
    status: accountStatusToChannelStatus(account),
    membersCount: group.participantCount ?? 0,
    description: `Grupo sincronizado da conta ${account.name || account.sessionId}.`,
    identifier: group.id,
    instanceName: account.name || account.sessionId,
    instanceStatus: accountStatusToInstanceStatus(account),
    instanceBattery: 0,
    linkedCampaigns: [],
    antiFloodDelay: 30,
    stats: {
      messagesToday: 0,
      messagesTotal: 0,
      deliveryRate: 0,
      clicksToday: 0,
      clicksTotal: 0,
      lastMessageTime: '—',
    },
    recentMessages: [],
    createdAt: account.lastSyncAt
      ? new Date(account.lastSyncAt).toLocaleString('pt-BR')
      : 'Sincronizado agora',
  };
}

function sessionIdFromChannel(channel: DistributionChannel): string | undefined {
  const separator = channel.id.indexOf('|');
  return separator > 0 ? channel.id.slice(0, separator) : undefined;
}

export const ChannelsPage: React.FC = () => {
  const [channels, setChannels] = useState<DistributionChannel[]>([]);
  const [activeFilter, setActiveFilter] = useState<ChannelQuickFilter>('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('Todos');
  const [selectedStatus, setSelectedStatus] = useState('Todos');
  const [sortOption, setSortOption] = useState<ChannelSortOption>('audience');
  const [viewMode, setViewMode] = useState<ChannelViewMode>('grid');
  const [selectedChannelForDrawer, setSelectedChannelForDrawer] =
    useState<DistributionChannel | null>(null);
  const [isTestingConnections, setIsTestingConnections] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: 'success' | 'info';
  } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' = 'success') => {
    setToastMessage({ text, type });
    window.setTimeout(() => setToastMessage(null), 4000);
  };

  const loadRealChannels = useCallback(async (): Promise<{
    accounts: number;
    connectedAccounts: number;
    groups: number;
  }> => {
    const provider = getWhatsAppProvider();
    if (!provider) {
      throw new Error('Provedor WhatsApp não configurado.');
    }

    const accounts = await provider.listAccounts();
    const connectedAccounts = accounts.filter(
      (account) => account.status === 'connected'
    );

    const results = await Promise.all(
      connectedAccounts.map(async (account) => {
        try {
          const groups = await provider.getGroupsForSession(account.sessionId);
          return groups.map((group) => channelFromRealGroup(account, group));
        } catch {
          return [] as DistributionChannel[];
        }
      })
    );

    const realChannels = results.flat();
    setChannels(realChannels);
    setLoadError(null);

    setSelectedChannelForDrawer((current) => {
      if (!current) return null;
      return realChannels.find((channel) => channel.id === current.id) ?? null;
    });

    return {
      accounts: accounts.length,
      connectedAccounts: connectedAccounts.length,
      groups: realChannels.length,
    };
  }, []);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    loadRealChannels()
      .catch((error) => {
        if (!active) return;
        setLoadError(
          error instanceof Error
            ? error.message
            : 'Falha ao carregar grupos reais do WhatsApp.'
        );
        setChannels([]);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [loadRealChannels]);

  const handleTestConnections = async () => {
    if (isTestingConnections) return;
    setIsTestingConnections(true);
    try {
      const result = await loadRealChannels();
      showToast(
        `Conexão real validada: ${result.connectedAccounts}/${result.accounts} conta(s) conectada(s) e ${result.groups} grupo(s) sincronizado(s).`,
        result.connectedAccounts > 0 ? 'success' : 'info'
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Falha ao testar conexões.';
      setLoadError(message);
      showToast(message, 'info');
    } finally {
      setIsTestingConnections(false);
    }
  };

  const handleSyncChannels = async () => {
    await handleTestConnections();
  };

  const handleToggleStatus = (channel: DistributionChannel) => {
    showToast(
      `O status de "${channel.name}" vem da sessão real do WhatsApp. Conecte ou desconecte a conta pelo módulo WhatsApp.`,
      'info'
    );
  };

  const handleSendTestMessage = async (channel: DistributionChannel) => {
    const provider = getWhatsAppProvider();
    if (!provider) {
      showToast('Provedor WhatsApp não configurado.', 'info');
      return;
    }
    if (channel.status !== 'Conectado') {
      showToast(`O canal "${channel.name}" não está conectado.`, 'info');
      return;
    }

    try {
      await provider.sendMessage(
        channel.identifier,
        '✅ Teste de conexão PULSE FLOW concluído com sucesso.',
        sessionIdFromChannel(channel)
      );
      showToast(`Mensagem real enviada para "${channel.name}".`, 'success');
    } catch (error) {
      showToast(
        error instanceof Error
          ? error.message
          : `Falha ao enviar mensagem para "${channel.name}".`,
        'info'
      );
    }
  };

  const filteredChannels = useMemo(() => {
    return channels
      .filter((ch) => {
        if (activeFilter === 'WhatsApp' && ch.platform !== 'WhatsApp') return false;
        if (activeFilter === 'Telegram' && ch.platform !== 'Telegram') return false;
        if (activeFilter === 'Conectados' && ch.status !== 'Conectado') return false;
        if (activeFilter === 'Atenção' && ch.status !== 'Atenção') return false;
        if (activeFilter === 'Alta Audiência' && ch.membersCount < 5000) return false;
        if (selectedPlatform !== 'Todos' && ch.platform !== selectedPlatform) return false;
        if (selectedStatus !== 'Todos' && ch.status !== selectedStatus) return false;

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
        if (sortOption === 'audience') return b.membersCount - a.membersCount;
        if (sortOption === 'dispatches') {
          return b.stats.messagesToday - a.stats.messagesToday;
        }
        if (sortOption === 'delivery') return b.stats.deliveryRate - a.stats.deliveryRate;
        if (sortOption === 'recent') return b.id.localeCompare(a.id);
        if (sortOption === 'name') return a.name.localeCompare(b.name);
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

  const summaryStats = useMemo(() => {
    const totalAudience = channels.reduce((acc, c) => acc + c.membersCount, 0);
    const messagesToday = channels.reduce(
      (acc, c) => acc + c.stats.messagesToday,
      0
    );
    const clicksToday = channels.reduce((acc, c) => acc + c.stats.clicksToday, 0);
    const avgDeliveryRate =
      channels.length > 0
        ? channels.reduce((acc, c) => acc + c.stats.deliveryRate, 0) /
          channels.length
        : 0;

    return { totalAudience, messagesToday, clicksToday, avgDeliveryRate };
  }, [channels]);

  return (
    <div className="space-y-5">
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#FFFFFF] border border-[#BFDBFE] text-[#172033] px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-xs animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="flex items-center gap-2">
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            ) : (
              <Zap className="w-4 h-4 text-[#2563EB] shrink-0" />
            )}
            <span className="font-medium leading-relaxed">{toastMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-[#64748B] hover:text-[#2563EB] cursor-pointer ml-4 shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <ChannelsHeader
        totalCount={channels.length}
        onlineCount={counts.connected}
        totalAudience={summaryStats.totalAudience}
        isTestingConnections={isTestingConnections}
        onTestConnections={handleTestConnections}
        onOpenConnectModal={handleSyncChannels}
      />

      <ChannelsMetricsBar
        activeFilter={activeFilter}
        onSelectFilter={setActiveFilter}
        counts={counts}
        summaryStats={summaryStats}
      />

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

      {isLoading ? (
        <div className="p-10 text-center bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl">
          <Loader2 className="w-8 h-8 text-[#2563EB] mx-auto animate-spin" />
          <p className="text-xs text-[#64748B] mt-3">Carregando grupos reais do WhatsApp...</p>
        </div>
      ) : loadError ? (
        <div className="p-8 text-center bg-[#FFF7ED] border border-[#FED7AA] rounded-xl space-y-3">
          <h3 className="text-sm font-bold text-[#9A3412]">Falha ao carregar canais reais</h3>
          <p className="text-xs text-[#7C2D12] max-w-xl mx-auto">{loadError}</p>
          <button
            type="button"
            onClick={handleSyncChannels}
            className="text-xs text-[#2563EB] font-semibold hover:underline cursor-pointer"
          >
            Tentar sincronizar novamente
          </button>
        </div>
      ) : filteredChannels.length === 0 ? (
        <div className="p-8 text-center bg-[#F1F5F9] border border-[#E2E8F0] rounded-xl space-y-3">
          <FilterX className="w-10 h-10 text-[#64748B] mx-auto" />
          <h3 className="text-sm font-bold text-[#172033]">
            Nenhum grupo real encontrado
          </h3>
          <p className="text-xs text-[#64748B] max-w-lg mx-auto">
            Conecte uma conta no módulo WhatsApp e use “Sincronizar Grupos”. Se houver filtros ativos, limpe-os para visualizar todos os grupos sincronizados.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSelectedPlatform('Todos');
              setSelectedStatus('Todos');
              setActiveFilter('Todos');
            }}
            className="text-xs text-[#2563EB] font-semibold hover:underline cursor-pointer"
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
              onOpenDetails={setSelectedChannelForDrawer}
              onToggleStatus={handleToggleStatus}
              onSendTestMessage={handleSendTestMessage}
            />
          ))}
        </div>
      ) : (
        <ChannelTable
          channels={filteredChannels}
          onOpenDetails={setSelectedChannelForDrawer}
          onToggleStatus={handleToggleStatus}
          onSendTestMessage={handleSendTestMessage}
        />
      )}

      <ChannelDetailDrawer
        channel={selectedChannelForDrawer}
        isOpen={!!selectedChannelForDrawer}
        onClose={() => setSelectedChannelForDrawer(null)}
        onToggleStatus={handleToggleStatus}
        onSendTestMessage={handleSendTestMessage}
        onEdit={(channel) =>
          showToast(
            `"${channel.name}" é um grupo real sincronizado do WhatsApp; nome e participantes são gerenciados no próprio WhatsApp.`,
            'info'
          )
        }
      />
    </div>
  );
};
