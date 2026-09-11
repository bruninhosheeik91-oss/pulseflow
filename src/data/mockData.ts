import { ProductOffer, PerformanceDay, QueueItem, EngineStatusData } from '../types';

export const initialOffers: ProductOffer[] = [];

export const performanceData7Days: PerformanceDay[] = [];

export const performanceData14Days: PerformanceDay[] = [];

export const performanceData30Days: PerformanceDay[] = [];

export const initialQueue: QueueItem[] = [];

export const initialEngineStatus: EngineStatusData = {
  status: 'Pausado',
  lastSync: '—',
  productsScannedToday: 0,
  nextRunIn: '—',
  healthRate: 0,
  activeSources: 0,
};

export const notificationsMock = [];