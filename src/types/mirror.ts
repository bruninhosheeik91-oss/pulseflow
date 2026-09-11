export type MirrorSourceType = 'Grupo' | 'Canal' | 'Outra fonte';

export type MirrorPlatform = 'WhatsApp' | 'Telegram' | 'Outra';

export type MirrorDestination = 'manual' | 'campaign' | 'queue';

export type MirrorStatus =
  | 'not_configured'
  | 'configured'
  | 'paused'
  | 'requires_integration';

export interface MirrorProcessingConfig {
  detectNewPublications: boolean;
  identifyProductLinks: boolean;
  prepareAffiliateLink: boolean;
  preserveOriginalText: boolean;
  preserveMedia: boolean;
  applyCampaignRules: boolean;
  checkDuplicates: boolean;
  sendToQueue: boolean;
}

export type MirrorTextHandling = 'preserve' | 'template' | 'review';
export type MirrorLinkHandling = 'preserve' | 'affiliate';
export type MirrorMediaHandling = 'preserve' | 'ignore';

export interface MirrorMessageHandling {
  text: MirrorTextHandling;
  link: MirrorLinkHandling;
  media: MirrorMediaHandling;
}

export interface MirrorDedupConfig {
  compareAutoSearch: boolean;
  compareLinkList: boolean;
  compareQueue: boolean;
  compareHistory: boolean;
}

export interface MirrorSource {
  id: string;
  name: string;
  type: MirrorSourceType;
  platform: MirrorPlatform;
  destination: MirrorDestination;
  campaignId: string | null;
  campaignName: string | null;
  status: MirrorStatus;
  processing: MirrorProcessingConfig;
  handling: MirrorMessageHandling;
  dedup: MirrorDedupConfig;
  createdAt: string;
  automationSource: 'MIRROR';
}

export const DESTINATION_LABELS: Record<MirrorDestination, string> = {
  manual: 'Análise manual',
  campaign: 'Campanha',
  queue: 'Fila de Publicação',
};

export const STATUS_LABELS: Record<MirrorStatus, string> = {
  not_configured: 'Não configurada',
  configured: 'Configurada',
  paused: 'Pausada',
  requires_integration: 'Requer integração',
};

export const PROCESSING_STEPS: {
  key: keyof MirrorProcessingConfig;
  label: string;
}[] = [
  { key: 'detectNewPublications', label: 'Detectar novas publicações' },
  { key: 'identifyProductLinks', label: 'Identificar links de produtos' },
  { key: 'prepareAffiliateLink', label: 'Preparar link de afiliado' },
  { key: 'preserveOriginalText', label: 'Preservar texto original' },
  { key: 'preserveMedia', label: 'Preservar imagem/mídia' },
  { key: 'applyCampaignRules', label: 'Aplicar regras de campanha' },
  { key: 'checkDuplicates', label: 'Verificar duplicidade' },
  { key: 'sendToQueue', label: 'Enviar para fila' },
];

export const DEDUP_OPTIONS: {
  key: keyof MirrorDedupConfig;
  label: string;
  description: string;
}[] = [
  {
    key: 'compareAutoSearch',
    label: 'Comparar com Busca Automática',
    description: 'Evita reprocessar ofertas já capturadas pela busca automática.',
  },
  {
    key: 'compareLinkList',
    label: 'Comparar com Lista de Links',
    description: 'Evita duplicar itens já organizados em listas.',
  },
  {
    key: 'compareQueue',
    label: 'Comparar com Fila de Publicação',
    description: 'Evita enviar o mesmo item mais de uma vez para a fila.',
  },
  {
    key: 'compareHistory',
    label: 'Comparar com Histórico',
    description: 'Consulta o histórico de publicações anteriores.',
  },
];

export const DEFAULT_PROCESSING: MirrorProcessingConfig = {
  detectNewPublications: true,
  identifyProductLinks: true,
  prepareAffiliateLink: false,
  preserveOriginalText: true,
  preserveMedia: true,
  applyCampaignRules: false,
  checkDuplicates: true,
  sendToQueue: false,
};

export const DEFAULT_HANDLING: MirrorMessageHandling = {
  text: 'preserve',
  link: 'preserve',
  media: 'preserve',
};

export const DEFAULT_DEDUP: MirrorDedupConfig = {
  compareAutoSearch: false,
  compareLinkList: false,
  compareQueue: true,
  compareHistory: false,
};