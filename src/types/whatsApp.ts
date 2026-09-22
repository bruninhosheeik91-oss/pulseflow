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

export const DOMNEX_DEFAULT_SESSION_ID = 'domnex-main';

export interface WhatsAppAccount {
  id: string;
  sessionId: string;
  number: string;
  /** Nome visual definido pelo usuário (editável). O sessionId é técnico. */
  displayName: string;
  /** Alias de exibição mantido por compatibilidade com telas existentes. */
  name: string;
  status: WhatsAppConnectionStatus;
  connectionStatus: WhatsAppConnectionStatus;
  /**
   * Fila global de inicialização: true enquanto a sessão AGUARDA o slot único
   * (outra sessão em fase pesada de create() WPPConnect). Não é bloqueante:
   * assim que a atual gerar QR/conectar/falhar, esta é promovida.
   */
  queued: boolean;
  connectedAt: string | null;
  lastSyncAt: string | null;
}

/**
 * Contrato único de grupo WhatsApp.
 * memberCount é a quantidade REAL de membros; null = desconhecido (consulta
 * falhou/pendente). NUNCA usar 0 para representar falha — 0 só é válido quando
 * confirmado pelo WPP.
 */
export interface WhatsAppGroup {
  id: string;
  name: string | null;
  memberCount: number | null;
  isGroup: true;
  whatsappAccountId: string | null;
  sessionId: string | null;
}

/** Formata uma contagem como número (ou '—' quando desconhecida). */
export function formatMemberCount(count: number | null | undefined): string {
  if (typeof count !== 'number' || !Number.isFinite(count)) return '—';
  return count.toLocaleString('pt-BR');
}

/** Formata uma contagem no rótulo de grupo: '247 membros', '1 membro', '— membros'. */
export function formatMemberCountLabel(
  count: number | null | undefined
): string {
  if (typeof count !== 'number' || !Number.isFinite(count)) return '— membros';
  return `${count.toLocaleString('pt-BR')} ${
    count === 1 ? 'membro' : 'membros'
  }`;
}

export function formatGroupMemberCount(group: WhatsAppGroup): string {
  return formatMemberCountLabel(group.memberCount);
}

export interface GroupMemberStats {
  totalGroups: number;
  /** Soma apenas de memberCount numérico válido. */
  totalMembers: number;
  /** Grupos com contagem conhecida. */
  knownGroups: number;
  /** totalMembers / knownGroups; null quando nenhum grupo tem contagem. */
  averageMembers: number | null;
}

export function computeMemberStats(
  counts: Array<number | null | undefined>
): GroupMemberStats {
  let totalMembers = 0;
  let knownGroups = 0;
  for (const count of counts) {
    if (typeof count === 'number' && Number.isFinite(count)) {
      totalMembers += count;
      knownGroups += 1;
    }
  }
  return {
    totalGroups: counts.length,
    totalMembers,
    knownGroups,
    averageMembers:
      knownGroups > 0 ? Math.round(totalMembers / knownGroups) : null,
  };
}

export function computeGroupMemberStats(
  groups: WhatsAppGroup[]
): GroupMemberStats {
  return computeMemberStats(groups.map((group) => group.memberCount));
}

/**
 * Remove grupos duplicados pelo id. O mesmo grupo real pode aparecer em mais
 * de uma conta WhatsApp (sessões diferentes); para os indicadores gerais cada
 * grupo deve ser contado uma única vez. Quando a duplicata conhecida tem
 * memberCount numérico, ela é preservada em vez de uma entrada sem contagem.
 */
export function dedupeGroupsById(groups: WhatsAppGroup[]): WhatsAppGroup[] {
  const byId = new Map<string, WhatsAppGroup>();
  for (const group of groups) {
    if (!group || typeof group.id !== 'string' || !group.id) continue;
    const existing = byId.get(group.id);
    if (!existing) {
      byId.set(group.id, group);
      continue;
    }
    if (
      typeof existing.memberCount !== 'number' &&
      typeof group.memberCount === 'number'
    ) {
      byId.set(group.id, group);
    }
  }
  return Array.from(byId.values());
}

export function getGroupDisplayName(group: WhatsAppGroup): string {
  if (group.name && group.name.trim()) return group.name;
  return 'Grupo sem nome';
}
