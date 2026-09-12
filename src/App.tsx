import React, { useState } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';
import { NAV_ITEMS } from './components/layout/navConfig';
import { OffersPage } from './components/offers/OffersPage';
import { AutomationsPage } from './components/automations/AutomationsPage';
import { ProductsPage } from './components/products/ProductsPage';
import { CampaignsPage } from './components/campaigns/CampaignsPage';
import { ChannelsPage } from './components/channels/ChannelsPage';
import { QueuePage } from './components/queue/QueuePage';
import { HistoryPage } from './components/history/HistoryPage';
import { AnalyticsPage } from './components/analytics/AnalyticsPage';
import { SettingsPage } from './components/settings/SettingsPage';
import { PlaceholderPage } from './components/PlaceholderPage';
import { AutoSearchPage } from './components/autoSearch/AutoSearchPage';
import { LinkListPage } from './components/linkList/LinkListPage';
import { MirrorPage } from './components/mirror/MirrorPage';
import { MonitorGroupPage } from './components/monitorGroup/MonitorGroupPage';
import { WhatsAppPage } from './components/whatsApp/WhatsAppPage';
import { KpiCards } from './components/dashboard/KpiCards';
import { PerformanceSection } from './components/dashboard/PerformanceSection';
import { BestDealsTable } from './components/dashboard/BestDealsTable';
import { PublishingQueue } from './components/dashboard/PublishingQueue';
import { EngineStatusCard } from './components/dashboard/EngineStatusCard';
import { AutomationsSummaryCard } from './components/dashboard/AutomationsSummaryCard';
import { DealDetailModal } from './components/dashboard/DealDetailModal';
import { PublishModal } from './components/dashboard/PublishModal';
import { NewCampaignModal } from './components/dashboard/NewCampaignModal';
import { FullQueueModal } from './components/dashboard/FullQueueModal';
import { initialOffers } from './data/mockData';
import { ProductOffer } from './types';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import {
  configureWhatsAppProvider,
  getWhatsAppProvider,
} from './services/whatsApp/provider';
import { createWppConnectProvider } from './services/whatsApp/wppConnectProvider';

if (!getWhatsAppProvider()) {
  configureWhatsAppProvider(createWppConnectProvider());
}

const ACTIVE_VIEW_STORAGE_KEY = 'domnex.activeView';

function readInitialView(): string {
  try {
    const stored = window.localStorage.getItem(ACTIVE_VIEW_STORAGE_KEY);
    if (stored && NAV_ITEMS.some((item) => item.id === stored)) {
      return stored;
    }
  } catch {
    // armazenamento indisponível: usa a view padrão
  }
  return 'Fila de Publicação';
}

export default function App() {
  // A view persistida é lida UMA única vez aqui. Depois disso o estado atual
  // é a fonte da verdade; nenhum effect/polling reidrata a navegação.
  const [activeNav, setActiveNav] = useState(readInitialView);
  const [offers, setOffers] = useState<ProductOffer[]>(initialOffers);
  const [searchQuery, setSearchQuery] = useState('');

  const changeView = (view: string) => {
    try {
      window.localStorage.setItem(ACTIVE_VIEW_STORAGE_KEY, view);
    } catch {
      // armazenamento indisponível: mantém apenas o estado em memória
    }
    setActiveNav(view);
  };

  // Modals state
  const [selectedOfferForDetail, setSelectedOfferForDetail] =
    useState<ProductOffer | null>(null);
  const [selectedOfferForPublish, setSelectedOfferForPublish] =
    useState<ProductOffer | null>(null);
  const [isNewCampaignOpen, setIsNewCampaignOpen] = useState(false);
  const [isFullQueueOpen, setIsFullQueueOpen] = useState(false);

  // Global toast feedback
  const [toast, setToast] = useState<{
    message: string;
    type?: 'success' | 'info';
  } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3200);
  };

  // Actions
  const handleApproveOffer = (offerId: string) => {
    setOffers((prev) =>
      prev.map((o) => (o.id === offerId ? { ...o, status: 'Aprovada' } : o))
    );
    const approved = offers.find((o) => o.id === offerId);
    showToast(
      `Oferta "${approved?.name.substring(0, 26)}..." aprovada com sucesso!`
    );
  };

  const handleRejectOffer = (offerId: string) => {
    setOffers((prev) =>
      prev.map((o) => (o.id === offerId ? { ...o, status: 'Rejeitada' } : o))
    );
    const rejected = offers.find((o) => o.id === offerId);
    showToast(
      `Oferta "${rejected?.name.substring(0, 26)}..." movida para Rejeitadas.`,
      'info'
    );
  };

  const handleConfirmPublish = (
    offer: ProductOffer,
    channel: string,
    time: string
  ) => {
    showToast(`Oferta enviada para "${channel}" (${time})!`);
  };

  const handleSidebarNavigate = (itemId: string) => {
    changeView(itemId);
  };

  const getPageInfo = () => {
    switch (activeNav) {
      case 'Automações':
        return { title: 'Automações', subtitle: 'Escolha como suas ofertas entram e são distribuídas' };
      case 'Busca Automática':
        return { title: 'Busca Automática', subtitle: 'Encontre e selecione automaticamente as melhores ofertas dos marketplaces conectados' };
      case 'Lista de Links':
        return { title: 'Lista de Links', subtitle: 'Organize links de ofertas e prepare sua distribuição' };
      case 'Espelhamento':
        return {
          title: 'Espelhamento',
          subtitle: 'Configure fontes monitoradas para preparar novas ofertas para sua operação',
        };
      case 'Grupo Monitor':
        return {
          title: 'Grupo Monitor',
          subtitle: 'Use um grupo central para distribuir automaticamente suas ofertas aos grupos vinculados',
        };
      case 'Ofertas':
        return { title: 'Ofertas', subtitle: 'Central operacional de afiliados e inteligência de mercado' };
      case 'Produtos':
        return { title: 'Produtos', subtitle: 'Catálogo consolidado e comparador de ofertas multimarketplace' };
      case 'Campanhas':
        return { title: 'Campanhas', subtitle: 'Regras de automação inteligente, Deal Score e canais de distribuição' };
      case 'Agendamentos':
        return { title: 'Agendamentos', subtitle: 'Planejamento e agendamento de publicações' };
      case 'Fila de Publicação':
        return { title: 'Fila de Publicações', subtitle: 'Grade de postagens programadas, cadência anti-flood e pipeline de disparos' };
      case 'Canais e Grupos':
        return { title: 'Canais e Grupos', subtitle: 'Distribuição em WhatsApp e Telegram, instâncias ativas e telemetria' };
      case 'WhatsApp':
        return {
          title: 'WhatsApp',
          subtitle: 'Conecte e gerencie a conta utilizada pelas automações do DOMNEX.',
        };
      case 'Links de Redirecionamento':
        return { title: 'Links de Redirecionamento', subtitle: 'Configuração de links de redirecionamento para afiliados' };
      case 'Textos de Disparo':
        return { title: 'Textos de Disparo', subtitle: 'Templates e textos para mensagens automáticas' };
      case 'Programas de Afiliado':
        return { title: 'Programas de Afiliado', subtitle: 'Gerenciamento de programas e parcerias de afiliados' };
      case 'Cupons':
        return { title: 'Cupons', subtitle: 'Criação e gestão de cupons de desconto' };
      case 'Analytics':
        return { title: 'Analytics & Inteligência de Conversão', subtitle: 'Métricas de comissões, faturamento GMV, engajamento por canal e horários nobres de compra' };
      case 'Divulgações com IA':
        return { title: 'Divulgações com IA', subtitle: 'Geração inteligente de conteúdo para divulgação' };
      case 'Logs de Automação':
        return { title: 'Logs de Automação', subtitle: 'Registro detalhado de execuções e erros de automação' };
      case 'Histórico':
        return { title: 'Histórico de Publicações & Auditoria', subtitle: 'Registro cronológico completo de mensagens enviadas, telemetria de instâncias e conversões atribuídas' };
      case 'Configurações':
        return { title: 'Configurações & Parâmetros do Sistema', subtitle: 'Credenciais de afiliados, gateways de disparo, regras anti-ban e calibração do algoritmo' };
      case 'Perfil':
        return { title: 'Perfil', subtitle: 'Gerenciamento de perfil e preferências da conta' };
      case 'Admin':
        return { title: 'Admin', subtitle: 'Painel administrativo e permissões do sistema' };
      case 'Suporte':
        return { title: 'Suporte', subtitle: 'Central de ajuda e suporte técnico' };
      default:
        return { title: 'Dashboard', subtitle: 'Visão geral da sua operação de afiliados' };
    }
  };

  const pageInfo = getPageInfo();
  const ActivePageIcon = NAV_ITEMS.find((item) => item.id === activeNav)
    ?.icon;

  return (
    <div className="min-h-screen bg-[#0A0F1C] text-[#E6E8EC] flex font-sans antialiased selection:bg-[#1E5EFF]/30 selection:text-white">
      {/* Fixed Sidebar */}
      <Sidebar activeItem={activeNav} onNavigate={handleSidebarNavigate} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        {/* Sticky Topbar */}
        <Topbar
          onOpenNewCampaign={() => {
            if (activeNav !== 'Campanhas') {
              changeView('Campanhas');
            } else {
              setIsNewCampaignOpen(true);
            }
          }}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          pageTitle={pageInfo.title}
          pageSubtitle={pageInfo.subtitle}
          icon={
            ActivePageIcon ? (
              <ActivePageIcon className="w-4 h-4 text-[#00C2FF]" />
            ) : undefined
          }
        />

        {/* Main View Container */}
        <main className="flex-1 p-6 max-w-[1600px] w-full mx-auto">
          {activeNav === 'Histórico' ? (
            <HistoryPage />
          ) : activeNav === 'Analytics' ? (
            <AnalyticsPage />
          ) : activeNav === 'Configurações' ? (
            <SettingsPage />
          ) : activeNav === 'Automações' ? (
            <AutomationsPage onNavigate={handleSidebarNavigate} />
          ) : activeNav === 'Busca Automática' ? (
            <AutoSearchPage />
          ) : activeNav === 'Lista de Links' ? (
            <LinkListPage />
          ) : activeNav === 'Espelhamento' ? (
            <MirrorPage />
          ) : activeNav === 'Grupo Monitor' ? (
            <MonitorGroupPage />
          ) : activeNav === 'Fila de Publicação' ? (
            <QueuePage />
          ) : activeNav === 'Canais e Grupos' ? (
            <ChannelsPage />
          ) : activeNav === 'WhatsApp' ? (
            <WhatsAppPage />
          ) : activeNav === 'Campanhas' ? (
            <CampaignsPage />
          ) : activeNav === 'Produtos' ? (
            <ProductsPage />
          ) : activeNav === 'Ofertas' ? (
            <OffersPage />
          ) : activeNav === 'Dashboard' ? (
            <div className="space-y-6">
              {/* Section 5: Operational KPI Cards */}
              <KpiCards />

              {/* Grid: Performance Chart (Left) + Motor de Ofertas & Fila (Right) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
                {/* Left Col: Performance Chart */}
                <div className="lg:col-span-7 xl:col-span-8 flex flex-col">
                  <PerformanceSection />
                </div>

                {/* Right Col: Motor de Ofertas + Automações + Próximas Publicações */}
                <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-5">
                  <EngineStatusCard />
                  <AutomationsSummaryCard onNavigate={handleSidebarNavigate} />
                  <PublishingQueue
                    onOpenFullQueue={() => changeView('Fila de Publicação')}
                  />
                </div>
              </div>

              {/* Section 8: Melhores Ofertas Encontradas */}
              <BestDealsTable
                offers={offers}
                onViewOffer={(offer) => setSelectedOfferForDetail(offer)}
                onApproveOffer={handleApproveOffer}
                onRejectOffer={handleRejectOffer}
                onPublishOffer={(offer) => setSelectedOfferForPublish(offer)}
                searchFilter={searchQuery}
              />
            </div>
          ) : (
            <PlaceholderPage title={pageInfo.title} />
          )}
        </main>
      </div>

      {/* Floating Action Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0E172C] border border-[#1E3563] text-[#E6E8EC] px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-xs animate-in fade-in slide-in-from-bottom-3 duration-200">
          {toast.type === 'info' ? (
            <AlertCircle className="w-4 h-4 text-[#00C2FF] shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span className="font-medium leading-relaxed">{toast.message}</span>
        </div>
      )}

      {/* Modals */}
      <DealDetailModal
        isOpen={!!selectedOfferForDetail}
        offer={selectedOfferForDetail}
        onClose={() => setSelectedOfferForDetail(null)}
        onApprove={handleApproveOffer}
        onPublish={(offer) => setSelectedOfferForPublish(offer)}
      />

      <PublishModal
        isOpen={!!selectedOfferForPublish}
        offer={selectedOfferForPublish}
        onClose={() => setSelectedOfferForPublish(null)}
        onConfirmPublish={handleConfirmPublish}
      />

      <NewCampaignModal
        isOpen={isNewCampaignOpen}
        onClose={() => setIsNewCampaignOpen(false)}
        onSaveCampaign={(c) =>
          showToast(
            `Campanha "${c.name}" configurada com Deal Score ≥ ${c.minScore}!`
          )
        }
      />

      <FullQueueModal
        isOpen={isFullQueueOpen}
        onClose={() => setIsFullQueueOpen(false)}
      />
    </div>
  );
}
