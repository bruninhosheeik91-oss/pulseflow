import { Marketplace } from '../types';

// ----------------------------------------------------
// MÓDULO LISTA DE LINKS — Entrada manual de ofertas
// ----------------------------------------------------

export type LinkListLinkStatus =
  | 'Pendente'
  | 'Processando'
  | 'Válido'
  | 'Inválido'
  | 'Duplicado'
  | 'Na fila'
  | 'Publicado'
  | 'Ignorado';

export type LinkListDestination = 'manual' | 'campaign' | 'queue';

export type LinkListRotation = 'sequential' | 'deal_score' | 'discount' | 'random';

export interface LinkListItem {
  id: string;
  url: string;
  marketplace: Marketplace | null;
  productName: string | null;
  status: LinkListLinkStatus;
  campaignId: string | null;
  campaignName: string | null;
  addedAt: string;
  automationSource: 'LINK_LIST';
}

export interface LinkListFrequency {
  minIntervalMinutes: number;
  maxPerHour: number;
  maxPerDay: number;
  windowStart: string;
  windowEnd: string;
  activeDays: string[];
}

export interface LinkList {
  id: string;
  name: string;
  description: string;
  campaignId: string | null;
  campaignName: string | null;
  destination: LinkListDestination;
  rotation: LinkListRotation;
  frequency: LinkListFrequency;
  createdAt: string;
  links: LinkListItem[];
  automationSource: 'LINK_LIST';
}

export interface LinkListDeduplication {
  checkQueue: boolean;
  compareAutoSearch: boolean;
  compareOtherLists: boolean;
  compareRecentPublications: boolean;
}

export const LINK_LIST_DAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'] as const;

export const DESTINATION_LABELS: Record<LinkListDestination, string> = {
  manual: 'Análise manual',
  campaign: 'Campanha',
  queue: 'Fila de publicação',
};

export const ROTATION_LABELS: Record<LinkListRotation, string> = {
  sequential: 'Sequencial',
  deal_score: 'Maior Deal Score',
  discount: 'Maior desconto',
  random: 'Aleatória',
};