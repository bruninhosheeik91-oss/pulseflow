import {
  MarketplaceCredentials,
  GatewaySettings,
  AntiBanSettings,
  ScoringWeightsSettings,
  CopywritingSettings,
  SystemGeneralSettings,
} from '../types';

export const initialMarketplaceSettings: MarketplaceCredentials = {
  amazon: {
    associateTag: '',
    accessKeyId: '',
    secretAccessKey: '',
    enabled: false,
  },
  shopee: {
    appId: '',
    secretKey: '',
    affiliateDomain: '',
    enabled: false,
  },
  mercadoLivre: {
    appId: '',
    clientSecret: '',
    redirectUri: '',
    enabled: false,
  },
  aliExpress: {
    appKey: '',
    secretKey: '',
    trackingId: '',
    enabled: false,
  },
  magalu: {
    affiliateCode: '',
    enabled: false,
  },
  tiktokShop: {
    partnerId: '',
    appSecret: '',
    enabled: false,
  },
  globalUtmSource: '',
  globalUtmMedium: '',
  globalUtmCampaign: '',
};

export const initialGatewaySettings: GatewaySettings = {
  provider: 'Evolution API',
  endpointUrl: '',
  globalApiKey: '',
  telegramBotToken: '',
  telegramBotUsername: '',
  webhookDeliveryUrl: '',
  requestTimeoutSeconds: 20,
};

export const initialAntiBanSettings: AntiBanSettings = {
  minIntervalMinutes: 15,
  randomJitterMinutes: 3,
  maxDailyMessagesPerChannel: 24,
  quietHoursEnabled: true,
  quietHoursStart: '22:30',
  quietHoursEnd: '07:30',
  simulateTypingSeconds: 4,
  pauseOnMultipleFails: true,
  maxConsecutiveFails: 3,
};

export const initialScoringWeightsSettings: ScoringWeightsSettings = {
  minScoreAutoApprove: 85,
  minDiscountPercentage: 25,
  weightDiscount: 35,
  weightRating: 15,
  weightSalesVelocity: 20,
  weightPriceHistory: 20,
  weightCommission: 10,
  rejectOutOfStock: true,
  requireFreeShippingMinPrice: 79,
};

export const initialCopywritingSettings: CopywritingSettings = {
  defaultCopyStyle: 'Padrão com Emojis',
  includePriceComparison: true,
  includeInstallments: true,
  includeRatingStars: true,
  includeCouponCallout: true,
  includeAffiliateDisclaimer: true,
  disclaimerText: '⚠️ Aviso: Como afiliado, podemos receber uma comissão por compras qualificadas sem nenhum custo extra para você.',
  urlShortener: 'Link Direto',
  shortenerApiKey: '',
};

export const initialSystemGeneralSettings: SystemGeneralSettings = {
  workspaceName: '',
  adminEmail: '',
  timezone: 'America/Sao_Paulo (UTC-03:00)',
  currency: 'BRL (R$)',
  autoCleanHistoryDays: 90,
  enableSoundAlerts: true,
  enableDesktopNotifications: true,
};