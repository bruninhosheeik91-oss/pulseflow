export type WhatsAppConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'awaiting_qr'
  | 'connected'
  | 'reconnecting'
  | 'error';

export const WHATSAPP_STATUS_LABELS: Record<WhatsAppConnectionStatus, string> = {
  disconnected: 'Desconectado',
  connecting: 'Conectando',
  awaiting_qr: 'Aguardando leitura do QR Code',
  connected: 'Conectado',
  reconnecting: 'Reconectando',
  error: 'Erro',
};

export interface WhatsAppAccount {
  number: string;
  name: string;
  connectionStatus: WhatsAppConnectionStatus;
  lastSyncAt: string | null;
}

export interface WhatsAppGroup {
  id: string;
  name: string | null;
  participantCount: number | null;
  isGroup: true;
}

export function formatGroupParticipantCount(group: WhatsAppGroup): string {
  if (group.participantCount === null || group.participantCount === undefined) {
    return 'participantes não informados';
  }
  return `${group.participantCount} ${group.participantCount === 1 ? 'participante' : 'participantes'}`;
}

export function getGroupDisplayName(group: WhatsAppGroup): string {
  if (group.name && group.name.trim()) return group.name;
  return 'Grupo sem nome';
}