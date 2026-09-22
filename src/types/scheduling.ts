// ----------------------------------------------------
// MÓDULO AGENDAMENTOS — Planejamento de publicações
// ----------------------------------------------------
//
// O agendamento apenas registra a INTENÇÃO de disparo. Nesta etapa ele NÃO
// dispara nada: o scheduler ficará no backend (Railway) e consumirá os mesmos
// campos abaixo. Os status seguem o ciclo de vida do backend:
//
//   scheduled  → criado, aguardando a data/hora
//   running    → em execução (disparador iniciou)
//   executed   → enviado com sucesso
//   failed     → tentativa de envio falhou
//   cancelled  → cancelado manualmente

export type ScheduleStatus =
  | 'scheduled'
  | 'running'
  | 'executed'
  | 'failed'
  | 'cancelled';

export interface ScheduleItem {
  id: string;
  /** Título livre definido pelo usuário. */
  title: string;
  /** Sessão real da conta WhatsApp (vazia se a conta foi removida). */
  accountSessionId: string | null;
  /** Snapshot do nome da conta no momento do agendamento. */
  accountName: string;
  /** Id real do grupo WhatsApp destino (vazio se o grupo foi removido). */
  groupId: string | null;
  /** Snapshot do nome do grupo no momento do agendamento. */
  groupName: string;
  /** Data no formato YYYY-MM-DD. */
  date: string;
  /** Hora no formato HH:MM (24h). */
  time: string;
  /** Conteúdo da mensagem que será (futuramente) disparada. */
  message: string;
  status: ScheduleStatus;
  /** ISO do momento da criação. */
  createdAt: string;
  /** ISO em que o disparo foi concluído (executed/failed). */
  executedAt: string | null;
  /** Mensagem de erro da última tentativa (failed). */
  errorMessage: string | null;
  /** Id retornado pelo WPPConnect no envio executado com sucesso. */
  sentMessageId: string | null;
  /** ISO do momento em que o executor fez o claim (scheduled -> running). */
  executionStartedAt: string | null;
  /**
   * true quando a entrega é INCERTA (timeout de envio ou restauração de
   * running após queda do processo): a mensagem pode ter sido enviada. Nunca
   * reenviar sem verificação manual (evita duplicidade).
   */
  deliveryUncertain: boolean;
}

export const SCHEDULE_STATUS_LABELS: Record<ScheduleStatus, string> = {
  scheduled: 'Agendado',
  running: 'Executando',
  executed: 'Executado',
  failed: 'Falhou',
  cancelled: 'Cancelado',
};

/** Lista dos status permitidos, na ordem visual dos cards/tabs. */
export const SCHEDULE_STATUS_ORDER: ScheduleStatus[] = [
  'scheduled',
  'running',
  'executed',
  'failed',
  'cancelled',
];

/** Combina date + time em data-hora local sortável (YYYY-MM-DDTHH:mm:ss). */
export function scheduleDateTime(date: string, time: string): string {
  return `${date}T${time}:00`;
}

/** Timestamp (ms) para ordenação; inválido vira 0 (aparece primeiro). */
export function scheduleTimestamp(item: ScheduleItem): number {
  const ms = new Date(scheduleDateTime(item.date, item.time)).getTime();
  return Number.isFinite(ms) ? ms : 0;
}

/** Formata YYYY-MM-DD para exibição pt-BR (21/09/2026). */
export function formatScheduleDate(date: string): string {
  const parsed = new Date(`${date}T00:00:00`);
  if (!Number.isFinite(parsed.getTime())) return date;
  return parsed.toLocaleDateString('pt-BR');
}