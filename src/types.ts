export type DealStatus = 'Aprovada' | 'Em análise' | 'Rejeitada' | 'Publicada' | 'Agendada' | 'Pausada';

// ----------------------------------------------------
// MÓDULO AUTOMAÇÕES — Formas de entrada de ofertas
// ----------------------------------------------------
// AUTOMAÇÃO = COMO a oferta/publicação entrou na operação.
// MARKETPLACE = ONDE comercialmente a oferta existe. São conceitos diferentes.

export type AutomationType =
  | 'AUTO_SEARCH'
  | 'LINK_LIST'
  | 'MIRROR'
  | 'MONITOR_GROUP';

export type AutomationStatus =
  | 'ACTIVE'
  | 'PAUSED'
  | 'REQUIRES_CONFIGURATION'
  | 'ERROR'
  | 'DISCONNECTED';

export type AutomationRuleDestination =
  | 'AVAILABLE'
  | 'REQUIRES_INTEGRATION'
  | 'REQUIRES_CONFIGURATION'
  | 'NOT_SUPPORTED';

export interface AutomationCapabilities {
  detectNewEntries: AutomationRuleDestination;
  identifyProductAndLink: AutomationRuleDestination;
  generateAffiliateLink: AutomationRuleDestination;
  replaceAffiliateLink: AutomationRuleDestination;
  routeToChannels: AutomationRuleDestination;
  sendMessages: AutomationRuleDestination;
}

export interface AutomationSource {
  id: string;
  name: string;
  type: AutomationType;
  description: string;
  active?: boolean;
}

export interface AutomationMetrics {
  entriesToday: number;
  processed: number;
  queued: number;
  published: number;
  invalid: number;
  duplicates: number;
  pending: number;
  lastRun: string;
}

export interface Automation {
  id: string;
  type: AutomationType;
  name: string;
  description: string;
  status: AutomationStatus;
  marketplaces: Marketplace[];
  metrics: AutomationMetrics;
  sources: AutomationSource[];
  capabilities: AutomationCapabilities;
  requiresIntegration?: boolean;
  integrationHint?: string;
}

export const AUTOMATION_TYPE_LABELS: Record<AutomationType, string> = {
  AUTO_SEARCH: 'Busca Automática',
  LINK_LIST: 'Lista de Links',
  MIRROR: 'Espelhamento',
  MONITOR_GROUP: 'Grupo Monitor',
};

export const AUTOMATION_STATUS_LABELS: Record<AutomationStatus, string> = {
  ACTIVE: 'Ativa',
  PAUSED: 'Pausada',
  REQUIRES_CONFIGURATION: 'Requer configuração',
  ERROR: 'Erro',
  DISCONNECTED: 'Desconectada',
};

export interface AutomationActivityItem {
  id: string;
  time: string;
  type: AutomationType;
  title: string;
  description: string;
  tone: 'success' | 'info' | 'warning' | 'danger';
}

export interface AutomationDuplicateConflict {
  id: string;
  productName: string;
  existingSource: AutomationType;
  newSource: AutomationType;
  existingMarketplace: Marketplace;
  newMarketplace: Marketplace;
  existingPrice: number;
  newPrice: number;
  existingScore: number;
  newScore: number;
  detectedAt: string;
}

export type Marketplace =
  | 'Shopee'
  | 'Mercado Livre'
  | 'Amazon'
  | 'AliExpress'
  | 'Magalu'
  | 'TikTok Shop'
  | 'Outros';

export type QueueStatus = 'Agendado' | 'Em fila' | 'Publicando' | 'Publicado' | 'Falha';

export interface ScorePillarBreakdown {
  discount: number;
  maxDiscount: number;
  rating: number;
  maxRating: number;
  sales: number;
  maxSales: number;
  commission: number;
  maxCommission: number;
  price: number;
  maxPrice: number;
  coupon: number;
  maxCoupon: number;
  total: number;
  maxTotal: number;
}

export interface DealScoreDetails {
  total: number;
  label: 'Excelente' | 'Muito boa' | 'Muito Bom' | 'Muito bom' | 'Boa' | 'Bom' | 'Regular';
  priceDropScore: number; // 0 - 100
  ratingScore: number;    // 0 - 100
  salesVelocityScore: number; // 0 - 100
  marginScore: number;    // 0 - 100
  breakdown?: ScorePillarBreakdown;
}

export interface ProductOffer {
  id: string;
  name: string;
  category: string;
  marketplace: Marketplace;
  automationSource?: AutomationType;
  storeName: string;
  externalId?: string;
  imageUrl: string;
  price: number;
  originalPrice: number;
  discountPercentage: number;
  rating: number;
  reviewCount: number;
  salesVolume: string; // e.g., "18 mil"
  salesVolumeNumber?: number; // for numeric filter
  commissionAmount: number;
  commissionPercentage: number;
  score: DealScoreDetails;
  status: DealStatus;
  foundAt: string;
  linkAfiliado: string;
  cupom?: string;
  targetChannel?: string;
  affiliateProgramStatus?: string;
}

export interface KpiMetric {
  id: string;
  title: string;
  value: string;
  subtext: string;
  change?: {
    value: string;
    isPositive: boolean;
    period: string;
  };
  progress?: {
    current: number;
    total: number;
    percentage: number;
  };
}

export interface PerformanceDay {
  day: string;
  date: string;
  cliques: number;
  pedidos: number;
  conversao: number; // percentage
  comissao: number; // R$
}

export type QueuePriority = 'Alta' | 'Normal' | 'Baixa';

export interface QueueItem {
  id: string;
  time: string;
  scheduledDate?: string;
  productName: string;
  productImage: string;
  price: number;
  originalPrice?: number;
  discountPercentage?: number;
  channel: string;
  channelId?: string;
  channelPlatform?: 'WhatsApp' | 'Telegram';
  status: QueueStatus;
  category: string;
  marketplace?: Marketplace;
  automationSource?: AutomationType;
  campaignName?: string;
  campaignId?: string;
  dealScore?: number;
  coupon?: string;
  affiliateUrl?: string;
  customCopy?: string;
  priority?: QueuePriority;
  estimatedInMinutes?: number;
  retries?: number;
  errorMessage?: string;
  publishedAt?: string;
  clicksCount?: number;
}

export type QueueFilterTab =
  | 'Todos'
  | 'Em fila'
  | 'Agendados'
  | 'Publicando'
  | 'Publicados'
  | 'Falhas';

export type QueueSortOption =
  | 'time-asc'
  | 'time-desc'
  | 'score'
  | 'priority'
  | 'discount'
  | 'price';

export type QueueViewMode = 'timeline' | 'table';

export interface EngineStatusData {
  status: 'Ativo' | 'Pausado' | 'Sincronizando';
  lastSync: string;
  productsScannedToday: number;
  nextRunIn: string;
  healthRate: number;
  activeSources: number;
}

// ----------------------------------------------------
// ETAPA D3 — Tipos para Central de Produtos Multimarketplace
// ----------------------------------------------------

export type ProductPerformance = 'Alta' | 'Média' | 'Baixa' | 'Sem dados';

export type ProductStatus =
  | 'Com oferta ativa'
  | 'Sem oferta ativa'
  | 'Já publicado'
  | 'Nunca publicado';

export interface ProductMarketplaceOffer {
  id: string;
  marketplace: Marketplace;
  storeName: string;
  price: number;
  originalPrice?: number;
  discountPercentage?: number;
  commissionAmount?: number | null; // pode ser null quando não fornecido pela API
  commissionPercentage?: number | null;
  rating?: number | null; // ex: 4.9 ou null
  reviewCount?: number | null;
  salesVolume?: string | null; // ex: '18 mil' ou null
  salesVolumeNumber?: number | null;
  score: DealScoreDetails;
  updatedAt: string;
  isBestOpportunity?: boolean;
  bestOpportunityReason?: string;
  affiliateLink: string;
  originalUrl: string;
  inStock: boolean;
  coupon?: string;
}

export interface MappedMarketplaceTitle {
  marketplace: Marketplace;
  title: string;
  externalId?: string;
}

export interface ProductPricePoint {
  date: string;
  price: number;
}

export interface ProductMarketplacePriceHistory {
  marketplace: Marketplace | 'Geral';
  points: ProductPricePoint[];
  minPrice: number;
  currentPrice: number;
  avg30Days: number;
}

export type ProductPriceHistorySeries = ProductMarketplacePriceHistory;

export interface ProductPublicationRecord {
  id: string;
  date: string;
  time: string;
  marketplace: Marketplace;
  channel: string;
  clicks: number;
  orders: number;
  commission: number;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  model: string;
  imageUrl: string;
  marketplaces: Marketplace[];
  activeOffersCount: number;
  bestPrice: {
    amount: number;
    marketplace: Marketplace;
    originalPrice?: number;
    discountPercentage?: number;
  };
  bestScore: {
    score: DealScoreDetails;
    marketplace: Marketplace;
  };
  sales: string; // e.g. "18 mil+" ou "—"
  salesNumber: number; // para ordenação numérica
  publications: number;
  clicks: number;
  orders: number;
  commissionGenerated: number;
  performance: ProductPerformance;
  performanceTrend?: 'up' | 'stable' | 'down';
  updatedAt: string;
  updatedAtTimestamp: number;
  status: ProductStatus;
  aiInsight: string;
  mappedTitles: MappedMarketplaceTitle[];
  offers: ProductMarketplaceOffer[];
  priceHistory: ProductMarketplacePriceHistory[];
  publicationHistory: ProductPublicationRecord[];
}

export type ProductQuickFilter =
  | 'Produtos'
  | 'Com ofertas ativas'
  | 'Multimarketplace'
  | 'Publicados'
  | 'Alta performance'
  | 'Sem oferta ativa';

export type ProductSortOption =
  | 'best_opportunity'
  | 'score'
  | 'price_asc'
  | 'offers_count'
  | 'sales'
  | 'publications'
  | 'commission'
  | 'recent';

export interface ProductFilterState {
  category: string;
  marketplaces: Marketplace[];
  minOffers: number; // 0 (Qualquer), 1, 2, 3, 5
  minScore: number; // 0 - 100
  minPrice: string;
  maxPrice: string;
  status: string; // 'Todos', 'Com oferta ativa', 'Sem oferta ativa', 'Já publicado', 'Nunca publicado'
  performance: string; // 'Todas', 'Alta', 'Média', 'Baixa', 'Sem dados'
}

// ----------------------------------------------------
// MÓDULO CAMPANHAS — Automação e Distribuição
// ----------------------------------------------------

export type CampaignStatus = 'Ativa' | 'Pausada' | 'Rascunho';
export type CampaignExecutionMode = 'Automático' | 'Revisão Manual';
export type CampaignCopyTemplate =
  | 'Padrão com Emojis'
  | 'Minimalista Direto'
  | 'Urgência / Fogo'
  | 'Cupom em Destaque';

export interface CampaignDispatchedOffer {
  id: string;
  time: string;
  productName: string;
  productImage: string;
  marketplace: Marketplace;
  price: number;
  originalPrice: number;
  discountPercentage: number;
  channel: string;
  clicks: number;
  orders: number;
  commission: number;
  score: number;
}

export interface Campaign {
  id: string;
  name: string;
  description: string;
  status: CampaignStatus;
  executionMode: CampaignExecutionMode;
  automationSources: AutomationType[];
  marketplaces: Marketplace[];
  categories: string[];
  minScore: number;
  minDiscount: number;
  minPrice?: number;
  maxPrice?: number;
  requireFreeShipping: boolean;
  requireCoupon: boolean;
  channels: string[];
  frequency: string; // ex: '20m', '30m', '45m', '60m'
  frequencyLabel: string;
  activeHours: {
    start: string; // ex: '08:00'
    end: string;   // ex: '23:00'
  };
  copyTemplate: CampaignCopyTemplate;
  stats: {
    dispatchesToday: number;
    dispatchesTotal: number;
    clicksToday: number;
    clicksTotal: number;
    ordersToday: number;
    ordersTotal: number;
    commissionToday: number;
    commissionTotal: number;
    conversionRate: number; // %
    avgTicket: number;
  };
  lastExecution: string;
  nextExecution: string;
  createdAt: string;
  recentDispatches: CampaignDispatchedOffer[];
}

export type CampaignQuickFilter =
  | 'Todas'
  | 'Ativas'
  | 'Pausadas'
  | 'Automáticas'
  | 'Revisão Manual'
  | 'Alta Performance';

export type CampaignSortOption =
  | 'dispatches'
  | 'commission'
  | 'score'
  | 'recent'
  | 'name'
  | 'clicks';

// ----------------------------------------------------
// MÓDULO CANAIS E GRUPOS — Distribuição e Disparo
// ----------------------------------------------------

export type ChannelPlatform = 'WhatsApp' | 'Telegram';

export type ChannelType =
  | 'Grupo WhatsApp'
  | 'Canal WhatsApp'
  | 'Canal Telegram'
  | 'Supergrupo Telegram';

export type ChannelStatus =
  | 'Conectado'
  | 'Atenção'
  | 'Desconectado'
  | 'Pausado';

export interface ChannelRecentMessage {
  id: string;
  time: string;
  text: string;
  productName?: string;
  productImage?: string;
  marketplace?: Marketplace;
  status: 'Entregue' | 'Falha' | 'Pendente';
  clicks: number;
}

export interface DistributionChannel {
  id: string;
  name: string;
  platform: ChannelPlatform;
  type: ChannelType;
  status: ChannelStatus;
  membersCount: number;
  description: string;
  identifier: string; // Ex: 1203630294182910@g.us ou @radar_ofertas_vip
  instanceName: string; // Ex: Evolution Node BR #01 ou Bot @DomnexDealsBot
  instanceStatus: 'Online' | 'Offline' | 'Aguardando QR';
  instanceBattery?: number;
  linkedCampaigns: string[];
  antiFloodDelay: number; // segundos
  stats: {
    messagesToday: number;
    messagesTotal: number;
    deliveryRate: number; // %
    clicksToday: number;
    clicksTotal: number;
    lastMessageTime: string;
  };
  recentMessages: ChannelRecentMessage[];
  createdAt: string;
  avatarUrl?: string;
}

export type ChannelQuickFilter =
  | 'Todos'
  | 'WhatsApp'
  | 'Telegram'
  | 'Conectados'
  | 'Atenção'
  | 'Alta Audiência';

export type ChannelSortOption =
  | 'audience'
  | 'dispatches'
  | 'delivery'
  | 'name'
  | 'recent';

// ----------------------------------------------------
// MÓDULO HISTÓRICO — Registros de Disparos e Auditoria
// ----------------------------------------------------

export type HistoryStatus = 'Entregue' | 'Falha' | 'Re-enviado';

export interface HistoryDispatchItem {
  id: string;
  dispatchedAt: string;
  dateStr: string; // YYYY-MM-DD
  timeStr: string; // HH:MM
  timestamp: number;
  productName: string;
  productImage: string;
  marketplace: Marketplace;
  category: string;
  price: number;
  originalPrice?: number;
  discountPercentage?: number;
  channel: string;
  channelId: string;
  channelPlatform: 'WhatsApp' | 'Telegram';
  campaignName?: string;
  campaignId?: string;
  status: HistoryStatus;
  errorMessage?: string;
  clicks: number;
  orders: number;
  commission: number;
  affiliateUrl: string;
  copyText: string;
  dealScore: number;
  coupon?: string;
  retryCount?: number;
  instanceName?: string;
}

export type HistoryFilterPeriod = 'todos' | 'hoje' | 'ontem' | '7d' | '30d';

// ----------------------------------------------------
// MÓDULO ANALYTICS — Inteligência de Performance
// ----------------------------------------------------

export type AnalyticsPeriod = '7d' | '15d' | '30d' | 'mes_atual' | 'trimestre';

export interface AnalyticsTimelinePoint {
  date: string;
  label: string;
  cliques: number;
  pedidos: number;
  comissao: number;
  receitaTotal: number;
}

export interface MarketplacePerformanceItem {
  marketplace: Marketplace;
  revenue: number;
  commission: number;
  orders: number;
  clicks: number;
  conversionRate: number;
  sharePercentage: number;
  topCategory: string;
}

export interface ChannelAnalyticsItem {
  id: string;
  name: string;
  platform: 'WhatsApp' | 'Telegram';
  membersCount: number;
  messagesSent: number;
  clicks: number;
  orders: number;
  commission: number;
  ctr: number;
}

export interface HourlyHeatmapPoint {
  hour: number;
  label: string;
  clicks: number;
  orders: number;
  intensity: number; // 0 to 100
  isPeak: boolean;
}

export interface TopProductAnalytics {
  id: string;
  name: string;
  image: string;
  marketplace: Marketplace;
  category: string;
  price: number;
  clicks: number;
  orders: number;
  commission: number;
  conversionRate: number;
}

export interface TopCampaignAnalytics {
  id: string;
  name: string;
  dispatches: number;
  clicks: number;
  orders: number;
  commission: number;
  conversionRate: number;
  scoreAvg: number;
}

// ----------------------------------------------------
// MÓDULO CONFIGURAÇÕES — Ajustes do Sistema
// ----------------------------------------------------

export interface MarketplaceCredentials {
  amazon: {
    associateTag: string;
    accessKeyId: string;
    secretAccessKey: string;
    enabled: boolean;
  };
  shopee: {
    appId: string;
    secretKey: string;
    affiliateDomain: string;
    enabled: boolean;
  };
  mercadoLivre: {
    appId: string;
    clientSecret: string;
    redirectUri: string;
    enabled: boolean;
  };
  aliExpress: {
    appKey: string;
    secretKey: string;
    trackingId: string;
    enabled: boolean;
  };
  magalu: {
    affiliateCode: string;
    enabled: boolean;
  };
  tiktokShop: {
    partnerId: string;
    appSecret: string;
    enabled: boolean;
  };
  globalUtmSource: string;
  globalUtmMedium: string;
  globalUtmCampaign: string;
}

export interface GatewaySettings {
  provider: 'Evolution API' | 'Z-API' | 'Baileys' | 'Webhooks';
  endpointUrl: string;
  globalApiKey: string;
  telegramBotToken: string;
  telegramBotUsername: string;
  webhookDeliveryUrl: string;
  requestTimeoutSeconds: number;
}

export interface AntiBanSettings {
  minIntervalMinutes: number;
  randomJitterMinutes: number;
  maxDailyMessagesPerChannel: number;
  quietHoursEnabled: boolean;
  quietHoursStart: string; // HH:MM
  quietHoursEnd: string; // HH:MM
  simulateTypingSeconds: number;
  pauseOnMultipleFails: boolean;
  maxConsecutiveFails: number;
}

export interface ScoringWeightsSettings {
  minScoreAutoApprove: number;
  minDiscountPercentage: number;
  weightDiscount: number;
  weightRating: number;
  weightSalesVelocity: number;
  weightPriceHistory: number;
  weightCommission: number;
  rejectOutOfStock: boolean;
  requireFreeShippingMinPrice?: number;
}

export interface CopywritingSettings {
  defaultCopyStyle: 'Padrão com Emojis' | 'Minimalista Direto' | 'Urgência / Fogo' | 'Cupom em Destaque';
  includePriceComparison: boolean;
  includeInstallments: boolean;
  includeRatingStars: boolean;
  includeCouponCallout: boolean;
  includeAffiliateDisclaimer: boolean;
  disclaimerText: string;
  urlShortener: 'Link Direto' | 'bit.ly' | 'dub.co' | 'domnex.link';
  shortenerApiKey?: string;
}

export interface SystemGeneralSettings {
  workspaceName: string;
  adminEmail: string;
  timezone: string;
  currency: string;
  autoCleanHistoryDays: number;
  enableSoundAlerts: boolean;
  enableDesktopNotifications: boolean;
}


