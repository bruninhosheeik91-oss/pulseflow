export type MonitorPlatform = 'WhatsApp' | 'Telegram' | 'Outra';

export type MonitorGroupStatus =
  | 'not_configured'
  | 'configured'
  | 'paused'
  | 'requires_integration';

export type MonitorDistributionTarget = 'all' | 'selected';

export type MonitorOrder = 'sequential' | 'random';

export interface MonitorGroupRules {
  target: MonitorDistributionTarget;
  selectedGroupIds: string[];
  intervalMinutes: number;
  order: MonitorOrder;
  respectBusinessHours: boolean;
  checkDuplicates: boolean;
  avoidRepeatedPublish: boolean;
  useCentralQueue: boolean;
}

export interface MonitorGroupProcessing {
  preserveText: boolean;
  preserveMedia: boolean;
  detectLink: boolean;
  prepareAffiliateLink: boolean;
  applyRules: boolean;
  sendToQueue: boolean;
}

export interface MonitorGroupConfig {
  id: string;
  name: string;
  platform: MonitorPlatform;
  identifier: string;
  status: MonitorGroupStatus;
  linkedGroupIds: string[];
  rules: MonitorGroupRules;
  processing: MonitorGroupProcessing;
  createdAt: string;
  automationSource: 'MONITOR_GROUP';
}

export const PROCESSING_STEPS: {
  key: keyof MonitorGroupProcessing;
  label: string;
}[] = [
  { key: 'preserveText', label: 'Preservar texto' },
  { key: 'preserveMedia', label: 'Preservar mídia' },
  { key: 'detectLink', label: 'Detectar link' },
  { key: 'prepareAffiliateLink', label: 'Preparar link de afiliado' },
  { key: 'applyRules', label: 'Aplicar regras' },
  { key: 'sendToQueue', label: 'Enviar para fila' },
];

export const DEFAULT_RULES: MonitorGroupRules = {
  target: 'all',
  selectedGroupIds: [],
  intervalMinutes: 10,
  order: 'sequential',
  respectBusinessHours: false,
  checkDuplicates: true,
  avoidRepeatedPublish: true,
  useCentralQueue: true,
};

export const DEFAULT_PROCESSING: MonitorGroupProcessing = {
  preserveText: true,
  preserveMedia: true,
  detectLink: true,
  prepareAffiliateLink: false,
  applyRules: false,
  sendToQueue: false,
};