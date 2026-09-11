import {
  AutoSearchMarketplaceSource,
  AutoSearchCriteria,
  AutoSearchScoreWeights,
  AutoSearchSchedule,
  AutoSearchDestination,
  AutoSearchDeduplication,
  AutoSearchResultItem,
  AutoSearchActivityLogEntry,
  AutoSearchLastSearch,
  AutoSearchEngineStatus,
} from '../types/autoSearch';

export const initialAutoSearchSources: AutoSearchMarketplaceSource[] = [];

export const initialAutoSearchCriteria: AutoSearchCriteria = {
  minDealScore: 85,
  minDiscount: 30,
  minRating: 4.5,
  minSales: 1000,
  minCommission: 3.0,
  minPrice: 10,
  maxPrice: 2000,
};

export const initialAutoSearchScoreWeights: AutoSearchScoreWeights = {
  discount: 25,
  rating: 20,
  sales: 15,
  commission: 20,
  price: 10,
  coupon: 10,
};

export const initialAutoSearchSchedule: AutoSearchSchedule = {
  frequency: '10m',
  timeStart: '08:00',
  timeEnd: '22:00',
  activeDays: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
};

export const initialAutoSearchDestination: AutoSearchDestination = {
  type: 'manual_review',
};

export const initialAutoSearchDeduplication: AutoSearchDeduplication = {
  productRepeatDays: 3,
  offerRepeatDays: 7,
  duplicatePolicy: 'keep_best_score',
};

export const initialAutoSearchResults: AutoSearchResultItem[] = [];

export const initialAutoSearchActivityLog: AutoSearchActivityLogEntry[] = [];

export const initialAutoSearchLastSearch: AutoSearchLastSearch = {
  time: '—',
  marketplacesConsulted: 0,
  productsAnalyzed: 0,
  offersFound: 0,
  qualified: 0,
  ignored: 0,
  duplicates: 0,
  sentToCampaign: 0,
};

export const initialAutoSearchEngineStatus: AutoSearchEngineStatus = {
  status: 'paused',
  lastExecution: '—',
  duration: '—',
  productsAnalyzed: 0,
  qualifiedOffers: 0,
  nextExecution: '—',
  frequencyLabel: '—',
  configuredSources: 0,
};