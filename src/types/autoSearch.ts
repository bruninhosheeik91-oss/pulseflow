import { Marketplace, AutomationType } from '../types';

export type MarketplaceSourceStatus = 'active' | 'paused' | 'not_configured' | 'unavailable';

export interface AutoSearchMarketplaceSource {
  id: string;
  marketplace: Marketplace;
  label: string;
  status: MarketplaceSourceStatus;
  autoSearch: boolean;
  categories: string[];
  priority: 'Alta' | 'Média' | 'Baixa';
  lastSync: string;
  integrationReady: boolean;
  mock: boolean;
}

export interface AutoSearchCriteria {
  minDealScore: number;
  minDiscount: number;
  minRating: number;
  minSales: number;
  minCommission: number;
  minPrice: number;
  maxPrice: number;
}

export interface AutoSearchScoreWeights {
  discount: number;
  rating: number;
  sales: number;
  commission: number;
  price: number;
  coupon: number;
}

export type AutoSearchFrequency = '5m' | '10m' | '15m' | '30m' | '60m';

export interface AutoSearchSchedule {
  frequency: AutoSearchFrequency;
  timeStart: string;
  timeEnd: string;
  activeDays: string[];
}

export type AutoSearchApprovalMode = 'manual' | 'automatic';

export type AutoSearchDestinationType = 'manual_review' | 'campaign' | 'queue';

export interface AutoSearchDestination {
  type: AutoSearchDestinationType;
  campaignId?: string;
  campaignName?: string;
}

export type AutoSearchDuplicatePolicy = 'keep_best_score' | 'keep_lowest_price' | 'keep_both';

export interface AutoSearchDeduplication {
  productRepeatDays: number;
  offerRepeatDays: number;
  duplicatePolicy: AutoSearchDuplicatePolicy;
}

export type AutoSearchResultStatus = 'qualified' | 'ignored' | 'duplicate';

export interface AutoSearchResultItem {
  id: string;
  productName: string;
  productImage: string;
  marketplace: Marketplace;
  automationSource: AutomationType;
  price: number;
  originalPrice: number;
  discountPercentage: number;
  commissionAmount: number;
  score: number;
  rating: number;
  salesVolume: string;
  status: AutoSearchResultStatus;
  rejectReason?: string;
  destination: string;
  campaignName?: string;
  foundAt: string;
}

export interface AutoSearchActivityLogEntry {
  id: string;
  time: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'marketplace';
}

export interface AutoSearchLastSearch {
  time: string;
  marketplacesConsulted: number;
  productsAnalyzed: number;
  offersFound: number;
  qualified: number;
  ignored: number;
  duplicates: number;
  sentToCampaign: number;
}

export interface AutoSearchEngineStatus {
  status: 'active' | 'paused';
  lastExecution: string;
  duration: string;
  productsAnalyzed: number;
  qualifiedOffers: number;
  nextExecution: string;
  frequencyLabel: string;
  configuredSources: number;
}

export const ALL_AUTO_SEARCH_CATEGORIES = [
  'Todas',
  'Eletrônicos',
  'Casa & Cozinha',
  'Moda',
  'Beleza',
  'Games',
  'Automotivo',
  'Infantil',
  'Ferramentas',
  'Informática',
  'Outros',
];

export const FREQUENCY_OPTIONS: { value: AutoSearchFrequency; label: string }[] = [
  { value: '5m', label: '5 minutos' },
  { value: '10m', label: '10 minutos' },
  { value: '15m', label: '15 minutos' },
  { value: '30m', label: '30 minutos' },
  { value: '60m', label: '1 hora' },
];

export const DAY_OPTIONS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

export const FREQUENCY_LABELS: Record<AutoSearchFrequency, string> = {
  '5m': '5 minutos',
  '10m': '10 minutos',
  '15m': '15 minutos',
  '30m': '30 minutos',
  '60m': '1 hora',
};
